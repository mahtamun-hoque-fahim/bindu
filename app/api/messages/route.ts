import { getDb } from '@/lib/db'
import { messages, reactions, mutedHashes } from '@/lib/db/schema'
import { and, desc, eq, lt } from 'drizzle-orm'
import { requireSessionApi } from '@/lib/auth/server'

export { POST } from './post'

export const runtime = 'edge'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

export async function GET(req: Request) {
  const session = await requireSessionApi()
  if (session instanceof Response) return session

  const db = getDb()
  if (!db) return json({ error: 'unavailable' }, 503)

  const url = new URL(req.url)
  const limit = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get('limit') ?? '50')),
  )
  const before = url.searchParams.get('before') // ISO timestamp cursor

  const baseConditions = and(
    eq(messages.recipientId, session.uid),
    eq(messages.isDeleted, false),
  )
  const where = before
    ? and(baseConditions, lt(messages.createdAt, new Date(before)))
    : baseConditions

  const [rows, reactionRows, muted] = await Promise.all([
    db.query.messages.findMany({
      where,
      orderBy: [desc(messages.createdAt)],
      limit,
      columns: {
        id: true,
        ciphertext: true,
        iv: true,
        ephemeralPubKey: true,
        mood: true,
        senderHash: true,
        isRead: true,
        isFavorited: true,
        isFlagged: true,
        createdAt: true,
      },
    }),
    // All reactions to this user's messages (small table; OK to grab all)
    db
      .select({
        messageId: reactions.messageId,
        emoji: reactions.emoji,
      })
      .from(reactions)
      .innerJoin(messages, eq(reactions.messageId, messages.id))
      .where(eq(messages.recipientId, session.uid)),
    db.query.mutedHashes.findMany({
      where: eq(mutedHashes.userId, session.uid),
      columns: { senderHash: true },
    }),
  ])

  // Group reactions per messageId for ergonomic client merging
  const reactionsByMsg: Record<string, string[]> = {}
  for (const r of reactionRows) {
    if (!reactionsByMsg[r.messageId]) reactionsByMsg[r.messageId] = []
    reactionsByMsg[r.messageId].push(r.emoji)
  }

  return json({
    messages: rows.map((m) => ({
      ...m,
      reactions: reactionsByMsg[m.id] ?? [],
    })),
    mutedHashes: muted.map((m) => m.senderHash),
    hasMore: rows.length === limit,
  })
}
