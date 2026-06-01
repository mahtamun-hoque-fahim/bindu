'use client'

import { useState } from 'react'
import { Section, FieldLabel, Input, TextArea, Note } from './Section'
import type { SettingsUser } from './SettingsView'

type Props = {
  user: SettingsUser
  onSaved: () => void
}

export function ProfileSection({ user, onSaved }: Props) {
  const [displayName, setDisplayName] = useState(user.displayName ?? '')
  const [bio, setBio] = useState(user.bio ?? '')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  )
  const [error, setError] = useState<string | null>(null)

  const dirty =
    (displayName.trim() || null) !== (user.displayName ?? null) ||
    (bio.trim() || null) !== (user.bio ?? null)

  async function save() {
    setStatus('saving')
    setError(null)
    const res = await fetch('/api/user/me', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        displayName: displayName.trim() || null,
        bio: bio.trim() || null,
      }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError((body as { error?: string }).error ?? 'Could not save')
      setStatus('error')
      return
    }
    setStatus('saved')
    onSaved()
  }

  return (
    <Section
      title="Profile"
      subtitle="What people see on your public send page. Both fields are optional."
    >
      <FieldLabel>display name</FieldLabel>
      <Input
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder={`@${user.username}`}
        maxLength={40}
      />

      <div style={{ height: 16 }} />

      <FieldLabel>bio</FieldLabel>
      <TextArea
        value={bio}
        onChange={(e) => setBio(e.target.value.slice(0, 140))}
        placeholder="send me anything — anonymously"
        rows={3}
      />
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--ink-2)',
          textAlign: 'right',
          marginTop: 4,
        }}
      >
        {bio.length}/140
      </div>

      <div
        style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}
      >
        <button
          onClick={save}
          disabled={!dirty || status === 'saving'}
          className="btn accent"
          style={{
            padding: '10px 16px',
            fontSize: 14,
            opacity: dirty && status !== 'saving' ? 1 : 0.5,
            cursor: dirty && status !== 'saving' ? 'pointer' : 'not-allowed',
          }}
        >
          {status === 'saving' ? 'Saving…' : 'Save'}
        </button>
        {status === 'saved' && <Note tone="ok">● saved</Note>}
        {status === 'error' && error && <Note tone="err">{error}</Note>}
      </div>
    </Section>
  )
}
