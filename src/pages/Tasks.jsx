import { useEffect, useState, useCallback, useMemo } from 'react'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import PageHeader from '../components/PageHeader'
import { Field, Input, Select, Textarea } from '../components/ui/Form'
import { Card, Chip } from '../components/ui/Primitives'
import { EmptyState, LoadingState, ErrorState } from '../components/ui/States'
import * as tasksApi from '../api/tasks'
import { priorityToUI, priorityToApi, parseISODateLocal } from '../api/adapters'
import { ApiError } from '../api/client'
import { useTheme } from '../context/ThemeContext'
import { emitCompanion } from '../theme/companionBus'

const PRIORITY_TONE = { High: 'error', Medium: 'warning', Low: 'neutral' }
const FILTERS = ['Pending', 'Done', 'All']

function todayLocalISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dueLabel(task) {
  if (!task.due_date) return null
  const today = todayLocalISO()
  if (task.due_date < today && task.status === 'pending') return { text: 'Overdue', tone: 'error' }
  if (task.due_date === today) return { text: 'Due today', tone: 'warning' }
  const d = parseISODateLocal(task.due_date)
  return { text: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), tone: 'neutral' }
}

function TaskRow({ task, onToggle, onDelete }) {
  const due = dueLabel(task)
  const done = task.status === 'done'
  return (
    <Card className="p-3.5 flex items-center gap-3">
      <button
        onClick={() => onToggle(task)}
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
          done ? 'bg-tertiary' : 'border-2 border-outline-variant hover:border-primary'
        }`}
      >
        {done && <Icon name="check" size={16} className="text-on-tertiary" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className={`text-body-md font-semibold truncate ${done ? 'text-on-surface-variant line-through' : 'text-on-surface'}`}>
          {task.title}
        </div>
        {task.description && <div className="text-body-sm text-on-surface-variant truncate">{task.description}</div>}
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <Chip tone={PRIORITY_TONE[priorityToUI(task.priority)]}>{priorityToUI(task.priority)}</Chip>
          {due && <Chip tone={due.tone}>{due.text}</Chip>}
          {task.reminder_enabled && <Chip tone="primary" icon={<Icon name="notifications" size={12} />}>Reminder</Chip>}
        </div>
      </div>
      <button onClick={() => onDelete(task)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low flex-shrink-0">
        <Icon name="delete" size={16} className="text-on-surface-variant" />
      </button>
    </Card>
  )
}

export default function Tasks() {
  const { t } = useTheme()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('Pending')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', due_date: '', priority: 'Medium', reminder_enabled: false })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setTasks(await tasksApi.listTasks())
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your tasks')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const refreshAfterCompanionAction = (event) => {
      if (event.detail?.action_type?.endsWith('_task')) load()
    }
    window.addEventListener('companion:action', refreshAfterCompanionAction)
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') load()
    }
    window.addEventListener('focus', refreshWhenVisible)
    document.addEventListener('visibilitychange', refreshWhenVisible)
    const interval = window.setInterval(refreshWhenVisible, 30_000)
    return () => {
      window.removeEventListener('focus', refreshWhenVisible)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
      window.removeEventListener('companion:action', refreshAfterCompanionAction)
      window.clearInterval(interval)
    }
  }, [load])

  const filtered = useMemo(() => {
    if (filter === 'All') return tasks
    return tasks.filter((t) => t.status === filter.toLowerCase())
  }, [tasks, filter])

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
      await tasksApi.createTask({
        title: form.title.trim(),
        description: form.description.trim() || null,
        due_date: form.due_date || null,
        priority: priorityToApi(form.priority),
        reminder_enabled: form.reminder_enabled,
      })
      setForm({ title: '', description: '', due_date: '', priority: 'Medium', reminder_enabled: false })
      setShowForm(false)
      await load()
      emitCompanion('task_created', { task: form.title.trim() })
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not create this task')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggle(task) {
    const optimistic = tasks.map((t) => (t.id === task.id ? { ...t, status: task.status === 'done' ? 'pending' : 'done' } : t))
    setTasks(optimistic)
    try {
      if (task.status === 'done') await tasksApi.reopenTask(task.id)
      else {
        await tasksApi.completeTask(task.id)
        emitCompanion('task_done', { task: task.title, remaining: tasks.filter((x) => x.id !== task.id && x.status !== 'done').length })
      }
    } catch {
      load() // roll back to server truth on failure
    }
  }

  async function handleDelete(task) {
    try {
      await tasksApi.deleteTask(task.id)
      setTasks((prev) => prev.filter((t) => t.id !== task.id))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete this task')
    }
  }

  return (
    <>
      <PageHeader
        title={t('tasks')}
        subtitle="One-off to-dos — assignments, submissions, errands. Separate from your recurring routines."
        action={
          <Button size="sm" onClick={() => setShowForm((s) => !s)}>
            <Icon name={showForm ? 'close' : 'add'} size={16} className="mr-1" />
            {showForm ? 'Cancel' : 'New Task'}
          </Button>
        }
      />

      {showForm && (
        <Card className="p-4">
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <Field label="Title" required error={formError}>
              <Input placeholder="e.g. Submit assignment 3" value={form.title} onChange={(e) => setField('title', e.target.value)} error={!!formError} />
            </Field>
            <Field label="Notes">
              <Textarea placeholder="Optional details" value={form.description} onChange={(e) => setField('description', e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Due Date">
                <Input type="date" value={form.due_date} onChange={(e) => setField('due_date', e.target.value)} />
              </Field>
              <Field label="Priority">
                <Select value={form.priority} onChange={(e) => setField('priority', e.target.value)}>
                  {['Low', 'Medium', 'High'].map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <label className="flex items-center gap-2.5 text-body-sm text-on-surface">
              <input type="checkbox" checked={form.reminder_enabled} onChange={(e) => setField('reminder_enabled', e.target.checked)} className="w-4 h-4 accent-primary" />
              Remind me about this task
            </label>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Adding…' : 'Add Task'}
            </Button>
          </form>
        </Card>
      )}

      <div className="flex rounded-md bg-surface-container-low p-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 h-9 rounded text-label-md font-semibold transition-colors ${
              filter === f ? 'bg-surface-container-lowest text-primary shadow-card-1' : 'text-on-surface-variant'
            }`}
          >
            {f} {f !== 'All' ? `(${tasks.filter((t) => t.status === f.toLowerCase()).length})` : `(${tasks.length})`}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        {loading && tasks.length === 0 ? (
          <LoadingState label="Loading your tasks…" />
        ) : error ? (
          <ErrorState description={error} onRetry={load} />
        ) : filtered.length === 0 ? (
          <EmptyState icon="checklist" title={t('empty_tasks')} description="Add a task above to get started." />
        ) : (
          filtered.map((t) => <TaskRow key={t.id} task={t} onToggle={handleToggle} onDelete={handleDelete} />)
        )}
      </div>
    </>
  )
}
