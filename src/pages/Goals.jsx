import { useEffect, useState, useCallback, useMemo } from 'react'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import PageHeader from '../components/PageHeader'
import { useTheme } from '../context/ThemeContext'
import { Field, Input, Textarea } from '../components/ui/Form'
import { Card, Chip, ProgressBar } from '../components/ui/Primitives'
import { EmptyState, LoadingState, ErrorState } from '../components/ui/States'
import * as goalsApi from '../api/goals'
import { parseISODateLocal } from '../api/adapters'
import { ApiError } from '../api/client'

const FILTERS = ['Active', 'Completed', 'Archived', 'All']

function todayLocalISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function GoalCard({ goal, onProgressSave, onComplete, onArchive, onDelete }) {
  const [editingProgress, setEditingProgress] = useState(false)
  const [value, setValue] = useState(goal.current_value)
  const hasTarget = goal.target_value != null && goal.target_value > 0
  const pct = hasTarget ? Math.min(100, Math.round((goal.current_value / goal.target_value) * 100)) : null
  const overdue = goal.target_date && goal.target_date < todayLocalISO() && goal.status === 'active'

  async function save() {
    await onProgressSave(goal.id, Number(value))
    setEditingProgress(false)
  }

  return (
    <Card className="p-3.5 flex flex-col gap-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-body-md font-semibold text-on-surface truncate">{goal.title}</div>
          {goal.description && <div className="text-body-sm text-on-surface-variant truncate">{goal.description}</div>}
        </div>
        <Chip tone={goal.status === 'completed' ? 'tertiary' : goal.status === 'archived' ? 'neutral' : overdue ? 'error' : 'primary'} className="flex-shrink-0">
          {goal.status === 'completed' ? 'Completed' : goal.status === 'archived' ? 'Archived' : overdue ? 'Overdue' : 'Active'}
        </Chip>
      </div>

      {hasTarget && (
        <div className="flex flex-col gap-1">
          <ProgressBar value={pct} tone={goal.status === 'completed' ? 'tertiary' : 'primary'} />
          <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
            {editingProgress ? (
              <div className="flex items-center gap-1.5">
                <Input type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)} className="w-20 h-8 text-body-sm" />
                <span>/ {goal.target_value} {goal.unit}</span>
                <button onClick={save} className="text-primary font-semibold ml-1">Save</button>
                <button onClick={() => setEditingProgress(false)} className="text-on-surface-variant">Cancel</button>
              </div>
            ) : (
              <button onClick={() => { setValue(goal.current_value); setEditingProgress(true) }} className="flex items-center gap-1">
                {goal.current_value} / {goal.target_value} {goal.unit} <Icon name="edit" size={12} />
              </button>
            )}
            <span>{pct}%</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
        <span>{goal.target_date ? `Target: ${parseISODateLocal(goal.target_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}` : 'No target date'}</span>
        {goal.status === 'active' && (
          <div className="flex items-center gap-2">
            <button onClick={() => onComplete(goal.id)} className="text-tertiary-strong font-semibold">Mark Done</button>
            <button onClick={() => onArchive(goal.id)} className="text-on-surface-variant">Archive</button>
          </div>
        )}
        {goal.status !== 'active' && (
          <button onClick={() => onDelete(goal.id)} className="text-error font-semibold">Delete</button>
        )}
      </div>
    </Card>
  )
}

export default function Goals() {
  const { t } = useTheme()
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('Active')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', target_date: '', target_value: '', unit: '' })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setGoals(await goalsApi.listGoals())
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your goals')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    if (filter === 'All') return goals
    return goals.filter((g) => g.status === filter.toLowerCase())
  }, [goals, filter])

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.title.trim()) {
      setFormError('Title is required')
      return
    }
    setSubmitting(true)
    setFormError('')
    try {
      await goalsApi.createGoal({
        title: form.title.trim(),
        description: form.description.trim() || null,
        target_date: form.target_date || null,
        target_value: form.target_value === '' ? null : Number(form.target_value),
        unit: form.unit.trim() || null,
      })
      setForm({ title: '', description: '', target_date: '', target_value: '', unit: '' })
      setShowForm(false)
      await load()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not create this goal')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleProgressSave(id, current_value) {
    try {
      await goalsApi.setGoalProgress(id, current_value)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update progress')
    }
  }

  async function handleComplete(id) {
    try {
      await goalsApi.completeGoal(id)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not complete this goal')
    }
  }

  async function handleArchive(id) {
    try {
      await goalsApi.archiveGoal(id)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not archive this goal')
    }
  }

  async function handleDelete(id) {
    try {
      await goalsApi.deleteGoal(id)
      setGoals((prev) => prev.filter((g) => g.id !== id))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete this goal')
    }
  }

  return (
    <>
      <PageHeader
        title={t('goals')}
        subtitle="Bigger personal targets — separate from your daily habits"
        action={
          <Button size="sm" onClick={() => setShowForm((s) => !s)}>
            <Icon name={showForm ? 'close' : 'add'} size={16} className="mr-1" />
            {showForm ? 'Cancel' : 'New Goal'}
          </Button>
        }
      />

      {showForm && (
        <Card className="p-4">
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <Field label="Title" required error={formError}>
              <Input placeholder="e.g. Complete 50 DSA problems" value={form.title} onChange={(e) => setField('title', e.target.value)} error={!!formError} />
            </Field>
            <Field label="Notes">
              <Textarea placeholder="Optional details" value={form.description} onChange={(e) => setField('description', e.target.value)} />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Target Date">
                <Input type="date" value={form.target_date} onChange={(e) => setField('target_date', e.target.value)} />
              </Field>
              <Field label="Target #">
                <Input type="number" min="0" placeholder="e.g. 50" value={form.target_value} onChange={(e) => setField('target_value', e.target.value)} />
              </Field>
              <Field label="Unit">
                <Input placeholder="problems" value={form.unit} onChange={(e) => setField('unit', e.target.value)} />
              </Field>
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Adding…' : 'Add Goal'}
            </Button>
          </form>
        </Card>
      )}

      <div className="flex rounded-md bg-surface-container-low p-1 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 h-9 rounded text-label-md font-semibold whitespace-nowrap px-2 transition-colors ${
              filter === f ? 'bg-surface-container-lowest text-primary shadow-card-1' : 'text-on-surface-variant'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        {loading && goals.length === 0 ? (
          <LoadingState label="Loading your goals…" />
        ) : error ? (
          <ErrorState description={error} onRetry={load} />
        ) : filtered.length === 0 ? (
          <EmptyState icon="flag" title="No goals here" description="Add one above to start tracking something bigger." />
        ) : (
          filtered.map((g) => (
            <GoalCard key={g.id} goal={g} onProgressSave={handleProgressSave} onComplete={handleComplete} onArchive={handleArchive} onDelete={handleDelete} />
          ))
        )}
      </div>
    </>
  )
}
