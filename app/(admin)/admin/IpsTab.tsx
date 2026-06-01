'use client'

import { useCallback, useEffect, useState } from 'react'
import { timeAgo } from '@/lib/utils'
import type { BannedIp } from './types'

export function IpsTab() {
  const [ips, setIps] = useState<BannedIp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [newIp, setNewIp] = useState('')
  const [newReason, setNewReason] = useState('')
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/banned-ips')
      if (!res.ok) {
        setError(`Could not load (${res.status})`)
        setLoading(false)
        return
      }
      const body = (await res.json()) as { bannedIps: BannedIp[] }
      setIps(body.bannedIps)
      setLoading(false)
    } catch {
      setError('Could not load')
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function addBan() {
    if (!newIp.trim()) return
    setAdding(true)
    setError(null)
    const res = await fetch('/api/admin/banned-ips', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ip: newIp.trim(),
        reason: newReason.trim() || null,
      }),
    })
    setAdding(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError((body as { error?: string }).error ?? 'Could not ban')
      return
    }
    setNewIp('')
    setNewReason('')
    await load()
  }

  async function unban(id: string, ip: string) {
    if (!confirm(`Unban ${ip}?`)) return
    setBusy(id)
    const res = await fetch(`/api/admin/banned-ips/${id}`, { method: 'DELETE' })
    setBusy(null)
    if (res.ok) await load()
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 900 }}>
      <p className="eyebrow" style={{ marginBottom: 8 }}>
        ● banned IPs
      </p>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 36,
          margin: '0 0 8px',
          letterSpacing: '-0.025em',
        }}
      >
        IP block list
      </h1>
      <p
        style={{
          color: 'var(--ink-2)',
          margin: '0 0 28px',
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        Senders from these IPs cannot deliver messages via `/api/messages`.
        Rate-limit and ban checks happen before message storage.
      </p>

      {/* Add form */}
      <div
        style={{
          background: 'var(--bubble)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius)',
          padding: 18,
          marginBottom: 24,
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <input
          value={newIp}
          onChange={(e) => setNewIp(e.target.value)}
          placeholder="ip (v4 or v6)"
          style={{
            flex: '1 1 220px',
            minWidth: 220,
            padding: '10px 14px',
            borderRadius: 'var(--radius)',
            border: '1.5px solid var(--line)',
            background: 'var(--bg)',
            color: 'var(--ink)',
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            outline: 'none',
          }}
        />
        <input
          value={newReason}
          onChange={(e) => setNewReason(e.target.value)}
          placeholder="reason (optional)"
          style={{
            flex: '2 1 260px',
            minWidth: 200,
            padding: '10px 14px',
            borderRadius: 'var(--radius)',
            border: '1.5px solid var(--line)',
            background: 'var(--bg)',
            color: 'var(--ink)',
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            outline: 'none',
          }}
        />
        <button
          onClick={addBan}
          disabled={adding || !newIp.trim()}
          className="btn accent"
          style={{
            padding: '10px 16px',
            fontSize: 14,
            opacity: adding || !newIp.trim() ? 0.5 : 1,
            cursor: adding || !newIp.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          {adding ? 'Adding…' : 'Ban IP'}
        </button>
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

      {loading && (
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

      {!loading && ips.length === 0 && (
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            color: 'var(--ink-2)',
          }}
        >
          no bans active. ●
        </p>
      )}

      <div
        style={{
          background: 'var(--bubble)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
        }}
      >
        {ips.map((row) => (
          <div
            key={row.id}
            style={{
              padding: '12px 18px',
              borderBottom: '1px solid var(--line)',
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {row.ip}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--ink-2)',
                  }}
                >
                  banned {timeAgo(row.createdAt)}
                </span>
              </div>
              {row.reason && (
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--ink-2)',
                    marginTop: 4,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  reason: {row.reason}
                </div>
              )}
            </div>
            <button
              onClick={() => unban(row.id, row.ip)}
              disabled={busy === row.id}
              style={{
                background: 'transparent',
                border: '1px solid var(--line)',
                borderRadius: 99,
                padding: '6px 12px',
                fontSize: 11,
                color: 'var(--ink-2)',
                fontFamily: 'var(--font-mono)',
                cursor: busy === row.id ? 'not-allowed' : 'pointer',
                opacity: busy === row.id ? 0.5 : 1,
              }}
            >
              unban
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
