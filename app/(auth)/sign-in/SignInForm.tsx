'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { clientSignIn } from '@/lib/auth/client'

export function SignInForm() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const result = await clientSignIn(
      username.trim().toLowerCase(),
      passphrase,
    )
    if (!result.ok) {
      setError(result.error)
      setSubmitting(false)
      return
    }
    router.push('/dashboard')
  }

  return (
    <div
      style={{
        background: 'var(--bubble)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-lg)',
        padding: 32,
      }}
    >
      <p className="eyebrow" style={{ marginBottom: 12 }}>
        ● welcome back
      </p>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 42,
          margin: '0 0 8px',
          letterSpacing: '-0.03em',
          lineHeight: 1.02,
        }}
      >
        Unlock your <em style={{ color: 'var(--accent)' }}>inbox</em>
      </h1>
      <p
        style={{
          color: 'var(--ink-2)',
          margin: '0 0 24px',
          fontSize: 15,
          lineHeight: 1.5,
        }}
      >
        Your passphrase unwraps your private key in your browser. We never
        see it.
      </p>

      <form onSubmit={submit}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            border: '1.5px solid var(--line)',
            borderRadius: 'var(--radius)',
            padding: '14px 18px',
            gap: 8,
            marginBottom: 12,
            background: 'var(--bg)',
          }}
        >
          <span
            style={{
              color: 'var(--ink-2)',
              fontFamily: 'var(--font-mono)',
              fontSize: 14,
            }}
          >
            bindu.app/
          </span>
          <input
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="yourname"
            autoComplete="username"
            spellCheck={false}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--ink)',
              fontFamily: 'var(--font-mono)',
              fontSize: 16,
            }}
          />
        </label>
        <input
          type="password"
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
            marginBottom: 8,
          }}
        />
        <p
          style={{
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            color: 'var(--ink-2)',
            margin: '0 0 18px',
          }}
        >
          unwrapping may take a moment on slower devices.
        </p>

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
          disabled={submitting || !username || !passphrase}
          className="btn accent"
          style={{
            width: '100%',
            justifyContent: 'center',
            opacity: submitting || !username || !passphrase ? 0.5 : 1,
            cursor:
              submitting || !username || !passphrase ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Unlocking…' : 'Unlock inbox →'}
        </button>
      </form>

      <p
        style={{
          marginTop: 22,
          textAlign: 'center',
          color: 'var(--ink-2)',
          fontSize: 13,
        }}
      >
        No inbox yet?{' '}
        <Link
          href="/sign-up"
          style={{ color: 'var(--ink)', textDecoration: 'underline' }}
        >
          Sign up →
        </Link>
      </p>

      <p
        style={{
          marginTop: 12,
          textAlign: 'center',
          color: 'var(--ink-2)',
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
        }}
      >
        forgot your passphrase? we genuinely can&apos;t recover it — see FAQ.
      </p>
    </div>
  )
}
