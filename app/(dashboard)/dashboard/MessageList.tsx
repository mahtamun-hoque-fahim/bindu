'use client'

import { timeAgo } from '@/lib/utils'
import type { InboxMessage } from './types'

type Props = {
  messages: InboxMessage[]
  selectedId: string | null
  onSelect: (id: string) => void
  loading: boolean
  mutedHashes: Set<string>
}

export function MessageList({
  messages,
  selectedId,
  onSelect,
  loading,
  mutedHashes,
}: Props) {
  return (
    <div
      style={{
        background: 'var(--bg)',
        borderRight: '1px solid var(--line)',
        overflowY: 'auto',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
      className="no-bar"
    >
      <div
        style={{
          padding: '18px 22px 14px',
          borderBottom: '1px solid var(--line)',
          position: 'sticky',
          top: 0,
          background: 'var(--bg)',
          zIndex: 1,
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 24,
            margin: 0,
            letterSpacing: '-0.015em',
          }}
        >
          Your whispers
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--ink-2)',
            margin: '6px 0 0',
          }}
        >
          ● {loading ? 'decrypting…' : `${messages.length} message${messages.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {loading && messages.length === 0 ? (
        <div
          style={{
            padding: 30,
            color: 'var(--ink-2)',
            fontSize: 13,
            fontFamily: 'var(--font-mono)',
          }}
        >
          decrypting your inbox…
        </div>
      ) : messages.length === 0 ? (
        <div
          style={{
            padding: '60px 30px',
            color: 'var(--ink-2)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--bg-2)',
              margin: '0 auto 14px',
            }}
          />
          <p style={{ fontSize: 14, margin: '0 0 4px' }}>No messages yet.</p>
          <p
            style={{
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              margin: 0,
            }}
          >
            share your link to receive your first whisper
          </p>
        </div>
      ) : (
        <div>
          {messages.map((m) => (
            <button
              key={m.id}
              onClick={() => onSelect(m.id)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background:
                  selectedId === m.id ? 'var(--bubble)' : 'transparent',
                border: 'none',
                borderBottom: '1px solid var(--line)',
                borderLeft:
                  selectedId === m.id
                    ? '3px solid var(--accent)'
                    : '3px solid transparent',
                padding: '14px 22px',
                cursor: 'pointer',
                color: 'var(--ink)',
                opacity: mutedHashes.has(m.senderHash) ? 0.5 : 1,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                {m.mood && <span style={{ fontSize: 14 }}>{m.mood}</span>}
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--ink-2)',
                  }}
                >
                  anon · #{m.senderHash}
                </span>
                {!m.isRead && (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                    }}
                  />
                )}
                {m.isFavorited && (
                  <span style={{ fontSize: 11 }}>★</span>
                )}
                {(m.isFlagged || m.safety.level !== 'clean') && (
                  <span
                    style={{
                      fontSize: 10,
                      color: '#C04A2B',
                    }}
                  >
                    ⚠
                  </span>
                )}
                <span
                  style={{
                    marginLeft: 'auto',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--ink-2)',
                  }}
                >
                  {timeAgo(m.createdAt)}
                </span>
              </div>
              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.4,
                  color: 'var(--ink)',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  filter:
                    m.safety.level === 'hide' && selectedId !== m.id
                      ? 'blur(5px)'
                      : 'none',
                }}
              >
                {m.plaintext ??
                  ((m as { decryptError: string }).decryptError ?? '—')}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
