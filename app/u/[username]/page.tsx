import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import type { Metadata } from 'next'
import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'
import SendForm from '@/components/send/SendForm'
import Link from 'next/link'

type Props = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bindu.app'
  return {
    title: `Send ${username} an anonymous message — Bindu`,
    description: `Send ${username} a message anonymously. No account needed.`,
    openGraph: {
      title: `Send ${username} an anonymous message`,
      description: 'No account needed. Totally anonymous.',
      images: [
        {
          url: `${appUrl}/api/og?username=${username}`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Send ${username} an anonymous message`,
      images: [`${appUrl}/api/og?username=${username}`],
    },
  }
}

export default async function SendPage({ params }: Props) {
  const { username } = await params

  const db = getDb()
  const [user] = db
    ? await db.select().from(users).where(eq(users.username, username)).limit(1)
    : []

  if (!user) notFound()

  const displayName = user.displayName || user.username

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          {/* Avatar placeholder */}
          <div
            className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center text-xl font-bold"
            style={{
              background: 'var(--accent-dim)',
              border: '2px solid rgba(0,230,118,0.2)',
              color: 'var(--accent)',
              fontFamily: 'var(--font-syne)',
            }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>

          <h1
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}
          >
            Send{' '}
            <span style={{ color: 'var(--accent)' }}>{displayName}</span>
            <br />
            an anonymous message
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            They won&apos;t know who sent it.
          </p>
        </div>

        {/* Form */}
        <SendForm username={username} />

        {/* Footer */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="text-xs hover:opacity-80 transition-opacity"
            style={{ color: 'var(--text-disabled)' }}
          >
            Get your own Bindu link →
          </Link>
        </div>
      </div>
    </main>
  )
}
