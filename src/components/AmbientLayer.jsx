import { useMemo } from 'react'
import { useTheme } from '../context/ThemeContext'

// Restrained ambient particles per world (embers rising, stars twinkling, ...). Pure CSS animation,
// ~14 elements, hidden under prefers-reduced-motion, never intercepts clicks.
const KINDS = {
  embers: { cls: 'ambient-rise', glyph: '•' },
  runes: { cls: 'ambient-rise', glyph: '✧' },
  bits: { cls: 'ambient-fall', glyph: '1' },
  petals: { cls: 'ambient-fall', glyph: '❀' },
  stars: { cls: 'ambient-twinkle', glyph: '✦' },
  clouds: { cls: 'ambient-drift', glyph: '' },
}

function seeded(i, salt) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

export default function AmbientLayer() {
  const { world } = useTheme()
  const kind = KINDS[world.effects.ambient]
  const items = useMemo(() => {
    if (!kind) return []
    const n = world.effects.ambient === 'clouds' ? 5 : 14
    return Array.from({ length: n }, (_, i) => ({
      left: `${Math.round(seeded(i, 1) * 96)}%`,
      top: world.effects.ambient === 'clouds' || world.effects.ambient === 'stars' ? `${Math.round(seeded(i, 2) * 85)}%` : undefined,
      size: world.effects.ambient === 'clouds' ? 90 + seeded(i, 3) * 120 : 10 + seeded(i, 3) * 10,
      d: world.effects.ambient === 'clouds' ? 40 + seeded(i, 4) * 40 : 10 + seeded(i, 4) * 12,
      delay: -seeded(i, 5) * 20,
      dx: (seeded(i, 6) - 0.5) * 60,
    }))
  }, [kind, world.effects.ambient])

  if (!kind) return null
  return (
    <div className={`ambient-layer ${kind.cls}`} aria-hidden="true">
      {items.map((p, i) => (
        <span
          key={i}
          className="ambient-p"
          style={{
            left: p.left,
            top: p.top,
            fontSize: p.size,
            width: kind.glyph ? undefined : p.size,
            height: kind.glyph ? undefined : p.size * 0.5,
            '--d': `${p.d}s`,
            '--delay': `${p.delay}s`,
            '--dx': `${p.dx}px`,
          }}
        >
          {kind.glyph}
        </span>
      ))}
    </div>
  )
}
