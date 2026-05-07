import { requireAdmin } from '@/lib/admin-auth'
import { getDb } from '@/lib/db'
import { messages, users, flags } from '@/lib/db/schema'
import { eq, count, desc, and } from 'drizzle-orm'
import AdminMessagesClient from '@/components/admin/MessagesClient'
import type { Metadata } from 'next'

export const runtime = 'edge'

export const metadata: Metadata = { title: 'Messages — Admin — Bindu' }
export const dynamic = 'force-dynamic'

const PAGE_SIZE = 30

type Props = { searchParams: Promise<{ page?: string; filter?: string }> }

export default async function AdminMessagesPage({ searchParams }: Props) {
  await requireAdmin()

  const { page: pageParam, filter: filterParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam || '1'))
  const filter = (filterParam || 'all') as 'all' | 'flagged' | 'deleted'
  const offset = (page - 1) * PAGE_SIZE

  const db = getDb()
  if (!db) return <div className="p-10 text-sm" style={{ color: 'var(--text-muted)' }}>DB unavailable</div>

  const whereClause =
    filter === 'deleted' ? eq(messages.isDeleted, true) :
    filter === 'all' ? undefined : undefined // flagged handled client-side via flagCount

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: messages.id,
        content: messages.content,
        isRead: messages.isRead,
        isDeleted: messages.isDeleted,
        deletedBy: messages.deletedBy,
        createdAt: messages.createdAt,
        recipientUsername: users.username,
        recipientDisplayName: users.displayName,
        flagCount: count(flags.id),
      })
      .from(messages)
      .leftJoin(users, eq(messages.recipientId, users.id))
      .leftJoin(flags, eq(flags.messageId, messages.id))
      .where(whereClause)
      .groupBy(messages.id, users.username, users.displayName)
      .orderBy(desc(messages.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db.select({ total: count() }).from(messages).where(whereClause),
  ])

  const totalPages = Math.ceil(Number(total) / PAGE_SIZE)

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
          Messages
          <span className="text-sm font-normal ml-3" style={{ color: 'var(--text-muted)' }}>
            {Number(total).toLocaleString()} {filter !== 'all' ? filter : 'total'}
          </span>
        </h1>
      </div>
      <AdminMessagesClient
        initialMessages={rows as any[]}
        page={page}
        totalPages={totalPages}
        filter={filter}
      />
    </div>
  )
}
