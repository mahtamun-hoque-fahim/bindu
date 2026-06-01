import { getDb } from '@/lib/db'
import { mutedHashes } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { requireSessionApi } from '@/lib/auth/server'

export const runtime = 'edge'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

type Body = { senderHash?: string }

export async function GET() {
  const session = await requireSessionApi()
  if (session instanceof Response) return session

  const db = getDb()
  if (!db) return json({ error: 'unavailable' }, 503)

  const rows = await db.query.mutedHashes.findMany({
    where: eq(mutedHashes.userId, session.uid),
    orderBy: [desc(mutedHashes.createdAt)],
    columns: { senderHash: true, createdAt: true },
  })
  return json({ mutes: rows })
}

export async function POST(req: Request) {
  const session = await requireSessionApi()
  if (session instanceof Response) return session

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return json({ error: 'invalid json' }, 400)
  }
  if (!body.senderHash || !/^[a-f0-9]{4}$/.test(body.senderHash))
    return json({ error: 'invalid sender hash' }, 400)

  const db = getDb()
  if (!db) return json({ error: 'unavailable' }, 503)

  try {
    await db.insert(mutedHashes).values({
      userId: session.uid,
      senderHash: body.senderHash,
    })
  } catch {
    // composite PK collision — already muted; idempotent success
  }
  return json({ ok: true })
}

export async function DELETE(req: Request) {
  const session = await requireSessionApi()
  if (session instanceof Response) return session

  const url = new URL(req.url)
  const hash = url.searchParams.get('hash')
  if (!hash || !/^[a-f0-9]{4}$/.test(hash))
    return json({ error: 'invalid sender hash' }, 400)

  const db = getDb()
  if (!db) return json({ error: 'unavailable' }, 503)

  await db
    .delete(mutedHashes)
    .where(
      and(
        eq(mutedHashes.userId, session.uid),
        eq(mutedHashes.senderHash, hash),
      ),
    )

  return json({ ok: true })
}
