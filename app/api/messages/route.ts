import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { users, messages, bannedIps } from '@/lib/db/schema'
import { getRatelimit } from '@/lib/rate-limit'
import { sendNewMessageNotification } from '@/lib/resend'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { recipientUsername, content } = await req.json()

    if (!recipientUsername || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const trimmed = content.trim()
    if (trimmed.length === 0) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 })
    }
    if (trimmed.length > 500) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 })
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'anonymous'

    const db = getDb()
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    // ── IP ban check ──────────────────────────────────────────────────────────
    if (ip !== 'anonymous') {
      const [banned] = await db
        .select({ id: bannedIps.id })
        .from(bannedIps)
        .where(eq(bannedIps.ip, ip))
        .limit(1)

      if (banned) {
        return NextResponse.json(
          { error: 'You are not allowed to send messages.' },
          { status: 403 }
        )
      }
    }

    // ── Rate limiting ─────────────────────────────────────────────────────────
    const ratelimit = getRatelimit()
    if (ratelimit) {
      const { success, limit, remaining, reset } = await ratelimit.limit(ip)
      if (!success) {
        return NextResponse.json(
          { error: 'Too many messages. Please wait a few minutes.' },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': String(limit),
              'X-RateLimit-Remaining': String(remaining),
              'X-RateLimit-Reset': String(reset),
            },
          }
        )
      }
    }

    // ── Look up recipient ─────────────────────────────────────────────────────
    const [recipient] = await db
      .select()
      .from(users)
      .where(eq(users.username, recipientUsername))
      .limit(1)

    if (!recipient) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (recipient.isBanned) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // ── Insert message — no sender info stored ────────────────────────────────
    const [inserted] = await db
      .insert(messages)
      .values({ recipientId: recipient.id, content: trimmed, isRead: false })
      .returning({ id: messages.id })

    // ── Optional email notification ───────────────────────────────────────────
    if (recipient.emailNotifications && recipient.email) {
      sendNewMessageNotification({
        toEmail: recipient.email,
        toName: recipient.displayName || recipient.username || 'there',
        username: recipient.username || recipientUsername,
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true, messageId: inserted?.id ?? null })
  } catch (err) {
    console.error('[POST /api/messages]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
