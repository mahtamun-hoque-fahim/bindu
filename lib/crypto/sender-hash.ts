/**
 * Sender hash derivation.
 *
 * Goal: give each recipient a stable per-recipient pseudonym for each
 * sender (so the recipient can mute repeat senders and see consistent
 * `#f3a9` style tags), without the server learning anything that links
 * a sender across recipients.
 *
 *   senderHash(deviceId, recipientId) = SHA-256(deviceId || recipientId).slice(0,4) (hex)
 *
 * `deviceId` is a 32-byte random value generated once per browser, stored
 * in localStorage. Cleared localStorage = new identity (this is a known
 * limitation; we accept it — it's the same constraint NGL and Sendit have).
 *
 * Server only sees the 4-char hash. Two recipients receiving messages
 * from the same sender will see different hashes — server can't correlate.
 *
 * 4 hex chars = 65,536 possible hashes per recipient. Collisions are
 * possible at scale but acceptable: a recipient seeing two distinct
 * senders aliased to the same hash will at worst mute both together,
 * which is conservative (errs on the side of recipient comfort).
 */

import { bytesToBase64 } from '@/lib/utils'

const DEVICE_ID_KEY = 'bindu:device-id'
const DEVICE_ID_BYTES = 32

/**
 * Read the stable per-browser device ID, generating a fresh one on
 * first use. Browser-only — `window.localStorage` is unavailable on
 * the server. Callers should be in a Client Component.
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') {
    throw new Error('getOrCreateDeviceId is browser-only')
  }
  let existing: string | null = null
  try {
    existing = window.localStorage.getItem(DEVICE_ID_KEY)
  } catch {
    // private-mode safari can throw — fall through and regenerate
  }
  if (existing && existing.length >= 16) return existing

  const bytes = new Uint8Array(DEVICE_ID_BYTES)
  crypto.getRandomValues(bytes)
  const fresh = bytesToBase64(bytes)
  try {
    window.localStorage.setItem(DEVICE_ID_KEY, fresh)
  } catch {
    /* ignored — sender hash will be unstable but messages still send */
  }
  return fresh
}

/**
 * Forget the device ID. Effectively rerolls the sender's hash for every
 * recipient. Useful as a "burn this identity" escape hatch.
 */
export function resetDeviceId(): void {
  try {
    window.localStorage.removeItem(DEVICE_ID_KEY)
  } catch {}
}

/**
 * Derive the 4-char hex hash. Async because WebCrypto's digest is async.
 */
export async function deriveSenderHash(
  deviceId: string,
  recipientId: string,
): Promise<string> {
  const bytes = new TextEncoder().encode(`${deviceId}|${recipientId}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes as BufferSource)
  const u8 = new Uint8Array(digest)
  // First 2 bytes → 4 hex chars
  return Array.from(u8.slice(0, 2))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
