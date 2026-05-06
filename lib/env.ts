const REQUIRED_SERVER = ['DATABASE_URL', 'AUTH_SECRET'] as const

export function validateEnv() {
  const missing: string[] = []
  for (const key of REQUIRED_SERVER) {
    if (!process.env[key]) missing.push(key)
  }
  if (missing.length > 0) {
    throw new Error(
      `[env] Missing required environment variables:\n  ${missing.join('\n  ')}`
    )
  }
}

export const env = {
  hasRedis: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
  hasResend: !!process.env.RESEND_API_KEY,
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://bindu.app',
}
