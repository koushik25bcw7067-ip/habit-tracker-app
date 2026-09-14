import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './ui/Icon'
import { Field, Input, Select, Textarea } from './ui/Form'
import Button from './ui/Button'
import { useHabits } from '../context/HabitsContext'
import { DAY_LETTERS } from '../api/adapters'

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly (same day as start date)' },
  { value: 'custom', label: 'Custom days' },
]
const PRIORITIES = ['Low', 'Medium', 'High']
const UNITS = ['minutes', 'hours', 'ml', 'L', 'reps', 'pages', 'check']

function todayLocalISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function HabitForm({ initial, onSubmit, submitLabel = 'Save Habit' }) {
  const navigate = useNavigate()
  const { categories } = useHabits()
  const [form, setForm] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    category: initial?.category ?? categories[0]?.id ?? '',
    frequency: initial?.frequencyRaw || 'daily',
    targetDays: initial?.targetDaysRaw || [],
    startDate: initial?.startDate || todayLocalISO(),
    priority: initial?.priority || 'Medium',
    targetValue: initial?.targetValue ?? 30,
    unit: initial?.unit || 'minutes',
    time: initial?.time && initial.time !== 'Anytime' ? initial.time : '9:00 AM',
    active: initial?.active ?? true,
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function toggleDay(index) {
    setForm((f) => ({
      ...f,
      targetDays: f.targetDays.includes(index) ? f.targetDays.filter((d) => d !== index) : [...f.targetDays, index].sort(),
    }))
  }

  function validate() {
    const next = {}
    if (!form.name.trim()) next.name = 'Habit name is required'
    if (form.name.trim().length > 60) next.name = 'Keep it under 60 characters'
    if (!form.startDate) next.startDate = 'Start date is required'
    if (form.targetValue === '' || Number(form.targetValue) <= 0) next.targetValue = 'Enter a value greater than 0'
    if (form.frequency === 'custom' && form.targetDays.length === 0) next.targetDays = 'Pick at least one day'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setSubmitError('')
    try {
      await onSubmit({ ...form, targetValue: Number(form.targetValue) })
    } catch (err) {
      setSubmitError(err.message || 'Could not save this habit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="bg-surface-container-lowest rounded-xl shadow-card-1 p-4 flex flex-col gap-4">
        <Field label="Habit Name" required error={errors.name}>
          <Input placeholder="e.g. Study DSA & LeetCode" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} maxLength={60} />
        </Field>

        <Field label="Description" hint="Add context, focus areas, or a specific target.">
          <Textarea placeholder="What does success look like for this habit?" value={form.description} onChange={(e) => set('description', e.target.value)} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <Select value={form.category} onChange={(e) => set('category', e.target.value)}>
              {categories.length === 0 && <option value="">No categories yet</option>}
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={form.priority} onChange={(e) => set('priority', e.target.value)}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Frequency">
          <Select value={form.frequency} onChange={(e) => set('frequency', e.target.value)}>
            {FREQUENCIES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </Select>
        </Field>

        {form.frequency === 'custom' && (
          <Field label="Which days?" required error={errors.targetDays}>
            <div className="flex items-center gap-1.5">
              {DAY_LETTERS.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={`flex-1 h-10 rounded-md text-label-md font-semibold transition-colors ${
                    form.targetDays.includes(i) ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Start Date" required error={errors.startDate}>
            <Input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} error={errors.startDate} />
          </Field>
          <Field label="Preferred Time" hint="e.g. 9:00 AM">
            <Input placeholder="9:00 AM" value={form.time} onChange={(e) => set('time', e.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Target Value" required error={errors.targetValue}>
            <Input type="number" min="1" value={form.targetValue} onChange={(e) => set('targetValue', e.target.value)} error={errors.targetValue} />
          </Field>
          <Field label="Unit">
            <Select value={form.unit} onChange={(e) => set('unit', e.target.value)}>
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <label className="flex items-center justify-between bg-surface-container-low rounded-md px-3.5 h-12">
          <span className="text-body-md font-medium text-on-surface flex items-center gap-2">
            <Icon name="toggle_on" size={18} className="text-tertiary" />
            Active status
          </span>
          <button
            type="button"
            onClick={() => set('active', !form.active)}
            className={`w-11 h-6 rounded-full transition-colors relative ${form.active ? 'bg-tertiary' : 'bg-outline-variant'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.active ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
          </button>
        </label>
      </div>

      {submitError && (
        <div className="flex items-center gap-2 bg-error-container/50 text-on-error-container rounded-md px-3.5 py-2.5 text-body-sm">
          <Icon name="error" size={16} className="flex-shrink-0" />
          {submitError}
        </div>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" fullWidth onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
