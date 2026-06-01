'use client'

import { useState } from 'react'
import { Section, Note } from './Section'
import { useTheme } from '@/components/providers/ThemeProvider'
import type { SettingsUser } from './SettingsView'

type Props = {
  user: SettingsUser
  onSaved: () => void
}

const THEMES: Array<{
  k: 'sunset' | 'acid' | 'dream'
  label: string
  swatch: string
  blurb: string
}> = [
  {
    k: 'sunset',
    label: 'Sunset',
    swatch: '#E85D3B',
    blurb: 'warm cream + coral, friendly',
  },
  {
    k: 'acid',
    label: 'Acid',
    swatch: '#CCFF00',
    blurb: 'brutalist, high contrast',
  },
  {
    k: 'dream',
    label: 'Dream',
    swatch: '#B47AE0',
    blurb: 'soft lavender, romantic',
  },
]

export function ThemeSection({ user, onSaved }: Props) {
  const { setTheme: setThemeContext } = useTheme()
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState(user.theme)

  async function pick(theme: 'sunset' | 'acid' | 'dream') {
    if (theme === selected) return
    setSelected(theme)
    setThemeContext(theme) // instant client-side
    setStatus('saving')
    setError(null)
    const res = await fetch('/api/user/me', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ theme }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError((body as { error?: string }).error ?? 'Could not save')
      setStatus('error')
      return
    }
    setStatus('idle')
    onSaved()
  }

  return (
    <Section
      title="Theme"
      subtitle="This applies to your inbox AND to the page senders see when they open your link."
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
        }}
      >
        {THEMES.map(({ k, label, swatch, blurb }) => (
          <button
            key={k}
            onClick={() => pick(k)}
            disabled={status === 'saving' && selected !== k}
            style={{
              background: 'var(--bg)',
              border: `2px solid ${
                selected === k ? 'var(--accent)' : 'var(--line)'
              }`,
              borderRadius: 'var(--radius)',
              padding: 16,
              cursor: status === 'saving' ? 'wait' : 'pointer',
              textAlign: 'left',
              color: 'var(--ink)',
              transition: 'border-color .15s ease',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: swatch,
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: 16,
                }}
              >
                {label}
              </span>
              {selected === k && (
                <span
                  style={{
                    marginLeft: 'auto',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--accent)',
                  }}
                >
                  ● current
                </span>
              )}
            </div>
            <p
              style={{
                fontSize: 12,
                color: 'var(--ink-2)',
                margin: 0,
                fontFamily: 'var(--font-mono)',
              }}
            >
              {blurb}
            </p>
          </button>
        ))}
      </div>
      {error && <Note tone="err">{error}</Note>}
    </Section>
  )
}
