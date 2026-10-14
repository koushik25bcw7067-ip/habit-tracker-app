import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState, useCallback } from 'react'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import RadialProgress from '../components/RadialProgress'
import { DashboardHabitRow } from '../components/HabitCard'
import { WeeklyRhythmChart } from '../components/ChartCard'
import { Chip, Card, ProgressBar } from '../components/ui/Primitives'
import { EmptyState, LoadingState, ErrorState } from '../components/ui/States'
import { useHabits } from '../context/HabitsContext'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { DEFAULT_VOCAB } from '../theme/themeModel'
import { emitCompanion } from '../theme/companionBus'
import { getDashboard } from '../api/dashboard'
import { getNotifications } from '../api/notifications'
import { listTasksToday, completeTask } from '../api/tasks'
import { listGoals } from '../api/goals'
import { listAchievements, listUserAchievements } from '../api/achievements'
import { adaptRecommendation, parseISODateLocal } from '../api/adapters'
import { ApiError } from '../api/client'

const SHORT_DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const NOTIF_TONE = { URGENT: 'error', IMPORTANT: 'warning', NORMAL: 'primary', LOW: 'neutral' }

function formatDate(d) {
  return parseISODateLocal(d).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
}

export default function Dashboard() {
  const { t, vocab } = useTheme()
  const { habits, categories, toggleComplete, loading: habitsLoading } = useHabits()
  const { user } = useAuth()
  const [filter, setFilter] = useState('All')
  const [dash, setDash] = useState(null)
  const [dashLoading, setDashLoading] = useState(true)
  const [dashError, setDashError] = useState(null)
  const [notifications, setNotifications] = useState(null)
  const [todayTasks, setTodayTasks] = useState(null)
  const [activeGoals, setActiveGoals] = useState(null)
  const [xp, setXp] = useState(null)

  const loadTodayTasks = useCallback(() => {
    listTasksToday().then(setTodayTasks).catch(() => setTodayTasks(null))
  }, [])

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

  useEffect(() => {
    // Soft-fail on purpose: notifications are a bonus summary, not core dashboard
    // data — a failure here should never block or error out the rest of the page.
    getNotifications()
      .then(setNotifications)
      .catch(() => setNotifications(null))
  }, [habits.length])

  useEffect(() => {
    // Same soft-fail pattern — these are supplementary Dashboard widgets, a failure in any
    // one of them should never block the core habit/stat data above from rendering.
    loadTodayTasks()
    listGoals('active').then(setActiveGoals).catch(() => setActiveGoals(null))
    Promise.all([listAchievements(), listUserAchievements()])
      .then(([defs, unlocked]) => {
        const totalXp = defs.filter((a) => unlocked.some((u) => u.achievement_id === a.id)).reduce((s, a) => s + a.xp, 0)
        const latest = [...unlocked].sort((a, b) => b.unlocked_at.localeCompare(a.unlocked_at))[0]
        const latestDef = latest ? defs.find((a) => a.id === latest.achievement_id) : null
        setXp({ totalXp, latestName: latestDef?.name || null })
      })
      .catch(() => setXp(null))
  }, [loadTodayTasks, habits.length])

  async function handleCompleteTask(id) {
    try {
      await completeTask(id)
      emitCompanion('task_done', { task: todayTasks?.find?.((x) => x.id === id)?.title })
      loadTodayTasks()
    } catch {
      /* non-critical widget action; task page itself handles errors with full detail */
    }
  }

  const today = useMemo(() => {
    const active = habits.filter((h) => h.active)
    if (filter === 'All') return active
    return active.filter((h) => h.category === filter)
  }, [habits, filter])

  const topRecommendation = dash?.top_recommendation ? adaptRecommendation(dash.top_recommendation) : null

  const weeklyRhythm = useMemo(() => {
    if (!dash?.weekly_statistics?.daily) return []
    return dash.weekly_statistics.daily.map((d) => ({
      day: SHORT_DAY[parseISODateLocal(d.date).getDay()],
      value: d.completion_percentage,
    }))
  }, [dash])

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
          {vocab.greeting !== DEFAULT_VOCAB.greeting ? `${t('greeting')} 👋` : `Good morning, ${user?.name} 👋`}
        </h1>
        <p className="text-body-sm text-on-surface-variant">Ready to crush today? Small continuous reps build unstoppable momentum.</p>

        {dash.important_ai_insight && (
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary-container via-primary to-secondary p-4 text-on-primary shadow-card-2 mt-1">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-on-primary/10 blur-xl pointer-events-none" />
            <div className="flex items-start gap-3 relative z-10">
              <div className="w-8 h-8 rounded-lg bg-on-primary/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
                <Icon name="auto_awesome" size={20} className="text-on-primary" filled />
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

      {weeklyRhythm.length > 0 && (
        <WeeklyRhythmChart data={weeklyRhythm} title="Weekly Progress" subtitle="Completion rate over the last 7 days" />
      )}

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

      {todayTasks && (todayTasks.overdue.length > 0 || todayTasks.due_today.length > 0) && (
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-headline-md text-on-surface">Today's Tasks</h2>
            <Link to="/tasks" className="text-body-sm text-primary font-semibold">View all</Link>
          </div>
          {[...todayTasks.overdue, ...todayTasks.due_today].slice(0, 5).map((t) => (
            <Card key={t.id} className="p-3 flex items-center gap-3">
              <button
                onClick={() => handleCompleteTask(t.id)}
                className="w-7 h-7 rounded-full border-2 border-outline-variant hover:border-primary flex-shrink-0"
                aria-label="Complete task"
              />
              <div className="flex-1 min-w-0">
                <div className="text-body-md font-semibold text-on-surface truncate">{t.title}</div>
              </div>
              {todayTasks.overdue.includes(t) && <Chip tone="error">Overdue</Chip>}
            </Card>
          ))}
        </section>
      )}

      {(activeGoals?.length > 0 || xp) && (
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {activeGoals?.length > 0 && (
            <Link to="/goals">
              <Card className="p-3.5 h-full flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-label-sm font-bold text-primary uppercase tracking-wide">Goals</span>
                  <Icon name="flag" size={16} className="text-primary" />
                </div>
                {activeGoals.slice(0, 2).map((g) => {
                  const pct = g.target_value ? Math.min(100, Math.round((g.current_value / g.target_value) * 100)) : null
                  return (
                    <div key={g.id} className="flex flex-col gap-1">
                      <span className="text-body-sm text-on-surface truncate">{g.title}</span>
                      {pct != null && <ProgressBar value={pct} tone="primary" />}
                    </div>
                  )
                })}
              </Card>
            </Link>
          )}
          {xp && (
            <Link to="/achievements">
              <Card className="p-3.5 h-full flex flex-col justify-center gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-label-sm font-bold text-tertiary-strong uppercase tracking-wide">XP</span>
                  <Icon name="emoji_events" size={16} className="text-tertiary-strong" />
                </div>
                <span className="font-display text-headline-sm text-on-surface">{xp.totalXp} XP</span>
                {xp.latestName && <span className="text-body-sm text-on-surface-variant truncate">Latest: {xp.latestName}</span>}
              </Card>
            </Link>
          )}
        </section>
      )}

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
