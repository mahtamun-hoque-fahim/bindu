import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'

export const runtime = 'edge'

export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { emailNotifications } = await req.json()
  if (typeof emailNotifications !== 'boolean') {
    return NextResponse.json({ error: 'Invalid value' }, { status: 400 })
  }

  const db = getDb()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  await db
    .update(users)
    .set({ emailNotifications })
    .where(eq(users.id, userId))

  return NextResponse.json({ ok: true })
}
