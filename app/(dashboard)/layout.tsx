import { requireSession } from '@/lib/auth/server'

export const runtime = 'edge'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSession()
  return <>{children}</>
}
