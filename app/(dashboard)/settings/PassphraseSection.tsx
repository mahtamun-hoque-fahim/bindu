'use client'

import { useState } from 'react'
import { Section, FieldLabel, Input, Note } from './Section'
import { clientRotatePassphrase } from '@/lib/auth/client'
import {
  estimatePassphraseStrength,
  validatePassphrase,
} from '@/lib/auth/validation'
import { generatePassphrase } from '@/lib/auth/diceware'

export function PassphraseSection() {
  const [open, setOpen] = useState(false)
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [status, setStatus] = useState<
    'idle' | 'rotating' | 'done' | 'error'
  >('idle')
  const [error, setError] = useState<string | null>(null)

  function suggest() {
    const phrase = generatePassphrase(6)
    setNewPass(phrase)
    setConfirmPass(phrase)
  }

  function reset() {
    setCurrentPass('')
    setNewPass('')
    setConfirmPass('')
    setConfirmed(false)
    setError(null)
    setStatus('idle')
  }

  async function rotate() {
    setError(null)
    if (newPass !== confirmPass) {
      setError("Confirmation doesn't match")
      return
    }
    const check = validatePassphrase(newPass)
    if (!check.ok) {
      setError(check.reason)
      return
    }
    if (newPass === currentPass) {
      setError('New passphrase must differ from the current one')
      return
    }

    setStatus('rotating')
    const result = await clientRotatePassphrase(currentPass, newPass)
    if (!result.ok) {
      setError(result.error)
      setStatus('error')
      return
    }
    setStatus('done')
    setTimeout(() => {
      setOpen(false)
      reset()
    }, 1800)
  }

  const strength = newPass ? estimatePassphraseStrength(newPass) : null

  return (
    <Section
      title="Passphrase"
      subtitle="Your passphrase wraps the key that decrypts your inbox. We can't recover it for you — if you lose it your inbox is gone forever."
    >
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="btn ghost"
          style={{ padding: '10px 16px', fontSize: 14 }}
        >
          Change passphrase
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <FieldLabel>current passphrase</FieldLabel>
            <Input
              type="password"
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: 6,
              }}
            >
              <FieldLabel>new passphrase</FieldLabel>
              <button
                type="button"
                onClick={suggest}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                ↻ suggest one
              </button>
            </div>
            <Input
              type="text"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              autoComplete="new-password"
              spellCheck={false}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            {strength && (
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  height: 4,
                  marginTop: 6,
                }}
              >
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      borderRadius: 4,
                      background:
                        i < strength.score ? 'var(--accent)' : 'var(--line)',
                    }}
                  />
                ))}
              </div>
            )}
            {strength && (
              <Note>strength: {strength.label}</Note>
            )}
          </div>

          <div>
            <FieldLabel>confirm new passphrase</FieldLabel>
            <Input
              type="password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              autoComplete="new-password"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: 14,
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              background: 'var(--bg)',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              style={{ marginTop: 3, accentColor: 'var(--accent)' }}
            />
            <span style={{ fontSize: 14, lineHeight: 1.5 }}>
              I&apos;ve saved the new passphrase somewhere safe. I understand
              that if I lose it, <strong>my inbox is gone forever</strong>.
            </span>
          </label>

          {error && <Note tone="err">{error}</Note>}
          {status === 'done' && <Note tone="ok">● passphrase rotated</Note>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => {
                setOpen(false)
                reset()
              }}
              className="btn ghost"
              style={{ padding: '10px 16px', fontSize: 14 }}
            >
              Cancel
            </button>
            <button
              onClick={rotate}
              disabled={
                status === 'rotating' ||
                !currentPass ||
                !newPass ||
                !confirmPass ||
                !confirmed
              }
              className="btn accent"
              style={{
                padding: '10px 16px',
                fontSize: 14,
                opacity:
                  status === 'rotating' ||
                  !currentPass ||
                  !newPass ||
                  !confirmPass ||
                  !confirmed
                    ? 0.5
                    : 1,
                cursor:
                  status === 'rotating' ||
                  !currentPass ||
                  !newPass ||
                  !confirmPass ||
                  !confirmed
                    ? 'not-allowed'
                    : 'pointer',
              }}
            >
              {status === 'rotating' ? 'Rotating…' : 'Rotate passphrase'}
            </button>
          </div>
        </div>
      )}
    </Section>
  )
}
