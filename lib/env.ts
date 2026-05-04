/**
 * Validates required environment variables at startup.
 * Import this in any Server Component or API route that needs env vars.
 * On Vercel: build fails fast with a clear error instead of a silent undefined.
 */

const REQUIRED_SERVER = [
  'DATABASE_URL',
  'AUTH_SECRET',
] as const

const REQUIRED_OAUTH = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
] as const

export function validateEnv() {
  const missing: string[] = []

  for (const key of REQUIRED_SERVER) {
    if (!process.env[key]) missing.push(key)
  }

  // OAuth is required for Google sign-in but won't crash the app if only credentials used
  for (const key of REQUIRED_OAUTH) {
    if (!process.env[key]) {
      console.warn(`[env] Warning: ${key} is not set. Google OAuth will be unavailable.`)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `[env] Missing required environment variables:\n  ${missing.join('\n  ')}\n\nAdd them to your Vercel dashboard or .env.local for local development.`
    )
  }
}

/** Quick boolean checks for optional services */
export const env = {
  hasRedis: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
  hasResend: !!process.env.RESEND_API_KEY,
  hasGoogle: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://bindu.app',
}
