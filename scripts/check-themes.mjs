// Run:  node scripts/check-themes.mjs
// Verifies every world produces a readable, complete palette (WCAG contrast) and that every
// token the Tailwind config references exists. Worlds come from the backend:
//   scripts/presets.snapshot.json = GET /theme/presets (+ one generated sample). Refresh it with
//   `curl http://127.0.0.1:8000/theme/presets > ...` (wrap as {"presets": <response>, "samples": []}).
import fs from 'node:fs'
import { buildPalette, contrast } from '../src/theme/colors.js'
import { normalizeTheme, CLASSIC_FALLBACK } from '../src/theme/themeModel.js'

const tw = fs.readFileSync(new URL('../tailwind.config.js', import.meta.url), 'utf8')
const tokens = [...tw.matchAll(/var\(--c-([a-z0-9-]+)\)/g)].map((m) => m[1])
const snap = JSON.parse(fs.readFileSync(new URL('./presets.snapshot.json', import.meta.url), 'utf8'))
const worlds = [...Object.values(snap.presets), ...(snap.samples || []), CLASSIC_FALLBACK].map(normalizeTheme)
const rgb = (s) => s.split(' ').map(Number)
let failures = 0
const check = (label, ratio, min) => {
  if (ratio < min) {
    failures++
    console.log(`  FAIL ${label}: ${ratio.toFixed(2)} < ${min}`)
  }
}
for (const t of worlds) {
  if (t.invalid) { failures++; console.log(`  FAIL ${t.label}: did not validate`); continue }
  const p = buildPalette(t.colors, t.mode)
  const missing = [...new Set(tokens)].filter((k) => !(`--c-${k}` in p))
  if (missing.length) { failures++; console.log(`  FAIL ${t.label}: missing tokens ${missing.join(', ')}`) }
  const g = (k) => rgb(p[`--c-${k}`])
  console.log(`${t.key || t.label} (${t.mode})`)
  check('on-surface / surface', contrast(g('on-surface'), g('surface')), 7)
  check('on-surface-variant / surface', contrast(g('on-surface-variant'), g('surface')), 4.5)
  check('on-surface / card', contrast(g('on-surface'), g('surface-container-lowest')), 7)
  check('on-surface-variant / card', contrast(g('on-surface-variant'), g('surface-container-lowest')), 4.5)
  for (const f of ['primary', 'secondary', 'tertiary']) {
    check(`on-${f} / ${f}`, contrast(g(`on-${f}`), g(f)), 4.5)
    check(`${f} (as text) / surface`, contrast(g(f), g('surface')), 3)
  }
  check('error / surface', contrast(g('error'), g('surface')), 3)
  check('on-primary-fixed / primary-fixed', contrast(g('on-primary-fixed'), g('primary-fixed')), 4.5)
}
console.log(failures ? `\n${failures} problem(s)` : `\nAll ${worlds.length} worlds OK (${new Set(tokens).size} tokens each)`)
process.exit(failures ? 1 : 0)
