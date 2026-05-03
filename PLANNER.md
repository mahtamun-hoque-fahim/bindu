# PLANNER.md — Bindu

> Living technical document. Updated whenever `update repo` is triggered.
> Last updated: 2026-05-03

---

## Overview

| Field | Value |
|---|---|
| Project | Bindu (বিন্দু) |
| Purpose | Let anyone receive anonymous messages via a shareable link |
| Target User | Social media users who want honest, anonymous feedback |
| Key Value | No account needed to send — frictionless, fully anonymous |
| Status | 🔄 In Progress |
| Repo | `https://github.com/mahtamun-hoque-fahim/bindu` |
| Live URL | `https://bindu.app` (pending deploy) |

---

## Architecture

**Stack:**
- Framework: Next.js 16.2.4 App Router (TypeScript 6.0.3)
- Styling: Tailwind CSS 4.2.4
- Database: Neon (PostgreSQL) via Drizzle ORM 0.45.2 + drizzle-kit 0.31.10
- Auth: NextAuth v5 beta — Credentials (email+password, bcrypt) + Google OAuth
- Rate limiting: Upstash Redis (@upstash/ratelimit, @upstash/redis)
- Email: Resend (optional — new message notifications)
- OG Images: @vercel/og
- Deployment: Vercel

**Folder Structure:**
```
/
├── app/
│   ├── (dashboard)/dashboard/     # Inbox + Settings (auth-gated)
│   ├── admin/                     # Admin dashboard (admin-gated)
│   ├── api/
│   │   ├── auth/[...nextauth]/    # NextAuth handler
│   │   ├── auth/register/         # POST register
│   │   ├── messages/              # POST send anon message
│   │   ├── messages/[id]/         # DELETE, PATCH
│   │   ├── messages/flag/         # POST flag
│   │   ├── user/notifications/    # PATCH email notif toggle
│   │   ├── admin/stats/           # GET platform stats
│   │   ├── admin/users/           # GET users list
│   │   ├── admin/users/[id]/      # DELETE user
│   │   ├── admin/users/[id]/ban/  # POST ban/unban
│   │   ├── admin/messages/        # GET all messages
│   │   ├── admin/messages/[id]/   # DELETE soft-delete
│   │   ├── admin/flags/           # GET flag queue
│   │   ├── admin/flags/[id]/      # PATCH resolve/dismiss
│   │   ├── admin/banned-ips/      # GET + POST
│   │   ├── admin/banned-ips/[id]/ # DELETE unban
│   │   └── og/                    # GET dynamic OG image
│   ├── sign-in/                   # Custom sign-in page
│   ├── sign-up/                   # Custom sign-up page
│   └── u/[username]/              # Public send page
├── components/
│   ├── auth/                      # SignInForm, SignUpForm
│   ├── dashboard/                 # Sidebar, InboxList, MessageCard, FlagModal, SettingsForm
│   ├── send/                      # SendForm
│   └── admin/                     # AdminNav, UsersClient, MessagesClient, ModerationClient, BannedIpsClient
├── lib/
│   ├── db/index.ts                # Neon + Drizzle client (getDb())
│   ├── db/schema.ts               # All tables + relations
│   ├── admin-auth.ts              # requireAdmin(), assertAdmin()
│   ├── rate-limit.ts              # Upstash getRatelimit()
│   ├── resend.ts                  # sendNewMessageNotification()
│   └── utils.ts                   # timeAgo(), cn()
├── auth.ts                        # NextAuth config
├── middleware.ts                  # Route protection
└── drizzle.config.ts
```

---

## User Flows

### Flow 1: Sender (no account required)
1. Visits `/u/[username]`
2. Writes message (max 500 chars) in SendForm
3. POST /api/messages — rate-limited by IP (5 / 10 min)
4. Message stored in DB with zero sender info
5. Recipient gets optional Resend email notification
6. Success screen shows "Sent by mistake? Flag it" link
7. Sender opens FlagModal → submits reason → flag stored (flaggedBy: sender)

### Flow 2: Recipient (account required)
1. Signs up at /sign-up (email+password or Google OAuth)
2. Gets username → shareable link bindu.app/u/[username]
3. Shares link anywhere
4. Views /dashboard → inbox with unread count
5. Reads, marks read/unread, deletes messages
6. Flags messages via hover menu → FlagModal (flaggedBy: recipient)
7. Settings: copy link, toggle email notifications

### Flow 3: Admin
1. Admin granted by INSERT INTO admins (user_id) VALUES ('...')
2. Signs in normally at /sign-in
3. Every /api/admin/* call runs assertAdmin() → checks admins table
4. /admin — stats + recent signups + pending flags summary
5. /admin/users — search, ban/unban, delete users
6. /admin/messages — filter all/flagged/deleted, soft-delete any message
7. /admin/moderation — 3-tab queue, delete+resolve or dismiss flags
8. /admin/banned-ips — add/remove IP bans

---

## DB Schema

```ts
// Enums
flagReasonEnum:  'harassment' | 'spam' | 'inappropriate' | 'other'
flaggedByEnum:   'sender' | 'recipient'
flagStatusEnum:  'pending' | 'resolved' | 'dismissed'

// NextAuth required tables
users {
  id                text PK (crypto.randomUUID())
  name              text
  email             text UNIQUE
  emailVerified     timestamp
  image             text
  password          text          -- null for OAuth, bcrypt hashed for credentials
  username          text UNIQUE
  displayName       text
  emailNotifications boolean DEFAULT true
  isBanned          boolean DEFAULT false
  bannedAt          timestamp
  bannedReason      text
  createdAt         timestamp DEFAULT now()
}

accounts {
  userId            text FK → users.id CASCADE
  type              AdapterAccountType
  provider          text
  providerAccountId text
  PRIMARY KEY (provider, providerAccountId)
}

sessions {
  sessionToken      text PK
  userId            text FK → users.id CASCADE
  expires           timestamp
}

verificationTokens {
  identifier        text
  token             text
  expires           timestamp
  PRIMARY KEY (identifier, token)
}

// App tables
admins {
  userId            text PK FK → users.id CASCADE
  grantedAt         timestamp DEFAULT now()
  grantedBy         text nullable
}

messages {
  id                serial PK
  recipientId       text FK → users.id CASCADE
  content           text (max 500 chars enforced in API)
  isRead            boolean DEFAULT false
  isDeleted         boolean DEFAULT false
  deletedBy         text nullable  -- 'admin' | 'recipient'
  createdAt         timestamp DEFAULT now()
}

flags {
  id                serial PK
  messageId         integer FK → messages.id CASCADE
  flaggedBy         flaggedByEnum
  reason            flagReasonEnum
  note              text nullable
  status            flagStatusEnum DEFAULT 'pending'
  resolvedBy        text nullable
  resolvedAt        timestamp nullable
  createdAt         timestamp DEFAULT now()
}

bannedIps {
  id                serial PK
  ip                text UNIQUE
  reason            text nullable
  bannedBy          text
  createdAt         timestamp DEFAULT now()
}
```

---

## API Routes

### Public
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/messages` | Public | Send anon message. Rate-limited by IP. Returns `{ ok, messageId }` |
| POST | `/api/messages/flag` | Public/Session | Flag a message (sender: public, recipient: session) |
| GET | `/api/og` | Public | Dynamic OG image `?username=&name=` |
| POST | `/api/auth/register` | Public | Register with email+password |
| GET/POST | `/api/auth/[...nextauth]` | Public | NextAuth handler |

### User (session required)
| Method | Path | Auth | Description |
|---|---|---|---|
| DELETE | `/api/messages/[id]` | Session | Delete own message |
| PATCH | `/api/messages/[id]` | Session | Toggle read `{ isRead: bool }` |
| PATCH | `/api/user/notifications` | Session | Toggle email notifs `{ emailNotifications: bool }` |

### Admin (admins table required)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/stats` | Admin | Platform stats (users, messages, flags, bans) |
| GET | `/api/admin/users` | Admin | User list with message counts |
| DELETE | `/api/admin/users/[id]` | Admin | Hard delete user + cascade |
| POST | `/api/admin/users/[id]/ban` | Admin | Ban/unban `{ ban: bool, reason? }` |
| GET | `/api/admin/messages` | Admin | All messages with flag counts |
| DELETE | `/api/admin/messages/[id]` | Admin | Soft delete message |
| GET | `/api/admin/flags` | Admin | Flag queue `?status=pending\|resolved\|dismissed` |
| PATCH | `/api/admin/flags/[id]` | Admin | `{ status: 'resolved' \| 'dismissed' }` |
| GET | `/api/admin/banned-ips` | Admin | List all banned IPs |
| POST | `/api/admin/banned-ips` | Admin | Add IP ban `{ ip, reason? }` |
| DELETE | `/api/admin/banned-ips/[id]` | Admin | Remove IP ban |

---

## Env Vars

| Variable | Required | Description | Example |
|---|---|---|---|
| `DATABASE_URL` | ✅ | Neon pooled connection string | `postgresql://...` |
| `DATABASE_URL_UNPOOLED` | ✅ | Neon unpooled (drizzle-kit only) | `postgresql://...` |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public base URL | `https://bindu.app` |
| `AUTH_SECRET` | ✅ | NextAuth secret (32 bytes) | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth client ID | `....apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth client secret | `GOCSPX-...` |
| `UPSTASH_REDIS_REST_URL` | ✅ | Upstash Redis REST URL | `https://....upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | Upstash Redis token | `...` |
| `RESEND_API_KEY` | ⚠️ Optional | Resend API key | `re_...` |
| `RESEND_FROM_EMAIL` | ⚠️ Optional | From address | `no-reply@bindu.app` |

---

## Phases & Timeline

| Phase | Name | Status | Key Tasks |
|---|---|---|---|
| 1 | Foundation | ✅ | Next.js 16, Drizzle schema, design system, globals.css |
| 2 | Core Send Flow | ✅ | /u/[username], POST /api/messages, rate limiting, OG image |
| 3 | User Dashboard | ✅ | Inbox, MessageCard, Settings, email notifications via Resend |
| 4 | Auth System | ✅ | NextAuth v5: credentials + Google, registration, JWT sessions |
| 5 | Admin Dashboard | ✅ | Stats overview, users table, messages table, banned IPs |
| 6 | Moderation | ✅ | Flags table, FlagModal (sender + recipient), admin queue UI |
| 7 | Polish & Deploy | ⏳ | DB push, Vercel deploy, Google OAuth config, IP ban enforcement |

---

## Next Steps

> Ordered by priority.

1. [ ] `npx drizzle-kit push` — create all tables in Neon
2. [ ] Deploy to Vercel — configure all env vars
3. [ ] Google Cloud Console — create OAuth app, add redirect URI: `https://bindu.app/api/auth/callback/google`
4. [ ] Create Upstash Redis project — fill REST URL + token
5. [ ] Insert first admin: `INSERT INTO admins (user_id, granted_by) VALUES ('your-user-id', null)`
6. [ ] Wire IP ban check into `POST /api/messages` — query `bannedIps` table before processing
7. [ ] Username onboarding step for Google OAuth users (currently auto-derived from email prefix)
8. [ ] Pagination on admin users/messages (currently capped at 100/200 rows)
9. [ ] Set up Resend verified domain for notification emails
10. [ ] Add `drizzle-kit generate` migrations workflow for safe production schema changes

---

## Notes / Decisions Log

- **2026-05-03** — Replaced Clerk with NextAuth v5. Auth.js beta with Drizzle adapter. JWT sessions for edge compatibility.
- **2026-05-03** — Admin access via separate `admins` table (not a role column). Admin is an explicit grant, not a user attribute.
- **2026-05-03** — Soft delete on messages (`isDeleted`) preserves flagged content for moderation review.
- **2026-05-03** — Both sender and recipient can flag. Sender gets `messageId` back from `POST /api/messages` to reference.
- **2026-05-03** — `getDb()` returns null gracefully when DATABASE_URL missing — no build-time crashes.
- **2026-05-03** — Session strategy: JWT (not DB sessions) — works with Neon HTTP driver on edge runtime.
