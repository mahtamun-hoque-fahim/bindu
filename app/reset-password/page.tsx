import ResetPasswordForm from '@/components/auth/ResetPasswordForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Reset password — Bindu' }
export const runtime = 'edge'

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--font-syne)', color: 'var(--accent)' }}
          >
            বিন্দু
          </span>
          <h1
            className="text-xl font-bold mt-3 mb-1"
            style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}
          >
            Set a new password
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Choose a password you haven't used before
          </p>
        </div>
        <ResetPasswordForm />
      </div>
    </main>
  )
}
