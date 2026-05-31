/**
 * Wrap the recipient's long-lived private key under their KEK so the
 * server can hold the ciphertext without ever holding the plaintext key.
 *
 * Format: AES-256-GCM(JSON.stringify(privateKeyJWK), KEK, iv).
 */

import { exportPrivateJwk, importPrivateJwk } from './keypair'
import { bytesToBase64, base64ToBytes } from '@/lib/utils'
import { WrongPassphraseError, type WrappedPrivateKey } from './types'

const IV_BYTES = 12

/**
 * Wrap a private CryptoKey under a KEK. Caller assembles the final
 * `WrappedPrivateKey` by combining this output with the salt used to
 * derive the KEK.
 */
export async function wrapPrivateKey(
  privateKey: CryptoKey,
  kek: CryptoKey,
): Promise<{ ciphertext: string; iv: string }> {
  const jwk = await exportPrivateJwk(privateKey)
  const plaintext = new TextEncoder().encode(JSON.stringify(jwk))

  const iv = new Uint8Array(IV_BYTES)
  crypto.getRandomValues(iv)

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    kek,
    plaintext as BufferSource,
  )

  return {
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
    iv: bytesToBase64(iv),
  }
}

/**
 * Unwrap a private CryptoKey using the KEK.
 *
 * If the passphrase was wrong, the KEK derived from it will not match
 * the one used to wrap — AES-GCM throws on tag mismatch. We catch and
 * rethrow as `WrongPassphraseError` so the UI can show a useful message
 * instead of a generic DOMException.
 */
export async function unwrapPrivateKey(
  wrapped: Pick<WrappedPrivateKey, 'ciphertext' | 'iv'>,
  kek: CryptoKey,
): Promise<CryptoKey> {
  const ciphertext = base64ToBytes(wrapped.ciphertext)
  const iv = base64ToBytes(wrapped.iv)

  let plaintextBuf: ArrayBuffer
  try {
    plaintextBuf = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      kek,
      ciphertext as BufferSource,
    )
  } catch {
    // AES-GCM tag mismatch — almost certainly wrong passphrase.
    throw new WrongPassphraseError()
  }

  const jwkString = new TextDecoder().decode(plaintextBuf)
  const jwk = JSON.parse(jwkString) as JsonWebKey
  return importPrivateJwk(jwk)
}
