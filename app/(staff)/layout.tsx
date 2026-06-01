import { requireStaff } from '@/lib/auth/server'

export const runtime = 'edge'

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireStaff()
  return <>{children}</>
}
