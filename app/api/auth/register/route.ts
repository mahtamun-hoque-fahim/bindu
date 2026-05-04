import { NextRequest, NextResponse } from 'next/server'
import { eq, or } from 'drizzle-orm'
import { hash } from '@node-rs/bcrypt'
import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'

export async function POST(req: NextRequest) {
  try {
    const { name, email, username, password } = await req.json()

    if (!email || !username || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
    if (cleanUsername.length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const db = getDb()
    if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

    // Check uniqueness
    const [existing] = await db
      .select({ id: users.id, email: users.email, username: users.username })
      .from(users)
      .where(or(eq(users.email, email.trim()), eq(users.username, cleanUsername)))
      .limit(1)

    if (existing?.email === email.trim()) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }
    if (existing?.username === cleanUsername) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    }

    const hashedPassword = await hash(password, 12)

    const [user] = await db
      .insert(users)
      .values({
        email: email.trim().toLowerCase(),
        username: cleanUsername,
        displayName: name?.trim() || cleanUsername,
        password: hashedPassword,
      })
      .returning({ id: users.id, username: users.username })

    return NextResponse.json({ ok: true, userId: user.id, username: user.username })
  } catch (err) {
    console.error('[POST /api/auth/register]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
