'use client'

import Link from 'next/link'
import { useTheme } from '@/components/providers/ThemeProvider'

const NAV_LINKS: Array<[string, string]> = [
  ['How it works', '#how'],
  ['Features', '#features'],
  ['Privacy', '#privacy'],
  ['FAQ', '#faq'],
]

const THEMES: Array<{ key: 'sunset' | 'acid' | 'dream'; swatch: string; label: string }> = [
  { key: 'sunset', swatch: '#E85D3B', label: 'Sunset' },
  { key: 'acid', swatch: '#CCFF00', label: 'Acid' },
  { key: 'dream', swatch: '#B47AE0', label: 'Dream' },
]

export function TopNav() {
  const { theme, dark, setTheme, toggleDark } = useTheme()

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'color-mix(in oklab, var(--bg) 88%, transparent)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 32px',
          gap: 16,
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
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
              display: 'inline-block',
            }}
          />
          bindu
        </Link>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 14,
          }}
          className="nav-links"
        >
          {NAV_LINKS.map(([label, href]) => (
            <a
              key={href}
              href={href}
              style={{
                padding: '8px 14px',
                borderRadius: 99,
                textDecoration: 'none',
                color: 'var(--ink-2)',
              }}
            >
              {label}
            </a>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Theme swatch picker */}
          <div
            role="radiogroup"
            aria-label="Pick theme"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: 3,
              border: '1px solid var(--line)',
              borderRadius: 99,
            }}
          >
            {THEMES.map(({ key, swatch, label }) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                role="radio"
                aria-checked={theme === key}
                aria-label={label}
                title={label}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: swatch,
                  border:
                    theme === key
                      ? '2px solid var(--ink)'
                      : '2px solid transparent',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'border-color .15s ease',
                }}
              />
            ))}
          </div>

          <button
            onClick={toggleDark}
            aria-label="Toggle dark mode"
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              border: '1px solid var(--line)',
              background: 'transparent',
              color: 'var(--ink)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            {dark ? '☀' : '☾'}
          </button>

          <Link
            href="/sign-up"
            className="btn"
            style={{ padding: '10px 18px', fontSize: 14 }}
          >
            Get your link <span style={{ marginLeft: 2 }}>→</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
