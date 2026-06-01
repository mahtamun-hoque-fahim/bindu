import { redirect } from 'next/navigation'
import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireStaff } from '@/lib/auth/server'
import { StaffView } from './StaffView'

export const runtime = 'edge'

export default async function StaffPage() {
  const session = await requireStaff()

  const db = getDb()
  if (!db) redirect('/dashboard')

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.uid),
    columns: { id: true, username: true, theme: true, isAdmin: true },
  })
  if (!user) redirect('/sign-in')

  return (
    <div className={`theme-${user.theme}`} style={{ minHeight: '100vh' }}>
      <StaffView
        session={{
          uid: user.id,
          username: user.username,
          isAdmin: user.isAdmin,
        }}
      />
    </div>
  )
}

export const metadata = { title: 'Moderation — Bindu' }
