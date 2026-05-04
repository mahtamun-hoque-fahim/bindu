'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { timeAgo } from '@/lib/utils'

type MsgRow = {
  id: number
  content: string
  isRead: boolean
  isDeleted: boolean
  deletedBy: string | null
  createdAt: string | Date
  recipientUsername: string | null
  flagCount: number
}

type Props = {
  initialMessages: MsgRow[]
  page: number
  totalPages: number
  filter: 'all' | 'flagged' | 'deleted'
}

export default function AdminMessagesClient({ initialMessages, page, totalPages, filter }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [msgs, setMsgs] = useState(initialMessages)
  const [loading, setLoading] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()

  function navigate(params: { page?: number; filter?: string }) {
    const sp = new URLSearchParams()
    if (params.filter && params.filter !== 'all') sp.set('filter', params.filter)
    if (params.page && params.page > 1) sp.set('page', String(params.page))
    startTransition(() => router.push(`${pathname}?${sp.toString()}`))
  }

  async function deleteMsg(id: number) {
    if (!confirm('Soft-delete this message?')) return
    setLoading(id)
    await fetch(`/api/admin/messages/${id}`, { method: 'DELETE' })
    setMsgs((prev) => prev.map((m) => m.id === id ? { ...m, isDeleted: true, deletedBy: 'admin' } : m))
    setLoading(null)
  }

  const visible = msgs.filter((m) => {
    const matchSearch = !search ||
      m.content.toLowerCase().includes(search.toLowerCase()) ||
      m.recipientUsername?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'flagged' ? Number(m.flagCount) > 0 : true
    return matchSearch && matchFilter
  })

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="text"
          placeholder="Search content or recipient…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-md px-3 py-2 text-sm outline-none flex-1 min-w-[200px] max-w-xs"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />
        <div className="flex gap-1">
          {(['all', 'flagged', 'deleted'] as const).map((f) => (
            <button
              key={f}
              onClick={() => navigate({ filter: f, page: 1 })}
              className="text-xs px-3 py-1.5 rounded capitalize transition-colors"
              style={{
                background: filter === f ? 'var(--accent-dim)' : 'var(--surface)',
                color: filter === f ? 'var(--accent)' : 'var(--text-muted)',
                border: '1px solid var(--border)',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)', opacity: isPending ? 0.6 : 1, transition: 'opacity 0.15s' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
              {['Content', 'Recipient', 'Flags', 'Sent', 'Status', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((m) => (
              <tr key={m.id} style={{ borderBottom: '1px solid var(--border)', opacity: m.isDeleted ? 0.45 : 1 }}>
                <td className="px-4 py-3 max-w-xs">
                  <p className="text-sm leading-snug line-clamp-2" style={{ color: 'var(--text)' }}>{m.content}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>@{m.recipientUsername || '—'}</span>
                </td>
                <td className="px-4 py-3">
                  {Number(m.flagCount) > 0 ? (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(255,68,68,0.1)', color: 'var(--destructive)' }}>
                      {m.flagCount}
                    </span>
                  ) : <span style={{ color: 'var(--text-disabled)' }}>—</span>}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{timeAgo(m.createdAt)}</td>
                <td className="px-4 py-3">
                  {m.isDeleted ? (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--surface-elevated)', color: 'var(--text-disabled)' }}>
                      deleted by {m.deletedBy}
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--surface-elevated)', color: 'var(--text-muted)' }}>active</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {!m.isDeleted && (
                    <button
                      onClick={() => deleteMsg(m.id)}
                      disabled={loading === m.id}
                      className="text-xs px-2.5 py-1 rounded transition-colors"
                      style={{ color: 'var(--destructive)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,68,68,0.08)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {loading === m.id ? '…' : 'Delete'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>No messages found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => navigate({ filter, page: page - 1 })}
              disabled={page <= 1}
              className="text-xs px-3 py-1.5 rounded"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: page <= 1 ? 'var(--text-disabled)' : 'var(--text-muted)' }}
            >
              ← Prev
            </button>
            <button
              onClick={() => navigate({ filter, page: page + 1 })}
              disabled={page >= totalPages}
              className="text-xs px-3 py-1.5 rounded"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: page >= totalPages ? 'var(--text-disabled)' : 'var(--text-muted)' }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
