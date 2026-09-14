import { useEffect, useState, useCallback, useMemo } from 'react'
import Icon from '../components/ui/Icon'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import CalendarGrid from '../components/CalendarGrid'
import { LoadingState, ErrorState } from '../components/ui/States'
import { getCalendarMonth } from '../api/calendar'
import { dailyStats, monthlyStats } from '../api/statistics'
import { adaptCalendarDay, parseISODateLocal } from '../api/adapters'
import { useHabits } from '../context/HabitsContext'
import { ApiError } from '../api/client'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function isoFor(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function CalendarPage() {
  const { habits, statsById } = useHabits()
  const now = new Date()
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [selectedDate, setSelectedDate] = useState(now.getDate())
  const [days, setDays] = useState(null)
  const [summary, setSummary] = useState(null)
  const [dayDetail, setDayDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const startWeekday = (new Date(cursor.year, cursor.month, 1).getDay() + 6) % 7 // Mon=0

  const loadMonth = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [cal, month] = await Promise.all([
        getCalendarMonth(cursor.year, cursor.month + 1),
        monthlyStats(cursor.year, cursor.month + 1),
      ])
      const today = todayISO()
      setDays(cal.days.map((d) => adaptCalendarDay(d, today)))
      setSummary(month)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load the calendar')
    } finally {
      setLoading(false)
    }
  }, [cursor])

  useEffect(() => {
    loadMonth()
  }, [loadMonth])

  useEffect(() => {
    const dateISO = isoFor(cursor.year, cursor.month, selectedDate)
    let cancelled = false
    dailyStats(dateISO)
      .then((s) => {
        if (!cancelled) setDayDetail({ ...s, dateISO })
      })
      .catch(() => {
        if (!cancelled) setDayDetail(null)
      })
    return () => {
      cancelled = true
    }
  }, [cursor, selectedDate])

  const dayEntries = useMemo(() => {
    if (!dayDetail) return []
    const dateISO = dayDetail.dateISO
    return habits
      .map((h) => {
        const stats = statsById[h.id]
        const trendDay = stats?.monthly_trend?.find((d) => d.date === dateISO)
        if (!trendDay || trendDay.planned === 0) return null
        return { id: h.id, name: h.name, meta: `${h.frequency} · ${h.time}`, done: trendDay.completed > 0 }
      })
      .filter(Boolean)
  }, [dayDetail, habits, statsById])

  function shiftMonth(delta) {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
    setSelectedDate(1)
  }

  if (loading && !days) return <LoadingState label="Loading your calendar…" />
  if (error && !days) return <ErrorState description={error} onRetry={loadMonth} />

  return (
    <>
      <PageHeader title="Calendar" subtitle="Your completion history at a glance" />

      {summary && (
        <div className="grid grid-cols-3 gap-2.5">
          <StatCard label="Done" value={summary.total_completions} icon="check_circle" tone="tertiary" />
          <StatCard label="Missed" value={summary.total_missed} icon="cancel" />
          <StatCard label="Rate" value={`${summary.completion_rate}%`} icon="donut_large" tone="primary" />
        </div>
      )}

      <CalendarGrid
        monthLabel={`${MONTH_NAMES[cursor.month]} ${cursor.year}`}
        days={days || []}
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
        onPrev={() => shiftMonth(-1)}
        onNext={() => shiftMonth(1)}
        startWeekday={startWeekday}
      />

      {dayDetail && (
        <div className="bg-surface-container-lowest rounded-xl shadow-card-1 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-headline-sm text-on-surface">
                {parseISODateLocal(dayDetail.dateISO).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </h3>
              <p className="text-body-sm text-tertiary font-semibold">
                {dayDetail.completed} of {dayDetail.planned} Habits Completed
              </p>
            </div>
            <div className="w-11 h-11 rounded-full border-2 border-tertiary flex items-center justify-center text-label-sm font-bold text-tertiary">
              {dayDetail.completion_percentage}%
            </div>
          </div>

          {dayEntries.length > 0 ? (
            <div className="flex flex-col divide-y divide-surface-container-high">
              {dayEntries.map((e) => (
                <div key={e.id} className="flex items-center gap-3 py-2.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${e.done ? 'bg-tertiary' : 'border-2 border-outline-variant'}`}>
                    {e.done ? <Icon name="check" size={15} className="text-white" /> : <Icon name="schedule" size={14} className="text-on-surface-variant" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-body-md font-semibold text-on-surface truncate">{e.name}</div>
                    <div className="text-body-sm text-on-surface-variant truncate">{e.meta}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-body-sm text-on-surface-variant">
              Per-habit detail isn't available for this date (outside the 30-day statistics window).
            </p>
          )}
        </div>
      )}
    </>
  )
}
