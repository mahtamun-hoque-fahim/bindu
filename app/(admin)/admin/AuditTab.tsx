'use client'

import { useCallback, useEffect, useState } from 'react'
import { timeAgo } from '@/lib/utils'
import type { AuditEntry } from './types'

const ACTION_TINT: Record<string, string> = {
  'user.ban': '#C04A2B',
  'user.delete': '#C04A2B',
  'flag.resolved': '#C04A2B',
  'flag.resolve_with_delete': '#C04A2B',
  'flag.dismissed': '#666',
  'flag.escalated': 'var(--accent)',
  'ip.ban': '#C04A2B',
  'ip.unban': '#666',
  'user.patch': '#E07B3A',
}

export function AuditTab() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionFilter, setActionFilter] = useState<string>('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (actionFilter) params.set('action', actionFilter)
      const res = await fetch(`/api/admin/audit-log?${params}`)
      if (!res.ok) {
        setError(`Could not load (${res.status})`)
        setLoading(false)
        return
      }
      const body = (await res.json()) as { entries: AuditEntry[] }
      setEntries(body.entries)
      setLoading(false)
    } catch {
      setError('Could not load')
      setLoading(false)
    }
  }, [actionFilter])

  useEffect(() => {
    void load()
  }, [load])

  const distinctActions = Array.from(
    new Set(entries.map((e) => e.action)),
  ).sort()

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100 }}>
      <p className="eyebrow" style={{ marginBottom: 8 }}>
        ● audit log
      </p>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 36,
          margin: '0 0 8px',
          letterSpacing: '-0.025em',
        }}
      >
        Action stream
      </h1>
      <p
        style={{
          color: 'var(--ink-2)',
          margin: '0 0 24px',
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        Every staff or admin action lands here, append-only. Includes a
        metadata snapshot of the before-state.
      </p>

      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 18,
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setActionFilter('')}
          style={{
            padding: '6px 12px',
            borderRadius: 99,
            background: !actionFilter ? 'var(--ink)' : 'transparent',
            border: `1px solid ${!actionFilter ? 'var(--ink)' : 'var(--line)'}`,
            color: !actionFilter ? 'var(--bg)' : 'var(--ink)',
            cursor: 'pointer',
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
          }}
        >
          all
        </button>
        {distinctActions.map((a) => (
          <button
            key={a}
            onClick={() => setActionFilter(a)}
            style={{
              padding: '6px 12px',
              borderRadius: 99,
              background: actionFilter === a ? 'var(--ink)' : 'transparent',
              border: `1px solid ${actionFilter === a ? 'var(--ink)' : 'var(--line)'}`,
              color: actionFilter === a ? 'var(--bg)' : 'var(--ink)',
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
            }}
          >
            {a}
          </button>
        ))}
      </div>

      {error && (
        <div
          style={{
            background: 'var(--bg-2)',
            border: '1px solid #C04A2B33',
            borderRadius: 'var(--radius)',
            padding: 14,
            color: '#C04A2B',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {loading && entries.length === 0 && (
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            color: 'var(--ink-2)',
          }}
        >
          loading…
        </p>
      )}

      {!loading && entries.length === 0 && (
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            color: 'var(--ink-2)',
          }}
        >
          no entries yet.
        </p>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {entries.map((e) => (
          <div
            key={e.id}
            style={{
              background: 'var(--bubble)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              padding: 16,
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 8,
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: ACTION_TINT[e.action] ?? 'var(--ink-2)',
                }}
              />
              <span
                style={{
                  background: ACTION_TINT[e.action] ?? 'var(--ink-2)',
                  color: '#fff',
                  borderRadius: 4,
                  padding: '2px 8px',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {e.action}
              </span>
              <span style={{ color: 'var(--ink-2)' }}>
                by{' '}
                <span style={{ color: 'var(--ink)' }}>
                  @{e.actorUsername ?? '<deleted>'}
                </span>
              </span>
              {e.targetType && e.targetId && (
                <span style={{ color: 'var(--ink-2)' }}>
                  on {e.targetType}:
                  <span style={{ color: 'var(--ink)' }}>
                    {' '}
                    {e.targetId.slice(0, 12)}…
                  </span>
                </span>
              )}
              <span style={{ marginLeft: 'auto', color: 'var(--ink-2)' }}>
                {timeAgo(e.createdAt)}
              </span>
            </div>
            {e.metadata && Object.keys(e.metadata).length > 0 && (
              <pre
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--line)',
                  borderRadius: 8,
                  padding: 10,
                  fontSize: 11,
                  color: 'var(--ink-2)',
                  margin: 0,
                  overflow: 'auto',
                  maxHeight: 200,
                  fontFamily: 'var(--font-mono)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {JSON.stringify(e.metadata, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
