import { redirect } from 'next/navigation'
import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '@/lib/auth/server'
import { AdminView } from './AdminView'

export const runtime = 'edge'

export default async function AdminPage() {
  const session = await requireAdmin()

  const db = getDb()
  if (!db) redirect('/dashboard')

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.uid),
    columns: { id: true, username: true, theme: true, isStaff: true },
  })
  if (!user) redirect('/sign-in')

  return (
    <div className={`theme-${user.theme}`} style={{ minHeight: '100vh' }}>
      <AdminView
        session={{
          uid: user.id,
          username: user.username,
          isStaff: user.isStaff,
        }}
      />
    </div>
  )
}

export const metadata = { title: 'Admin — Bindu' }
