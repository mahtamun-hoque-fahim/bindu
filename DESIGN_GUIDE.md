# DESIGN_GUIDE.md — Bindu

> Living design system reference. Updated when new components or tokens are added.
> Last updated: 2026-05-06

---

## Color Tokens

| Token | CSS Variable | Value | Usage |
|---|---|---|---|
| Background | `--bg` | `#0a0a0a` | Page background |
| Surface | `--surface` | `#111111` | Cards, panels, sidebar |
| Surface Elevated | `--surface-elevated` | `#1a1a1a` | Inputs, nested cards, table rows |
| Border | `--border` | `#1f1f1f` | Dividers, input outlines, table lines |
| Accent | `--accent` | `#00e676` | CTAs, active nav, links, unread dot |
| Accent Dim | `--accent-dim` | `rgba(0,230,118,0.08)` | Active nav fill, flag radio selected, avatar bg |
| Text | `--text` | `#f5f5f5` | Primary body text |
| Text Muted | `--text-muted` | `#888888` | Labels, captions, secondary nav |
| Text Disabled | `--text-disabled` | `#444444` | Disabled states, watermarks, placeholders |
| Destructive | `--destructive` | `#ff4444` | Errors, delete, banned states, harassment flags |
| Warning | `--warning` | `#ffaa00` | Flag actions, rate limit notices, spam badges |

All defined in `app/globals.css` as `:root` CSS variables. Never hard-code hex values in components — always reference via `var(--token)`.

---

## Typography

**Font Stack:**
- Headings: `Syne` (CSS var: `--font-syne`) — weights 400, 600, 700
- Body: `Onest` (CSS var: `--font-onest`) — weights 400, 500, 600

Both loaded via `next/font/google` in `app/layout.tsx`, applied as CSS variables on `<html>`.

**Scale (as used in the project):**

| Usage | Tailwind | Weight | Font |
|---|---|---|---|
| Hero heading | `text-5xl` | 700 | Syne |
| Page title (h1) | `text-2xl` | 700 | Syne |
| Section heading | `text-sm` + semibold | 600 | Syne |
| Card heading | `text-base` or `text-sm` | 500–600 | Syne |
| Body text | `text-sm` | 400 | Onest |
| Labels, captions | `text-xs` | 400–500 | Onest |
| Monospace (URLs, usernames, counters) | `font-mono` system | 400 | System mono |

---

## Spacing

Tailwind defaults. Common patterns:

| Context | Class |
|---|---|
| Page container | `max-w-2xl mx-auto px-6 py-10` |
| Card padding | `p-4` or `p-5` |
| Card padding (large modal) | `p-6` |
| Input padding | `px-3 py-2.5` |
| Button padding (primary) | `px-5 py-2` or `px-6 py-3` |
| Button padding (small) | `px-2.5 py-1` |
| Form field gap | `gap-3` |
| Section bottom margin | `mb-8` |
| Sidebar padding | `px-5 py-6` |

---

## Border Radius

| Usage | Class |
|---|---|
| Small buttons, badges | `rounded` (6px) |
| Inputs, table wrappers | `rounded-md` (8px) |
| Cards, panels, sidebar | `rounded-lg` (12px) |
| Auth forms, send form, modals | `rounded-xl` (16px) |
| Avatars, pills, unread dot, toggles | `rounded-full` |

---

## Shadows

| Name | Value | Usage |
|---|---|---|
| Accent glow | `0 0 24px rgba(0,230,118,0.15)` | Primary CTA buttons |
| Accent glow (small) | `0 0 20px rgba(0,230,118,0.12)` | Onboarding save button |
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
  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,68,68,0.1)')}
  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
>
  Delete
</button>
```

### Button — Warning (flag actions)
```tsx
<button
  className="text-xs px-2.5 py-1 rounded transition-colors"
  style={{ color: 'var(--warning)' }}
  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,170,0,0.08)')}
  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
>
  Flag
</button>
```

### Button — Ghost (muted)
```tsx
<button
  className="text-sm px-3 py-2 rounded transition-colors"
  style={{ color: 'var(--text-muted)' }}
  onMouseEnter={(e) => {
    e.currentTarget.style.background = 'var(--surface-elevated)'
    e.currentTarget.style.color = 'var(--text)'
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = 'transparent'
    e.currentTarget.style.color = 'var(--text-muted)'
  }}
>
  Label
</button>
```

### Button — Google OAuth
```tsx
<button
  className="w-full flex items-center justify-center gap-3 text-sm font-medium py-2.5 rounded-md transition-opacity"
  style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)', color: 'var(--text)' }}
>
  <GoogleIcon />
  Continue with Google
</button>
```

### Input / Textarea
```tsx
<input
  className="w-full rounded-md px-3 py-2.5 text-sm outline-none transition-colors"
  style={{
    background: 'var(--surface-elevated)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    caretColor: 'var(--accent)',
  }}
  onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
/>
```

### Card
```tsx
<div
  className="rounded-lg p-5"
  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
>
```

### Card — Send Form (elevated)
```tsx
<div
  className="rounded-xl p-6"
  style={{
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
  }}
>
```

### Badge — Accent (unread count, active)
```tsx
<span
  className="text-xs font-semibold px-2 py-0.5 rounded-full min-w-[22px] text-center"
  style={{ background: 'var(--accent)', color: '#000' }}
>
  {count}
</span>
```

### Badge — Muted (status)
```tsx
<span
  className="text-xs px-2 py-0.5 rounded-full font-medium"
  style={{ background: 'var(--surface-elevated)', color: 'var(--text-muted)' }}
>
  active
</span>
```

### Badge — Destructive (banned, harassment)
```tsx
<span
  className="text-xs px-2 py-0.5 rounded-full font-medium"
  style={{ background: 'rgba(255,68,68,0.1)', color: 'var(--destructive)' }}
>
  banned
</span>
```

### Badge — Warning (spam, flag)
```tsx
<span
  className="text-xs px-2 py-0.5 rounded-full font-medium"
  style={{ background: 'rgba(255,170,0,0.12)', color: 'var(--warning)' }}
>
  spam
</span>
```

### Avatar (initial-based)
```tsx
<div
  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
  style={{
    background: 'var(--accent-dim)',
    border: '1px solid rgba(0,230,118,0.2)',
    color: 'var(--accent)',
    fontFamily: 'var(--font-syne)',
  }}
>
  {name.charAt(0).toUpperCase()}
</div>
```

### Unread Dot
```tsx
<span
  className="absolute top-4 right-4 w-2 h-2 rounded-full"
  style={{ background: 'var(--accent)' }}
/>
```

### Nav Item (sidebar / admin nav)
```tsx
<Link
  href={href}
  className="text-sm px-3 py-2 rounded transition-colors"
  style={{
    color: isActive ? 'var(--accent)' : 'var(--text-muted)',
    background: isActive ? 'var(--accent-dim)' : 'transparent',
  }}
>
  {label}
</Link>
```

### Modal Backdrop + Panel
```tsx
<div
  className="fixed inset-0 z-50 flex items-center justify-center px-4"
  style={{ background: 'rgba(0,0,0,0.7)' }}
  onClick={(e) => e.target === e.currentTarget && onClose()}
>
  <div
    className="w-full max-w-sm rounded-xl p-6"
    style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
    }}
  >
```

### Toggle (boolean switch — e.g. email notifications)
```tsx
<button
  onClick={toggle}
  className="relative w-10 h-5 rounded-full transition-colors shrink-0"
  style={{
    background: value ? 'var(--accent)' : 'var(--surface-elevated)',
    border: '1px solid var(--border)',
  }}
>
  <span
    className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
    style={{
      background: value ? '#000' : 'var(--text-disabled)',
      left: value ? '20px' : '2px',
    }}
  />
</button>
```

### Radio Option (FlagModal reason selector)
```tsx
<label
  className="flex items-center gap-3 rounded-md px-3 py-2.5 cursor-pointer transition-colors"
  style={{
    background: selected ? 'var(--accent-dim)' : 'var(--surface-elevated)',
    border: `1px solid ${selected ? 'rgba(0,230,118,0.3)' : 'var(--border)'}`,
  }}
>
  <input type="radio" className="accent-[--accent]" />
  <span style={{ color: selected ? 'var(--accent)' : 'var(--text)' }}>Label</span>
</label>
```

### Admin Stat Card
```tsx
<div
  className="rounded-lg p-4"
  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
>
  <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Label</p>
  <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
    {value}
  </p>
  <p className="text-xs mt-1" style={{ color: 'var(--text-disabled)' }}>sub-label</p>
</div>
```

### Admin Table
```tsx
<div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
  <table className="w-full text-sm">
    <thead>
      <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          Column
        </th>
      </tr>
    </thead>
    <tbody>
      <tr
        style={{ borderBottom: '1px solid var(--border)' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <td className="px-4 py-3">…</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Pagination Controls
```tsx
<div className="flex items-center justify-between mt-4">
  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
    Page {page} of {totalPages}
  </span>
  <div className="flex gap-2">
    <button
      onClick={prevPage}
      disabled={page <= 1}
      className="text-xs px-3 py-1.5 rounded"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        color: page <= 1 ? 'var(--text-disabled)' : 'var(--text-muted)',
      }}
    >
      ← Prev
    </button>
    <button
      onClick={nextPage}
      disabled={page >= totalPages}
      className="text-xs px-3 py-1.5 rounded"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        color: page >= totalPages ? 'var(--text-disabled)' : 'var(--text-muted)',
      }}
    >
      Next →
    </button>
  </div>
</div>
```

### Pill Tabs (admin moderation / message filter)
```tsx
<div className="flex gap-1">
  {tabs.map((t) => (
    <button
      key={t}
      onClick={() => setTab(t)}
      className="text-sm px-4 py-2 rounded capitalize transition-colors"
      style={{
        background: active === t ? 'var(--accent-dim)' : 'var(--surface)',
        color: active === t ? 'var(--accent)' : 'var(--text-muted)',
        border: '1px solid var(--border)',
      }}
    >
      {t}
    </button>
  ))}
</div>
```

### Divider (auth forms)
```tsx
<div className="flex items-center gap-3">
  <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
  <span className="text-xs" style={{ color: 'var(--text-disabled)' }}>or</span>
  <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
</div>
```

### Accent Pill (landing page tag)
```tsx
<div
  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
  style={{
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
    border: '1px solid rgba(0,230,118,0.2)',
  }}
>
  <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
  Label text
</div>
```

---

## Animations / Transitions

| Usage | Class |
|---|---|
| Hover color/bg changes | `transition-colors` |
| Opacity hover | `transition-opacity hover:opacity-80` |
| Button press | `active:scale-95 transition-all` |
| Group reveal (message card actions) | `opacity-0 group-hover:opacity-100 transition-opacity` |
| Pending navigation (useTransition) | `opacity: isPending ? 0.6 : 1, transition: 'opacity 0.15s'` |
| Toggle knob slide | `transition-all` on the `left` property |

No heavy animations. Motion is minimal and purposeful.

---

## Dark Mode Notes

- Dark-first. No light mode.
- Background layers: `#0a0a0a` → `#111111` → `#1a1a1a` (bg → surface → elevated)
- Never use pure white. Max brightness for text: `#f5f5f5`
- Accent `#00e676` only on dark backgrounds — contrast is insufficient on light
- Scrollbar styled in `globals.css`: 6px, `var(--border)` thumb, `var(--bg)` track
- `::selection` uses `rgba(0,230,118,0.2)` background

---

## globals.css Reference

```css
:root {
  --bg: #0a0a0a;
  --surface: #111111;
  --surface-elevated: #1a1a1a;
  --border: #1f1f1f;
  --accent: #00e676;
  --accent-dim: rgba(0, 230, 118, 0.08);
  --text: #f5f5f5;
  --text-muted: #888888;
  --text-disabled: #444444;
  --destructive: #ff4444;
  --warning: #ffaa00;
}
```
