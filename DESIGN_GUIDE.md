# DESIGN_GUIDE.md — Bindu

> Living design system reference. Updated when new components or tokens are added.
> Last updated: 2026-05-31

---

## Theme system overview

Bindu ships **three named themes**, each light-first with a `.dark` modifier. Themes are applied by class on `<body>`: `theme-sunset` (default), `theme-acid`, `theme-dream`. Dark mode adds the `dark` class alongside.

Every token below is set per-theme as a CSS custom property. Components read tokens, never hard-coded colors.

| Theme | Vibe | Accent | Display font | Radius |
|---|---|---|---|---|
| **sunset** *(default)* | Warm cream, coral, friendly | `#E85D3B` | Bricolage Grotesque | `22px` |
| **acid** | Brutalist, high-contrast, lime | `#CCFF00` | Space Grotesk | `6px` |
| **dream** | Soft, romantic, lavender | `#B47AE0` | Instrument Serif | `30px` |

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
| `hero` | `clamp(44px, 6vw + 12px, 120px)` | 0.96 | 700 | Hero headline |
| `h1` | `clamp(38px, 5vw, 64px)` | 1.0 | 700 | Section heading |
| `h2` | `26–30px` | 1.05 | 600 | Card heading |
| `h3` | `22–24px` | 1.1 | 600 | Sub-heading |
| `body` | `16px` | 1.5 | 400 | Default text |
| `small` | `14px` | 1.45 | 400 | Captions |
| `eyebrow` | `12px` mono uppercase, `0.08em` track | 1 | 400 | Section labels (`● like this`) |

Negative letter-spacing on display sizes: `-0.025em` to `-0.04em`. Italics in display are highlight colour: `<em style={{color: 'var(--accent)'}}>`.

---

## Spacing

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

Container max width: `1240px`. Container side padding: `32px` desktop, `20px` mobile.

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

```css
shadow-card: 0 1px 0 var(--line);
shadow-lift: 0 8px 24px -8px var(--ink);                 /* btn hover */
shadow-modal: 0 20px 60px -30px var(--ink);              /* live demo, modals */
shadow-phone: 0 40px 80px -40px var(--ink);              /* phone mock */
```

---

## Components

### `.btn`

```html
<a class="btn">Default — inverse (ink on bg)</a>
<a class="btn ghost">Ghost — transparent border</a>
<a class="btn accent">Accent — uses theme accent</a>
```

Defined in `globals.css`. 14×22 padding, weight 600, `var(--radius)`. Hover lifts `-2px` and adds `shadow-lift`.

### `.bubble`

Chat bubble — three variants:

```html
<div class="bubble">Generic</div>
<div class="bubble them">From sender — themed bg, tail-left</div>
<div class="bubble you">From recipient — ink bg, tail-right</div>
```

Max-width 320px, padding `14px 18px`. Lines 1.4.

### `.eyebrow`

Small mono uppercase label, used to introduce every section:

```html
<p class="eyebrow">● how it works</p>
```

The leading `●` dot is part of the eyebrow content, not a generated marker.

### `.dot`

```html
<span class="dot dot-accent" />   // accent-coloured dot
```

`0.7em × 0.7em`, `currentColor` background unless `dot-accent` overrides.

### `.float-dot` and `.pulse`

Decorative animation classes. `float-dot` uses 6s ease-in-out, `pulse` is a 2s shadow ring. Used on hero decorations and the send-confirmation animation.

### `.no-bar`

Hides scrollbars on inner panels (`-webkit-scrollbar: none` + `scrollbar-width: none`).

---

## Dashboard primitives

Defined in dashboard scope, not `globals.css` yet (will be added when Phase 5 lands).

| Class | Use |
|---|---|
| `.dash` | Grid: 240px sidebar + 1fr main |
| `.dash-side` | Sidebar — sticky, full height, bg-2 |
| `.dash-link` | Nav item — pill on hover/active |
| `.dash-link.active` | Active state — bg, border, weight 600 |
| `.dash-top` | Sticky header bar with backdrop-blur |
| `.dash-content` | Main scroll container, 28×32 padding |
| `.stat` | KPI card — label / value / delta |
| `.chip` | Pill: default, `.danger`, `.warn`, `.ok`, `.info` |
| `.panel` | Card with `.panel-head` and `.panel-body` |
| `.tbl` | Table with mono-uppercase headers |

---

## Animation

Default duration `.15–.2s` ease. Hover lifts use `translateY(-2px)` to `-4px`. Section reveals: no scroll-trigger animations in v1 — keep it calm.

---

## Iconography

Bindu uses a small, friendly icon vocabulary — no icon font, no SVG sprite. Mostly characters:

- `●` — the brand dot motif (everywhere)
- `→` — go-forward
- `↗` — copy / external
- `★ ☆` — favourite / unfavourite
- `⌕` — search
- `⌘K` — keyboard hint
- `⊘` — mute
- `⚠` — flag
- Mood emojis: 🫶 🔥 👀 😭 💀 ✨ 🤝 🥲

Avoid Material/Heroicons — the design intentionally reads like a friend's notebook.

---

## Responsive

- Mobile-first only for spacing (sections `64px` padding `≤720px`).
- Hero headlines use `clamp()` so they scale without breakpoints.
- Dashboards collapse `.dash` to single column `<900px`; sidebar becomes horizontal nav.
- Bento `Features` grid stays 3-col `≥1100px`, falls to 1-col `<700px`.

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
| `app/globals.css` | All theme tokens + base primitives (.btn, .bubble, .eyebrow, .dot, animations) |
| `app/layout.tsx` | Google Fonts preload, sets default theme on `<body>` |
| `components/ui/` | Reusable primitives (Phase 1+) |
| `components/landing/` | Landing page sections (Phase 1) |
| `components/dashboard/`, `components/staff/`, `components/admin/` | Role-specific UI (Phase 5/8/9) |
