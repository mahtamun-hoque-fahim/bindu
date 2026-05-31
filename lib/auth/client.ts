'use client'

/**
 * Client-side signup/signin orchestration.
 *
 * These functions drive the crypto stack from a Client Component and POST
 * the resulting envelope to /api/auth/sign-{up,in}. The server never sees
 * unwrapped key material.
 */

import {
  generateRecipientKeypair,
  exportPublicJwk,
  generateSalt,
  deriveKek,
  wrapPrivateKey,
  unwrapPrivateKey,
  WrongPassphraseError,
  type WrappedPrivateKey,
} from '@/lib/crypto'
import { bytesToBase64 } from '@/lib/utils'
import { cachePrivateKey, clearAllCachedKeys } from '@/lib/key-cache'

export type SignUpRequest = {
  username: string
  passphrase: string
  pubKey: JsonWebKey
  encPrivKey: WrappedPrivateKey
}

export type SignInRequest = {
  username: string
  passphrase: string
}

export type SignInResponse = {
  ok: true
  uid: string
  username: string
  isStaff: boolean
  isAdmin: boolean
  encPrivKey: WrappedPrivateKey
}

export type AuthError = {
  ok: false
  error: string
}

/**
 * Full client-side signup flow.
 *
 *   1. Generate ECDH identity keypair (browser-only)
 *   2. Derive KEK from passphrase + fresh salt
 *   3. Wrap private key under KEK
 *   4. POST {username, passphrase, pubKey, encPrivKey} to /api/auth/sign-up
 *      (server bcrypts the passphrase + stores the rest)
 *   5. Cache the unwrapped private key in IndexedDB for this session
 *
 * Caller is responsible for UI loading state (this can take 2+ seconds
 * on slow phones due to PBKDF2).
 */
export async function clientSignUp(
  username: string,
  passphrase: string,
): Promise<{ ok: true } | AuthError> {
  // 1. Keypair
  const keypair = await generateRecipientKeypair()
  const pubKey = await exportPublicJwk(keypair.publicKey)

  // 2. KEK
  const salt = generateSalt()
  const kek = await deriveKek(passphrase, salt)

  // 3. Wrap
  const { ciphertext, iv } = await wrapPrivateKey(keypair.privateKey, kek)
  const encPrivKey: WrappedPrivateKey = {
    ciphertext,
    iv,
    salt: bytesToBase64(salt),
  }

  // 4. POST
  const res = await fetch('/api/auth/sign-up', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      username,
      passphrase,
      pubKey,
      encPrivKey,
    } as SignUpRequest),
  })

  if (!res.ok) {
    let err: AuthError = { ok: false, error: `Signup failed (${res.status})` }
    try {
      const body = await res.json()
      if (body && body.error) err = { ok: false, error: body.error }
    } catch {}
    return err
  }

  // 5. Cache the freshly-unwrapped private key (we already have it).
  await cachePrivateKey(keypair.privateKey)
  return { ok: true }
}

/**
 * Full client-side signin flow.
 *
 *   1. POST {username, passphrase} → server bcrypt-compares
 *   2. On success, server returns {uid, encPrivKey, ...}
 *   3. Derive KEK from passphrase + returned salt
 *   4. Unwrap private key, cache in IndexedDB
 *
 * If the server says ok but the unwrap fails, that's a corruption — we
 * tell the user to contact support (this should never happen).
 */
export async function clientSignIn(
  username: string,
  passphrase: string,
): Promise<{ ok: true } | AuthError> {
  const res = await fetch('/api/auth/sign-in', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, passphrase } as SignInRequest),
  })

  if (!res.ok) {
    let err: AuthError = { ok: false, error: 'Wrong username or passphrase' }
    if (res.status === 429) err = { ok: false, error: 'Too many attempts. Wait a few minutes.' }
    return err
  }

  let body: SignInResponse
  try {
    body = await res.json()
  } catch {
    return { ok: false, error: 'Unexpected response' }
  }

  // Decode salt and unwrap
  try {
    const { base64ToBytes } = await import('@/lib/utils')
    const salt = base64ToBytes(body.encPrivKey.salt)
    const kek = await deriveKek(passphrase, salt)
    const privateKey = await unwrapPrivateKey(body.encPrivKey, kek)
    await cachePrivateKey(privateKey)
    return { ok: true }
  } catch (err) {
    if (err instanceof WrongPassphraseError) {
      // This shouldn't normally happen (server already validated), but if
      // the wrap is corrupted we surface it cleanly.
      return { ok: false, error: 'Inbox key could not be unlocked' }
    }
    return { ok: false, error: 'Failed to unlock inbox' }
  }
}

/** Sign out — clears server cookie and browser key cache. */
export async function clientSignOut(): Promise<void> {
  await fetch('/api/auth/sign-out', { method: 'POST' })
  await clearAllCachedKeys()
}
