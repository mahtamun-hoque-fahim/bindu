'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'

export default function SignUpForm() {
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
    await signIn('credentials', {
      email: form.email,
      password: form.password,
      callbackUrl: '/dashboard',
    })
  }

  const canSubmit = form.email && form.username && form.password.length >= 8

  return (
    <div
      className="rounded-xl p-6"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
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
