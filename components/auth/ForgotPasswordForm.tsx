'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!email) return
    setLoading(true)
    setError('')
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      // Always show success — never reveal whether email exists
      setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div
        className="rounded-xl p-6 text-center"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="text-3xl mb-4">📬</div>
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
          Check your inbox
        </p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          If an account exists for <span style={{ color: 'var(--accent)' }}>{email}</span>, you'll
          receive a reset link within a minute.
        </p>
        <Link
          href="/sign-in"
          className="mt-6 inline-block text-xs font-medium hover:opacity-80"
          style={{ color: 'var(--accent)' }}
        >
          ← Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl p-6"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="mb-4">
        <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-md px-3 py-2.5 text-sm outline-none transition-colors"
          style={{
            background: 'var(--surface-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
      </div>

      {error && (
        <p className="text-xs mb-3" style={{ color: 'var(--destructive)' }}>
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !email}
        className="w-full text-sm font-semibold py-2.5 rounded-md transition-opacity mb-4"
        style={{
          background: email ? 'var(--accent)' : 'var(--surface-elevated)',
          color: email ? '#000' : 'var(--text-disabled)',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Sending…' : 'Send reset link'}
      </button>

      <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
        <Link href="/sign-in" className="font-medium hover:opacity-80" style={{ color: 'var(--accent)' }}>
          ← Back to sign in
        </Link>
      </p>
    </div>
  )
}
