import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { sql, and, desc, eq, like, or, lt } from 'drizzle-orm'
import { requireAdminApi } from '@/lib/auth/server'

export const runtime = 'edge'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

const FILTERS = new Set(['all', 'banned', 'staff', 'admin', 'plus'])

/**
 * Paginated user list with optional search and filter.
 *   ?search=ma  → ILIKE both username and displayName
 *   ?filter=banned|staff|admin|plus
 *   ?limit=25 (max 50)
 *   ?before=ISO  → cursor based on createdAt
 */
export async function GET(req: Request) {
  const session = await requireAdminApi()
  if (session instanceof Response) return session

  const url = new URL(req.url)
  const search = (url.searchParams.get('search') ?? '').trim().slice(0, 60)
  const filter = url.searchParams.get('filter') ?? 'all'
  const limit = Math.min(
    50,
    Math.max(1, Number(url.searchParams.get('limit') ?? '25')),
  )
  const before = url.searchParams.get('before')

  if (!FILTERS.has(filter)) return json({ error: 'invalid filter' }, 400)

  const db = getDb()
  if (!db) return json({ error: 'unavailable' }, 503)

  const conditions = []
  if (filter === 'banned') conditions.push(eq(users.isBanned, true))
  if (filter === 'staff') conditions.push(eq(users.isStaff, true))
  if (filter === 'admin') conditions.push(eq(users.isAdmin, true))
  if (filter === 'plus') conditions.push(eq(users.plan, 'plus'))
  if (search) {
    const pattern = `%${search.toLowerCase()}%`
    conditions.push(
      or(
        like(sql`lower(${users.username})`, pattern),
        like(sql`lower(coalesce(${users.displayName}, ''))`, pattern),
      ),
    )
  }
  if (before) conditions.push(lt(users.createdAt, new Date(before)))

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const rows = await db.query.users.findMany({
    where,
    orderBy: [desc(users.createdAt)],
    limit,
    columns: {
      id: true,
      username: true,
      displayName: true,
      theme: true,
      plan: true,
      isStaff: true,
      isAdmin: true,
      isBanned: true,
      bannedAt: true,
      bannedReason: true,
      createdAt: true,
    },
  })

  // Counts per category for the sidebar
  const counts = await db
    .select({
      total: sql<number>`count(*)::int`,
      banned: sql<number>`count(*) filter (where ${users.isBanned} = true)::int`,
      staff: sql<number>`count(*) filter (where ${users.isStaff} = true)::int`,
      admin: sql<number>`count(*) filter (where ${users.isAdmin} = true)::int`,
      plus: sql<number>`count(*) filter (where ${users.plan} = 'plus')::int`,
    })
    .from(users)

  return json({
    users: rows,
    counts: counts[0],
    hasMore: rows.length === limit,
  })
}
