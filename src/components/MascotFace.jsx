import MascotDoll from './companion/MascotDoll'
import { ACCESSORIES } from '../theme/themeModel'

// Kept as the shared "face" component (used by ThemeSelect cards and Profile). It now renders the
// themed doll: pass `mascot` (+ `secondary`) for the full outfit/accessory, or just `accent` for
// the legacy look. `talking` is kept for older call sites.
export default function MascotFace({ accent = '#4f46e5', mascot, secondary, size = 64, talking = false, mood, walking = false, className = '' }) {
  const m = mascot || { accessory: 'none', outfit: accent, skin: '#fde0c4' }
  const safe = { ...m, accessory: ACCESSORIES.includes(m.accessory) ? m.accessory : 'none' }
  return (
    <div className={className} style={{ width: size, height: size * 1.2 }}>
      <MascotDoll mascot={safe} secondary={secondary || accent} mood={mood || (talking ? 'speaking' : 'idle')} walking={walking} />
    </div>
  )
}
