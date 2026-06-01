'use client'

import { useEffect, useRef, useState } from 'react'
import { renderStoryCard } from '@/lib/canvas/story-card'
import type { Theme } from '@/components/providers/ThemeProvider'

type Props = {
  open: boolean
  onClose: () => void
  plaintext: string
  mood: string | null
  senderHash: string
  username: string
  theme: Theme
}

export function StoryExportModal({
  open,
  onClose,
  plaintext,
  mood,
  senderHash,
  username,
  theme,
}: Props) {
  const [blob, setBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)

  useEffect(() => {
    if (!open) return
    const id = ++requestId.current
    setBlob(null)
    setPreviewUrl(null)
    setError(null)
    ;(async () => {
      try {
        const b = await renderStoryCard({
          plaintext,
          mood,
          senderHash,
          username,
          theme,
        })
        if (id !== requestId.current) return // canceled
        setBlob(b)
        setPreviewUrl(URL.createObjectURL(b))
      } catch (err) {
        if (id !== requestId.current) return
        setError(err instanceof Error ? err.message : 'Could not render')
      }
    })()
  }, [open, plaintext, mood, senderHash, username, theme])

  // Revoke object URLs to avoid leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function download() {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bindu-whisper-${senderHash}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  async function shareNative() {
    if (!blob) return
    try {
      const file = new File([blob], `bindu-whisper-${senderHash}.png`, {
        type: 'image/png',
      })
      if (
        navigator.canShare &&
        navigator.canShare({ files: [file] }) &&
        navigator.share
      ) {
        await navigator.share({
          files: [file],
          title: 'A whisper from my bindu',
          text: 'bindu.app',
        })
      } else {
        download()
      }
    } catch {
      // user canceled or share failed — fall back to download
      download()
    }
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--line)',
          padding: 24,
          maxWidth: 460,
          width: '100%',
          maxHeight: '92vh',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <p className="eyebrow" style={{ marginBottom: 4 }}>
              ● export to story
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 24,
                margin: 0,
                letterSpacing: '-0.015em',
                lineHeight: 1.1,
              }}
            >
              1080×1920 · vertical
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1px solid var(--line)',
              background: 'transparent',
              color: 'var(--ink)',
              cursor: 'pointer',
              fontSize: 16,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            background: 'var(--bg-2)',
            borderRadius: 'var(--radius)',
            padding: 16,
            display: 'flex',
            justifyContent: 'center',
            minHeight: 360,
            alignItems: 'center',
          }}
        >
          {error ? (
            <p style={{ color: '#C04A2B', fontSize: 13 }}>{error}</p>
          ) : previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="story preview"
              style={{
                maxWidth: '100%',
                maxHeight: 420,
                borderRadius: 16,
                boxShadow: '0 12px 36px -12px rgba(0,0,0,0.4)',
              }}
            />
          ) : (
            <div
              className="pulse"
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--accent)',
              }}
            />
          )}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={shareNative}
            disabled={!blob}
            className="btn accent"
            style={{
              flex: 1,
              justifyContent: 'center',
              opacity: blob ? 1 : 0.5,
              cursor: blob ? 'pointer' : 'not-allowed',
            }}
          >
            Share / download
          </button>
        </div>

        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--ink-2)',
            margin: 0,
            lineHeight: 1.5,
            textAlign: 'center',
          }}
        >
          ● this card never leaves your device · we don&apos;t see it
        </p>
      </div>
    </div>
  )
}
