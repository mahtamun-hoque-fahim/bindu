import Link from 'next/link'

export const runtime = 'edge'

export default function PublicSendNotFound() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        padding: 32,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'var(--accent)',
          opacity: 0.4,
        }}
      />
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 48,
          margin: 0,
          letterSpacing: '-0.025em',
          lineHeight: 1.05,
        }}
      >
        No bindu here.
      </h1>
      <p
        style={{
          color: 'var(--ink-2)',
          maxWidth: 380,
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        This username isn&apos;t taken yet. Maybe your friend mistyped the
        link — or you could{' '}
        <Link
          href="/sign-up"
          style={{ color: 'var(--ink)', textDecoration: 'underline' }}
        >
          claim it yourself
        </Link>
        .
      </p>
      <Link href="/" className="btn ghost" style={{ marginTop: 8 }}>
        ← Back to bindu.app
      </Link>
    </main>
  )
}
