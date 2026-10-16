import { useEffect, useState, useCallback } from 'react'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import PageHeader from '../components/PageHeader'
import { useTheme } from '../context/ThemeContext'
import { Field, Select, Input } from '../components/ui/Form'
import { Card } from '../components/ui/Primitives'
import { EmptyState, LoadingState, ErrorState } from '../components/ui/States'
import * as remindersApi from '../api/reminders'
import { useHabits } from '../context/HabitsContext'
import { formatReminderTime, parseReminderTime, DAY_LETTERS } from '../api/adapters'
import { ApiError } from '../api/client'

function todayDefaultTime() {
  return '9:00 AM'
}

export default function Reminders() {
  const { t } = useTheme()
  const { habits } = useHabits()
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ habit_id: '', time: todayDefaultTime(), days: [], enabled: true })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setReminders(await remindersApi.listReminders())
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your reminders')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function habitName(id) {
    return habits.find((h) => h.id === id)?.name || 'Unknown routine'
  }

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function toggleDay(i) {
    setForm((f) => ({ ...f, days: f.days.includes(i) ? f.days.filter((d) => d !== i) : [...f.days, i].sort() }))
  }

  function startCreate() {
    setEditingId(null)
    setForm({ habit_id: habits[0]?.id ?? '', time: todayDefaultTime(), days: [], enabled: true })
    setFormError('')
    setShowForm(true)
  }

  function startEdit(r) {
    setEditingId(r.id)
    setForm({
      habit_id: r.habit_id,
      time: formatReminderTime(r.reminder_time),
      days: r.reminder_days || [],
      enabled: r.enabled,
    })
    setFormError('')
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.habit_id) {
      setFormError('Pick a routine')
      return
    }
    const reminder_time = parseReminderTime(form.time)
    if (!reminder_time) {
      setFormError('Enter a valid time, e.g. 9:00 AM')
      return
    }
    setSubmitting(true)
    setFormError('')
    try {
      const payload = { habit_id: Number(form.habit_id), enabled: form.enabled, reminder_time, reminder_days: form.days }
      if (editingId) await remindersApi.updateReminder(editingId, payload)
      else await remindersApi.createReminder(payload)
      setShowForm(false)
      await load()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not save this reminder')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleEnabled(r) {
    const optimistic = reminders.map((x) => (x.id === r.id ? { ...x, enabled: !x.enabled } : x))
    setReminders(optimistic)
    try {
      await remindersApi.updateReminder(r.id, {
        habit_id: r.habit_id, enabled: !r.enabled, reminder_time: r.reminder_time, reminder_days: r.reminder_days,
      })
    } catch {
      load()
    }
  }

  async function handleDelete(r) {
    try {
      await remindersApi.deleteReminder(r.id)
      setReminders((prev) => prev.filter((x) => x.id !== r.id))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete this reminder')
    }
  }

  return (
    <>
      <PageHeader
        title={t('reminders')}
        subtitle="Get nudged at the right time for routines that matter"
        action={
          <Button size="sm" onClick={showForm ? () => setShowForm(false) : startCreate} disabled={habits.length === 0}>
            <Icon name={showForm ? 'close' : 'add'} size={16} className="mr-1" />
            {showForm ? 'Cancel' : 'New Reminder'}
          </Button>
        }
      />

      {habits.length === 0 && !showForm && (
        <Card className="p-4 text-body-sm text-on-surface-variant">Add a routine first — reminders are attached to a routine.</Card>
      )}

      {showForm && (
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Field label="Routine" required>
              <Select value={form.habit_id} onChange={(e) => set('habit_id', e.target.value)}>
                {habits.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Time" required error={formError}>
              <Input placeholder="9:00 AM" value={form.time} onChange={(e) => set('time', e.target.value)} error={!!formError} />
            </Field>
            <Field label="Days (leave empty for every day)">
              <div className="flex items-center gap-1.5">
                {DAY_LETTERS.map((d, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={`flex-1 h-10 rounded-md text-label-md font-semibold transition-colors ${
                      form.days.includes(i) ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </Field>
            <label className="flex items-center gap-2.5 text-body-sm text-on-surface">
              <input type="checkbox" checked={form.enabled} onChange={(e) => set('enabled', e.target.checked)} className="w-4 h-4 accent-primary" />
              Enabled
            </label>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : editingId ? 'Save Changes' : 'Add Reminder'}
            </Button>
          </form>
        </Card>
      )}

      <div className="flex flex-col gap-2.5">
        {loading && reminders.length === 0 ? (
          <LoadingState label="Loading your reminders…" />
        ) : error ? (
          <ErrorState description={error} onRetry={load} />
        ) : reminders.length === 0 ? (
          !showForm && <EmptyState icon="notifications" title="No reminders yet" description="Add one above to get nudged at the right time." />
        ) : (
          reminders.map((r) => (
            <Card key={r.id} className="p-3.5 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className={`text-body-md font-semibold truncate ${r.enabled ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                  {habitName(r.habit_id)}
                </div>
                <div className="text-body-sm text-on-surface-variant">
                  {formatReminderTime(r.reminder_time)} · {r.reminder_days?.length ? r.reminder_days.map((d) => DAY_LETTERS[d]).join(', ') : 'Every day'}
                </div>
              </div>
              <button
                onClick={() => handleToggleEnabled(r)}
                className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${r.enabled ? 'bg-tertiary' : 'bg-outline-variant'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${r.enabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
              </button>
              <button onClick={() => startEdit(r)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low flex-shrink-0">
                <Icon name="edit" size={16} className="text-on-surface-variant" />
              </button>
              <button onClick={() => handleDelete(r)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low flex-shrink-0">
                <Icon name="delete" size={16} className="text-on-surface-variant" />
              </button>
            </Card>
          ))
        )}
      </div>
    </>
  )
}
