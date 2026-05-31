import { clearSession } from '@/lib/session'

export const runtime = 'edge'

export async function POST() {
  await clearSession()
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}
