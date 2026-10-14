import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import * as themeApi from '../api/theme'
import { useAuth } from './AuthContext'
import {
  applyTheme,
  normalizeTheme,
  CLASSIC_FALLBACK,
  DEFAULT_VOCAB,
  loadCachedTheme,
  saveCachedTheme,
  loadLastTheme,
  clearUserCache,
  loadCompanionSettings,
  saveCompanionSettings,
} from '../theme/themeModel'
import { fillLine } from '../theme/dialogue'
import { emitCompanion } from '../theme/companionBus'

const ThemeContext = createContext(null)

// Kept for backwards compatibility with older imports; fonts are now loaded by applyTheme().
export { loadFonts as loadGoogleFont } from '../theme/fonts'

/**
 * One theme system for the whole app.
 *
 *  server   undefined = not fetched yet · null = this user has no theme yet · object = saved theme
 *  preview  a validated, NOT yet saved theme being tried on (live preview)
 *  world    what the UI is actually showing right now = preview ?? saved ?? default
 *
 * The saved theme lives in the existing `user_themes` table (one row per user), so it follows the
 * account across refresh, logout/login and devices. The local cache is keyed by user id and only
 * prevents a flash of the default look on refresh.
 */
export function ThemeProvider({ children }) {
  const { isAuthenticated, user } = useAuth()
  const uid = user?.id ?? null
  const [server, setServer] = useState(undefined)
  const [preview, setPreview] = useState(null)
  const [previewRaw, setPreviewRaw] = useState(null)
  const [previewQuery, setPreviewQuery] = useState(null)
  const [companion, setCompanionState] = useState(loadCompanionSettings)
  const lastUid = useRef(null)

  // --- load the account's theme ---------------------------------------------------------
  const refresh = useCallback(async () => {
    try {
      const t = await themeApi.getTheme()
      setServer(t || null)
      if (uid) {
        if (t) saveCachedTheme(uid, t)
        else clearUserCache(uid)
      }
      return t
    } catch {
      // Network/API failure: keep whatever we have (cache) instead of kicking the user to onboarding.
      // (falls back to the classic look rather than treating a transient error as "no theme yet")
      setServer((prev) => (prev === undefined ? (loadCachedTheme(uid) ?? CLASSIC_FALLBACK) : prev))
      return null
    }
  }, [uid])

  useEffect(() => {
    if (isAuthenticated && uid) {
      lastUid.current = uid
      const cached = loadCachedTheme(uid)
      if (cached) setServer(cached) // instant paint; server answer replaces it below
      refresh()
    } else {
      setServer(undefined)
      setPreview(null)
      setPreviewRaw(null)
    }
  }, [isAuthenticated, uid, refresh])

  // --- what is on screen -----------------------------------------------------------------
  const saved = useMemo(() => (server ? normalizeTheme(server) : null), [server])
  const world = useMemo(() => {
    if (preview) return preview
    if (saved) return saved
    if (!isAuthenticated) {
      const last = loadLastTheme()
      return last ? normalizeTheme(last) : normalizeTheme(CLASSIC_FALLBACK)
    }
    return normalizeTheme(CLASSIC_FALLBACK)
  }, [preview, saved, isAuthenticated])

  useEffect(() => {
    applyTheme(world)
  }, [world])

  // --- actions ---------------------------------------------------------------------------
  const previewTheme = useCallback((raw, query = null) => {
    if (!raw) {
      setPreview(null)
      setPreviewRaw(null)
      setPreviewQuery(null)
      return null
    }
    const t = normalizeTheme(raw)
    setPreview(t)
    setPreviewRaw(raw)
    setPreviewQuery(query)
    return t
  }, [])

  const clearPreview = useCallback(() => previewTheme(null), [previewTheme])

  const afterSave = useCallback(
    (t) => {
      setServer(t)
      setPreview(null)
      setPreviewRaw(null)
      setPreviewQuery(null)
      if (uid) saveCachedTheme(uid, t)
      emitCompanion('theme_changed', {})
    },
    [uid],
  )

  const selectPreset = useCallback(
    async (key) => {
      const t = await themeApi.setPresetTheme(key)
      afterSave(t)
      return t
    },
    [afterSave],
  )

  /** Ask the backend to design a world from a description. Previews it; nothing is saved yet. */
  const generateCustom = useCallback(
    async (query) => {
      const raw = await themeApi.previewCustomTheme(query)
      const t = previewTheme(raw, query)
      if (t?.invalid) throw new Error('The generated theme was invalid. Please try a different description.')
      return t
    },
    [previewTheme],
  )

  /** Persist the currently previewed custom theme. */
  const saveCustom = useCallback(async () => {
    if (!previewRaw) return null
    const t = await themeApi.saveCustomTheme(previewRaw, previewQuery)
    afterSave(t)
    return t
  }, [previewRaw, previewQuery, afterSave])

  const setCompanion = useCallback((patch) => {
    setCompanionState((s) => {
      const next = { ...s, ...patch }
      saveCompanionSettings(next)
      return next
    })
  }, [])

  // --- themed wording ----------------------------------------------------------------------
  const vocab = world.vocab || DEFAULT_VOCAB
  const t = useCallback(
    (key, vars = {}) => fillLine(vocab[key] ?? DEFAULT_VOCAB[key] ?? key, { name: user?.name, ...vars }),
    [vocab, user?.name],
  )

  const value = useMemo(
    () => ({
      world,
      saved,
      theme: saved, // existing consumers: normalized saved theme (or null)
      loading: isAuthenticated && server === undefined,
      hasTheme: !!server,
      preview,
      isPreviewing: !!preview,
      previewTheme,
      clearPreview,
      selectPreset,
      generateCustom,
      saveCustom,
      refresh,
      vocab,
      t,
      companion,
      setCompanion,
    }),
    [world, saved, isAuthenticated, server, preview, previewTheme, clearPreview, selectPreset, generateCustom, saveCustom, refresh, vocab, t, companion, setCompanion],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
