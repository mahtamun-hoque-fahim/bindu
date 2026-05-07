import { requireAdmin } from '@/lib/admin-auth'
import AdminNav from '@/components/admin/AdminNav'

export const runtime = 'edge'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      <AdminNav />
      <main className="flex-1 min-w-0 overflow-auto">{children}</main>
    </div>
  )
}
