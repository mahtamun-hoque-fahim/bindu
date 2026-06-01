'use client'

import type { AdminStats } from './types'

type Props = {
  stats: AdminStats | null
  loading: boolean
  error: string | null
}

export function OverviewTab({ stats, loading, error }: Props) {
  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100 }}>
      <p className="eyebrow" style={{ marginBottom: 8 }}>
        ● overview
      </p>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(36px, 5vw, 56px)',
          margin: '0 0 8px',
          letterSpacing: '-0.025em',
          lineHeight: 1.02,
        }}
      >
        Platform vitals
      </h1>
      <p
        style={{
          color: 'var(--ink-2)',
          margin: '0 0 32px',
          fontSize: 15,
          lineHeight: 1.5,
        }}
      >
        Counts only — Bindu can&apos;t read individual messages, so there
        are no plaintext analytics.
      </p>

      {error && (
        <div
          style={{
            background: 'var(--bg-2)',
            border: '1px solid #C04A2B33',
            borderRadius: 'var(--radius)',
            padding: 16,
            color: '#C04A2B',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            marginBottom: 24,
          }}
        >
          {error}
        </div>
      )}

      {loading && !stats && <SkeletonGrid />}

      {stats && (
        <>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 18,
              margin: '0 0 12px',
              fontWeight: 600,
              letterSpacing: '-0.005em',
            }}
          >
            Users
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 12,
              marginBottom: 28,
            }}
          >
            <StatCard label="Total accounts" value={stats.users.total} />
            <StatCard label="New last 24h" value={stats.users.new24h} tone="accent" />
            <StatCard label="New last 7d" value={stats.users.new7d} />
            <StatCard label="Banned" value={stats.users.banned} tone="danger" />
            <StatCard label="Staff" value={stats.users.staff} />
            <StatCard label="Admins" value={stats.users.admin} />
            <StatCard label="Bindu+ subscribers" value={stats.users.plus} />
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 18,
              margin: '0 0 12px',
              fontWeight: 600,
            }}
          >
            Messages
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 12,
              marginBottom: 28,
            }}
          >
            <StatCard label="Total ever sent" value={stats.messages.total} />
            <StatCard label="Sent last 24h" value={stats.messages.sent24h} tone="accent" />
            <StatCard label="Sent last 7d" value={stats.messages.sent7d} />
            <StatCard label="Reactions" value={stats.reactions} />
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 18,
              margin: '0 0 12px',
              fontWeight: 600,
            }}
          >
            Moderation
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 12,
              marginBottom: 28,
            }}
          >
            <StatCard label="Flags total" value={stats.flags.total} />
            <StatCard
              label="Pending review"
              value={stats.flags.pending}
              tone={stats.flags.pending > 0 ? 'danger' : 'neutral'}
            />
            <StatCard label="Resolved" value={stats.flags.resolved} />
            <StatCard label="Banned IPs" value={stats.moderation.bannedIps} />
            <StatCard label="Active mutes" value={stats.moderation.mutes} />
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: number
  tone?: 'neutral' | 'accent' | 'danger'
}) {
  return (
    <div
      style={{
        background: 'var(--bubble)',
        border: `1px solid ${tone === 'danger' && value > 0 ? '#C04A2B33' : 'var(--line)'}`,
        borderRadius: 'var(--radius)',
        padding: 18,
      }}
    >
      <div
        className="eyebrow"
        style={{ marginBottom: 8, color: 'var(--ink-2)' }}
      >
        ● {label.toLowerCase()}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 32,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color:
            tone === 'danger' && value > 0
              ? '#C04A2B'
              : tone === 'accent'
                ? 'var(--accent)'
                : 'var(--ink)',
        }}
      >
        {new Intl.NumberFormat('en-US').format(value)}
      </div>
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12,
      }}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          style={{
            background: 'var(--bg-2)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius)',
            padding: 18,
            height: 90,
            opacity: 0.6,
          }}
        />
      ))}
    </div>
  )
}
