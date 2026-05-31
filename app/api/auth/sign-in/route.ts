import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { verifyPassphrase } from '@/lib/auth/passwords'
import { normalizeUsername } from '@/lib/auth/validation'
import { setSession } from '@/lib/session'
import { getLimiter, getClientIp } from '@/lib/rate-limit'

export const runtime = 'edge'

type Body = {
  username?: string
  passphrase?: string
}

function bad(error: string, status = 400) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

export async function POST(req: Request) {
  // Rate limit — 20 attempts per IP per 15 minutes
  const ip = getClientIp(req)
  const limiter = getLimiter('signin', 20, '15 m')
  const { success } = await limiter.limit(ip)
  if (!success) return bad('Too many attempts. Wait a few minutes.', 429)

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return bad('Invalid JSON')
  }

  const { username, passphrase } = body
  if (!username || !passphrase) return bad('Missing fields')

  const db = getDb()
  if (!db) return bad('Database unavailable', 500)

  const normalized = normalizeUsername(username)
  const user = await db.query.users.findFirst({
    where: eq(users.username, normalized),
  })

  // Deliberately do bcrypt even on miss to avoid timing oracle leaking
  // username existence. Use a known invalid hash so verify fails fast
  // but still spends roughly bcrypt-time.
  const storedHash =
    user?.passphraseHash ??
    '$2a$10$abcdefghijklmnopqrstuvWxYzAbCdEfGhIjKlMnOpQrStUvWxYzAbCd'

  const valid = await verifyPassphrase(passphrase, storedHash)
  if (!valid || !user) return bad('Wrong username or passphrase', 401)

  if (user.isBanned) return bad('Account suspended', 403)

  await setSession({
    uid: user.id,
    u: user.username,
    s: user.isStaff,
    a: user.isAdmin,
  })

  return new Response(
    JSON.stringify({
      ok: true,
      uid: user.id,
      username: user.username,
      isStaff: user.isStaff,
      isAdmin: user.isAdmin,
      encPrivKey: user.encPrivKey,
    }),
    {
      status: 200,
      headers: { 'content-type': 'application/json' },
    },
  )
}
