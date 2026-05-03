# DESIGN_GUIDE.md — Bindu

> Living design system reference.
> Last updated: 2026-05-03

---

## Color Tokens

| Token | CSS Variable | Hex | Usage |
|---|---|---|---|
| Background | `--bg` | `#0a0a0a` | Page background |
| Surface | `--surface` | `#111111` | Cards, panels, sidebar |
| Surface Elevated | `--surface-elevated` | `#1a1a1a` | Inputs, nested cards |
| Border | `--border` | `#1f1f1f` | Dividers, outlines |
| Accent | `--accent` | `#00e676` | CTAs, active states, links |
| Accent Dim | `--accent-dim` | `rgba(0,230,118,0.08)` | Accent backgrounds, nav active fill |
| Text | `--text` | `#f5f5f5` | Primary body text |
| Text Muted | `--text-muted` | `#888888` | Labels, captions, nav items |
| Text Disabled | `--text-disabled` | `#444444` | Disabled states, watermarks |
| Destructive | `--destructive` | `#ff4444` | Errors, delete actions, banned states |
| Warning | `--warning` | `#ffaa00` | Flag actions, rate limit, spam badges |

---

## Typography

**Font Stack:**
- Headings: `Syne` — weights 400, 600, 700 (CSS var: `--font-syne`)
- Body: `Onest` — weights 400, 500, 600 (CSS var: `--font-onest`)

Both loaded via `next/font/google` in root layout. Applied as CSS variables on `<html>`.

**Scale (used in practice):**

| Usage | Size | Weight | Font |
|---|---|---|---|
| Hero heading | `text-5xl` (48px) | 700 | Syne |
| Page title (h1) | `text-2xl` (24px) | 700 | Syne |
| Section heading (h2) | `text-sm` + semibold | 600 | Syne |
| Body | `text-sm` (14px) | 400 | Onest |
| Label / caption | `text-xs` (12px) | 400–500 | Onest |
| Monospace (URLs, usernames) | `font-mono` system | 400 | System mono |

---

## Spacing

Tailwind defaults. Common patterns in this project:

- Page padding: `px-6 py-10`
- Card padding: `p-4` or `p-5`
- Input padding: `px-3 py-2.5`
- Gap between form fields: `gap-3`
- Section gap: `mb-8`
- Nav padding: `px-5 py-6`

---

## Border Radius

| Usage | Class |
|---|---|
| Buttons, inputs | `rounded` or `rounded-md` |
| Cards, panels | `rounded-lg` |
| Send form, modals | `rounded-xl` |
| Avatars, pills, unread dot | `rounded-full` |
| Badges, tags | `rounded` or `rounded-full` |

---

## Shadows

| Name | Value | Usage |
|---|---|---|
| Accent glow | `0 0 24px rgba(0,230,118,0.15)` | Primary CTA button |
| Card elevation | `0 4px 16px rgba(0,0,0,0.5)` | Send form card |
| Modal overlay | `0 8px 40px rgba(0,0,0,0.6)` | FlagModal |

---

## Component Patterns

### Button — Primary (accent)
```tsx
<button
  className="font-semibold text-sm px-5 py-2 rounded transition-all active:scale-95"
  style={{ background: 'var(--accent)', color: '#000', boxShadow: '0 0 20px rgba(0,230,118,0.15)' }}
>
  Label →
</button>
```

### Button — Destructive
```tsx
<button
  className="text-xs px-2.5 py-1 rounded transition-colors"
  style={{ color: 'var(--destructive)' }}
  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,68,68,0.1)'}
  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
>
  Delete
</button>
```

### Button — Ghost (muted)
```tsx
<button
  className="text-sm px-3 py-2 rounded transition-colors"
  style={{ color: 'var(--text-muted)' }}
  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-elevated)'; e.currentTarget.style.color = 'var(--text)' }}
  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
>
  Label
</button>
```

### Input / Textarea
```tsx
<input
  className="w-full rounded-md px-3 py-2.5 text-sm outline-none transition-colors"
  style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)', color: 'var(--text)' }}
  onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
/>
```

### Card
```tsx
<div
  className="rounded-lg p-5"
  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
>
```

### Badge — Accent
```tsx
<span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
  label
</span>
```

### Badge — Destructive
```tsx
<span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(255,68,68,0.1)', color: 'var(--destructive)' }}>
  banned
</span>
```

### Badge — Warning
```tsx
<span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(255,170,0,0.12)', color: 'var(--warning)' }}>
  spam
</span>
```

### Avatar (initial-based)
```tsx
<div
  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
  style={{ background: 'var(--accent-dim)', border: '1px solid rgba(0,230,118,0.2)', color: 'var(--accent)', fontFamily: 'var(--font-syne)' }}
>
  {name.charAt(0).toUpperCase()}
</div>
```

### Unread Dot
```tsx
<span className="absolute top-4 right-4 w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
```

### Nav Item (sidebar)
```tsx
<Link
  href={href}
  className="text-sm px-3 py-2 rounded transition-colors"
  style={{
    color: isActive ? 'var(--accent)' : 'var(--text-muted)',
    background: isActive ? 'var(--accent-dim)' : 'transparent',
  }}
>
```

### Modal Backdrop
```tsx
<div
  className="fixed inset-0 z-50 flex items-center justify-center px-4"
  style={{ background: 'rgba(0,0,0,0.7)' }}
  onClick={(e) => e.target === e.currentTarget && onClose()}
>
  <div className="w-full max-w-sm rounded-xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}>
```

### Toggle (boolean switch)
```tsx
<button
  onClick={toggle}
  className="relative w-10 h-5 rounded-full transition-colors"
  style={{ background: value ? 'var(--accent)' : 'var(--surface-elevated)', border: '1px solid var(--border)' }}
>
  <span className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
    style={{ background: value ? '#000' : 'var(--text-disabled)', left: value ? '20px' : '2px' }} />
</button>
```

### Google OAuth Button
```tsx
<button className="w-full flex items-center justify-center gap-3 text-sm font-medium py-2.5 rounded-md"
  style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)', color: 'var(--text)' }}
>
  <GoogleIcon /> Continue with Google
</button>
```

---

## Animations / Transitions

| Usage | Class |
|---|---|
| Hover color changes | `transition-colors` |
| Opacity hover | `transition-opacity hover:opacity-80` |
| Button press | `active:scale-95 transition-all` |
| Group reveal (message actions) | `opacity-0 group-hover:opacity-100 transition-opacity` |

No heavy animations. Motion is minimal and purposeful.

---

## Dark Mode Notes

- Dark-first. No light mode.
- Background layers: `#0a0a0a` → `#111111` → `#1a1a1a`
- Never pure white. Max text brightness: `#f5f5f5`
- Accent `#00e676` only on dark backgrounds
- Scrollbar styled: 6px width, `var(--border)` thumb, `var(--bg)` track
