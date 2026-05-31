'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { clientSignUp } from '@/lib/auth/client'
import {
  validateUsername,
  estimatePassphraseStrength,
  normalizeUsername,
} from '@/lib/auth/validation'
import { generatePassphrase, entropyBits } from '@/lib/auth/diceware'

type Step = 'username' | 'passphrase' | 'creating' | 'done'

export function SignUpForm({ initialUsername }: { initialUsername: string }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('username')

  // Step 1
  const [username, setUsername] = useState(initialUsername)
  const [usernameStatus, setUsernameStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken' | 'invalid'
  >('idle')
  const [usernameReason, setUsernameReason] = useState<string | null>(null)

  // Step 2
  const [passphrase, setPassphrase] = useState(() => generatePassphrase(6))
  const [confirmed, setConfirmed] = useState(false)
  const [copied, setCopied] = useState(false)

  // Step 3
  const [error, setError] = useState<string | null>(null)

  // Debounced username check
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (checkTimer.current) clearTimeout(checkTimer.current)
    setUsernameReason(null)
    if (!username) {
      setUsernameStatus('idle')
      return
    }
    const check = validateUsername(username)
    if (!check.ok) {
      setUsernameStatus('invalid')
      setUsernameReason(check.reason)
      return
    }
    setUsernameStatus('checking')
    checkTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/user/check-username?u=${encodeURIComponent(normalizeUsername(username))}`,
        )
        const body = (await res.json()) as {
          available: boolean
          reason: string | null
        }
        if (body.available) {
          setUsernameStatus('available')
        } else {
          setUsernameStatus('taken')
          setUsernameReason(body.reason ?? 'Already taken')
        }
      } catch {
        // network blip — let the user click through
        setUsernameStatus('available')
      }
    }, 350)
    return () => {
      if (checkTimer.current) clearTimeout(checkTimer.current)
    }
  }, [username])

  function regen() {
    setPassphrase(generatePassphrase(6))
    setConfirmed(false)
    setCopied(false)
  }

  async function copyPassphrase() {
    try {
      await navigator.clipboard.writeText(passphrase)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // permission-denied — fall through, the user will write it down anyway
    }
  }

  async function submit() {
    setStep('creating')
    setError(null)
    const result = await clientSignUp(normalizeUsername(username), passphrase)
    if (!result.ok) {
      setError(result.error)
      setStep('passphrase')
      return
    }
    setStep('done')
    router.push('/dashboard')
  }

  const strength = estimatePassphraseStrength(passphrase)

  return (
    <div>
      <ProgressDots step={step} />
      {step === 'username' && (
        <Card>
          <Header
            eyebrow="● step 1 of 2"
            title="Pick your @username"
            subtitle="This is the link you share. bindu.app/your-name."
          />
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              border: `1.5px solid ${
                usernameStatus === 'taken' || usernameStatus === 'invalid'
                  ? '#C04A2B'
                  : 'var(--line)'
              }`,
              borderRadius: 'var(--radius)',
              padding: '14px 18px',
              gap: 8,
              marginBottom: 8,
              background: 'var(--bubble)',
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
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="yourname"
              maxLength={20}
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
            <UsernameIndicator status={usernameStatus} />
          </label>
          <p
            style={{
              fontSize: 13,
              minHeight: 18,
              color:
                usernameStatus === 'taken' || usernameStatus === 'invalid'
                  ? '#C04A2B'
                  : 'var(--ink-2)',
              marginBottom: 24,
              fontFamily: 'var(--font-mono)',
            }}
          >
            {usernameReason ??
              (usernameStatus === 'available'
                ? 'Available ✓'
                : usernameStatus === 'checking'
                  ? 'Checking…'
                  : '3–20 chars. letters, numbers, . and _')}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setStep('passphrase')}
              disabled={usernameStatus !== 'available'}
              className="btn accent"
              style={{
                width: '100%',
                justifyContent: 'center',
                opacity: usernameStatus === 'available' ? 1 : 0.5,
                cursor:
                  usernameStatus === 'available' ? 'pointer' : 'not-allowed',
              }}
            >
              Next →
            </button>
          </div>
          <Footer signin />
        </Card>
      )}

      {step === 'passphrase' && (
        <Card>
          <Header
            eyebrow="● step 2 of 2"
            title="This is your only key"
            subtitle="Write it down. Save it in a password manager. We literally cannot recover it — by design."
          />

          <div
            style={{
              background: 'var(--bg-2)',
              borderRadius: 'var(--radius)',
              padding: 22,
              marginBottom: 14,
              fontFamily: 'var(--font-mono)',
              fontSize: 18,
              lineHeight: 1.5,
              letterSpacing: '0.01em',
              wordBreak: 'break-word',
              userSelect: 'all',
              border: '1px dashed var(--line)',
              position: 'relative',
            }}
          >
            {passphrase}
            <div
              style={{
                position: 'absolute',
                top: 8,
                right: 10,
                fontSize: 11,
                color: 'var(--ink-2)',
              }}
            >
              ~{Math.round(entropyBits(6))} bits
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 22,
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={copyPassphrase}
              className="btn ghost"
              style={{ padding: '10px 14px', fontSize: 13 }}
            >
              {copied ? '✓ Copied' : '↗ Copy'}
            </button>
            <button
              onClick={regen}
              className="btn ghost"
              style={{ padding: '10px 14px', fontSize: 13 }}
            >
              ↻ New phrase
            </button>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                color: 'var(--ink-2)',
                fontFamily: 'var(--font-mono)',
                marginLeft: 'auto',
              }}
            >
              <input
                type="text"
                placeholder="or type your own"
                value={passphrase}
                onChange={(e) => {
                  setPassphrase(e.target.value)
                  setConfirmed(false)
                }}
                style={{
                  width: 0,
                  height: 0,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  color: 'var(--ink)',
                }}
              />
            </label>
          </div>

          <StrengthMeter score={strength.score} label={strength.label} />

          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: 14,
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              background: 'var(--bubble)',
              cursor: 'pointer',
              marginTop: 14,
              marginBottom: 18,
            }}
          >
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              style={{ marginTop: 3, accentColor: 'var(--accent)' }}
            />
            <span style={{ fontSize: 14, lineHeight: 1.5 }}>
              I&apos;ve saved this passphrase somewhere safe. I understand
              that if I lose it,{' '}
              <strong>my inbox is gone forever</strong> — Bindu cannot
              recover it.
            </span>
          </label>

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

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setStep('username')}
              className="btn ghost"
              style={{ flex: '0 0 auto', padding: '14px 20px' }}
            >
              ← Back
            </button>
            <button
              onClick={submit}
              disabled={!confirmed}
              className="btn accent"
              style={{
                flex: 1,
                justifyContent: 'center',
                opacity: confirmed ? 1 : 0.5,
                cursor: confirmed ? 'pointer' : 'not-allowed',
              }}
            >
              Create my inbox →
            </button>
          </div>
        </Card>
      )}

      {step === 'creating' && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
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
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 26,
                margin: '0 0 8px',
                letterSpacing: '-0.015em',
              }}
            >
              Spinning up your inbox
            </h2>
            <p
              style={{
                color: 'var(--ink-2)',
                margin: 0,
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
              }}
            >
              generating keys · wrapping under your passphrase · saving
            </p>
          </div>
        </Card>
      )}

      {step === 'done' && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'var(--accent)',
                margin: '0 auto 22px',
                display: 'grid',
                placeItems: 'center',
                color: '#fff',
                fontSize: 24,
              }}
            >
              ✓
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 26,
                margin: '0 0 8px',
              }}
            >
              You&apos;re in.
            </h2>
            <p style={{ color: 'var(--ink-2)' }}>Taking you to your inbox…</p>
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────

function ProgressDots({ step }: { step: Step }) {
  const map: Record<Step, number> = {
    username: 0,
    passphrase: 1,
    creating: 2,
    done: 2,
  }
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 24,
      }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: i <= map[step] ? 'var(--accent)' : 'var(--line)',
            transition: 'background .2s ease',
          }}
        />
      ))}
    </div>
  )
}

function Header({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string
  title: string
  subtitle: string
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <p className="eyebrow" style={{ marginBottom: 10 }}>
        {eyebrow}
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
        {title}
      </h1>
      <p
        style={{
          color: 'var(--ink-2)',
          margin: 0,
          fontSize: 15,
          lineHeight: 1.5,
        }}
      >
        {subtitle}
      </p>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--bubble)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-lg)',
        padding: 32,
      }}
    >
      {children}
    </div>
  )
}

function Footer({ signin }: { signin?: boolean }) {
  return (
    <p
      style={{
        marginTop: 22,
        textAlign: 'center',
        color: 'var(--ink-2)',
        fontSize: 13,
      }}
    >
      {signin ? 'Already have an inbox? ' : 'New to Bindu? '}
      <Link
        href={signin ? '/sign-in' : '/sign-up'}
        style={{ color: 'var(--ink)', textDecoration: 'underline' }}
      >
        {signin ? 'Sign in →' : 'Sign up →'}
      </Link>
    </p>
  )
}

function UsernameIndicator({
  status,
}: {
  status: 'idle' | 'checking' | 'available' | 'taken' | 'invalid'
}) {
  if (status === 'idle') return null
  if (status === 'checking')
    return (
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          border: '2px solid var(--line)',
          borderTopColor: 'var(--accent)',
          animation: 'spin 0.8s linear infinite',
        }}
      />
    )
  if (status === 'available')
    return (
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: 'var(--accent)',
          display: 'grid',
          placeItems: 'center',
          color: '#fff',
          fontSize: 11,
        }}
      >
        ✓
      </span>
    )
  return (
    <span
      style={{
        width: 18,
        height: 18,
        borderRadius: '50%',
        background: '#C04A2B',
        display: 'grid',
        placeItems: 'center',
        color: '#fff',
        fontSize: 11,
      }}
    >
      ✕
    </span>
  )
}

function StrengthMeter({ score, label }: { score: number; label: string }) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: 4,
          height: 4,
          marginBottom: 6,
        }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              borderRadius: 4,
              background: i < score ? 'var(--accent)' : 'var(--line)',
            }}
          />
        ))}
      </div>
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--ink-2)',
          margin: 0,
        }}
      >
        strength: {label}
      </p>
    </div>
  )
}
