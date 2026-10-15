import { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react'
import * as habitsApi from '../api/habits'
import * as categoriesApi from '../api/categories'
import * as statsApi from '../api/statistics'
import * as recApi from '../api/recommendations'
import { adaptHabit, adaptCategory, adaptRecommendation, habitFormToApi } from '../api/adapters'
import { ApiError } from '../api/client'
import { useAuth } from './AuthContext'
import { emitCompanion } from '../theme/companionBus'
import {
  emitCompanionAction,
  getCompanionChanges,
  listCompanionDevices,
} from '../api/companion'

const MILESTONES = [3, 7, 14, 30, 50, 100]

const HabitsContext = createContext(null)

// Local calendar day as "YYYY-MM-DD" — deliberately NOT toISOString().slice(0,10),
// which reads the UTC day and can be a day off from the user's actual "today"
// depending on timezone. Used for completion_date, so it must match what the
// person sees on their screen.
function todayISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// This context is the single seam between UI and the real backend. Every
// method below calls the FastAPI backend (via src/api/*) and re-adapts the
// response into the flat shape the existing page/components expect (see
// src/api/adapters.js). No page-level code should need to change when the
// backend's actual schema evolves — only the adapters do.
export function HabitsProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [habits, setHabits] = useState([])
  const [statsById, setStatsById] = useState({}) // habit_id -> raw HabitStats (incl. monthly_trend), for Calendar day-detail
  const [categories, setCategories] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadCategories = useCallback(async () => {
    const cats = await categoriesApi.listCategories()
    setCategories(cats.map(adaptCategory))
  }, [])

  const loadHabits = useCallback(async () => {
    const raw = await habitsApi.listHabits()
    const statsMap = {}
    const withStats = await Promise.all(
      raw.map(async (h) => {
        try {
          const stats = await statsApi.habitStats(h.id)
          statsMap[h.id] = stats
          return adaptHabit(h, stats)
        } catch {
          // Stats can legitimately fail to compute for a brand-new habit with
          // no history yet — fall back to the raw habit with zeroed stats
          // rather than dropping it from the list.
          return adaptHabit(h, null)
        }
      }),
    )
    setHabits(withStats)
    setStatsById(statsMap)
  }, [])

  const loadRecommendations = useCallback(async () => {
    const recs = await recApi.listRecommendations()
    setRecommendations(recs.map(adaptRecommendation))
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([loadCategories(), loadHabits(), loadRecommendations()])
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load your data')
    } finally {
      setLoading(false)
    }
  }, [loadCategories, loadHabits, loadRecommendations])

  useEffect(() => {
    if (isAuthenticated) {
      refresh()
    } else {
      setHabits([])
      setCategories([])
      setRecommendations([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return undefined
    const refreshWhenVisible = () => {
      if (document.visibilityState !== 'visible') return
      loadHabits().catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Failed to refresh your habits')
      })
    }
    window.addEventListener('focus', refreshWhenVisible)
    document.addEventListener('visibilitychange', refreshWhenVisible)
    const interval = window.setInterval(refreshWhenVisible, 60_000)
    return () => {
      window.removeEventListener('focus', refreshWhenVisible)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
      window.clearInterval(interval)
    }
  }, [isAuthenticated, loadHabits])

  useEffect(() => {
    if (!isAuthenticated) return undefined
    let interval = null
    let stopped = false
    let inFlight = false
    let lastActionAt = null

    const stopPolling = () => {
      if (interval !== null) window.clearInterval(interval)
      interval = null
    }
    const onAction = (event) => {
      const actionType = event.detail?.action_type
      if (!actionType?.endsWith('_habit')) return
      loadHabits().catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Could not refresh companion changes')
      })
    }
    const startPolling = async () => {
      stopPolling()
      try {
        const devices = await listCompanionDevices()
        if (stopped || !devices.some((device) => device.paired_at && !device.revoked_at)) return
        const changes = await getCompanionChanges()
        lastActionAt = changes.action_at
        if (stopped) return
        if (changes.action_at) emitCompanionAction(changes.action_type)
        interval = window.setInterval(async () => {
          if (document.visibilityState !== 'visible' || inFlight) return
          inFlight = true
          try {
            const changes = await getCompanionChanges()
            if (changes.action_at && changes.action_at !== lastActionAt) {
              lastActionAt = changes.action_at
              emitCompanionAction(changes.action_type)
            }
          } catch (err) {
            stopPolling()
            setError(err instanceof ApiError ? err.message : 'Could not sync companion changes')
          } finally {
            inFlight = false
          }
        }, 3000)
      } catch (err) {
        if (!stopped) {
          setError(err instanceof ApiError ? err.message : 'Could not sync companion devices')
        }
      }
    }
    const onDeviceChange = () => startPolling()
    const onStorage = (event) => {
      if (event.key === 'habit_tracker_companion_devices') onDeviceChange()
      if (event.key === 'habit_tracker_companion_action' && event.newValue) {
        try {
          window.dispatchEvent(new CustomEvent('companion:action', {
            detail: JSON.parse(event.newValue),
          }))
        } catch {
          setError('Could not read a companion update from another tab')
        }
      }
    }

    window.addEventListener('companion:action', onAction)
    window.addEventListener('companion:devices-changed', onDeviceChange)
    window.addEventListener('storage', onStorage)
    startPolling()
    return () => {
      stopped = true
      stopPolling()
      window.removeEventListener('companion:action', onAction)
      window.removeEventListener('companion:devices-changed', onDeviceChange)
      window.removeEventListener('storage', onStorage)
    }
  }, [isAuthenticated, loadHabits])

  const addHabit = useCallback(
    async (formData) => {
      const created = await habitsApi.createHabit(habitFormToApi(formData))
      await loadHabits()
      emitCompanion('habit_created', { habit: formData?.name })
      return created
    },
    [loadHabits],
  )

  const editHabit = useCallback(
    async (id, formData) => {
      const updated = await habitsApi.updateHabit(id, habitFormToApi(formData))
      await loadHabits()
      return updated
    },
    [loadHabits],
  )

  const removeHabit = useCallback(
    async (id) => {
      await habitsApi.deleteHabit(id)
      await loadHabits()
    },
    [loadHabits],
  )

  const archive = useCallback(
    async (id) => {
      await habitsApi.archiveHabit(id)
      await loadHabits()
    },
    [loadHabits],
  )

  const restore = useCallback(
    async (id) => {
      await habitsApi.restoreHabit(id)
      await loadHabits()
    },
    [loadHabits],
  )

  const toggleComplete = useCallback(
    async (id) => {
      const habit = habits.find((h) => h.id === id)
      if (!habit) return
      const wasDone = habit.completedToday
      if (wasDone) {
        await habitsApi.undoCompletion(id, todayISO())
      } else {
        await habitsApi.completeHabit(id, { completion_date: todayISO() })
      }
      await loadHabits()
      if (wasDone) {
        emitCompanion('habit_undone', { habit: habit.name })
      } else {
        const pending = habits.filter((h) => h.active && !h.completedToday && h.id !== id)
        const streak = (habit.streak || 0) + 1
        emitCompanion('habit_done', {
          habit: habit.name,
          remaining: pending.length,
          next: pending[0]?.name,
          streak,
          milestone: MILESTONES.includes(streak),
        })
      }
    },
    [habits, loadHabits],
  )

  const respondRecommendation = useCallback(
    async (id, status) => {
      if (status === 'accepted') await recApi.acceptRecommendation(id)
      else await recApi.rejectRecommendation(id)
      await loadRecommendations()
    },
    [loadRecommendations],
  )

  const getHabit = useCallback((id) => habits.find((h) => String(h.id) === String(id)) || null, [habits])

  const value = useMemo(
    () => ({
      habits,
      statsById,
      categories,
      recommendations,
      loading,
      error,
      refresh,
      addHabit,
      editHabit,
      removeHabit,
      archive,
      restore,
      toggleComplete,
      respondRecommendation,
      getHabit,
    }),
    [
      habits,
      statsById,
      categories,
      recommendations,
      loading,
      error,
      refresh,
      addHabit,
      editHabit,
      removeHabit,
      archive,
      restore,
      toggleComplete,
      respondRecommendation,
      getHabit,
    ],
  )

  return <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>
}

export function useHabits() {
  const ctx = useContext(HabitsContext)
  if (!ctx) throw new Error('useHabits must be used within HabitsProvider')
  return ctx
}
