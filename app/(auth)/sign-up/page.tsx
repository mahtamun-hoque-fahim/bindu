import { SignUpForm } from './SignUpForm'

export const runtime = 'edge'

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ username?: string }>
}) {
  const sp = await searchParams
  return <SignUpForm initialUsername={sp.username ?? ''} />
}

export const metadata = {
  title: 'Sign up — Bindu',
  description: 'Claim your anonymous inbox in under a minute.',
}
