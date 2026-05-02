import { NextRequest, NextResponse } from 'next/server'
import { eq, count, desc, ilike, or, sql } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { users, messages } from '@/lib/db/schema'
import { assertAdmin } from '@/lib/admin-auth'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const auth = await assertAdmin()
  if (auth instanceof Response) return auth

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = 20
  const offset = (page - 1) * limit
  const search = searchParams.get('search') || ''

  const db = getDb()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  const baseQuery = db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      email: users.email,
      isBanned: users.isBanned,
      role: users.role,
      createdAt: users.createdAt,
      messageCount: count(messages.id),
    })
    .from(users)
    .leftJoin(messages, eq(messages.recipientId, users.id))
    .groupBy(users.id)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset)

  const rows = search
    ? await db
        .select({
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          email: users.email,
          isBanned: users.isBanned,
          role: users.role,
          createdAt: users.createdAt,
          messageCount: count(messages.id),
        })
        .from(users)
        .leftJoin(messages, eq(messages.recipientId, users.id))
        .where(
          or(
            ilike(users.username, `%${search}%`),
            ilike(users.displayName, `%${search}%`),
            ilike(users.email, `%${search}%`)
          )
        )
        .groupBy(users.id)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset)
    : await baseQuery

  const [{ total }] = await db.select({ total: count() }).from(users)

  return NextResponse.json({ users: rows, total, page, limit })
}
