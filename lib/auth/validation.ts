/**
 * Username & passphrase validation rules. Used both client-side (for instant
 * feedback) and server-side (as the source of truth on submit).
 */

// Routes + role words we don't want as usernames.
export const RESERVED_USERNAMES = new Set([
  // platform
  'admin',
  'staff',
  'root',
  'support',
  'help',
  'bindu',
  'official',
  'mod',
  'moderator',
  'system',
  // routes
  'api',
  'app',
  'sign-in',
  'signin',
  'sign-up',
  'signup',
  'sign-out',
  'signout',
  'login',
  'logout',
  'register',
  'dashboard',
  'inbox',
  'settings',
  'u',
  'm',
  'lab',
  'terms',
  'privacy',
  'policy',
  'tos',
  'about',
  'contact',
  'security',
  'crisis',
  'safety',
  // verbs and common collisions
  'me',
  'you',
  'public',
  'private',
  'home',
  'index',
  'static',
  'assets',
  'images',
])

export type UsernameResult =
  | { ok: true }
  | { ok: false; reason: string }

export function validateUsername(raw: string): UsernameResult {
  const u = (raw ?? '').trim().toLowerCase()
  if (u.length < 3) return { ok: false, reason: 'Too short (min 3)' }
  if (u.length > 20) return { ok: false, reason: 'Too long (max 20)' }
  if (!/^[a-z0-9._]+$/.test(u))
    return { ok: false, reason: 'Letters, numbers, dots, underscores only' }
  if (/^[._]/.test(u) || /[._]$/.test(u))
    return { ok: false, reason: "Can't start or end with . or _" }
  if (/\.\.|__|\._|_\./.test(u))
    return { ok: false, reason: 'No repeated separators' }
  if (RESERVED_USERNAMES.has(u))
    return { ok: false, reason: 'That username is reserved' }
  return { ok: true }
}

/** Normalize before storing — already lowercased + trimmed. */
export function normalizeUsername(raw: string): string {
  return (raw ?? '').trim().toLowerCase()
}

export type PassphraseStrength = {
  score: 0 | 1 | 2 | 3 | 4
  label: 'too weak' | 'weak' | 'okay' | 'strong' | 'very strong'
  warnings: string[]
}

/**
 * Lightweight strength estimate. Not a substitute for zxcvbn — we want
 * to keep bundle small. Heuristic favors length and word-diversity,
 * which is what diceware-style passphrases already optimize for.
 */
export function estimatePassphraseStrength(p: string): PassphraseStrength {
  const warnings: string[] = []
  let score = 0
  if (p.length >= 12) score++
  if (p.length >= 20) score++
  if (p.length >= 30) score++
  if (/\s/.test(p) && p.split(/\s+/).filter(Boolean).length >= 4) score++

  // Penalties
  if (p.length < 12) warnings.push('At least 12 characters')
  if (/^[a-z]+$/.test(p))
    warnings.push('Mix in a number, symbol, or word break')
  if (/^(.)\1+$/.test(p)) {
    warnings.push("That's just one character repeated")
    score = 0
  }
  if (/^(password|passphrase|qwerty|letmein|admin|bindu)/i.test(p)) {
    warnings.push("Avoid common words like 'password'")
    score = Math.min(score, 1)
  }

  const clamped = Math.max(0, Math.min(4, score)) as PassphraseStrength['score']
  const label: PassphraseStrength['label'] = (
    ['too weak', 'weak', 'okay', 'strong', 'very strong'] as const
  )[clamped]

  return { score: clamped, label, warnings }
}

export function validatePassphrase(
  p: string,
): { ok: true } | { ok: false; reason: string } {
  if (!p || typeof p !== 'string') return { ok: false, reason: 'Required' }
  if (p.length < 12)
    return { ok: false, reason: 'At least 12 characters required' }
  if (p.length > 256)
    return { ok: false, reason: 'Too long (max 256 characters)' }
  return { ok: true }
}
