import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { messages } from '@/lib/db/schema'
import { assertAdmin } from '@/lib/admin-auth'

export const runtime = 'edge'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await assertAdmin()
  if (auth instanceof Response) return auth

  const { id } = await params
  const messageId = parseInt(id, 10)
  if (isNaN(messageId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const db = getDb()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  await db
    .update(messages)
    .set({ isDeleted: true, deletedBy: 'admin' })
    .where(eq(messages.id, messageId))

  return NextResponse.json({ ok: true })
}
