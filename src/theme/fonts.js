// Fonts a theme is allowed to use. The list is a whitelist on purpose:
//  - a theme (even an AI-generated one) can never inject arbitrary CSS/URLs,
//  - every family is known to exist on Google Fonts, so loading never 404s.
// Keep in sync with FONT_WHITELIST in the backend theme_service.py.

// 'single' = only one weight exists on Google Fonts, so no wght axis in the URL.
const SINGLE = new Set([
  'Bangers', 'Bebas Neue', 'Permanent Marker', 'Press Start 2P', 'Creepster', 'Lobster',
  'Pacifico', 'Righteous', 'Russo One', 'Anton', 'Bungee', 'Special Elite', 'Audiowide', 'Marcellus',
  'Uncial Antiqua', 'MedievalSharp', 'Zen Antique',
])

export const DISPLAY_FONTS = [
  'Bangers', 'Bebas Neue', 'Permanent Marker', 'Press Start 2P', 'Creepster', 'Lobster', 'Pacifico',
  'Righteous', 'Russo One', 'Anton', 'Bungee', 'Special Elite', 'Audiowide', 'Marcellus', 'Cinzel',
  'Cinzel Decorative', 'Uncial Antiqua', 'MedievalSharp', 'Zen Antique', 'Shippori Mincho', 'Noto Serif JP',
  'Orbitron', 'Chakra Petch', 'Oswald', 'Teko', 'Fredoka', 'Baloo 2', 'Quicksand', 'Caveat', 'Amatic SC',
  'Playfair Display', 'Space Grotesk', 'JetBrains Mono', 'Poppins', 'Plus Jakarta Sans', 'Rajdhani',
]

// Body text must stay readable at 14px, so it's a shorter, calmer list.
export const BODY_FONTS = [
  'Inter', 'Nunito', 'Poppins', 'Quicksand', 'Fredoka', 'Space Grotesk', 'JetBrains Mono', 'Fira Code',
  'Lora', 'Merriweather', 'Rajdhani', 'Baloo 2', 'Comic Neue', 'Plus Jakarta Sans',
]

const ALL = new Set([...DISPLAY_FONTS, ...BODY_FONTS])

export function isAllowedFont(name) {
  return ALL.has(name)
}

const FALLBACK_DISPLAY = 'Plus Jakarta Sans'
const FALLBACK_BODY = 'Inter'

export function safeFonts(fonts = {}) {
  const display = DISPLAY_FONTS.includes(fonts.display) ? fonts.display : FALLBACK_DISPLAY
  const body = BODY_FONTS.includes(fonts.body) ? fonts.body : FALLBACK_BODY
  return { display, body }
}

// index.html already loads these two statically.
const loaded = new Set(['Inter', 'Plus Jakarta Sans'])

function familyParam(name) {
  const fam = name.replace(/ /g, '+')
  return SINGLE.has(name) ? `family=${fam}` : `family=${fam}:wght@400;700`
}

/** Injects one Google Fonts <link> per family (once). Safe to call repeatedly. */
export function loadFonts({ display, body }) {
  if (typeof document === 'undefined') return
  const families = [...new Set([display, body])].filter((f) => isAllowedFont(f) && !loaded.has(f))
  if (families.length === 0) return
  families.forEach((f) => loaded.add(f))
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?${families.map(familyParam).join('&')}&display=swap`
  link.dataset.themeFont = families.join(',')
  document.head.appendChild(link)
}
