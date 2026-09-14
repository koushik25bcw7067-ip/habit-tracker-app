import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import { Input, Select } from '../components/ui/Form'
import { HabitListCard } from '../components/HabitCard'
import { EmptyState, LoadingState, ErrorState } from '../components/ui/States'
import PageHeader from '../components/PageHeader'
import { useHabits } from '../context/HabitsContext'

const SORTS = [
  { id: 'priority', label: 'Priority (High to Low)' },
  { id: 'streak', label: 'Streak (High to Low)' },
  { id: 'completion', label: 'Completion (High to Low)' },
  { id: 'name', label: 'Name (A-Z)' },
]
const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 }

export default function MyHabits() {
  const navigate = useNavigate()
  const { habits, categories, toggleComplete, archive, loading, error, refresh } = useHabits()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('active')
  const [sort, setSort] = useState('priority')

  const filtered = useMemo(() => {
    let list = [...habits]
    if (status === 'active') list = list.filter((h) => h.active)
    if (status === 'archived') list = list.filter((h) => !h.active)
    if (category !== 'all') list = list.filter((h) => h.category === category)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((h) => h.name.toLowerCase().includes(q) || h.description.toLowerCase().includes(q))
    }
    switch (sort) {
      case 'priority':
        list.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
        break
      case 'streak':
        list.sort((a, b) => b.streak - a.streak)
        break
      case 'completion':
        list.sort((a, b) => b.completion - a.completion)
        break
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name))
        break
    }
    return list
  }, [habits, search, category, status, sort])

  const activeCount = habits.filter((h) => h.active).length
  const archivedCount = habits.filter((h) => !h.active).length
  const topHabit = habits.length ? [...habits].sort((a, b) => b.completion - a.completion)[0] : null

  return (
    <>
      <PageHeader
        title="My Habits"
        subtitle={`${activeCount} Active · ${archivedCount} Archived`}
        action={
          <Link to="/habits/new">
            <Button icon="add">
              <Icon name="add" size={18} className="mr-1.5" />
              New Habit
            </Button>
          </Link>
        }
      />

      {topHabit && (
        <div className="bg-gradient-to-br from-primary-fixed/50 to-secondary-fixed/40 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface-container-lowest/70 flex items-center justify-center flex-shrink-0">
            <Icon name="auto_awesome" size={16} className="text-primary" />
          </div>
          <p className="text-body-sm text-on-surface">
            <span className="font-semibold">{topHabit.name}</span> is your top habit at {topHabit.completion}%
            completion — keep the streak alive today.
          </p>
        </div>
      )}

      <div className="relative">
        <Icon name="search" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
        <Input placeholder="Search habits by title or tag…" className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setCategory('all')}
          className={`px-3.5 h-9 rounded-full text-label-md font-semibold whitespace-nowrap transition-colors ${
            category === 'all' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant'
          }`}
        >
          All ({habits.length})
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`px-3.5 h-9 rounded-full text-label-md font-semibold whitespace-nowrap transition-colors ${
              category === c.id ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto h-10">
          <option value="all">Status: All</option>
          <option value="active">Status: Active</option>
          <option value="archived">Status: Archived</option>
        </Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value)} className="w-auto h-10 flex-1">
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>
              Sort: {s.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-3">
        {loading && habits.length === 0 ? (
          <LoadingState label="Loading your habits…" />
        ) : error ? (
          <ErrorState description={error} onRetry={refresh} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="checklist"
            title="No habits found"
            description="Try adjusting your filters, or add your first habit to get started."
            action={
              <Link to="/habits/new">
                <Button icon="add">
                  <Icon name="add" size={16} className="mr-1.5" />
                  Add Habit
                </Button>
              </Link>
            }
          />
        ) : (
          filtered.map((h) => (
            <HabitListCard
              key={h.id}
              habit={h}
              onToggle={toggleComplete}
              onEdit={() => navigate(`/habits/${h.id}/edit`)}
              onArchive={archive}
            />
          ))
        )}
      </div>
    </>
  )
}
