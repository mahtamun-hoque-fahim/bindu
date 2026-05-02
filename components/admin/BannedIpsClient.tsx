'use client'

import { useState } from 'react'
import { timeAgo } from '@/lib/utils'

type IpRow = {
  id: number
  ip: string
  reason: string | null
  bannedBy: string
  createdAt: string | Date
}

export default function BannedIpsClient({ initialIps }: { initialIps: IpRow[] }) {
  const [ips, setIps] = useState(initialIps)
  const [newIp, setNewIp] = useState('')
  const [newReason, setNewReason] = useState('')
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<number | null>(null)
  const [error, setError] = useState('')

  async function addIp() {
    if (!newIp.trim()) return
    setAdding(true)
    setError('')
    const res = await fetch('/api/admin/banned-ips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip: newIp.trim(), reason: newReason.trim() || null }),
    })
    if (!res.ok) {
      setError('Failed to add IP')
    } else {
      const added: IpRow = {
        id: Date.now(),
        ip: newIp.trim(),
        reason: newReason.trim() || null,
        bannedBy: 'admin',
        createdAt: new Date(),
      }
      setIps((prev) => [added, ...prev])
      setNewIp('')
      setNewReason('')
    }
    setAdding(false)
  }

  async function removeIp(id: number) {
    setRemoving(id)
    await fetch(`/api/admin/banned-ips/${id}`, { method: 'DELETE' })
    setIps((prev) => prev.filter((ip) => ip.id !== id))
    setRemoving(null)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Add form */}
      <div
        className="rounded-lg p-5"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2
          className="text-sm font-semibold mb-4"
          style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}
        >
          Ban an IP
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="IP address (e.g. 1.2.3.4)"
            value={newIp}
            onChange={(e) => setNewIp(e.target.value)}
            className="rounded-md px-3 py-2 text-sm outline-none flex-1"
            style={{
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
            onKeyDown={(e) => e.key === 'Enter' && addIp()}
          />
          <input
            type="text"
            placeholder="Reason (optional)"
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            className="rounded-md px-3 py-2 text-sm outline-none flex-1"
            style={{
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          />
          <button
            onClick={addIp}
            disabled={adding || !newIp.trim()}
            className="text-sm font-semibold px-4 py-2 rounded transition-opacity shrink-0"
            style={{
              background: newIp.trim() ? 'var(--destructive)' : 'var(--surface-elevated)',
              color: newIp.trim() ? '#fff' : 'var(--text-disabled)',
              opacity: adding ? 0.7 : 1,
            }}
          >
            {adding ? 'Banning…' : 'Ban IP'}
          </button>
        </div>
        {error && (
          <p className="text-xs mt-2" style={{ color: 'var(--destructive)' }}>
            {error}
          </p>
        )}
      </div>

      {/* IP list */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ border: '1px solid var(--border)' }}
      >
        {ips.length === 0 ? (
          <div
            className="py-12 text-center"
            style={{ background: 'var(--surface)' }}
          >
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              No banned IPs
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{
                  background: 'var(--surface)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                {['IP Address', 'Reason', 'Banned', ''].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-medium"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ips.map((ip) => (
                <tr
                  key={ip.id}
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <td className="px-4 py-3">
                    <span
                      className="font-mono text-sm"
                      style={{ color: 'var(--text)' }}
                    >
                      {ip.ip}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {ip.reason || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {timeAgo(ip.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => removeIp(ip.id)}
                      disabled={removing === ip.id}
                      className="text-xs px-2.5 py-1 rounded transition-colors"
                      style={{ color: 'var(--accent)' }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = 'var(--accent-dim)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = 'transparent')
                      }
                    >
                      {removing === ip.id ? '…' : 'Unban'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
