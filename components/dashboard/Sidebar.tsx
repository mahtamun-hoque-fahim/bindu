'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState } from 'react'
import type { User } from '@/lib/db/schema'

export default function DashboardSidebar({ user }: { user: User | null }) {
  const pathname = usePathname()
  const [copied, setCopied] = useState(false)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bindu.app'
  const shareUrl = user?.username ? `${appUrl}/u/${user.username}` : ''

  function copyLink() {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen shrink-0 px-5 py-6" style={{ borderRight: '1px solid var(--border)' }}>
        <Link href="/" className="block mb-8">
          <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--accent)' }}>বিন্দু</span>
        </Link>

        {user && (
          <div className="mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-3"
              style={{ background: 'var(--accent-dim)', border: '1px solid rgba(0,230,118,0.2)', color: 'var(--accent)', fontFamily: 'var(--font-syne)' }}>
              {(user.displayName || user.username || '?').charAt(0).toUpperCase()}
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{user.displayName || user.username}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>@{user.username}</p>
          </div>
        )}

        {shareUrl && (
          <div className="mb-6">
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Your link</p>
            <div className="flex items-center gap-2 rounded-md px-3 py-2" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
              <span className="text-xs flex-1 truncate" style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                {shareUrl.replace('https://', '')}
              </span>
              <button onClick={copyLink} className="text-xs shrink-0 font-medium hover:opacity-80 transition-opacity" style={{ color: 'var(--accent)' }}>
                {copied ? '✓' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        <nav className="flex flex-col gap-1 flex-1">
          {[{ href: '/dashboard', label: 'Inbox' }, { href: '/dashboard/settings', label: 'Settings' }].map(({ href, label }) => (
            <Link key={href} href={href} className="text-sm px-3 py-2 rounded transition-colors"
              style={{ color: pathname === href ? 'var(--accent)' : 'var(--text-muted)', background: pathname === href ? 'var(--accent-dim)' : 'transparent' }}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={() => signOut({ callbackUrl: '/' })} className="text-sm w-full text-left px-3 py-2 rounded transition-colors hover:text-[--text]" style={{ color: 'var(--text-muted)' }}>
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 py-3" style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        <span className="text-base font-bold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--accent)' }}>বিন্দু</span>
        <div className="flex items-center gap-3">
          {[{ href: '/dashboard', label: 'Inbox' }, { href: '/dashboard/settings', label: 'Settings' }].map(({ href, label }) => (
            <Link key={href} href={href} className="text-sm" style={{ color: pathname === href ? 'var(--accent)' : 'var(--text-muted)' }}>{label}</Link>
          ))}
          <button onClick={() => signOut({ callbackUrl: '/' })} className="text-sm" style={{ color: 'var(--text-muted)' }}>Sign out</button>
        </div>
      </div>
      <div className="md:hidden h-12" />
    </>
  )
}
