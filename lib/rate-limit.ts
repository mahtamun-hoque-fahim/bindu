/**
 * Lazy rate limiter. Uses Upstash Redis in production; falls back to an
 * in-memory map in dev when env vars are absent (per-worker, resets on
 * restart — fine for local dev, not for production).
 *
 * Limiters are keyed by purpose so they don't share buckets.
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

type Limiter = {
  limit: (key: string) => Promise<{ success: boolean; reset: number; remaining: number }>
}

const inMemoryBuckets = new Map<string, number[]>()

function inMemoryLimiter(max: number, windowMs: number): Limiter {
  return {
    async limit(key: string) {
      const now = Date.now()
      const cutoff = now - windowMs
      const hits = (inMemoryBuckets.get(key) ?? []).filter((t) => t > cutoff)
      hits.push(now)
      inMemoryBuckets.set(key, hits)
      return {
        success: hits.length <= max,
        reset: cutoff + windowMs,
        remaining: Math.max(0, max - hits.length),
      }
    },
  }
}

function hasUpstash(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  )
}

const cache: Record<string, Limiter | undefined> = {}

export function getLimiter(
  name: string,
  max: number,
  window: `${number} ${'s' | 'm' | 'h'}`,
): Limiter {
  if (cache[name]) return cache[name]!

  if (hasUpstash()) {
    const redis = Redis.fromEnv()
    const rl = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(max, window),
      prefix: `bindu:rl:${name}`,
    })
    cache[name] = {
      async limit(key: string) {
        const r = await rl.limit(key)
        return { success: r.success, reset: r.reset, remaining: r.remaining }
      },
    }
    return cache[name]!
  }

  // Dev fallback — translate the window into ms
  const [n, unit] = window.split(' ')
  const ms =
    parseInt(n) *
    (unit === 's' ? 1000 : unit === 'm' ? 60_000 : 3_600_000)
  cache[name] = inMemoryLimiter(max, ms)
  return cache[name]!
}

/** Best-effort IP from common CF / proxy headers. */
export function getClientIp(req: Request): string {
  const headers = req.headers
  return (
    headers.get('cf-connecting-ip') ||
    headers.get('x-real-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  )
}
