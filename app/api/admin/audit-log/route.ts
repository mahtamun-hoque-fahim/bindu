import { getDb } from '@/lib/db'
import { auditLog, users } from '@/lib/db/schema'
import { desc, lt, and, eq } from 'drizzle-orm'
import { requireAdminApi } from '@/lib/auth/server'

export const runtime = 'edge'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

export async function GET(req: Request) {
  const session = await requireAdminApi()
  if (session instanceof Response) return session

  const url = new URL(req.url)
  const limit = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get('limit') ?? '50')),
  )
  const before = url.searchParams.get('before')
  const actionFilter = url.searchParams.get('action')

  const conditions = []
  if (before) conditions.push(lt(auditLog.createdAt, new Date(before)))
  if (actionFilter) conditions.push(eq(auditLog.action, actionFilter))

  const db = getDb()
  if (!db) return json({ error: 'unavailable' }, 503)

  const rows = await db
    .select({
      id: auditLog.id,
      actorId: auditLog.actorId,
      actorUsername: users.username,
      action: auditLog.action,
      targetType: auditLog.targetType,
      targetId: auditLog.targetId,
      metadata: auditLog.metadata,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .leftJoin(users, eq(auditLog.actorId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(auditLog.createdAt))
    .limit(limit)

  return json({ entries: rows, hasMore: rows.length === limit })
}
