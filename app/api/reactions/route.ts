import { getDb } from '@/lib/db'
import { reactions, messages } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { requireSessionApi } from '@/lib/auth/server'

export const runtime = 'edge'

// Allowed mood emojis — same set as the sender's mood picker
const REACTIONS = new Set(['🫶', '🔥', '👀', '😭', '💀', '✨', '🤝', '🥲'])

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

type Body = { messageId?: string; emoji?: string }

export async function POST(req: Request) {
  const session = await requireSessionApi()
  if (session instanceof Response) return session

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return json({ error: 'invalid json' }, 400)
  }
  if (!body.messageId || !body.emoji)
    return json({ error: 'missing fields' }, 400)
  if (!REACTIONS.has(body.emoji))
    return json({ error: 'invalid emoji' }, 400)

  const db = getDb()
  if (!db) return json({ error: 'unavailable' }, 503)

  // Verify ownership
  const msg = await db.query.messages.findFirst({
    where: and(
      eq(messages.id, body.messageId),
      eq(messages.recipientId, session.uid),
    ),
    columns: { id: true },
  })
  if (!msg) return json({ error: 'not found' }, 404)

  // Upsert by (messageId, emoji). With the unique index this either
  // succeeds or is a no-op; we don't want to return 409 — the client
  // simply sees idempotent success.
  try {
    await db.insert(reactions).values({
      messageId: body.messageId,
      emoji: body.emoji,
    })
  } catch {
    // Likely the unique index — that's fine.
  }
  return json({ ok: true })
}

export async function DELETE(req: Request) {
  const session = await requireSessionApi()
  if (session instanceof Response) return session

  const url = new URL(req.url)
  const messageId = url.searchParams.get('messageId')
  const emoji = url.searchParams.get('emoji')
  if (!messageId || !emoji)
    return json({ error: 'missing fields' }, 400)

  const db = getDb()
  if (!db) return json({ error: 'unavailable' }, 503)

  // Confirm ownership before deleting the reaction
  const msg = await db.query.messages.findFirst({
    where: and(
      eq(messages.id, messageId),
      eq(messages.recipientId, session.uid),
    ),
    columns: { id: true },
  })
  if (!msg) return json({ error: 'not found' }, 404)

  await db
    .delete(reactions)
    .where(
      and(eq(reactions.messageId, messageId), eq(reactions.emoji, emoji)),
    )

  return json({ ok: true })
}
