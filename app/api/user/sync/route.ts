import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'

export const runtime = 'edge'

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clerkUser = await currentUser()
  if (!clerkUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const db = getDb()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  const username =
    clerkUser.username ||
    clerkUser.emailAddresses[0]?.emailAddress.split('@')[0] ||
    userId.slice(-8)

  const displayName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
    username

  const email = clerkUser.emailAddresses[0]?.emailAddress

  // Upsert
  await db
    .insert(users)
    .values({ id: userId, username, displayName, email })
    .onConflictDoUpdate({
      target: users.id,
      set: { displayName, email },
    })

  return NextResponse.json({ ok: true, username })
}
