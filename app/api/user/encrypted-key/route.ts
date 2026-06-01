import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireSessionApi } from '@/lib/auth/server'

export const runtime = 'edge'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

/**
 * Returns the current user's wrapped private key + their pubKey so the
 * client can re-unwrap and re-cache it in IndexedDB. Used by the
 * dashboard's UnlockGate when IndexedDB is empty but the session is
 * still valid (e.g. browser data cleared but cookie still alive).
 *
 * No raw passphrase or KEK is ever transmitted — the client unwraps
 * locally with PBKDF2 against the salt embedded in encPrivKey.
 */
export async function GET() {
  const session = await requireSessionApi()
  if (session instanceof Response) return session

  const db = getDb()
  if (!db) return json({ error: 'unavailable' }, 503)

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.uid),
    columns: {
      encPrivKey: true,
      pubKey: true,
    },
  })
  if (!user) return json({ error: 'not found' }, 404)

  return json({
    encPrivKey: user.encPrivKey,
    pubKey: user.pubKey,
  })
}
