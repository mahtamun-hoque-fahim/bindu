export const runtime = 'edge'

export default function Home() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: 32,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontFamily: 'var(--font-display)',
          fontSize: 42,
          fontWeight: 700,
          letterSpacing: '-0.03em',
        }}
      >
        <span
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: 'var(--accent)',
          }}
        />
        bindu
      </div>

      <p className="eyebrow">● phase 0 · scaffold up</p>

      <p
        style={{
          maxWidth: 480,
          color: 'var(--ink-2)',
          lineHeight: 1.5,
          fontSize: 16,
        }}
      >
        Anonymous inbox the size of a dot. End-to-end encrypted. Currently
        rebuilding — landing page lands in Phase 1.
      </p>

      <div style={{ display: 'flex', gap: 10, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-2)' }}>
        <span>next 16</span>
        <span>·</span>
        <span>drizzle</span>
        <span>·</span>
        <span>neon</span>
        <span>·</span>
        <span>cloudflare pages</span>
      </div>
    </main>
  )
}
