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
| 7 | Polish & Deploy | ✅ | IP ban enforcement, username onboarding, pagination, admin scripts |

---

## Next Steps

> Deploy checklist — everything is built.

1. [ ] `npm run db:push` — create all tables in Neon (run once against your DB)
2. [ ] Deploy to Vercel — add all env vars from `.env.example`
3. [ ] Google Cloud Console → Credentials → OAuth 2.0 Client → add Authorized redirect URI:
       `https://bindu.app/api/auth/callback/google`
4. [ ] Create Upstash Redis project → copy REST URL + token
5. [ ] Sign up on Bindu, then run `npm run admin:grant your@email.com` to become admin
6. [ ] Set up Resend verified domain for notification emails
7. [ ] For future schema changes: `npm run db:generate` → `npm run db:migrate` (safe migrations)

---


---

## Deployment — Vercel (Primary)

**Platform:** Vercel (Next.js native, serverless + edge functions)
**Secondary:** Cloudflare Pages (optional, requires `@cloudflare/next-on-pages`)

### Why Vercel works without changes
- All API routes use `export const runtime = 'edge'` + `@neondatabase/serverless` neon-http driver — edge-compatible
- JWT session strategy — stateless, no DB sessions needed in middleware
- `@node-rs/bcrypt` (WASM) replaces `bcryptjs` (Node.js) — safe on Edge Runtime
- `getDb()` lazy stub — returns null at build time, no crash without DATABASE_URL

### Vercel deploy steps
1. Push to GitHub → Vercel auto-deploys from `main` branch
2. Add env vars in Vercel dashboard (Production + Preview):
   ```
   DATABASE_URL            (Neon pooled)
   DATABASE_URL_UNPOOLED   (Neon direct — for drizzle-kit only, not needed in Vercel)
   AUTH_SECRET             (openssl rand -base64 32)
   GOOGLE_CLIENT_ID
   GOOGLE_CLIENT_SECRET
   UPSTASH_REDIS_REST_URL
   UPSTASH_REDIS_REST_TOKEN
   RESEND_API_KEY          (optional)
   RESEND_FROM_EMAIL       (optional)
   NEXT_PUBLIC_APP_URL     (https://bindu.app or your preview URL)
   ```
3. Google Cloud Console → OAuth 2.0 Client → Authorized redirect URIs:
   - `https://bindu.app/api/auth/callback/google`
   - `https://your-preview.vercel.app/api/auth/callback/google` (for PR previews)
4. Run `npm run db:push` locally with `DATABASE_URL_UNPOOLED` in `.env.local` to create tables
5. Sign up on deployed site → `npm run admin:grant your@email.com`

### Cloudflare Pages (if needed later)
- Install: `npm install -D @cloudflare/next-on-pages`
- Build command: `npx @cloudflare/next-on-pages`
- Output: `.vercel/output/static`
- Add `export const runtime = 'edge'` to any remaining Node routes
- `next.config.ts`: add `images: { unoptimized: true }`
- Same env vars in Cloudflare dashboard

### Edge Runtime compatibility matrix
| Feature | Vercel Edge | Cloudflare Pages |
|---|---|---|
| `@neondatabase/serverless` neon-http | ✅ | ✅ |
| `@node-rs/bcrypt` (WASM) | ✅ | ✅ |
| NextAuth v5 JWT | ✅ | ✅ |
| `@upstash/redis` | ✅ | ✅ |
| `@vercel/og` | ✅ | ✅ |
| `resend` | ✅ | ✅ |
| Node.js `fs`, `crypto`, `Buffer` | ❌ | ❌ |
| `bcryptjs` | ⚠️ Node only | ❌ |
| `pg` (node-postgres) | ⚠️ Node only | ❌ |

## Notes / Decisions Log

- **2026-05-03** — Replaced Clerk with NextAuth v5. Auth.js beta with Drizzle adapter. JWT sessions for edge compatibility.
- **2026-05-03** — Admin access via separate `admins` table (not a role column). Admin is an explicit grant, not a user attribute.
- **2026-05-03** — Soft delete on messages (`isDeleted`) preserves flagged content for moderation review.
- **2026-05-03** — Both sender and recipient can flag. Sender gets `messageId` back from `POST /api/messages` to reference.
- **2026-05-03** — `getDb()` returns null gracefully when DATABASE_URL missing — no build-time crashes.
- **2026-05-03** — IP ban check fires before rate limit check in POST /api/messages.
- **2026-05-03** — Google OAuth users without a username are redirected to /onboarding (live availability check + preview).
- **2026-05-03** — Admin users/messages tables paginated (25/30 rows per page, server-side).
- **2026-05-03** — Admin scripts: npm run admin:grant email / npm run admin:revoke email.
- **2026-05-03** — Replaced bcryptjs (Node.js only) with @node-rs/bcrypt (WASM, edge-safe). Works on Vercel Edge and Cloudflare Pages.
- **2026-05-03** — Added vercel.json (framework: nextjs, region: sin1), next.config.ts with serverComponentsExternalPackages for bcrypt WASM.
- **2026-05-03** — Added lib/env.ts for startup env validation — crashes at build time with clear error instead of silent undefined.
- **2026-05-03** — No start-over needed for Vercel. All API routes already edge-compatible. Architecture was correct from the start.
- **2026-05-03** — Session strategy: JWT (not DB sessions) — works with Neon HTTP driver on edge runtime.
