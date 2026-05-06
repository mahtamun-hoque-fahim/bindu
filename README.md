# Bindu (বিন্দু)

Anonymous messaging — share a link, receive messages from anyone. No account needed to send.

---

## Stack

- Next.js 16.2.4 App Router (TypeScript 6.0.3)
- Tailwind CSS 4.2.4
- Neon (PostgreSQL) + Drizzle ORM 0.45.2
- NextAuth v5 beta — Credentials (bcryptjs) + Google OAuth
- Upstash Redis (rate limiting)
- Resend (optional email notifications)
- `@vercel/og` (dynamic OG images)
- **Cloudflare Pages (PRIMARY)** + Vercel (secondary)

---

## Prerequisites

- Node.js 20+
- npm
- Neon account + database
- Google Cloud project (OAuth credentials)
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
# Fill in all values — see Env Vars below

# 4. Push DB schema (runs against DATABASE_URL_UNPOOLED)
npm run db:push

# 5. Run
npm run dev
```

---

## Env Vars

```env
# Neon PostgreSQL
DATABASE_URL=
DATABASE_URL_UNPOOLED=

# App
NEXT_PUBLIC_APP_URL=

# NextAuth
AUTH_SECRET=                  # openssl rand -base64 32

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

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
npm run dev           # Dev server (localhost:3000)
npm run build         # Production build
npm run start         # Production server
npm run lint          # ESLint

# Database
npm run db:push       # Push schema to Neon (uses DATABASE_URL_UNPOOLED)
npm run db:generate   # Generate migration files
npm run db:migrate    # Run migrations
npm run db:studio     # Drizzle Studio GUI

# Admin
npm run admin:grant email@example.com    # Grant admin access
npm run admin:revoke email@example.com   # Revoke admin access
```

---

## Deploy — Cloudflare Pages (Primary)

1. Install the adapter:
   ```bash
   npm install -D @cloudflare/next-on-pages
   ```

2. In Cloudflare dashboard → Pages → Create project → Connect GitHub repo:
   - **Build command:** `npx @cloudflare/next-on-pages`
   - **Output directory:** `.vercel/output/static`
   - **Node version:** `20`

3. Add all env vars in CF dashboard → Settings → Environment Variables

4. Google Cloud Console → OAuth 2.0 Client → Authorized redirect URIs:
   ```
   https://bindu.app/api/auth/callback/google
   ```

5. After first deploy — sign up, then:
   ```bash
   npm run admin:grant your@email.com
   ```

## Deploy — Vercel (Secondary)

Push to `main` → Vercel auto-deploys. Add same env vars in Vercel dashboard.

Additional redirect URI for Vercel previews:
```
https://your-project.vercel.app/api/auth/callback/google
```

---

## Folder Structure

```
app/          # Pages, layouts, API routes (all edge runtime)
components/   # UI components (auth, dashboard, admin, send)
lib/          # DB client, utils, admin-auth, rate-limit, resend
scripts/      # Admin CLI tools (grant-admin, revoke-admin)
auth.ts       # NextAuth v5 config
middleware.ts # Route protection (edge-compatible)
```

Full architecture → `PLANNER.md`.

---

## Cloudflare Constraints

All routes use `export const runtime = 'edge'`. Never use `@node-rs/bcrypt` (WASM too large for CF). Use `bcryptjs` only. `DrizzleAdapter` must be lazy-initialized. See `PLANNER.md` → Deployment for full compatibility matrix.
