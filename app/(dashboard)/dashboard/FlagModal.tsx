'use client'

import { useState } from 'react'

type Reason =
  | 'harassment'
  | 'doxxing'
  | 'self_harm'
  | 'spam'
  | 'inappropriate'
  | 'other'

const REASONS: Array<{ k: Reason; label: string; blurb: string }> = [
  {
    k: 'harassment',
    label: 'Harassment',
    blurb: 'targeted bullying, threats, repeated abuse',
  },
  {
    k: 'doxxing',
    label: 'Doxxing',
    blurb: 'leaked address, phone, family info, location',
  },
  {
    k: 'self_harm',
    label: 'Self-harm',
    blurb: 'content encouraging self-harm or suicide',
  },
  {
    k: 'inappropriate',
    label: 'Inappropriate',
    blurb: 'sexual content, slurs, hate speech',
  },
  { k: 'spam', label: 'Spam', blurb: 'mass-sent / commercial / not a person' },
  { k: 'other', label: 'Other', blurb: 'something else worth flagging' },
]

type Props = {
  open: boolean
  onClose: () => void
  onFlagged: () => void
  messageId: string
  plaintext: string
}

export function FlagModal({
  open,
  onClose,
  onFlagged,
  messageId,
  plaintext,
}: Props) {
  const [reason, setReason] = useState<Reason | null>(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function submit() {
    if (!reason) {
      setError('Pick a reason')
      return
    }
    setSubmitting(true)
    setError(null)
    const res = await fetch('/api/messages/flag', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        messageId,
        reportedPlaintext: plaintext,
        reason,
        note: note.trim() || null,
      }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError((body as { error?: string }).error ?? 'Could not flag')
      setSubmitting(false)
      return
    }
    setDone(true)
    setTimeout(() => {
      onFlagged()
      handleClose()
    }, 1200)
  }

  function handleClose() {
    setReason(null)
    setNote('')
    setError(null)
    setSubmitting(false)
    setDone(false)
    onClose()
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--line)',
          padding: 24,
          maxWidth: 480,
          width: '100%',
          maxHeight: '92vh',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <p className="eyebrow" style={{ marginBottom: 4 }}>
              ● flag this whisper
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 24,
                margin: 0,
                letterSpacing: '-0.015em',
                lineHeight: 1.1,
              }}
            >
              Send to staff review
            </h2>
            <p
              style={{
                fontSize: 13,
                color: 'var(--ink-2)',
                margin: '6px 0 0',
                lineHeight: 1.5,
              }}
            >
              By flagging, you&apos;re voluntarily sharing this message&apos;s
              plaintext with our staff. They&apos;ll never see your
              un-flagged messages.
            </p>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1px solid var(--line)',
              background: 'transparent',
              color: 'var(--ink)',
              cursor: 'pointer',
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {done ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 0',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'var(--accent)',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                fontSize: 20,
                margin: '0 auto 16px',
              }}
            >
              ✓
            </div>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 18,
                margin: 0,
              }}
            >
              Sent to staff. Thank you.
            </p>
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {REASONS.map((r) => (
                <button
                  key={r.k}
                  onClick={() => setReason(r.k)}
                  style={{
                    textAlign: 'left',
                    padding: '12px 14px',
                    background: 'var(--bubble)',
                    border: `1.5px solid ${
                      reason === r.k ? 'var(--accent)' : 'var(--line)'
                    }`,
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    color: 'var(--ink)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 2,
                    }}
                  >
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background:
                          reason === r.k
                            ? 'var(--accent)'
                            : 'var(--line)',
                      }}
                    />
                    <span style={{ fontWeight: 600, fontSize: 14 }}>
                      {r.label}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: '0 0 0 20px',
                      fontSize: 12,
                      color: 'var(--ink-2)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {r.blurb}
                  </p>
                </button>
              ))}
            </div>

            <div>
              <label
                className="eyebrow"
                style={{ display: 'block', marginBottom: 6 }}
              >
                anything to add? (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 280))}
                placeholder="context, prior pattern, etc."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius)',
                  border: '1.5px solid var(--line)',
                  background: 'var(--bubble)',
                  color: 'var(--ink)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 14,
                  resize: 'vertical',
                  minHeight: 60,
                  outline: 'none',
                }}
              />
              <div
                style={{
                  textAlign: 'right',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--ink-2)',
                  marginTop: 4,
                }}
              >
                {note.length}/280
              </div>
            </div>

            {error && (
              <p
                style={{
                  color: '#C04A2B',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  margin: 0,
                }}
              >
                {error}
              </p>
            )}

            <div
              style={{
                display: 'flex',
                gap: 10,
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={handleClose}
                className="btn ghost"
                style={{ padding: '10px 16px', fontSize: 14 }}
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={submitting || !reason}
                className="btn accent"
                style={{
                  padding: '10px 16px',
                  fontSize: 14,
                  opacity: submitting || !reason ? 0.5 : 1,
                  cursor:
                    submitting || !reason ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'Sending…' : 'Flag for review'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
