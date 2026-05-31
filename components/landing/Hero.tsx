import Link from 'next/link'
import { LiveDemo } from './LiveDemo'

export function Hero() {
  return (
    <section
      style={{
        paddingTop: 80,
        paddingBottom: 60,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative floating dots */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.5,
        }}
      >
        <span
          className="float-dot"
          style={{
            position: 'absolute',
            top: '18%',
            left: '8%',
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: 'var(--accent)',
          }}
        />
        <span
          className="float-dot"
          style={{
            position: 'absolute',
            top: '60%',
            left: '92%',
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: 'var(--accent-2)',
            animationDelay: '1.2s',
          }}
        />
        <span
          className="float-dot"
          style={{
            position: 'absolute',
            top: '85%',
            left: '12%',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--accent-3)',
            animationDelay: '2.4s',
          }}
        />
        <span
          className="float-dot"
          style={{
            position: 'absolute',
            top: '10%',
            left: '78%',
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: 'var(--ink)',
            animationDelay: '0.6s',
          }}
        />
      </div>

      <div
        className="container"
        style={{ position: 'relative', textAlign: 'center', paddingTop: 40 }}
      >
        <p className="eyebrow" style={{ marginBottom: 22 }}>
          ● end-to-end encrypted anonymous inbox
        </p>

        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(44px, 9vw, 120px)',
              lineHeight: 0.96,
              letterSpacing: '-0.035em',
              margin: '0 0 22px',
              fontWeight: 700,
            }}
          >
            Say&nbsp;it.{' '}
            <br />
            <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>
              Anonymously.
            </em>
          </h1>
        </div>

        <p
          style={{
            fontSize: 20,
            color: 'var(--ink-2)',
            maxWidth: 560,
            margin: '0 auto 32px',
            lineHeight: 1.45,
          }}
        >
          Bindu is a tiny anonymous inbox you share anywhere. Friends drop
          messages, you decide what to share back. We literally can&apos;t read
          what they send.
        </p>

        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: 56,
          }}
        >
          <Link href="/sign-up" className="btn accent">
            Claim your @username
          </Link>
          <a href="#how" className="btn ghost">
            See how it works
          </a>
        </div>

        <LiveDemo />
      </div>
    </section>
  )
}
