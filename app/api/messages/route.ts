import { getDb } from '@/lib/db'
import { messages, users, bannedIps, mutedHashes } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { getLimiter, getClientIp } from '@/lib/rate-limit'

export const runtime = 'edge'

// Allowed mood emojis (matches the prototype + landing widget).
const MOODS = new Set(['🫶', '🔥', '👀', '😭', '💀', '✨', '🤝', '🥲'])

// Server-side ceiling on ciphertext size. A 500-char UTF-8 message
// becomes ~700 bytes encrypted → ~1KB base64. 2048 chars is generous.
const MAX_CIPHERTEXT_B64 = 2048
const MAX_IV_B64 = 24 // 12 bytes → ~16 chars + padding

type Body = {
  recipientId?: string
  ciphertext?: string
  iv?: string
  ephemeralPubKey?: JsonWebKey
  senderHash?: string
  mood?: string | null
}

function bad(error: string, status = 400) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

// Returned to BOTH genuinely-accepted messages AND silently-dropped
// muted-hash messages, so a sender can't probe whether they're muted.
function fakeOk() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 201,
    headers: { 'content-type': 'application/json' },
  })
}

export async function POST(req: Request) {
  const ip = getClientIp(req)

  // 1. Rate limit FIRST — limiter is in-memory in dev, doesn't require DB
  const limiter = getLimiter('send', 5, '10 m')
  const { success } = await limiter.limit(ip)
  if (!success) {
    return bad("Slow down — you're sending too fast.", 429)
  }

  // 2. Parse + validate envelope shape (DB-free, fast)
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return bad('Invalid JSON')
  }

  const { recipientId, ciphertext, iv, ephemeralPubKey, senderHash, mood } =
    body

  if (
    !recipientId ||
    typeof recipientId !== 'string' ||
    !ciphertext ||
    typeof ciphertext !== 'string' ||
    !iv ||
    typeof iv !== 'string' ||
    !ephemeralPubKey ||
    typeof ephemeralPubKey !== 'object' ||
    !senderHash ||
    typeof senderHash !== 'string'
  ) {
    return bad('Missing fields')
  }

  if (ciphertext.length > MAX_CIPHERTEXT_B64) return bad('Message too long')
  if (iv.length > MAX_IV_B64) return bad('Invalid IV')
  if (!/^[a-f0-9]{4}$/.test(senderHash)) return bad('Invalid sender hash')
  if ((ephemeralPubKey as JsonWebKey).kty !== 'EC')
    return bad('Invalid ephemeral pubKey')
  if (mood != null && (typeof mood !== 'string' || !MOODS.has(mood)))
    return bad('Invalid mood')

  // 3. DB-backed checks
  const db = getDb()
  if (!db) return bad('unavailable', 503)

  // 3a. IP ban — fast no
  if (ip !== 'unknown') {
    const banned = await db.query.bannedIps.findFirst({
      where: eq(bannedIps.ip, ip),
      columns: { id: true },
    })
    if (banned) return bad('You have been blocked from sending messages.', 403)
  }

  // 3b. Verify recipient exists + not banned
  const recipient = await db.query.users.findFirst({
    where: eq(users.id, recipientId),
    columns: { id: true, isBanned: true },
  })
  if (!recipient || recipient.isBanned) {
    // 404 to obscure ban status to senders
    return bad('Recipient not found', 404)
  }

  // 3c. Silent muted-hash drop — return fake-success.
  // The sender shouldn't be able to detect that the recipient muted them.
  // (If they could, they'd clear localStorage and get a new hash to evade.)
  const muted = await db.query.mutedHashes.findFirst({
    where: and(
      eq(mutedHashes.userId, recipient.id),
      eq(mutedHashes.senderHash, senderHash),
    ),
  })
  if (muted) {
    return fakeOk()
  }

  // 4. Insert
  await db.insert(messages).values({
    recipientId: recipient.id,
    ciphertext,
    iv,
    ephemeralPubKey: ephemeralPubKey as JsonWebKey,
    senderHash,
    mood: mood || null,
  })

  return fakeOk()
}
