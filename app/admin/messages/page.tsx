import { requireAdmin } from '@/lib/admin-auth'
import { getDb } from '@/lib/db'
import { messages, users, flags } from '@/lib/db/schema'
import { eq, count, desc } from 'drizzle-orm'
import AdminMessagesClient from '@/components/admin/MessagesClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Messages — Admin — Bindu' }
export const dynamic = 'force-dynamic'

export default async function AdminMessagesPage() {
  await requireAdmin()

  const db = getDb()
  const rows = db
    ? await db
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
        .groupBy(messages.id, users.username, users.displayName)
        .orderBy(desc(messages.createdAt))
        .limit(200)
    : []

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1
        className="text-2xl font-bold mb-8"
        style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}
      >
        Messages
        <span className="text-sm font-normal ml-3" style={{ color: 'var(--text-muted)' }}>
          {rows.length} recent
        </span>
      </h1>
      <AdminMessagesClient initialMessages={rows as any[]} />
    </div>
  )
}
