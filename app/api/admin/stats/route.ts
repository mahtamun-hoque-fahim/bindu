import { getDb } from '@/lib/db'
import {
  users,
  messages,
  flags,
  bannedIps,
  mutedHashes,
  reactions,
} from '@/lib/db/schema'
import { sql, gte, eq } from 'drizzle-orm'
import { requireAdminApi } from '@/lib/auth/server'

export const runtime = 'edge'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

/**
 * Platform stats for the admin overview card row.
 * One round trip to the DB via Promise.all of small aggregate queries.
 */
export async function GET() {
  const session = await requireAdminApi()
  if (session instanceof Response) return session

  const db = getDb()
  if (!db) return json({ error: 'unavailable' }, 503)

  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    userCount,
    userCount24h,
    userCount7d,
    bannedUserCount,
    staffCount,
    adminCount,
    plusCount,
    messageCount,
    messageCount24h,
    messageCount7d,
    flagsPending,
    flagsResolved,
    flagsTotal,
    reactionCount,
    bannedIpCount,
    muteCount,
  ] = await Promise.all([
    db.select({ c: sql<number>`count(*)::int` }).from(users),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(users)
      .where(gte(users.createdAt, oneDayAgo)),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(users)
      .where(gte(users.createdAt, sevenDaysAgo)),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.isBanned, true)),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.isStaff, true)),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.isAdmin, true)),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.plan, 'plus')),
    db.select({ c: sql<number>`count(*)::int` }).from(messages),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(messages)
      .where(gte(messages.createdAt, oneDayAgo)),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(messages)
      .where(gte(messages.createdAt, sevenDaysAgo)),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(flags)
      .where(sql`${flags.status} IN ('pending', 'escalated')`),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(flags)
      .where(sql`${flags.status} IN ('resolved', 'dismissed')`),
    db.select({ c: sql<number>`count(*)::int` }).from(flags),
    db.select({ c: sql<number>`count(*)::int` }).from(reactions),
    db.select({ c: sql<number>`count(*)::int` }).from(bannedIps),
    db.select({ c: sql<number>`count(*)::int` }).from(mutedHashes),
  ])

  const pick = (r: Array<{ c: number }>) => r[0]?.c ?? 0

  return json({
    users: {
      total: pick(userCount),
      new24h: pick(userCount24h),
      new7d: pick(userCount7d),
      banned: pick(bannedUserCount),
      staff: pick(staffCount),
      admin: pick(adminCount),
      plus: pick(plusCount),
    },
    messages: {
      total: pick(messageCount),
      sent24h: pick(messageCount24h),
      sent7d: pick(messageCount7d),
    },
    flags: {
      total: pick(flagsTotal),
      pending: pick(flagsPending),
      resolved: pick(flagsResolved),
    },
    moderation: {
      bannedIps: pick(bannedIpCount),
      mutes: pick(muteCount),
    },
    reactions: pick(reactionCount),
  })
}
