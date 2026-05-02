'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { timeAgo } from '@/lib/utils'

type UserRow = {
  id: string
  username: string
  displayName: string | null
  email: string | null
  isBanned: boolean
  bannedReason: string | null
  createdAt: string | Date
  messageCount: number
}

export default function AdminUsersClient({ initialUsers }: { initialUsers: UserRow[] }) {
  const router = useRouter()
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  const filtered = users.filter((u) =>
    [u.username, u.displayName, u.email].some((f) =>
      f?.toLowerCase().includes(search.toLowerCase())
    )
  )

  async function toggleBan(user: UserRow) {
    setLoading(user.id)
    const ban = !user.isBanned
    await fetch(`/api/admin/users/${user.id}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ban }),
    })
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isBanned: ban } : u))
    setLoading(null)
  }

  async function deleteUser(id: string) {
    if (!confirm('Delete this user and all their data? This cannot be undone.')) return
    setLoading(id)
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    setUsers((prev) => prev.filter((u) => u.id !== id))
    setLoading(null)
  }

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by username, name, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-md px-3 py-2 text-sm outline-none transition-colors"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
        />
      </div>

      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
              {['User', 'Email', 'Messages', 'Joined', 'Status', 'Actions'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr
                key={u.id}
                className="transition-colors"
                style={{ borderBottom: '1px solid var(--border)', background: u.isBanned ? 'rgba(255,68,68,0.03)' : 'transparent' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = u.isBanned ? 'rgba(255,68,68,0.03)' : 'transparent')}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
                    >
                      {(u.displayName || u.username).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium" style={{ color: 'var(--text)' }}>
                        {u.displayName || u.username}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>@{u.username}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {u.email || '—'}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--text)' }}>
                  {Number(u.messageCount).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {timeAgo(u.createdAt)}
                </td>
                <td className="px-4 py-3">
                  {u.isBanned ? (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(255,68,68,0.1)', color: 'var(--destructive)' }}>banned</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--surface-elevated)', color: 'var(--text-muted)' }}>active</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {(
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleBan(u)}
                        disabled={loading === u.id}
                        className="text-xs px-2.5 py-1 rounded transition-colors"
                        style={{
                          color: u.isBanned ? 'var(--accent)' : 'var(--warning)',
                          background: u.isBanned ? 'var(--accent-dim)' : 'rgba(255,170,0,0.08)',
                        }}
                      >
                        {loading === u.id ? '…' : u.isBanned ? 'Unban' : 'Ban'}
                      </button>
                      <button
                        onClick={() => deleteUser(u.id)}
                        disabled={loading === u.id}
                        className="text-xs px-2.5 py-1 rounded transition-colors"
                        style={{ color: 'var(--destructive)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,68,68,0.08)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-sm" style={{ color: 'var(--text-muted)' }}>
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
