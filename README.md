# Bindu (বিন্দু)

Anonymous messaging — share a link, receive messages from anyone. No account needed to send.

---

## Stack

- Next.js 16.2.4 App Router (TypeScript)
- Tailwind CSS 4.2.4
- Neon (PostgreSQL) + Drizzle ORM 0.45.2
- NextAuth v5 beta — Credentials + Google OAuth
- Upstash Redis (rate limiting)
- Resend (optional email notifications)
- @vercel/og (dynamic OG images)
- Vercel (deployment)

---

## Prerequisites

- Node.js 20+
- npm
- Neon account + database
- Google Cloud project (OAuth credentials)
- Upstash account + Redis database

---

## Local Setup

```bash
# 1. Clone
git clone https://github.com/mahtamun-hoque-fahim/bindu.git
cd bindu

# 2. Install
npm install

# 3. Env
cp .env.example .env.local
# Fill in all values — see Env Vars below

# 4. Push DB schema
npx drizzle-kit push

# 5. Run
npm run dev
```

---

## Env Vars

```env
DATABASE_URL=
DATABASE_URL_UNPOOLED=
NEXT_PUBLIC_APP_URL=

AUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

Full descriptions → `PLANNER.md` → Env Vars section.

---

## Commands

```bash
npm run dev          # Dev server (localhost:3000)
npm run build        # Production build
npm run start        # Production server
npx drizzle-kit push # Push schema to Neon (uses DATABASE_URL_UNPOOLED)
npx drizzle-kit studio # Drizzle Studio GUI
npm run lint         # ESLint
```

---

## First Admin

After first deploy, insert your admin row directly in Neon:

```sql
INSERT INTO admins (user_id, granted_by) VALUES ('your-user-id', null);
```

Get your user ID from the `users` table after signing up.

---

## Deploy

Deployed on Vercel. Push to `main` → auto-deploy.

Google OAuth redirect URI to add:
```
https://bindu.app/api/auth/callback/google
```

---

## Folder Structure

```
app/          # Pages, layouts, API routes
components/   # UI components (auth, dashboard, admin, send)
lib/          # DB client, utils, admin-auth, rate-limit, resend
auth.ts       # NextAuth v5 config
middleware.ts # Route protection
```

Full architecture → `PLANNER.md`.
