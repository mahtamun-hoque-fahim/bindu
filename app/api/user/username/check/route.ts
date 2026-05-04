import { NextRequest, NextResponse } from 'next/server'
import { eq, and, ne } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { auth } from '@/auth'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ available: false })

  const { searchParams } = new URL(req.url)
  const username = searchParams.get('username') || ''
  const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')

  if (clean.length < 3 || clean.length > 32) {
    return NextResponse.json({ available: false })
  }

  const db = getDb()
  if (!db) return NextResponse.json({ available: false })

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.username, clean), ne(users.id, userId)))
    .limit(1)

  return NextResponse.json({ available: !existing })
}
