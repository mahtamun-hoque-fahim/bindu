import { getDb } from '@/lib/db'
import { flags, messages } from '@/lib/db/schema'
import { and, asc, desc, eq, lt, sql } from 'drizzle-orm'
import { requireStaffApi } from '@/lib/auth/server'

export const runtime = 'edge'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

const STATUSES = new Set([
  'pending',
  'escalated',
  'resolved',
  'dismissed',
])

const REASONS = new Set([
  'harassment',
  'doxxing',
  'self_harm',
  'spam',
  'inappropriate',
  'other',
])

/**
 * Triage queue. Default: open flags (pending + escalated) sorted by
 * severity (self_harm > doxxing > harassment > inappropriate > spam > other)
 * then by recency.
 */
export async function GET(req: Request) {
  const session = await requireStaffApi()
  if (session instanceof Response) return session

  const url = new URL(req.url)
  const statusParam = url.searchParams.get('status')
  const reasonParam = url.searchParams.get('reason')
  const limit = Math.min(
    50,
    Math.max(1, Number(url.searchParams.get('limit') ?? '25')),
  )
  const before = url.searchParams.get('before')

  const db = getDb()
  if (!db) return json({ error: 'unavailable' }, 503)

  // Build where clause
  const conditions = []
  if (statusParam) {
    if (!STATUSES.has(statusParam)) return json({ error: 'invalid status' }, 400)
    conditions.push(
      eq(
        flags.status,
        statusParam as 'pending' | 'escalated' | 'resolved' | 'dismissed',
      ),
    )
  } else {
    // Default to open queue (pending + escalated)
    conditions.push(
      sql`${flags.status} IN ('pending', 'escalated')`,
    )
  }
  if (reasonParam) {
    if (!REASONS.has(reasonParam)) return json({ error: 'invalid reason' }, 400)
    conditions.push(
      eq(
        flags.reason,
        reasonParam as
          | 'harassment'
          | 'doxxing'
          | 'self_harm'
          | 'spam'
          | 'inappropriate'
          | 'other',
      ),
    )
  }
  if (before) {
    conditions.push(lt(flags.createdAt, new Date(before)))
  }

  // Severity is encoded as an ORDER BY CASE expression
  const severityRank = sql<number>`
    CASE ${flags.reason}
      WHEN 'self_harm' THEN 1
      WHEN 'doxxing' THEN 2
      WHEN 'harassment' THEN 3
      WHEN 'inappropriate' THEN 4
      WHEN 'spam' THEN 5
      ELSE 6
    END
  `

  const rows = await db
    .select({
      id: flags.id,
      messageId: flags.messageId,
      reporterId: flags.reporterId,
      reportedPlaintext: flags.reportedPlaintext,
      reason: flags.reason,
      note: flags.note,
      status: flags.status,
      resolvedBy: flags.resolvedBy,
      resolvedAt: flags.resolvedAt,
      resolverNote: flags.resolverNote,
      createdAt: flags.createdAt,
      senderHash: messages.senderHash,
      messageCreatedAt: messages.createdAt,
      messageIsDeleted: messages.isDeleted,
    })
    .from(flags)
    .innerJoin(messages, eq(flags.messageId, messages.id))
    .where(and(...conditions))
    .orderBy(asc(severityRank), desc(flags.createdAt))
    .limit(limit)

  // Quick stats for the staff sidebar
  const counts = await db
    .select({
      status: flags.status,
      count: sql<number>`count(*)::int`,
    })
    .from(flags)
    .groupBy(flags.status)

  return json({
    flags: rows,
    counts,
    hasMore: rows.length === limit,
  })
}
