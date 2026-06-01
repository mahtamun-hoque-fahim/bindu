# PLANNER.md — Bindu

> Living technical document. Updated whenever `update repo` is triggered.
> Last updated: 2026-06-01

---

## Overview

| Field | Value |
|---|---|
| Project | Bindu (বিন্দু) |
| Purpose | End-to-end encrypted anonymous inbox — share a link, receive whispers, reply with vibes, export to story |
| Target User | Teens and young adults; group-chat-native; want honest, anonymous feedback without the trauma of NGL/Sendit |
| Key Value | The server literally cannot read your messages. Hashed sender IDs let you block without de-anonymizing. |
| Status | 🟡 Phases 0–6 complete · Phases 7–9 pending |
| Repo | `https://github.com/mahtamun-hoque-fahim/bindu` |
| Live URL | `https://bindu.app` *(pending CF Pages deploy)* |
| Prior code | `pre-pivot-archive` branch |

---

## Architecture

**Stack:**

- Framework: Next.js 16.2.6 App Router (TypeScript)
- Styling: Tailwind CSS v4 + CSS variables (three themes)
- Database: Neon (PostgreSQL) via Drizzle ORM 0.45.2
- Auth: Custom passphrase-based — no email, no OAuth. bcryptjs for passphrase hashing. HS256 cookies signed with WebCrypto HMAC (no JWT lib).
- Crypto: WebCrypto API (browser-native). No libsodium, no external crypto deps.
- Rate limiting: Upstash Redis (`@upstash/ratelimit` + `@upstash/redis`); falls back to in-memory in dev when env absent
- Deployment: **Cloudflare Pages (primary)** via `@opennextjs/cloudflare`

**Cloudflare edge constraints (enforced everywhere):**

- All API routes and pages: `export const runtime = 'edge'`
- NEVER `@node-rs/bcrypt` (WASM too large for CF Worker). Use `bcryptjs`.
- NEVER use Node-only APIs (`fs`, `Buffer`, etc.). For base64 use `btoa`/`atob` helpers in `lib/utils.ts`.
- `getDb()` is lazy — returns `null` when `DATABASE_URL` is absent (build time).
- WebCrypto (`crypto.subtle`) is available on edge and used for session HMAC, all client-side crypto.
- No `middleware.ts` / `proxy.ts` — Next 16 forbids edge proxies, opennextjs-cloudflare requires them. Route protection lives in layouts (`requireSession` for pages) and per-handler (`requireSessionApi` for routes).

**Folder structure (current):**

```
/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx                ← redirects to /dashboard if signed in
│   │   ├── sign-in/{page,SignInForm}.tsx
│   │   └── sign-up/{page,SignUpForm}.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                ← requireSession()
│   │   └── dashboard/
│   │       ├── page.tsx              ← loads user, mounts <Inbox>
│   │       ├── Inbox.tsx             ← orchestrator
│   │       ├── UnlockGate.tsx        ← passphrase prompt when IDB empty
│   │       ├── Sidebar.tsx           ← filters / copy-link / lock / sign-out
│   │       ├── MessageList.tsx      ← decrypted list
│   │       ├── MessageReader.tsx    ← reader + actions
│   │       ├── StoryExportModal.tsx ← preview + share/download
│   │       ├── RightPanel.tsx       ← share card + mood-of-week + top hashes
│   │       └── types.ts
│   ├── api/
│   │   ├── auth/
│   │   │   ├── sign-up/route.ts
│   │   │   ├── sign-in/route.ts
│   │   │   ├── sign-out/route.ts
│   │   │   └── me/route.ts
│   │   ├── messages/
│   │   │   ├── route.ts              ← GET inbox + POST send
│   │   │   ├── post.ts               ← extracted POST handler
│   │   │   └── [id]/route.ts         ← PATCH read/fav, DELETE
│   │   ├── reactions/route.ts        ← POST + DELETE
│   │   ├── mutes/route.ts            ← POST + DELETE
│   │   ├── pubkey/[username]/route.ts ← public, 60s cache
│   │   └── user/
│   │       ├── check-username/route.ts
│   │       └── encrypted-key/route.ts ← wrapped privKey for UnlockGate
│   ├── lab/crypto/{page,CryptoLab}.tsx  ← dev-only roundtrip lab
│   ├── u/[username]/{page,SendForm,not-found}.tsx
│   ├── globals.css                   ← three themes + base primitives
│   ├── layout.tsx                    ← Google Fonts preload, ThemeProvider
│   ├── page.tsx                      ← landing
│   └── not-found.tsx                 ← global 404
├── components/
│   ├── landing/                      ← 10 sections (TopNav, Hero, LiveDemo,
│   │                                    Logos, HowItWorks, Features, Privacy,
│   │                                    DashboardsPreview, FAQ, FinalCTA, Footer)
│   └── providers/ThemeProvider.tsx
├── lib/
│   ├── auth/                         ← client.ts, server.ts, passwords.ts,
│   │                                    validation.ts, diceware.ts (633 words)
│   ├── canvas/story-card.ts          ← 1080×1920 story PNG renderer
│   ├── crypto/                       ← types, keypair, kdf, wrap, hybrid,
│   │                                    sender-hash, index (barrel)
│   ├── db/                           ← index (lazy edge client), schema
│   ├── env.ts                        ← lazy env access
│   ├── key-cache.ts                  ← IndexedDB CryptoKey store
│   ├── rate-limit.ts                 ← Upstash + in-memory fallback
│   ├── safety-filter.ts              ← doxxing + self-harm classification
│   ├── session.ts                    ← HS256 cookies via WebCrypto
│   └── utils.ts                      ← cn, timeAgo, base64 helpers
├── drizzle.config.ts
├── open-next.config.ts
├── wrangler.jsonc
├── next.config.ts
└── tsconfig.json
```

**Total code: 68 TS/TSX files.**

---

## User Flows

### Flow 1: Sender (no account, /u/[username])

1. Visits `/u/[username]`
2. Server-renders the recipient profile (displayName, bio, theme), 404s if not found / banned
3. Client `SendForm` mounts → `getOrCreateDeviceId()` from localStorage (32 random bytes)
4. `deriveSenderHash(deviceId, recipientId)` → 4 hex chars (`#f3a9` style)
5. User composes (≤200 chars) + picks mood (whitelist)
6. `importPublicJwk(recipient.pubKey)` → recipient's ECDH public key
7. `encryptToRecipient(plaintext, recipientPub)` — generate ephemeral keypair, ECDH-derive shared, AES-256-GCM encrypt, return `{ciphertext, iv, ephemeralPubKey}`
8. POST `/api/messages` with `{recipientId, ciphertext, iv, ephemeralPubKey, senderHash, mood}`
9. Server: rate limit → JSON parse → envelope shape → ciphertext/iv caps → senderHash regex → mood whitelist → DB → IP ban → recipient exists+unbanned → muted hash silent drop → insert
10. Response 201 — same for accept and silent drop (sender can't probe mute status)
11. UI: "delivered anonymously · no trace" + Send-another / Get-your-own-inbox CTAs

### Flow 2: Recipient — signup

1. Visits `/sign-up` (optionally with `?username=` prefill from FinalCTA)
2. Step 1: type `@username`, debounced `/api/user/check-username` lookups
3. Step 2: passphrase auto-generated via diceware (6 words, ~54 bits) — user can regenerate, copy, or override. Strength meter for custom phrases. Must check "I saved this" box.
4. Step 3 (creating): browser generates ECDH P-256 keypair → derives KEK via PBKDF2-SHA256 × 600k → wraps privKey under KEK → POSTs `{username, passphrase, pubKey, encPrivKey}`
5. Server: rate limit → validate → bcryptjs hash (cost 10, ~115ms) → insert → set HS256 cookie → respond
6. Client caches unwrapped privKey in IndexedDB → redirect to `/dashboard`

### Flow 3: Recipient — signin

1. `/sign-in`: username + passphrase
2. Server: bcryptjs.compare (dummy hash on miss to prevent timing-based username enumeration) → sets cookie → returns `{uid, isStaff, isAdmin, encPrivKey}`
3. Client: derive KEK from passphrase + returned salt → unwrap privKey → cache in IndexedDB → redirect

### Flow 4: Recipient — open inbox

1. `/dashboard` server-renders user info + applies theme class
2. Client `Inbox` checks IndexedDB for unwrapped privKey
   - If present: skip to step 4
   - If absent: render `UnlockGate` (prompt passphrase, derive KEK, unwrap, cache, continue) — covers private-mode / cleared-data / new-device cases without forcing full sign-in
3. Fetch `GET /api/messages` → ciphertext + metadata + reactions + muted hashes
4. Parallel decrypt: for each message, `decryptFromSender(encrypted, privKey)`
5. Run `safety-filter.classify()` on each plaintext → clean / warn / hide
6. Render: 4-pane layout (Sidebar / MessageList / MessageReader / RightPanel)
7. Optimistic mutations: mark-read on select, favorite, mute hash, react, delete

### Flow 5: Recipient — export to story

1. Open a decrypted message in MessageReader
2. Click ↗ "Export to story"
3. `renderStoryCard({plaintext, mood, senderHash, username, theme})` runs in-browser
4. Reads theme tokens via `getComputedStyle` of a probe element
5. Draws to 1080×1920 canvas, returns PNG blob
6. Modal shows scaled preview
7. Click Share/download → Web Share API if available (iOS/Android native sheet), else `<a download>`

### Flow 6: Recipient — flag a message (Phase 8 surface; data model present)

1. User clicks ⚠ on a decrypted message
2. Their browser POSTs `/api/messages/flag` with `{messageId, reportedPlaintext, reason, note?}` (voluntary plaintext share)
3. Server inserts into `flags` table, marks message `isFlagged`
4. Staff sees it in `/staff` queue
5. Staff resolves with status + optional soft-delete

---

## DB Schema

> Drizzle / PostgreSQL. UUIDs everywhere. JSONB for JWK key material.

**v1 tables (in active use):** `users`, `messages`, `mutedHashes`, `reactions`, `flags` (Phase 8 surface), `bannedIps` (Phase 9), `auditLog` (Phase 9).

**v2 tables (defined, no surface yet):** `groups`, `group_members`, `subscriptions`.

Full Drizzle definitions live in `lib/db/schema.ts`. Highlights:

- `users.pubKey` is JSONB JWK; `users.encPrivKey` is `{ciphertext, iv, salt}` — AES-256-GCM wrapped under PBKDF2-derived KEK.
- `messages` stores ciphertext only — never plaintext. Indexed by `(recipientId, createdAt)` and `(recipientId, senderHash)`.
- `mutedHashes` has a composite PK `(userId, senderHash)` — silent-drop checks are a single PK lookup.
- `reactions` has `UNIQUE (messageId, emoji)` — reacting is idempotent.
- `flags.reportedPlaintext` holds plaintext only when a recipient voluntarily flags — the only way staff ever see content.

---

## API Routes

> All routes use `export const runtime = 'edge'`. 11 routes total.

### Public (no auth)

| Method | Path | Description |
|---|---|---|
| GET | `/api/pubkey/[username]` | Returns `{recipientId, username, displayName, bio, theme, pubKey}`. Banned → 404. 60s cache. |
| POST | `/api/messages` | Anonymous send. Rate limit 5/10min. IP ban. Silent mute drop. |
| POST | `/api/auth/sign-up` | `{username, passphrase, pubKey, encPrivKey}` → 201 + cookie. Rate limit 10/h. |
| POST | `/api/auth/sign-in` | `{username, passphrase}` → 200 + cookie + `encPrivKey`. Rate limit 20/15min. Dummy-bcrypt on miss for timing safety. |
| POST | `/api/auth/sign-out` | Clears cookie. |
| GET | `/api/auth/me` | Session info `{uid, username, isStaff, isAdmin}` or `{ok: false}`. |
| GET | `/api/user/check-username` | `?u=...` → `{available, reason}`. Rate limit 60/min. |

### Recipient (session required)

| Method | Path | Description |
|---|---|---|
| GET | `/api/messages` | Inbox: `?limit=50&before=ISO`. Returns ciphertext + metadata + grouped reactions + muted hash list. |
| PATCH | `/api/messages/[id]` | `{isRead?, isFavorited?}`. Ownership-checked. |
| DELETE | `/api/messages/[id]` | Soft delete (deletedBy='recipient'). |
| POST | `/api/reactions` | `{messageId, emoji}`. Idempotent on unique idx. |
| DELETE | `/api/reactions` | `?messageId=&emoji=`. |
| POST | `/api/mutes` | `{senderHash}`. Idempotent. |
| DELETE | `/api/mutes` | `?hash=`. |
| GET | `/api/user/encrypted-key` | Returns wrapped privKey for UnlockGate. |

### Staff (Phase 8 — schema present, routes pending)

### Admin (Phase 9 — schema present, routes pending)

---

## Env Vars

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon pooled connection (app runtime) |
| `DATABASE_URL_UNPOOLED` | ✅ (migrations only) | Neon direct connection (drizzle-kit) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public base URL |
| `SESSION_SECRET` | ✅ | HMAC key for signing session cookies (32+ bytes) |
| `UPSTASH_REDIS_REST_URL` | ✅ (prod) | Upstash REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ (prod) | Upstash auth token |
| `BINDU_ENABLE_LAB` | optional | If `1` in production, exposes `/lab/crypto` |

In dev, missing Upstash env causes rate-limit to fall back to per-worker in-memory map.

---

## Phases & Timeline

| Phase | Name | Status | Commit | Key Tasks |
|---|---|---|---|---|
| 0 | Scaffold | ✅ | `b5130d2` | Next 16, Drizzle schema, theme tokens, CF Pages config, lazy DB, env shape |
| 1 | Landing + design system | ✅ | `368b2f0` | All 10 sections, theme switcher + dark toggle, live demo widget |
| 2 | Crypto core | ✅ | `f5ea0f2` | `lib/crypto/` — keypair, hybrid, PBKDF2 KDF, sender-hash, browser lab |
| 3 | Auth | ✅ | `0308333` | HS256 sessions, passphrase signup/signin, IndexedDB key cache, route guards, diceware |
| 4 | Send flow | ✅ | `5d86b3f` | `/u/[username]`, pubkey fetch, encrypt-in-browser, POST, IP ban + rate limit, silent mute drop |
| 5 | Recipient inbox | ✅ | `3b95d72` | 4-pane dashboard, decrypt-in-browser, mood reactions, mute, on-device safety filter, UnlockGate |
| 6 | Story export | ✅ | `8575a5d` | 1080×1920 PNG renderer, theme-matched, Web Share API + download |
| 7 | Settings | ✅ | — | `/settings` page, theme/displayName/bio update, atomic passphrase rotation, blocked-hashes list, lock-now, account deletion |
| 8 | Staff dashboard | ⏳ | — | Flag queue, resolve / dismiss / escalate |
| 9 | Admin dashboard | ⏳ | — | Platform stats, users CRUD, banned IPs CRUD, audit log |
| v2 | Group dots | ⏳ | — | Shared-key groups, member key wrapping |
| v2 | Bindu+ | ⏳ | — | Stripe wiring, feature gates (200→500 chars, custom emoji) |
| v2 | X25519 migration | ⏳ | — | Replace P-256 once browser support is universal |

---

## Next Steps

> Phase 8 — staff dashboard.

1. [ ] `POST /api/messages/flag` — recipient re-submits plaintext + reason
2. [ ] `GET /api/staff/flags` — queue (paginated, filterable by status + reason severity)
3. [ ] `PATCH /api/staff/flags/[id]` — `{status, resolverNote?, deleteMessage?}`
4. [ ] `/staff` protected page with queue + detail panes
5. [ ] Mod actions: dismiss / resolve+delete / escalate-to-recipient
6. [ ] Wire ⚠ button in MessageReader to call flag endpoint with current plaintext + reason picker

---

## Notes / Decisions Log

- **2026-05-31** — Full product pivot. Old code preserved at `pre-pivot-archive` branch.
- **2026-05-31** — E2E encryption is real: ECDH P-256 + AES-256-GCM hybrid via WebCrypto. Server never sees plaintext.
- **2026-05-31** — Passphrase-based auth. Lose passphrase = lose inbox. No recovery, by design.
- **2026-05-31** — Sender hash derived client-side: `SHA-256(deviceId || recipientId).slice(0,4)`. Recipient sees stable hashes per sender. Cleared localStorage = new identity (matches NGL/Sendit limitation, acceptable).
- **2026-05-31** — Moderation respects E2E: staff only see content the recipient voluntarily resubmits via flag.
- **2026-05-31** — Three themes (sunset/acid/dream) ship in v1. Sunset is the brand default. All three have dark mode.
- **2026-05-31** — No email, no phone, no OAuth. Passphrase is the only secret.
- **2026-05-31** — Group dots and Bindu+ deferred to v2. Schema is present; surface is dormant.
- **2026-05-31** — Phase 3: passphrase goes over TLS to server for bcrypt-verify only (~100ms in memory, never persisted). Server never sees the unwrapped private key. KEK is derived browser-side from `(passphrase, salt)` and lives only in the tab. The unwrapped private key is non-extractable + cached in IndexedDB across navigations within a browser session.
- **2026-05-31** — Diceware passphrase generator default: 6 words from a 633-word short-common-English list, ~54 bits entropy. Users can type their own. Strength meter is heuristic (no zxcvbn) to keep bundle small.
- **2026-05-31** — Route protection done in layouts via `requireSession()` (Server Component redirect) and per-handler `requireSessionApi()`. No `proxy.ts` — Next 16 forbids edge proxies, opennextjs-cloudflare requires them; layouts handle it cleanly.
- **2026-05-31** — Phase 4: send flow returns the same success response for genuine sends AND silently-dropped (muted) messages. A sender cannot tell from the API response whether they were muted — preventing the "clear localStorage → new hash → evade mute" attack. Rate limit slot is still consumed for silent drops.
- **2026-05-31** — Banned users 404 to senders, not 403, so ban status doesn't leak to the wider internet.
- **2026-05-31** — `/u/[username]` applies the recipient's chosen theme (sunset/acid/dream) to the sender's view, so the send page feels like the recipient's space.
- **2026-05-31** — `/api/messages` POST: validation runs BEFORE DB checks so malformed requests fail fast and informatively even if the DB is unreachable. Rate limit is the only DB-free gate that runs first (5 req/10min/IP, in-memory in dev, Upstash in prod).
- **2026-05-31** — Phase 5: messages are fetched as ciphertext + metadata and decrypted in the browser using the cached private key. Failed decryption renders an inline error rather than blocking the inbox.
- **2026-05-31** — Safety filter: doxxing-pattern + self-harm-cue detection runs over plaintext after decryption. Hide-by-default for any phone/address/self-harm/slur hit, with a "Show anyway" reveal button. Slur list is a typed extension point — needs localization (Bangla + English) we can't curate inline.
- **2026-05-31** — UnlockGate: when session cookie is valid but IndexedDB is empty (data cleared / private mode / new device), the dashboard prompts for passphrase and re-unwraps without forcing a full sign-in.
- **2026-05-31** — Inbox UI is 4-column at ≥1100px (sidebar / list / reader / right panel), collapses to 3-column ≤1100px (drops right panel), and stacks at ≤800px.
- **2026-05-31** — All inbox PATCH/DELETE operations are optimistic — UI updates first, request fires-and-forgets. Reconciliation on errors is deferred to v2 (network-blip handling).
- **2026-05-31** — Phase 6: story export renders entirely on the client. The card never touches the server — even our server-side rendering wouldn't see plaintext because of E2E. Adds zero new npm dependencies (uses the browser's native Canvas2D API).
- **2026-05-31** — Story card reads theme tokens via a hidden probe element with `getComputedStyle`, so the export automatically matches whatever theme the recipient is currently viewing. Falls back to sunset defaults if any token is unset.
- **2026-05-31** — Export modal uses Web Share API when available (`navigator.canShare({ files })` — iOS Safari 15+, Chrome on Android), falls back to standard download. Filename: `bindu-whisper-{senderHash}.png`.
- **2026-06-01** — Phase 7: passphrase rotation is atomic. The client re-derives the OLD KEK, unwraps the JWK, derives a NEW KEK with fresh salt, re-wraps the SAME private key, and POSTs `{currentPassphrase, newPassphrase, newEncPrivKey}`. The server bcrypt-verifies the current passphrase, hashes the new one, and writes both `passphraseHash` and `encPrivKey` in a single Drizzle UPDATE — Postgres guarantees both commit or neither does. A partial failure leaves the old (working) state intact.
- **2026-06-01** — Account deletion requires passphrase re-confirmation in the request body. Server bcrypt-verifies, deletes the user row, and FK `onDelete: cascade` clears messages, reactions, mutes, flags. Session cookie cleared in the same response.
- **2026-06-01** — Theme picker in settings persists to the server AND updates the client ThemeProvider instantly — recipient's send page (`/u/[username]`) re-renders with the new theme on next request via the server-side theme class.
- **2026-06-01** — Rate limit on rotate-passphrase: 5 attempts per hour per `(userId, IP)` pair. Generous enough for legitimate retries on a typo, tight enough to make brute-forcing the current passphrase via this endpoint impractical.
