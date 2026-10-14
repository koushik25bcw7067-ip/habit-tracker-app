// ---------------------------------------------------------------------------
// Palette engine.
//
// A theme only ships 5 "seed" colors (primary, secondary, tertiary, background,
// text) + a mode. Everything the UI needs (51 design tokens: containers,
// "fixed" tones, outlines, on-* colors) is derived here, and contrast is
// enforced — so a theme (even an AI-generated one) can't produce unreadable
// text. This is what makes custom themes safe.
// ---------------------------------------------------------------------------

const HEX = /^#?([0-9a-f]{6})$/i

export function isHex(v) {
  return typeof v === 'string' && HEX.test(v.trim())
}

export function hexToRgb(hex) {
  const m = HEX.exec(String(hex).trim())
  if (!m) return [0, 0, 0]
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('')
}

/** Linear mix of two rgb triplets. t=0 -> a, t=1 -> b. */
export function mix(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

export function luminance([r, g, b]) {
  const f = (c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

export function contrast(a, b) {
  const la = luminance(a)
  const lb = luminance(b)
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

const BLACK = [0, 0, 0]
const WHITE = [255, 255, 255]

/** Black or white — whichever reads better on `bg`. */
export function readableOn(bg) {
  const ink = [12, 12, 16]
  return contrast(bg, WHITE) >= contrast(bg, ink) ? WHITE : ink
}

/**
 * Nudge `fg` toward black (or white on dark backgrounds) until it reaches
 * `min` contrast against `bg`. Keeps the hue, so brand colors stay recognisable.
 */
export function ensureContrast(fg, bg, min) {
  if (contrast(fg, bg) >= min) return fg
  const target = luminance(bg) > 0.5 ? BLACK : WHITE
  for (let t = 0.05; t <= 1.0001; t += 0.05) {
    const c = mix(fg, target, t)
    if (contrast(c, bg) >= min) return c
  }
  return target
}

/**
 * Mid-tone colours can fail AA for BOTH a white and a black label. Nudge the colour (smallest
 * shift) until one of them reaches 4.5, keeping it readable as text on the page too.
 */
function fitLabel(c, bg) {
  const ink = [12, 12, 16]
  if (Math.max(contrast(c, WHITE), contrast(c, ink)) >= 4.6) return c
  for (let t = 0.02; t <= 1.0001; t += 0.02) {
    const dk = mix(c, BLACK, t)
    if (contrast(dk, WHITE) >= 4.6) return dk
    const lt = mix(c, WHITE, t)
    if (contrast(lt, ink) >= 4.6 && contrast(lt, bg) >= 3) return lt
  }
  return c
}

const fmt = (rgb) => rgb.map((x) => Math.round(Math.max(0, Math.min(255, x)))).join(' ')

/**
 * Build the full token map ("--c-<name>" -> "r g b") from seeds.
 * @param {{primary:string, secondary:string, tertiary:string, background:string, text:string}} seeds
 * @param {'light'|'dark'} mode
 */
export function buildPalette(seeds, mode = 'light') {
  const dark = mode === 'dark'
  const bg = hexToRgb(seeds.background)
  const textRaw = hexToRgb(seeds.text)
  const text = ensureContrast(textRaw, bg, 7)

  // Brand colors must work as (a) button background with readable label and
  // (b) text/icon on the page background. Aim for >= 3.2 against the page.
  // On light themes, a mid-tone brand colour (white contrast 3-4.5, e.g. a
  // classic blue) is deepened slightly so the button label can stay white
  // instead of flipping to black — same hue, still AA.
  const brand = (hex) => {
    let c = ensureContrast(hexToRgb(hex), bg, 3.2)
    if (!dark) {
      const w = contrast(c, WHITE)
      if (w >= 3 && w < 4.6) c = ensureContrast(c, WHITE, 4.6)
    }
    return fitLabel(c, bg)
  }
  const primary = brand(seeds.primary)
  const secondary = brand(seeds.secondary)
  const tertiary = brand(seeds.tertiary)

  const lift = (c, t) => mix(c, dark ? WHITE : BLACK, t) // "stronger" shade
  const tint = (c, t) => mix(c, bg, t) // wash toward page bg

  const out = {}
  const set = (name, rgb) => {
    out[`--c-${name}`] = fmt(rgb)
  }

  // Surfaces ---------------------------------------------------------------
  set('surface', bg)
  set('background', bg)
  set('surface-bright', dark ? mix(bg, WHITE, 0.08) : bg)
  set('surface-dim', mix(bg, text, dark ? 0.02 : 0.14))
  set('surface-container-lowest', dark ? mix(bg, WHITE, 0.05) : mix(bg, WHITE, 0.75))
  set('surface-container-low', mix(bg, text, 0.045))
  set('surface-container', mix(bg, text, 0.085))
  set('surface-container-high', mix(bg, text, 0.12))
  set('surface-container-highest', mix(bg, text, 0.16))
  set('surface-variant', mix(bg, text, 0.16))
  set('surface-tint', primary)

  // Text / outlines --------------------------------------------------------
  set('on-surface', text)
  set('on-background', text)
  set('on-surface-variant', ensureContrast(mix(text, bg, 0.3), bg, 4.5))
  set('outline', ensureContrast(mix(text, bg, 0.5), bg, 3))
  set('outline-variant', mix(text, bg, 0.8))
  set('inverse-surface', text)
  set('inverse-on-surface', bg)
  set('slate', mix(text, bg, 0.4))

  // Brand families ---------------------------------------------------------
  const family = (name, c) => {
    const on = readableOn(c)
    const strong = lift(c, 0.28)
    const container = dark ? lift(c, 0.3) : lift(c, 0.12)
    set(name, c)
    set(`on-${name}`, on)
    set(`${name}-strong`, strong)
    set(`${name}-container`, container)
    set(`on-${name}-container`, readableOn(container))
    set(`${name}-fixed`, tint(c, 0.82))
    set(`${name}-fixed-dim`, tint(c, 0.62))
    set(`on-${name}-fixed`, ensureContrast(lift(c, 0.55), tint(c, 0.82), 7))
    set(`on-${name}-fixed-variant`, ensureContrast(lift(c, 0.35), tint(c, 0.82), 4.5))
  }
  family('primary', primary)
  family('secondary', secondary)
  family('tertiary', tertiary)
  set('inverse-primary', mix(primary, dark ? BLACK : WHITE, 0.45))
  // Legacy name used by a couple of components.
  set('secondary-container', mix(secondary, dark ? BLACK : WHITE, dark ? 0.15 : 0.3))
  set('on-secondary-container', readableOn(mix(secondary, dark ? BLACK : WHITE, dark ? 0.15 : 0.3)))

  // Status -----------------------------------------------------------------
  const error = ensureContrast(dark ? [255, 128, 120] : [186, 26, 26], bg, 3.5)
  set('error', error)
  set('on-error', readableOn(error))
  set('error-container', dark ? [96, 20, 18] : [255, 218, 214])
  set('on-error-container', dark ? [255, 218, 214] : [147, 0, 10])
  set('warning', ensureContrast(dark ? [251, 191, 36] : [217, 119, 6], bg, 3))

  return out
}

/** Soft sanity check — useful in tests and when importing saved themes. */
export function validateSeeds(seeds) {
  return ['primary', 'secondary', 'tertiary', 'background', 'text'].every((k) => isHex(seeds?.[k]))
}

export function normalizeHex(v) {
  const m = HEX.exec(String(v).trim())
  return m ? '#' + m[1].toLowerCase() : null
}
