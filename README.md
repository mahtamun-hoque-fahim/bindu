# Bindu (বিন্দু)

End-to-end encrypted anonymous inbox. Share a link, receive whispers, reply with vibes, export to story. The server never reads your messages.

---

## What works today

- Three-themed landing (sunset / acid / dream) with live demo widget
- Passphrase-based signup + sign-in (no email, no OAuth)
- ECDH P-256 + AES-256-GCM hybrid encryption — sender encrypts in-browser, server stores ciphertext only
- Hashed sender IDs (4-char hex) — per-recipient stable, unlinkable across recipients
- 4-pane recipient inbox with decrypt-in-browser, mood reactions, mute-by-hash, on-device safety filter, soft delete
- UnlockGate — handles cleared IndexedDB without forcing full sign-in
- Story export — 1080×1920 PNG, theme-matched, Web Share API or download
- Edge-runtime everywhere; deploys to Cloudflare Pages

Phases 7–9 (settings, staff dashboard, admin dashboard) pending — see `PLANNER.md`.

---

## Stack

- Next.js 16 App Router (TypeScript)
- Tailwind CSS v4 + CSS variables
- Neon (PostgreSQL) + Drizzle ORM
- WebCrypto for E2E (no libsodium / no JWT lib)
- bcryptjs (passphrase hashing)
- Upstash Redis (rate limiting; in-memory fallback in dev)
- **Cloudflare Pages** (primary) via `@opennextjs/cloudflare`

---

## Prerequisites

- Node.js 22+ (pinned via `.node-version`)
- npm
- Neon account + database
- Upstash account + Redis database (production)
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
# fill in DATABASE_URL, DATABASE_URL_UNPOOLED, SESSION_SECRET at minimum

# 4. Push schema to Neon
npm run db:push

# 5. Run
npm run dev
```

To run the dev crypto lab: visit `http://localhost:3000/lab/crypto` — full E2E protocol roundtrip with per-step timing. Auto-hidden in production unless `BINDU_ENABLE_LAB=1`.

---

## Env Vars

```env
DATABASE_URL=                  # Neon pooled
DATABASE_URL_UNPOOLED=         # Neon direct (migrations only)
NEXT_PUBLIC_APP_URL=
SESSION_SECRET=                # 32 bytes — `openssl rand -base64 32`
UPSTASH_REDIS_REST_URL=        # prod only
UPSTASH_REDIS_REST_TOKEN=      # prod only
BINDU_ENABLE_LAB=              # optional, set to "1" to expose /lab/crypto in prod
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
app/                Pages, layouts, API routes (all edge runtime)
  (auth)/           Sign-up + sign-in (redirects to dashboard if signed in)
  (dashboard)/      Protected dashboard (requireSession)
  api/              11 route handlers — auth, messages, reactions, mutes, pubkey, user
  u/[username]/     Public anonymous send page
  lab/crypto/       Dev-only browser crypto roundtrip lab
components/         Landing sections, providers
lib/                auth/, canvas/, crypto/, db/, env.ts, key-cache.ts,
                    rate-limit.ts, safety-filter.ts, session.ts, utils.ts
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
- No `middleware.ts` / `proxy.ts` — Next 16 + opennextjs-cloudflare aren't compatible there. Route protection lives in layouts (`requireSession`) and handlers (`requireSessionApi`)

---

## Prior code

The previous Bindu codebase is preserved on the `pre-pivot-archive` branch.
