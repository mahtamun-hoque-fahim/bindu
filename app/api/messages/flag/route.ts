import { getDb } from '@/lib/db'
import { messages, flags } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { requireSessionApi } from '@/lib/auth/server'

export const runtime = 'edge'

const REASONS = new Set([
  'harassment',
  'doxxing',
  'self_harm',
  'spam',
  'inappropriate',
  'other',
])

const MAX_PLAINTEXT = 600 // 200-char cap + slack for old messages / encoding
const MAX_NOTE = 280

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

type Body = {
  messageId?: string
  reportedPlaintext?: string
  reason?: string
  note?: string | null
}

/**
 * Recipient flags a decrypted message. They voluntarily share the
 * plaintext they already have access to — the server gets the content
 * only because the recipient chose to.
 *
 * Idempotent-ish: if the same recipient flags the same message twice,
 * we just update the existing flag (refreshing reason / plaintext).
 */
export async function POST(req: Request) {
  const session = await requireSessionApi()
  if (session instanceof Response) return session

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return json({ error: 'invalid json' }, 400)
  }

  const { messageId, reportedPlaintext, reason, note } = body

  if (
    !messageId ||
    typeof messageId !== 'string' ||
    !reportedPlaintext ||
    typeof reportedPlaintext !== 'string' ||
    !reason ||
    typeof reason !== 'string'
  ) {
    return json({ error: 'missing fields' }, 400)
  }

  if (!REASONS.has(reason)) return json({ error: 'invalid reason' }, 400)
  if (reportedPlaintext.length > MAX_PLAINTEXT)
    return json({ error: 'reported plaintext too long' }, 400)
  if (note != null) {
    if (typeof note !== 'string')
      return json({ error: 'invalid note' }, 400)
    if (note.length > MAX_NOTE)
      return json({ error: `note too long (max ${MAX_NOTE})` }, 400)
  }

  const db = getDb()
  if (!db) return json({ error: 'unavailable' }, 503)

  // Verify recipient owns the message
  const msg = await db.query.messages.findFirst({
    where: and(
      eq(messages.id, messageId),
      eq(messages.recipientId, session.uid),
    ),
    columns: { id: true, isFlagged: true },
  })
  if (!msg) return json({ error: 'not found' }, 404)

  // Insert + mark isFlagged. If a flag from this user for this message
  // already exists, drop the new insert silently (idempotent UX).
  // Drizzle doesn't have onConflict for arbitrary unique combos here
  // (no unique constraint on reporter+message), so we check first.
  const existing = await db.query.flags.findFirst({
    where: and(
      eq(flags.messageId, messageId),
      eq(flags.reporterId, session.uid),
    ),
    columns: { id: true },
  })

  if (existing) {
    // Update reason / plaintext / note in case the user is correcting it
    await db
      .update(flags)
      .set({
        reportedPlaintext,
        reason: reason as
          | 'harassment'
          | 'doxxing'
          | 'self_harm'
          | 'spam'
          | 'inappropriate'
          | 'other',
        note: note ?? null,
      })
      .where(eq(flags.id, existing.id))
  } else {
    await db.insert(flags).values({
      messageId,
      reporterId: session.uid,
      reportedPlaintext,
      reason: reason as
        | 'harassment'
        | 'doxxing'
        | 'self_harm'
        | 'spam'
        | 'inappropriate'
        | 'other',
      note: note ?? null,
    })
  }

  // Mark the message as flagged so the recipient's inbox shows ⚠
  if (!msg.isFlagged) {
    await db
      .update(messages)
      .set({ isFlagged: true })
      .where(eq(messages.id, messageId))
  }

  return json({ ok: true })
}
