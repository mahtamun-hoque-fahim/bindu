import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { hashPassphrase } from '@/lib/auth/passwords'
import {
  validateUsername,
  validatePassphrase,
  normalizeUsername,
} from '@/lib/auth/validation'
import { setSession } from '@/lib/session'
import { getLimiter, getClientIp } from '@/lib/rate-limit'
import type { WrappedPrivateKey } from '@/lib/crypto'

export const runtime = 'edge'

type Body = {
  username?: string
  passphrase?: string
  pubKey?: JsonWebKey
  encPrivKey?: WrappedPrivateKey
}

function bad(error: string, status = 400) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

export async function POST(req: Request) {
  // Rate limit — 10 attempts per IP per hour
  const ip = getClientIp(req)
  const limiter = getLimiter('signup', 10, '1 h')
  const { success } = await limiter.limit(ip)
  if (!success) return bad('Too many signups. Try again later.', 429)

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return bad('Invalid JSON')
  }

  const { username, passphrase, pubKey, encPrivKey } = body

  if (!username || !passphrase || !pubKey || !encPrivKey)
    return bad('Missing fields')

  // Validate
  const usernameCheck = validateUsername(username)
  if (!usernameCheck.ok) return bad(usernameCheck.reason)
  const passCheck = validatePassphrase(passphrase)
  if (!passCheck.ok) return bad(passCheck.reason)

  // Validate the crypto envelope shape — server doesn't unpack it, but
  // we don't want to commit garbage to the DB either.
  if (typeof pubKey !== 'object' || (pubKey as JsonWebKey).kty !== 'EC')
    return bad('Invalid pubKey')
  if (
    typeof encPrivKey !== 'object' ||
    typeof encPrivKey.ciphertext !== 'string' ||
    typeof encPrivKey.iv !== 'string' ||
    typeof encPrivKey.salt !== 'string'
  )
    return bad('Invalid encPrivKey')

  const db = getDb()
  if (!db) return bad('Database unavailable', 500)

  const normalized = normalizeUsername(username)

  // Uniqueness check
  const existing = await db.query.users.findFirst({
    where: eq(users.username, normalized),
  })
  if (existing) return bad('Username already taken', 409)

  // Hash passphrase (~150ms at cost 10)
  const passphraseHash = await hashPassphrase(passphrase)

  // Insert
  const [created] = await db
    .insert(users)
    .values({
      username: normalized,
      passphraseHash,
      pubKey,
      encPrivKey,
    })
    .returning({
      id: users.id,
      username: users.username,
      isStaff: users.isStaff,
      isAdmin: users.isAdmin,
    })

  if (!created) return bad('Failed to create user', 500)

  // Mint session
  await setSession({
    uid: created.id,
    u: created.username,
    s: created.isStaff,
    a: created.isAdmin,
  })

  return new Response(
    JSON.stringify({
      ok: true,
      uid: created.id,
      username: created.username,
    }),
    {
      status: 201,
      headers: { 'content-type': 'application/json' },
    },
  )
}
