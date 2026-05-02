import { NextRequest, NextResponse } from 'next/server'
import { eq, desc, count, ilike } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { messages, users, flags } from '@/lib/db/schema'
import { assertAdmin } from '@/lib/admin-auth'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const auth = await assertAdmin()
  if (auth instanceof Response) return auth

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = 25
  const offset = (page - 1) * limit
  const flagged = searchParams.get('flagged') === 'true'

  const db = getDb()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  const rows = await db
    .select({
      id: messages.id,
      content: messages.content,
      isRead: messages.isRead,
      isDeleted: messages.isDeleted,
      deletedBy: messages.deletedBy,
      createdAt: messages.createdAt,
      recipientUsername: users.username,
      recipientDisplayName: users.displayName,
      flagCount: count(flags.id),
    })
    .from(messages)
    .leftJoin(users, eq(messages.recipientId, users.id))
    .leftJoin(flags, eq(flags.messageId, messages.id))
    .groupBy(messages.id, users.username, users.displayName)
    .orderBy(desc(messages.createdAt))
    .limit(limit)
    .offset(offset)

  const [{ total }] = await db.select({ total: count() }).from(messages)

  return NextResponse.json({ messages: rows, total, page, limit })
}
