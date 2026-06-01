import type { SafetyReport } from '@/lib/safety-filter'

export type ServerMessage = {
  id: string
  ciphertext: string
  iv: string
  ephemeralPubKey: JsonWebKey
  mood: string | null
  senderHash: string
  isRead: boolean
  isFavorited: boolean
  isFlagged: boolean
  createdAt: string
  reactions: string[]
}

export type DecryptedMessage = ServerMessage & {
  plaintext: string
  safety: SafetyReport
}

export type DecryptedMessageWithError = ServerMessage & {
  plaintext: null
  decryptError: string
  safety: SafetyReport
}

export type InboxMessage = DecryptedMessage | DecryptedMessageWithError

export type Filter = 'all' | 'new' | 'fav' | 'flagged'

export const MOODS = ['🫶', '🔥', '👀', '😭', '💀', '✨', '🤝', '🥲'] as const
export type Mood = (typeof MOODS)[number]
