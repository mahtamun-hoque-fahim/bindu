import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { eq, desc } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { messages } from '@/lib/db/schema'
import InboxList from '@/components/dashboard/InboxList'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Inbox — Bindu',
}

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const db = getDb()
  const allMessages = db
    ? await db
        .select()
        .from(messages)
        .where(eq(messages.recipientId, userId))
        .orderBy(desc(messages.createdAt))
    : []

  const unreadCount = allMessages.filter((m: { isRead: boolean }) => !m.isRead).length

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}
        >
          Inbox
        </h1>
        {unreadCount > 0 && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full min-w-[22px] text-center"
            style={{ background: 'var(--accent)', color: '#000' }}
          >
            {unreadCount}
          </span>
        )}
        <span className="text-sm ml-auto" style={{ color: 'var(--text-muted)' }}>
          {allMessages.length} {allMessages.length === 1 ? 'message' : 'messages'}
        </span>
      </div>

      <InboxList messages={allMessages} />
    </div>
  )
}
