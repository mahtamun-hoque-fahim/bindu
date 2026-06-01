import { redirect } from 'next/navigation'
import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireSession } from '@/lib/auth/server'
import { Inbox } from './Inbox'

export const runtime = 'edge'

export default async function DashboardPage() {
  const session = await requireSession()

  const db = getDb()
  if (!db) redirect('/sign-in')

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.uid),
    columns: {
      id: true,
      username: true,
      isStaff: true,
      isAdmin: true,
      theme: true,
    },
  })

  if (!user) {
    redirect('/sign-in')
  }

  return (
    <div className={`theme-${user.theme}`} style={{ minHeight: '100vh' }}>
      <Inbox
        session={{
          uid: user.id,
          username: user.username,
          isStaff: user.isStaff,
          isAdmin: user.isAdmin,
          theme: user.theme,
        }}
      />
    </div>
  )
}

export const metadata = { title: 'Inbox — Bindu' }
