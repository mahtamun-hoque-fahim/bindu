'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!token) setError('Invalid or missing reset link. Please request a new one.')
  }, [token])

  async function handleSubmit() {
    if (!token || !password || !confirm) return
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        return
      }
      setDone(true)
      setTimeout(() => router.push('/sign-in'), 2500)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div
        className="rounded-xl p-6 text-center"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="text-3xl mb-4">✅</div>
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
          Password updated
        </p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Redirecting you to sign in…
        </p>
      </div>
    )
  }

  const canSubmit = token && password.length >= 8 && confirm.length >= 8

  return (
    <div
      className="rounded-xl p-6"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex flex-col gap-3 mb-4">
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>
            New password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 characters"
            className="w-full rounded-md px-3 py-2.5 text-sm outline-none transition-colors"
            style={{
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Confirm password
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat your password"
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
      </div>

      {error && (
        <p className="text-xs mb-3" style={{ color: 'var(--destructive)' }}>
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !canSubmit}
        className="w-full text-sm font-semibold py-2.5 rounded-md transition-opacity mb-4"
        style={{
          background: canSubmit ? 'var(--accent)' : 'var(--surface-elevated)',
          color: canSubmit ? '#000' : 'var(--text-disabled)',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Updating…' : 'Update password'}
      </button>

      <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
        <Link href="/sign-in" className="font-medium hover:opacity-80" style={{ color: 'var(--accent)' }}>
          ← Back to sign in
        </Link>
      </p>
    </div>
  )
}
