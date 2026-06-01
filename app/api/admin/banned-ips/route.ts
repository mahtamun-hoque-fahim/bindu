import { getDb } from '@/lib/db'
import { bannedIps, auditLog } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { requireAdminApi } from '@/lib/auth/server'

export const runtime = 'edge'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

// Loose IP shape — accepts IPv4 dotted quad OR IPv6 colon-hex. CF / proxy
// hops sometimes pass IPv4-mapped IPv6 ("::ffff:1.2.3.4") through, so we
// accept that too.
const IP_RX = /^(?:(?:\d{1,3}\.){3}\d{1,3}|(?:[0-9a-fA-F:]+))$/

const MAX_IP = 64
const MAX_REASON = 200

type PostBody = { ip?: string; reason?: string | null }

export async function GET() {
  const session = await requireAdminApi()
  if (session instanceof Response) return session

  const db = getDb()
  if (!db) return json({ error: 'unavailable' }, 503)

  const rows = await db.query.bannedIps.findMany({
    orderBy: [desc(bannedIps.createdAt)],
    columns: {
      id: true,
      ip: true,
      reason: true,
      bannedBy: true,
      createdAt: true,
    },
    limit: 200,
  })

  return json({ bannedIps: rows })
}

export async function POST(req: Request) {
  const session = await requireAdminApi()
  if (session instanceof Response) return session

  let body: PostBody
  try {
    body = (await req.json()) as PostBody
  } catch {
    return json({ error: 'invalid json' }, 400)
  }

  const ip = (body.ip ?? '').trim()
  if (!ip) return json({ error: 'ip required' }, 400)
  if (ip.length > MAX_IP) return json({ error: 'ip too long' }, 400)
  if (!IP_RX.test(ip)) return json({ error: 'invalid ip format' }, 400)

  let reason: string | null = null
  if (body.reason !== undefined && body.reason !== null) {
    if (typeof body.reason !== 'string')
      return json({ error: 'invalid reason' }, 400)
    if (body.reason.length > MAX_REASON)
      return json({ error: `reason too long (max ${MAX_REASON})` }, 400)
    reason = body.reason.trim() || null
  }

  const db = getDb()
  if (!db) return json({ error: 'unavailable' }, 503)

  // Idempotent: ip is unique, conflict means already banned
  const existing = await db.query.bannedIps.findFirst({
    where: eq(bannedIps.ip, ip),
    columns: { id: true },
  })
  if (existing) return json({ ok: true, id: existing.id, alreadyBanned: true })

  const [inserted] = await db
    .insert(bannedIps)
    .values({ ip, reason, bannedBy: session.uid })
    .returning({ id: bannedIps.id })

  await db.insert(auditLog).values({
    actorId: session.uid,
    action: 'ip.ban',
    targetType: 'ip',
    targetId: inserted.id,
    metadata: { ip, reason },
  })

  return json({ ok: true, id: inserted.id }, 201)
}
