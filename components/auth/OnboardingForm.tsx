'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingForm({ currentUsername }: { currentUsername: string }) {
  const router = useRouter()
  const [username, setUsername] = useState(currentUsername || '')
  const [status, setStatus] = useState<'idle' | 'checking' | 'saving' | 'taken' | 'error'>('idle')
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
  const isValid = clean.length >= 3 && clean.length <= 32
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bindu.app'

  // Live availability check
  useEffect(() => {
    if (!isValid) return
    if (debounceTimer) clearTimeout(debounceTimer)
    setStatus('checking')
    const t = setTimeout(async () => {
      const res = await fetch(`/api/user/username/check?username=${clean}`)
      const { available } = await res.json()
      setStatus(available ? 'idle' : 'taken')
    }, 400)
    setDebounceTimer(t)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clean])

  async function save() {
    if (!isValid || status === 'taken') return
    setStatus('saving')
    const res = await fetch('/api/user/username', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: clean }),
    })
    if (!res.ok) {
      const d = await res.json()
      setStatus(d.error === 'Username already taken' ? 'taken' : 'error')
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  const canSave = isValid && status !== 'taken' && status !== 'saving' && status !== 'checking'

  return (
    <div
      className="rounded-xl p-6"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>
        Username
      </label>
      <div className="relative mb-2">
        <input
          type="text"
          value={username}
          onChange={(e) => { setUsername(e.target.value); setStatus('idle') }}
          placeholder="yourname"
          maxLength={32}
          className="w-full rounded-md px-3 py-2.5 text-sm outline-none pr-8 transition-colors"
          style={{
            background: 'var(--surface-elevated)',
            border: `1px solid ${status === 'taken' ? 'var(--destructive)' : isValid ? 'var(--accent)' : 'var(--border)'}`,
            color: 'var(--text)',
          }}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          autoFocus
        />
        {/* Status indicator */}
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs">
          {status === 'checking' && <span style={{ color: 'var(--text-disabled)' }}>…</span>}
          {status === 'idle' && isValid && <span style={{ color: 'var(--accent)' }}>✓</span>}
          {status === 'taken' && <span style={{ color: 'var(--destructive)' }}>✗</span>}
        </span>
      </div>

      {/* Status messages */}
      {status === 'taken' && (
        <p className="text-xs mb-3" style={{ color: 'var(--destructive)' }}>
          Username already taken
        </p>
      )}
      {status === 'error' && (
        <p className="text-xs mb-3" style={{ color: 'var(--destructive)' }}>
          Something went wrong. Try again.
        </p>
      )}

      {/* Preview */}
      {isValid && status !== 'taken' && (
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Your link will be{' '}
          <span style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>
            {appUrl.replace('https://', '')}/u/{clean}
          </span>
        </p>
      )}

      <button
        onClick={save}
        disabled={!canSave}
        className="w-full text-sm font-semibold py-2.5 rounded-md transition-all mt-2"
        style={{
          background: canSave ? 'var(--accent)' : 'var(--surface-elevated)',
          color: canSave ? '#000' : 'var(--text-disabled)',
          opacity: status === 'saving' ? 0.7 : 1,
          boxShadow: canSave ? '0 0 20px rgba(0,230,118,0.12)' : 'none',
        }}
      >
        {status === 'saving' ? 'Saving…' : 'Claim username →'}
      </button>

      <p className="text-xs text-center mt-4" style={{ color: 'var(--text-disabled)' }}>
        Only letters, numbers, and underscores. Min 3 chars.
      </p>
    </div>
  )
}
