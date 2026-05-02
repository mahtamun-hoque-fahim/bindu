'use client'

import { useState } from 'react'

const REASONS = [
  { value: 'harassment', label: 'Harassment' },
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'other', label: 'Other' },
] as const

type Reason = typeof REASONS[number]['value']

type Props = {
  messageId: number
  flaggedBy: 'sender' | 'recipient'
  onClose: () => void
  onSuccess: () => void
}

export default function FlagModal({ messageId, flaggedBy, onClose, onSuccess }: Props) {
  const [reason, setReason] = useState<Reason>('harassment')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/messages/flag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId, flaggedBy, reason, note: note.trim() || undefined }),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error || 'Something went wrong')
      setSubmitting(false)
      return
    }
    onSuccess()
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-xl p-6"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
        }}
      >
        <h2
          className="text-base font-bold mb-1"
          style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}
        >
          Flag this message
        </h2>
        <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
          This will be reviewed by our moderation team.
        </p>

        {/* Reason */}
        <div className="flex flex-col gap-2 mb-4">
          {REASONS.map((r) => (
            <label
              key={r.value}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 cursor-pointer transition-colors"
              style={{
                background: reason === r.value ? 'var(--accent-dim)' : 'var(--surface-elevated)',
                border: `1px solid ${reason === r.value ? 'rgba(0,230,118,0.3)' : 'var(--border)'}`,
              }}
            >
              <input
                type="radio"
                name="reason"
                value={r.value}
                checked={reason === r.value}
                onChange={() => setReason(r.value)}
                className="accent-[--accent]"
              />
              <span
                className="text-sm"
                style={{ color: reason === r.value ? 'var(--accent)' : 'var(--text)' }}
              >
                {r.label}
              </span>
            </label>
          ))}
        </div>

        {/* Note */}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Additional context (optional)"
          rows={2}
          maxLength={300}
          className="w-full resize-none text-sm rounded-md px-3 py-2.5 outline-none mb-4"
          style={{
            background: 'var(--surface-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
        />

        {error && (
          <p className="text-xs mb-3" style={{ color: 'var(--destructive)' }}>
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 text-sm py-2 rounded transition-colors"
            style={{ background: 'var(--surface-elevated)', color: 'var(--text-muted)' }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="flex-1 text-sm font-semibold py-2 rounded transition-opacity"
            style={{ background: 'var(--warning)', color: '#000', opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? 'Flagging…' : 'Submit flag'}
          </button>
        </div>
      </div>
    </div>
  )
}
