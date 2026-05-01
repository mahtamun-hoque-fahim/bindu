# PLANNER.md — Bindu

> Living technical document. Updated whenever `update repo` is triggered.
> Last updated: 2026-04-29

---

## Overview

| Field | Value |
|---|---|
| Project | Bindu |
| Purpose | Anonymous messaging platform — anyone can send a message to a registered user via their public link |
| Target User | Anyone who wants to receive anonymous feedback, questions, or confessions |
| Key Value | Zero-friction anonymous sending — no account needed to send, simple link-based sharing |
| Status | ⏳ Not Started |
| Repo | `https://github.com/mahtamun-hoque-fahim/bindu` |
| Live URL | — |

---

## Architecture

**Stack:**
- Framework: Next.js 16 App Router (TypeScript 6)
- Styling: Tailwind CSS 4
- Database: Neon (PostgreSQL) via Drizzle ORM 0.45 + Drizzle Kit 0.31
- DB Driver: `@neondatabase/serverless` 1.1
- Auth: `@clerk/nextjs` 7
- Rate Limiting: `@upstash/ratelimit` 2.0 + `@upstash/redis` 1.37
- Email: Resend 6
- OG Images: `@vercel/og` 0.11
- Deployment: Vercel (primary)

**Folder Structure:**
```
/
├── app/
│   ├── (auth)/                  # Clerk auth pages (sign-in, sign-up)
│   ├── (dashboard)/
│   │   └── dashboard/           # Recipient inbox + settings
│   ├── u/
│   │   └── [username]/          # Public anonymous send page
│   ├── api/
│   │   ├── messages/
│   │   │   └── route.ts         # POST — send anonymous message
│   │   ├── messages/[id]/
│   │   │   └── route.ts         # DELETE — delete a message
│   │   └── og/
│   │       └── route.ts         # GET — dynamic OG image
│   ├── layout.tsx
│   └── page.tsx                 # Landing / home
├── components/
│   ├── ui/                      # Primitive components (Button, Input, Badge, Card)
│   ├── send/                    # SendForm, CharacterCount, SuccessState
│   └── dashboard/               # MessageCard, InboxList, EmptyInbox
├── lib/
│   ├── db/
│   │   ├── index.ts             # Edge-compatible Neon + Drizzle client
│   │   └── schema.ts            # Drizzle schema
│   ├── rate-limit.ts            # Upstash Redis rate limiter
│   ├── resend.ts                # Email notifications
│   └── utils.ts
├── middleware.ts                 # Clerk auth middleware
├── .env.example
├── drizzle.config.ts
├── PLANNER.md
├── DESIGN_GUIDE.md
└── README.md
```

---

## User Flows

### Flow 1: Recipient — Sign Up & Get Link
1. User visits `/` (landing page)
2. Clicks "Get your link" → redirected to Clerk sign-up
3. After sign-up, Clerk creates account with a username
4. Redirected to `/dashboard` — sees their unique link `bindu.app/u/[username]`
5. Copies link and shares it on social media, bio, etc.

### Flow 2: Anonymous Sender — Send a Message
1. Sender visits `/u/[username]` (no account needed)
2. Sees recipient's name and a textarea
3. Types their message (max 500 chars)
4. Clicks "Send" — POST to `/api/messages`
5. Rate limit checked (Upstash Redis — max 5 messages per IP per 10 min)
6. Message saved to Neon DB with no sender info stored
7. Recipient gets email notification via Resend (optional, togglable)
8. Sender sees success state with option to send another

### Flow 3: Recipient — Read Inbox
1. User visits `/dashboard` (protected, Clerk auth)
2. Sees all received anonymous messages — newest first
3. Can mark messages as read / unread
4. Can delete individual messages
5. Can toggle email notifications on/off (stored in `users` table)

### Flow 4: Share Page OG Image
1. When `/u/[username]` is shared on Twitter/WhatsApp
2. `@vercel/og` generates a dynamic card showing "Send [name] an anonymous message"
3. OG image served from `/api/og?username=[username]`

---

## DB Schema

> Drizzle ORM format. All tables in PostgreSQL via Neon.

```ts
// lib/db/schema.ts
import {
  pgTable, text, boolean, timestamp, serial, integer
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Users — synced from Clerk via webhook or on first login
export const users = pgTable('users', {
  id: text('id').primaryKey(),                      // Clerk userId
  username: text('username').notNull().unique(),
  displayName: text('display_name'),
  emailNotifications: boolean('email_notifications').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Anonymous messages received by a user
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  recipientId: text('recipient_id').notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),               // max 500 chars
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  messages: many(messages),
}))

export const messagesRelations = relations(messages, ({ one }) => ({
  recipient: one(users, {
    fields: [messages.recipientId],
    references: [users.id],
  }),
}))
```

---

## API Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/u/[username]` | Public | Anonymous send page for a user |
| POST | `/api/messages` | Public | Send an anonymous message |
| DELETE | `/api/messages/[id]` | Protected (Clerk) | Delete a message |
| PATCH | `/api/messages/[id]` | Protected (Clerk) | Mark message read/unread |
| GET | `/api/og` | Public | Dynamic OG image for share card |
| GET | `/dashboard` | Protected (Clerk) | Recipient inbox page |

**Request / Response shapes:**

```ts
// POST /api/messages
// Body: { recipientUsername: string, content: string }
// Response: { ok: true } | { error: string }

// DELETE /api/messages/[id]
// Response: { ok: true } | { error: string }

// PATCH /api/messages/[id]
// Body: { isRead: boolean }
// Response: { ok: true }

// GET /api/og?username=fahim
// Response: PNG image (via @vercel/og)
```

---

## Env Vars

| Variable | Required | Description | Example |
|---|---|---|---|
| `DATABASE_URL` | ✅ | Neon pooled connection string | `postgresql://...` |
| `DATABASE_URL_UNPOOLED` | ✅ | Neon direct connection (migrations only) | `postgresql://...` |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public base URL | `https://bindu.app` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk publishable key | `pk_live_...` |
| `CLERK_SECRET_KEY` | ✅ | Clerk secret key | `sk_live_...` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | ✅ | Clerk sign-in path | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | ✅ | Clerk sign-up path | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | ✅ | Redirect after sign-in | `/dashboard` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | ✅ | Redirect after sign-up | `/dashboard` |
| `UPSTASH_REDIS_REST_URL` | ✅ | Upstash Redis URL | `https://...upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | Upstash Redis token | `...` |
| `RESEND_API_KEY` | ⚠️ Optional | Resend API key for email notifications | `re_...` |
| `RESEND_FROM_EMAIL` | ⚠️ Optional | From address for notification emails | `no-reply@bindu.app` |

> Full `.env.local` setup → see README.md

---

## Phases & Timeline

| Phase | Name | Status | Key Tasks |
|---|---|---|---|
| 1 | Foundation | ⏳ | Init Next.js 16 + Tailwind, Drizzle schema, Neon setup, Clerk auth, middleware, base layout |
| 2 | Core Send Flow | ⏳ | `/u/[username]` public page, send form, POST `/api/messages`, Upstash rate limiting, success state |
| 3 | Recipient Dashboard | ⏳ | `/dashboard` inbox, message cards, mark read/unread, delete, unread count badge |
| 4 | Notifications & OG | ⏳ | Resend email on new message (toggleable), `@vercel/og` share card, user settings page |
| 5 | Polish & Deploy | ⏳ | SEO metadata, landing page, error states, empty states, Vercel deploy |

---

## Next Steps

> Ordered by priority.

1. [ ] `npx create-next-app@latest bindu` with TypeScript + Tailwind
2. [ ] Install deps: `@neondatabase/serverless drizzle-orm @clerk/nextjs @upstash/ratelimit @upstash/redis resend @vercel/og`
3. [ ] Write `lib/db/schema.ts` (users + messages tables)
4. [ ] Configure Drizzle + push schema to Neon
5. [ ] Set up Clerk middleware and `(auth)` route group
6. [ ] Build `/u/[username]` public send page + SendForm component
7. [ ] Build `POST /api/messages` route with rate limiting
8. [ ] Build `/dashboard` inbox with message list + delete
9. [ ] Add Resend notification email
10. [ ] Add `@vercel/og` share image
11. [ ] Deploy to Vercel

---

## Notes / Decisions Log

- **2026-04-29** — Auth: Clerk chosen (vs Auth.js v5) for faster setup and built-in username support. No magic links needed.
- **2026-04-29** — No sender data stored at all — not IP, not fingerprint. True anonymity by design.
- **2026-04-29** — Rate limiting via Upstash Redis (not DB-based) to prevent send spam without storing sender identity.
- **2026-04-29** — Email notifications optional and user-togglable, stored as `email_notifications` boolean on `users` table.
- **2026-04-29** — Project name: **Bindu** (Bengali: বিন্দু — meaning "dot" or "point") — a single anonymous point of contact.
