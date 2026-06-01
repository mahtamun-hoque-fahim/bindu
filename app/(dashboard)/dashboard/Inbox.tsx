'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  decryptFromSender,
  type EncryptedMessage,
} from '@/lib/crypto'
import { getCachedPrivateKey } from '@/lib/key-cache'
import { classify } from '@/lib/safety-filter'
import { UnlockGate } from './UnlockGate'
import { MessageList } from './MessageList'
import { MessageReader } from './MessageReader'
import { RightPanel } from './RightPanel'
import { Sidebar } from './Sidebar'
import type {
  Filter,
  InboxMessage,
  ServerMessage,
} from './types'

type Session = {
  uid: string
  username: string
  isStaff: boolean
  isAdmin: boolean
  theme: 'sunset' | 'acid' | 'dream'
}

type Props = {
  session: Session
}

export function Inbox({ session }: Props) {
  const router = useRouter()

  // Phase of the page lifecycle
  const [phase, setPhase] = useState<'checking-key' | 'locked' | 'loading' | 'ready' | 'error'>(
    'checking-key',
  )
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null)

  // Inbox state
  const [messages, setMessages] = useState<InboxMessage[]>([])
  const [mutedHashes, setMutedHashes] = useState<Set<string>>(new Set())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')

  // ─── Step 1: check IndexedDB for unwrapped key ──────────────────────────
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const key = await getCachedPrivateKey()
        if (cancelled) return
        if (key) {
          setPrivateKey(key)
          setPhase('loading')
        } else {
          setPhase('locked')
        }
      } catch {
        if (cancelled) return
        setPhase('locked')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // ─── Step 2: fetch + decrypt once key is available ───────────────────────
  const loadInbox = useCallback(async (key: CryptoKey) => {
    setPhase('loading')
    setErrorMsg(null)
    try {
      const res = await fetch('/api/messages')
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/sign-in')
          return
        }
        setErrorMsg(`Could not load inbox (${res.status})`)
        setPhase('error')
        return
      }
      const body = (await res.json()) as {
        messages: ServerMessage[]
        mutedHashes: string[]
      }
      setMutedHashes(new Set(body.mutedHashes))

      // Decrypt each message in browser
      const decrypted: InboxMessage[] = await Promise.all(
        body.messages.map(async (m) => {
          try {
            const encrypted: EncryptedMessage = {
              ciphertext: m.ciphertext,
              iv: m.iv,
              ephemeralPubKey: m.ephemeralPubKey,
            }
            const plaintext = await decryptFromSender(encrypted, key)
            const safety = classify(plaintext)
            return { ...m, plaintext, safety }
          } catch {
            return {
              ...m,
              plaintext: null,
              decryptError: 'Could not decrypt this message.',
              safety: { level: 'clean', reasons: [] },
            }
          }
        }),
      )

      setMessages(decrypted)
      if (decrypted.length > 0 && !selectedId) {
        setSelectedId(decrypted[0].id)
      }
      setPhase('ready')
    } catch {
      setErrorMsg('Could not load inbox.')
      setPhase('error')
    }
  }, [router, selectedId])

  useEffect(() => {
    if (privateKey) loadInbox(privateKey)
  }, [privateKey, loadInbox])

  // ─── Filtered list ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return messages.filter((m) => {
      if (filter === 'new') return !m.isRead
      if (filter === 'fav') return m.isFavorited
      if (filter === 'flagged')
        return m.isFlagged || m.safety.level !== 'clean'
      return true
    })
  }, [messages, filter])

  const selected = messages.find((m) => m.id === selectedId) ?? null

  // ─── Per-message mutators (optimistic UI) ────────────────────────────────
  function patchMessage(id: string, patch: Partial<InboxMessage>) {
    setMessages((curr) =>
      curr.map((m) => (m.id === id ? ({ ...m, ...patch } as InboxMessage) : m)),
    )
  }

  async function markRead(id: string) {
    const m = messages.find((m) => m.id === id)
    if (!m || m.isRead) return
    patchMessage(id, { isRead: true })
    void fetch(`/api/messages/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ isRead: true }),
    })
  }

  async function toggleFavorite(id: string) {
    const m = messages.find((m) => m.id === id)
    if (!m) return
    const next = !m.isFavorited
    patchMessage(id, { isFavorited: next })
    void fetch(`/api/messages/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ isFavorited: next }),
    })
  }

  async function deleteMessage(id: string) {
    patchMessage(id, { isDeleted: true } as Partial<InboxMessage>)
    setMessages((curr) => curr.filter((m) => m.id !== id))
    if (selectedId === id) setSelectedId(null)
    void fetch(`/api/messages/${id}`, { method: 'DELETE' })
  }

  async function addReaction(id: string, emoji: string) {
    const m = messages.find((m) => m.id === id)
    if (!m) return
    if (m.reactions.includes(emoji)) return
    patchMessage(id, { reactions: [...m.reactions, emoji] })
    void fetch('/api/reactions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messageId: id, emoji }),
    })
  }

  async function removeReaction(id: string, emoji: string) {
    const m = messages.find((m) => m.id === id)
    if (!m) return
    patchMessage(id, { reactions: m.reactions.filter((r) => r !== emoji) })
    void fetch(
      `/api/reactions?messageId=${encodeURIComponent(id)}&emoji=${encodeURIComponent(emoji)}`,
      { method: 'DELETE' },
    )
  }

  async function muteSenderHash(senderHash: string) {
    setMutedHashes((s) => new Set(s).add(senderHash))
    void fetch('/api/mutes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ senderHash }),
    })
  }

  async function unmuteSenderHash(senderHash: string) {
    setMutedHashes((s) => {
      const next = new Set(s)
      next.delete(senderHash)
      return next
    })
    void fetch(
      `/api/mutes?hash=${encodeURIComponent(senderHash)}`,
      { method: 'DELETE' },
    )
  }

  // ─── Render based on phase ───────────────────────────────────────────────

  if (phase === 'checking-key') {
    return <LoadingPane label="opening…" />
  }
  if (phase === 'locked') {
    return (
      <UnlockGate
        onUnlocked={() => {
          // Re-read from IndexedDB after UnlockGate cached the key
          getCachedPrivateKey().then((k) => {
            if (k) {
              setPrivateKey(k)
              setPhase('loading')
            }
          })
        }}
      />
    )
  }
  if (phase === 'error') {
    return (
      <LoadingPane
        label={errorMsg ?? 'Something went wrong.'}
        actionLabel="Reload"
        onAction={() => router.refresh()}
      />
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--ink)',
        display: 'grid',
        gridTemplateColumns: '220px 360px 1fr 300px',
        gridTemplateRows: '100vh',
      }}
      className="dash-grid"
    >
      <Sidebar
        session={session}
        unreadCount={messages.filter((m) => !m.isRead).length}
        favoriteCount={messages.filter((m) => m.isFavorited).length}
        flaggedCount={
          messages.filter(
            (m) => m.isFlagged || m.safety.level !== 'clean',
          ).length
        }
        filter={filter}
        onFilterChange={setFilter}
      />
      <MessageList
        messages={filtered}
        selectedId={selectedId}
        onSelect={(id) => {
          setSelectedId(id)
          markRead(id)
        }}
        loading={phase === 'loading'}
        mutedHashes={mutedHashes}
      />
      <MessageReader
        message={selected}
        onFavorite={() => selected && toggleFavorite(selected.id)}
        onDelete={() => selected && deleteMessage(selected.id)}
        onMute={() =>
          selected && muteSenderHash(selected.senderHash)
        }
        onUnmute={() =>
          selected && unmuteSenderHash(selected.senderHash)
        }
        onReact={(emoji) => selected && addReaction(selected.id, emoji)}
        onUnreact={(emoji) =>
          selected && removeReaction(selected.id, emoji)
        }
        isMuted={
          selected ? mutedHashes.has(selected.senderHash) : false
        }
      />
      <RightPanel messages={messages} username={session.username} />
    </div>
  )
}

function LoadingPane({
  label,
  actionLabel,
  onAction,
}: {
  label: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--ink)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        padding: 32,
        textAlign: 'center',
      }}
    >
      <div
        className="pulse"
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'var(--accent)',
        }}
      />
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          color: 'var(--ink-2)',
          fontSize: 13,
        }}
      >
        {label}
      </p>
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="btn ghost"
          style={{ padding: '10px 18px', fontSize: 13 }}
        >
          {actionLabel}
        </button>
      )}
    </main>
  )
}
