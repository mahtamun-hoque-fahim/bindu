'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Section, Note } from './Section'
import { clearCachedPrivateKey } from '@/lib/key-cache'

export function SecuritySection({ username }: { username: string }) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [locked, setLocked] = useState(false)

  async function copyLink() {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/u/${username}`
        : `/u/${username}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignored */
    }
  }

  async function lockNow() {
    setLocked(true)
    await clearCachedPrivateKey()
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <Section
      title="Security"
      subtitle="Lock-now clears your unwrapped private key from this browser — the next inbox visit will ask for your passphrase."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius)',
            padding: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="eyebrow" style={{ marginBottom: 4 }}>
              ● your link
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 14,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              bindu.app/{username}
            </div>
          </div>
          <button
            onClick={copyLink}
            className="btn ghost"
            style={{ padding: '8px 14px', fontSize: 13 }}
          >
            {copied ? '✓ copied' : '↗ copy'}
          </button>
        </div>

        <div
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius)',
            padding: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ flex: 1 }}>
            <div className="eyebrow" style={{ marginBottom: 4 }}>
              ● lock this browser
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
              Useful if you&apos;re on a shared device. You&apos;ll need your
              passphrase to read your inbox again.
            </div>
          </div>
          <button
            onClick={lockNow}
            disabled={locked}
            className="btn ghost"
            style={{
              padding: '8px 14px',
              fontSize: 13,
              opacity: locked ? 0.5 : 1,
            }}
          >
            {locked ? 'locking…' : 'lock now'}
          </button>
        </div>

        <Note>
          ● there is no passphrase recovery — losing it loses your inbox
        </Note>
      </div>
    </Section>
  )
}
