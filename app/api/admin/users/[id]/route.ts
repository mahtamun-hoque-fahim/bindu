import { getDb } from '@/lib/db'
import { users, auditLog } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAdminApi } from '@/lib/auth/server'

export const runtime = 'edge'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

type PatchBody = {
  isStaff?: boolean
  isAdmin?: boolean
  isBanned?: boolean
  bannedReason?: string | null
}

const MAX_REASON = 200

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApi()
  if (session instanceof Response) return session

  const { id } = await params
  if (!id) return json({ error: 'missing id' }, 400)

  let body: PatchBody
  try {
    body = (await req.json()) as PatchBody
  } catch {
    return json({ error: 'invalid json' }, 400)
  }

  const update: Partial<typeof users.$inferInsert> = {}
  const changes: Record<string, unknown> = {}

  if (typeof body.isStaff === 'boolean') {
    update.isStaff = body.isStaff
    changes.isStaff = body.isStaff
  }
  if (typeof body.isAdmin === 'boolean') {
    update.isAdmin = body.isAdmin
    changes.isAdmin = body.isAdmin
  }
  if (typeof body.isBanned === 'boolean') {
    update.isBanned = body.isBanned
    update.bannedAt = body.isBanned ? new Date() : null
    changes.isBanned = body.isBanned
  }
  if (body.bannedReason !== undefined) {
    if (body.bannedReason === null) {
      update.bannedReason = null
      changes.bannedReason = null
    } else {
      if (typeof body.bannedReason !== 'string')
        return json({ error: 'invalid bannedReason' }, 400)
      if (body.bannedReason.length > MAX_REASON)
        return json({ error: `bannedReason too long (max ${MAX_REASON})` }, 400)
      update.bannedReason = body.bannedReason.trim()
      changes.bannedReason = update.bannedReason
    }
  }

  if (Object.keys(update).length === 0)
    return json({ error: 'nothing to update' }, 400)

  const db = getDb()
  if (!db) return json({ error: 'unavailable' }, 503)

  // Read before to capture previous state for audit log
  const before = await db.query.users.findFirst({
    where: eq(users.id, id),
    columns: {
      id: true,
      username: true,
      isStaff: true,
      isAdmin: true,
      isBanned: true,
      bannedReason: true,
    },
  })
  if (!before) return json({ error: 'not found' }, 404)

  const result = await db
    .update(users)
    .set(update)
    .where(eq(users.id, id))
    .returning({ id: users.id })

  if (result.length === 0) return json({ error: 'not found' }, 404)

  await db.insert(auditLog).values({
    actorId: session.uid,
    action: 'user.patch',
    targetType: 'user',
    targetId: id,
    metadata: {
      targetUsername: before.username,
      before: {
        isStaff: before.isStaff,
        isAdmin: before.isAdmin,
        isBanned: before.isBanned,
        bannedReason: before.bannedReason,
      },
      changes,
    },
  })

  return json({ ok: true })
}

/**
 * Hard delete a user. Cascades through FKs to messages, reactions,
 * mutes, flags. Admins cannot hard-delete themselves through this route
 * (use the danger zone in /settings).
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApi()
  if (session instanceof Response) return session

  const { id } = await params
  if (!id) return json({ error: 'missing id' }, 400)

  if (id === session.uid)
    return json(
      {
        error: 'Use /settings danger zone to delete your own account.',
      },
      400,
    )

  const db = getDb()
  if (!db) return json({ error: 'unavailable' }, 503)

  const before = await db.query.users.findFirst({
    where: eq(users.id, id),
    columns: { id: true, username: true, isAdmin: true },
  })
  if (!before) return json({ error: 'not found' }, 404)

  await db.delete(users).where(eq(users.id, id))

  await db.insert(auditLog).values({
    actorId: session.uid,
    action: 'user.delete',
    targetType: 'user',
    targetId: id,
    metadata: {
      targetUsername: before.username,
      wasAdmin: before.isAdmin,
    },
  })

  return json({ ok: true })
}
