import {
  pgTable,
  text,
  boolean,
  timestamp,
  serial,
  pgEnum,
  integer,
  primaryKey,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import type { AdapterAccountType } from 'next-auth/adapters'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const flagReasonEnum = pgEnum('flag_reason', [
  'harassment',
  'spam',
  'inappropriate',
  'other',
])

export const flaggedByEnum = pgEnum('flagged_by', ['sender', 'recipient'])

export const flagStatusEnum = pgEnum('flag_status', [
  'pending',
  'resolved',
  'dismissed',
])

// ─── NextAuth required tables ─────────────────────────────────────────────────

export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  password: text('password'), // null for OAuth users
  // App-specific
  username: text('username').unique(),
  displayName: text('display_name'),
  emailNotifications: boolean('email_notifications').default(true),
  isBanned: boolean('is_banned').default(false).notNull(),
  bannedAt: timestamp('banned_at'),
  bannedReason: text('banned_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const accounts = pgTable(
  'accounts',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })]
)

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
})

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })]
)

// ─── App tables ───────────────────────────────────────────────────────────────

export const admins = pgTable('admins', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  grantedAt: timestamp('granted_at').defaultNow().notNull(),
  grantedBy: text('granted_by'), // userId of who granted it
})

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  recipientId: text('recipient_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  deletedBy: text('deleted_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const flags = pgTable('flags', {
  id: serial('id').primaryKey(),
  messageId: integer('message_id')
    .notNull()
    .references(() => messages.id, { onDelete: 'cascade' }),
  flaggedBy: flaggedByEnum('flagged_by').notNull(),
  reason: flagReasonEnum('reason').notNull(),
  note: text('note'),
  status: flagStatusEnum('status').default('pending').notNull(),
  resolvedBy: text('resolved_by'),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const bannedIps = pgTable('banned_ips', {
  id: serial('id').primaryKey(),
  ip: text('ip').notNull().unique(),
  reason: text('reason'),
  bannedBy: text('banned_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  messages: many(messages),
}))

export const messagesRelations = relations(messages, ({ one, many }) => ({
  recipient: one(users, { fields: [messages.recipientId], references: [users.id] }),
  flags: many(flags),
}))

export const flagsRelations = relations(flags, ({ one }) => ({
  message: one(messages, { fields: [flags.messageId], references: [messages.id] }),
}))

// ─── Types ────────────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert
export type Flag = typeof flags.$inferSelect
export type BannedIp = typeof bannedIps.$inferSelect
export type Admin = typeof admins.$inferSelect
