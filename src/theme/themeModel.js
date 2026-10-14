// ---------------------------------------------------------------------------
// Theme model (schema v2) — the single source of truth on the client.
//
// The backend (/theme/*) returns either a preset or an AI-generated "world". Both pass through
// normalizeTheme(), which validates every field again (never trust the network), upgrades the
// original v1 shape (accent_color / font / mascot_name / dialogues[]) and fills gaps from safe
// defaults. applyTheme() then turns the result into CSS variables + data-attributes — it never
// injects arbitrary CSS or HTML.
// ---------------------------------------------------------------------------
import { buildPalette, normalizeHex } from './colors.js'
import { safeFonts, loadFonts } from './fonts.js'

export const ACCESSORIES = ['none', 'headband', 'cap', 'crown', 'cloud', 'antenna', 'glasses', 'tuft', 'headphones', 'cape', 'bow']
const TEXTURES = ['none', 'stone', 'grid', 'stars', 'sparkle', 'dots']
const AMBIENTS = ['none', 'embers', 'stars', 'runes', 'bits', 'clouds', 'petals']
const RADII = { sharp: 0.35, soft: 1, round: 1.5 }
const BORDERS = ['plain', 'ornate', 'glow']

export const LINE_KEYS = [
  'greeting', 'idle', 'poke', 'thinking', 'habit_created', 'habit_done', 'habit_undone', 'task_created',
  'task_done', 'streak', 'missed', 'milestone', 'encourage',
]

// Neutral wording used whenever a world doesn't override a label. Functional meaning never changes.
export const DEFAULT_VOCAB = {
  habit: 'Habit',
  habits: 'Habits',
  task: 'Task',
  tasks: 'Tasks',
  goal: 'Goal',
  goals: 'Goals',
  streak: 'Streak',
  dashboard: 'Dashboard',
  achievements: 'Achievements',
  reminders: 'Reminders',
  add_habit_prompt: 'What habit would you like to build?',
  add_task_prompt: 'What needs doing?',
  empty_habits: 'No habits yet.',
  empty_tasks: 'Nothing pending.',
  greeting: 'Welcome back, {name}',
}

const GENERIC_LINES = {
  greeting: ['Welcome back, {name}!'],
  idle: ['Still here, rooting for you.', 'One step at a time.'],
  poke: ['Hey! That tickles.', 'Need something?'],
  thinking: ['Let me think...'],
  habit_created: ['New habit added. Let\'s make it stick!'],
  habit_done: ['Habit done. Nicely done!'],
  habit_undone: ['No worries, we can redo it.'],
  task_created: ['Task added.'],
  task_done: ['Task complete!'],
  streak: ['{streak} days in a row. Keep going!'],
  missed: ['Something is still waiting for you today.'],
  milestone: ['Milestone reached!'],
  encourage: ['Do one small thing. That counts.'],
}

// Last-resort theme (the original look). Used when nothing else validates — never a blank screen.
export const CLASSIC_FALLBACK = {
  key: 'classic',
  label: 'Classic',
  description: 'The original clean look.',
  mode: 'light',
  colors: { primary: '#4f46e5', secondary: '#674bb5', tertiary: '#10b981', background: '#f8f9ff', text: '#0b1c30' },
  fonts: { display: 'Plus Jakarta Sans', body: 'Inter' },
  effects: { texture: 'none', ambient: 'none', radius: 'soft', border: 'plain', heading_case: 'none', heading_tracking: -0.02 },
  mascot: { name: 'Buddy', emoji: '✨', accessory: 'none', outfit: '#4f46e5', skin: '#fde0c4' },
  vocab: { ...DEFAULT_VOCAB },
  lines: { ...GENERIC_LINES, pages: {} },
}

const CTRL = /[\u0000-\u001f\u007f<>`]/g
const BAD = /(:\/\/|javascript:|data:|@import|url\()/i
const ALLOWED_PH = new Set(['name', 'habit', 'task', 'count', 'streak'])

function text(v, limit) {
  let s = String(v ?? '').replace(CTRL, '').replace(/\s+/g, ' ').trim()
  if (BAD.test(s)) return ''
  s = s.replace(/\{(\w+)\}/g, (m, k) => (ALLOWED_PH.has(k) ? m : ''))
  return s.slice(0, limit).trim()
}
const oneOf = (v, list, dflt) => (list.includes(v) ? v : dflt)

/** Validate + normalize anything theme-shaped. Returns CLASSIC_FALLBACK-based object on failure. */
export function normalizeTheme(raw) {
  try {
    return normalizeStrict(raw)
  } catch {
    return { ...structuredCloneSafe(CLASSIC_FALLBACK), invalid: true }
  }
}

function structuredCloneSafe(o) {
  return JSON.parse(JSON.stringify(o))
}

function normalizeStrict(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('no theme')
  // v1 -> v2
  let r = raw
  if (!r.colors && r.accent_color) {
    r = {
      ...structuredCloneSafe(CLASSIC_FALLBACK),
      label: raw.label || raw.mascot_name || 'Custom',
      colors: { ...CLASSIC_FALLBACK.colors, primary: raw.accent_color },
      fonts: { display: raw.font, body: 'Inter' },
      mascot: { ...CLASSIC_FALLBACK.mascot, name: raw.mascot_name, emoji: raw.mascot_emoji, outfit: raw.accent_color },
      lines: { ...GENERIC_LINES, idle: raw.dialogues, poke: raw.dialogues, pages: {} },
      preset_key: raw.preset_key,
    }
  }
  const c = r.colors || {}
  const colors = {
    primary: normalizeHex(c.primary),
    secondary: normalizeHex(c.secondary),
    tertiary: normalizeHex(c.tertiary),
    background: normalizeHex(c.background),
    text: normalizeHex(c.text),
  }
  if (Object.values(colors).some((x) => !x)) throw new Error('bad colors')

  const e = r.effects || {}
  const tracking = Number(e.heading_tracking)
  const effects = {
    texture: oneOf(e.texture, TEXTURES, 'none'),
    ambient: oneOf(e.ambient, AMBIENTS, 'none'),
    radius: oneOf(e.radius, Object.keys(RADII), 'soft'),
    border: oneOf(e.border, BORDERS, 'plain'),
    heading_case: e.heading_case === 'uppercase' ? 'uppercase' : 'none',
    heading_tracking: Number.isFinite(tracking) ? Math.max(-0.05, Math.min(0.15, tracking)) : 0,
  }

  const m = r.mascot || {}
  const mascot = {
    name: text(m.name, 24) || 'Buddy',
    emoji: text(m.emoji, 4) || '✨',
    accessory: oneOf(m.accessory, ACCESSORIES, 'none'),
    outfit: normalizeHex(m.outfit) || colors.primary,
    skin: normalizeHex(m.skin) || '#fde0c4',
  }

  const vocab = { ...DEFAULT_VOCAB }
  for (const k of Object.keys(DEFAULT_VOCAB)) {
    const v = text(r.vocab?.[k], 60)
    if (v) vocab[k] = v
  }

  const lines = {}
  for (const k of LINE_KEYS) {
    const arr = Array.isArray(r.lines?.[k]) ? r.lines[k].map((x) => text(x, 110)).filter(Boolean).slice(0, 8) : []
    lines[k] = arr.length ? arr : GENERIC_LINES[k]
  }
  lines.pages = {}
  for (const [k, v] of Object.entries(r.lines?.pages || {})) {
    const t = text(v, 110)
    if (t && /^[a-z]+$/.test(k)) lines.pages[k] = t
  }

  return {
    key: typeof (r.preset_key ?? r.key) === 'string' ? String(r.preset_key ?? r.key).replace(/[^a-z0-9_-]/gi, '').slice(0, 40) : null,
    label: text(r.label, 40) || mascot.name,
    description: text(r.description, 160),
    mode: r.mode === 'dark' ? 'dark' : 'light',
    colors,
    fonts: safeFonts(r.fonts || { display: r.font }),
    effects,
    mascot,
    vocab,
    lines,
    source: r.source === 'ai' || r.source === 'fallback' ? r.source : undefined,
  }
}

/** Apply a normalized theme to the document: CSS variables + data-attributes only. */
export function applyTheme(theme) {
  if (typeof document === 'undefined') return
  const t = theme || CLASSIC_FALLBACK
  const root = document.documentElement
  const palette = buildPalette(t.colors, t.mode)
  for (const [k, v] of Object.entries(palette)) root.style.setProperty(k, v)
  root.style.setProperty('--font-display', `'${t.fonts.display}', 'Plus Jakarta Sans', sans-serif`)
  root.style.setProperty('--font-body', `'${t.fonts.body}', 'Inter', sans-serif`)
  root.style.setProperty('--radius-scale', String(RADII[t.effects.radius] ?? 1))
  root.style.setProperty('--heading-tracking', `${t.effects.heading_tracking}em`)
  root.style.setProperty('--heading-case', t.effects.heading_case)
  root.style.setProperty('--theme-accent', t.colors.primary) // kept for older components
  root.dataset.world = t.key || 'custom'
  root.dataset.themeMode = t.mode
  root.dataset.texture = t.effects.texture
  root.dataset.border = t.effects.border
  root.dataset.ambient = t.effects.ambient
  loadFonts(t.fonts)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', `rgb(${palette['--c-surface'].split(' ').join(',')})`)
}

// ---- local cache --------------------------------------------------------
// Cache is keyed by user id, so another account on the same browser never inherits a theme.
// The server stays the source of truth; the cache only avoids a flash on refresh.
const cacheKey = (uid) => `mini_ai_world_${uid}`
const LAST_KEY = 'mini_ai_last_world' // cosmetic only: look of the login screen, not account data

function read(key) {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : null
  } catch {
    return null
  }
}
function write(key, value) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable: theme simply won't be cached */
  }
}

export const loadCachedTheme = (uid) => (uid ? read(cacheKey(uid)) : null)
export const saveCachedTheme = (uid, raw) => {
  if (uid) write(cacheKey(uid), raw)
  write(LAST_KEY, raw)
}
export const loadLastTheme = () => read(LAST_KEY)
export const clearUserCache = (uid) => uid && write(cacheKey(uid), null)

// ---- companion settings (per browser) ----------------------------------
const COMP_KEY = 'mini_ai_companion'
export const DEFAULT_COMPANION_SETTINGS = { enabled: true, minimized: false, roam: false, chatter: 'normal' }
export const loadCompanionSettings = () => ({ ...DEFAULT_COMPANION_SETTINGS, ...(read(COMP_KEY) || {}) })
export const saveCompanionSettings = (s) => write(COMP_KEY, s)
