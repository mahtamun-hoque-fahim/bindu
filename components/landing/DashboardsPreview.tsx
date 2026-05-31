'use client'

import Link from 'next/link'

const TILES = [
  {
    href: '/dashboard',
    label: 'User',
    t: 'Your inbox',
    d: 'Read whispers, reply with vibes, share to story.',
    colorVar: '--accent',
  },
  {
    href: '/staff',
    label: 'Staff',
    t: 'Moderation',
    d: 'Triage flagged content. Keep the platform safe.',
    colorVar: '--accent-2',
  },
  {
    href: '/admin',
    label: 'Admin',
    t: 'Platform',
    d: 'Watch the dots fly. Tune the algorithms.',
    colorVar: '--accent-3',
  },
] as const

export function DashboardsPreview() {
  return (
    <section id="dashboards" style={{ background: 'var(--bg-2)' }}>
      <div className="container">
        <div style={{ maxWidth: 760, marginBottom: 48 }}>
          <p className="eyebrow" style={{ marginBottom: 14 }}>
            ● three dashboards
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(38px, 5vw, 64px)',
              margin: 0,
              lineHeight: 1,
              letterSpacing: '-0.025em',
            }}
          >
            One product. Three windows in.
          </h2>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 18,
          }}
        >
          {TILES.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              style={{
                background: 'var(--bg)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--line)',
                padding: 28,
                textDecoration: 'none',
                color: 'var(--ink)',
                display: 'block',
                position: 'relative',
                transition: 'transform .2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 28,
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: `var(${t.colorVar})`,
                  }}
                />
                <span className="eyebrow" style={{ fontSize: 10 }}>
                  {t.label}
                </span>
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 30,
                  margin: '0 0 8px',
                  letterSpacing: '-0.015em',
                }}
              >
                {t.t}
              </h3>
              <p
                style={{
                  color: 'var(--ink-2)',
                  margin: '0 0 26px',
                  lineHeight: 1.45,
                  fontSize: 14,
                }}
              >
                {t.d}
              </p>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                Open dashboard →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
