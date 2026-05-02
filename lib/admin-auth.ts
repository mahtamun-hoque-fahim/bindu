import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { admins } from '@/lib/db/schema'

async function isAdmin(userId: string): Promise<boolean> {
  const db = getDb()
  if (!db) return false
  const [row] = await db
    .select()
    .from(admins)
    .where(eq(admins.userId, userId))
    .limit(1)
  return !!row
}

export async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')
  const ok = await isAdmin(session.user.id)
  if (!ok) redirect('/')
  return { userId: session.user.id }
}

export async function assertAdmin(): Promise<{ userId: string } | Response> {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    })
  }
  const ok = await isAdmin(session.user.id)
  if (!ok) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    })
  }
  return { userId: session.user.id }
}
