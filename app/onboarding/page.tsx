import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'
import OnboardingForm from '@/components/auth/OnboardingForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Choose your username — Bindu' }
export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')

  const db = getDb()
  const [user] = db
    ? await db
        .select({ id: users.id, username: users.username, email: users.email })
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1)
    : []

  // Already has a clean username — skip onboarding
  if (user?.username && !/^[^@]+$/.test(user.username) === false) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--font-syne)', color: 'var(--accent)' }}
          >
            বিন্দু
          </span>
          <h1
            className="text-xl font-bold mt-3 mb-1"
            style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}
          >
            One last thing
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Choose a username for your shareable link
          </p>
        </div>
        <OnboardingForm currentUsername={user?.username ?? ''} />
      </div>
    </main>
  )
}
