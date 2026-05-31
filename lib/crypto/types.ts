/**
 * Wire formats. All binary data is base64 over the network and in storage;
 * `Uint8Array` only appears inside this module.
 *
 * `salt` is on `WrappedPrivateKey` because the recipient needs it to
 * re-derive their KEK at sign-in. Conceptually it pairs with the wrapped
 * blob — moving it to its own column would risk drift.
 */
export type WrappedPrivateKey = {
  ciphertext: string // base64 — AES-GCM(privateKey JWK JSON, KEK, iv)
  iv: string // base64 — 12 bytes
  salt: string // base64 — 16 bytes (input to KEK derivation)
}

/**
 * What the server stores per message. The server can read every field
 * here without learning the plaintext — that needs the recipient's
 * (un-server-readable) private key.
 */
export type EncryptedMessage = {
  ciphertext: string // base64 — AES-GCM(plaintext, sharedKey, iv)
  iv: string // base64 — 12 bytes
  ephemeralPubKey: JsonWebKey // sender's per-message ephemeral pubkey
}

/**
 * Distinct from `Error` so UI can show "wrong passphrase" without leaking
 * details. AES-GCM throws on tag mismatch; we re-tag.
 */
export class WrongPassphraseError extends Error {
  constructor() {
    super('Wrong passphrase')
    this.name = 'WrongPassphraseError'
  }
}

/**
 * Thrown when WebCrypto isn't available (very old browsers, insecure contexts).
 */
export class CryptoUnavailableError extends Error {
  constructor() {
    super('WebCrypto unavailable in this context (requires HTTPS or localhost)')
    this.name = 'CryptoUnavailableError'
  }
}
