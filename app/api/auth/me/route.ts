import { getSession } from '@/lib/session'

export const runtime = 'edge'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }
  return new Response(
    JSON.stringify({
      ok: true,
      uid: session.uid,
      username: session.u,
      isStaff: session.s,
      isAdmin: session.a,
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  )
}
