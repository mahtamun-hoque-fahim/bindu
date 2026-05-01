# Bindu

Anonymous messaging — share your link, receive messages from anyone.

---

## Stack

- Next.js 16 App Router (TypeScript 6)
- Tailwind CSS 4
- Neon (PostgreSQL) + Drizzle ORM 0.45
- `@clerk/nextjs` 7
- `@upstash/redis` 1.37 + `@upstash/ratelimit` 2.0
- Resend 6
- `@vercel/og` 0.11
- Vercel

---

## Prerequisites

- Node.js 18+
- pnpm (or npm)
- Neon account + database
- Clerk account + app
- Upstash Redis database
- Resend account (optional — for email notifications)

---

## Local Setup

```bash
# 1. Clone
git clone https://github.com/mahtamun-hoque-fahim/bindu.git
cd bindu

# 2. Install
pnpm install

# 3. Env
cp .env.example .env.local
# Fill in values — see Env Vars below

# 4. Push DB schema
pnpm db:push

# 5. Run
pnpm dev
```

---

## Env Vars

```env
# Database
DATABASE_URL=
DATABASE_URL_UNPOOLED=

# App
NEXT_PUBLIC_APP_URL=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Resend (optional)
RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

Full descriptions → `PLANNER.md` → Env Vars section.

---

## Commands

```bash
pnpm dev          # Start dev server (localhost:3000)
pnpm build        # Production build
pnpm start        # Start production server
pnpm db:push      # Push Drizzle schema to Neon
pnpm db:generate  # Generate migration files
pnpm db:studio    # Open Drizzle Studio
pnpm lint         # Run ESLint
```

---

## Deploy

Deployed on Vercel. Pushes to `main` auto-deploy.

```bash
vercel --prod
```

---

## Folder Structure

```
app/          # Pages, layouts, API routes
components/   # UI components (ui/, send/, dashboard/)
lib/          # DB client, schema, rate-limit, utils
public/       # Static assets
drizzle/      # Generated migration files
```

Full architecture → `PLANNER.md`.
