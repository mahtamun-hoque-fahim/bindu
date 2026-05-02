import { requireAdmin } from '@/lib/admin-auth'
import { getDb } from '@/lib/db'
import { bannedIps } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import BannedIpsClient from '@/components/admin/BannedIpsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Banned IPs — Admin — Bindu' }
export const dynamic = 'force-dynamic'

export default async function AdminBannedIpsPage() {
  await requireAdmin()

  const db = getDb()
  const rows = db
    ? await db.select().from(bannedIps).orderBy(desc(bannedIps.createdAt))
    : []

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1
        className="text-2xl font-bold mb-2"
        style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}
      >
        Banned IPs
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
        IPs blocked from sending messages. Rate-limit hits are automatic; manual bans are permanent until removed.
      </p>
      <BannedIpsClient initialIps={rows as any[]} />
    </div>
  )
}
