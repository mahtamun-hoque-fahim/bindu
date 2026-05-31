'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function FinalCTA() {
  const [username, setUsername] = useState('')
  const router = useRouter()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const clean = username.trim().replace(/^@/, '')
    if (!clean) return router.push('/sign-up')
    router.push(`/sign-up?username=${encodeURIComponent(clean)}`)
  }

  return (
    <section
      style={{
        paddingTop: 100,
        paddingBottom: 100,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div className="container">
        <p className="eyebrow" style={{ marginBottom: 22 }}>
          ● claim your dot
        </p>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(56px, 9vw, 140px)',
            margin: '0 0 22px',
            lineHeight: 0.92,
            letterSpacing: '-0.04em',
          }}
        >
          Start the <br />
          <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>
            whisper
          </em>
          .
        </h2>
        <p
          style={{
            color: 'var(--ink-2)',
            maxWidth: 460,
            margin: '0 auto 28px',
            fontSize: 18,
            lineHeight: 1.4,
          }}
        >
          Free forever. No app to download. Set up in under a minute.
        </p>
        <form
          onSubmit={submit}
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="@yourname"
            style={{
              padding: '16px 22px',
              borderRadius: 'var(--radius)',
              border: '1.5px solid var(--ink)',
              background: 'transparent',
              color: 'var(--ink)',
              fontFamily: 'var(--font-sans)',
              fontSize: 16,
              width: 220,
              outline: 'none',
            }}
          />
          <button type="submit" className="btn accent">
            Claim it →
          </button>
        </form>
      </div>
    </section>
  )
}
