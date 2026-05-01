'use client'

import { useState } from 'react'
import type { User } from '@/lib/db/schema'

export default function SettingsForm({ user, appUrl }: { user: User; appUrl: string }) {
  const [emailNotifications, setEmailNotifications] = useState(
    user.emailNotifications ?? true
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = `${appUrl}/u/${user.username}`

  async function toggleNotifications() {
    const next = !emailNotifications
    setEmailNotifications(next)
    setSaving(true)
    setSaved(false)

    await fetch('/api/user/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailNotifications: next }),
    })

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Profile card */}
      <section
        className="rounded-lg p-5"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2
          className="text-sm font-semibold mb-4"
          style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}
        >
          Profile
        </h2>
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Display name</p>
            <p className="text-sm" style={{ color: 'var(--text)' }}>
              {user.displayName || '—'}
            </p>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Username</p>
            <p className="text-sm font-mono" style={{ color: 'var(--text)' }}>
              @{user.username}
            </p>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Email</p>
            <p className="text-sm" style={{ color: 'var(--text)' }}>
              {user.email || '—'}
            </p>
          </div>
        </div>
      </section>

      {/* Share link */}
      <section
        className="rounded-lg p-5"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2
          className="text-sm font-semibold mb-4"
          style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}
        >
          Your link
        </h2>
        <div
          className="flex items-center gap-2 rounded-md px-3 py-2.5"
          style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
        >
          <span
            className="text-sm flex-1 truncate"
            style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}
          >
            {shareUrl}
          </span>
          <button
            onClick={copyLink}
            className="text-xs font-medium shrink-0 hover:opacity-80 transition-opacity"
            style={{ color: 'var(--accent)' }}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--text-disabled)' }}>
          Share this link anywhere to receive anonymous messages.
        </p>
      </section>

      {/* Notifications */}
      <section
        className="rounded-lg p-5"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2
          className="text-sm font-semibold mb-4"
          style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}
        >
          Notifications
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[--text]">Email notifications</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Get an email when you receive a new message
            </p>
          </div>
          <button
            onClick={toggleNotifications}
            disabled={saving}
            className="relative w-10 h-5 rounded-full transition-colors shrink-0"
            style={{
              background: emailNotifications ? 'var(--accent)' : 'var(--surface-elevated)',
              border: '1px solid var(--border)',
            }}
          >
            <span
              className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
              style={{
                background: emailNotifications ? '#000' : 'var(--text-disabled)',
                left: emailNotifications ? '20px' : '2px',
              }}
            />
          </button>
        </div>
        {saved && (
          <p className="text-xs mt-3" style={{ color: 'var(--accent)' }}>
            ✓ Saved
          </p>
        )}
      </section>
    </div>
  )
}
