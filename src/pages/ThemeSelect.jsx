import { useEffect, useState, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import MascotFace from '../components/MascotFace'
import { LoadingState, ErrorState } from '../components/ui/States'
import * as themeApi from '../api/theme'
import { useTheme } from '../context/ThemeContext'
import { normalizeTheme } from '../theme/themeModel'
import { loadFonts } from '../theme/fonts'
import { emitCompanion } from '../theme/companionBus'
import { ApiError } from '../api/client'

const MODES = ['All', 'Light', 'Dark']
const SAMPLE_CUSTOM = [
  'A peaceful celestial world with a tiny moon spirit and lavender colours',
  'Epic royal kingdom of gold and dark stone',
  'Cyberpunk rooftop at night, neon pink and blue',
  'Attack on Titan-inspired military expedition world: dark stone, forest olive, muted crimson and parchment maps',
]

function WorldCard({ k, raw, active, previewing, onPreview }) {
  const w = useMemo(() => normalizeTheme({ ...raw, preset_key: k }), [raw, k])
  return (
    <button
      type="button"
      onClick={() => onPreview(k, raw)}
      aria-pressed={previewing}
      className={`text-left rounded-xl p-3.5 border-2 transition-all active:scale-[0.99] flex flex-col gap-3 focus-visible:ring-2 focus-visible:ring-primary outline-none ${
        previewing ? 'border-primary shadow-card-2' : 'border-transparent shadow-card-1 hover:shadow-card-2'
      }`}
      style={{ background: w.colors.background, color: w.colors.text }}
    >
      <div className="flex items-start gap-3">
        <MascotFace mascot={w.mascot} secondary={w.colors.secondary} size={52} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[17px] leading-tight font-bold" style={{ fontFamily: `'${w.fonts.display}', sans-serif` }}>
              {w.label}
            </span>
            {active && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: w.colors.primary, color: w.mode === 'dark' ? '#0b0b0f' : '#fff' }}>
                IN USE
              </span>
            )}
          </div>
          <div className="text-[12px] leading-snug opacity-75 mt-0.5 line-clamp-2" style={{ fontFamily: `'${w.fonts.body}', sans-serif` }}>
            {w.description}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1" aria-label="Colour palette">
          {[w.colors.primary, w.colors.secondary, w.colors.tertiary, w.colors.background, w.colors.text].map((c, i) => (
            <span key={i} className="w-4 h-4 rounded-full border border-black/15" style={{ background: c }} />
          ))}
        </div>
        <span className="text-[11px] opacity-70" style={{ fontFamily: `'${w.fonts.body}', sans-serif` }}>
          <b style={{ fontFamily: `'${w.fonts.display}', sans-serif` }}>Aa</b> {w.fonts.display}
        </span>
      </div>
      <div className="text-[12px] italic opacity-80 border-t pt-2" style={{ borderColor: `${w.colors.text}22`, fontFamily: `'${w.fonts.body}', sans-serif` }}>
        “{(w.lines.idle[0] || '').replace(/\{\w+\}/g, '').trim()}”
        <span className="not-italic font-semibold"> — {w.mascot.name}</span>
      </div>
    </button>
  )
}

export default function ThemeSelect() {
  const navigate = useNavigate()
  const { saved, hasTheme, preview, previewTheme, clearPreview, selectPreset, generateCustom, saveCustom } = useTheme()
  const [presets, setPresets] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState('All')
  const [search, setSearch] = useState('')
  const [previewKind, setPreviewKind] = useState(null) // {type:'preset', key} | {type:'custom', query}
  const [applying, setApplying] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [customError, setCustomError] = useState('')
  const [applyError, setApplyError] = useState('')
  const [applied, setApplied] = useState('')
  const [wasOnboarding] = useState(!hasTheme)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await themeApi.listPresets()
      setPresets(data)
      Object.values(data).forEach((p) => p?.fonts && loadFonts(p.fonts)) // so each card shows its own typography
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load worlds')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // leaving the page without applying must restore the saved look
  useEffect(() => () => clearPreview(), [clearPreview])

  const filtered = useMemo(() => {
    if (!presets) return []
    const q = search.trim().toLowerCase()
    return Object.entries(presets).filter(([k, p]) => {
      if (mode !== 'All' && (p.mode || 'light') !== mode.toLowerCase()) return false
      if (!q) return true
      return `${p.label} ${p.description} ${p.mascot?.name || ''} ${k}`.toLowerCase().includes(q)
    })
  }, [presets, mode, search])

  function onPreviewPreset(key, raw) {
    setApplied('')
    setApplyError('')
    previewTheme({ ...raw, preset_key: key })
    setPreviewKind({ type: 'preset', key })
  }

  async function onGenerate(e) {
    e?.preventDefault()
    const q = query.trim()
    if (q.length < 2) {
      setCustomError('Describe the world in a few words, for example “Epic royal kingdom of gold and dark stone”.')
      return
    }
    setGenerating(true)
    setCustomError('')
    setApplied('')
    emitCompanion('thinking')
    try {
      await generateCustom(q)
      setPreviewKind({ type: 'custom', query: q })
    } catch (err) {
      setCustomError(
        err instanceof ApiError && err.status === 429
          ? 'Too many tries. Wait a minute, or use one of the presets for now.'
          : err instanceof ApiError
            ? `Custom worlds are unavailable right now (${err.message}). You can still pick a preset.`
            : err.message || 'Could not generate that world. You can still pick a preset.',
      )
    } finally {
      setGenerating(false)
    }
  }

  async function onApply() {
    if (!previewKind) return
    setApplying(true)
    setApplyError('')
    try {
      if (previewKind.type === 'preset') await selectPreset(previewKind.key)
      else await saveCustom()
      setPreviewKind(null)
      if (wasOnboarding) navigate('/dashboard', { replace: true })
      else setApplied('World applied and saved to your account.')
    } catch (err) {
      setApplyError(err instanceof ApiError ? err.message : 'Could not save this world. Please try again.')
    } finally {
      setApplying(false)
    }
  }

  function onCancel() {
    clearPreview()
    setPreviewKind(null)
    setApplyError('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <LoadingState label="Loading worlds…" />
      </div>
    )
  }
  if (error && !presets) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-gutter">
        <ErrorState description={error} onRetry={load} />
      </div>
    )
  }

  const previewing = !!preview && !!previewKind
  const activeKey = saved?.key || null

  return (
    <div className="min-h-screen bg-surface text-on-surface pb-32">
      {/* Sticky top bar: live preview status + Apply (kept at the top so the companion in the corner never covers it) */}
      <div className="sticky top-0 z-40 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/50 pt-safe">
        <div className="max-w-3xl mx-auto px-gutter h-14 flex items-center justify-between gap-3">
          <div className="min-w-0 text-body-sm">
            {previewing ? (
              <span>
                Previewing <b className="font-display">{preview.label}</b> — this is how the whole app will look.
              </span>
            ) : applied ? (
              <span className="text-tertiary-strong">{applied}</span>
            ) : (
              <span className="text-on-surface-variant">Tap a world to preview it live.</span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {previewing && (
              <Button variant="ghost" size="sm" onClick={onCancel} disabled={applying}>
                Cancel
              </Button>
            )}
            <Button size="sm" onClick={onApply} disabled={!previewing || applying}>
              {applying ? 'Applying…' : 'Apply theme'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-gutter pt-6 flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-display text-headline-lg text-on-surface">Choose your world</h1>
            {hasTheme && (
              <Link to="/profile" className="text-label-md text-primary hover:underline">
                Back to profile
              </Link>
            )}
          </div>
          <p className="text-body-md text-on-surface-variant">
            Every world changes the colours, fonts, wording and your little companion across the whole app. Your routines and data never change.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search worlds…"
              aria-label="Search worlds"
              className="w-full h-11 pl-10 pr-3 rounded-md bg-surface-container-lowest border border-outline-variant text-body-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex rounded-md bg-surface-container-low p-1" role="group" aria-label="Filter by mode">
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={`px-3.5 h-9 rounded text-label-md ${mode === m ? 'bg-surface-container-lowest text-primary shadow-card-1' : 'text-on-surface-variant'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filtered.map(([k, p]) => (
            <WorldCard
              key={k}
              k={k}
              raw={p}
              active={activeKey === k}
              previewing={previewKind?.type === 'preset' && previewKind.key === k}
              onPreview={onPreviewPreset}
            />
          ))}
          {filtered.length === 0 && <p className="text-body-md text-on-surface-variant col-span-full">No worlds match “{search}”.</p>}
        </div>

        {/* Custom world */}
        <form onSubmit={onGenerate} className="rounded-xl bg-surface-container-lowest shadow-card-1 p-4 flex flex-col gap-3">
          <div>
            <h2 className="font-display text-headline-md text-on-surface flex items-center gap-2">
              <Icon name="auto_awesome" size={20} className="text-secondary" /> Create your own world
            </h2>
            <p className="text-body-sm text-on-surface-variant mt-1">
              Describe it in your own words. We design an original palette, fonts, wording and companion — never copied artwork or dialogue — and you preview it before applying.
            </p>
          </div>
          <label htmlFor="custom-world" className="sr-only">
            Describe your world
          </label>
          <textarea
            id="custom-world"
            rows={2}
            maxLength={200}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setCustomError('')
            }}
            placeholder="e.g. A peaceful celestial world with a tiny moon spirit, lavender colours and encouraging dialogue."
            className="w-full px-3 py-2.5 rounded-md bg-surface-container-low border border-outline-variant text-body-md text-on-surface placeholder:text-on-surface-variant/70 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
          />
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_CUSTOM.map((s) => (
              <button key={s} type="button" onClick={() => setQuery(s)} className="px-2.5 py-1 rounded-full bg-surface-container text-label-sm text-on-surface-variant hover:bg-surface-container-high text-left">
                {s}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-label-sm text-on-surface-variant">{query.length}/200</span>
            <Button type="submit" variant="secondary" disabled={generating}>
              {generating ? 'Designing…' : 'Generate & preview'}
            </Button>
          </div>
          {customError && (
            <p role="alert" className="text-body-sm text-error">
              {customError}
            </p>
          )}
          {previewKind?.type === 'custom' && preview?.source === 'fallback' && (
            <p className="text-body-sm text-on-surface-variant">
              The AI service isn't available, so this is a simpler generated look. You can still apply it or pick a preset.
            </p>
          )}
        </form>
        {applyError && (
          <p role="alert" className="text-body-sm text-error">
            {applyError}
          </p>
        )}
      </div>
    </div>
  )
}
