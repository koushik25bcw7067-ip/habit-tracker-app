import { useMemo, useState } from 'react'
import {
  CalendarDays,
  Clock3,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'

const EMPTY_ITEM = {
  time: '',
  title: '',
  type: 'Task',
  priority: 'Medium',
  reminder: false,
}

function getToday() {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  return new Date(now.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 10)
}

export default function DayPlanner() {
  const [showCreate, setShowCreate] = useState(false)

  const [date, setDate] = useState(getToday())
  const [title, setTitle] = useState('')
  const [goal, setGoal] = useState('')

  const [items, setItems] = useState([])
  const [draft, setDraft] = useState(EMPTY_ITEM)

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) =>
      (a.time || '99:99').localeCompare(b.time || '99:99'),
    )
  }, [items])

  function openCreate() {
    setShowCreate(true)
  }

  function closeCreate() {
    setShowCreate(false)
    setDraft(EMPTY_ITEM)
  }

  function addItem(event) {
    event.preventDefault()

    if (!draft.title.trim()) return

    const newItem = {
      ...draft,
      id: Date.now(),
      title: draft.title.trim(),
    }

    setItems((current) => [...current, newItem])
    setDraft(EMPTY_ITEM)
  }

  function removeItem(id) {
    setItems((current) => current.filter((item) => item.id !== id))
  }

  function savePlan() {
    /*
      Temporary frontend save.

      Next step:
      connect this to:
      POST /day-plans
    */
    setShowCreate(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Day Planner
          </div>

          <h1 className="mt-1 text-2xl font-bold text-text">
            Plan your day
          </h1>

          <p className="mt-1 text-sm text-muted">
            Create and organize your own daily plan.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Create Plan
        </button>
      </div>

      {/* Empty state */}
      {items.length === 0 ? (
        <section className="rounded-2xl border border-border bg-surface p-8 text-center sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <CalendarDays className="h-7 w-7 text-primary" />
          </div>

          <h2 className="mt-5 text-lg font-semibold text-text">
            No plan created yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            Create a plan for your day and add tasks, habits, time slots,
            priorities, and reminders.
          </p>

          <button
            type="button"
            onClick={openCreate}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-text transition hover:bg-surface-muted"
          >
            <Plus className="h-4 w-4" />
            Create your first plan
          </button>
        </section>
      ) : (
        /* Existing plan */
        <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-muted">
                {new Intl.DateTimeFormat(undefined, {
                  dateStyle: 'long',
                }).format(new Date(`${date}T00:00:00`))}
              </p>

              <h2 className="mt-1 text-xl font-semibold text-text">
                {title || 'My Day Plan'}
              </h2>

              {goal && (
                <p className="mt-1 text-sm text-muted">
                  Goal: {goal}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 self-start rounded-xl border border-border px-3 py-2 text-sm font-medium text-text hover:bg-surface-muted"
            >
              <Plus className="h-4 w-4" />
              Add item
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {sortedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-border p-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Clock3 className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-medium text-text">
                    {item.title}
                  </p>

                  <p className="mt-1 text-xs text-muted">
                    {item.time || 'No time'} · {item.type} ·{' '}
                    {item.priority}
                    {item.reminder ? ' · Reminder on' : ''}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  aria-label={`Remove ${item.title}`}
                  className="rounded-lg p-2 text-muted hover:bg-surface-muted hover:text-text"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Create Plan Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-surface p-5 shadow-xl sm:p-6">
            {/* Modal header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-primary">
                  <CalendarDays className="h-5 w-5" />

                  <h2 className="text-lg font-semibold text-text">
                    Create Day Plan
                  </h2>
                </div>

                <p className="mt-1 text-sm text-muted">
                  Set your date, goal, and the items you want to complete.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreate}
                aria-label="Close"
                className="rounded-lg p-2 text-muted hover:bg-surface-muted hover:text-text"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Plan details */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-text">
                Date

                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
                />
              </label>

              <label className="text-sm font-medium text-text">
                Plan title

                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="My Productive Day"
                  className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
                />
              </label>
            </div>

            <label className="mt-4 block text-sm font-medium text-text">
              Main goal

              <input
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                placeholder="What is the main thing you want to achieve?"
                className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
              />
            </label>

            {/* Add item */}
            <form
              onSubmit={addItem}
              className="mt-6 rounded-2xl bg-surface-muted p-4"
            >
              <h3 className="text-sm font-semibold text-text">
                Add item
              </h3>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium text-text">
                  Time

                  <input
                    type="time"
                    value={draft.time}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        time: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
                  />
                </label>

                <label className="text-sm font-medium text-text">
                  Item

                  <input
                    value={draft.title}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="DSA Module 3"
                    required
                    className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
                  />
                </label>

                <label className="text-sm font-medium text-text">
                  Type

                  <select
                    value={draft.type}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        type: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
                  >
                    <option>Task</option>
                    <option>Habit</option>
                    <option>Personal</option>
                  </select>
                </label>

                <label className="text-sm font-medium text-text">
                  Priority

                  <select
                    value={draft.priority}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        priority: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </label>
              </div>

              <label className="mt-4 flex items-center gap-2 text-sm text-text">
                <input
                  type="checkbox"
                  checked={draft.reminder}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      reminder: event.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />

                Set a reminder for this item
              </label>

              <button
                type="submit"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
            </form>

            {/* Items preview */}
            {sortedItems.length > 0 && (
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-text">
                  Items in this plan
                </h3>

                <div className="mt-3 space-y-2">
                  {sortedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-xl border border-border p-3"
                    >
                      <span className="text-xs font-medium text-muted">
                        {item.time || '--:--'}
                      </span>

                      <span className="min-w-0 flex-1 truncate text-sm text-text">
                        {item.title}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove ${item.title}`}
                        className="rounded-lg p-1.5 text-muted hover:bg-surface-muted hover:text-text"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeCreate}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text hover:bg-surface-muted"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={savePlan}
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                Save Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}