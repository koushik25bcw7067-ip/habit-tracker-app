import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import MascotDoll from './companion/MascotDoll'
import Icon from './ui/Icon'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useHabits } from '../context/HabitsContext'
import { listTasks } from '../api/tasks'
import { onCompanion } from '../theme/companionBus'
import { pickLine, pageLine } from '../theme/dialogue'
import { isPendingToday, todayLocalISO } from '../theme/habitUtils'

// ---------------------------------------------------------------------------
// The companion: ONE component, mounted once in App, visible on every route (login and register
// included). It is docked in the bottom-right corner (above the mobile nav), can be minimised,
// and never roams over the page unless the user opts in ("stroll" along the bottom edge).
//
// It speaks only when something meaningful happens (events from companionBus, opening a page,
// a gentle nudge about overdue work) and obeys cooldowns — there is no random chatter timer.
// Lines come from the active world; {placeholders} are filled from real habit/task data.
// ---------------------------------------------------------------------------

const PAGE_KEYS = {
  dashboard: 'dashboard', habits: 'habits', tasks: 'tasks', goals: 'goals', calendar: 'calendar',
  statistics: 'statistics', recommendations: 'recommendations', report: 'report', companion: 'companion',
  achievements: 'achievements', reminders: 'reminders', profile: 'profile',
}
const FORM_ROUTE = /^\/habits\/(new|\d+\/edit)/
const UNSOLICITED_COOLDOWN = 25_000
const PAGE_LINE_COOLDOWN = 180_000
const NUDGE_COOLDOWN = 600_000
const DOCK_W = 64
const SIZES = { normal: { w: 64, h: 78 }, compact: { w: 44, h: 54 } }

const MOOD_FOR_EVENT = { celebrating: 'celebrating', happy: 'happy', encourage: 'encourage', thinking: 'thinking', speaking: 'speaking' }

export default function FloatingMascot() {
  const { world, companion, setCompanion, t } = useTheme()
  const { isAuthenticated, user } = useAuth()
  const { habits } = useHabits()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const [tasks, setTasks] = useState([])
  const [mood, setMood] = useState('idle')
  const [bubble, setBubble] = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelLine, setPanelLine] = useState('')
  const [walking, setWalking] = useState(false)
  const [offset, setOffset] = useState(0) // stroll offset in px (moves left from the dock)
  const [facing, setFacing] = useState(1)
  const [bubbleShift, setBubbleShift] = useState(0)

  const recent = useRef([])
  const lastSpoke = useRef(0)
  const timers = useRef({ bubble: null, walk: null })
  const bubbleRef = useRef(null)
  const btnRef = useRef(null)
  const panelRef = useRef(null)
  const pageSeen = useRef({})
  const lastNudge = useRef(Date.now())
  const encouragedDay = useRef('')

  // Always-fresh data for long-lived callbacks.
  const data = useRef({})
  data.current = { world, habits, tasks, name: user?.name, authed: isAuthenticated, panelOpen, t, companion }

  const compact = FORM_ROUTE.test(pathname)
  const size = compact ? SIZES.compact : SIZES.normal
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  // ---- tasks ------------------------------------------------------------------------
  useEffect(() => {
    if (!isAuthenticated) {
      setTasks([])
      return undefined
    }
    let alive = true
    const load = () => listTasks().then((r) => alive && setTasks(Array.isArray(r) ? r : [])).catch(() => {})
    load()
    const id = setInterval(load, 180_000)
    const off = onCompanion((type) => {
      if (type === 'task_done' || type === 'task_created') setTimeout(load, 500)
    })
    return () => {
      alive = false
      clearInterval(id)
      off()
    }
  }, [isAuthenticated])

  // ---- context snapshot ---------------------------------------------------------------
  const getCtx = useCallback(() => {
    const d = data.current
    const today = todayLocalISO()
    const pending = (d.tasks || []).filter((x) => x.status === 'pending')
    const overdue = pending.filter((x) => x.due_date && x.due_date < today).sort((a, b) => a.due_date.localeCompare(b.due_date))
    const dueToday = pending.filter((x) => x.due_date === today)
    const pendingHabits = (d.habits || []).filter((h) => isPendingToday(h))
    return {
      name: d.name,
      task: (overdue[0] || dueToday[0])?.title,
      habit: pendingHabits[0]?.name,
      count: pendingHabits.length,
      streak: Math.max(0, ...(d.habits || []).map((h) => h.streak || 0)) || undefined,
      overdueCount: overdue.length,
      dueCount: dueToday.length,
      overdueTask: overdue[0]?.title,
    }
  }, [])

  // ---- speaking -----------------------------------------------------------------------
  const quiet = useCallback(() => {
    const el = document.activeElement
    const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')
    return document.hidden || typing || data.current.panelOpen || data.current.companion?.chatter === "quiet"
  }, [])

  const show = useCallback((text, nextMood = 'speaking') => {
    if (!text) return
    const tm = timers.current
    clearTimeout(tm.bubble)
    setBubble({ id: Date.now(), text })
    setMood(nextMood)
    lastSpoke.current = Date.now()
    tm.bubble = setTimeout(() => {
      setBubble(null)
      setMood('idle')
    }, 3600 + text.length * 45)
  }, [])

  const say = useCallback(
    (group, { mood: m = 'speaking', vars = {}, unsolicited = false } = {}) => {
      const now = Date.now()
      if (unsolicited && (now - lastSpoke.current < UNSOLICITED_COOLDOWN || quiet())) return false
      if (!unsolicited && now - lastSpoke.current < 400) return false
      const ctx = { ...getCtx(), ...vars }
      const text = pickLine(data.current.world.lines?.[group], ctx, recent.current)
      if (!text) return false
      show(text, m)
      return true
    },
    [getCtx, quiet, show],
  )

  // ---- reactions to app events --------------------------------------------------------
  useEffect(() => {
    return onCompanion((type, p) => {
      if (!data.current.authed && type !== 'theme_changed') return
      switch (type) {
        case 'habit_created':
          say('habit_created', { mood: 'happy', vars: { habit: p.habit } })
          break
        case 'habit_done':
          if (p.milestone) say('streak', { mood: 'celebrating', vars: { streak: p.streak, habit: p.habit } })
          else if (p.remaining === 0) say('milestone', { mood: 'celebrating', vars: { habit: p.habit } })
          else say('habit_done', { mood: 'happy', vars: { habit: p.habit } })
          break
        case 'habit_undone':
          say('habit_undone', { mood: 'encourage', vars: { habit: p.habit } })
          break
        case 'task_created':
          say('task_created', { mood: 'happy', vars: { task: p.task } })
          break
        case 'task_done':
          say('task_done', { mood: p.remaining === 0 ? 'celebrating' : 'happy', vars: { task: p.task } })
          break
        case 'achievement':
        case 'milestone':
          say('milestone', { mood: 'celebrating' })
          break
        case 'theme_changed':
          setTimeout(() => say('greeting', { mood: 'happy' }), 400)
          break
        case 'thinking':
          say('thinking', { mood: 'thinking' })
          break
        case 'speak':
          show(String(p.text || '').slice(0, 140), MOOD_FOR_EVENT[p.mood] || 'speaking')
          break
        default:
      }
    })
  }, [say, show])

  // ---- greeting once per session, page lines on navigation ------------------------------
  const greeted = useRef(false)
  useEffect(() => {
    if (!isAuthenticated || !user?.id || greeted.current) return undefined
    const key = `mini_ai_greeted_${user.id}`
    try {
      if (sessionStorage.getItem(key)) {
        greeted.current = true
        return undefined
      }
    } catch {
      /* ignore */
    }
    greeted.current = true
    const id = setTimeout(() => {
      say('greeting', { mood: 'happy' })
      try {
        sessionStorage.setItem(key, '1')
      } catch {
        /* ignore */
      }
    }, 1400)
    return () => clearTimeout(id)
  }, [isAuthenticated, user?.id, say])

  useEffect(() => {
    if (!isAuthenticated) return undefined
    const seg = pathname.split('/')[1]
    const key = PAGE_KEYS[seg]
    if (!key) return undefined
    const now = Date.now()
    if (now - (pageSeen.current[key] || 0) < PAGE_LINE_COOLDOWN) return undefined
    const id = setTimeout(() => {
      if (Date.now() - lastSpoke.current < UNSOLICITED_COOLDOWN || quiet()) return
      const text = pageLine(data.current.world, key, getCtx())
      if (text) {
        pageSeen.current[key] = Date.now()
        show(text, 'speaking')
      }
    }, 900)
    return () => clearTimeout(id)
  }, [pathname, isAuthenticated, getCtx, quiet, show])

  // ---- gentle nudges about overdue work (rare, cooldown-bound) --------------------------
  useEffect(() => {
    if (!isAuthenticated) return undefined
    const id = setInterval(() => {
      const now = Date.now()
      if (now - lastNudge.current < NUDGE_COOLDOWN) return
      const ctx = getCtx()
      const day = todayLocalISO()
      let spoke = false
      if (ctx.overdueCount >= 3 && encouragedDay.current !== day) {
        spoke = say('encourage', { mood: 'encourage', unsolicited: true })
        if (spoke) encouragedDay.current = day
      } else if (ctx.overdueTask) {
        spoke = say('missed', { mood: 'speaking', unsolicited: true, vars: { task: ctx.overdueTask, habit: undefined } })
      } else if (new Date().getHours() >= 18 && ctx.count > 0) {
        spoke = say('missed', { mood: 'speaking', unsolicited: true, vars: { task: undefined } })
      }
      if (spoke) lastNudge.current = now
    }, 60_000)
    return () => clearInterval(id)
  }, [isAuthenticated, getCtx, say])

  // ---- optional stroll along the bottom edge (opt-in) ------------------------------------
  useEffect(() => {
    if (!companion.roam || reduceMotion || companion.minimized || panelOpen || compact) {
      setWalking(false)
      if (companion.roam === false || panelOpen) setOffset(0)
      return undefined
    }
    let id
    const step = () => {
      if (!bubble) {
        const max = Math.max(0, window.innerWidth - DOCK_W - 40)
        setOffset((prev) => {
          const next = Math.round(Math.random() * max)
          setFacing(next > prev ? -1 : 1) // offset grows to the left
          return next
        })
        setWalking(true)
        clearTimeout(timers.current.walk)
        timers.current.walk = setTimeout(() => setWalking(false), 4000)
      }
      id = setTimeout(step, 9000 + Math.random() * 7000)
    }
    id = setTimeout(step, 4000)
    return () => {
      clearTimeout(id)
      clearTimeout(timers.current.walk)
    }
  }, [companion.roam, companion.minimized, panelOpen, compact, reduceMotion, bubble])

  useEffect(
    () => () => {
      clearTimeout(timers.current.bubble)
      clearTimeout(timers.current.walk)
    },
    [],
  )

  // keep the bubble inside the viewport
  useEffect(() => {
    const el = bubbleRef.current
    if (!el) {
      setBubbleShift(0)
      return
    }
    const r = el.getBoundingClientRect()
    setBubbleShift(r.left < 8 ? 8 - r.left : 0)
  }, [bubble, offset])

  // ---- panel ---------------------------------------------------------------------------
  const openPanel = useCallback(() => {
    setBubble(null)
    clearTimeout(timers.current.bubble)
    setOffset(0)
    const pool = data.current.world.lines
    const text = pickLine([...(pool.poke || []), ...(pool.idle || [])], getCtx(), recent.current)
    setPanelLine(text || '')
    setMood('happy')
    setPanelOpen(true)
  }, [getCtx])

  const closePanel = useCallback(() => {
    setPanelOpen(false)
    setMood('idle')
    btnRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!panelOpen) return undefined
    panelRef.current?.querySelector('button')?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') closePanel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [panelOpen, closePanel])

  const anotherLine = () => {
    const pool = world.lines
    const group = Math.random() < 0.5 ? 'idle' : 'encourage'
    setPanelLine(pickLine(pool[group], getCtx(), recent.current) || panelLine)
  }

  const go = (to) => {
    closePanel()
    navigate(to)
  }

  if (!companion.enabled) return null
  const ctx = getCtx()

  // ---- minimised chip ------------------------------------------------------------------
  const dockPos = isAuthenticated
    ? 'bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-5 right-3 md:right-5'
    : 'bottom-4 right-3 md:right-5'

  if (companion.minimized) {
    return (
      <div className={`fixed z-40 ${dockPos}`}>
        <button
          type="button"
          onClick={() => setCompanion({ minimized: false })}
          aria-label={`Show ${world.mascot.name}, your companion`}
          className="w-11 h-11 rounded-full bg-primary text-on-primary shadow-card-2 flex items-center justify-center text-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary outline-none"
        >
          <span aria-hidden>{world.mascot.emoji}</span>
        </button>
      </div>
    )
  }

  const effectiveMood = panelOpen && mood === 'idle' ? 'happy' : mood
  const quick = [
    { label: `Today's ${t('habits').toLowerCase()}`, icon: 'checklist', to: '/habits' },
    { label: `Add ${t('habit').toLowerCase()}`, icon: 'add_circle', to: '/habits/new' },
    { label: `${t('tasks')}`, icon: 'task_alt', to: '/tasks' },
    { label: 'Ask the AI', icon: 'auto_awesome', to: '/companion' },
  ]

  return (
    <div className={`fixed z-40 ${dockPos} pointer-events-none`} data-companion>
      <div
        className="companion-dock relative pointer-events-none"
        style={{ transform: `translateX(${-offset}px)`, width: size.w, height: size.h }}
      >
        {bubble && !panelOpen && (
          <div
            key={bubble.id}
            ref={bubbleRef}
            role="status"
            onClick={openPanel}
            className="mascot-bubble pointer-events-auto cursor-pointer"
            style={{ left: 'auto', right: 0, transform: `translateX(${bubbleShift}px)`, animation: 'none' }}
          >
            {bubble.text}
            <span className="mascot-bubble-tail" style={{ left: 'auto', right: size.w / 2 - 6, transform: 'rotate(45deg)' }} />
          </div>
        )}

        {panelOpen && (
          <div
            ref={panelRef}
            role="dialog"
            aria-label={`${world.mascot.name} companion panel`}
            className="companion-panel pointer-events-auto absolute right-0 bottom-full mb-2 w-[min(300px,calc(100vw-24px))] rounded-xl bg-surface-container-lowest text-on-surface border border-primary/40 shadow-popover p-3.5 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-display text-headline-sm text-on-surface truncate">{world.mascot.name}</div>
                <div className="text-label-sm text-on-surface-variant truncate">{world.label}</div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    closePanel()
                    setCompanion({ minimized: true })
                  }}
                  aria-label="Minimise companion"
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-low text-on-surface-variant"
                >
                  <Icon name="remove" size={18} />
                </button>
                <button
                  type="button"
                  onClick={closePanel}
                  aria-label="Close companion panel"
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-low text-on-surface-variant"
                >
                  <Icon name="close" size={18} />
                </button>
              </div>
            </div>

            <p className="text-body-md text-on-surface bg-surface-container-low rounded-lg px-3 py-2.5">{panelLine}</p>

            {isAuthenticated && (
              <>
                <p className="text-body-sm text-on-surface-variant">
                  {ctx.count} {ctx.count === 1 ? t('habit').toLowerCase() : t('habits').toLowerCase()} pending today
                  {' · '}
                  {ctx.overdueCount + ctx.dueCount} {t('tasks').toLowerCase()} due
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {quick.map((q) => (
                    <button
                      key={q.to}
                      type="button"
                      onClick={() => go(q.to)}
                      className="min-h-[44px] px-2.5 rounded-md bg-surface-container-low hover:bg-surface-container text-left text-label-md text-on-surface flex items-center gap-1.5"
                    >
                      <Icon name={q.icon} size={16} className="text-primary flex-shrink-0" />
                      <span className="truncate">{q.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="flex items-center justify-between gap-2">
              <button type="button" onClick={anotherLine} className="text-label-md text-primary hover:underline">
                Another line
              </button>
              {isAuthenticated && (
                <button type="button" onClick={() => go('/theme-select')} className="text-label-md text-primary hover:underline">
                  Change world
                </button>
              )}
            </div>
          </div>
        )}

        <button
          ref={btnRef}
          type="button"
          onClick={() => (panelOpen ? closePanel() : openPanel())}
          aria-label={`${world.mascot.name}, your companion. ${panelOpen ? 'Close' : 'Open'} panel`}
          aria-expanded={panelOpen}
          className="pointer-events-auto block w-full h-full rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <div style={{ transform: `scaleX(${facing})`, width: '100%', height: '100%' }}>
            <MascotDoll mascot={world.mascot} secondary={world.colors.secondary} mood={effectiveMood} walking={walking} />
          </div>
        </button>
      </div>
    </div>
  )
}
