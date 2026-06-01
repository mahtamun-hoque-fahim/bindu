'use client'

import { useState } from 'react'
import {
  deriveKek,
  unwrapPrivateKey,
  WrongPassphraseError,
  type WrappedPrivateKey,
} from '@/lib/crypto'
import { base64ToBytes } from '@/lib/utils'
import { cachePrivateKey } from '@/lib/key-cache'

export function UnlockGate({ onUnlocked }: { onUnlocked: () => void }) {
  const [passphrase, setPassphrase] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!passphrase) return
    setSubmitting(true)
    setError(null)

    try {
      // Pull the wrapped private key
      const res = await fetch('/api/user/encrypted-key')
      if (!res.ok) {
        setError('Could not fetch your encrypted key — try signing out and back in.')
        setSubmitting(false)
        return
      }
      const body = (await res.json()) as {
        encPrivKey: WrappedPrivateKey
      }
      const saltBytes = base64ToBytes(body.encPrivKey.salt)
      const kek = await deriveKek(passphrase, saltBytes)
      const privKey = await unwrapPrivateKey(body.encPrivKey, kek)
      await cachePrivateKey(privKey)
      onUnlocked()
    } catch (err) {
      if (err instanceof WrongPassphraseError) {
        setError('Wrong passphrase.')
      } else {
        setError('Could not unlock — try again.')
      }
      setSubmitting(false)
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--ink)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 460,
          background: 'var(--bubble)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-lg)',
          padding: 32,
        }}
      >
        <p className="eyebrow" style={{ marginBottom: 12 }}>
          ● inbox locked
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 36,
            margin: '0 0 8px',
            letterSpacing: '-0.025em',
            lineHeight: 1.05,
          }}
        >
          Unlock to read
        </h1>
        <p
          style={{
            color: 'var(--ink-2)',
            margin: '0 0 22px',
            fontSize: 15,
            lineHeight: 1.5,
          }}
        >
          Your inbox is encrypted. We need your passphrase to unwrap your
          private key — in your browser, not on our servers.
        </p>

        <form onSubmit={submit}>
          <input
            type="password"
            autoFocus
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="your passphrase"
            autoComplete="current-password"
            style={{
              display: 'block',
              width: '100%',
              padding: '14px 18px',
              border: '1.5px solid var(--line)',
              borderRadius: 'var(--radius)',
              background: 'var(--bg)',
              color: 'var(--ink)',
              fontFamily: 'var(--font-mono)',
              fontSize: 16,
              outline: 'none',
              marginBottom: 14,
            }}
          />
          {error && (
            <p
              style={{
                color: '#C04A2B',
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                marginBottom: 14,
              }}
            >
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting || !passphrase}
            className="btn accent"
            style={{
              width: '100%',
              justifyContent: 'center',
              opacity: submitting || !passphrase ? 0.5 : 1,
              cursor: submitting || !passphrase ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Unlocking…' : 'Unlock'}
          </button>
        </form>
      </div>
    </main>
  )
}
