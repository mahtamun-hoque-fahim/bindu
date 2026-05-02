import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { assertAdmin } from '@/lib/admin-auth'

export const runtime = 'edge'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await assertAdmin()
  if (auth instanceof Response) return auth

  const { id } = await params

  const db = getDb()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  await db.delete(users).where(eq(users.id, id))

  return NextResponse.json({ ok: true })
}
