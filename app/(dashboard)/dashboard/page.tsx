import Link from 'next/link'
import { requireSession } from '@/lib/auth/server'
import { SignOutButton } from './SignOutButton'

export const runtime = 'edge'

export default async function DashboardPage() {
  const session = await requireSession()
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '18px 32px',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
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
            }}
          />
          bindu
        </Link>
        <span
          style={{
            marginLeft: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            color: 'var(--ink-2)',
          }}
        >
          signed in as {session.u}
        </span>
        <SignOutButton />
      </div>

      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
        }}
      >
        <div
          style={{
            maxWidth: 560,
            textAlign: 'center',
          }}
        >
          <p className="eyebrow" style={{ marginBottom: 14 }}>
            ● phase 3 · auth working
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 48,
              margin: '0 0 14px',
              letterSpacing: '-0.025em',
              lineHeight: 1.05,
            }}
          >
            Welcome,{' '}
            <em style={{ color: 'var(--accent)' }}>@{session.u}</em>.
          </h1>
          <p
            style={{
              color: 'var(--ink-2)',
              fontSize: 16,
              lineHeight: 1.5,
              marginBottom: 22,
            }}
          >
            Your keypair is generated, your private key is wrapped under your
            passphrase, and the unwrapped half is cached for this browser
            session. The real inbox UI lands in Phase 5.
          </p>
          <div
            style={{
              background: 'var(--bg-2)',
              padding: 18,
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              color: 'var(--ink-2)',
              lineHeight: 1.7,
            }}
          >
            <div>
              uid: <span style={{ color: 'var(--ink)' }}>{session.uid}</span>
            </div>
            <div>
              role:{' '}
              <span style={{ color: 'var(--ink)' }}>
                {session.a ? 'admin' : session.s ? 'staff' : 'user'}
              </span>
            </div>
            <div>
              your link:{' '}
              <span style={{ color: 'var(--ink)' }}>
                bindu.app/{session.u}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export const metadata = { title: 'Inbox — Bindu' }
