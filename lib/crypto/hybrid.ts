/**
 * Per-message hybrid encryption.
 *
 * Sender:
 *   1. generate an ephemeral ECDH keypair
 *   2. derive shared AES-256-GCM key = ECDH(ephemeral.priv, recipient.pub)
 *   3. encrypt plaintext under shared key + random 96-bit IV
 *   4. publish { ciphertext, iv, ephemeral.pub }
 *   5. drop ephemeral.priv from memory
 *
 * Recipient reverses: derive same shared key = ECDH(my.priv, ephemeral.pub),
 * decrypt.
 *
 * The ephemeral keypair gives forward secrecy at the message level — if the
 * recipient's long-term private key leaks tomorrow, past messages are still
 * protected as long as ephemerals were not captured in transit. This is
 * a stronger property than what NGL/Sendit advertise.
 */

import { exportPublicJwk, importPublicJwk } from './keypair'
import { bytesToBase64, base64ToBytes } from '@/lib/utils'
import type { EncryptedMessage } from './types'

const IV_BYTES = 12

/** ECDH(privA, pubB) → AES-256-GCM CryptoKey. */
async function deriveSharedKey(
  privateKey: CryptoKey,
  publicKey: CryptoKey,
): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    { name: 'ECDH', public: publicKey },
    privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

/**
 * Encrypt to a recipient. `recipientPublicKey` should have been imported
 * via `importPublicJwk` from the recipient's published JWK.
 */
export async function encryptToRecipient(
  plaintext: string,
  recipientPublicKey: CryptoKey,
): Promise<EncryptedMessage> {
  // Generate ephemeral keypair — public is extractable (we publish it),
  // private only needs `deriveKey` and goes out of scope at function return.
  const ephemeral = (await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey'],
  )) as CryptoKeyPair

  const sharedKey = await deriveSharedKey(
    ephemeral.privateKey,
    recipientPublicKey,
  )

  const iv = new Uint8Array(IV_BYTES)
  crypto.getRandomValues(iv)

  const plaintextBytes = new TextEncoder().encode(plaintext)
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    sharedKey,
    plaintextBytes as BufferSource,
  )

  const ephemeralPubJwk = await exportPublicJwk(ephemeral.publicKey)

  return {
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
    iv: bytesToBase64(iv),
    ephemeralPubKey: ephemeralPubJwk,
  }
}

/**
 * Decrypt a message. `recipientPrivateKey` is the recipient's long-lived
 * key, freshly unwrapped from `encPrivKey`.
 *
 * Throws on tampered ciphertext (AES-GCM tag mismatch), corrupted
 * ephemeral pubkey (JWK import failure), or wrong recipient key.
 */
export async function decryptFromSender(
  encrypted: EncryptedMessage,
  recipientPrivateKey: CryptoKey,
): Promise<string> {
  const ephemeralPubKey = await importPublicJwk(encrypted.ephemeralPubKey)
  const sharedKey = await deriveSharedKey(recipientPrivateKey, ephemeralPubKey)

  const iv = base64ToBytes(encrypted.iv)
  const ciphertext = base64ToBytes(encrypted.ciphertext)

  const plaintextBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    sharedKey,
    ciphertext as BufferSource,
  )

  return new TextDecoder().decode(plaintextBuf)
}
