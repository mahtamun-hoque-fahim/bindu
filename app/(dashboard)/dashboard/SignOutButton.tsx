'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { clientSignOut } from '@/lib/auth/client'

export function SignOutButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function go() {
    setBusy(true)
    await clientSignOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={go}
      disabled={busy}
      className="btn ghost"
      style={{ padding: '8px 14px', fontSize: 13 }}
    >
      {busy ? '…' : 'Sign out'}
    </button>
  )
}
