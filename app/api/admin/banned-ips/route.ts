import { NextRequest, NextResponse } from 'next/server'
import { desc } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { bannedIps } from '@/lib/db/schema'
import { assertAdmin } from '@/lib/admin-auth'

export const runtime = 'edge'

export async function GET() {
  const auth = await assertAdmin()
  if (auth instanceof Response) return auth

  const db = getDb()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  const rows = await db.select().from(bannedIps).orderBy(desc(bannedIps.createdAt))

  return NextResponse.json({ ips: rows })
}

export async function POST(req: NextRequest) {
  const auth = await assertAdmin()
  if (auth instanceof Response) return auth

  const { ip, reason } = await req.json()
  if (!ip) return NextResponse.json({ error: 'IP required' }, { status: 400 })

  const db = getDb()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  await db
    .insert(bannedIps)
    .values({ ip, reason: reason || null, bannedBy: auth.userId })
    .onConflictDoNothing()

  return NextResponse.json({ ok: true })
}
