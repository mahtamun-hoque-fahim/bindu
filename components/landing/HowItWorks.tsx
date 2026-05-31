export function HowItWorks() {
  const steps = [
    {
      n: '01',
      t: 'Claim your dot',
      d: 'Pick a @username in 6 seconds. No email, no phone, no photo. Just a passphrase only you hold.',
    },
    {
      n: '02',
      t: 'Drop the link',
      d: 'Stick bindu.app/you in your bio, story, or AirDrop it across the lunchroom.',
    },
    {
      n: '03',
      t: 'Read encrypted',
      d: 'Crushes, confessions, callouts, compliments. Decrypted in your browser. We never see plaintext.',
    },
    {
      n: '04',
      t: 'Reply with vibes',
      d: 'Post the best ones to your story with one tap. Mute the rest forever by hash.',
    },
  ]

  return (
    <section id="how" style={{ background: 'var(--bg-2)' }}>
      <div className="container">
        <div style={{ maxWidth: 760, marginBottom: 56 }}>
          <p className="eyebrow" style={{ marginBottom: 14 }}>
            ● how it works
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
            From signup to first whisper in{' '}
            <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>
              under a minute.
            </em>
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 24,
          }}
        >
          {steps.map((s, i) => (
            <div
              key={s.n}
              style={{
                background: 'var(--bg)',
                borderRadius: 'var(--radius)',
                padding: 28,
                border: '1px solid var(--line)',
                position: 'relative',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--accent)',
                  marginBottom: 14,
                }}
              >
                {s.n} <span style={{ color: 'var(--ink-2)' }}>/ 04</span>
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 24,
                  margin: '0 0 8px',
                  letterSpacing: '-0.01em',
                }}
              >
                {s.t}
              </h3>
              <p
                style={{
                  color: 'var(--ink-2)',
                  margin: 0,
                  lineHeight: 1.5,
                  fontSize: 15,
                }}
              >
                {s.d}
              </p>
              <span
                style={{
                  position: 'absolute',
                  top: 24,
                  right: 24,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: i === 0 ? 'var(--accent)' : 'var(--line)',
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
