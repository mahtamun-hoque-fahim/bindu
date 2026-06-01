'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ProfileSection } from './ProfileSection'
import { ThemeSection } from './ThemeSection'
import { PassphraseSection } from './PassphraseSection'
import { MutedSection } from './MutedSection'
import { SecuritySection } from './SecuritySection'
import { DangerSection } from './DangerSection'

export type SettingsUser = {
  id: string
  username: string
  displayName: string | null
  bio: string | null
  theme: 'sunset' | 'acid' | 'dream'
  isStaff: boolean
  isAdmin: boolean
  createdAt: Date
}

export function SettingsView({ user }: { user: SettingsUser }) {
  const router = useRouter()

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--ink)',
      }}
    >
      {/* Top bar */}
      <header
        style={{
          padding: '18px 32px',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <Link
          href="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            color: 'var(--ink)',
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}
        >
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: 'var(--accent)',
            }}
          />
          bindu
        </Link>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            color: 'var(--ink-2)',
          }}
        >
          / settings
        </span>
        <Link
          href="/dashboard"
          style={{
            marginLeft: 'auto',
            color: 'var(--ink-2)',
            textDecoration: 'none',
            fontSize: 13,
          }}
        >
          ← back to inbox
        </Link>
      </header>

      <main
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '40px 24px 80px',
        }}
      >
        <p className="eyebrow" style={{ marginBottom: 8 }}>
          ● settings
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 5vw, 56px)',
            margin: '0 0 8px',
            letterSpacing: '-0.03em',
            lineHeight: 1.02,
          }}
        >
          Make it yours,{' '}
          <em style={{ color: 'var(--accent)' }}>@{user.username}</em>
        </h1>
        <p
          style={{
            color: 'var(--ink-2)',
            margin: '0 0 32px',
            fontSize: 15,
            lineHeight: 1.5,
          }}
        >
          Tune how your inbox looks and who it lets through. Everything here
          stays under your passphrase.
        </p>

        <div
          style={{ display: 'flex', flexDirection: 'column', gap: 32 }}
        >
          <ProfileSection user={user} onSaved={() => router.refresh()} />
          <ThemeSection user={user} onSaved={() => router.refresh()} />
          <PassphraseSection />
          <MutedSection />
          <SecuritySection username={user.username} />
          <DangerSection
            onDeleted={() => {
              router.push('/')
              router.refresh()
            }}
          />
        </div>
      </main>
    </div>
  )
}
