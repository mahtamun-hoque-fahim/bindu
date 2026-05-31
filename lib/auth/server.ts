/**
 * Server-side auth gates. Call from route handlers and protected layouts.
 *
 * Cannot use middleware/proxy for this — Next 16's proxy is Node-runtime
 * only, which @opennextjs/cloudflare rejects. Instead, every protected
 * route checks its own session at the top.
 */

import { redirect } from 'next/navigation'
import { getSession, type Session } from '@/lib/session'

/**
 * Get the current session or redirect to /sign-in. For Server Components
 * and layouts only.
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession()
  if (!session) redirect('/sign-in')
  return session
}

export async function requireStaff(): Promise<Session> {
  const session = await requireSession()
  if (!session.s && !session.a) redirect('/dashboard')
  return session
}

export async function requireAdmin(): Promise<Session> {
  const session = await requireSession()
  if (!session.a) redirect('/dashboard')
  return session
}

/**
 * Get the current session or redirect to /dashboard if signed in.
 * Used by the sign-in / sign-up pages.
 */
export async function requireAnon(): Promise<void> {
  const session = await getSession()
  if (session) redirect('/dashboard')
}

/**
 * For Route Handlers — returns the session or a 401 Response.
 * Caller pattern:
 *
 *     export async function GET() {
 *       const session = await requireSessionApi()
 *       if (session instanceof Response) return session
 *       // ... use session.uid
 *     }
 */
export async function requireSessionApi(): Promise<Session | Response> {
  const session = await getSession()
  if (!session) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    })
  }
  return session
}

export async function requireStaffApi(): Promise<Session | Response> {
  const session = await requireSessionApi()
  if (session instanceof Response) return session
  if (!session.s && !session.a) {
    return new Response(JSON.stringify({ error: 'forbidden' }), {
      status: 403,
      headers: { 'content-type': 'application/json' },
    })
  }
  return session
}

export async function requireAdminApi(): Promise<Session | Response> {
  const session = await requireSessionApi()
  if (session instanceof Response) return session
  if (!session.a) {
    return new Response(JSON.stringify({ error: 'forbidden' }), {
      status: 403,
      headers: { 'content-type': 'application/json' },
    })
  }
  return session
}
