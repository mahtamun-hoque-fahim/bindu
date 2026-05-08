'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { timeAgo } from '@/lib/utils'
import type { Message } from '@/lib/db/schema'
import FlagModal from './FlagModal'

// Detect if text contains Bengali characters (Unicode block U+0980–U+09FF)
function hasBengali(text: string): boolean {
  return /[\u0980-\u09FF]/.test(text)
}

async function exportAsPng(content: string, createdAt: Date) {
  const W = 800
  const PADDING = 56
  const MAX_WIDTH = W - PADDING * 2

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  // Measure text height with wrapping
  const isBn = hasBengali(content)
  const fontFamily = isBn
    ? "'LiAdorNoirrit', 'Noto Sans Bengali', sans-serif"
    : "'Inter', system-ui, sans-serif"
  const fontSize = 22
  ctx.font = `${fontSize}px ${fontFamily}`

  function wrapLines(text: string, maxWidth: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let current = ''
    for (const word of words) {
      const test = current ? `${current} ${word}` : word
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current)
        current = word
      } else {
        current = test
      }
    }
    if (current) lines.push(current)
    return lines
  }

  const lines = wrapLines(content, MAX_WIDTH)
  const lineHeight = fontSize * 1.7
  const textBlockH = lines.length * lineHeight

  // Layout heights
  const topPad = 56
  const bottomPad = 56
  const metaH = 48
  const brandH = 52
  const H = topPad + textBlockH + metaH + bottomPad + brandH

  canvas.width = W
  canvas.height = H

  // Background
  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, W, H)

  // Subtle card background
  ctx.fillStyle = '#111111'
  roundRect(ctx, PADDING - 16, topPad - 16, W - (PADDING - 16) * 2, textBlockH + metaH + 32, 12)
  ctx.fill()

  // Left accent bar
  ctx.fillStyle = '#00e676'
  ctx.fillRect(PADDING - 16, topPad - 16, 3, textBlockH + metaH + 32)

  // Message text
  ctx.font = `${fontSize}px ${fontFamily}`
  ctx.fillStyle = '#f5f5f5'
  ctx.textBaseline = 'top'
  lines.forEach((line, i) => {
    ctx.fillText(line, PADDING, topPad + i * lineHeight)
  })

  // Timestamp
  const tsY = topPad + textBlockH + 16
  ctx.font = `13px 'Inter', system-ui, sans-serif`
  ctx.fillStyle = '#555555'
  ctx.fillText(
    `received ${timeAgo(createdAt)} · anonymous`,
    PADDING,
    tsY
  )

  // Bottom brand bar
  const brandY = H - brandH
  ctx.fillStyle = '#111111'
  ctx.fillRect(0, brandY, W, brandH)

  // brand text
  ctx.font = `bold 15px 'LiAdorNoirrit', sans-serif`
  ctx.fillStyle = '#00e676'
  ctx.fillText('বিন্দু', PADDING, brandY + 16)

  ctx.font = `13px 'Inter', system-ui, sans-serif`
  ctx.fillStyle = '#333333'
  ctx.fillText('bindu.pages.dev', PADDING + 48, brandY + 18)

  // Download
  const link = document.createElement('a')
  link.download = `message-${Date.now()}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export default function MessageCard({ message }: { message: Message }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRead, setIsRead] = useState(message.isRead)
  const [showFlag, setShowFlag] = useState(false)
  const [flagged, setFlagged] = useState(false)
  const [exporting, setExporting] = useState(false)

  const isBn = hasBengali(message.content)

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

  async function handleExport() {
    setExporting(true)
    try {
      await exportAsPng(message.content, message.createdAt)
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <div
        className="group relative rounded-lg p-4 transition-all"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          opacity: isRead ? 0.75 : 1,
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
          style={{
            color: 'var(--text)',
            fontFamily: isBn ? 'var(--font-bengali)' : undefined,
            fontSize: isBn ? '1rem' : undefined,
          }}
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
              onClick={handleExport}
              disabled={exporting}
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
              {exporting ? '…' : 'Save PNG'}
            </button>

            {!flagged ? (
              <button
                onClick={() => setShowFlag(true)}
                className="text-xs px-2.5 py-1 rounded transition-colors"
                style={{ color: 'var(--warning)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,170,0,0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                Flag
              </button>
            ) : (
              <span className="text-xs px-2.5 py-1" style={{ color: 'var(--text-disabled)' }}>
                Flagged
              </span>
            )}

            <button
              onClick={deleteMessage}
              disabled={isDeleting}
              className="text-xs px-2.5 py-1 rounded transition-colors"
              style={{ color: 'var(--destructive)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,68,68,0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {isDeleting ? '…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>

      {showFlag && (
        <FlagModal
          messageId={message.id}
          flaggedBy="recipient"
          onClose={() => setShowFlag(false)}
          onSuccess={() => {
            setShowFlag(false)
            setFlagged(true)
          }}
        />
      )}
    </>
  )
}
