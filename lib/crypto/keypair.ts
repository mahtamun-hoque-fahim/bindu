/**
 * ECDH P-256 keypair handling.
 *
 * The recipient's long-lived identity key. Generated once at signup,
 * privKey is wrapped under the passphrase-derived KEK before leaving
 * the browser. Public half is published.
 *
 * P-256 chosen over P-384/X25519:
 *   - P-256 is in every WebCrypto implementation we'd ship on
 *   - X25519 is the standard for new systems, but WebCrypto support
 *     is uneven (Safari only in 17+, Firefox only behind a flag <120).
 *     We can migrate when X25519 hits universal support.
 */

import { CryptoUnavailableError } from './types'

const ECDH_PARAMS: EcKeyGenParams = {
  name: 'ECDH',
  namedCurve: 'P-256',
}

/** Sanity check before any crypto call. */
function requireSubtle(): SubtleCrypto {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new CryptoUnavailableError()
  }
  return crypto.subtle
}

/**
 * Generate a new recipient identity keypair. Both keys are extractable
 * because we need to export the public key (for publishing) and the
 * private key (to wrap with the KEK).
 */
export async function generateRecipientKeypair(): Promise<CryptoKeyPair> {
  const subtle = requireSubtle()
  return subtle.generateKey(ECDH_PARAMS, true, ['deriveKey']) as Promise<CryptoKeyPair>
}

export async function exportPublicJwk(key: CryptoKey): Promise<JsonWebKey> {
  return requireSubtle().exportKey('jwk', key)
}

export async function exportPrivateJwk(key: CryptoKey): Promise<JsonWebKey> {
  return requireSubtle().exportKey('jwk', key)
}

/**
 * Import a recipient's public key (from `/api/pubkey/[username]`).
 *
 * ECDH public keys take `usages: []` per the spec — only the private
 * half holds `deriveKey`. Setting `extractable: true` lets callers
 * re-export if needed (handy for debugging).
 */
export async function importPublicJwk(jwk: JsonWebKey): Promise<CryptoKey> {
  return requireSubtle().importKey('jwk', jwk, ECDH_PARAMS, true, [])
}

/**
 * Import the recipient's own private key after unwrapping. Non-extractable
 * so a compromised page script can't read it back out.
 */
export async function importPrivateJwk(jwk: JsonWebKey): Promise<CryptoKey> {
  return requireSubtle().importKey('jwk', jwk, ECDH_PARAMS, false, ['deriveKey'])
}
