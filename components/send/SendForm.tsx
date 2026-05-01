'use client'

import { useState } from 'react'

const MAX = 500

export default function SendForm({ username }: { username: string }) {
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error' | 'rate-limit'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const remaining = MAX - content.length
  const canSend = content.trim().length > 0 && content.length <= MAX && status !== 'sending'

  async function handleSend() {
    if (!canSend) return
    setStatus('sending')

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientUsername: username, content }),
      })

      if (res.status === 429) {
        setStatus('rate-limit')
        return
      }

      if (!res.ok) {
        const data = await res.json()
        setErrorMsg(data.error || 'Something went wrong')
        setStatus('error')
        return
      }

      setStatus('success')
      setContent('')
    } catch {
      setErrorMsg('Network error. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div
        className="flex flex-col items-center gap-3 py-10 rounded-xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: 'var(--accent-dim)' }}
        >
          <span style={{ color: 'var(--accent)', fontSize: 22 }}>✓</span>
        </div>
        <p className="font-semibold text-[--text]" style={{ fontFamily: 'var(--font-syne)' }}>
          Message sent!
        </p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          They won&apos;t know it was you.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="text-sm mt-1 hover:opacity-80 transition-opacity"
          style={{ color: 'var(--accent)' }}
        >
          Send another →
        </button>
      </div>
    )
  }

  if (status === 'rate-limit') {
    return (
      <div
        className="flex flex-col items-center gap-3 py-10 rounded-xl text-center px-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <span className="text-2xl">⏳</span>
        <p className="font-semibold text-[--text]" style={{ fontFamily: 'var(--font-syne)' }}>
          Slow down
        </p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          You&apos;ve sent too many messages. Please wait a few minutes.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="text-sm mt-1 hover:opacity-80 transition-opacity"
          style={{ color: 'var(--warning)' }}
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl p-6"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
      }}
    >
      <textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value)
          if (status === 'error') setStatus('idle')
        }}
        maxLength={MAX}
        rows={5}
        placeholder="Write something anonymous..."
        className="w-full resize-none text-sm leading-relaxed outline-none transition-colors rounded-md px-3 py-3"
        style={{
          background: 'var(--surface-elevated)',
          border: `1px solid ${status === 'error' ? 'var(--destructive)' : 'var(--border)'}`,
          color: 'var(--text)',
          caretColor: 'var(--accent)',
        }}
        onFocus={(e) => {
          if (status !== 'error') {
            e.target.style.borderColor = 'var(--accent)'
          }
        }}
        onBlur={(e) => {
          if (status !== 'error') {
            e.target.style.borderColor = 'var(--border)'
          }
        }}
        disabled={status === 'sending'}
      />

      {status === 'error' && (
        <p className="text-xs mt-1.5 mb-2" style={{ color: 'var(--destructive)' }}>
          {errorMsg}
        </p>
      )}

      <div className="flex items-center justify-between mt-3">
        <span
          className="text-xs"
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            color: remaining < 50 ? 'var(--warning)' : 'var(--text-muted)',
          }}
        >
          {remaining}/500
        </span>

        <button
          onClick={handleSend}
          disabled={!canSend}
          className="font-semibold text-sm px-5 py-2 rounded transition-all active:scale-95"
          style={{
            background: canSend ? 'var(--accent)' : 'var(--surface-elevated)',
            color: canSend ? '#000' : 'var(--text-disabled)',
            boxShadow: canSend ? '0 0 20px rgba(0,230,118,0.15)' : 'none',
            cursor: canSend ? 'pointer' : 'not-allowed',
          }}
        >
          {status === 'sending' ? 'Sending…' : 'Send →'}
        </button>
      </div>
    </div>
  )
}
