import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'
import SettingsForm from '@/components/dashboard/SettingsForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Settings — Bindu' }
export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const db = getDb()
  const [user] = db
    ? await db.select().from(users).where(eq(users.id, userId)).limit(1)
    : []

  if (!user) redirect('/dashboard')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bindu.app'

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      <h1
        className="text-2xl font-bold mb-8"
        style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}
      >
        Settings
      </h1>
      <SettingsForm user={user} appUrl={appUrl} />
    </div>
  )
}
