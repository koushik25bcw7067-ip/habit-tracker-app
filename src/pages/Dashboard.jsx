import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState, useCallback } from 'react'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import RadialProgress from '../components/RadialProgress'
import { DashboardHabitRow } from '../components/HabitCard'
import { Chip } from '../components/ui/Primitives'
import { EmptyState, LoadingState, ErrorState } from '../components/ui/States'
import { useHabits } from '../context/HabitsContext'
import { useAuth } from '../context/AuthContext'
import { getDashboard } from '../api/dashboard'
import { adaptRecommendation, parseISODateLocal } from '../api/adapters'
import { ApiError } from '../api/client'

function formatDate(d) {
  return parseISODateLocal(d).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
}

export default function Dashboard() {
  const { habits, categories, toggleComplete, loading: habitsLoading } = useHabits()
  const { user } = useAuth()
  const [filter, setFilter] = useState('All')
  const [dash, setDash] = useState(null)
  const [dashLoading, setDashLoading] = useState(true)
  const [dashError, setDashError] = useState(null)

  const loadDashboard = useCallback(async () => {
    setDashLoading(true)
    setDashError(null)
    try {
      setDash(await getDashboard())
    } catch (err) {
      setDashError(err instanceof ApiError ? err.message : 'Could not load your dashboard')
    } finally {
      setDashLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard, habits.length])

  const today = useMemo(() => {
    const active = habits.filter((h) => h.active)
    if (filter === 'All') return active
    return active.filter((h) => h.category === filter)
  }, [habits, filter])

  const topRecommendation = dash?.top_recommendation ? adaptRecommendation(dash.top_recommendation) : null

  async function handleToggle(id) {
    await toggleComplete(id)
    loadDashboard()
  }

  if (dashLoading && !dash) {
    return <LoadingState label="Loading your dashboard…" />
  }

  if (dashError && !dash) {
    return <ErrorState description={dashError} onRetry={loadDashboard} />
  }

  const totalHabits = (dash.completed_habits ?? 0) + (dash.remaining_habits ?? 0)

  return (
    <>
      <section className="flex flex-col gap-1.5 mt-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Chip tone="neutral" icon={<Icon name="calendar_today" size={14} className="text-primary" />}>
            {formatDate(dash.today)}
          </Chip>
        </div>
        <h1 className="font-display text-headline-lg-mobile text-on-surface tracking-tight mt-1">
          Good morning, {user?.name} 👋
        </h1>
        <p className="text-body-sm text-on-surface-variant">Ready to crush today? Small continuous reps build unstoppable momentum.</p>

        {dash.important_ai_insight && (
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary-container via-primary to-secondary p-4 text-on-primary shadow-card-2 mt-1">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div className="flex items-start gap-3 relative z-10">
              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
                <Icon name="auto_awesome" size={20} className="text-white" filled />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-label-sm uppercase tracking-wider font-bold">AI Insight</span>
                <p className="text-body-md font-medium mt-0.5 leading-snug">{dash.important_ai_insight}</p>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="bg-surface-container-lowest rounded-xl p-4 shadow-card-1 flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-1">
          <div className="flex items-center gap-2">
            <span className="font-display text-headline-sm text-on-surface">Daily Velocity</span>
            <Chip tone="primary">
              {dash.completed_habits} / {totalHabits} Done
            </Chip>
          </div>
          <span className="text-label-sm text-on-surface-variant">Today's Goal: 100%</span>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <RadialProgress value={dash.completion_percentage} label={`${dash.completion_percentage}%`} sublabel="Finished" />
          <div className="grid grid-cols-2 gap-2 flex-1 min-w-[180px]">
            <div className="bg-surface-container-low rounded-md p-2.5 flex flex-col justify-center">
              <span className="text-[10px] text-on-surface-variant font-semibold tracking-tight uppercase flex items-center gap-1">⚡ Consistency</span>
              <span className="font-display text-stat-counter text-on-surface mt-0.5">{dash.consistency_score}%</span>
            </div>
            <div className="bg-surface-container-low rounded-md p-2.5 flex flex-col justify-center">
              <span className="text-[10px] text-on-surface-variant font-semibold tracking-tight uppercase flex items-center gap-1">🔥 Streak</span>
              <span className="font-display text-stat-counter text-on-surface mt-0.5">{dash.current_overall_streak} Days</span>
              <span className="text-[10px] text-on-surface-variant">Longest: {dash.longest_streak}d</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between bg-surface-container-low rounded-md px-3 py-2 text-body-sm">
          <span className="flex items-center gap-1.5 text-on-surface-variant">
            <Icon name="check_circle" size={16} className="text-tertiary" />
            {dash.monthly_statistics?.total_completions ?? 0} habits completed this month
          </span>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-headline-md text-on-surface">Today's Habits</h2>
          </div>
          <Link to="/habits/new">
            <Button size="sm" icon="add">
              <Icon name="add" size={16} className="mr-1" />
              Habit
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilter('All')}
            className={`px-3.5 h-9 rounded-full text-label-md font-semibold whitespace-nowrap transition-colors ${
              filter === 'All' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            All ({habits.filter((h) => h.active).length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className={`px-3.5 h-9 rounded-full text-label-md font-semibold whitespace-nowrap transition-colors ${
                filter === c.id ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2.5">
          {habitsLoading && habits.length === 0 ? (
            <LoadingState label="Loading habits…" />
          ) : today.length === 0 ? (
            <EmptyState icon="task_alt" title="No habits for this filter" description="Try another filter or add a new habit." />
          ) : (
            today.map((h) => <DashboardHabitRow key={h.id} habit={h} onToggle={handleToggle} />)
          )}
        </div>
      </section>

      {dash.recent_activity?.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <h2 className="font-display text-headline-md text-on-surface">Recent Activity</h2>
          {dash.recent_activity.map((a, i) => {
            const habit = habits.find((h) => h.id === a.habit_id)
            return (
              <div key={`${a.habit_id}-${a.date}-${i}`} className="flex items-center gap-3 bg-surface-container-lowest rounded-xl shadow-card-1 p-3.5">
                <div className="w-9 h-9 rounded-full bg-tertiary-fixed/40 flex items-center justify-center flex-shrink-0">
                  <Icon name="check" size={18} className="text-tertiary-strong" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-body-md font-semibold text-on-surface truncate">{habit?.name || `Habit #${a.habit_id}`}</div>
                  <div className="text-body-sm text-on-surface-variant truncate">
                    Completed{a.actual_value != null ? ` · ${a.actual_value}${habit?.unit ? ` ${habit.unit}` : ''}` : ''}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 text-[11px] text-on-surface-variant">{a.date}</div>
              </div>
            )
          })}
        </section>
      )}

      {topRecommendation && (
        <section>
          <Link
            to="/recommendations"
            className="flex items-start gap-3 bg-gradient-to-br from-secondary-fixed/50 to-primary-fixed/50 rounded-xl p-4 border border-secondary-container/30"
          >
            <div className="w-9 h-9 rounded-lg bg-surface-container-lowest/80 flex items-center justify-center flex-shrink-0">
              <Icon name="tips_and_updates" size={18} className="text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-label-sm font-bold text-secondary uppercase tracking-wide">AI Adaptive Insight</div>
              <p className="text-body-md text-on-surface mt-0.5">{topRecommendation.rationale}</p>
            </div>
            <Icon name="chevron_right" size={20} className="text-on-surface-variant flex-shrink-0 mt-1" />
          </Link>
        </section>
      )}
    </>
  )
}
