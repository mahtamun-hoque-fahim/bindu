'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { timeAgo } from '@/lib/utils'
import type { Message } from '@/lib/db/schema'

export default function MessageCard({ message }: { message: Message }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRead, setIsRead] = useState(message.isRead)

  async function toggleRead() {
    const next = !isRead
    setIsRead(next)
    await fetch(`/api/messages/${message.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRead: next }),
    })
    router.refresh()
  }

  async function deleteMessage() {
    if (isDeleting) return
    setIsDeleting(true)
    await fetch(`/api/messages/${message.id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div
      className="group relative rounded-lg p-4 transition-all"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        opacity: isRead ? 0.7 : 1,
      }}
    >
      {/* Unread dot */}
      {!isRead && (
        <span
          className="absolute top-4 right-4 w-2 h-2 rounded-full"
          style={{ background: 'var(--accent)' }}
        />
      )}

      <p
        className="text-sm leading-relaxed pr-6"
        style={{ color: 'var(--text)' }}
      >
        {message.content}
      </p>

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {timeAgo(message.createdAt)}
        </span>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={toggleRead}
            className="text-xs px-2.5 py-1 rounded transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--surface-elevated)'
              e.currentTarget.style.color = 'var(--text)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-muted)'
            }}
          >
            {isRead ? 'Mark unread' : 'Mark read'}
          </button>

          <button
            onClick={deleteMessage}
            disabled={isDeleting}
            className="text-xs px-2.5 py-1 rounded transition-colors"
            style={{ color: 'var(--destructive)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,68,68,0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            {isDeleting ? '…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
