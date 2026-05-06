import { NextRequest, NextResponse } from 'next/server'
import { eq, and, ne } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { auth } from '@/auth'

export const runtime = 'edge'

export async function PATCH(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { username } = await req.json()
  if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 })

  const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
  if (clean.length < 3) {
    return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 })
  }
  if (clean.length > 32) {
    return NextResponse.json({ error: 'Username must be 32 characters or fewer' }, { status: 400 })
  }

  const db = getDb()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  // Check taken by someone else
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.username, clean), ne(users.id, userId)))
    .limit(1)

  if (existing) {
    return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
  }

  await db.update(users).set({ username: clean }).where(eq(users.id, userId))

  return NextResponse.json({ ok: true, username: clean })
}
