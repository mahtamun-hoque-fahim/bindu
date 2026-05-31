# Bindu (বিন্দু)

End-to-end encrypted anonymous inbox. Share a link, receive whispers, reply with vibes. The server never reads your messages.

---

## Stack

- Next.js 16 App Router (TypeScript)
- Tailwind CSS v4 + CSS variables (three themes)
- Neon (PostgreSQL) + Drizzle ORM
- WebCrypto for E2E (ECDH P-256 + AES-256-GCM)
- bcryptjs (passphrase hashing)
- Upstash Redis (rate limiting)
- **Cloudflare Pages** (primary) via `@opennextjs/cloudflare`

---

## Prerequisites

- Node.js 22+
- npm
- Neon account + database
- Upstash account + Redis database
- Cloudflare account (for deploy)

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
# fill in all values — see Env Vars below

# 4. Push DB schema (uses DATABASE_URL_UNPOOLED)
npm run db:push

# 5. Run
npm run dev
```

---

## Env Vars

```env
DATABASE_URL=             # Neon pooled
DATABASE_URL_UNPOOLED=    # Neon direct (migrations only)
NEXT_PUBLIC_APP_URL=
SESSION_SECRET=           # 32 bytes — `openssl rand -base64 32`
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Full descriptions → `PLANNER.md` → Env Vars.

---

## Commands

```bash
npm run dev           # localhost:3000
npm run build         # Next production build
npm run lint          # ESLint
npm run db:push       # Push schema to Neon
npm run db:generate   # Generate migration files
npm run db:migrate    # Run migrations
npm run db:studio     # Drizzle Studio GUI

# Cloudflare
npm run build:cf      # opennextjs-cloudflare build
npm run preview:cf    # Build + wrangler dev
npm run deploy:cf     # Build + wrangler deploy
```

---

## Deploy — Cloudflare Pages

Build settings:
- Build command: `npm run build:cf`
- Output directory: `.open-next/assets`
- Node version: `22` (`.node-version` pins this)

Add all env vars in Cloudflare dashboard → Settings → Environment Variables.

After first deploy, sign up to claim your account.

---

## Folder Structure

```
app/          # Pages, layouts, API routes (all edge runtime)
components/   # landing/, dashboard/, staff/, admin/, ui/
lib/          # db/, crypto/, session.ts, rate-limit.ts, utils.ts, env.ts
middleware.ts # edge route protection
```

Full architecture → `PLANNER.md`.

---

## Cloudflare Edge Constraints

- All routes: `export const runtime = 'edge'`
- Use `bcryptjs` (pure JS) — never `@node-rs/bcrypt`
- Use `@neondatabase/serverless` (neon-http) — never `pg`
- `getDb()` is lazy; guard with `if (!db) return`
- No Node-only APIs (`fs`, `Buffer`); use `lib/utils.ts` `bytesToBase64` / `base64ToBytes`
- WebCrypto (`crypto.subtle`) works server-side and client-side

---

## Prior code

The previous Bindu codebase is preserved on the `pre-pivot-archive` branch.
