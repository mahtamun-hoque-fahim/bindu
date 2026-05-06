import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { users, passwordResetTokens } from '@/lib/db/schema'
import { getResend } from '@/lib/resend'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const db = getDb()
    if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

    const [user] = await db
      .select({ id: users.id, email: users.email, displayName: users.displayName, name: users.name })
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()))
      .limit(1)

    // Always return 200 — never reveal whether email exists
    if (!user) return NextResponse.json({ ok: true })

    // Generate a secure token
    const token = crypto.randomUUID() + crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60) // 1 hour

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bindu.app'
    const resetUrl = `${appUrl}/reset-password?token=${token}`
    const toName = user.displayName || user.name || 'there'
    const from = process.env.RESEND_FROM_EMAIL || 'no-reply@bindu.app'

    const resend = getResend()
    if (resend) {
      await resend.emails.send({
        from,
        to: user.email!,
        subject: 'Reset your Bindu password',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0a0a0a;color:#f5f5f5;padding:32px;border-radius:12px;">
            <h2 style="color:#00e676;font-size:20px;margin:0 0 16px">Reset your password</h2>
            <p style="color:#888;font-size:14px;margin:0 0 24px">Hey ${toName}, click the button below to reset your password. This link expires in 1 hour.</p>
            <a href="${resetUrl}" style="display:inline-block;background:#00e676;color:#000;font-weight:600;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px;">
              Reset password →
            </a>
            <p style="color:#444;font-size:12px;margin:24px 0 0">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/auth/forgot-password]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
