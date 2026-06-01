'use client'

import { useCallback, useEffect, useState } from 'react'
import { timeAgo } from '@/lib/utils'
import type { AdminUser, UserCounts } from './types'

type Filter = 'all' | 'banned' | 'staff' | 'admin' | 'plus'

const FILTERS: Array<{ k: Filter; label: string }> = [
  { k: 'all', label: 'All' },
  { k: 'banned', label: 'Banned' },
  { k: 'staff', label: 'Staff' },
  { k: 'admin', label: 'Admins' },
  { k: 'plus', label: 'Bindu+' },
]

export function UsersTab({ currentUserId }: { currentUserId: string }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [counts, setCounts] = useState<UserCounts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null) // id of user being mutated

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('filter', filter)
      if (search.trim()) params.set('search', search.trim())
      const res = await fetch(`/api/admin/users?${params}`)
      if (!res.ok) {
        setError(`Could not load (${res.status})`)
        setLoading(false)
        return
      }
      const body = (await res.json()) as {
        users: AdminUser[]
        counts: UserCounts
      }
      setUsers(body.users)
      setCounts(body.counts)
      setLoading(false)
    } catch {
      setError('Could not load')
      setLoading(false)
    }
  }, [filter, search])

  useEffect(() => {
    const t = setTimeout(load, search ? 250 : 0)
    return () => clearTimeout(t)
  }, [load, search])

  async function patch(
    id: string,
    body: Partial<{
      isStaff: boolean
      isAdmin: boolean
      isBanned: boolean
      bannedReason: string | null
    }>,
  ) {
    setBusy(id)
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    setBusy(null)
    if (res.ok) await load()
  }

  async function deleteUser(id: string, username: string) {
    if (!confirm(`Delete @${username} forever? This cascades to all their messages.`)) return
    setBusy(id)
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    setBusy(null)
    if (res.ok) await load()
    else {
      const body = await res.json().catch(() => ({}))
      alert((body as { error?: string }).error ?? 'Could not delete')
    }
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200 }}>
      <p className="eyebrow" style={{ marginBottom: 8 }}>
        ● users
      </p>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 36,
          margin: '0 0 8px',
          letterSpacing: '-0.025em',
        }}
      >
        User directory
      </h1>
      <p
        style={{
          color: 'var(--ink-2)',
          margin: '0 0 28px',
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        Promote, ban, or wipe accounts. Every change writes to the audit log.
      </p>

      {/* Filters + search */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginBottom: 18,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {FILTERS.map((f) => {
          const count =
            f.k === 'all'
              ? counts?.total
              : counts?.[f.k]
          return (
            <button
              key={f.k}
              onClick={() => setFilter(f.k)}
              style={{
                padding: '6px 12px',
                borderRadius: 99,
                background: filter === f.k ? 'var(--ink)' : 'transparent',
                border: `1px solid ${filter === f.k ? 'var(--ink)' : 'var(--line)'}`,
                color: filter === f.k ? 'var(--bg)' : 'var(--ink)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {f.label}
              {count !== undefined && (
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    opacity: 0.7,
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="search username or display name"
          style={{
            flex: '1 1 200px',
            minWidth: 200,
            padding: '8px 14px',
            borderRadius: 99,
            border: '1px solid var(--line)',
            background: 'var(--bubble)',
            color: 'var(--ink)',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            outline: 'none',
          }}
        />
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

      {loading && users.length === 0 && (
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

      {!loading && users.length === 0 && (
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            color: 'var(--ink-2)',
          }}
        >
          no users match.
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
        {users.map((u) => {
          const isSelf = u.id === currentUserId
          return (
            <div
              key={u.id}
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--line)',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 12,
                alignItems: 'center',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: 15,
                      fontFamily: 'var(--font-display)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    @{u.username}
                  </span>
                  {u.displayName && (
                    <span
                      style={{
                        color: 'var(--ink-2)',
                        fontSize: 13,
                      }}
                    >
                      ({u.displayName})
                    </span>
                  )}
                  {isSelf && (
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        color: 'var(--accent)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      you
                    </span>
                  )}
                  {u.isAdmin && <RoleChip label="admin" color="#C04A2B" />}
                  {u.isStaff && !u.isAdmin && (
                    <RoleChip label="staff" color="#E07B3A" />
                  )}
                  {u.plan === 'plus' && (
                    <RoleChip label="plus" color="var(--accent)" />
                  )}
                  {u.isBanned && (
                    <RoleChip label="banned" color="#C04A2B" filled />
                  )}
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--ink-2)',
                  }}
                >
                  joined {timeAgo(u.createdAt)} · {u.id.slice(0, 12)}…
                  {u.bannedReason && (
                    <span style={{ color: '#C04A2B', marginLeft: 12 }}>
                      reason: {u.bannedReason}
                    </span>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  justifyContent: 'flex-end',
                }}
              >
                <ActionBtn
                  onClick={() =>
                    patch(u.id, { isStaff: !u.isStaff })
                  }
                  disabled={busy === u.id}
                  active={u.isStaff}
                >
                  {u.isStaff ? '✓ staff' : 'staff'}
                </ActionBtn>
                <ActionBtn
                  onClick={() =>
                    patch(u.id, { isAdmin: !u.isAdmin })
                  }
                  disabled={busy === u.id}
                  active={u.isAdmin}
                >
                  {u.isAdmin ? '✓ admin' : 'admin'}
                </ActionBtn>
                <ActionBtn
                  onClick={() => {
                    if (u.isBanned) {
                      patch(u.id, { isBanned: false, bannedReason: null })
                    } else {
                      const reason = prompt(`Ban @${u.username}? Reason:`)
                      if (reason !== null) {
                        patch(u.id, {
                          isBanned: true,
                          bannedReason: reason || null,
                        })
                      }
                    }
                  }}
                  disabled={busy === u.id}
                  danger
                  active={u.isBanned}
                >
                  {u.isBanned ? '✓ banned' : 'ban'}
                </ActionBtn>
                <ActionBtn
                  onClick={() => deleteUser(u.id, u.username)}
                  disabled={busy === u.id || isSelf}
                  danger
                  title={
                    isSelf
                      ? 'Use settings danger zone to delete your own account'
                      : 'Hard delete (cascades)'
                  }
                >
                  ×
                </ActionBtn>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RoleChip({
  label,
  color,
  filled,
}: {
  label: string
  color: string
  filled?: boolean
}) {
  return (
    <span
      style={{
        background: filled ? color : 'transparent',
        color: filled ? '#fff' : color,
        border: `1px solid ${color}`,
        borderRadius: 99,
        padding: '1px 8px',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}
    >
      {label}
    </span>
  )
}

function ActionBtn({
  children,
  onClick,
  disabled,
  danger,
  active,
  title,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  danger?: boolean
  active?: boolean
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        background: active && !danger ? 'var(--accent)' : 'transparent',
        border: `1px solid ${
          danger ? '#C04A2B33' : active ? 'var(--accent)' : 'var(--line)'
        }`,
        borderRadius: 99,
        padding: '5px 10px',
        color: active && !danger ? '#fff' : danger ? '#C04A2B' : 'var(--ink-2)',
        fontSize: 11,
        fontFamily: 'var(--font-mono)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  )
}
