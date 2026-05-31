/**
 * Environment variable access.
 *
 * Do NOT validate at module scope — Cloudflare Pages and edge runtime
 * import this file at build time when env vars may not be set.
 * Validate lazily in routes/scripts that actually need them.
 */

export function env(key: string, required = true): string {
  const value = process.env[key]
  if (!value && required) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value ?? ''
}

export function hasEnv(key: string): boolean {
  return !!process.env[key]
}
