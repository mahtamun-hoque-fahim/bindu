import { getDb } from '@/lib/db'
import { messages } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { requireSessionApi } from '@/lib/auth/server'

export const runtime = 'edge'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

type PatchBody = {
  isRead?: boolean
  isFavorited?: boolean
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSessionApi()
  if (session instanceof Response) return session

  const { id } = await params
  if (!id) return json({ error: 'missing id' }, 400)

  let body: PatchBody
  try {
    body = (await req.json()) as PatchBody
  } catch {
    return json({ error: 'invalid json' }, 400)
  }

  const update: Partial<typeof messages.$inferInsert> = {}
  if (typeof body.isRead === 'boolean') update.isRead = body.isRead
  if (typeof body.isFavorited === 'boolean')
    update.isFavorited = body.isFavorited
  if (Object.keys(update).length === 0)
    return json({ error: 'nothing to update' }, 400)

  const db = getDb()
  if (!db) return json({ error: 'unavailable' }, 503)

  // Update only if the message belongs to the requester
  const result = await db
    .update(messages)
    .set(update)
    .where(
      and(eq(messages.id, id), eq(messages.recipientId, session.uid)),
    )
    .returning({ id: messages.id })

  if (result.length === 0) return json({ error: 'not found' }, 404)
  return json({ ok: true })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSessionApi()
  if (session instanceof Response) return session

  const { id } = await params
  if (!id) return json({ error: 'missing id' }, 400)

  const db = getDb()
  if (!db) return json({ error: 'unavailable' }, 503)

  const result = await db
    .update(messages)
    .set({ isDeleted: true, deletedBy: 'recipient' })
    .where(
      and(eq(messages.id, id), eq(messages.recipientId, session.uid)),
    )
    .returning({ id: messages.id })

  if (result.length === 0) return json({ error: 'not found' }, 404)
  return json({ ok: true })
}
