'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { clientSignOut } from '@/lib/auth/client'
import { OverviewTab } from './OverviewTab'
import { UsersTab } from './UsersTab'
import { IpsTab } from './IpsTab'
import { AuditTab } from './AuditTab'
import type { AdminStats, Tab } from './types'

type Props = {
  session: { uid: string; username: string; isStaff: boolean }
}

export function AdminView({ session }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoadingStats(true)
      setStatsError(null)
      try {
        const res = await fetch('/api/admin/stats')
        if (!res.ok) {
          if (!cancelled)
            setStatsError(`Could not load stats (${res.status})`)
          return
        }
        const body = (await res.json()) as AdminStats
        if (!cancelled) setStats(body)
      } catch {
        if (!cancelled) setStatsError('Could not load stats')
      } finally {
        if (!cancelled) setLoadingStats(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function signOut() {
    await clientSignOut()
    router.push('/')
    router.refresh()
  }

  const TABS: Array<{ k: Tab; label: string; key: string }> = [
    { k: 'overview', label: 'Overview', key: 'O' },
    { k: 'users', label: 'Users', key: 'U' },
    { k: 'ips', label: 'Banned IPs', key: 'I' },
    { k: 'audit', label: 'Audit log', key: 'A' },
  ]

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--ink)',
        display: 'grid',
        gridTemplateColumns: '240px 1fr',
        gridTemplateRows: '100vh',
      }}
      className="dash-grid"
    >
      <aside
        style={{
          background: 'var(--bg-2)',
          borderRight: '1px solid var(--line)',
          padding: '18px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          overflowY: 'auto',
        }}
        className="dash-side"
      >
        <Link
          href="/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--ink)',
            padding: '4px 8px 14px',
          }}
        >
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: 'var(--accent)',
            }}
          />
          bindu / admin
        </Link>

        <p className="eyebrow" style={{ padding: '0 8px', marginBottom: 6 }}>
          ● platform
        </p>
        {TABS.map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 12px',
              borderRadius: 'var(--radius)',
              background: tab === t.k ? 'var(--bubble)' : 'transparent',
              border:
                tab === t.k
                  ? '1px solid var(--line)'
                  : '1px solid transparent',
              color: 'var(--ink)',
              cursor: 'pointer',
              fontWeight: tab === t.k ? 600 : 400,
              fontSize: 14,
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: tab === t.k ? 'var(--accent)' : 'var(--bg-2)',
                border: '1px solid var(--line)',
                display: 'grid',
                placeItems: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: tab === t.k ? '#fff' : 'var(--ink-2)',
                flexShrink: 0,
              }}
            >
              {t.key}
            </span>
            <span style={{ flex: 1, textAlign: 'left' }}>{t.label}</span>
          </button>
        ))}

        <p
          className="eyebrow"
          style={{ padding: '0 8px', marginTop: 18, marginBottom: 6 }}
        >
          ● jump to
        </p>
        <Link
          href="/dashboard"
          style={{
            padding: '8px 12px',
            color: 'var(--ink)',
            textDecoration: 'none',
            fontSize: 14,
            borderRadius: 'var(--radius)',
          }}
        >
          Your inbox
        </Link>
        {session.isStaff && (
          <Link
            href="/staff"
            style={{
              padding: '8px 12px',
              color: 'var(--ink)',
              textDecoration: 'none',
              fontSize: 14,
              borderRadius: 'var(--radius)',
            }}
          >
            Moderation queue
          </Link>
        )}

        <div style={{ flex: 1 }} />

        <div
          style={{
            padding: '12px 8px 8px',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--ink-2)',
            borderTop: '1px solid var(--line)',
            marginTop: 12,
          }}
        >
          <div>logged in as admin</div>
          <div style={{ color: 'var(--ink)' }}>@{session.username}</div>
          <button
            onClick={signOut}
            style={{
              background: 'transparent',
              border: '1px solid var(--line)',
              borderRadius: 99,
              padding: '4px 10px',
              fontSize: 10,
              color: 'var(--ink-2)',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              marginTop: 8,
            }}
          >
            sign out
          </button>
        </div>
      </aside>

      <main
        style={{
          overflowY: 'auto',
          height: '100vh',
        }}
        className="no-bar"
      >
        {tab === 'overview' && (
          <OverviewTab stats={stats} loading={loadingStats} error={statsError} />
        )}
        {tab === 'users' && <UsersTab currentUserId={session.uid} />}
        {tab === 'ips' && <IpsTab />}
        {tab === 'audit' && <AuditTab />}
      </main>
    </div>
  )
}
