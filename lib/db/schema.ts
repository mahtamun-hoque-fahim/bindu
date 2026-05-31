import {
  pgTable,
  text,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  primaryKey,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const themeEnum = pgEnum('theme', ['sunset', 'acid', 'dream'])
export const planEnum = pgEnum('plan', ['free', 'plus'])

export const flagReasonEnum = pgEnum('flag_reason', [
  'harassment',
  'doxxing',
  'self_harm',
  'spam',
  'inappropriate',
  'other',
])
export const flagStatusEnum = pgEnum('flag_status', [
  'pending',
  'escalated',
  'resolved',
  'dismissed',
])

// ─── Users ────────────────────────────────────────────────────────────────────
// Authentication is passphrase-based. The passphrase serves two purposes:
//   1. authenticates the user (bcryptjs hash → passphraseHash)
//   2. derives a key-encryption-key that unwraps the user's private key
//
// We never store the passphrase, nor the unwrapped private key. Server only
// ever holds: ciphertext, public key, and wrapped private key.

export const users = pgTable(
  'users',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    username: text('username').notNull().unique(),
    displayName: text('display_name'),
    bio: text('bio'),
    theme: themeEnum('theme').default('sunset').notNull(),

    // Auth — bcryptjs hash of the passphrase
    passphraseHash: text('passphrase_hash').notNull(),

    // E2E crypto — recipient's long-lived keypair
    // pubKey: JWK (public, sender uses to encrypt to this user)
    // encPrivKey: AES-GCM-wrapped JWK (only this user can unwrap with their passphrase)
    pubKey: jsonb('pub_key').$type<JsonWebKey>().notNull(),
    encPrivKey: jsonb('enc_priv_key')
      .$type<{ ciphertext: string; iv: string; salt: string }>()
      .notNull(),

    // Bindu+ subscription pointer (denormalized for quick reads)
    plan: planEnum('plan').default('free').notNull(),

    // Role flags — orthogonal, a user can be both staff and admin
    isStaff: boolean('is_staff').default(false).notNull(),
    isAdmin: boolean('is_admin').default(false).notNull(),

    // Moderation
    isBanned: boolean('is_banned').default(false).notNull(),
    bannedAt: timestamp('banned_at'),
    bannedReason: text('banned_reason'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [uniqueIndex('users_username_lower_idx').on(t.username)],
)

// ─── Messages ─────────────────────────────────────────────────────────────────
// Stored entirely as ciphertext. The server can NEVER read message content.
//
// ECDH+AES-GCM hybrid scheme per-message:
//   • sender generates an ephemeral ECDH keypair in-browser
//   • derives shared secret from (ephemeral_priv × recipient_pub)
//   • encrypts message body with AES-256-GCM using the derived key
//   • sends { ciphertext, iv, ephemeralPubKey } to server
//
// Recipient reverses: (their_priv × ephemeralPubKey) → same shared secret → AES decrypt.

export const messages = pgTable(
  'messages',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    recipientId: text('recipient_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // E2E payload — server-opaque
    ciphertext: text('ciphertext').notNull(), // base64
    iv: text('iv').notNull(), // base64
    ephemeralPubKey: jsonb('ephemeral_pub_key').$type<JsonWebKey>().notNull(),

    // Plaintext metadata (deliberately not encrypted — sender's pick of mood)
    mood: text('mood'), // emoji string, optional

    // Sender hash — derived client-side from (senderDeviceId || recipientId)
    // 4-char hex like "#f3a9". Recipient sees this to mute repeat senders.
    senderHash: text('sender_hash').notNull(),

    // Recipient state
    isRead: boolean('is_read').default(false).notNull(),
    isFavorited: boolean('is_favorited').default(false).notNull(),
    isFlagged: boolean('is_flagged').default(false).notNull(),
    isDeleted: boolean('is_deleted').default(false).notNull(),
    deletedBy: text('deleted_by'), // 'recipient' | 'staff' | 'admin'

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('messages_recipient_created_idx').on(t.recipientId, t.createdAt),
    index('messages_recipient_sender_hash_idx').on(t.recipientId, t.senderHash),
  ],
)

// ─── Muted hashes ─────────────────────────────────────────────────────────────
// Recipient mutes a sender hash. Future messages from that hash to this
// recipient are dropped at write time.

export const mutedHashes = pgTable(
  'muted_hashes',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    senderHash: text('sender_hash').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.senderHash] })],
)

// ─── Reactions ────────────────────────────────────────────────────────────────
// Mood emoji reactions a recipient applies to a received message.
// (Senders cannot react — this is recipient-side only by design.)

export const reactions = pgTable(
  'reactions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    messageId: text('message_id')
      .notNull()
      .references(() => messages.id, { onDelete: 'cascade' }),
    emoji: text('emoji').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('reactions_message_emoji_idx').on(t.messageId, t.emoji),
  ],
)

// ─── Flags ────────────────────────────────────────────────────────────────────
// When a recipient flags a message, their client decrypts the plaintext and
// POSTs it here along with the flag. This is the ONLY way staff ever see
// message content. Original message stays as ciphertext.

export const flags = pgTable('flags', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  messageId: text('message_id')
    .notNull()
    .references(() => messages.id, { onDelete: 'cascade' }),
  reporterId: text('reporter_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Plaintext that the reporter shared (they had it; they're choosing to share)
  reportedPlaintext: text('reported_plaintext').notNull(),

  reason: flagReasonEnum('reason').notNull(),
  note: text('note'),
  status: flagStatusEnum('status').default('pending').notNull(),

  resolvedBy: text('resolved_by').references(() => users.id, {
    onDelete: 'set null',
  }),
  resolvedAt: timestamp('resolved_at'),
  resolverNote: text('resolver_note'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ─── Banned IPs ───────────────────────────────────────────────────────────────

export const bannedIps = pgTable('banned_ips', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  ip: text('ip').notNull().unique(),
  reason: text('reason'),
  bannedBy: text('banned_by')
    .notNull()
    .references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ─── Audit log ────────────────────────────────────────────────────────────────
// Append-only record of admin/staff actions.

export const auditLog = pgTable('audit_log', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  actorId: text('actor_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  action: text('action').notNull(), // e.g. 'user.ban', 'flag.resolve', 'ip.ban'
  targetType: text('target_type'), // 'user' | 'message' | 'flag' | 'ip'
  targetId: text('target_id'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ─── v2 schema, deferred ──────────────────────────────────────────────────────
// Tables below are defined so the migration sets the shape, but no v1
// surface uses them. Group dots and Bindu+ payments ship later.

export const groups = pgTable('groups', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  ownerId: text('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  pubKey: jsonb('pub_key').$type<JsonWebKey>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const groupMembers = pgTable(
  'group_members',
  {
    groupId: text('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // group privkey wrapped to each member's pubkey
    encGroupPrivKey: jsonb('enc_group_priv_key')
      .$type<{ ciphertext: string; iv: string; ephemeralPubKey: JsonWebKey }>()
      .notNull(),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.groupId, t.userId] })],
)

export const subscriptions = pgTable('subscriptions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  plan: planEnum('plan').default('free').notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
  externalId: text('external_id'), // stripe sub id, etc.
})

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many, one }) => ({
  messages: many(messages),
  mutedHashes: many(mutedHashes),
  flagsReported: many(flags, { relationName: 'reporter' }),
  groups: many(groups),
  subscription: one(subscriptions, {
    fields: [users.id],
    references: [subscriptions.userId],
  }),
}))

export const messagesRelations = relations(messages, ({ one, many }) => ({
  recipient: one(users, {
    fields: [messages.recipientId],
    references: [users.id],
  }),
  reactions: many(reactions),
  flags: many(flags),
}))

export const reactionsRelations = relations(reactions, ({ one }) => ({
  message: one(messages, {
    fields: [reactions.messageId],
    references: [messages.id],
  }),
}))

export const flagsRelations = relations(flags, ({ one }) => ({
  message: one(messages, {
    fields: [flags.messageId],
    references: [messages.id],
  }),
  reporter: one(users, {
    fields: [flags.reporterId],
    references: [users.id],
    relationName: 'reporter',
  }),
}))

export const mutedHashesRelations = relations(mutedHashes, ({ one }) => ({
  user: one(users, {
    fields: [mutedHashes.userId],
    references: [users.id],
  }),
}))

export const groupsRelations = relations(groups, ({ one, many }) => ({
  owner: one(users, { fields: [groups.ownerId], references: [users.id] }),
  members: many(groupMembers),
}))

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, { fields: [groupMembers.groupId], references: [groups.id] }),
  user: one(users, { fields: [groupMembers.userId], references: [users.id] }),
}))

// ─── Types ────────────────────────────────────────────────────────────────────

export type User = InferSelectModel<typeof users>
export type NewUser = InferInsertModel<typeof users>
export type Message = InferSelectModel<typeof messages>
export type NewMessage = InferInsertModel<typeof messages>
export type Reaction = InferSelectModel<typeof reactions>
export type Flag = InferSelectModel<typeof flags>
export type MutedHash = InferSelectModel<typeof mutedHashes>
export type BannedIp = InferSelectModel<typeof bannedIps>
export type AuditEntry = InferSelectModel<typeof auditLog>
