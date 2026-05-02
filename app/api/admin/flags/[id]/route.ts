import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { flags } from '@/lib/db/schema'
import { assertAdmin } from '@/lib/admin-auth'

export const runtime = 'edge'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await assertAdmin()
  if (auth instanceof Response) return auth

  const { id } = await params
  const flagId = parseInt(id, 10)
  if (isNaN(flagId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const { status } = await req.json() // 'resolved' | 'dismissed'
  if (!['resolved', 'dismissed'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const db = getDb()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  await db
    .update(flags)
    .set({
      status,
      resolvedBy: auth.userId,
      resolvedAt: new Date(),
    })
    .where(eq(flags.id, flagId))

  return NextResponse.json({ ok: true })
}
