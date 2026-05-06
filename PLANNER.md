# PLANNER.md — Bindu

> Living technical document. Updated whenever `update repo` is triggered.
> Last updated: 2026-05-06

---

## Overview

| Field | Value |
|---|---|
| Project | Bindu (বিন্দু) |
| Purpose | Let anyone receive anonymous messages via a shareable link |
| Target User | Social media users who want honest, anonymous feedback |
| Key Value | No account needed to send — frictionless, fully anonymous |
| Status | 🔄 In Progress (code complete, CF fixes pending) |
| Repo | `https://github.com/mahtamun-hoque-fahim/bindu` |
| Live URL | `https://bindu.app` (pending deploy) |

---

## Architecture

**Stack:**
- Framework: Next.js 16.2.4 App Router (TypeScript 6.0.3)
- Styling: Tailwind CSS 4.2.4
- Database: Neon (PostgreSQL) via Drizzle ORM 0.45.2
- Auth: NextAuth v5 beta — Credentials (email+password, bcryptjs) + Google OAuth
- Password hashing: `bcryptjs` (pure JS, Edge-compatible — NOT `@node-rs/bcrypt`)
- Rate limiting: Upstash Redis (`@upstash/ratelimit`, `@upstash/redis`)
- Email: Resend (optional — new message notifications)
- OG Images: `@vercel/og`
- **Deployment: Cloudflare Pages (PRIMARY) + Vercel (secondary)**

**Cloudflare Pages constraints (always enforced):**
- Every API route and page **must** export `export const runtime = 'edge'`
- **NEVER** `@node-rs/bcrypt` — WASM bundle too large for CF worker limit
- **NEVER** Node-only APIs (`fs`, `crypto`, `Buffer`)
- `DrizzleAdapter` must be **lazy-initialized** inside a function, not at module scope
- Middleware must be Edge-compatible (NextAuth v5 `auth` wrapper ✅)
- Build command: `npx @cloudflare/next-on-pages`

**Folder Structure:**
```
/
├── app/
│   ├── (dashboard)/dashboard/     # Inbox + Settings (auth-gated)
│   ├── admin/                     # Admin dashboard (admins table gated)
│   ├── onboarding/                # Username picker for OAuth users
│   ├── sign-in/                   # Custom sign-in page
│   ├── sign-up/                   # Custom sign-up page
│   ├── u/[username]/              # Public anonymous send page
│   └── api/
│       ├── auth/[...nextauth]/    # NextAuth handler
│       ├── auth/register/         # POST register (edge)
│       ├── messages/              # POST send anon message (edge)
│       ├── messages/[id]/         # DELETE, PATCH (edge)
│       ├── messages/flag/         # POST flag a message (edge)
│       ├── user/notifications/    # PATCH email notif toggle (edge)
│       ├── user/username/         # PATCH set username (edge)
│       ├── user/username/check/   # GET availability check (edge)
│       ├── admin/stats/           # GET platform stats (edge)
│       ├── admin/users/           # GET user list (edge)
│       ├── admin/users/[id]/      # DELETE user (edge)
│       ├── admin/users/[id]/ban/  # POST ban/unban (edge)
│       ├── admin/messages/        # GET all messages (edge)
│       ├── admin/messages/[id]/   # DELETE soft-delete (edge)
│       ├── admin/flags/           # GET flag queue (edge)
│       ├── admin/flags/[id]/      # PATCH resolve/dismiss (edge)
│       ├── admin/banned-ips/      # GET + POST (edge)
│       ├── admin/banned-ips/[id]/ # DELETE unban (edge)
│       └── og/                    # GET dynamic OG image (edge)
├── components/
│   ├── auth/         # SignInForm, SignUpForm, OnboardingForm
│   ├── dashboard/    # Sidebar, InboxList, MessageCard, FlagModal, SettingsForm
│   ├── send/         # SendForm
│   └── admin/        # AdminNav, UsersClient, MessagesClient, ModerationClient, BannedIpsClient
├── lib/
│   ├── db/index.ts        # getDb() — lazy Neon + Drizzle client (edge-safe)
│   ├── db/schema.ts       # All tables + enums + relations
│   ├── admin-auth.ts      # requireAdmin(), assertAdmin() — checks admins table
│   ├── rate-limit.ts      # getRatelimit() — Upstash lazy init
│   ├── resend.ts          # sendNewMessageNotification()
│   └── utils.ts           # timeAgo(), cn()
├── scripts/
│   ├── grant-admin.ts     # npm run admin:grant email@example.com
│   └── revoke-admin.ts    # npm run admin:revoke email@example.com
├── auth.ts                # NextAuth v5 config (DrizzleAdapter must be lazy)
├── middleware.ts           # Route protection (Edge-compatible)
└── drizzle.config.ts
```

---

## User Flows

### Flow 1: Sender (no account required)
1. Visits `/u/[username]`
2. Writes message (max 500 chars) in `SendForm`
3. `POST /api/messages` — IP ban check → rate limit (5/10 min) → insert
4. Message stored with zero sender info
5. Response returns `messageId` so sender can flag if regretted
6. Recipient gets optional email notification via Resend
7. Success screen: "Sent by mistake? Flag it" → `FlagModal` → `flaggedBy: sender`

### Flow 2: Recipient (account required)
1. Signs up at `/sign-up` (email+password or Google OAuth)
2. Google OAuth users → `/onboarding` to pick username (live availability check)
3. Gets shareable link: `bindu.app/u/[username]`
4. Views `/dashboard` → inbox with unread count badge
5. Reads, marks read/unread, deletes messages
6. Flags messages via hover → `FlagModal` (`flaggedBy: recipient`)
7. Settings: copy link, toggle email notifications

### Flow 3: Admin
1. Admin granted via `npm run admin:grant email@example.com`
2. Signs in normally → `/admin` unlocked
3. Overview: stats + recent signups + pending flags
4. Users: search, paginated 25/page, ban/unban/delete
5. Messages: paginated 30/page, filter all/flagged/deleted, soft-delete
6. Moderation: 3-tab queue, delete+resolve or dismiss flags
7. Banned IPs: add/remove manual IP bans

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
  password          text          -- null for OAuth; bcryptjs hash for credentials
  username          text UNIQUE
  displayName       text
  emailNotifications boolean DEFAULT true
  isBanned          boolean DEFAULT false NOT NULL
  bannedAt          timestamp
  bannedReason      text
  createdAt         timestamp DEFAULT now()
}

accounts {
  userId            text FK → users.id CASCADE
  type              AdapterAccountType
  provider          text
  providerAccountId text
  + OAuth token fields
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
  content           text            -- max 500 chars enforced in API
  isRead            boolean DEFAULT false NOT NULL
  isDeleted         boolean DEFAULT false NOT NULL
  deletedBy         text nullable   -- 'admin' | 'recipient'
  createdAt         timestamp DEFAULT now()
}

flags {
  id                serial PK
  messageId         integer FK → messages.id CASCADE
  flaggedBy         flaggedByEnum
  reason            flagReasonEnum
  note              text nullable
  status            flagStatusEnum DEFAULT 'pending' NOT NULL
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
| Method | Path | Runtime | Description |
|---|---|---|---|
| POST | `/api/messages` | edge | Send anon message. IP ban → rate limit → insert. Returns `{ ok, messageId }` |
| POST | `/api/messages/flag` | edge | Flag message. Sender: public. Recipient: session required |
| GET | `/api/og` | edge | Dynamic OG image `?username=&name=` |
| POST | `/api/auth/register` | edge | Register with email+password. bcryptjs hash |
| GET/POST | `/api/auth/[...nextauth]` | edge | NextAuth v5 handler |

### User (session required)
| Method | Path | Runtime | Description |
|---|---|---|---|
| DELETE | `/api/messages/[id]` | edge | Delete own message |
| PATCH | `/api/messages/[id]` | edge | Toggle read `{ isRead: bool }` |
| PATCH | `/api/user/notifications` | edge | Toggle email notifs `{ emailNotifications: bool }` |
| PATCH | `/api/user/username` | edge | Set/update username `{ username: string }` |
| GET | `/api/user/username/check` | edge | Check availability `?username=` → `{ available: bool }` |

### Admin (admins table row required)
| Method | Path | Runtime | Description |
|---|---|---|---|
| GET | `/api/admin/stats` | edge | Platform stats |
| GET | `/api/admin/users` | edge | Paginated users. `?page=&search=` |
| DELETE | `/api/admin/users/[id]` | edge | Hard delete user + cascade |
| POST | `/api/admin/users/[id]/ban` | edge | Ban/unban `{ ban: bool, reason? }` |
| GET | `/api/admin/messages` | edge | Paginated messages. `?page=&filter=` |
| DELETE | `/api/admin/messages/[id]` | edge | Soft delete |
| GET | `/api/admin/flags` | edge | Flag queue `?status=pending\|resolved\|dismissed` |
| PATCH | `/api/admin/flags/[id]` | edge | `{ status: 'resolved' \| 'dismissed' }` |
| GET | `/api/admin/banned-ips` | edge | List banned IPs |
| POST | `/api/admin/banned-ips` | edge | Add IP ban `{ ip, reason? }` |
| DELETE | `/api/admin/banned-ips/[id]` | edge | Remove IP ban |

---

## Env Vars

| Variable | Required | Description | Example |
|---|---|---|---|
| `DATABASE_URL` | ✅ | Neon pooled connection (app runtime) | `postgresql://...` |
| `DATABASE_URL_UNPOOLED` | ✅ | Neon direct (drizzle-kit + admin scripts only) | `postgresql://...` |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public base URL | `https://bindu.app` |
| `AUTH_SECRET` | ✅ | NextAuth secret (32 bytes) | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth client ID | `....apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth client secret | `GOCSPX-...` |
| `UPSTASH_REDIS_REST_URL` | ✅ | Upstash Redis REST endpoint | `https://....upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | Upstash Redis token | `AX...` |
| `RESEND_API_KEY` | ⚠️ Optional | Resend API key | `re_...` |
| `RESEND_FROM_EMAIL` | ⚠️ Optional | From address (verified domain) | `no-reply@bindu.app` |

---

## Phases & Timeline

| Phase | Name | Status | Key Tasks |
|---|---|---|---|
| 1 | Foundation | ✅ | Next.js 16, Drizzle schema, design system, fonts |
| 2 | Core Send Flow | ✅ | /u/[username], POST /api/messages, rate limiting, OG image |
| 3 | User Dashboard | ✅ | Inbox, MessageCard, Settings, Resend notifications |
| 4 | Auth System | ✅ | NextAuth v5: credentials + Google, registration, JWT, onboarding |
| 5 | Admin Dashboard | ✅ | Stats, users table (paginated), messages table (paginated) |
| 6 | Moderation | ✅ | Flags table, FlagModal (sender+recipient), admin queue |
| 7 | Polish | ✅ | IP ban enforcement, username onboarding, pagination, admin scripts |
| 8 | CF Compatibility | 🔄 | bcryptjs swap, lazy DrizzleAdapter, runtime=edge on all routes |
| 9 | Deploy | ⏳ | Cloudflare Pages deploy, env vars, Google OAuth redirect URI |

---

## Next Steps

> Ordered by priority.

1. [ ] Swap `@node-rs/bcrypt` → `bcryptjs` in `package.json`, `auth.ts`, `app/api/auth/register/route.ts`
2. [ ] Lazy-initialize `DrizzleAdapter` inside a factory function in `auth.ts` (not at module scope)
3. [ ] Add `export const runtime = 'edge'` to all routes missing it
4. [ ] Update `next.config.ts` — add `images: { unoptimized: true }` for CF static export
5. [ ] Add `.env.local` to `.gitignore`
6. [ ] `npm install -D @cloudflare/next-on-pages` + test CF build
7. [ ] `npm run db:push` — create all tables in Neon
8. [ ] Deploy to Cloudflare Pages — set all env vars in CF dashboard
9. [ ] Google Cloud Console → add `https://bindu.app/api/auth/callback/google`
10. [ ] Sign up on deployed site → `npm run admin:grant your@email.com`
11. [ ] (Optional) Set up Resend verified domain for email notifications

---

## Deployment

### Cloudflare Pages (PRIMARY)

Install adapter:
```bash
npm install -D @cloudflare/next-on-pages
```

CF dashboard build settings:
- Build command: `npx @cloudflare/next-on-pages`
- Output directory: `.vercel/output/static`
- Node version: 20

`next.config.ts` required additions:
```ts
images: { unoptimized: true }
```

### Vercel (Secondary)

Push to GitHub → auto-deploy from `main`. Add same env vars in Vercel dashboard.

### Edge Runtime Compatibility Matrix

| Feature | Cloudflare Pages | Vercel Edge |
|---|---|---|
| `@neondatabase/serverless` neon-http | ✅ | ✅ |
| `bcryptjs` (pure JS) | ✅ | ✅ |
| `@node-rs/bcrypt` (WASM) | ❌ Too large | ✅ |
| NextAuth v5 JWT strategy | ✅ | ✅ |
| `@upstash/redis` | ✅ | ✅ |
| `@vercel/og` | ✅ | ✅ |
| `resend` | ✅ | ✅ |
| `DrizzleAdapter` lazy-initialized | ✅ | ✅ |
| `DrizzleAdapter` at module scope | ❌ | ✅ |
| Node.js `fs`, `crypto`, `Buffer` | ❌ | ❌ |

---

## Notes / Decisions Log

- **2026-05-03** — Replaced Clerk with NextAuth v5. JWT sessions for edge compatibility.
- **2026-05-03** — Admin access via separate `admins` table. Explicit grant via CLI script.
- **2026-05-03** — Soft delete on messages preserves flagged content for moderation review.
- **2026-05-03** — Both sender and recipient can flag. `POST /api/messages` returns `messageId` for sender flagging.
- **2026-05-03** — `getDb()` returns null gracefully — no build-time crash without `DATABASE_URL`.
- **2026-05-03** — IP ban check fires before rate limit. Banned recipient returns 404 (no info leak).
- **2026-05-03** — Google OAuth users without username → `/onboarding` (live check, link preview).
- **2026-05-03** — Admin tables paginated server-side (25/30 rows, URL-driven, `useTransition`).
- **2026-05-06** — Deploy target changed to **Cloudflare Pages PRIMARY**, Vercel secondary. All routes need `runtime = 'edge'`. `bcryptjs` required. `DrizzleAdapter` must be lazy.
