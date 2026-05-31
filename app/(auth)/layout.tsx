import Link from 'next/link'
import { requireAnon } from '@/lib/auth/server'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAnon()
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
      }}
    >
      <div
        style={{
          padding: '20px 32px',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--ink)',
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
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
        }}
      >
        <main
          style={{
            width: '100%',
            maxWidth: 520,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
