// ---------------------------------------------------------------------------
// Adapters between the real backend's data shapes and the shapes the existing
// (Stitch-generated) UI components expect. The backend is the source of
// truth for every number here — these functions only reshape/rename fields,
// they never compute statistics themselves.
// ---------------------------------------------------------------------------

export const DAY_LETTERS = ['M', 'T', 'W', 'Th', 'F', 'S', 'Su'] // index 0 = Monday, matches backend target_days encoding

// Backend dates arrive as "YYYY-MM-DD" strings. `new Date("YYYY-MM-DD")` parses
// as UTC midnight, so .getDay()/toLocaleDateString() can land on the wrong
// calendar day in negative-UTC-offset timezones. Always go through this
// instead of `new Date(isoString)` when displaying a backend date.
export function parseISODateLocal(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const CATEGORY_COLOR_CYCLE = ['primary', 'tertiary', 'secondary', 'warning']

export function categoryColor(categoryId) {
  if (categoryId == null) return 'neutral'
  return CATEGORY_COLOR_CYCLE[Math.abs(Number(categoryId)) % CATEGORY_COLOR_CYCLE.length]
}

// Backend Category {id, name, user_id, is_default} -> UI {id, label, color}
export function adaptCategory(category) {
  return { id: category.id, label: category.name, color: categoryColor(category.id) }
}

const PRIORITY_TO_UI = { low: 'Low', medium: 'Medium', high: 'High' }
const PRIORITY_TO_API = { Low: 'low', Medium: 'medium', High: 'high' }

export function priorityToUI(p) {
  return PRIORITY_TO_UI[p] || 'Medium'
}
export function priorityToApi(p) {
  return PRIORITY_TO_API[p] || 'medium'
}

const FREQUENCY_TO_UI = { daily: 'Daily', weekly: 'Weekly', custom: 'Custom' }

export function frequencyToUI(habit) {
  const base = FREQUENCY_TO_UI[habit.frequency] || habit.frequency
  if (habit.frequency === 'custom' && habit.target_days?.length) {
    return `${base} (${habit.target_days.map((d) => DAY_LETTERS[d]).join(',')})`
  }
  return base
}

export function formatReminderTime(reminder_time) {
  if (!reminder_time) return 'Anytime'
  const [h, m] = reminder_time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

// "9:00 AM" -> "09:00:00" for the backend's `time` field. Falls back to null
// (== "Anytime" / no reminder) if the text can't be parsed.
export function parseReminderTime(text) {
  if (!text) return null
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec(text.trim())
  if (!match) return null
  let [, h, m, period] = match
  h = Number(h)
  if (period) {
    period = period.toUpperCase()
    if (period === 'PM' && h !== 12) h += 12
    if (period === 'AM' && h === 12) h = 0
  }
  return `${String(h).padStart(2, '0')}:${m}:00`
}

// Local calendar day as "YYYY-MM-DD" (see the identical helper in
// HabitsContext.jsx for why this isn't toISOString().slice(0,10)).
function todayLocalISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Merge a backend Habit + its /statistics/habits/{id} HabitStats into the
// flat shape HabitCard / HabitForm / Dashboard rows already expect.
export function adaptHabit(habit, stats) {
  const today = todayLocalISO()
  const weeklyTrend = stats?.weekly_trend || []
  const todayEntry = weeklyTrend.find((d) => d.date === today)
  return {
    id: habit.id,
    name: habit.name,
    description: habit.description || '',
    category: habit.category_id,
    priority: priorityToUI(habit.priority),
    frequency: frequencyToUI(habit),
    frequencyRaw: habit.frequency, // 'daily' | 'weekly' | 'custom' — for editing, not display
    targetDaysRaw: habit.target_days || [], // 0=Mon..6=Sun — for editing, not display
    scheduleDays: habit.frequency === 'custom' ? (habit.target_days || []).map((d) => DAY_LETTERS[d]) : DAY_LETTERS,
    targetValue: habit.target_value,
    unit: habit.unit || '',
    time: formatReminderTime(habit.reminder_time),
    startDate: habit.start_date,
    active: habit.active,
    archived: habit.archived,
    streak: stats?.current_streak ?? 0,
    bestStreak: stats?.longest_streak ?? 0,
    completion: stats?.completion_rate ?? 0,
    weeklyProgress: weeklyTrend.map((d) => (d.completed > 0 ? 1 : 0)),
    completedToday: todayEntry ? todayEntry.completed > 0 : false,
  }
}

const RECOMMENDATION_ICON = {
  TARGET_ADJUSTMENT: 'trending_up',
  REMINDER_TIME: 'schedule',
  SCHEDULE_CHANGE: 'event_repeat',
  HABIT_PRIORITY: 'flag',
  HABIT_SIMPLIFICATION: 'compress',
  HABIT_RECOVERY: 'refresh',
  NEW_HABIT: 'add_circle',
  HABIT_OVERLOAD: 'warning',
  CATEGORY_FOCUS: 'category',
  WEEKLY_PLAN: 'calendar_view_week',
  MONTHLY_PLAN: 'calendar_month',
}


function titleCaseType(type) {
  if (!type) return ''
  return type
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// Backend Recommendation -> the shape RecommendationCard already renders.
// status 'rejected' (backend) displays as 'dismissed' (UI label only).
export function adaptRecommendation(r) {
  return {
    id: r.id,
    title: r.title,
    tag: titleCaseType(r.type),
    icon: RECOMMENDATION_ICON[r.type] || 'auto_awesome',
    status: r.status === 'rejected' ? 'dismissed' : r.status,
    rationale: r.reason,
    action: r.action,
    relatedHabit: r.habit_id,
    acceptLabel: 'Accept',
    dismissLabel: 'Dismiss',
  }
}

// Backend /calendar day entry {date, planned, completed, missed, completion_percentage}
// -> the {date: dayNumber, status} shape CalendarGrid renders.
export function adaptCalendarDay(d, todayISO) {
  const dayNumber = Number(d.date.slice(8, 10))
  let status
  if (d.date === todayISO) status = 'today'
  else if (d.date > todayISO || d.planned === 0) status = 'upcoming'
  else if (d.completion_percentage >= 100) status = 'full'
  else if (d.completion_percentage >= 75) status = 'high'
  else if (d.completion_percentage >= 50) status = 'partial'
  else status = 'missed'
  return { date: dayNumber, status, raw: d }
}

// UI HabitForm values -> backend HabitCreate/HabitUpdate payload.
export function habitFormToApi(form) {
  return {
    name: form.name.trim(),
    description: form.description?.trim() || null,
    category_id: form.category != null && form.category !== '' ? Number(form.category) : null,
    frequency: form.frequency,
    target_days: form.frequency === 'custom' ? form.targetDays || [] : [],
    reminder_time: parseReminderTime(form.time),
    start_date: form.startDate,
    priority: priorityToApi(form.priority),
    target_value: form.targetValue === '' ? null : Number(form.targetValue),
    unit: form.unit || null,
    active: form.active,
  }
}
