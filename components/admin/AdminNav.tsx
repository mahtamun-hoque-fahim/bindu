'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

const navItems = [
  { href: '/admin', label: 'Overview', exact: true },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/messages', label: 'Messages' },
  { href: '/admin/moderation', label: 'Moderation' },
  { href: '/admin/banned-ips', label: 'Banned IPs' },
]

export default function AdminNav() {
  const pathname = usePathname()

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <>
      {/* Desktop */}
      <aside
        className="hidden md:flex flex-col w-52 min-h-screen shrink-0 px-4 py-5"
        style={{ borderRight: '1px solid var(--border)', background: 'var(--surface)' }}
      >
        <div className="mb-6">
          <Link href="/admin">
            <span className="text-sm font-bold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--accent)' }}>
              বিন্দু
            </span>
            <span className="text-xs ml-1.5 px-1.5 py-0.5 rounded font-medium" style={{ background: 'rgba(0,230,118,0.12)', color: 'var(--accent)' }}>
              admin
            </span>
          </Link>
        </div>

        <nav className="flex flex-col gap-0.5 flex-1">
          {navItems.map(({ href, label, exact }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center text-sm px-3 py-2 rounded transition-colors"
              style={{
                color: isActive(href, exact) ? 'var(--accent)' : 'var(--text-muted)',
                background: isActive(href, exact) ? 'var(--accent-dim)' : 'transparent',
              }}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="pt-4 flex flex-col gap-2" style={{ borderTop: '1px solid var(--border)' }}>
          <Link href="/dashboard" className="text-xs px-3 py-1.5 transition-colors" style={{ color: 'var(--text-disabled)' }}>
            ← User dashboard
          </Link>
          <button className="text-xs text-left px-3 py-1.5 transition-colors" style={{ color: 'var(--text-muted)' }} onClick={() => signOut({ callbackUrl: "/" })}>
              Sign out
            </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div
        className="md:hidden fixed top-0 inset-x-0 z-50 flex items-center gap-4 px-4 py-3 overflow-x-auto"
        style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
      >
        <span className="text-sm font-bold shrink-0" style={{ fontFamily: 'var(--font-syne)', color: 'var(--accent)' }}>admin</span>
        {navItems.map(({ href, label, exact }) => (
          <Link
            key={href}
            href={href}
            className="text-xs shrink-0 transition-colors"
            style={{ color: isActive(href, exact) ? 'var(--accent)' : 'var(--text-muted)' }}
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="md:hidden h-10" />
    </>
  )
}
