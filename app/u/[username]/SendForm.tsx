'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  importPublicJwk,
  encryptToRecipient,
  getOrCreateDeviceId,
  deriveSenderHash,
} from '@/lib/crypto'

type Props = {
  recipientId: string
  username: string
  displayName: string | null
  bio: string | null
  pubKey: JsonWebKey
}

const MOODS = ['🫶', '🔥', '👀', '😭', '💀', '✨', '🤝', '🥲'] as const
type Mood = (typeof MOODS)[number]

// Match the server cap (200 chars free in v1 — paid tier raises this later).
const MAX_CHARS = 200

type State =
  | { kind: 'composing' }
  | { kind: 'sending' }
  | { kind: 'sent' }
  | { kind: 'error'; message: string }

export function SendForm({
  recipientId,
  username,
  displayName,
  bio,
  pubKey,
}: Props) {
  const [msg, setMsg] = useState('')
  const [mood, setMood] = useState<Mood | null>(null)
  const [state, setState] = useState<State>({ kind: 'composing' })

  // Sender hash — derived once on mount, never shown to the sender.
  // The recipient sees it, not us.
  const senderHashRef = useRef<string | null>(null)
  useEffect(() => {
    ;(async () => {
      try {
        const deviceId = getOrCreateDeviceId()
        senderHashRef.current = await deriveSenderHash(deviceId, recipientId)
      } catch {
        // crypto unavailable — let send fail explicitly later
      }
    })()
  }, [recipientId])

  async function send() {
    const text = msg.trim()
    if (!text) return
    setState({ kind: 'sending' })

    try {
      const senderHash = senderHashRef.current
      if (!senderHash) throw new Error('Could not derive sender hash')

      const recipientPub = await importPublicJwk(pubKey)
      const encrypted = await encryptToRecipient(text, recipientPub)

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          recipientId,
          ciphertext: encrypted.ciphertext,
          iv: encrypted.iv,
          ephemeralPubKey: encrypted.ephemeralPubKey,
          senderHash,
          mood,
        }),
      })

      if (!res.ok) {
        let serverError = 'Could not send'
        try {
          const body = (await res.json()) as { error?: string }
          if (body.error) serverError = body.error
        } catch {}
        setState({ kind: 'error', message: serverError })
        return
      }

      // Small artificial delay to land animation
      await new Promise((r) => setTimeout(r, 400))
      setState({ kind: 'sent' })
    } catch (err) {
      setState({
        kind: 'error',
        message:
          err instanceof Error ? err.message : 'Encryption failed',
      })
    }
  }

  function reset() {
    setMsg('')
    setMood(null)
    setState({ kind: 'composing' })
  }

  return (
    <main
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
      }}
    >
      {/* Brand bar */}
      <Link
        href="/"
        style={{
          position: 'absolute',
          top: 20,
          left: 24,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          textDecoration: 'none',
          color: 'var(--ink-2)',
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: 'var(--accent)',
          }}
        />
        bindu
      </Link>

      <div style={{ width: '100%', maxWidth: 460 }}>
        {state.kind === 'composing' || state.kind === 'error' ? (
          <Composer
            username={username}
            displayName={displayName}
            bio={bio}
            msg={msg}
            setMsg={setMsg}
            mood={mood}
            setMood={setMood}
            onSend={send}
            error={state.kind === 'error' ? state.message : null}
          />
        ) : state.kind === 'sending' ? (
          <Sending />
        ) : (
          <Sent reset={reset} msg={msg} mood={mood} username={username} />
        )}

        {/* Trust footer — always visible */}
        <p
          style={{
            marginTop: 24,
            textAlign: 'center',
            color: 'var(--ink-2)',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            lineHeight: 1.6,
          }}
        >
          ● end-to-end encrypted · @{username} can&apos;t see who you are
          <br />
          <Link
            href="/sign-up"
            style={{ color: 'var(--ink)', textDecoration: 'underline' }}
          >
            get your own bindu →
          </Link>
        </p>
      </div>
    </main>
  )
}

// ─── Composer ─────────────────────────────────────────────────────────────

function Composer({
  username,
  displayName,
  bio,
  msg,
  setMsg,
  mood,
  setMood,
  onSend,
  error,
}: {
  username: string
  displayName: string | null
  bio: string | null
  msg: string
  setMsg: (v: string) => void
  mood: Mood | null
  setMood: (m: Mood | null) => void
  onSend: () => void
  error: string | null
}) {
  const canSend = msg.trim().length > 0

  return (
    <div
      style={{
        background: 'var(--bubble)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-lg)',
        padding: 22,
        boxShadow: '0 20px 60px -30px var(--ink)',
      }}
    >
      {/* Recipient header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          paddingBottom: 16,
          borderBottom: '1px solid var(--line)',
          marginBottom: 16,
        }}
      >
        <span
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'var(--accent)',
            flexShrink: 0,
          }}
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: 16,
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.01em',
            }}
          >
            {displayName ?? `@${username}`}
          </div>
          <div
            className="eyebrow"
            style={{ fontSize: 10, lineHeight: 1.4 }}
          >
            {bio ?? `@${username} · send me anything — anonymously`}
          </div>
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--ink-2)',
            textAlign: 'right',
            lineHeight: 1.4,
          }}
        >
          bindu.app
          <br />/{username}
        </div>
      </div>

      <textarea
        value={msg}
        onChange={(e) => setMsg(e.target.value.slice(0, MAX_CHARS))}
        placeholder="type something only you would say…"
        rows={4}
        autoFocus
        style={{
          width: '100%',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          color: 'var(--ink)',
          fontFamily: 'var(--font-sans)',
          fontSize: 18,
          lineHeight: 1.4,
          resize: 'none',
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          paddingTop: 14,
          borderTop: '1px solid var(--line)',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 4,
            flexWrap: 'wrap',
          }}
        >
          {MOODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMood(mood === m ? null : m)}
              aria-label={`Mood ${m}`}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border:
                  mood === m
                    ? '2px solid var(--accent)'
                    : '1px solid var(--line)',
                background: 'transparent',
                fontSize: 16,
                padding: 0,
                cursor: 'pointer',
                lineHeight: 1,
              }}
            >
              {m}
            </button>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginLeft: 'auto',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color:
                msg.length > MAX_CHARS - 20 ? 'var(--accent)' : 'var(--ink-2)',
            }}
          >
            {msg.length}/{MAX_CHARS}
          </span>
          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            className="btn accent"
            style={{
              padding: '10px 16px',
              fontSize: 14,
              opacity: canSend ? 1 : 0.4,
              cursor: canSend ? 'pointer' : 'not-allowed',
            }}
          >
            Send ●
          </button>
        </div>
      </div>

      {error && (
        <p
          style={{
            marginTop: 12,
            fontSize: 13,
            color: '#C04A2B',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {error}
        </p>
      )}
    </div>
  )
}

// ─── Sending ──────────────────────────────────────────────────────────────

function Sending() {
  return (
    <div
      style={{
        background: 'var(--bubble)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-lg)',
        padding: '60px 22px',
        textAlign: 'center',
      }}
    >
      <div
        className="pulse"
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'var(--accent)',
          margin: '0 auto 22px',
        }}
      />
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: 'var(--ink-2)',
          lineHeight: 1.6,
        }}
      >
        encrypting · stripping metadata · sending
      </div>
    </div>
  )
}

// ─── Sent ─────────────────────────────────────────────────────────────────

function Sent({
  reset,
  msg,
  mood,
  username,
}: {
  reset: () => void
  msg: string
  mood: Mood | null
  username: string
}) {
  return (
    <div
      style={{
        background: 'var(--bubble)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-lg)',
        padding: 22,
        boxShadow: '0 20px 60px -30px var(--ink)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          paddingBottom: 14,
          borderBottom: '1px solid var(--line)',
          marginBottom: 18,
        }}
      >
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            fontSize: 14,
          }}
        >
          ✓
        </span>
        <div>
          <div
            style={{
              fontWeight: 600,
              fontSize: 15,
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.01em',
            }}
          >
            Sent to @{username}
          </div>
          <div
            className="eyebrow"
            style={{ fontSize: 10, lineHeight: 1.4 }}
          >
            delivered anonymously · no trace
          </div>
        </div>
      </div>

      <div className="bubble you" style={{ marginBottom: 12 }}>
        {mood && <span style={{ marginRight: 8 }}>{mood}</span>}
        {msg}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 10,
          justifyContent: 'flex-end',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={reset}
          type="button"
          className="btn ghost"
          style={{ padding: '10px 14px', fontSize: 13 }}
        >
          Send another
        </button>
        <Link
          href="/sign-up"
          className="btn"
          style={{ padding: '10px 14px', fontSize: 13 }}
        >
          Get your own inbox
        </Link>
      </div>
    </div>
  )
}
