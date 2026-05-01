# DESIGN_GUIDE.md — Bindu

> Living design system reference. Updated when new components or tokens are added.
> Last updated: 2026-04-29

---

## Color Tokens

| Token | CSS Variable | Hex | Usage |
|---|---|---|---|
| Background | `--bg` | `#0a0a0a` | Page background |
| Surface | `--surface` | `#111111` | Cards, send form, message cards |
| Surface Elevated | `--surface-elevated` | `#1a1a1a` | Hover states, nested panels |
| Border | `--border` | `#1f1f1f` | Dividers, input outlines, card borders |
| Accent | `--accent` | `#00e676` | Send button, active states, unread dot |
| Accent Dim | `--accent-dim` | `#00e67615` | Accent background fills, hover |
| Text Primary | `--text` | `#f5f5f5` | Body text, message content |
| Text Muted | `--text-muted` | `#888888` | Timestamps, captions, placeholders |
| Text Disabled | `--text-disabled` | `#444444` | Disabled inputs |
| Destructive | `--destructive` | `#ff4444` | Delete button, error states |
| Success | `--success` | `#00e676` | Message sent confirmation |
| Warning | `--warning` | `#ffaa00` | Rate limit warning |

### globals.css

```css
:root {
  --bg: #0a0a0a;
  --surface: #111111;
  --surface-elevated: #1a1a1a;
  --border: #1f1f1f;
  --accent: #00e676;
  --accent-dim: #00e67615;
  --text: #f5f5f5;
  --text-muted: #888888;
  --text-disabled: #444444;
  --destructive: #ff4444;
  --success: #00e676;
  --warning: #ffaa00;
}

body {
  background-color: var(--bg);
  color: var(--text);
}
```

---

## Typography

**Font Stack:**
- Headings: `Syne` — weights 600, 700
- Body: `Onest` — weights 400, 500
- Mono: `JetBrains Mono` — weight 400

**Scale:**

| Name | Size | Line Height | Weight | Font | Usage |
|---|---|---|---|---|---|
| `display` | 3rem (48px) | 1.1 | 700 | Syne | Landing hero |
| `h1` | 2rem (32px) | 1.2 | 700 | Syne | Page title (send page, dashboard) |
| `h2` | 1.5rem (24px) | 1.25 | 600 | Syne | Section headings |
| `h3` | 1.125rem (18px) | 1.3 | 600 | Syne | Card headings |
| `body` | 1rem (16px) | 1.6 | 400 | Onest | Message content, default text |
| `small` | 0.875rem (14px) | 1.5 | 400 | Onest | Timestamps, labels |
| `xs` | 0.75rem (12px) | 1.4 | 400 | Onest | Badges, character count |
| `mono` | 0.875rem (14px) | 1.6 | 400 | JetBrains Mono | Share link display |

---

## Spacing Scale

Standard Tailwind scale. Key values for this project:

| Token | Value | Usage |
|---|---|---|
| `space-2` | 8px | Icon + label gaps |
| `space-3` | 12px | Compact inner padding |
| `space-4` | 16px | Default card padding |
| `space-6` | 24px | Section padding |
| `space-8` | 32px | Between sections |
| `space-12` | 48px | Page vertical rhythm |
| `space-16` | 64px | Hero spacing |

---

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `rounded-sm` | 4px | Tags, unread dots |
| `rounded` | 6px | Buttons |
| `rounded-md` | 8px | Inputs, message cards |
| `rounded-lg` | 12px | Send form panel, dashboard cards |
| `rounded-xl` | 16px | Send page container |
| `rounded-full` | 9999px | Avatar circle, character count pill |

---

## Shadows

| Name | Value | Usage |
|---|---|---|
| `shadow-sm` | `0 1px 3px rgba(0,0,0,0.4)` | Subtle lift on hover |
| `shadow-md` | `0 4px 16px rgba(0,0,0,0.5)` | Send form panel |
| `shadow-accent` | `0 0 24px rgba(0,230,118,0.12)` | Send button glow |
| `shadow-destructive` | `0 0 16px rgba(255,68,68,0.12)` | Delete button hover |

---

## Component Patterns

### SendForm (core component)

```tsx
// app/u/[username]/SendForm.tsx
// The main anonymous message form
<div className="bg-[--surface] border border-[--border] rounded-xl p-6 shadow-md">
  <textarea
    className="w-full bg-[--surface-elevated] border border-[--border] rounded-md p-3
      text-[--text] placeholder:text-[--text-muted] resize-none
      focus:outline-none focus:border-[--accent] focus:ring-1 focus:ring-[--accent]/30
      transition-colors text-sm leading-relaxed"
    rows={5}
    maxLength={500}
    placeholder="Write something anonymous..."
  />
  {/* Character count */}
  <span className="text-xs text-[--text-muted] font-mono">{count}/500</span>
  {/* Send button */}
  <button className="bg-[--accent] text-black font-semibold px-6 py-2.5 rounded
    hover:opacity-90 active:scale-95 transition-all
    shadow-[0_0_24px_rgba(0,230,118,0.12)]
    disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none">
    Send →
  </button>
</div>
```

### MessageCard (inbox item)

```tsx
// Unread
<div className="bg-[--surface] border border-[--border] rounded-lg p-4
  hover:border-[--accent]/20 transition-colors group relative">
  {/* Unread indicator */}
  <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[--accent]" />
  <p className="text-[--text] text-sm leading-relaxed">{content}</p>
  <span className="text-xs text-[--text-muted] mt-2 block">{timeAgo}</span>
</div>

// Read
<div className="bg-[--surface] border border-[--border] rounded-lg p-4
  hover:border-[--border]/60 transition-colors opacity-70">
  ...
</div>
```

### Button Variants

```tsx
// Primary — Send
<button className="bg-[--accent] text-black font-semibold px-5 py-2.5 rounded
  hover:opacity-90 active:scale-95 transition-all">
  Label
</button>

// Ghost
<button className="border border-[--border] text-[--text-muted] px-4 py-2 rounded
  hover:bg-[--surface-elevated] hover:text-[--text] transition-colors text-sm">
  Label
</button>

// Destructive (icon + text)
<button className="flex items-center gap-1.5 text-[--destructive] text-sm px-3 py-1.5 rounded
  hover:bg-[--destructive]/10 transition-colors opacity-0 group-hover:opacity-100">
  Delete
</button>
```

### Input

```tsx
<input className="bg-[--surface] border border-[--border] text-[--text] rounded-md px-3 py-2 w-full
  placeholder:text-[--text-muted]
  focus:outline-none focus:border-[--accent] focus:ring-1 focus:ring-[--accent]/20
  transition-colors text-sm" />
```

### Unread Badge (dashboard nav)

```tsx
<span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-[--accent] text-black min-w-[18px] text-center">
  {count}
</span>
```

### Share Link Display

```tsx
<div className="flex items-center gap-2 bg-[--surface-elevated] border border-[--border] rounded-md px-3 py-2">
  <span className="font-mono text-sm text-[--text-muted] flex-1 truncate">
    bindu.app/u/fahim
  </span>
  <button className="text-xs text-[--accent] hover:opacity-80 transition-opacity font-medium shrink-0">
    Copy
  </button>
</div>
```

### Success State (after send)

```tsx
<div className="flex flex-col items-center gap-3 py-8">
  <div className="w-12 h-12 rounded-full bg-[--accent-dim] flex items-center justify-center">
    <span className="text-[--accent] text-xl">✓</span>
  </div>
  <p className="text-[--text] font-medium">Message sent!</p>
  <p className="text-sm text-[--text-muted]">They won't know it was you.</p>
  <button className="text-sm text-[--accent] hover:opacity-80 mt-1">Send another</button>
</div>
```

### Empty Inbox State

```tsx
<div className="flex flex-col items-center gap-2 py-16 text-center">
  <p className="text-[--text-muted] text-sm">No messages yet.</p>
  <p className="text-xs text-[--text-disabled]">Share your link to start receiving.</p>
</div>
```

---

## Animations / Transitions

| Usage | Class |
|---|---|
| Default hover/state | `transition-colors duration-150` |
| Opacity transitions | `transition-opacity duration-150` |
| Button press | `active:scale-95 transition-transform duration-75` |
| All properties | `transition-all duration-200` |

Keep motion minimal. No page transitions or heavy animations.

---

## Dark Mode Notes

- Dark-first. No light mode.
- Background layers: `#0a0a0a` → `#111111` → `#1a1a1a`
- Accent `#00e676` is the only color — used for CTA, unread indicator, success state
- Never use pure black `#000000` — use `#0a0a0a` minimum
- All interactive elements show a subtle `--accent` border on focus

---

## Send Page Layout

```
[Full viewport]
  ↓
[Centered column — max-w-md]
  ↓
[Avatar placeholder + "Send [name] an anonymous message"]
[SendForm card]
[Powered by Bindu link]
```

---

## Dashboard Layout

```
[Sidebar — hidden on mobile]
  - Logo
  - Your link (copy button)
  - Inbox (unread count badge)
  - Settings
  - Sign out

[Main area]
  - Inbox heading + message count
  - Message cards list
```
