'use client'

import { useState } from 'react'

const ITEMS: Array<{ q: string; a: string }> = [
  {
    q: 'Is it actually anonymous?',
    a: "Yes — we use end-to-end encryption (ECDH P-256 + AES-256-GCM via the browser's WebCrypto API), don't log sender IPs with messages, and only store hashed sender IDs. Even we can't tell who sent what. We've published our full security architecture for independent audit.",
  },
  {
    q: 'Can I get bullied on Bindu?',
    a: 'Our on-device filter blocks slurs, threats, and doxxing patterns before the message ever reaches you. You can mute any sender hash forever in one tap, and the recipient can flag any message to staff — when they do, they choose to share that one plaintext with our moderation team.',
  },
  {
    q: 'Why no email signup?',
    a: "We don't want your email. We don't want your phone. The less we know about you, the less we can ever leak. You sign in with a recovery passphrase only you hold. Lose it and you lose your inbox — by design.",
  },
  {
    q: 'How is this different from NGL or Sendit?',
    a: "Bindu doesn't sell \"reveal who sent it\" upgrades. We literally can't reveal it — your messages are encrypted to a key only your browser holds. We also work without an app, just a web link, and don't gate replies behind a paywall.",
  },
  {
    q: 'What if I forget my passphrase?',
    a: "There is no recovery. Your passphrase wraps the private key that decrypts your inbox; we never see either. If you lose it, you lose access. We tell you this loudly at signup. You can write it down — it's the only way.",
  },
  {
    q: 'How do you make money?',
    a: "Optional Bindu+ ($2.99/mo) gives you custom emoji moods, longer messages, and group dots. That's it. No ads, ever. (Bindu+ launches with v2.)",
  },
]

export function FAQ() {
  const [open, setOpen] = useState<number>(0)

  return (
    <section id="faq">
      <div className="container">
        <div style={{ maxWidth: 760, marginBottom: 48 }}>
          <p className="eyebrow" style={{ marginBottom: 14 }}>
            ● questions, honestly
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
            What everyone asks us.
          </h2>
        </div>
        <div style={{ borderTop: '1px solid var(--line)' }}>
          {ITEMS.map((it, i) => (
            <div key={i} style={{ borderBottom: '1px solid var(--line)' }}>
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                aria-expanded={open === i}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '26px 0',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--ink)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 30,
                  cursor: 'pointer',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 24,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {it.q}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 14,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: '1px solid var(--line)',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    transform: open === i ? 'rotate(45deg)' : 'none',
                    transition: 'transform .2s ease',
                  }}
                >
                  +
                </span>
              </button>
              {open === i && (
                <p
                  style={{
                    color: 'var(--ink-2)',
                    lineHeight: 1.55,
                    fontSize: 16,
                    margin: '-6px 0 26px',
                    maxWidth: 720,
                  }}
                >
                  {it.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
