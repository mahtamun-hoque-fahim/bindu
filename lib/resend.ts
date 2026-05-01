import { Resend } from 'resend'

let resend: Resend | null = null

export function getResend() {
  if (!process.env.RESEND_API_KEY) return null
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY)
  return resend
}

export async function sendNewMessageNotification({
  toEmail,
  toName,
  username,
}: {
  toEmail: string
  toName: string
  username: string
}) {
  const client = getResend()
  if (!client) return

  const from = process.env.RESEND_FROM_EMAIL || 'no-reply@bindu.app'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bindu.app'

  await client.emails.send({
    from,
    to: toEmail,
    subject: 'You received an anonymous message on Bindu',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0a0a0a;color:#f5f5f5;padding:32px;border-radius:12px;">
        <h2 style="color:#00e676;font-size:20px;margin:0 0 16px">New anonymous message</h2>
        <p style="color:#888;font-size:14px;margin:0 0 24px">Hey ${toName}, someone sent you an anonymous message on Bindu.</p>
        <a href="${appUrl}/dashboard" style="display:inline-block;background:#00e676;color:#000;font-weight:600;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px;">
          View in inbox →
        </a>
        <p style="color:#444;font-size:12px;margin:24px 0 0">You're receiving this because email notifications are enabled. You can turn them off in your dashboard settings.</p>
      </div>
    `,
  })
}
