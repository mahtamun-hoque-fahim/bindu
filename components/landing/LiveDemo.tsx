'use client'

import Link from 'next/link'
import { useState } from 'react'

const MOODS = ['🫶', '🔥', '👀', '😭', '💀', '✨'] as const
const SAMPLES = [
  "you give the best advice. don't change.",
  "i miss you more than i'll ever say.",
  'your zine is criminally underrated',
  'u looked unreal in that fit yesterday',
]

export function LiveDemo() {
  const [step, setStep] = useState<0 | 1 | 2>(0) // 0 form, 1 sending, 2 sent
  const [msg, setMsg] = useState('')
  const [mood, setMood] = useState<(typeof MOODS)[number]>('🫶')

  function send() {
    if (!msg.trim()) return
    setStep(1)
    setTimeout(() => setStep(2), 900)
  }
  function reset() {
    setStep(0)
    setMsg('')
  }

  return (
    <div
      id="try"
      style={{
        background: 'var(--bubble)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-lg)',
        padding: 22,
        maxWidth: 460,
        margin: '0 auto',
        boxShadow: '0 20px 60px -30px var(--ink)',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          paddingBottom: 14,
          borderBottom: '1px solid var(--line)',
        }}
      >
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'var(--accent)',
          }}
        />
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>@maya.k</div>
          <div className="eyebrow" style={{ fontSize: 10 }}>
            send me anything — anonymously
          </div>
        </div>
        <div
          style={{
            marginLeft: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--ink-2)',
          }}
        >
          bindu.app/m
        </div>
      </div>

      {step === 0 && (
        <div style={{ paddingTop: 18 }}>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value.slice(0, 200))}
            placeholder="type something only you would say..."
            rows={3}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: 'var(--ink)',
              fontFamily: 'var(--font-sans)',
              fontSize: 18,
              lineHeight: 1.4,
              resize: 'none',
            }}
          />
          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              marginTop: 8,
              marginBottom: 14,
            }}
          >
            {SAMPLES.map((s) => (
              <button
                key={s}
                onClick={() => setMsg(s)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 99,
                  border: '1px solid var(--line)',
                  background: 'transparent',
                  color: 'var(--ink-2)',
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                }}
              >
                {s.slice(0, 24)}…
              </button>
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--line)',
              paddingTop: 14,
            }}
          >
            <div style={{ display: 'flex', gap: 4 }}>
              {MOODS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border:
                      mood === m
                        ? '2px solid var(--accent)'
                        : '1px solid var(--line)',
                    background: 'transparent',
                    fontSize: 16,
                    padding: 0,
                    cursor: 'pointer',
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--ink-2)',
                }}
              >
                {msg.length}/200
              </span>
              <button
                onClick={send}
                disabled={!msg.trim()}
                className="btn accent"
                style={{
                  padding: '10px 16px',
                  fontSize: 14,
                  opacity: msg.trim() ? 1 : 0.4,
                  cursor: msg.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Send ●
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div style={{ padding: '40px 0 30px', textAlign: 'center' }}>
          <div
            className="pulse"
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--accent)',
              margin: '0 auto 18px',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              fontSize: 24,
            }}
          >
            ●
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--ink-2)',
            }}
          >
            encrypting · stripping metadata · sending anonymously
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ padding: '26px 0 6px' }}>
          <div className="bubble you" style={{ marginBottom: 6 }}>
            <span style={{ marginRight: 6 }}>{mood}</span>
            {msg}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--ink-2)',
              textAlign: 'right',
              marginBottom: 16,
            }}
          >
            delivered anonymously · no trace
          </div>
          <div
            style={{
              display: 'flex',
              gap: 10,
              justifyContent: 'flex-end',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={reset}
              className="btn ghost"
              style={{ padding: '10px 14px', fontSize: 13 }}
            >
              Send another
            </button>
            <Link
              href="/sign-up"
              className="btn"
              style={{ padding: '10px 14px', fontSize: 13 }}
            >
              Get your own inbox
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
