import { NextResponse } from 'next/server'
import { eq, count, and, gte, sql } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { users, messages, flags, bannedIps } from '@/lib/db/schema'
import { assertAdmin } from '@/lib/admin-auth'

export const runtime = 'edge'

export async function GET() {
  const auth = await assertAdmin()
  if (auth instanceof Response) return auth

  const db = getDb()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    [{ totalUsers }],
    [{ newUsersToday }],
    [{ totalMessages }],
    [{ messagesToday }],
    [{ pendingFlags }],
    [{ totalBannedIps }],
    [{ bannedUsers }],
  ] = await Promise.all([
    db.select({ totalUsers: count() }).from(users),
    db.select({ newUsersToday: count() }).from(users).where(gte(users.createdAt, today)),
    db.select({ totalMessages: count() }).from(messages).where(eq(messages.isDeleted, false)),
    db.select({ messagesToday: count() }).from(messages).where(
      and(eq(messages.isDeleted, false), gte(messages.createdAt, today))
    ),
    db.select({ pendingFlags: count() }).from(flags).where(eq(flags.status, 'pending')),
    db.select({ totalBannedIps: count() }).from(bannedIps),
    db.select({ bannedUsers: count() }).from(users).where(eq(users.isBanned, true)),
  ])

  return NextResponse.json({
    totalUsers,
    newUsersToday,
    totalMessages,
    messagesToday,
    pendingFlags,
    totalBannedIps,
    bannedUsers,
  })
}
