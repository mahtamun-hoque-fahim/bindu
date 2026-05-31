import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

/**
 * Lazy Drizzle client. Returns null when DATABASE_URL is absent
 * (build-time on Cloudflare Pages, for example) so module-level
 * imports don't crash. Callers must guard: `if (!db) return ...`.
 */
export function getDb() {
  if (!process.env.DATABASE_URL) {
    return null as unknown as ReturnType<typeof drizzle<typeof schema>>
  }
  const sql = neon(process.env.DATABASE_URL)
  return drizzle(sql, { schema })
}

export type Db = NonNullable<ReturnType<typeof getDb>>
