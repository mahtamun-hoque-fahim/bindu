import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export async function requireAdmin() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect('/sign-in')

  // Check role from Clerk publicMetadata (set via Clerk dashboard or API)
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'admin') redirect('/')

  return { userId }
}

export async function getAdminUser() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return null
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'admin') return null
  return { userId }
}

/** For API routes — returns 403 response if not admin */
export async function assertAdmin(): Promise<{ userId: string } | Response> {
  const { userId, sessionClaims } = await auth()
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
  }
  return { userId }
}
