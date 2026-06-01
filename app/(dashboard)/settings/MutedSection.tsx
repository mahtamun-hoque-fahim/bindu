'use client'

import { useEffect, useState } from 'react'
import { Section, Note } from './Section'
import { timeAgo } from '@/lib/utils'

type Mute = { senderHash: string; createdAt: string }

export function MutedSection() {
  const [mutes, setMutes] = useState<Mute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/mutes')
        if (!res.ok) {
          if (!cancelled) {
            setError(`Could not load (${res.status})`)
            setLoading(false)
          }
          return
        }
        const body = (await res.json()) as { mutes: Mute[] }
        if (!cancelled) {
          setMutes(body.mutes)
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setError('Could not load')
          setLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function unmute(senderHash: string) {
    setMutes((curr) => curr.filter((m) => m.senderHash !== senderHash))
    void fetch(
      `/api/mutes?hash=${encodeURIComponent(senderHash)}`,
      { method: 'DELETE' },
    )
  }

  return (
    <Section
      title="Blocked senders"
      subtitle="Each sender hash represents one device-recipient pair. Cleared localStorage on their end gives them a new hash."
    >
      {loading ? (
        <Note>loading…</Note>
      ) : error ? (
        <Note tone="err">{error}</Note>
      ) : mutes.length === 0 ? (
        <Note>nobody&apos;s blocked. ●</Note>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {mutes.map((m) => (
            <div
              key={m.senderHash}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                background: 'var(--bg)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius)',
                fontSize: 14,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--ink-2)',
                }}
              />
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                anon · #{m.senderHash}
              </span>
              <span
                style={{
                  marginLeft: 'auto',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--ink-2)',
                }}
              >
                muted {timeAgo(m.createdAt)}
              </span>
              <button
                onClick={() => unmute(m.senderHash)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--line)',
                  borderRadius: 99,
                  padding: '4px 10px',
                  fontSize: 11,
                  color: 'var(--ink-2)',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                }}
              >
                unmute
              </button>
            </div>
          ))}
        </div>
      )}
    </Section>
  )
}
