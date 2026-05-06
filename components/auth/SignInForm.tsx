'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignInForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!email || !password) return
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (res?.error) {
      setError('Invalid email or password')
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div
      className="rounded-xl p-6"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex flex-col gap-3 mb-4">
        <div>
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
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs hover:opacity-80 transition-opacity"
              style={{ color: 'var(--accent)' }}
            >
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
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
        disabled={loading || !email || !password}
        className="w-full text-sm font-semibold py-2.5 rounded-md transition-opacity mb-4"
        style={{
          background: email && password ? 'var(--accent)' : 'var(--surface-elevated)',
          color: email && password ? '#000' : 'var(--text-disabled)',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>

      <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
        No account?{' '}
        <Link href="/sign-up" className="font-medium hover:opacity-80" style={{ color: 'var(--accent)' }}>
          Create one
        </Link>
      </p>
    </div>
  )
}
