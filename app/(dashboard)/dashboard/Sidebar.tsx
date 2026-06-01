'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { clearCachedPrivateKey } from '@/lib/key-cache'
import { clientSignOut } from '@/lib/auth/client'
import type { Filter } from './types'

type Props = {
  session: {
    uid: string
    username: string
    isStaff: boolean
    isAdmin: boolean
    theme: 'sunset' | 'acid' | 'dream'
  }
  unreadCount: number
  favoriteCount: number
  flaggedCount: number
  filter: Filter
  onFilterChange: (f: Filter) => void
}

const FILTERS: Array<{ k: Filter; label: string; key: string }> = [
  { k: 'all', label: 'Inbox', key: 'I' },
  { k: 'new', label: 'New', key: 'N' },
  { k: 'fav', label: 'Starred', key: 'S' },
  { k: 'flagged', label: 'Flagged', key: 'F' },
]

export function Sidebar({
  session,
  unreadCount,
  favoriteCount,
  flaggedCount,
  filter,
  onFilterChange,
}: Props) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/u/${session.username}`
        : `/u/${session.username}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignored */
    }
  }

  async function lockNow() {
    await clearCachedPrivateKey()
    router.refresh()
  }

  async function signOut() {
    await clientSignOut()
    router.push('/')
    router.refresh()
  }

  function badgeFor(k: Filter): number {
    if (k === 'new') return unreadCount
    if (k === 'fav') return favoriteCount
    if (k === 'flagged') return flaggedCount
    return 0
  }

  return (
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
        href="/"
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
            display: 'inline-block',
          }}
        />
        bindu
      </Link>

      <button
        onClick={copyLink}
        style={{
          background: 'var(--bubble)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius)',
          padding: '10px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: 'var(--ink-2)',
          cursor: 'pointer',
          marginBottom: 16,
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
        title="copy your link"
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--accent)',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            color: 'var(--ink)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}
        >
          /{session.username}
        </span>
        <span style={{ fontSize: 11 }}>{copied ? '✓' : '↗'}</span>
      </button>

      <p
        className="eyebrow"
        style={{ padding: '0 8px', marginBottom: 6 }}
      >
        ● mail
      </p>
      {FILTERS.map((f) => (
        <button
          key={f.k}
          onClick={() => onFilterChange(f.k)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 12px',
            borderRadius: 'var(--radius)',
            background:
              filter === f.k ? 'var(--bubble)' : 'transparent',
            border:
              filter === f.k
                ? '1px solid var(--line)'
                : '1px solid transparent',
            color: 'var(--ink)',
            cursor: 'pointer',
            fontWeight: filter === f.k ? 600 : 400,
            fontSize: 14,
          }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: filter === f.k ? 'var(--accent)' : 'var(--bg-2)',
              border: '1px solid var(--line)',
              display: 'grid',
              placeItems: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: filter === f.k ? '#fff' : 'var(--ink-2)',
              flexShrink: 0,
            }}
          >
            {f.key}
          </span>
          <span style={{ flex: 1, textAlign: 'left' }}>{f.label}</span>
          {badgeFor(f.k) > 0 && (
            <span
              style={{
                background:
                  f.k === 'flagged' ? '#C04A2B' : 'var(--accent)',
                color: '#fff',
                padding: '0 6px',
                borderRadius: 999,
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                lineHeight: '18px',
                minWidth: 18,
                textAlign: 'center',
              }}
            >
              {badgeFor(f.k)}
            </span>
          )}
        </button>
      ))}

      {(session.isStaff || session.isAdmin) && (
        <>
          <p
            className="eyebrow"
            style={{ padding: '0 8px', marginTop: 18, marginBottom: 6 }}
          >
            ● ops
          </p>
          {session.isStaff && (
            <Link
              href="/staff"
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius)',
                color: 'var(--ink)',
                textDecoration: 'none',
                fontSize: 14,
              }}
            >
              Moderation queue
            </Link>
          )}
          {session.isAdmin && (
            <Link
              href="/admin"
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius)',
                color: 'var(--ink)',
                textDecoration: 'none',
                fontSize: 14,
              }}
            >
              Admin
            </Link>
          )}
        </>
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
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div>signed in as</div>
        <div style={{ color: 'var(--ink)' }}>@{session.username}</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <button
            onClick={lockNow}
            style={{
              background: 'transparent',
              border: '1px solid var(--line)',
              borderRadius: 99,
              padding: '4px 10px',
              fontSize: 10,
              color: 'var(--ink-2)',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
            }}
            title="clear cached keys, require passphrase next"
          >
            lock
          </button>
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
            }}
          >
            sign out
          </button>
        </div>
      </div>
    </aside>
  )
}
