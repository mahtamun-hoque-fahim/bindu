import { requireAdmin } from '@/lib/admin-auth'
import { getDb } from '@/lib/db'
import { users, messages, flags } from '@/lib/db/schema'
import { eq, count, desc, gte, and } from 'drizzle-orm'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin — Bindu' }
export const dynamic = 'force-dynamic'

export default async function AdminOverviewPage() {
  await requireAdmin()

  const db = getDb()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    [{ totalUsers }],
    [{ newToday }],
    [{ totalMessages }],
    [{ msgsToday }],
    [{ pendingFlags }],
    [{ bannedUsers }],
    recentUsers,
    recentFlags,
  ] = db ? await Promise.all([
    db.select({ totalUsers: count() }).from(users),
    db.select({ newToday: count() }).from(users).where(gte(users.createdAt, today)),
    db.select({ totalMessages: count() }).from(messages).where(eq(messages.isDeleted, false)),
    db.select({ msgsToday: count() }).from(messages).where(and(eq(messages.isDeleted, false), gte(messages.createdAt, today))),
    db.select({ pendingFlags: count() }).from(flags).where(eq(flags.status, 'pending')),
    db.select({ bannedUsers: count() }).from(users).where(eq(users.isBanned, true)),
    db.select({ id: users.id, username: users.username, displayName: users.displayName, email: users.email, isBanned: users.isBanned, createdAt: users.createdAt }).from(users).orderBy(desc(users.createdAt)).limit(6),
    db.select({ id: flags.id, reason: flags.reason, flaggedBy: flags.flaggedBy, createdAt: flags.createdAt, messageId: flags.messageId }).from(flags).where(eq(flags.status, 'pending')).orderBy(desc(flags.createdAt)).limit(5),
  ]) : [
    [{ totalUsers: 0 }], [{ newToday: 0 }], [{ totalMessages: 0 }],
    [{ msgsToday: 0 }], [{ pendingFlags: 0 }], [{ bannedUsers: 0 }],
    [], [],
  ]

  const stats = [
    { label: 'Total users', value: totalUsers, sub: `+${newToday} today` },
    { label: 'Messages', value: totalMessages, sub: `+${msgsToday} today` },
    { label: 'Flagged', value: pendingFlags, sub: 'pending review', danger: Number(pendingFlags) > 0 },
    { label: 'Banned users', value: bannedUsers, sub: 'accounts', danger: false },
  ]

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
          Overview
        </h1>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-syne)', color: s.danger ? 'var(--destructive)' : 'var(--text)' }}>
              {Number(s.value).toLocaleString()}
            </p>
            <p className="text-xs mt-1" style={{ color: s.danger ? 'var(--destructive)' : 'var(--text-disabled)' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent signups */}
        <div className="rounded-lg p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>Recent signups</h2>
            <Link href="/admin/users" className="text-xs" style={{ color: 'var(--accent)' }}>View all →</Link>
          </div>
          <div className="flex flex-col">
            {(recentUsers as any[]).map((u) => (
              <div key={u.id} className="flex items-center gap-3 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                  {(u.displayName || u.username).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{u.displayName || u.username}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>@{u.username}</p>
                </div>
                {u.isBanned && (
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,68,68,0.1)', color: 'var(--destructive)' }}>banned</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pending flags */}
        <div className="rounded-lg p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>Pending flags</h2>
            <Link href="/admin/moderation" className="text-xs" style={{ color: 'var(--accent)' }}>Review →</Link>
          </div>
          {(recentFlags as any[]).length === 0 ? (
            <p className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>No pending flags 🎉</p>
          ) : (
            <div className="flex flex-col">
              {(recentFlags as any[]).map((f) => (
                <div key={f.id} className="flex items-center gap-3 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                    style={{
                      background: f.reason === 'harassment' ? 'rgba(255,68,68,0.1)' : 'rgba(255,170,0,0.1)',
                      color: f.reason === 'harassment' ? 'var(--destructive)' : 'var(--warning)',
                    }}>
                    {f.reason}
                  </span>
                  <span className="text-xs flex-1" style={{ color: 'var(--text-muted)' }}>by {f.flaggedBy}</span>
                  <span className="text-xs" style={{ color: 'var(--text-disabled)' }}>
                    {new Date(f.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
