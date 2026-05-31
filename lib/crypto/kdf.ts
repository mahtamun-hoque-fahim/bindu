/**
 * Passphrase → Key Encryption Key (KEK).
 *
 * PBKDF2-SHA256, 600,000 iterations. OWASP 2023 minimum for SHA-256.
 * Slow on phones (1–4 seconds) — caller is expected to show a loading state.
 *
 * Argon2id would be stronger and is the modern recommendation, but ships
 * as ~150KB of WASM. PBKDF2 is native to WebCrypto and edge-compatible
 * with zero dependencies; we'll revisit Argon2id when ECDH key rotation
 * arrives in v2.
 */

import { CryptoUnavailableError } from './types'

const PBKDF2_ITERATIONS = 600_000
const PBKDF2_HASH = 'SHA-256'
const SALT_BYTES = 16

function requireSubtle(): SubtleCrypto {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new CryptoUnavailableError()
  }
  return crypto.subtle
}

/** Fresh 16-byte salt. Used at signup; stored alongside the wrapped private key. */
export function generateSalt(): Uint8Array {
  const salt = new Uint8Array(SALT_BYTES)
  crypto.getRandomValues(salt)
  return salt
}

/**
 * Derive an AES-256-GCM key from a passphrase + salt.
 *
 * Returns a non-extractable CryptoKey — the KEK should never leave the
 * browser as raw bytes. If the page tab is closed, the KEK is GC'd and
 * must be re-derived by re-entering the passphrase.
 */
export async function deriveKek(
  passphrase: string,
  salt: Uint8Array,
  iterations: number = PBKDF2_ITERATIONS,
): Promise<CryptoKey> {
  const subtle = requireSubtle()

  const passphraseBytes = new TextEncoder().encode(passphrase)
  const baseKey = await subtle.importKey(
    'raw',
    passphraseBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  )

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations,
      hash: PBKDF2_HASH,
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}
