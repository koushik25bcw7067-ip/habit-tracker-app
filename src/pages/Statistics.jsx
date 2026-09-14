import { useEffect, useState, useCallback, useMemo } from 'react'
import Icon from '../components/ui/Icon'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import { WeeklyRhythmChart } from '../components/ChartCard'
import { ProgressBar, Chip } from '../components/ui/Primitives'
import { LoadingState, ErrorState } from '../components/ui/States'
import { weeklyStats, monthlyStats, categoryStats } from '../api/statistics'
import { parseISODateLocal } from '../api/adapters'
import { useHabits } from '../context/HabitsContext'
import { ApiError } from '../api/client'

const RANGE_LOADERS = {
  '7 Days': () => weeklyStats(),
  '30 Days': () => monthlyStats(),
  Semester: () => monthlyStats(), // backend has no semester-length window; 30-day is the widest period endpoint available
}

const SHORT_DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Statistics() {
  const { habits, categories } = useHabits()
  const [range, setRange] = useState('30 Days')
  const [period, setPeriod] = useState(null)
  const [catStats, setCatStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [p, c] = await Promise.all([RANGE_LOADERS[range](), categoryStats()])
      setPeriod(p)
      setCatStats(c)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load statistics')
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => {
    load()
  }, [load])

  const weeklyRhythm = useMemo(() => {
    if (!period) return []
    const daily = range === '7 Days' ? period.daily : period.daily.slice(-7)
    return daily.map((d) => ({ day: SHORT_DAY[parseISODateLocal(d.date).getDay()], value: d.completion_percentage }))
  }, [period, range])

  const activeStreak = habits.length ? Math.max(...habits.map((h) => h.streak)) : 0
  const recordStreak = habits.length ? Math.max(...habits.map((h) => h.bestStreak)) : 0
  const consistencyScore = habits.length ? Math.round(habits.reduce((s, h) => s + h.completion, 0) / habits.length) : 0

  const { topAnchors, needsAttention } = useMemo(() => {
    const sorted = [...habits].filter((h) => h.active).sort((a, b) => b.completion - a.completion)
    return {
      topAnchors: sorted.slice(0, 2),
      needsAttention: sorted.filter((h) => h.completion < 60).slice(-2),
    }
  }, [habits])

  if (loading && !period) return <LoadingState label="Loading statistics…" />
  if (error && !period) return <ErrorState description={error} onRetry={load} />

  return (
    <>
      <PageHeader title="Statistics" subtitle="Understand your momentum" />

      <div className="flex rounded-md bg-surface-container-low p-1">
        {Object.keys(RANGE_LOADERS).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`flex-1 h-9 rounded text-label-md font-semibold transition-colors ${
              range === r ? 'bg-surface-container-lowest text-primary shadow-card-1' : 'text-on-surface-variant'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {period && (
        <>
          <div className="grid grid-cols-2 gap-2.5">
            <StatCard
              label="Completion Rate"
              value={`${period.completion_rate}%`}
              sublabel={`${period.trend_vs_previous_period >= 0 ? '+' : ''}${period.trend_vs_previous_period}% vs prior period`}
              icon="trending_up"
              trend
              trendPositive={period.trend_vs_previous_period >= 0}
              tone="primary"
            />
            <StatCard label="Checks Done" value={period.total_completions} sublabel={`${period.total_missed} missed`} icon="event_repeat" tone="primary" />
            <StatCard label="Active Streak" value={`${activeStreak} Days`} icon="local_fire_department" tone="tertiary" />
            <StatCard label="Record Streak" value={`${recordStreak} Days`} sublabel="Personal record" icon="military_tech" />
          </div>

          <div className="bg-surface-container-lowest rounded-xl shadow-card-1 p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0">
              <span className="font-display text-headline-md text-primary">{consistencyScore}</span>
            </div>
            <div className="flex-1">
              <span className="font-display text-headline-sm text-on-surface">Average Consistency</span>
              <p className="text-body-sm text-on-surface-variant">Average completion rate across your active habits</p>
            </div>
          </div>

          <WeeklyRhythmChart data={weeklyRhythm} title="Completion Rhythm" subtitle={`Daily completion over the ${range.toLowerCase()} window`} />

          {catStats && Object.keys(catStats).length > 0 && (
            <div className="bg-surface-container-lowest rounded-xl shadow-card-1 p-4 flex flex-col gap-3">
              <div>
                <h3 className="font-display text-headline-sm text-on-surface">Category Mastery</h3>
                <p className="text-body-sm text-on-surface-variant">Average completion rate by category</p>
              </div>
              {Object.entries(catStats).map(([label, value]) => (
                <div key={label} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-body-sm">
                    <span className="text-on-surface font-medium">{label}</span>
                    <span className="font-semibold text-on-surface">{value}%</span>
                  </div>
                  <ProgressBar value={value} tone="primary" />
                </div>
              ))}
            </div>
          )}

          {(topAnchors.length > 0 || needsAttention.length > 0) && (
            <div className="bg-surface-container-lowest rounded-xl shadow-card-1 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-headline-sm text-on-surface">Habit Matrix</h3>
                <Chip tone="neutral">Active {habits.filter((h) => h.active).length}</Chip>
              </div>
              {topAnchors.length > 0 && (
                <>
                  <span className="text-label-sm text-on-surface-variant uppercase tracking-wide font-semibold">Top Anchors</span>
                  {topAnchors.map((h) => (
                    <div key={h.id} className="flex items-center justify-between bg-surface-container-low rounded-md px-3 py-2.5">
                      <div>
                        <div className="text-body-md font-semibold text-on-surface">{h.name}</div>
                        <div className="text-body-sm text-on-surface-variant">Streak {h.streak}d</div>
                      </div>
                      <span className="text-tertiary font-bold flex items-center gap-1">
                        {h.completion}% <Icon name="check_circle" size={16} />
                      </span>
                    </div>
                  ))}
                </>
              )}
              {needsAttention.length > 0 && (
                <>
                  <span className="text-label-sm text-error uppercase tracking-wide font-semibold mt-1">Needs Attention</span>
                  {needsAttention.map((h) => (
                    <div key={h.id} className="flex items-center justify-between bg-error-container/40 rounded-md px-3 py-2.5">
                      <div>
                        <div className="text-body-md font-semibold text-on-surface">{h.name}</div>
                        <div className="text-body-sm text-error">Below 60% completion</div>
                      </div>
                      <span className="text-error font-bold flex items-center gap-1">
                        {h.completion}% <Icon name="warning" size={16} />
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </>
      )}
    </>
  )
}
