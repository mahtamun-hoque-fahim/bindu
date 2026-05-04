import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'
import DashboardSidebar from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')

  const db = getDb()
  const [dbUser] = db
    ? await db.select().from(users).where(eq(users.id, session.user.id)).limit(1)
    : []

  // Google OAuth users who haven't set a username yet
  if (dbUser && !dbUser.username) {
    redirect('/onboarding')
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      <DashboardSidebar user={dbUser ?? null} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
