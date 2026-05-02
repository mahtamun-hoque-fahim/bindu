import { requireAdmin } from '@/lib/admin-auth'
import { getDb } from '@/lib/db'
import { users, messages } from '@/lib/db/schema'
import { eq, count, desc } from 'drizzle-orm'
import AdminUsersClient from '@/components/admin/UsersClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Users — Admin — Bindu' }
export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  await requireAdmin()

  const db = getDb()
  const rows = db
    ? await db
        .select({
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          email: users.email,
          isBanned: users.isBanned,
          bannedReason: users.bannedReason,
          role: users.role,
          createdAt: users.createdAt,
          messageCount: count(messages.id),
        })
        .from(users)
        .leftJoin(messages, eq(messages.recipientId, users.id))
        .groupBy(users.id)
        .orderBy(desc(users.createdAt))
        .limit(100)
    : []

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-8" style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
        Users
        <span className="text-sm font-normal ml-3" style={{ color: 'var(--text-muted)' }}>{rows.length} total</span>
      </h1>
      <AdminUsersClient initialUsers={rows as any[]} />
    </div>
  )
}
