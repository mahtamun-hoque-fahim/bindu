import { NextRequest, NextResponse } from 'next/server'
import { eq, and, gt, isNull } from 'drizzle-orm'
import { hash } from 'bcryptjs'
import { getDb } from '@/lib/db'
import { users, passwordResetTokens } from '@/lib/db/schema'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password required' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const db = getDb()
    if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

    // Find valid, unexpired, unused token
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          gt(passwordResetTokens.expiresAt, new Date()),
          isNull(passwordResetTokens.usedAt)
        )
      )
      .limit(1)

    if (!resetToken) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    const hashedPassword = await hash(password, 12)

    // Update password + mark token used in parallel
    await Promise.all([
      db.update(users).set({ password: hashedPassword }).where(eq(users.id, resetToken.userId)),
      db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, resetToken.id)),
    ])

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/auth/reset-password]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
