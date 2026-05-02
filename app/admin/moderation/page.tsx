import { requireAdmin } from '@/lib/admin-auth'
import { getDb } from '@/lib/db'
import { flags, messages, users } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import ModerationClient from '@/components/admin/ModerationClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Moderation — Admin — Bindu' }
export const dynamic = 'force-dynamic'

export default async function AdminModerationPage() {
  await requireAdmin()

  const db = getDb()
  const rows = db
    ? await db
        .select({
          id: flags.id,
          flaggedBy: flags.flaggedBy,
          reason: flags.reason,
          note: flags.note,
          status: flags.status,
          createdAt: flags.createdAt,
          resolvedAt: flags.resolvedAt,
          messageId: messages.id,
          messageContent: messages.content,
          messageIsDeleted: messages.isDeleted,
          recipientUsername: users.username,
          recipientDisplayName: users.displayName,
        })
        .from(flags)
        .leftJoin(messages, eq(flags.messageId, messages.id))
        .leftJoin(users, eq(messages.recipientId, users.id))
        .orderBy(desc(flags.createdAt))
        .limit(200)
    : []

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1
        className="text-2xl font-bold mb-2"
        style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}
      >
        Moderation
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
        Review flagged messages from senders and recipients.
      </p>
      <ModerationClient initialFlags={rows as any[]} />
    </div>
  )
}
