import { hexToRgb, rgbToHex, mix } from '../../theme/colors'

// An original, generic little doll drawn in SVG. Everything that makes it
// "themed" is data: outfit colour (the "dress"), skin tone and one accessory.
// Adding a new dress later = adding a new accessory/outfit case below, or
// swapping this component for a sprite sheet — the roaming brain doesn't care.

const shade = (hex, t) => rgbToHex(mix(hexToRgb(hex), [0, 0, 0], t))
const tintc = (hex, t) => rgbToHex(mix(hexToRgb(hex), [255, 255, 255], t))

function Accessory({ kind, outfit, secondary }) {
  const dark = shade(outfit, 0.3)
  switch (kind) {
    case 'headband':
      return (
        <g>
          <rect x="17" y="14" width="46" height="7" rx="3.5" fill={outfit} />
          <path d="M62 17 l10 -5 l-2 10 z" fill={outfit} />
          <path d="M62 18 l9 6 l-9 1 z" fill={dark} />
        </g>
      )
    case 'cap':
      return (
        <g>
          <path d="M16 22 Q16 -4 40 -4 Q64 -4 64 22 Z" fill={outfit} />
          <path d="M40 22 h34 q4 0 4 4 h-38 z" fill={dark} />
          <circle cx="40" cy="-4" r="3" fill={dark} />
        </g>
      )
    case 'crown':
      return (
        <g>
          <path d="M20 14 L22 -6 L31 6 L40 -10 L49 6 L58 -6 L60 14 Z" fill="#FBBF24" stroke="#B7791F" strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="40" cy="-6" r="2.4" fill="#EF4444" />
          <circle cx="22" cy="-4" r="1.8" fill="#38BDF8" />
          <circle cx="58" cy="-4" r="1.8" fill="#38BDF8" />
        </g>
      )
    case 'cloud':
      return (
        <g className="mascot-float" fill="#FFFFFF" stroke="#BFDBFE" strokeWidth="1.2">
          <circle cx="28" cy="2" r="9" />
          <circle cx="41" cy="-3" r="11" />
          <circle cx="54" cy="3" r="8" />
          <rect x="24" y="2" width="34" height="9" rx="4.5" stroke="none" />
        </g>
      )
    case 'antenna':
      return (
        <g>
          <path d="M40 9 L40 -6" stroke={dark} strokeWidth="2.6" strokeLinecap="round" />
          <circle className="mascot-blink-light" cx="40" cy="-9" r="5" fill={secondary} />
        </g>
      )
    case 'glasses':
      return (
        <g fill="none" stroke="#1F2937" strokeWidth="2.2">
          <circle cx="30" cy="34" r="8.5" fill="#BAE6FD" fillOpacity="0.25" />
          <circle cx="50" cy="34" r="8.5" fill="#BAE6FD" fillOpacity="0.25" />
          <path d="M38.5 33 Q40 31.5 41.5 33" />
        </g>
      )
    case 'tuft':
      return (
        <g fill="none" stroke="#3B2A20" strokeWidth="3" strokeLinecap="round">
          <path d="M40 9 Q34 -2 38 -8" />
          <path d="M40 9 Q41 -4 47 -6" />
          <path d="M40 9 Q47 0 53 1" />
        </g>
      )
    case 'headphones':
      return (
        <g>
          <path d="M14 32 A26 28 0 0 1 66 32" fill="none" stroke={dark} strokeWidth="4" strokeLinecap="round" />
          <rect x="9" y="28" width="9" height="16" rx="4" fill={outfit} />
          <rect x="62" y="28" width="9" height="16" rx="4" fill={outfit} />
        </g>
      )
    case 'bow':
      return (
        <g transform="translate(54 8) rotate(15)">
          <path d="M0 0 L-11 -7 L-11 7 Z" fill={outfit} />
          <path d="M0 0 L11 -7 L11 7 Z" fill={outfit} />
          <circle r="3.2" fill={dark} />
        </g>
      )
    default:
      return null
  }
}

/**
 * @param {object}  props
 * @param {{accessory:string,outfit:string,skin:string}} props.mascot
 * @param {string}  props.secondary accent colour for small details
 * @param {'idle'|'talk'|'happy'|'annoyed'|'sleep'} props.mood
 * @param {boolean} props.walking
 */
export default function MascotDoll({ mascot, secondary = '#F59E0B', mood = 'idle', walking = false }) {
  const { accessory, outfit, skin } = mascot
  const outfitDark = shade(outfit, 0.25)
  const legColor = shade(outfit, 0.45)
  const skinDark = shade(skin, 0.12)
  // moods: idle | speaking | happy | thinking | celebrating | encourage | sleep   ('talk' kept as an alias)
  const asleep = mood === 'sleep'
  const celebrating = mood === 'celebrating'
  const happy = mood === 'happy' || celebrating
  const annoyed = mood === 'annoyed'
  const talking = mood === 'talk' || mood === 'speaking'
  const thinking = mood === 'thinking'
  const encourage = mood === 'encourage'

  return (
    <svg
      viewBox="-6 -16 92 112"
      width="100%"
      height="100%"
      aria-hidden="true"
      focusable="false"
      className={`mascot-svg ${walking ? 'is-walking' : 'is-idle'}`}
      style={{ overflow: 'visible' }}
    >
      <ellipse cx="40" cy="90" rx="20" ry="4" fill="rgba(0,0,0,0.18)" />

      <g className="mascot-body-group">
        {accessory === 'cape' && (
          <path d="M26 52 Q40 48 54 52 L62 84 Q40 92 18 84 Z" fill={outfitDark} className="mascot-cape" />
        )}
        {accessory === 'cap' && (
          <g>
            <path d="M51 53 Q65 53 65 68 L59 74 L52 68 Z" fill={outfitDark} stroke={tintc(outfitDark, 0.15)} strokeWidth="1.5" />
            <path d="M57 58 L60 58 L60 69 L57 69 Z" fill={tintc(outfit, 0.35)} />
          </g>
        )}

        {/* legs */}
        <g className="mascot-leg mascot-leg-l">
          <rect x="28" y="72" width="9" height="15" rx="4.5" fill={legColor} />
          <ellipse cx="31.5" cy="87" rx="6" ry="3" fill={tintc(legColor, 0.1)} />
        </g>
        <g className="mascot-leg mascot-leg-r">
          <rect x="43" y="72" width="9" height="15" rx="4.5" fill={legColor} />
          <ellipse cx="48.5" cy="87" rx="6" ry="3" fill={tintc(legColor, 0.1)} />
        </g>

        {/* arms */}
        <g className={`mascot-arm mascot-arm-l ${celebrating || happy ? 'is-cheer' : ''}`}>
          <path d="M26 58 L16 70" stroke={skinDark} strokeWidth="6" strokeLinecap="round" />
        </g>
        <g className={`mascot-arm mascot-arm-r ${happy || talking ? 'is-cheer' : ''}`}>
          <path d="M54 58 L64 70" stroke={skinDark} strokeWidth="6" strokeLinecap="round" />
        </g>

        {/* torso = the "dress" */}
        <rect x="23" y="50" width="34" height="29" rx="13" fill={outfit} />
        <path d="M30 56 Q40 62 50 56" fill="none" stroke={tintc(outfit, 0.35)} strokeWidth="2.4" strokeLinecap="round" opacity="0.7" />
        <circle cx="40" cy="68" r="2.6" fill={tintc(outfit, 0.45)} opacity="0.8" />

        {/* head */}
        <g fill="#5B3826">
          <circle cx="17" cy="27" r="8" />
          <circle cx="63" cy="27" r="8" />
        </g>
        <circle cx="40" cy="32" r="25" fill={skin} />
        <path d="M17 25 Q17 5 40 6 Q63 7 63 25 Q57 19 51 18 Q44 25 38 19 Q29 25 22 20 Z" fill="#5B3826" />
        <ellipse cx="24" cy="42" rx="4.6" ry="3" fill="#FB7185" opacity="0.45" />
        <ellipse cx="56" cy="42" rx="4.6" ry="3" fill="#FB7185" opacity="0.45" />

        {/* eyes */}
        {asleep ? (
          <g stroke="#1F2937" strokeWidth="2.4" strokeLinecap="round" fill="none">
            <path d="M26 35 q4 3 8 0" />
            <path d="M46 35 q4 3 8 0" />
          </g>
        ) : happy ? (
          <g stroke="#1F2937" strokeWidth="2.6" strokeLinecap="round" fill="none">
            <path d="M26 36 q4 -6 8 0" />
            <path d="M46 36 q4 -6 8 0" />
          </g>
        ) : (
          <g className="mascot-eyes">
            <ellipse cx="30" cy={thinking ? 32 : 34} rx="3.4" ry={annoyed ? 2.6 : 4.4} fill="#1F2937" />
            <ellipse cx="50" cy={thinking ? 32 : 34} rx="3.4" ry={annoyed ? 2.6 : 4.4} fill="#1F2937" />
            <circle cx={thinking ? 32 : 31.2} cy={thinking ? 30 : 32.4} r="1.2" fill="#fff" />
            <circle cx={thinking ? 52 : 51.2} cy={thinking ? 30 : 32.4} r="1.2" fill="#fff" />
          </g>
        )}
        {encourage && (
          <g stroke="#1F2937" strokeWidth="2.2" strokeLinecap="round" fill="none">
            <path d="M25 27 Q30 24 35 27" />
            <path d="M45 27 Q50 24 55 27" />
          </g>
        )}
        {annoyed && (
          <g stroke="#1F2937" strokeWidth="2.4" strokeLinecap="round">
            <path d="M25 26 L35 30" />
            <path d="M55 26 L45 30" />
          </g>
        )}

        {/* mouth */}
        {talking ? (
          <ellipse className="mascot-mouth-talk" cx="40" cy="46" rx="4" ry="3" fill="#7F1D1D" />
        ) : asleep ? (
          <ellipse cx="40" cy="46" rx="2.2" ry="2.6" fill="#7F1D1D" opacity="0.8" />
        ) : annoyed ? (
          <path d="M34 47 q3 -2 6 0 q3 2 6 0" fill="none" stroke="#7F1D1D" strokeWidth="2.2" strokeLinecap="round" />
        ) : thinking ? (
          <path d="M36 46 h8" fill="none" stroke="#7F1D1D" strokeWidth="2.4" strokeLinecap="round" />
        ) : happy ? (
          <path d="M33 43 q7 9 14 0 z" fill="#7F1D1D" />
        ) : (
          <path d="M34 44 q6 5 12 0" fill="none" stroke="#7F1D1D" strokeWidth="2.4" strokeLinecap="round" />
        )}

        <Accessory kind={accessory} outfit={outfit} secondary={secondary} />
      </g>

      {thinking && (
        <g className="mascot-thought" fill="currentColor">
          <circle cx="62" cy="2" r="1.8" />
          <circle cx="68" cy="-5" r="2.6" />
          <circle cx="76" cy="-13" r="3.6" />
        </g>
      )}
      {celebrating && (
        <g className="mascot-confetti" fontFamily="sans-serif" fontWeight="700">
          <text x="2" y="-4" fontSize="12" fill="#F59E0B">✦</text>
          <text x="70" y="-8" fontSize="14" fill="#EC4899">✧</text>
          <text x="76" y="14" fontSize="10" fill="#22C55E">✦</text>
          <text x="-6" y="16" fontSize="10" fill="#38BDF8">✧</text>
        </g>
      )}
      {asleep && (
        <g className="mascot-zzz" fill="currentColor" fontWeight="700" fontFamily="sans-serif">
          <text x="58" y="6" fontSize="12">z</text>
          <text x="66" y="-6" fontSize="16">Z</text>
        </g>
      )}
    </svg>
  )
}
