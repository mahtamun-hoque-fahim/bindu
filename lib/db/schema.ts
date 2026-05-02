import {
  pgTable,
  text,
  boolean,
  timestamp,
  serial,
  pgEnum,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

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

// ─── Tables ───────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk userId
  username: text('username').notNull().unique(),
  displayName: text('display_name'),
  email: text('email'),
  emailNotifications: boolean('email_notifications').default(true),
  // Admin / moderation
  isBanned: boolean('is_banned').default(false).notNull(),
  bannedAt: timestamp('banned_at'),
  bannedReason: text('banned_reason'),
  // Clerk role stored here for quick lookup (synced from publicMetadata)
  role: text('role').default('user').notNull(), // 'user' | 'admin'
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  recipientId: text('recipient_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(), // max 500 chars
  isRead: boolean('is_read').default(false).notNull(),
  // Moderation
  isDeleted: boolean('is_deleted').default(false).notNull(), // soft delete
  deletedBy: text('deleted_by'), // 'admin' | 'recipient'
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const flags = pgTable('flags', {
  id: serial('id').primaryKey(),
  messageId: serial('message_id')
    .notNull()
    .references(() => messages.id, { onDelete: 'cascade' }),
  flaggedBy: flaggedByEnum('flagged_by').notNull(),
  reason: flagReasonEnum('reason').notNull(),
  note: text('note'), // optional extra context
  status: flagStatusEnum('status').default('pending').notNull(),
  resolvedBy: text('resolved_by'), // admin userId
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const bannedIps = pgTable('banned_ips', {
  id: serial('id').primaryKey(),
  ip: text('ip').notNull().unique(),
  reason: text('reason'),
  bannedBy: text('banned_by').notNull(), // admin userId
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  messages: many(messages),
}))

export const messagesRelations = relations(messages, ({ one, many }) => ({
  recipient: one(users, {
    fields: [messages.recipientId],
    references: [users.id],
  }),
  flags: many(flags),
}))

export const flagsRelations = relations(flags, ({ one }) => ({
  message: one(messages, {
    fields: [flags.messageId],
    references: [messages.id],
  }),
}))

// ─── Types ────────────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert
export type Flag = typeof flags.$inferSelect
export type NewFlag = typeof flags.$inferInsert
export type BannedIp = typeof bannedIps.$inferSelect
