import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'
import DashboardSidebar from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  // Sync user to DB if needed
  const db = getDb()
  let dbUser = null

  if (db) {
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!existing) {
      // First time — sync from Clerk
      const clerkUser = await currentUser()
      if (clerkUser) {
        const username =
          clerkUser.username ||
          clerkUser.emailAddresses[0]?.emailAddress.split('@')[0] ||
          userId.slice(-8)
        const displayName =
          [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || username
        const email = clerkUser.emailAddresses[0]?.emailAddress

        const [inserted] = await db
          .insert(users)
          .values({ id: userId, username, displayName, email })
          .onConflictDoUpdate({ target: users.id, set: { displayName, email } })
          .returning()
        dbUser = inserted
      }
    } else {
      dbUser = existing
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      <DashboardSidebar user={dbUser} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
