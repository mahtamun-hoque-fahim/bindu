# PLANNER.md — Bindu

> Living technical document. Updated whenever `update repo` is triggered.
> Last updated: 2026-05-31

---

## Overview

| Field | Value |
|---|---|
| Project | Bindu (বিন্দু) |
| Purpose | End-to-end encrypted anonymous inbox — share a link, receive whispers, reply with vibes |
| Target User | Teens and young adults; group-chat-native; want honest, anonymous feedback without the trauma of NGL/Sendit |
| Key Value | The server literally cannot read your messages. Hashed sender IDs let you block without de-anonymizing. |
| Status | 🔄 Phase 0 complete — scaffold deployed |
| Repo | `https://github.com/mahtamun-hoque-fahim/bindu` |
| Live URL | `https://bindu.app` *(pending CF Pages deploy)* |
| Prior code | `pre-pivot-archive` branch |

---

## Architecture

**Stack:**

- Framework: Next.js 16.2.6 App Router (TypeScript)
- Styling: Tailwind CSS v4 + CSS variables (three themes)
- Database: Neon (PostgreSQL) via Drizzle ORM 0.45.2
- Auth: Custom passphrase-based — no email, no OAuth. bcryptjs for passphrase hashing.
- Crypto: WebCrypto API (browser-native). No libsodium, no external crypto deps.
- Rate limiting: Upstash Redis (`@upstash/ratelimit` + `@upstash/redis`)
- Deployment: **Cloudflare Pages (primary)** via `@opennextjs/cloudflare`

**Cloudflare edge constraints (enforced everywhere):**

- All API routes and pages: `export const runtime = 'edge'`
- NEVER use `@node-rs/bcrypt` — WASM too large for CF worker. Use `bcryptjs`.
- NEVER use Node-only APIs (`fs`, `Buffer`, etc.). For base64 use `btoa`/`atob` helpers in `lib/utils.ts`.
- `getDb()` is lazy — returns `null` when `DATABASE_URL` is absent (build time).
- WebCrypto (`crypto.subtle`) is available on the edge — used both server-side (passphrase hashing helpers if needed) and client-side (all E2E crypto).

**Folder structure:**

```
/
├── app/
│   ├── (auth)/                 # sign-in, sign-up, recovery
│   ├── (dashboard)/            # /dashboard — recipient inbox
│   ├── (staff)/                # /staff — moderation queue
│   ├── (admin)/                # /admin — platform ops
│   ├── u/[username]/           # public anonymous send page
│   ├── api/
│   │   ├── auth/{sign-in,sign-up,sign-out}/
│   │   ├── messages/           # POST send, GET inbox, PATCH read/fav
│   │   ├── messages/[id]/      # DELETE, PATCH
│   │   ├── messages/flag/      # POST flag with re-submitted plaintext
│   │   ├── reactions/          # POST mood reaction
│   │   ├── mutes/              # POST mute hash, DELETE unmute
│   │   ├── user/               # PATCH theme, passphrase rotation
│   │   ├── pubkey/[username]/  # GET recipient pub key (for sender)
│   │   ├── staff/flags/        # GET queue, PATCH resolve/dismiss
│   │   └── admin/              # stats, users CRUD, ip bans
│   ├── globals.css             # three theme tokens + base styles
│   ├── layout.tsx
│   ├── page.tsx                # landing
│   └── not-found.tsx
├── components/
│   ├── landing/                # Hero, Features, Privacy, FAQ, etc.
│   ├── send/                   # public SendForm
│   ├── dashboard/              # Inbox, MessageReader, Settings, ShareCard
│   ├── staff/                  # FlagQueue, FlagDetail
│   ├── admin/                  # UsersTable, StatsCards, BannedIps
│   └── ui/                     # primitives (Button, Bubble, Chip, Stat, Panel)
├── lib/
│   ├── db/                     # index.ts (lazy edge client) + schema.ts
│   ├── crypto/                 # WebCrypto wrappers — keypair, hybrid encrypt, KDF, hash
│   ├── session.ts              # cookie session w/ HS256 (edge)
│   ├── safety-filter.ts        # client-side word filter
│   ├── rate-limit.ts           # Upstash ratelimiter (lazy)
│   ├── env.ts                  # lazy env access
│   └── utils.ts                # cn, timeAgo, base64
├── middleware.ts               # edge route protection (Phase 3+)
├── drizzle.config.ts
├── open-next.config.ts         # CF Pages adapter
├── wrangler.jsonc
├── next.config.ts
└── tsconfig.json
```

---

## User Flows

### Flow 1: Sender (no account)

1. Visits `/u/[username]`
2. Browser fetches `/api/pubkey/[username]` → recipient's public JWK
3. Browser generates a stable `senderDeviceId` (random 32 bytes in localStorage if not present)
4. Browser computes `senderHash = SHA-256(senderDeviceId || recipientId).slice(0,4)` → `#f3a9`
5. Sender composes message (≤200 chars free, 500 paid), picks mood emoji
6. Browser generates ephemeral ECDH keypair, derives shared secret with recipient's pubKey, AES-GCM encrypts
7. POST `/api/messages` with `{ recipientId, ciphertext, iv, ephemeralPubKey, mood, senderHash }`
8. Server: check IP ban → rate limit (5/10 min) → check muted hashes → insert
9. Success screen: "Sent. No trace."

### Flow 2: Recipient — signup + first message

1. Visits `/sign-up`, picks username, generates passphrase (or types own)
2. Browser: `crypto.subtle.generateKey({ECDH P-256})` → `{publicKey, privateKey}`
3. Browser: PBKDF2(passphrase, salt, 600k) → KEK
4. Browser: AES-GCM-wrap `privateKey` JWK with KEK → `{ciphertext, iv, salt}`
5. POST `/api/auth/sign-up` with `{username, passphraseHash, pubKey, encPrivKey}`
6. Server stores all four — never sees plaintext passphrase or unwrapped privkey
7. Session cookie set; redirect to `/dashboard`
8. IndexedDB caches the unwrapped privateKey for the session

### Flow 3: Recipient — read inbox

1. Loads `/dashboard` (server-rendered shell only — message list arrives via client fetch)
2. Browser unwraps `encPrivKey` with stored session KEK (or prompts for passphrase if KEK expired)
3. Fetches `/api/messages` → list of `{id, ciphertext, iv, ephemeralPubKey, mood, senderHash, ...}`
4. For each message: ECDH(privateKey, ephemeralPubKey) → shared secret → AES decrypt → plaintext
5. Client-side safety filter scans for slurs/doxxing/self-harm patterns → flags visually
6. Renders three-pane: inbox list (filterable: all/new/fav/⚠) → reader → sidebar (mood-week, top hashes, Bindu+ upsell)
7. Mood reactions (POST `/api/reactions`), favorite, mute hash, story export — all client-driven

### Flow 4: Flag / report

1. Recipient hits ⚠ on a message they've already decrypted
2. Browser POSTs `/api/messages/flag` with `{messageId, reportedPlaintext, reason, note?}` (recipient is voluntarily sharing the plaintext they already have)
3. Server creates `flags` row → message marked `isFlagged`
4. Staff sees it in `/staff` queue with the plaintext the reporter shared
5. Staff resolves (`flags.status` → `resolved` | `dismissed`) and optionally soft-deletes the message

### Flow 5: Staff (isStaff = true)

1. Signs in normally, `/staff` route now visible
2. Queue: flagged messages sorted by reason severity (self_harm > doxxing > harassment > spam > inappropriate > other)
3. Each row: hashed sender, reported plaintext, reporter's note, reason
4. Actions: dismiss flag, resolve+delete message, ban sender hash globally, escalate (notify recipient with resources)

### Flow 6: Admin (isAdmin = true)

1. Signs in normally, `/admin` route now visible
2. Stats: DAU, message volume, flag volume, plan distribution
3. Users: search, ban/unban, delete, promote to staff/admin
4. Banned IPs: list, add, remove
5. Audit log: every admin/staff action

---

## DB Schema

> Drizzle / PostgreSQL. UUIDs everywhere. JSONB for JWK key material.

**Tables (v1):**

```ts
users             // username, passphraseHash, pubKey (JWK), encPrivKey (wrapped),
                  // displayName, bio, theme, plan, isStaff, isAdmin, isBanned, createdAt
messages          // recipientId, ciphertext, iv, ephemeralPubKey (JWK), mood,
                  // senderHash, isRead, isFavorited, isFlagged, isDeleted, deletedBy, createdAt
muted_hashes      // (userId, senderHash) — composite PK, recipient blocks repeat sender
reactions         // messageId, emoji — unique per (messageId, emoji); user reacting is implied
flags             // messageId, reporterId, reportedPlaintext, reason, note, status,
                  // resolvedBy, resolvedAt, resolverNote
banned_ips        // ip, reason, bannedBy
audit_log         // actorId, action, targetType, targetId, metadata (jsonb)
```

**Tables (v2, schema-ready):**

```ts
groups            // ownerId, slug, name, pubKey (JWK)
group_members    // groupId, userId, encGroupPrivKey (wrapped to member pubkey)
subscriptions    // userId, plan, startedAt, expiresAt, externalId
```

**Enums:** `theme` (sunset|acid|dream), `plan` (free|plus), `flag_reason` (harassment|doxxing|self_harm|spam|inappropriate|other), `flag_status` (pending|escalated|resolved|dismissed)

Full Drizzle definitions live in `lib/db/schema.ts`.

---

## API Routes

> All routes use `export const runtime = 'edge'`.

### Public (no auth)

| Method | Path | Description |
|---|---|---|
| GET | `/api/pubkey/[username]` | Returns `{pubKey, recipientId}` for the sender to encrypt against |
| POST | `/api/messages` | Send anon message. IP ban → rate limit → mute check → insert |
| POST | `/api/auth/sign-up` | `{username, passphraseHash, pubKey, encPrivKey}` → session cookie |
| POST | `/api/auth/sign-in` | `{username, passphraseHash}` → session cookie |
| POST | `/api/auth/sign-out` | Clears session cookie |

### Recipient (session required)

| Method | Path | Description |
|---|---|---|
| GET | `/api/messages` | Inbox. Returns ciphertext + metadata. Decryption client-side. |
| PATCH | `/api/messages/[id]` | `{isRead?, isFavorited?}` |
| DELETE | `/api/messages/[id]` | Soft delete (recipient-set deletedBy='recipient') |
| POST | `/api/messages/flag` | `{messageId, reportedPlaintext, reason, note?}` |
| POST | `/api/reactions` | `{messageId, emoji}` |
| DELETE | `/api/reactions/[id]` | Remove reaction |
| POST | `/api/mutes` | `{senderHash}` |
| DELETE | `/api/mutes/[hash]` | Unmute |
| GET | `/api/user/me` | Current user info |
| PATCH | `/api/user/me` | `{theme?, displayName?, bio?}` |
| POST | `/api/user/rotate-passphrase` | Re-wrap encPrivKey with new KEK derived from new passphrase |

### Staff (isStaff=true)

| Method | Path | Description |
|---|---|---|
| GET | `/api/staff/flags` | `?status=pending\|resolved\|...` |
| PATCH | `/api/staff/flags/[id]` | `{status, resolverNote?, deleteMessage?}` |

### Admin (isAdmin=true)

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/stats` | Platform stats (DAU, messages/day, flag volume, plan dist) |
| GET | `/api/admin/users` | `?page=&search=&filter=` — paginated 25/page |
| PATCH | `/api/admin/users/[id]` | `{isStaff?, isAdmin?, isBanned?, bannedReason?}` |
| DELETE | `/api/admin/users/[id]` | Hard delete + cascade |
| GET | `/api/admin/banned-ips` | List |
| POST | `/api/admin/banned-ips` | Add |
| DELETE | `/api/admin/banned-ips/[id]` | Remove |
| GET | `/api/admin/audit-log` | Append-only action log |

---

## Env Vars

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon pooled connection (app runtime) |
| `DATABASE_URL_UNPOOLED` | ✅ (migrations only) | Neon direct connection (drizzle-kit) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public base URL |
| `SESSION_SECRET` | ✅ | HMAC key for signing session cookies (32 bytes) |
| `UPSTASH_REDIS_REST_URL` | ✅ | Upstash REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | Upstash auth token |

---

## Phases & Timeline

| Phase | Name | Status | Key Tasks |
|---|---|---|---|
| 0 | Scaffold | ✅ | Next 16, Drizzle schema, theme tokens, CF Pages config, lazy DB, env shape |
| 1 | Landing + design system | ⏳ | Port all sections from prototype, theme switcher, live demo widget |
| 2 | Crypto core | ⏳ | `lib/crypto/` — keypair, hybrid encrypt/decrypt, PBKDF2 KDF, sender-hash derivation, browser-side test page |
| 3 | Auth | ⏳ | Passphrase signup/signin, session cookies, middleware route guards, IndexedDB key cache |
| 4 | Send flow | ⏳ | `/u/[username]`, pubkey fetch, encrypt-in-browser, POST `/api/messages`, IP ban + rate limit |
| 5 | Recipient inbox | ⏳ | 3-pane dashboard, decrypt-in-browser, mood reactions, mute by hash, on-device safety filter |
| 6 | Story export | ⏳ | Render message to 1080×1920 PNG via canvas |
| 7 | Settings | ⏳ | Theme picker, passphrase rotation, blocked-hashes list, recovery info |
| 8 | Staff dashboard | ⏳ | Flag queue, resolve/dismiss, escalation |
| 9 | Admin dashboard | ⏳ | Stats, users CRUD, banned IPs CRUD, audit log |
| v2 | Group dots | ⏳ | Shared-key groups, member key wrapping |
| v2 | Bindu+ | ⏳ | Stripe wiring, feature gates (200→500 chars, custom emoji) |

---

## Next Steps

> Phase 1 — landing page and design system.

1. [ ] Port `sections.jsx` to TSX components in `components/landing/`
2. [ ] Build `<TopNav>` with working dark-mode toggle (client component, persists to localStorage)
3. [ ] Build `<Hero>` with three layouts (A center, B split, C phone) — start with A as default
4. [ ] Build `<LiveDemo>` send widget — mock (no backend yet), shows the encrypt-send-success arc
5. [ ] Build `<HowItWorks>`, `<Features>` (bento), `<Privacy>` (4 pillars on dark), `<FAQ>`
6. [ ] Build `<DashboardsPreview>` — three tiles linking to /dashboard, /staff, /admin (which are still 404 until Phase 5/8/9)
7. [ ] Build `<FinalCTA>` and `<Footer>`
8. [ ] Theme switcher (sunset / acid / dream) — client component, persists to localStorage, applies `.theme-*` class to body
9. [ ] Visual audit + responsive pass at 375 / 768 / 1280 / 1440

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
