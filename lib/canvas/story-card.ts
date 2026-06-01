'use client'

/**
 * Story card renderer — 1080×1920 vertical PNG for Insta/TikTok stories.
 *
 * Pure browser-side. Reads the current theme's tokens by querying
 * computed styles of a temporary off-screen element, so the export
 * automatically matches whatever theme the recipient is using.
 *
 * Design (per theme):
 *   - Full-bleed `var(--bg)` background
 *   - Floating accent dot in the top-left
 *   - Centered "bubble" card with the message text (mood + plaintext)
 *   - "anon · #hash" attribution
 *   - bindu watermark + recipient handle at the bottom
 */

import type { Theme } from '@/components/providers/ThemeProvider'

const W = 1080
const H = 1920

export type StoryCardInput = {
  plaintext: string
  mood: string | null
  senderHash: string
  username: string
  theme: Theme
}

/** Returns a Blob (PNG) suitable for download. */
export async function renderStoryCard(
  input: StoryCardInput,
): Promise<Blob> {
  const tokens = readThemeTokens(input.theme)

  // Build canvas
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  // 1. Background
  ctx.fillStyle = tokens.bg
  ctx.fillRect(0, 0, W, H)

  // 2. Floating decorative dots (mimics hero treatment)
  drawCircle(ctx, 110, 220, 28, tokens.accent, 0.85)
  drawCircle(ctx, W - 140, 380, 18, tokens.accent2, 0.7)
  drawCircle(ctx, W - 100, H - 320, 22, tokens.accent3, 0.6)
  drawCircle(ctx, 140, H - 520, 12, tokens.ink, 0.25)

  // 3. Top brand
  drawCircle(ctx, 88, 110, 14, tokens.accent, 1)
  ctx.fillStyle = tokens.ink
  ctx.font = `700 36px ${tokens.fontDisplay}`
  ctx.textBaseline = 'middle'
  ctx.fillText('bindu', 122, 110)

  // 4. Bubble card
  const cardX = 80
  const cardY = 500
  const cardW = W - 160
  const cardH = 900
  drawRoundRect(ctx, cardX, cardY, cardW, cardH, 60, tokens.bubble)

  // Card top bar — sender row
  ctx.fillStyle = tokens.accent
  ctx.beginPath()
  ctx.arc(cardX + 60, cardY + 70, 24, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = tokens.ink
  ctx.font = `600 28px ${tokens.fontDisplay}`
  ctx.textBaseline = 'middle'
  ctx.fillText('anon · whispered to you', cardX + 110, cardY + 60)

  ctx.fillStyle = tokens.ink2
  ctx.font = `400 22px ${tokens.fontMono}`
  ctx.fillText(`#${input.senderHash}`, cardX + 110, cardY + 100)

  // Divider
  ctx.strokeStyle = tokens.line
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(cardX + 50, cardY + 150)
  ctx.lineTo(cardX + cardW - 50, cardY + 150)
  ctx.stroke()

  // Mood + plaintext (display font, large)
  const textX = cardX + 60
  const textY = cardY + 230
  const textMaxW = cardW - 120
  ctx.fillStyle = tokens.ink
  ctx.font = `600 ${pickFontSize(input.plaintext)}px ${tokens.fontDisplay}`
  ctx.textBaseline = 'top'

  const composedText =
    input.mood ? `${input.mood}  ${input.plaintext}` : input.plaintext
  wrapText(
    ctx,
    composedText,
    textX,
    textY,
    textMaxW,
    pickLineHeight(input.plaintext),
  )

  // Bottom of card — bindu.app/username
  ctx.fillStyle = tokens.ink2
  ctx.font = `400 22px ${tokens.fontMono}`
  ctx.textBaseline = 'middle'
  ctx.fillText(`bindu.app/${input.username}`, cardX + 60, cardY + cardH - 60)

  // 5. Bottom CTA
  ctx.fillStyle = tokens.ink2
  ctx.font = `400 24px ${tokens.fontMono}`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  ctx.fillText('● end-to-end encrypted', W / 2, H - 180)

  ctx.fillStyle = tokens.ink
  ctx.font = `700 38px ${tokens.fontDisplay}`
  ctx.fillText('send anonymous whispers @ bindu.app', W / 2, H - 130)
  ctx.textAlign = 'start' // reset

  // 6. Export
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Could not encode PNG'))
    }, 'image/png')
  })
}

// ─── Token reading ────────────────────────────────────────────────────────

type Tokens = {
  bg: string
  ink: string
  ink2: string
  line: string
  accent: string
  accent2: string
  accent3: string
  bubble: string
  fontDisplay: string
  fontMono: string
}

/**
 * Read computed CSS variables for a given theme by temporarily applying
 * the theme class to a hidden probe element. Cleans up after itself.
 * Falls back to sunset defaults if a token is unset.
 */
function readThemeTokens(theme: Theme): Tokens {
  const probe = document.createElement('div')
  probe.className = `theme-${theme}`
  probe.style.cssText =
    'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;pointer-events:none;'
  document.body.appendChild(probe)
  try {
    const cs = getComputedStyle(probe)
    return {
      bg: cs.getPropertyValue('--bg').trim() || '#FBF5EC',
      ink: cs.getPropertyValue('--ink').trim() || '#1A1410',
      ink2: cs.getPropertyValue('--ink-2').trim() || '#514237',
      line: cs.getPropertyValue('--line').trim() || '#1A141022',
      accent: cs.getPropertyValue('--accent').trim() || '#E85D3B',
      accent2: cs.getPropertyValue('--accent-2').trim() || '#F2A23C',
      accent3: cs.getPropertyValue('--accent-3').trim() || '#2A4D8E',
      bubble: cs.getPropertyValue('--bubble').trim() || '#FFFFFF',
      fontDisplay: stripQuotes(
        cs.getPropertyValue('--font-display').trim() ||
          'Bricolage Grotesque, system-ui, sans-serif',
      ),
      fontMono: stripQuotes(
        cs.getPropertyValue('--font-mono').trim() ||
          'IBM Plex Mono, ui-monospace, monospace',
      ),
    }
  } finally {
    probe.remove()
  }
}

function stripQuotes(s: string): string {
  return s.replace(/^['"]|['"]$/g, '')
}

// ─── Canvas drawing helpers ───────────────────────────────────────────────

function drawCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  alpha = 1,
) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
) {
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
  ctx.fill()
}

/** Word-wrap with line breaks, mutates ctx. */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number,
): number {
  const paragraphs = text.split(/\n/)
  let cursorY = y
  for (const para of paragraphs) {
    const words = para.split(/\s+/)
    let line = ''
    for (let i = 0; i < words.length; i++) {
      const test = line ? `${line} ${words[i]}` : words[i]
      const metrics = ctx.measureText(test)
      if (metrics.width > maxW && line) {
        ctx.fillText(line, x, cursorY)
        line = words[i]
        cursorY += lineH
      } else {
        line = test
      }
    }
    if (line) {
      ctx.fillText(line, x, cursorY)
      cursorY += lineH
    }
  }
  return cursorY
}

/** Bigger text for shorter messages. */
function pickFontSize(text: string): number {
  const len = text.length
  if (len < 60) return 80
  if (len < 120) return 64
  if (len < 200) return 52
  return 44
}

function pickLineHeight(text: string): number {
  return Math.round(pickFontSize(text) * 1.25)
}
