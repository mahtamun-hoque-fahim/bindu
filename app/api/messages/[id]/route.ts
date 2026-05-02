import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { eq, and } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { messages, users } from '@/lib/db/schema'

export const runtime = 'edge'

async function getAuthenticatedUserId() {
  const session = await auth()
  const userId = session?.user?.id
  return userId
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthenticatedUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const messageId = parseInt(id, 10)
  if (isNaN(messageId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const db = getDb()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  // Verify the message belongs to this user
  const deleted = await db
    .delete(messages)
    .where(and(eq(messages.id, messageId), eq(messages.recipientId, userId)))
    .returning({ id: messages.id })

  if (deleted.length === 0) {
    return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthenticatedUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const messageId = parseInt(id, 10)
  if (isNaN(messageId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const { isRead } = await req.json()
  if (typeof isRead !== 'boolean') {
    return NextResponse.json({ error: 'isRead must be boolean' }, { status: 400 })
  }

  const db = getDb()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  const updated = await db
    .update(messages)
    .set({ isRead })
    .where(and(eq(messages.id, messageId), eq(messages.recipientId, userId)))
    .returning({ id: messages.id })

  if (updated.length === 0) {
    return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
