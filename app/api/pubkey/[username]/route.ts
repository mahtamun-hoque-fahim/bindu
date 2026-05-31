import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { normalizeUsername, validateUsername } from '@/lib/auth/validation'
import { getLimiter, getClientIp } from '@/lib/rate-limit'

export const runtime = 'edge'

function notFound() {
  return new Response(JSON.stringify({ error: 'not found' }), {
    status: 404,
    headers: { 'content-type': 'application/json' },
  })
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  // Light rate limit — public endpoint
  const ip = getClientIp(req)
  const limiter = getLimiter('pubkey', 30, '1 m')
  const { success } = await limiter.limit(ip)
  if (!success) {
    return new Response(JSON.stringify({ error: 'rate limited' }), {
      status: 429,
      headers: { 'content-type': 'application/json' },
    })
  }

  const { username: raw } = await params
  const check = validateUsername(raw)
  if (!check.ok) return notFound()

  const db = getDb()
  if (!db) {
    return new Response(JSON.stringify({ error: 'unavailable' }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    })
  }

  const normalized = normalizeUsername(raw)
  const user = await db.query.users.findFirst({
    where: eq(users.username, normalized),
    columns: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      pubKey: true,
      theme: true,
      isBanned: true,
    },
  })

  // Banned users 404 — don't leak ban status to senders
  if (!user || user.isBanned) return notFound()

  return new Response(
    JSON.stringify({
      recipientId: user.id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      theme: user.theme,
      pubKey: user.pubKey,
    }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json',
        // Cache pubkey for 60s — it's effectively immutable but
        // we may want to flush quickly if a user is banned
        'cache-control': 'public, max-age=60, s-maxage=60',
      },
    },
  )
}
