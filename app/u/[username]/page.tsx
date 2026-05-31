import { notFound } from 'next/navigation'
import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { normalizeUsername, validateUsername } from '@/lib/auth/validation'
import { SendForm } from './SendForm'

export const runtime = 'edge'

type Props = { params: Promise<{ username: string }> }

export default async function PublicSendPage({ params }: Props) {
  const { username: raw } = await params
  const check = validateUsername(raw)
  if (!check.ok) notFound()

  const db = getDb()
  if (!db) notFound()

  const normalized = normalizeUsername(raw)
  const user = await db.query.users.findFirst({
    where: eq(users.username, normalized),
    columns: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      pubKey: true,
      theme: true,
      isBanned: true,
    },
  })

  if (!user || user.isBanned) notFound()

  return (
    <div
      className={`theme-${user.theme}`}
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--ink)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <SendForm
        recipientId={user.id}
        username={user.username}
        displayName={user.displayName ?? null}
        bio={user.bio ?? null}
        pubKey={user.pubKey}
      />
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const { username } = await params
  const u = normalizeUsername(username)
  return {
    title: `@${u} — send anonymously · Bindu`,
    description: `Send @${u} an anonymous message. End-to-end encrypted.`,
    openGraph: {
      title: `Send @${u} anything — anonymously`,
      description: `Bindu is an end-to-end encrypted anonymous inbox.`,
    },
    robots: { index: false, follow: false }, // public profile but not search-indexed
  }
}
