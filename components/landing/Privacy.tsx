export function Privacy() {
  const pillars = [
    {
      n: '01',
      t: 'End-to-end encrypted',
      d: 'Messages are encrypted in your browser with ECDH+AES-GCM before they leave. Our servers see ciphertext only. Decryption happens in your browser, with a key only you hold.',
    },
    {
      n: '02',
      t: 'Hashed identities',
      d: 'Block a sender? We block their hash — we never knew who they were. Not even law enforcement can compel what we don\'t have.',
    },
    {
      n: '03',
      t: 'Zero metadata',
      d: 'We strip device IDs and don\'t log IP addresses with messages. Senders are un-linkable to messages after delivery.',
    },
    {
      n: '04',
      t: 'On-device safety filter',
      d: 'Slur detection, self-harm flags, and doxxing filters run in your browser — no message content is sent to our servers for moderation. Ever.',
    },
  ]
  return (
    <section
      id="privacy"
      style={{ background: 'var(--ink)', color: 'var(--bg)' }}
    >
      <div
        className="container"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.4fr',
          gap: 80,
          alignItems: 'start',
        }}
      >
        <div style={{ position: 'sticky', top: 100 }}>
          <p
            className="eyebrow"
            style={{ marginBottom: 18, color: 'var(--bg-2)' }}
          >
            ● privacy by design
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(38px, 5vw, 64px)',
              margin: '0 0 20px',
              lineHeight: 1,
              letterSpacing: '-0.025em',
            }}
          >
            Truly anonymous. Not{' '}
            <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>
              &quot;anonymous*&quot;
            </em>
            .
          </h2>
          <p
            style={{
              color: 'var(--bg-2)',
              lineHeight: 1.5,
              fontSize: 16,
              marginBottom: 24,
            }}
          >
            Most &quot;anonymous&quot; apps know exactly who you are. We
            don&apos;t, because we can&apos;t. Here&apos;s the math.
          </p>
          <a
            href="#"
            className="btn"
            style={{
              background: 'var(--bg)',
              color: 'var(--ink)',
              borderColor: 'var(--bg)',
            }}
          >
            Read the security paper →
          </a>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {pillars.map((p) => (
            <div
              key={p.n}
              style={{
                background: 'color-mix(in oklab, var(--bg) 8%, transparent)',
                border:
                  '1px solid color-mix(in oklab, var(--bg) 14%, transparent)',
                borderRadius: 'var(--radius)',
                padding: 28,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 14,
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: 'var(--accent)',
                  }}
                >
                  {p.n}
                </span>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 26,
                    margin: 0,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {p.t}
                </h3>
              </div>
              <p
                style={{
                  color: 'var(--bg-2)',
                  margin: 0,
                  lineHeight: 1.5,
                  fontSize: 15,
                }}
              >
                {p.d}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
