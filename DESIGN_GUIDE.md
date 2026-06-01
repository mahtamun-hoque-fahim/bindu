# DESIGN_GUIDE.md — Bindu

> Living design system reference. Updated when new components or tokens are added.
> Last updated: 2026-06-01

---

## Theme system overview

Bindu ships **three named themes**, each light-first with a `.dark` modifier. Themes are applied by class on `<body>`: `theme-sunset` (default), `theme-acid`, `theme-dream`. Dark mode adds the `dark` class alongside.

Every token below is set per-theme as a CSS custom property. Components read tokens, never hard-coded colors. The `ThemeProvider` (`components/providers/ThemeProvider.tsx`) is a Client Component that persists choices to `localStorage` (`bindu:theme`, `bindu:dark`).

| Theme | Vibe | Accent | Display font | Radius |
|---|---|---|---|---|
| **sunset** *(default)* | Warm cream, coral, friendly | `#E85D3B` | Bricolage Grotesque | `22px` |
| **acid** | Brutalist, high-contrast, lime | `#CCFF00` | Space Grotesk | `6px` |
| **dream** | Soft, romantic, lavender | `#B47AE0` | Instrument Serif | `30px` |

The recipient's chosen theme cascades to the public `/u/[username]` send page automatically — senders see the recipient's space, not the brand default.

---

## Color Tokens (per theme)

### Sunset (default)

| Token | CSS Var | Light | Dark |
|---|---|---|---|
| Background | `--bg` | `#FBF5EC` | `#1A140F` |
| Surface | `--bg-2` | `#F5EAD8` | `#221A14` |
| Ink (text) | `--ink` | `#1A1410` | `#FBF5EC` |
| Ink muted | `--ink-2` | `#514237` | `#C9B9A5` |
| Line | `--line` | `#1A141022` | `#FBF5EC22` |
| Accent | `--accent` | `#E85D3B` (coral) | same |
| Accent 2 | `--accent-2` | `#F2A23C` (tangerine) | same |
| Accent 3 | `--accent-3` | `#2A4D8E` (deep blue) | same |
| Bubble | `--bubble` | `#FFFFFF` | `#2A2018` |
| Bubble them | `--bubble-them` | `#FFD9C9` | `#3A2A20` |
| Bubble you | `--bubble-you` | `#1A1410` | `#E85D3B` |
| Bubble you-ink | `--bubble-you-ink` | `#FBF5EC` | `#1A140F` |

### Acid

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#F2F0EA` | `#0A0A0A` |
| `--bg-2` | `#E5E2D8` | `#14140F` |
| `--ink` | `#0A0A0A` | `#F2F0EA` |
| `--ink-2` | `#4A4A48` | `#999998` |
| `--accent` | `#CCFF00` (acid lime) | same |
| `--accent-2` | `#FF3366` (hot pink) | same |
| `--accent-3` | `#0A0A0A` | same |

### Dream

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#F4ECF6` | `#1E1428` |
| `--bg-2` | `#E9D9EE` | `#2A1A36` |
| `--ink` | `#2A1A36` | `#F4ECF6` |
| `--ink-2` | `#5D4A6A` | `#C9B5D5` |
| `--accent` | `#B47AE0` (lavender) | same |
| `--accent-2` | `#F5A8C9` (blush) | same |
| `--accent-3` | `#95D5C5` (mint) | same |

---

## Typography

| Theme | Display / Sans | Mono |
|---|---|---|
| sunset | Bricolage Grotesque | IBM Plex Mono |
| acid | Space Grotesk | JetBrains Mono |
| dream | Instrument Serif (display), Geist (sans) | Geist Mono |

All loaded from Google Fonts in `app/layout.tsx`. Read fonts via `var(--font-display)`, `var(--font-sans)`, `var(--font-mono)` — never hard-code family names.

**Scale (across themes):**

| Name | Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| `hero` | `clamp(44px, 9vw, 120px)` | 0.96 | 700 | Landing hero headline |
| `h1` | `clamp(38px, 5vw, 64px)` | 1.0 | 700 | Section heading |
| `h2` | `26–30px` | 1.05 | 600 | Card heading |
| `h3` | `22–24px` | 1.1 | 600 | Sub-heading |
| `body` | `16px` | 1.5 | 400 | Default text |
| `small` | `14px` | 1.45 | 400 | Captions |
| `eyebrow` | `12px` mono uppercase, `0.08em` track | 1 | 400 | Section labels (`● like this`) |

Negative letter-spacing on display sizes: `-0.025em` to `-0.04em`. Italics in display are highlight colour: `<em style={{color: 'var(--accent)'}}>`.

---

## Spacing

Container max width: `1240px`. Container side padding: `32px` desktop, `20px` mobile.

| Token | Px | Usage |
|---|---|---|
| `4` | 4 | icon ↔ label tight |
| `8` | 8 | chip padding |
| `12` | 12 | row gap |
| `18` | 18 | bubble inner padding |
| `22` | 22 | panel inner padding |
| `28` | 28 | card padding |
| `40` | 40 | grid gap large |
| `48–60` | | section gap small |
| `96` | 96 | section padding (desktop) |
| `64` | 64 | section padding (mobile, `≤720px`) |

---

## Border Radius

Per theme. Read `var(--radius)` and `var(--radius-lg)`:

| Theme | `--radius` | `--radius-lg` |
|---|---|---|
| sunset | 22px | 36px |
| acid | 6px | 10px |
| dream | 30px | 50px |

Pills always `99px`. Avatars/dots always `50%`.

---

## Shadows

```
shadow-card:  0 1px 0 var(--line)
shadow-lift:  0 8px 24px -8px var(--ink)         /* button hover */
shadow-modal: 0 20px 60px -30px var(--ink)       /* live demo, story modal */
```

---

## Base primitives (in `globals.css`)

### `.btn`

```html
<a class="btn">Default — inverse (ink on bg)</a>
<a class="btn ghost">Ghost — transparent border</a>
<a class="btn accent">Accent — uses theme accent</a>
```

14×22 padding, weight 600, `var(--radius)`. Hover lifts `-2px` + `shadow-lift`.

### `.bubble`

```html
<div class="bubble">Generic</div>
<div class="bubble them">From sender — themed bg, tail-left</div>
<div class="bubble you">From recipient — ink bg, tail-right</div>
```

Max-width 320px, padding `14px 18px`, lines 1.4. Used in landing LiveDemo and in the send-flow success state.

### `.eyebrow`

Small mono uppercase label, used to introduce every section:

```html
<p class="eyebrow">● how it works</p>
```

The leading `●` dot is part of the eyebrow content, not a generated marker.

### `.dot` / `.dot-accent`

```html
<span class="dot dot-accent" />   <!-- accent-coloured dot -->
```

`0.7em × 0.7em`, `currentColor` background unless `dot-accent` overrides.

### `.float-dot` and `.pulse`

Decorative animation classes. `float-dot` uses 6s ease-in-out vertical bob, `pulse` is a 2s shadow ring. Used on hero decorations and send-confirmation animations.

### `.no-bar`

Hides scrollbars on inner panels (`-webkit-scrollbar: none` + `scrollbar-width: none`).

### `@keyframes spin`

For the small spinning indicator used in the sign-up username check.

---

## Landing page composition

The landing page is a stack of Server Components in `components/landing/`:

1. **TopNav** (Client) — theme picker (3 swatches) + dark toggle + Get-link CTA
2. **Hero** — `clamp(44px, 9vw, 120px)` headline, floating decorative dots, embedded LiveDemo widget
3. **Logos** — italicized group-chat names as social proof
4. **HowItWorks** — 4 step cards on `var(--bg-2)`
5. **Features** — bento grid (4 small + 2 big cards with custom visuals: `LinkVisual`, `MuteVisual`)
6. **Privacy** — 4 pillars on inverted dark background (`--ink` bg, `--bg` text)
7. **DashboardsPreview** — 3 role tiles linking to dashboard/staff/admin
8. **FAQ** — 6 questions, single-open accordion
9. **FinalCTA** — large terminal headline with username input that pre-fills `/sign-up`
10. **Footer** — 4-column nav + status line

Responsive collapse (`globals.css`):

- `≤900px`: hide nav middle links, stack feature grid to 1col
- `≤720px`: stack Privacy columns, collapse Footer to 2cols
- `≤1100px`: hide inbox right panel
- `≤800px`: stack inbox sidebar to horizontal

---

## Inbox primitives (Phase 5)

Defined inline in `app/(dashboard)/dashboard/`:

| Component | Use |
|---|---|
| `Sidebar` | 220px column. Brand mark · copy-link button · filter pills (Inbox, New, Starred, Flagged) with badge counts · staff/admin links if role · lock + sign-out |
| `MessageList` | 360px column. Sticky header, scrollable cards. Each card: mood · `anon · #hash` · unread dot · ★ · ⚠ · timeAgo · 2-line preview. Selected card has left accent bar. Muted senders dim to 50%. |
| `MessageReader` | Flexible center. Header (avatar · `anon · #hash` · received-time · isMuted chip) + actions (★ Favorite · ⊘ Mute · ↗ Export · × Delete). Body: SafetyBanner (warn/hide) · large display-font plaintext · reaction emoji ring · "react privately · only you see this" |
| `RightPanel` | 300px. Share card (`var(--accent)` background, your link + copy/preview) · mood-of-the-week bars · top whisperers list · Bindu+ teaser locked card |
| `UnlockGate` | Full-pane when IndexedDB empty: passphrase field + "Unlock" button |
| `StoryExportModal` | Centered modal: scaled 1080×1920 preview · Share/download button |

---

## Story export card (Phase 6)

1080×1920 PNG rendered by `lib/canvas/story-card.ts`. Layout:

```
┌─────────────────────────────────────┐  ← full-bleed var(--bg)
│  ●  decorative dots scattered       │
│                                     │
│  ●  bindu              (top-left)   │
│                                     │
│                                     │
│   ╭───────────────────────────────╮ │  ← bubble card,
│   │  ●  anon · whispered to you   │ │     var(--bubble), 60r
│   │     #hash                     │ │
│   │  ───────────────────────────  │ │
│   │                               │ │
│   │  🫶 your zine is criminally   │ │  ← adaptive font:
│   │     underrated and your taste │ │     80→64→52→44 px
│   │     in playlists carries me…  │ │
│   │                               │ │
│   │                               │ │
│   │  bindu.app/maya.k             │ │  ← inside card footer
│   ╰───────────────────────────────╯ │
│                                     │
│       ● end-to-end encrypted        │
│   send anonymous whispers @ bindu.app│
└─────────────────────────────────────┘
```

Theme tokens read via `getComputedStyle` of a hidden probe element. Brand mark always present, never strippable. Watermark "send anonymous whispers @ bindu.app" can't be removed by user editing the canvas in the modal (modal shows preview only — actual blob is fresh on each render).

---

## Iconography

Bindu uses a small, friendly icon vocabulary — no icon font, no SVG sprite. Mostly characters:

- `●` — the brand dot motif (everywhere)
- `→` — go-forward
- `↗` — copy / external / story-export
- `★ ☆` — favourite / unfavourite
- `⊘` — mute
- `⚠` — flag / safety
- `×` — close / delete
- `+` — accordion open
- Mood emojis: 🫶 🔥 👀 😭 💀 ✨ 🤝 🥲

Avoid Material/Heroicons — the design intentionally reads like a friend's notebook.

---

## Animation

Default duration `.15–.2s` ease. Hover lifts use `translateY(-2px)` to `-4px`. Section reveals: no scroll-trigger animations in v1 — keep it calm.

Send-flow animations:

- Sending state: `.pulse` (2s box-shadow ring out)
- Sent state: bubble fade-in (passive)

Story export modal: preview fades in as soon as the canvas blob resolves.

---

## Dark Mode

Toggled by adding `dark` to `<body>` alongside the theme class:

```html
<body class="theme-sunset dark">
```

Persists in `localStorage` under `bindu:dark`. Default: light. The dark variant for each theme inverts bg/ink/bubbles but keeps the accent identical.

---

## File map

| File | What lives there |
|---|---|
| `app/globals.css` | All theme tokens + base primitives (.btn, .bubble, .eyebrow, .dot, animations) + responsive layer |
| `app/layout.tsx` | Google Fonts preload, sets default theme on `<body>`, wraps in ThemeProvider |
| `components/providers/ThemeProvider.tsx` | Theme + dark state context, persists to localStorage |
| `components/landing/*.tsx` | 10 landing sections |
| `app/(dashboard)/dashboard/*.tsx` | Inbox UI primitives (Sidebar/List/Reader/RightPanel/UnlockGate/StoryExportModal) |
| `app/u/[username]/SendForm.tsx` | Public composer — three-state UI (compose/sending/sent) |
| `lib/canvas/story-card.ts` | Pure browser renderer for the 1080×1920 PNG |
