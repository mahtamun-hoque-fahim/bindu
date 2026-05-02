'use client'

import { useState } from 'react'
import { timeAgo } from '@/lib/utils'

type FlagRow = {
  id: number
  flaggedBy: string
  reason: string
  note: string | null
  status: string
  createdAt: string | Date
  resolvedAt: string | Date | null
  messageId: number | null
  messageContent: string | null
  messageIsDeleted: boolean | null
  recipientUsername: string | null
  recipientDisplayName: string | null
}

const REASON_COLORS: Record<string, { bg: string; color: string }> = {
  harassment: { bg: 'rgba(255,68,68,0.12)', color: 'var(--destructive)' },
  spam:        { bg: 'rgba(255,170,0,0.12)', color: 'var(--warning)' },
  inappropriate: { bg: 'rgba(255,68,68,0.08)', color: 'var(--destructive)' },
  other:       { bg: 'var(--surface-elevated)', color: 'var(--text-muted)' },
}

export default function ModerationClient({ initialFlags }: { initialFlags: FlagRow[] }) {
  const [flags, setFlags] = useState(initialFlags)
  const [tab, setTab] = useState<'pending' | 'resolved' | 'dismissed'>('pending')
  const [loading, setLoading] = useState<number | null>(null)

  const visible = flags.filter((f) => f.status === tab)

  async function updateFlag(id: number, status: 'resolved' | 'dismissed') {
    setLoading(id)
    await fetch(`/api/admin/flags/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setFlags((prev) => prev.map((f) => (f.id === id ? { ...f, status } : f)))
    setLoading(null)
  }

  async function deleteMessage(flagId: number, msgId: number) {
    if (!confirm('Soft-delete this message and resolve the flag?')) return
    setLoading(flagId)
    await Promise.all([
      fetch(`/api/admin/messages/${msgId}`, { method: 'DELETE' }),
      fetch(`/api/admin/flags/${flagId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' }),
      }),
    ])
    setFlags((prev) =>
      prev.map((f) =>
        f.id === flagId
          ? { ...f, status: 'resolved', messageIsDeleted: true }
          : f
      )
    )
    setLoading(null)
  }

  const counts = {
    pending: flags.filter((f) => f.status === 'pending').length,
    resolved: flags.filter((f) => f.status === 'resolved').length,
    dismissed: flags.filter((f) => f.status === 'dismissed').length,
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        {(['pending', 'resolved', 'dismissed'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded capitalize transition-colors"
            style={{
              background: tab === t ? 'var(--accent-dim)' : 'var(--surface)',
              color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
              border: '1px solid var(--border)',
            }}
          >
            {t}
            <span
              className="text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
              style={{
                background: tab === t
                  ? 'var(--accent)'
                  : 'var(--surface-elevated)',
                color: tab === t ? '#000' : 'var(--text-muted)',
              }}
            >
              {counts[t]}
            </span>
          </button>
        ))}
      </div>

      {/* Flag cards */}
      {visible.length === 0 ? (
        <div
          className="rounded-lg py-16 text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {tab === 'pending' ? 'No pending flags 🎉' : `No ${tab} flags`}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((f) => {
            const rc = REASON_COLORS[f.reason] || REASON_COLORS.other
            return (
              <div
                key={f.id}
                className="rounded-lg p-5"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                      style={{ background: rc.bg, color: rc.color }}
                    >
                      {f.reason}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full capitalize"
                      style={{ background: 'var(--surface-elevated)', color: 'var(--text-muted)' }}
                    >
                      by {f.flaggedBy}
                    </span>
                    {f.recipientUsername && (
                      <span className="text-xs" style={{ color: 'var(--text-disabled)' }}>
                        → @{f.recipientUsername}
                      </span>
                    )}
                  </div>
                  <span className="text-xs shrink-0" style={{ color: 'var(--text-disabled)' }}>
                    {timeAgo(f.createdAt)}
                  </span>
                </div>

                {/* Message content */}
                {f.messageContent && (
                  <div
                    className="rounded-md px-4 py-3 mb-3"
                    style={{
                      background: 'var(--surface-elevated)',
                      border: '1px solid var(--border)',
                      opacity: f.messageIsDeleted ? 0.5 : 1,
                    }}
                  >
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
                      {f.messageContent}
                    </p>
                    {f.messageIsDeleted && (
                      <p className="text-xs mt-1" style={{ color: 'var(--destructive)' }}>
                        Message deleted
                      </p>
                    )}
                  </div>
                )}

                {/* Note */}
                {f.note && (
                  <p className="text-xs mb-3 italic" style={{ color: 'var(--text-muted)' }}>
                    Note: {f.note}
                  </p>
                )}

                {/* Actions */}
                {tab === 'pending' && (
                  <div className="flex items-center gap-2">
                    {f.messageId && !f.messageIsDeleted && (
                      <button
                        onClick={() => deleteMessage(f.id, f.messageId!)}
                        disabled={loading === f.id}
                        className="text-xs px-3 py-1.5 rounded font-medium transition-colors"
                        style={{ background: 'rgba(255,68,68,0.1)', color: 'var(--destructive)' }}
                      >
                        {loading === f.id ? '…' : 'Delete message'}
                      </button>
                    )}
                    <button
                      onClick={() => updateFlag(f.id, 'resolved')}
                      disabled={loading === f.id}
                      className="text-xs px-3 py-1.5 rounded font-medium transition-colors"
                      style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
                    >
                      {loading === f.id ? '…' : 'Resolve'}
                    </button>
                    <button
                      onClick={() => updateFlag(f.id, 'dismissed')}
                      disabled={loading === f.id}
                      className="text-xs px-3 py-1.5 rounded transition-colors"
                      style={{ background: 'var(--surface-elevated)', color: 'var(--text-muted)' }}
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
