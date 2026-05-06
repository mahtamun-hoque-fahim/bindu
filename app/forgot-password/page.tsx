import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Forgot password — Bindu' }
export const runtime = 'edge'

export default function ForgotPasswordPage() {
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
            Forgot your password?
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Enter your email and we'll send you a reset link
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </main>
  )
}
