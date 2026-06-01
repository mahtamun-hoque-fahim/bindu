'use client'

import { useState } from 'react'
import { timeAgo } from '@/lib/utils'
import { labelFor } from '@/lib/safety-filter'
import { MOODS, type InboxMessage } from './types'
import { StoryExportModal } from './StoryExportModal'
import type { Theme } from '@/components/providers/ThemeProvider'

type Props = {
  message: InboxMessage | null
  isMuted: boolean
  username: string
  theme: Theme
  onFavorite: () => void
  onDelete: () => void
  onMute: () => void
  onUnmute: () => void
  onReact: (emoji: string) => void
  onUnreact: (emoji: string) => void
}

export function MessageReader({
  message,
  isMuted,
  username,
  theme,
  onFavorite,
  onDelete,
  onMute,
  onUnmute,
  onReact,
  onUnreact,
}: Props) {
  const [revealed, setRevealed] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)

  if (!message) {
    return (
      <div
        style={{
          background: 'var(--bg-2)',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 280 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'var(--bg)',
              margin: '0 auto 16px',
              border: '1px dashed var(--line)',
            }}
          />
          <p
            style={{
              color: 'var(--ink-2)',
              fontSize: 14,
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            Pick a whisper from the list to read it.
          </p>
        </div>
      </div>
    )
  }

  const showPlaintext =
    message.plaintext !== null &&
    (message.safety.level !== 'hide' || revealed)

  return (
    <div
      style={{
        background: 'var(--bg-2)',
        height: '100vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
      className="no-bar"
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 30px',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          position: 'sticky',
          top: 0,
          background: 'var(--bg-2)',
          zIndex: 1,
        }}
      >
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: 'var(--accent)',
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>
            anon · <span style={{ fontFamily: 'var(--font-mono)' }}>#{message.senderHash}</span>
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--ink-2)',
              marginTop: 2,
            }}
          >
            received {timeAgo(message.createdAt)}
            {isMuted && (
              <span style={{ marginLeft: 8, color: '#C04A2B' }}>· muted</span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <ActionButton
          label={message.isFavorited ? 'Unfavorite' : 'Favorite'}
          icon={message.isFavorited ? '★' : '☆'}
          onClick={onFavorite}
          active={message.isFavorited}
        />
        <ActionButton
          label={isMuted ? 'Unmute' : 'Mute'}
          icon="⊘"
          onClick={isMuted ? onUnmute : onMute}
          active={isMuted}
        />
        <ActionButton
          label="Export to story"
          icon="↗"
          onClick={() => setExportOpen(true)}
          disabled={message.plaintext === null}
        />
        <ActionButton
          label="Delete"
          icon="×"
          onClick={() => setConfirmDelete(true)}
          danger
        />
      </div>

      {confirmDelete && (
        <div
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius)',
            padding: 16,
            margin: '16px 30px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 13 }}>Delete this whisper forever?</span>
          <button
            onClick={() => setConfirmDelete(false)}
            className="btn ghost"
            style={{
              padding: '6px 12px',
              fontSize: 12,
              marginLeft: 'auto',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              setConfirmDelete(false)
              onDelete()
            }}
            className="btn"
            style={{
              padding: '6px 12px',
              fontSize: 12,
              background: '#C04A2B',
              borderColor: '#C04A2B',
              color: '#fff',
            }}
          >
            Delete
          </button>
        </div>
      )}

      {/* Body */}
      <div style={{ padding: '40px 30px', flex: 1 }}>
        {message.plaintext === null ? (
          <DecryptError
            error={
              (message as { decryptError: string }).decryptError ??
              'Could not decrypt.'
            }
          />
        ) : (
          <>
            {message.safety.level !== 'clean' && (
              <SafetyBanner
                level={message.safety.level}
                reasons={message.safety.reasons}
                revealed={revealed}
                onReveal={() => setRevealed(true)}
              />
            )}

            {showPlaintext && (
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 28,
                  lineHeight: 1.35,
                  color: 'var(--ink)',
                  letterSpacing: '-0.015em',
                  maxWidth: 580,
                  marginBottom: 30,
                }}
              >
                {message.mood && (
                  <span style={{ marginRight: 12 }}>{message.mood}</span>
                )}
                {message.plaintext}
              </div>
            )}

            {/* Reactions */}
            <div
              style={{
                display: 'flex',
                gap: 6,
                flexWrap: 'wrap',
                marginBottom: 16,
              }}
            >
              {MOODS.map((emoji) => {
                const active = message.reactions.includes(emoji)
                return (
                  <button
                    key={emoji}
                    onClick={() =>
                      active ? onUnreact(emoji) : onReact(emoji)
                    }
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      border: active
                        ? '2px solid var(--accent)'
                        : '1px solid var(--line)',
                      background: active ? 'var(--bubble)' : 'transparent',
                      cursor: 'pointer',
                      fontSize: 16,
                      padding: 0,
                      transition: 'transform .12s ease',
                    }}
                  >
                    {emoji}
                  </button>
                )
              })}
            </div>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--ink-2)',
                margin: 0,
              }}
            >
              ● react privately · only you see this
            </p>
          </>
        )}
      </div>

      {message.plaintext !== null && (
        <StoryExportModal
          open={exportOpen}
          onClose={() => setExportOpen(false)}
          plaintext={message.plaintext}
          mood={message.mood}
          senderHash={message.senderHash}
          username={username}
          theme={theme}
        />
      )}
    </div>
  )
}

// ─── Bits ─────────────────────────────────────────────────────────────────

function ActionButton({
  label,
  icon,
  onClick,
  active,
  danger,
  disabled,
}: {
  label: string
  icon: string
  onClick: () => void
  active?: boolean
  danger?: boolean
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      disabled={disabled}
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        border: `1px solid ${
          danger ? '#C04A2B33' : active ? 'var(--accent)' : 'var(--line)'
        }`,
        background: active ? 'var(--accent)' : 'transparent',
        color: danger ? '#C04A2B' : active ? '#fff' : 'var(--ink)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        fontSize: 16,
      }}
    >
      {icon}
    </button>
  )
}

function SafetyBanner({
  level,
  reasons,
  revealed,
  onReveal,
}: {
  level: 'warn' | 'hide'
  reasons: ReadonlyArray<
    'phone' | 'email' | 'ipv4' | 'address' | 'self-harm' | 'slur'
  >
  revealed: boolean
  onReveal: () => void
}) {
  const isHidden = level === 'hide' && !revealed
  return (
    <div
      style={{
        background: 'var(--bg)',
        border: `1px solid ${level === 'hide' ? '#C04A2B' : 'var(--line)'}`,
        borderRadius: 'var(--radius)',
        padding: 16,
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          background: level === 'hide' ? '#C04A2B' : 'var(--bg-2)',
          color: level === 'hide' ? '#fff' : 'var(--ink-2)',
          display: 'grid',
          placeItems: 'center',
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        ⚠
      </span>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 16,
            fontWeight: 600,
            marginBottom: 4,
          }}
        >
          {level === 'hide'
            ? 'Hidden by your safety filter'
            : 'Heads up before reading'}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--ink-2)',
          }}
        >
          contains: {reasons.map(labelFor).join(', ')}
        </div>
      </div>
      {isHidden && (
        <button onClick={onReveal} className="btn ghost" style={{ padding: '8px 14px', fontSize: 12 }}>
          Show anyway
        </button>
      )}
    </div>
  )
}

function DecryptError({ error }: { error: string }) {
  return (
    <div
      style={{
        background: 'var(--bg)',
        border: '1px dashed var(--line)',
        borderRadius: 'var(--radius)',
        padding: 24,
        color: 'var(--ink-2)',
        fontFamily: 'var(--font-mono)',
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      <div style={{ marginBottom: 6, color: 'var(--ink)' }}>{error}</div>
      This usually means it was sent to a previous version of your key, or
      the sender&apos;s browser malformed the envelope. Nothing you can do
      from here.
    </div>
  )
}
