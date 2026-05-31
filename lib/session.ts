/**
 * Edge-safe HMAC-SHA256 session cookies.
 *
 * We don't use a JWT library — they all carry algorithm-negotiation
 * surface (alg: none attacks, RSA-vs-HMAC confusion) we don't want.
 * This is HS256 with a fixed algorithm and a single secret.
 *
 * Format: `${base64url(JSON.payload)}.${base64url(HMAC-SHA256(payload))}`
 * Cookie attrs: HttpOnly, Secure (in prod), SameSite=Lax, Path=/, 30 days.
 *
 * The session payload deliberately holds NO cryptographic key material —
 * just the user's UUID, username, role flags, and expiry. The recipient's
 * actual private key lives only inside their browser (IndexedDB after
 * unwrap; see lib/key-cache.ts).
 */

import { cookies } from 'next/headers'
import { bytesToBase64, base64ToBytes } from '@/lib/utils'
import { env } from '@/lib/env'

const COOKIE_NAME = 'bindu:session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30 // 30 days

export type Session = {
  uid: string // user UUID
  u: string // username
  s: boolean // isStaff
  a: boolean // isAdmin
  exp: number // unix seconds
}

// ─── base64url helpers ─────────────────────────────────────────────────────

function bytesToB64Url(b: Uint8Array): string {
  return bytesToBase64(b)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function b64UrlToBytes(s: string): Uint8Array {
  // re-pad
  const pad = '='.repeat((4 - (s.length % 4)) % 4)
  const std = (s + pad).replace(/-/g, '+').replace(/_/g, '/')
  return base64ToBytes(std)
}

// ─── HMAC over the session secret ───────────────────────────────────────────

async function getSigningKey(): Promise<CryptoKey> {
  const secret = env('SESSION_SECRET')
  const keyData = new TextEncoder().encode(secret)
  return crypto.subtle.importKey(
    'raw',
    keyData as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

/** Constant-time byte comparison. */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

// ─── Sign + verify ────────────────────────────────────────────────────────

/**
 * Sign a session payload, returning the cookie value `payload.sig`.
 * Caller decides expiry; this just adds the signature.
 */
export async function signSession(payload: Session): Promise<string> {
  const payloadJson = JSON.stringify(payload)
  const payloadBytes = new TextEncoder().encode(payloadJson)
  const payloadB64 = bytesToB64Url(payloadBytes)

  const key = await getSigningKey()
  const sigBuf = await crypto.subtle.sign(
    'HMAC',
    key,
    payloadBytes as BufferSource,
  )
  const sigB64 = bytesToB64Url(new Uint8Array(sigBuf))
  return `${payloadB64}.${sigB64}`
}

/**
 * Verify a cookie value. Returns the session payload if valid + unexpired,
 * else null. Never throws on bad input — invalid cookies just look like
 * "no session" to callers.
 */
export async function verifySession(value: string): Promise<Session | null> {
  if (!value || typeof value !== 'string') return null
  const parts = value.split('.')
  if (parts.length !== 2) return null
  const [payloadB64, sigB64] = parts

  let payloadBytes: Uint8Array
  let sigBytes: Uint8Array
  try {
    payloadBytes = b64UrlToBytes(payloadB64)
    sigBytes = b64UrlToBytes(sigB64)
  } catch {
    return null
  }

  const key = await getSigningKey()
  const expectedSigBuf = await crypto.subtle.sign(
    'HMAC',
    key,
    payloadBytes as BufferSource,
  )
  if (!timingSafeEqual(new Uint8Array(expectedSigBuf), sigBytes)) return null

  let payload: Session
  try {
    payload = JSON.parse(new TextDecoder().decode(payloadBytes))
  } catch {
    return null
  }

  // Shape check
  if (
    typeof payload.uid !== 'string' ||
    typeof payload.u !== 'string' ||
    typeof payload.exp !== 'number'
  )
    return null

  // Expiry check
  if (payload.exp < Math.floor(Date.now() / 1000)) return null

  return payload
}

// ─── Cookie set/get/clear ─────────────────────────────────────────────────

/**
 * Mint a new session for a freshly-authenticated user and set the cookie.
 * Only callable from Route Handlers or Server Actions (Next 16 cookie API).
 */
export async function setSession(payload: Omit<Session, 'exp'>): Promise<Session> {
  const session: Session = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  }
  const value = await signSession(session)
  const store = await cookies()
  store.set({
    name: COOKIE_NAME,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
  return session
}

/**
 * Read + verify the current request's session. Returns null when absent or
 * invalid. Safe to call from Server Components, layouts, and route handlers.
 */
export async function getSession(): Promise<Session | null> {
  const store = await cookies()
  const cookie = store.get(COOKIE_NAME)
  if (!cookie?.value) return null
  return verifySession(cookie.value)
}

/** Clear the session cookie. Route Handler / Server Action only. */
export async function clearSession(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}
