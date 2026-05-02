import SignInForm from '@/components/auth/SignInForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Sign in — Bindu' }

export default function SignInPage() {
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
            Welcome back
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Sign in to your Bindu account
          </p>
        </div>
        <SignInForm />
      </div>
    </main>
  )
}
