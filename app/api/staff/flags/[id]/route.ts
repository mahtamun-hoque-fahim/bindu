import { getDb } from '@/lib/db'
import { flags, messages, auditLog } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireStaffApi } from '@/lib/auth/server'

export const runtime = 'edge'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

const VALID_STATUSES = new Set(['resolved', 'dismissed', 'escalated', 'pending'])

type Body = {
  status?: string
  resolverNote?: string | null
  deleteMessage?: boolean
}

const MAX_NOTE = 280

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireStaffApi()
  if (session instanceof Response) return session

  const { id } = await params
  if (!id) return json({ error: 'missing id' }, 400)

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return json({ error: 'invalid json' }, 400)
  }

  const { status, resolverNote, deleteMessage } = body

  if (!status || !VALID_STATUSES.has(status))
    return json({ error: 'invalid status' }, 400)

  if (resolverNote != null) {
    if (typeof resolverNote !== 'string')
      return json({ error: 'invalid resolver note' }, 400)
    if (resolverNote.length > MAX_NOTE)
      return json({ error: `note too long (max ${MAX_NOTE})` }, 400)
  }

  const db = getDb()
  if (!db) return json({ error: 'unavailable' }, 503)

  // Load flag to grab the messageId for audit + optional delete
  const flag = await db.query.flags.findFirst({
    where: eq(flags.id, id),
    columns: { id: true, messageId: true, reason: true, status: true },
  })
  if (!flag) return json({ error: 'not found' }, 404)

  const now = new Date()
  const goingToResolved =
    status === 'resolved' || status === 'dismissed'

  // 1. Update the flag
  await db
    .update(flags)
    .set({
      status: status as
        | 'pending'
        | 'escalated'
        | 'resolved'
        | 'dismissed',
      resolverNote: resolverNote ?? null,
      resolvedBy: goingToResolved ? session.uid : null,
      resolvedAt: goingToResolved ? now : null,
    })
    .where(eq(flags.id, id))

  // 2. Optional soft-delete the underlying message
  if (deleteMessage) {
    await db
      .update(messages)
      .set({ isDeleted: true, deletedBy: 'staff' })
      .where(eq(messages.id, flag.messageId))
  }

  // 3. Audit
  await db.insert(auditLog).values({
    actorId: session.uid,
    action: deleteMessage ? 'flag.resolve_with_delete' : `flag.${status}`,
    targetType: 'flag',
    targetId: id,
    metadata: {
      reason: flag.reason,
      previousStatus: flag.status,
      newStatus: status,
      messageId: flag.messageId,
      deleteMessage: !!deleteMessage,
    },
  })

  return json({ ok: true })
}
