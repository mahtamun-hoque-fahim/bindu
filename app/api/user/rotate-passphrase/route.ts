import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireSessionApi } from '@/lib/auth/server'
import {
  hashPassphrase,
  verifyPassphrase,
} from '@/lib/auth/passwords'
import { validatePassphrase } from '@/lib/auth/validation'
import { getLimiter, getClientIp } from '@/lib/rate-limit'
import type { WrappedPrivateKey } from '@/lib/crypto'

export const runtime = 'edge'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

type Body = {
  currentPassphrase?: string
  newPassphrase?: string
  newEncPrivKey?: WrappedPrivateKey
}

/**
 * Atomic passphrase rotation.
 *
 * The client side has already:
 *   1. Unwrapped its private key with the OLD passphrase (in IDB)
 *   2. Derived a NEW KEK from a new passphrase + fresh salt
 *   3. Re-wrapped the same private key under the new KEK
 *
 * This endpoint atomically replaces BOTH `passphraseHash` and `encPrivKey`
 * in a single UPDATE — if the row update fails, neither changes, and the
 * old passphrase still unlocks the old wrapped key. The user cannot get
 * stuck with a passphrase that doesn't match the wrapped key.
 */
export async function POST(req: Request) {
  const session = await requireSessionApi()
  if (session instanceof Response) return session

  // Tight rate limit — this is sensitive and slow
  const ip = getClientIp(req)
  const limiter = getLimiter('rotate-passphrase', 5, '1 h')
  const { success } = await limiter.limit(`${session.uid}:${ip}`)
  if (!success)
    return json({ error: 'Too many attempts. Wait an hour.' }, 429)

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return json({ error: 'invalid json' }, 400)
  }

  const { currentPassphrase, newPassphrase, newEncPrivKey } = body
  if (!currentPassphrase || !newPassphrase || !newEncPrivKey)
    return json({ error: 'missing fields' }, 400)

  // Validate the new passphrase meets the same standards as signup
  const check = validatePassphrase(newPassphrase)
  if (!check.ok) return json({ error: check.reason }, 400)

  // Validate envelope shape
  if (
    typeof newEncPrivKey !== 'object' ||
    typeof newEncPrivKey.ciphertext !== 'string' ||
    typeof newEncPrivKey.iv !== 'string' ||
    typeof newEncPrivKey.salt !== 'string'
  ) {
    return json({ error: 'invalid newEncPrivKey' }, 400)
  }

  const db = getDb()
  if (!db) return json({ error: 'unavailable' }, 503)

  // 1. Verify current passphrase
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.uid),
    columns: { passphraseHash: true },
  })
  if (!user) return json({ error: 'not found' }, 404)

  const valid = await verifyPassphrase(
    currentPassphrase,
    user.passphraseHash,
  )
  if (!valid) return json({ error: 'wrong current passphrase' }, 401)

  // 2. Hash new passphrase
  const newHash = await hashPassphrase(newPassphrase)

  // 3. Atomic write — Drizzle update is a single SQL statement, so
  //    Postgres guarantees both columns commit together (or neither).
  //    A partial failure would surface as a thrown error from the
  //    transaction and roll back automatically — the old passphraseHash
  //    + old encPrivKey would remain intact, and the user can still
  //    sign in with their original passphrase.
  const result = await db
    .update(users)
    .set({
      passphraseHash: newHash,
      encPrivKey: newEncPrivKey,
    })
    .where(eq(users.id, session.uid))
    .returning({ id: users.id })

  if (result.length === 0)
    return json({ error: 'rotation failed' }, 500)

  return json({ ok: true })
}
