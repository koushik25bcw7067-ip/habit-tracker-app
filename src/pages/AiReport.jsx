import { useEffect, useState, useCallback } from 'react'
import Icon from '../components/ui/Icon'
import PageHeader from '../components/PageHeader'
import { Chip } from '../components/ui/Primitives'
import Button from '../components/ui/Button'
import { Input } from '../components/ui/Form'
import { LoadingState, ErrorState } from '../components/ui/States'
import { weeklyReport, monthlyReport, suggestHabits } from '../api/ai'
import { weeklyStats, monthlyStats } from '../api/statistics'
import { useHabits } from '../context/HabitsContext'
import { ApiError } from '../api/client'

function SummaryCard({ label, headline, summary, completion, delta, accent }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-card-1 p-4 flex flex-col gap-2">
      <Chip tone={accent}>{label}</Chip>
      <h3 className="font-display text-headline-sm text-on-surface">{headline}</h3>
      <p className="text-body-sm text-on-surface-variant">{summary}</p>
      <div className="flex items-end gap-2 mt-1">
        <span className="font-display text-stat-counter text-2xl text-on-surface">{completion}%</span>
        <span className="text-body-sm text-tertiary font-semibold mb-1">{delta}</span>
      </div>
    </div>
  )
}

export default function AiReport() {
  const { categories, addHabit } = useHabits()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [goal, setGoal] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [suggesting, setSuggesting] = useState(false)
  const [addedNames, setAddedNames] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [wr, mr, ws, ms] = await Promise.all([weeklyReport(), monthlyReport(), weeklyStats(), monthlyStats()])
      setData({ wr, mr, ws, ms })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not generate your AI report')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleSuggest(e) {
    e.preventDefault()
    if (goal.trim().length < 3) return
    setSuggesting(true)
    try {
      const res = await suggestHabits(goal.trim())
      setSuggestions(res.suggestions || [])
    } catch {
      setSuggestions([])
    } finally {
      setSuggesting(false)
    }
  }

  async function handleAddSuggestion(s) {
    const category = categories.find((c) => c.label.toLowerCase() === (s.category || '').toLowerCase())
    const now = new Date()
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    await addHabit({
      name: s.name,
      description: s.description || '',
      category: category?.id ?? categories[0]?.id ?? '',
      frequency: ['daily', 'weekly', 'custom'].includes(s.frequency) ? s.frequency : 'daily',
      targetDays: [],
      startDate,
      priority: 'Medium',
      targetValue: s.target_value || 1,
      unit: '',
      time: '9:00 AM',
      active: true,
    })
    setAddedNames((n) => [...n, s.name])
  }

  if (loading && !data) return <LoadingState label="Generating your AI report…" />
  if (error && !data) return <ErrorState description={error} onRetry={load} />

  const { wr, mr, ws, ms } = data
  const insights = [...(wr.patterns || []), ...(mr.patterns || [])]
  const improvements = [...(wr.recommendations || []), ...(mr.recommendations || [])]

  return (
    <>
      <PageHeader title="AI Report" subtitle="Generated from your verified habit logs and completion patterns" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SummaryCard
          label="Weekly Summary"
          headline={wr.source_status === 'ai' ? 'AI-Generated Summary' : 'Rule-Based Summary'}
          summary={wr.summary}
          completion={ws.completion_rate}
          delta={`${ws.trend_vs_previous_period >= 0 ? '+' : ''}${ws.trend_vs_previous_period}% vs last week`}
          accent="primary"
        />
        <SummaryCard
          label="Monthly Summary"
          headline={mr.source_status === 'ai' ? 'AI-Generated Summary' : 'Rule-Based Summary'}
          summary={mr.summary}
          completion={ms.completion_rate}
          delta={`${ms.trend_vs_previous_period >= 0 ? '+' : ''}${ms.trend_vs_previous_period}% vs last month`}
          accent="secondary"
        />
      </div>

      {insights.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl shadow-card-1 p-4 flex flex-col gap-3">
          <h3 className="font-display text-headline-sm text-on-surface">Key Insights</h3>
          {insights.map((text, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center flex-shrink-0">
                <Icon name="insights" size={16} className="text-primary" />
              </div>
              <p className="text-body-sm text-on-surface pt-1">{text}</p>
            </div>
          ))}
        </div>
      )}

      {improvements.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl shadow-card-1 p-4 flex flex-col gap-3">
          <h3 className="font-display text-headline-sm text-on-surface">Suggested Improvements</h3>
          {improvements.map((text, i) => (
            <div key={i} className="flex items-center gap-2.5 bg-surface-container-low rounded-md px-3 py-2.5">
              <Icon name="tips_and_updates" size={16} className="text-warning flex-shrink-0" />
              <span className="text-body-sm text-on-surface">{text}</span>
            </div>
          ))}
        </div>
      )}

      <div className="bg-gradient-to-br from-secondary-fixed/50 to-primary-fixed/50 rounded-xl p-4 flex flex-col gap-3">
        <h3 className="font-display text-headline-sm text-on-surface">New Habit Suggestions</h3>
        <form onSubmit={handleSuggest} className="flex items-center gap-2">
          <Input placeholder="What's a goal you're working toward?" value={goal} onChange={(e) => setGoal(e.target.value)} className="bg-surface-container-lowest/80" />
          <Button type="submit" size="md" disabled={suggesting || goal.trim().length < 3}>
            {suggesting ? '…' : 'Suggest'}
          </Button>
        </form>
        {suggestions.map((h, i) => (
          <div key={i} className="bg-surface-container-lowest/80 rounded-md p-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-body-md font-semibold text-on-surface">{h.name}</div>
              <div className="text-body-sm text-on-surface-variant">{h.reason}</div>
            </div>
            {addedNames.includes(h.name) ? (
              <Chip tone="tertiary">Added</Chip>
            ) : (
              <Button size="sm" variant="secondary" icon="add" onClick={() => handleAddSuggestion(h)}>
                <Icon name="add" size={14} className="mr-1" />
                Add
              </Button>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
