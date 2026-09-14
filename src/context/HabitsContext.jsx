import { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react'
import * as habitsApi from '../api/habits'
import * as categoriesApi from '../api/categories'
import * as statsApi from '../api/statistics'
import * as recApi from '../api/recommendations'
import { adaptHabit, adaptCategory, adaptRecommendation, habitFormToApi } from '../api/adapters'
import { ApiError } from '../api/client'
import { useAuth } from './AuthContext'

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

  const addHabit = useCallback(
    async (formData) => {
      const created = await habitsApi.createHabit(habitFormToApi(formData))
      await loadHabits()
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
      if (habit.completedToday) {
        await habitsApi.undoCompletion(id, todayISO())
      } else {
        await habitsApi.completeHabit(id, { completion_date: todayISO() })
      }
      await loadHabits()
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
