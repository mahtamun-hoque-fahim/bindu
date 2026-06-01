import { getDb } from '@/lib/db'
import { bannedIps, auditLog } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAdminApi } from '@/lib/auth/server'

export const runtime = 'edge'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApi()
  if (session instanceof Response) return session

  const { id } = await params
  if (!id) return json({ error: 'missing id' }, 400)

  const db = getDb()
  if (!db) return json({ error: 'unavailable' }, 503)

  const row = await db.query.bannedIps.findFirst({
    where: eq(bannedIps.id, id),
    columns: { id: true, ip: true },
  })
  if (!row) return json({ error: 'not found' }, 404)

  await db.delete(bannedIps).where(eq(bannedIps.id, id))

  await db.insert(auditLog).values({
    actorId: session.uid,
    action: 'ip.unban',
    targetType: 'ip',
    targetId: id,
    metadata: { ip: row.ip },
  })

  return json({ ok: true })
}
