/**
 * Passphrase hashing.
 *
 * bcryptjs (pure JS) chosen over @node-rs/bcrypt because the WASM build
 * is too large for CF Workers. Cost 10 hashes in ~120-300ms on a CF edge
 * node — well within the 30s CPU budget on Workers Paid.
 *
 * The server never stores or persists the raw passphrase. It lives in
 * memory only for the duration of a single auth request.
 */

import bcrypt from 'bcryptjs'

const COST = 10

export async function hashPassphrase(passphrase: string): Promise<string> {
  return bcrypt.hash(passphrase, COST)
}

export async function verifyPassphrase(
  passphrase: string,
  storedHash: string,
): Promise<boolean> {
  if (!storedHash) return false
  try {
    return await bcrypt.compare(passphrase, storedHash)
  } catch {
    return false
  }
}
