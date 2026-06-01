'use client'

import { useState } from 'react'
import { Section, FieldLabel, Input, Note } from './Section'
import { clearAllCachedKeys } from '@/lib/key-cache'

export function DangerSection({ onDeleted }: { onDeleted: () => void }) {
  const [open, setOpen] = useState(false)
  const [passphrase, setPassphrase] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function deleteAccount() {
    if (confirm !== 'delete my account') {
      setError("Type 'delete my account' to confirm")
      return
    }
    setSubmitting(true)
    setError(null)
    const res = await fetch('/api/user/me', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ passphrase }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError((body as { error?: string }).error ?? 'Could not delete')
      setSubmitting(false)
      return
    }
    await clearAllCachedKeys()
    onDeleted()
  }

  return (
    <Section
      title="Danger zone"
      subtitle="Wipe your inbox and account. Cannot be undone. All received messages, reactions, mutes, and the link itself disappear."
      danger
    >
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          style={{
            background: 'transparent',
            border: '1px solid #C04A2B',
            borderRadius: 'var(--radius)',
            color: '#C04A2B',
            padding: '10px 16px',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Delete my account
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <FieldLabel>your passphrase</FieldLabel>
            <Input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div>
            <FieldLabel>
              type &ldquo;delete my account&rdquo; to confirm
            </FieldLabel>
            <Input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="delete my account"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>
          {error && <Note tone="err">{error}</Note>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => {
                setOpen(false)
                setPassphrase('')
                setConfirm('')
                setError(null)
              }}
              className="btn ghost"
              style={{ padding: '10px 16px', fontSize: 14 }}
            >
              Cancel
            </button>
            <button
              onClick={deleteAccount}
              disabled={submitting || !passphrase || !confirm}
              style={{
                background: '#C04A2B',
                border: '1.5px solid #C04A2B',
                color: '#fff',
                padding: '10px 16px',
                borderRadius: 'var(--radius)',
                fontSize: 14,
                fontWeight: 600,
                cursor:
                  submitting || !passphrase || !confirm
                    ? 'not-allowed'
                    : 'pointer',
                opacity: submitting || !passphrase || !confirm ? 0.5 : 1,
              }}
            >
              {submitting ? 'Deleting…' : 'Delete forever'}
            </button>
          </div>
        </div>
      )}
    </Section>
  )
}
