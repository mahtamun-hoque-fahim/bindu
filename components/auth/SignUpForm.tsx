'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'

export default function SignUpForm() {
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      setLoading(false)
      return
    }
    // Auto sign-in after registration
    await signIn('credentials', {
      email: form.email,
      password: form.password,
      callbackUrl: '/dashboard',
    })
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    await signIn('google', { callbackUrl: '/dashboard' })
  }

  const canSubmit = form.email && form.username && form.password.length >= 8

  return (
    <div
      className="rounded-xl p-6"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {/* Google */}
      <button
        onClick={handleGoogle}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-3 text-sm font-medium py-2.5 rounded-md mb-5 transition-opacity"
        style={{
          background: 'var(--surface-elevated)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          opacity: googleLoading ? 0.7 : 1,
        }}
      >
        <GoogleIcon />
        {googleLoading ? 'Redirecting…' : 'Continue with Google'}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        <span className="text-xs" style={{ color: 'var(--text-disabled)' }}>or</span>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>

      <div className="flex flex-col gap-3 mb-4">
        {[
          { field: 'name', label: 'Display name', type: 'text', placeholder: 'Your name (optional)' },
          { field: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
          { field: 'username', label: 'Username', type: 'text', placeholder: 'yourname (used in your link)' },
          { field: 'password', label: 'Password', type: 'password', placeholder: 'Min 8 characters' },
        ].map(({ field, label, type, placeholder }) => (
          <div key={field}>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>
              {label}
            </label>
            <input
              type={type}
              value={form[field as keyof typeof form]}
              onChange={set(field as keyof typeof form)}
              placeholder={placeholder}
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
        ))}
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
        {loading ? 'Creating account…' : 'Create account'}
      </button>

      <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
        Already have an account?{' '}
        <Link href="/sign-in" className="font-medium hover:opacity-80" style={{ color: 'var(--accent)' }}>
          Sign in
        </Link>
      </p>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}
