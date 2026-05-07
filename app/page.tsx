import Link from 'next/link'
import { auth } from '@/auth'

export const runtime = 'edge'

export default async function HomePage() {
  const session = await auth()
  const isSignedIn = !!session?.user

  return (
    <main className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="text-lg font-bold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--accent)' }}>বিন্দু</span>
        <div className="flex items-center gap-3">
          {isSignedIn ? (
            <Link href="/dashboard" className="text-sm font-semibold px-4 py-1.5 rounded hover:opacity-90 transition-opacity" style={{ background: 'var(--accent)', color: '#000' }}>
              Dashboard →
            </Link>
          ) : (
            <>
              <Link href="/sign-in" className="text-sm transition-colors" style={{ color: 'var(--text-muted)' }}>Sign in</Link>
              <Link href="/sign-up" className="text-sm font-semibold px-4 py-1.5 rounded hover:opacity-90 transition-opacity" style={{ background: 'var(--accent)', color: '#000' }}>
                Get your link
              </Link>
            </>
          )}
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-8" style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid rgba(0,230,118,0.2)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
            Zero friction. Completely anonymous.
          </div>
          <h1 className="text-5xl font-bold leading-tight mb-6" style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
            Receive messages<br />
            <span style={{ color: 'var(--accent)' }}>anonymously.</span>
          </h1>
          <p className="text-lg leading-relaxed mb-10" style={{ color: 'var(--text-muted)' }}>
            Share your link. Anyone can send you a message — no account, no login, no identity revealed. Ever.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {isSignedIn ? (
              <Link href="/dashboard" className="font-semibold px-6 py-3 rounded text-sm hover:opacity-90 active:scale-95 transition-all" style={{ background: 'var(--accent)', color: '#000', boxShadow: '0 0 24px rgba(0,230,118,0.15)' }}>
                Go to your inbox →
              </Link>
            ) : (
              <>
                <Link href="/sign-up" className="font-semibold px-6 py-3 rounded text-sm hover:opacity-90 active:scale-95 transition-all" style={{ background: 'var(--accent)', color: '#000', boxShadow: '0 0 24px rgba(0,230,118,0.15)' }}>
                  Get your free link →
                </Link>
                <Link href="/sign-in" className="text-sm px-4 py-3 transition-colors" style={{ color: 'var(--text-muted)' }}>
                  Already have an account
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl w-full text-left">
          {[
            { n: '01', title: 'Get your link', body: 'Sign up and receive a unique link like bindu.app/u/yourname.' },
            { n: '02', title: 'Share it', body: 'Post it on your bio, story, or anywhere. No setup required.' },
            { n: '03', title: 'Read your inbox', body: 'Messages arrive anonymously. No sender data is ever stored.' },
          ].map((s) => (
            <div key={s.n} className="p-5 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <span className="text-xs mb-3 block" style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{s.n}</span>
              <h3 className="font-semibold mb-2" style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>{s.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="px-6 py-4 flex items-center justify-center" style={{ borderTop: '1px solid var(--border)' }}>
        <span className="text-xs" style={{ color: 'var(--text-disabled)' }}>Bindu — বিন্দু — a single point of anonymous contact</span>
      </footer>
    </main>
  )
}
