import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mb-6"
        style={{ background: 'var(--surface)' }}
      >
        <span className="text-2xl" style={{ color: 'var(--text-muted)' }}>·</span>
      </div>
      <h1
        className="text-3xl font-bold mb-3"
        style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}
      >
        Not found
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
        This page doesn&apos;t exist, or the user hasn&apos;t signed up yet.
      </p>
      <Link
        href="/"
        className="text-sm font-semibold px-5 py-2.5 rounded transition-opacity hover:opacity-80"
        style={{ background: 'var(--accent)', color: '#000' }}
      >
        Go home
      </Link>
    </main>
  )
}
