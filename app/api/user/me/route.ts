import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireSessionApi } from '@/lib/auth/server'
import { clearSession } from '@/lib/session'
import { verifyPassphrase } from '@/lib/auth/passwords'

export const runtime = 'edge'

const THEMES = new Set(['sunset', 'acid', 'dream'])
const MAX_DISPLAY_NAME = 40
const MAX_BIO = 140

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

type PatchBody = {
  theme?: string
  displayName?: string | null
  bio?: string | null
}

export async function PATCH(req: Request) {
  const session = await requireSessionApi()
  if (session instanceof Response) return session

  let body: PatchBody
  try {
    body = (await req.json()) as PatchBody
  } catch {
    return json({ error: 'invalid json' }, 400)
  }

  const update: Partial<typeof users.$inferInsert> = {}
  if (typeof body.theme === 'string') {
    if (!THEMES.has(body.theme))
      return json({ error: 'invalid theme' }, 400)
    update.theme = body.theme as 'sunset' | 'acid' | 'dream'
  }
  if (body.displayName !== undefined) {
    if (body.displayName === null || body.displayName === '') {
      update.displayName = null
    } else if (typeof body.displayName !== 'string') {
      return json({ error: 'invalid displayName' }, 400)
    } else if (body.displayName.length > MAX_DISPLAY_NAME) {
      return json({ error: `displayName too long (max ${MAX_DISPLAY_NAME})` }, 400)
    } else {
      update.displayName = body.displayName.trim()
    }
  }
  if (body.bio !== undefined) {
    if (body.bio === null || body.bio === '') {
      update.bio = null
    } else if (typeof body.bio !== 'string') {
      return json({ error: 'invalid bio' }, 400)
    } else if (body.bio.length > MAX_BIO) {
      return json({ error: `bio too long (max ${MAX_BIO})` }, 400)
    } else {
      update.bio = body.bio.trim()
    }
  }

  if (Object.keys(update).length === 0)
    return json({ error: 'nothing to update' }, 400)

  const db = getDb()
  if (!db) return json({ error: 'unavailable' }, 503)

  const result = await db
    .update(users)
    .set(update)
    .where(eq(users.id, session.uid))
    .returning({ id: users.id })

  if (result.length === 0) return json({ error: 'not found' }, 404)
  return json({ ok: true })
}

/**
 * DELETE — wipe account. Requires passphrase re-confirmation in the body
 * since this is destructive and cascade-deletes messages, reactions,
 * mutes, flags-reported, etc. via FK onDelete: cascade.
 */
type DeleteBody = { passphrase?: string }

export async function DELETE(req: Request) {
  const session = await requireSessionApi()
  if (session instanceof Response) return session

  let body: DeleteBody
  try {
    body = (await req.json()) as DeleteBody
  } catch {
    return json({ error: 'invalid json' }, 400)
  }

  if (!body.passphrase || typeof body.passphrase !== 'string')
    return json({ error: 'passphrase required' }, 400)

  const db = getDb()
  if (!db) return json({ error: 'unavailable' }, 503)

  // Verify passphrase before destructive op
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.uid),
    columns: { passphraseHash: true },
  })
  if (!user) return json({ error: 'not found' }, 404)

  const valid = await verifyPassphrase(body.passphrase, user.passphraseHash)
  if (!valid) return json({ error: 'wrong passphrase' }, 401)

  // Cascade through FKs
  await db.delete(users).where(eq(users.id, session.uid))
  await clearSession()

  return json({ ok: true })
}
