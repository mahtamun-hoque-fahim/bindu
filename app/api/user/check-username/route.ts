import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import {
  validateUsername,
  normalizeUsername,
} from '@/lib/auth/validation'
import { getLimiter, getClientIp } from '@/lib/rate-limit'

export const runtime = 'edge'

export async function GET(req: Request) {
  // Light rate limit — chatty signup form
  const ip = getClientIp(req)
  const limiter = getLimiter('check-username', 60, '1 m')
  const { success } = await limiter.limit(ip)
  if (!success) {
    return new Response(JSON.stringify({ error: 'rate limited' }), {
      status: 429,
      headers: { 'content-type': 'application/json' },
    })
  }

  const url = new URL(req.url)
  const raw = url.searchParams.get('u') ?? ''
  const check = validateUsername(raw)
  if (!check.ok) {
    return new Response(
      JSON.stringify({ available: false, reason: check.reason }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    )
  }

  const db = getDb()
  if (!db) {
    return new Response(
      JSON.stringify({ available: true, reason: null, note: 'no-db' }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    )
  }

  const normalized = normalizeUsername(raw)
  const existing = await db.query.users.findFirst({
    where: eq(users.username, normalized),
    columns: { id: true },
  })

  return new Response(
    JSON.stringify({
      available: !existing,
      reason: existing ? 'Already taken' : null,
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  )
}
