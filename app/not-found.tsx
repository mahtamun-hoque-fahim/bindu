import Link from 'next/link'

export const runtime = 'edge'

export default function NotFound() {
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
        }}
      />
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 56,
          margin: 0,
          letterSpacing: '-0.025em',
          lineHeight: 1,
        }}
      >
        Nothing here.
      </h1>
      <p style={{ color: 'var(--ink-2)', maxWidth: 360, lineHeight: 1.5 }}>
        Whatever you were looking for, it isn&apos;t here. Maybe the link expired.
      </p>
      <Link href="/" className="btn accent">
        Back to home
      </Link>
    </main>
  )
}
