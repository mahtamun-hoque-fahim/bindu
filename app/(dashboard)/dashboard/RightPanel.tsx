'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import type { InboxMessage } from './types'

type Props = {
  messages: InboxMessage[]
  username: string
}

export function RightPanel({ messages, username }: Props) {
  // Mood breakdown (mood field on the message itself, set by sender)
  const moodCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const m of messages) {
      if (m.mood) counts[m.mood] = (counts[m.mood] ?? 0) + 1
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
  }, [messages])

  // Top sender hashes by message count
  const topHashes = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const m of messages) {
      counts[m.senderHash] = (counts[m.senderHash] ?? 0) + 1
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
  }, [messages])

  const totalMoods = moodCounts.reduce((s, [, n]) => s + n, 0) || 1

  return (
    <aside
      style={{
        background: 'var(--bg)',
        borderLeft: '1px solid var(--line)',
        padding: '20px 22px',
        overflowY: 'auto',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
      className="no-bar"
    >
      {/* Share card */}
      <section
        style={{
          background: 'var(--accent)',
          color: '#fff',
          borderRadius: 'var(--radius)',
          padding: 18,
        }}
      >
        <p
          className="eyebrow"
          style={{ color: 'rgba(255,255,255,0.75)', marginBottom: 8 }}
        >
          ● your link
        </p>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 15,
            margin: '0 0 14px',
            lineHeight: 1.4,
            wordBreak: 'break-all',
          }}
        >
          bindu.app/{username}
        </p>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => {
              const url =
                typeof window !== 'undefined'
                  ? `${window.location.origin}/u/${username}`
                  : ''
              navigator.clipboard?.writeText(url).catch(() => {})
            }}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 99,
              color: '#fff',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            ↗ copy
          </button>
          <Link
            href={`/u/${username}`}
            target="_blank"
            style={{
              flex: 1,
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 99,
              color: '#fff',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              cursor: 'pointer',
              textAlign: 'center',
              textDecoration: 'none',
            }}
          >
            preview →
          </Link>
        </div>
      </section>

      {/* Mood of the week */}
      <section>
        <p className="eyebrow" style={{ marginBottom: 10 }}>
          ● mood of the week
        </p>
        {moodCounts.length === 0 ? (
          <div
            style={{
              fontSize: 13,
              color: 'var(--ink-2)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            no moods yet
          </div>
        ) : (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            {moodCounts.map(([emoji, n]) => (
              <div
                key={emoji}
                style={{ display: 'flex', alignItems: 'center', gap: 10 }}
              >
                <span style={{ fontSize: 16, width: 24 }}>{emoji}</span>
                <div style={{ flex: 1, height: 6 }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(n / totalMoods) * 100}%`,
                      background: 'var(--accent)',
                      borderRadius: 3,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--ink-2)',
                    minWidth: 24,
                    textAlign: 'right',
                  }}
                >
                  {n}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Top hashes */}
      <section>
        <p className="eyebrow" style={{ marginBottom: 10 }}>
          ● top whisperers
        </p>
        {topHashes.length === 0 ? (
          <div
            style={{
              fontSize: 13,
              color: 'var(--ink-2)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            no senders yet
          </div>
        ) : (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
          >
            {topHashes.map(([hash, n]) => (
              <div
                key={hash}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 'var(--radius)',
                  background: 'var(--bg-2)',
                  fontSize: 13,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                  }}
                />
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  #{hash}
                </span>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--ink-2)',
                  }}
                >
                  {n} {n === 1 ? 'msg' : 'msgs'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bindu+ teaser */}
      <section
        style={{
          background: 'var(--bg-2)',
          border: '1px dashed var(--line)',
          borderRadius: 'var(--radius)',
          padding: 16,
          marginTop: 'auto',
        }}
      >
        <p className="eyebrow" style={{ marginBottom: 8 }}>
          ● bindu+
        </p>
        <p
          style={{
            fontSize: 13,
            color: 'var(--ink-2)',
            margin: '0 0 10px',
            lineHeight: 1.45,
          }}
        >
          Custom emoji moods, longer messages, group dots — coming v2.
        </p>
        <button
          disabled
          style={{
            background: 'transparent',
            border: '1px solid var(--line)',
            borderRadius: 99,
            padding: '6px 12px',
            fontSize: 11,
            color: 'var(--ink-2)',
            fontFamily: 'var(--font-mono)',
            cursor: 'not-allowed',
            opacity: 0.7,
          }}
        >
          Notify me
        </button>
      </section>
    </aside>
  )
}
