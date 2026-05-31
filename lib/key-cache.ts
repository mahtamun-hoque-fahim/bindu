/**
 * Browser-side cache for the recipient's unwrapped private CryptoKey.
 *
 * IndexedDB can store CryptoKey objects directly. Since the key was
 * imported with `extractable: false`, even an attacker who reads it back
 * out of IndexedDB cannot get raw key material — they can only use the
 * key to decrypt while the tab is open.
 *
 * Lifecycle:
 *   - signin    → store unwrapped private key
 *   - signout   → clear
 *   - lock now  → clear (user-initiated panic button)
 *   - browser cleared / new device → empty; user re-enters passphrase
 *
 * We do NOT persist the KEK or passphrase — only the resulting CryptoKey.
 */

const DB_NAME = 'bindu'
const DB_VERSION = 1
const STORE = 'keys'
const PRIVATE_KEY_ID = 'identity:private'

function isAvailable(): boolean {
  return typeof window !== 'undefined' && typeof indexedDB !== 'undefined'
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb()
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(STORE, mode)
      const store = transaction.objectStore(STORE)
      const req = fn(store)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}

/** Store the unwrapped private key. */
export async function cachePrivateKey(key: CryptoKey): Promise<void> {
  if (!isAvailable()) return
  await tx('readwrite', (s) => s.put(key, PRIVATE_KEY_ID))
}

/** Read the cached private key, or null if absent. */
export async function getCachedPrivateKey(): Promise<CryptoKey | null> {
  if (!isAvailable()) return null
  try {
    const result = await tx<CryptoKey | undefined>('readonly', (s) =>
      s.get(PRIVATE_KEY_ID) as IDBRequest<CryptoKey | undefined>,
    )
    return result ?? null
  } catch {
    return null
  }
}

/** Clear the cached private key — called on sign-out and lock. */
export async function clearCachedPrivateKey(): Promise<void> {
  if (!isAvailable()) return
  try {
    await tx('readwrite', (s) => s.delete(PRIVATE_KEY_ID))
  } catch {
    /* ignored */
  }
}

/**
 * Wipe everything — sign-out path. Currently only removes the private
 * key entry, but reserved for future state (group keys, ephemeral inboxes).
 */
export async function clearAllCachedKeys(): Promise<void> {
  if (!isAvailable()) return
  try {
    await tx('readwrite', (s) => s.clear())
  } catch {
    /* ignored */
  }
}
