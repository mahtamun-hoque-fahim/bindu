import { redirect } from 'next/navigation'
import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireSession } from '@/lib/auth/server'
import { SettingsView } from './SettingsView'

export const runtime = 'edge'

export default async function SettingsPage() {
  const session = await requireSession()

  const db = getDb()
  if (!db) redirect('/sign-in')

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.uid),
    columns: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      theme: true,
      isStaff: true,
      isAdmin: true,
      createdAt: true,
    },
  })
  if (!user) redirect('/sign-in')

  return (
    <div className={`theme-${user.theme}`} style={{ minHeight: '100vh' }}>
      <SettingsView user={user} />
    </div>
  )
}

export const metadata = { title: 'Settings — Bindu' }
