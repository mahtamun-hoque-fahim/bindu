import { requireAdmin } from '@/lib/admin-auth'
import { getDb } from '@/lib/db'
import { users, messages } from '@/lib/db/schema'
import { eq, count, desc, ilike, or } from 'drizzle-orm'
import AdminUsersClient from '@/components/admin/UsersClient'
import type { Metadata } from 'next'

export const runtime = 'edge'

export const metadata: Metadata = { title: 'Users — Admin — Bindu' }
export const dynamic = 'force-dynamic'

const PAGE_SIZE = 25

type Props = { searchParams: Promise<{ page?: string; q?: string }> }

export default async function AdminUsersPage({ searchParams }: Props) {
  await requireAdmin()

  const { page: pageParam, q } = await searchParams
  const page = Math.max(1, parseInt(pageParam || '1'))
  const offset = (page - 1) * PAGE_SIZE
  const search = q?.trim() || ''

  const db = getDb()
  if (!db) return <div className="p-10 text-sm" style={{ color: 'var(--text-muted)' }}>DB unavailable</div>

  const whereClause = search
    ? or(ilike(users.username, `%${search}%`), ilike(users.displayName, `%${search}%`), ilike(users.email, `%${search}%`))
    : undefined

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        email: users.email,
        isBanned: users.isBanned,
        bannedReason: users.bannedReason,
        createdAt: users.createdAt,
        messageCount: count(messages.id),
      })
      .from(users)
      .leftJoin(messages, eq(messages.recipientId, users.id))
      .where(whereClause)
      .groupBy(users.id)
      .orderBy(desc(users.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db.select({ total: count() }).from(users).where(whereClause),
  ])

  const totalPages = Math.ceil(Number(total) / PAGE_SIZE)

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
          Users
          <span className="text-sm font-normal ml-3" style={{ color: 'var(--text-muted)' }}>
            {Number(total).toLocaleString()} total
          </span>
        </h1>
      </div>
      <AdminUsersClient
        initialUsers={rows as any[]}
        page={page}
        totalPages={totalPages}
        search={search}
      />
    </div>
  )
}
