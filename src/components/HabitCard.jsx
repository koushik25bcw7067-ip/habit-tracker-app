import { Link } from 'react-router-dom'
import Icon from './ui/Icon'
import { Chip, ProgressBar } from './ui/Primitives'
import { useHabits } from '../context/HabitsContext'

const DAYS = ['M', 'T', 'W', 'Th', 'F', 'S', 'Su']
const PRIORITY_TONE = { High: 'error', Medium: 'warning', Low: 'neutral' }
const FALLBACK_CATEGORY = { id: null, label: 'Uncategorized', color: 'neutral' }

function useCategoryFor() {
  const { categories } = useHabits()
  return (id) => categories.find((c) => c.id === id) || FALLBACK_CATEGORY
}

export function HabitListCard({ habit, onToggle, onEdit, onArchive, compact = false }) {
  const categoryFor = useCategoryFor()
  const category = categoryFor(habit.category)
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-card-1 border border-surface-container-high/60 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onToggle?.(habit.id)}
            aria-label={habit.completedToday ? 'Mark incomplete' : 'Mark complete'}
            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
              habit.completedToday ? 'bg-tertiary border-tertiary' : 'border-outline-variant hover:border-primary'
            }`}
          >
            {habit.completedToday && <Icon name="check" size={16} className="text-white" />}
          </button>
          <Chip tone={category.color}>{category.label}</Chip>
          <Chip tone="neutral">{habit.frequency}</Chip>
        </div>
        {!compact && (
          <div className="flex items-center gap-1 text-on-surface-variant">
            <button onClick={() => onEdit?.(habit)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low">
              <Icon name="edit" size={18} />
            </button>
            <button onClick={() => onArchive?.(habit.id)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low">
              <Icon name="archive" size={18} />
            </button>
          </div>
        )}
      </div>

      <Chip tone={PRIORITY_TONE[habit.priority]} className="w-fit">
        {habit.priority} Priority
      </Chip>

      <div>
        <h3 className="font-display text-headline-sm text-on-surface">{habit.name}</h3>
        <p className="text-body-sm text-on-surface-variant mt-0.5">{habit.description}</p>
        <div className="flex items-center gap-1.5 mt-1 text-body-sm text-on-surface-variant">
          <Icon name="schedule" size={14} />
          <span>{habit.time}</span>
          <span>·</span>
          <span className="inline-flex items-center gap-0.5 text-warning font-semibold">🔥 {habit.streak}d</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface-container-low rounded-md p-2.5 flex flex-col">
          <span className="text-[10px] text-on-surface-variant font-semibold tracking-tight uppercase">Streak</span>
          <span className="font-display text-stat-counter text-on-surface flex items-center gap-1">🔥{habit.streak}d</span>
          <span className="text-[10px] text-on-surface-variant">Best {habit.bestStreak}d</span>
        </div>
        <div className="bg-surface-container-low rounded-md p-2.5 flex flex-col">
          <span className="text-[10px] text-on-surface-variant font-semibold tracking-tight uppercase">Completion</span>
          <span className="font-display text-stat-counter text-primary">{habit.completion}%</span>
          <span className="text-[10px] text-on-surface-variant">Target met</span>
        </div>
        <div className="bg-surface-container-low rounded-md p-2.5 flex flex-col">
          <span className="text-[10px] text-on-surface-variant font-semibold tracking-tight uppercase">
            {habit.progressTarget ? 'Target' : 'Weekly Goal'}
          </span>
          <span className="font-display text-stat-counter text-on-surface">
            {habit.progressTarget ? `${habit.progressCurrent}/${habit.progressTarget}` : `${habit.weeklyGoalOnPace ?? '—'}h`}
          </span>
          <span className="text-[10px] text-on-surface-variant">{habit.progressTarget ? habit.unit : 'On pace'}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {DAYS.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`h-1.5 w-full rounded-full ${
                habit.weeklyProgress?.[i] ? 'bg-tertiary' : 'bg-surface-container-high'
              }`}
            />
            <span className="text-[10px] text-on-surface-variant">{d}</span>
          </div>
        ))}
      </div>

      {!habit.active && (
        <Chip tone="neutral" className="w-fit">
          Archived
        </Chip>
      )}
    </div>
  )
}

export function DashboardHabitRow({ habit, onToggle }) {
  const categoryFor = useCategoryFor()
  const category = categoryFor(habit.category)
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-card-1 border border-surface-container-high/60 p-3.5 flex items-center gap-3">
      <button
        onClick={() => onToggle?.(habit.id)}
        aria-label={habit.completedToday ? 'Mark incomplete' : 'Mark complete'}
        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          habit.completedToday ? 'bg-tertiary border-tertiary' : 'border-outline-variant hover:border-primary'
        }`}
      >
        {habit.completedToday && <Icon name="check" size={16} className="text-white" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-display text-headline-sm text-[15px] text-on-surface truncate">{habit.name}</span>
          <Chip tone={category.color}>{category.label}</Chip>
          <Chip tone={PRIORITY_TONE[habit.priority]}>{habit.priority}</Chip>
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-body-sm text-on-surface-variant">
          <Icon name="schedule" size={13} />
          <span>{habit.time}</span>
          <span>·</span>
          <span className="text-warning font-semibold">🔥 {habit.streak}d</span>
        </div>
        {habit.progressTarget && (
          <div className="mt-2 flex items-center gap-2">
            <ProgressBar value={(habit.progressCurrent / habit.progressTarget) * 100} className="flex-1" />
            <span className="text-body-sm text-on-surface-variant whitespace-nowrap">
              {habit.progressCurrent}/{habit.progressTarget}
              {habit.unit}
            </span>
          </div>
        )}
      </div>
      <Link to={`/habits/${habit.id}/edit`} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low text-on-surface-variant flex-shrink-0">
        <Icon name="chevron_right" size={18} />
      </Link>
    </div>
  )
}
