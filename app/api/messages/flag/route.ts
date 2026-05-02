import { NextRequest, NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { messages, flags } from '@/lib/db/schema'
import { auth } from '@clerk/nextjs/server'
import { getRatelimit } from '@/lib/rate-limit'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messageId, flaggedBy, reason, note } = body

    // Validate
    if (!messageId || !flaggedBy || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!['sender', 'recipient'].includes(flaggedBy)) {
      return NextResponse.json({ error: 'Invalid flaggedBy' }, { status: 400 })
    }
    if (!['harassment', 'spam', 'inappropriate', 'other'].includes(reason)) {
      return NextResponse.json({ error: 'Invalid reason' }, { status: 400 })
    }

    const db = getDb()
    if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

    // If recipient flagging — must be authenticated and own the message
    if (flaggedBy === 'recipient') {
      const { userId } = await auth()
      if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const [msg] = await db
        .select()
        .from(messages)
        .where(and(eq(messages.id, messageId), eq(messages.recipientId, userId)))
        .limit(1)

      if (!msg) return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    } else {
      // Sender flagging — rate limit by IP, message must exist
      const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        'anonymous'

      const [msg] = await db
        .select()
        .from(messages)
        .where(eq(messages.id, messageId))
        .limit(1)

      if (!msg) return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Insert flag (ignore duplicate)
    await db
      .insert(flags)
      .values({
        messageId,
        flaggedBy,
        reason,
        note: note || null,
        status: 'pending',
      })
      .onConflictDoNothing()

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/messages/flag]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
