'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignOutButton } from '@clerk/nextjs'
import { useState } from 'react'
import type { User } from '@/lib/db/schema'

type Props = { user: User | null }

export default function DashboardSidebar({ user }: Props) {
  const pathname = usePathname()
  const [copied, setCopied] = useState(false)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bindu.app'
  const shareUrl = user ? `${appUrl}/u/${user.username}` : ''

  function copyLink() {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col w-64 min-h-screen shrink-0 px-5 py-6"
        style={{ borderRight: '1px solid var(--border)' }}
      >
        <SidebarContent
          user={user}
          pathname={pathname}
          shareUrl={shareUrl}
          copied={copied}
          onCopy={copyLink}
        />
      </aside>

      {/* Mobile top bar */}
      <div
        className="md:hidden fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 py-3"
        style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
      >
        <span
          className="text-base font-bold"
          style={{ fontFamily: 'var(--font-syne)', color: 'var(--accent)' }}
        >
          বিন্দু
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-sm"
            style={{ color: pathname === '/dashboard' ? 'var(--accent)' : 'var(--text-muted)' }}
          >
            Inbox
          </Link>
          <Link
            href="/dashboard/settings"
            className="text-sm"
            style={{
              color: pathname === '/dashboard/settings' ? 'var(--accent)' : 'var(--text-muted)',
            }}
          >
            Settings
          </Link>
          <SignOutButton>
            <button className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Sign out
            </button>
          </SignOutButton>
        </div>
      </div>

      {/* Mobile spacer */}
      <div className="md:hidden h-12" />
    </>
  )
}

function SidebarContent({
  user,
  pathname,
  shareUrl,
  copied,
  onCopy,
}: {
  user: User | null
  pathname: string
  shareUrl: string
  copied: boolean
  onCopy: () => void
}) {
  return (
    <>
      {/* Logo */}
      <Link href="/" className="block mb-8">
        <span
          className="text-xl font-bold"
          style={{ fontFamily: 'var(--font-syne)', color: 'var(--accent)' }}
        >
          বিন্দু
        </span>
      </Link>

      {/* User info */}
      {user && (
        <div className="mb-6">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-3"
            style={{
              background: 'var(--accent-dim)',
              border: '1px solid rgba(0,230,118,0.2)',
              color: 'var(--accent)',
              fontFamily: 'var(--font-syne)',
            }}
          >
            {(user.displayName || user.username).charAt(0).toUpperCase()}
          </div>
          <p className="text-sm font-medium text-[--text]">{user.displayName || user.username}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            @{user.username}
          </p>
        </div>
      )}

      {/* Share link */}
      {shareUrl && (
        <div className="mb-6">
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
            Your link
          </p>
          <div
            className="flex items-center gap-2 rounded-md px-3 py-2"
            style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
          >
            <span
              className="text-xs flex-1 truncate"
              style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}
            >
              {shareUrl.replace('https://', '')}
            </span>
            <button
              onClick={onCopy}
              className="text-xs shrink-0 hover:opacity-80 transition-opacity font-medium"
              style={{ color: 'var(--accent)' }}
            >
              {copied ? '✓' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {[
          { href: '/dashboard', label: 'Inbox' },
          { href: '/dashboard/settings', label: 'Settings' },
        ].map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="text-sm px-3 py-2 rounded transition-colors"
            style={{
              color: pathname === href ? 'var(--accent)' : 'var(--text-muted)',
              background: pathname === href ? 'var(--accent-dim)' : 'transparent',
            }}
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* Sign out */}
      <div className="mt-auto pt-4" style={{ borderTop: '1px solid var(--border)' }}>
        <SignOutButton>
          <button
            className="text-sm w-full text-left px-3 py-2 rounded transition-colors hover:text-[--text]"
            style={{ color: 'var(--text-muted)' }}
          >
            Sign out
          </button>
        </SignOutButton>
      </div>
    </>
  )
}
