'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { timeAgo } from '@/lib/utils'
import { clientSignOut } from '@/lib/auth/client'

type StaffFlag = {
  id: string
  messageId: string
  reporterId: string
  reportedPlaintext: string
  reason:
    | 'harassment'
    | 'doxxing'
    | 'self_harm'
    | 'spam'
    | 'inappropriate'
    | 'other'
  note: string | null
  status: 'pending' | 'escalated' | 'resolved' | 'dismissed'
  resolvedBy: string | null
  resolvedAt: string | null
  resolverNote: string | null
  createdAt: string
  senderHash: string
  messageCreatedAt: string
  messageIsDeleted: boolean
}

type Counts = Array<{
  status: 'pending' | 'escalated' | 'resolved' | 'dismissed'
  count: number
}>

type StatusFilter = 'open' | 'pending' | 'escalated' | 'resolved' | 'dismissed'

type Props = {
  session: { uid: string; username: string; isAdmin: boolean }
}

const REASON_LABEL: Record<StaffFlag['reason'], string> = {
  self_harm: 'Self-harm',
  doxxing: 'Doxxing',
  harassment: 'Harassment',
  inappropriate: 'Inappropriate',
  spam: 'Spam',
  other: 'Other',
}

const REASON_TINT: Record<StaffFlag['reason'], string> = {
  self_harm: '#C04A2B',
  doxxing: '#C04A2B',
  harassment: '#E07B3A',
  inappropriate: '#E07B3A',
  spam: '#666',
  other: '#666',
}

export function StaffView({ session }: Props) {
  const router = useRouter()
  const [flags, setFlags] = useState<StaffFlag[]>([])
  const [counts, setCounts] = useState<Counts>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [status, setStatus] = useState<StatusFilter>('open')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (status !== 'open') params.set('status', status)
      const res = await fetch(`/api/staff/flags?${params}`)
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/sign-in')
          return
        }
        setError(`Could not load (${res.status})`)
        setLoading(false)
        return
      }
      const body = (await res.json()) as { flags: StaffFlag[]; counts: Counts }
      setFlags(body.flags)
      setCounts(body.counts)
      if (body.flags.length > 0 && !selectedId) {
        setSelectedId(body.flags[0].id)
      }
      setLoading(false)
    } catch {
      setError('Could not load')
      setLoading(false)
    }
  }, [status, selectedId, router])

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const selected = useMemo(
    () => flags.find((f) => f.id === selectedId) ?? null,
    [flags, selectedId],
  )

  function badgeFor(s: 'pending' | 'escalated' | 'resolved' | 'dismissed'): number {
    return counts.find((c) => c.status === s)?.count ?? 0
  }

  const openCount = badgeFor('pending') + badgeFor('escalated')

  async function resolveFlag(
    flagId: string,
    next: 'resolved' | 'dismissed' | 'escalated',
    deleteMessage: boolean,
    note: string,
  ) {
    const res = await fetch(`/api/staff/flags/${flagId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        status: next,
        resolverNote: note.trim() || null,
        deleteMessage,
      }),
    })
    if (!res.ok) return
    await load()
  }

  async function signOut() {
    await clientSignOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--ink)',
        display: 'grid',
        gridTemplateColumns: '240px 420px 1fr',
        gridTemplateRows: '100vh',
      }}
      className="dash-grid"
    >
      {/* Sidebar */}
      <aside
        style={{
          background: 'var(--bg-2)',
          borderRight: '1px solid var(--line)',
          padding: '18px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          overflowY: 'auto',
        }}
        className="dash-side"
      >
        <Link
          href="/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--ink)',
            padding: '4px 8px 14px',
          }}
        >
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: '#C04A2B',
            }}
          />
          bindu / staff
        </Link>

        <p
          className="eyebrow"
          style={{ padding: '0 8px', marginBottom: 6 }}
        >
          ● queue
        </p>
        {(
          [
            ['open', 'Open queue', openCount],
            ['pending', 'Pending', badgeFor('pending')],
            ['escalated', 'Escalated', badgeFor('escalated')],
            ['resolved', 'Resolved', badgeFor('resolved')],
            ['dismissed', 'Dismissed', badgeFor('dismissed')],
          ] as const
        ).map(([k, label, count]) => (
          <button
            key={k}
            onClick={() => {
              setStatus(k)
              setSelectedId(null)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 12px',
              borderRadius: 'var(--radius)',
              background: status === k ? 'var(--bubble)' : 'transparent',
              border:
                status === k
                  ? '1px solid var(--line)'
                  : '1px solid transparent',
              color: 'var(--ink)',
              cursor: 'pointer',
              fontWeight: status === k ? 600 : 400,
              fontSize: 14,
            }}
          >
            <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
            {count > 0 && (
              <span
                style={{
                  background:
                    k === 'open' || k === 'escalated'
                      ? '#C04A2B'
                      : 'var(--accent)',
                  color: '#fff',
                  padding: '0 6px',
                  borderRadius: 999,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  lineHeight: '18px',
                  minWidth: 18,
                  textAlign: 'center',
                }}
              >
                {count}
              </span>
            )}
          </button>
        ))}

        <p
          className="eyebrow"
          style={{ padding: '0 8px', marginTop: 16, marginBottom: 6 }}
        >
          ● jump to
        </p>
        <Link
          href="/dashboard"
          style={{
            padding: '8px 12px',
            color: 'var(--ink)',
            textDecoration: 'none',
            fontSize: 14,
            borderRadius: 'var(--radius)',
          }}
        >
          Your inbox
        </Link>
        {session.isAdmin && (
          <Link
            href="/admin"
            style={{
              padding: '8px 12px',
              color: 'var(--ink)',
              textDecoration: 'none',
              fontSize: 14,
              borderRadius: 'var(--radius)',
            }}
          >
            Admin
          </Link>
        )}

        <div style={{ flex: 1 }} />

        <div
          style={{
            padding: '12px 8px 8px',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--ink-2)',
            borderTop: '1px solid var(--line)',
            marginTop: 12,
          }}
        >
          <div>logged in as staff</div>
          <div style={{ color: 'var(--ink)' }}>@{session.username}</div>
          <button
            onClick={signOut}
            style={{
              background: 'transparent',
              border: '1px solid var(--line)',
              borderRadius: 99,
              padding: '4px 10px',
              fontSize: 10,
              color: 'var(--ink-2)',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              marginTop: 8,
            }}
          >
            sign out
          </button>
        </div>
      </aside>

      {/* List */}
      <div
        style={{
          background: 'var(--bg)',
          borderRight: '1px solid var(--line)',
          overflowY: 'auto',
          height: '100vh',
        }}
        className="no-bar"
      >
        <div
          style={{
            padding: '18px 22px 14px',
            borderBottom: '1px solid var(--line)',
            position: 'sticky',
            top: 0,
            background: 'var(--bg)',
            zIndex: 1,
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 24,
              margin: 0,
              letterSpacing: '-0.015em',
            }}
          >
            Moderation queue
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--ink-2)',
              margin: '6px 0 0',
            }}
          >
            ● {loading ? 'loading…' : `${flags.length} flag${flags.length === 1 ? '' : 's'}`}
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: 24,
              color: '#C04A2B',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && flags.length === 0 && (
          <div
            style={{
              padding: '80px 24px',
              textAlign: 'center',
              color: 'var(--ink-2)',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--bg-2)',
                margin: '0 auto 14px',
              }}
            />
            <p style={{ fontSize: 14, margin: '0 0 4px' }}>Queue is clear.</p>
            <p
              style={{
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                margin: 0,
              }}
            >
              nothing to triage right now
            </p>
          </div>
        )}

        {flags.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedId(f.id)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              background:
                selectedId === f.id ? 'var(--bubble)' : 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--line)',
              borderLeft:
                selectedId === f.id
                  ? `3px solid ${REASON_TINT[f.reason]}`
                  : '3px solid transparent',
              padding: '14px 22px',
              cursor: 'pointer',
              color: 'var(--ink)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  background: REASON_TINT[f.reason],
                  color: '#fff',
                  borderRadius: 99,
                  padding: '2px 8px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {REASON_LABEL[f.reason]}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--ink-2)',
                }}
              >
                #{f.senderHash}
              </span>
              <span
                style={{
                  marginLeft: 'auto',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--ink-2)',
                }}
              >
                {timeAgo(f.createdAt)}
              </span>
            </div>
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.4,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {f.reportedPlaintext}
            </div>
            {f.status !== 'pending' && f.status !== 'escalated' && (
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--ink-2)',
                  marginTop: 4,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {f.status}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Detail */}
      <FlagDetail flag={selected} onResolve={resolveFlag} />
    </div>
  )
}

// ─── Detail pane ──────────────────────────────────────────────────────────

function FlagDetail({
  flag,
  onResolve,
}: {
  flag: StaffFlag | null
  onResolve: (
    flagId: string,
    next: 'resolved' | 'dismissed' | 'escalated',
    deleteMessage: boolean,
    note: string,
  ) => Promise<void>
}) {
  const [resolverNote, setResolverNote] = useState('')
  const [deleteMsg, setDeleteMsg] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setResolverNote('')
    setDeleteMsg(true)
    setSubmitting(false)
  }, [flag?.id])

  if (!flag) {
    return (
      <div
        style={{
          background: 'var(--bg-2)',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 280 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'var(--bg)',
              margin: '0 auto 16px',
              border: '1px dashed var(--line)',
            }}
          />
          <p
            style={{
              color: 'var(--ink-2)',
              fontSize: 14,
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            Select a flag to triage it.
          </p>
        </div>
      </div>
    )
  }

  const isOpen = flag.status === 'pending' || flag.status === 'escalated'
  const flagId = flag.id

  async function act(next: 'resolved' | 'dismissed' | 'escalated') {
    setSubmitting(true)
    await onResolve(
      flagId,
      next,
      deleteMsg && next === 'resolved',
      resolverNote,
    )
    setSubmitting(false)
  }

  return (
    <div
      style={{
        background: 'var(--bg-2)',
        height: '100vh',
        overflowY: 'auto',
      }}
      className="no-bar"
    >
      <div
        style={{
          padding: '20px 30px',
          borderBottom: '1px solid var(--line)',
          position: 'sticky',
          top: 0,
          background: 'var(--bg-2)',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              background: REASON_TINT[flag.reason],
              color: '#fff',
              borderRadius: 99,
              padding: '3px 10px',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {REASON_LABEL[flag.reason]}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--ink-2)',
            }}
          >
            from anon · #{flag.senderHash} · flagged {timeAgo(flag.createdAt)}
          </span>
          <span
            style={{
              marginLeft: 'auto',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--ink-2)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {flag.status}
          </span>
        </div>
      </div>

      <div style={{ padding: '40px 30px', maxWidth: 720 }}>
        <p className="eyebrow" style={{ marginBottom: 10 }}>
          ● reported plaintext
        </p>
        <div
          style={{
            background: 'var(--bubble)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius)',
            padding: 20,
            fontFamily: 'var(--font-display)',
            fontSize: 20,
            lineHeight: 1.4,
            letterSpacing: '-0.01em',
            marginBottom: 24,
            whiteSpace: 'pre-wrap',
          }}
        >
          {flag.reportedPlaintext}
        </div>

        {flag.note && (
          <>
            <p className="eyebrow" style={{ marginBottom: 10 }}>
              ● reporter&apos;s note
            </p>
            <div
              style={{
                background: 'var(--bg)',
                border: '1px dashed var(--line)',
                borderRadius: 'var(--radius)',
                padding: 16,
                fontSize: 14,
                color: 'var(--ink-2)',
                lineHeight: 1.5,
                marginBottom: 24,
              }}
            >
              {flag.note}
            </div>
          </>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 10,
            marginBottom: 24,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--ink-2)',
          }}
        >
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>
              flag id
            </div>
            <div style={{ color: 'var(--ink)' }}>{flag.id.slice(0, 12)}…</div>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>
              message
            </div>
            <div style={{ color: 'var(--ink)' }}>
              {flag.messageId.slice(0, 12)}…
            </div>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>
              sent
            </div>
            <div style={{ color: 'var(--ink)' }}>
              {timeAgo(flag.messageCreatedAt)}
            </div>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>
              msg state
            </div>
            <div style={{ color: 'var(--ink)' }}>
              {flag.messageIsDeleted ? 'deleted' : 'live'}
            </div>
          </div>
        </div>

        {flag.resolverNote && (
          <>
            <p className="eyebrow" style={{ marginBottom: 10 }}>
              ● resolver note
            </p>
            <div
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius)',
                padding: 16,
                fontSize: 13,
                color: 'var(--ink-2)',
                lineHeight: 1.5,
                marginBottom: 24,
                fontFamily: 'var(--font-mono)',
              }}
            >
              {flag.resolverNote}
            </div>
          </>
        )}

        {isOpen && (
          <div
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              padding: 22,
            }}
          >
            <p className="eyebrow" style={{ marginBottom: 12 }}>
              ● triage actions
            </p>

            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--ink-2)',
                marginBottom: 6,
              }}
            >
              resolver note (optional)
            </label>
            <textarea
              value={resolverNote}
              onChange={(e) => setResolverNote(e.target.value.slice(0, 280))}
              placeholder="visible to other staff and admin only"
              rows={2}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius)',
                border: '1.5px solid var(--line)',
                background: 'var(--bubble)',
                color: 'var(--ink)',
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                outline: 'none',
                resize: 'vertical',
                marginBottom: 12,
              }}
            />

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              <input
                type="checkbox"
                checked={deleteMsg}
                onChange={(e) => setDeleteMsg(e.target.checked)}
                style={{ accentColor: '#C04A2B' }}
              />
              also delete the underlying message (recipient&apos;s inbox)
            </label>

            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={() => act('resolved')}
                disabled={submitting}
                style={{
                  background: '#C04A2B',
                  border: '1.5px solid #C04A2B',
                  color: '#fff',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.5 : 1,
                }}
              >
                Resolve {deleteMsg ? '+ delete' : ''}
              </button>
              <button
                onClick={() => act('dismissed')}
                disabled={submitting}
                className="btn ghost"
                style={{
                  padding: '10px 16px',
                  fontSize: 13,
                  opacity: submitting ? 0.5 : 1,
                }}
              >
                Dismiss
              </button>
              <button
                onClick={() => act('escalated')}
                disabled={submitting || flag.status === 'escalated'}
                style={{
                  background: 'transparent',
                  border: '1.5px solid var(--accent)',
                  color: 'var(--accent)',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor:
                    submitting || flag.status === 'escalated'
                      ? 'not-allowed'
                      : 'pointer',
                  opacity:
                    submitting || flag.status === 'escalated' ? 0.5 : 1,
                }}
              >
                Escalate to admin
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
