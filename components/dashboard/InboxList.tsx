'use client'

import type { Message } from '@/lib/db/schema'
import MessageCard from './MessageCard'

export default function InboxList({ messages }: { messages: Message[] }) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
          style={{ background: 'var(--surface)' }}
        >
          <span className="text-xl">✉️</span>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          No messages yet.
        </p>
        <p className="text-xs" style={{ color: 'var(--text-disabled)' }}>
          Share your link to start receiving anonymous messages.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {messages.map((msg) => (
        <MessageCard key={msg.id} message={msg} />
      ))}
    </div>
  )
}
