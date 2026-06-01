/**
 * On-device safety filter — recipient's browser only.
 *
 * The server never sees plaintext (E2E), so any content moderation must
 * happen here, after decryption. This module classifies a message into:
 *
 *   - clean   render normally
 *   - warn    render with a small severity badge
 *   - hide    blur the content; reveal on explicit click
 *
 * Detection strategies:
 *
 *   • doxxing — regex patterns for phone numbers, email addresses,
 *     IPv4, and obvious physical-address shapes. Conservative — false
 *     positives are tolerable here since hiding is reversible.
 *
 *   • self-harm — small keyword list of urgent terms. Tilts toward
 *     escalation: a single hit triggers "hide" so the recipient is
 *     prompted to reveal deliberately rather than be ambushed.
 *
 *   • slurs — INTENTIONALLY EMPTY in this module. A real slur filter
 *     needs proper localization (Bangla + English at minimum for our
 *     audience) and curation we can't do inline. The hook is here so
 *     a `slurList` can be injected from server-served config later.
 */

export type SafetyLevel = 'clean' | 'warn' | 'hide'

export type SafetyReport = {
  level: SafetyLevel
  reasons: Array<'phone' | 'email' | 'ipv4' | 'address' | 'self-harm' | 'slur'>
}

// ─── Doxxing patterns ──────────────────────────────────────────────────────

// International + US phone-shaped: optional +country, 7+ digits separated
// by spaces/dashes/dots/parens. Will match e.g. "+1 (415) 555-0188",
// "+880 1714 123456", "415-555-0188".
const PHONE_RX = /(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}(?:[\s.-]?\d{2,4})?/

// Standard email RFC-lite — good enough for surface detection.
const EMAIL_RX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/

// IPv4 dotted quad.
const IPV4_RX = /\b(?:\d{1,3}\.){3}\d{1,3}\b/

// "123 Main St" / "45 Oak Avenue" — number + word + street suffix.
const ADDRESS_RX = /\b\d{1,5}\s+[A-Za-z]+\s+(?:st|street|ave|avenue|rd|road|ln|lane|dr|drive|blvd|boulevard|way|ct|court|pl|place)\b/i

// ─── Self-harm cues ────────────────────────────────────────────────────────

const SELF_HARM_KEYWORDS: ReadonlyArray<RegExp> = [
  /\bkill\s+(?:myself|yourself)\b/i,
  /\bk[iy]s\b/i, // "kys" common abbreviation
  /\bsuicid/i,
  /\bself[\s-]harm/i,
  /\bcut\s+(?:myself|yourself)\b/i,
  /\b(?:wanna|want\s+to)\s+die\b/i,
  /\b(?:end\s+(?:it|my\s+life)|don't\s+wanna\s+(?:be|live))\b/i,
]

// ─── Phone-number false-positive guards ────────────────────────────────────

/**
 * Bare 4-digit sequences ("hi 2024", "see you at 9pm") would otherwise hit
 * PHONE_RX. Require either a separator or ≥7 contiguous digits to call it
 * a phone number.
 */
function looksLikeRealPhone(text: string): boolean {
  const match = text.match(PHONE_RX)
  if (!match) return false
  const digits = match[0].replace(/\D/g, '')
  return digits.length >= 7
}

// ─── Public API ────────────────────────────────────────────────────────────

export function classify(
  plaintext: string,
  slurList: ReadonlyArray<string> = [],
): SafetyReport {
  const reasons: SafetyReport['reasons'] = []

  if (looksLikeRealPhone(plaintext)) reasons.push('phone')
  if (EMAIL_RX.test(plaintext)) reasons.push('email')
  if (IPV4_RX.test(plaintext)) reasons.push('ipv4')
  if (ADDRESS_RX.test(plaintext)) reasons.push('address')

  const hasSelfHarm = SELF_HARM_KEYWORDS.some((rx) => rx.test(plaintext))
  if (hasSelfHarm) reasons.push('self-harm')

  // Slur scan — case-insensitive whole-word match.
  if (slurList.length > 0) {
    const lower = plaintext.toLowerCase()
    const hit = slurList.some((s) => {
      const needle = s.toLowerCase()
      const idx = lower.indexOf(needle)
      if (idx < 0) return false
      const before = idx === 0 ? ' ' : lower[idx - 1]
      const after =
        idx + needle.length >= lower.length
          ? ' '
          : lower[idx + needle.length]
      return /\W/.test(before) && /\W/.test(after)
    })
    if (hit) reasons.push('slur')
  }

  let level: SafetyLevel = 'clean'
  // Anything in `hide` set: blur by default
  if (
    reasons.includes('self-harm') ||
    reasons.includes('slur') ||
    reasons.includes('phone') ||
    reasons.includes('address')
  ) {
    level = 'hide'
  } else if (reasons.length > 0) {
    level = 'warn'
  }

  return { level, reasons }
}

/** Human-friendly label for a safety reason. */
export function labelFor(reason: SafetyReport['reasons'][number]): string {
  switch (reason) {
    case 'phone':
      return 'possible phone number'
    case 'email':
      return 'email address'
    case 'ipv4':
      return 'IP address'
    case 'address':
      return 'physical address'
    case 'self-harm':
      return 'self-harm content'
    case 'slur':
      return 'harmful language'
  }
}
