import { SignInForm } from './SignInForm'

export const runtime = 'edge'

export default function SignInPage() {
  return <SignInForm />
}

export const metadata = {
  title: 'Sign in — Bindu',
  description: 'Unlock your anonymous inbox.',
}
