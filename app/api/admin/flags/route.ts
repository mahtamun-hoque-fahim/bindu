import { NextRequest, NextResponse } from 'next/server'
import { eq, count, desc } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { flags, messages, users } from '@/lib/db/schema'
import { assertAdmin } from '@/lib/admin-auth'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const auth = await assertAdmin()
  if (auth instanceof Response) return auth

  const { searchParams } = new URL(req.url)
  const status = (searchParams.get('status') || 'pending') as 'pending' | 'resolved' | 'dismissed'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = 20
  const offset = (page - 1) * limit

  const db = getDb()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  const rows = await db
    .select({
      id: flags.id,
      flaggedBy: flags.flaggedBy,
      reason: flags.reason,
      note: flags.note,
      status: flags.status,
      resolvedAt: flags.resolvedAt,
      createdAt: flags.createdAt,
      messageId: messages.id,
      messageContent: messages.content,
      messageCreatedAt: messages.createdAt,
      messageIsDeleted: messages.isDeleted,
      recipientUsername: users.username,
      recipientDisplayName: users.displayName,
    })
    .from(flags)
    .leftJoin(messages, eq(flags.messageId, messages.id))
    .leftJoin(users, eq(messages.recipientId, users.id))
    .where(eq(flags.status, status))
    .orderBy(desc(flags.createdAt))
    .limit(limit)
    .offset(offset)

  const [{ total }] = await db
    .select({ total: count() })
    .from(flags)
    .where(eq(flags.status, status))

  return NextResponse.json({ flags: rows, total, page, limit })
}
