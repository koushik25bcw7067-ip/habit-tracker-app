import { useMemo, useState } from 'react'
import Icon from '../components/ui/Icon'
import PageHeader from '../components/PageHeader'
import RecommendationCard from '../components/RecommendationCard'
import { EmptyState, LoadingState, ErrorState } from '../components/ui/States'
import { useHabits } from '../context/HabitsContext'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'accepted', label: 'Accepted' },
]

export default function Recommendations() {
  const { recommendations, respondRecommendation, loading, error, refresh } = useHabits()
  const [tab, setTab] = useState('all')

  const filtered = useMemo(() => {
    if (tab === 'all') return recommendations
    return recommendations.filter((r) => r.status === tab)
  }, [recommendations, tab])

  const pendingCount = recommendations.filter((r) => r.status === 'pending').length
  const acceptedCount = recommendations.filter((r) => r.status === 'accepted').length

  return (
    <>
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary to-secondary p-5 text-on-primary shadow-card-2 mt-2">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-label-sm font-semibold">
          <Icon name="auto_awesome" size={13} /> CIRCADIAN ENGINE V2.4
        </span>
        <h1 className="font-display text-headline-lg mt-2">Personalized for you ✨</h1>
        <p className="text-body-md mt-1 text-on-primary/90">Actionable habit adjustments calculated from your circadian pattern and exam schedule.</p>
        <div className="flex items-center gap-2 mt-3">
          <span className="px-2.5 py-1 rounded-full bg-white/15 text-label-sm font-semibold flex items-center gap-1">
            <Icon name="trending_up" size={13} /> {pendingCount} Pending
          </span>
          <span className="px-2.5 py-1 rounded-full bg-white/15 text-label-sm font-semibold flex items-center gap-1">
            <Icon name="check_circle" size={13} /> {acceptedCount} Accepted
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3.5 h-9 rounded-full text-label-md font-semibold whitespace-nowrap transition-colors ${
              tab === t.id ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant'
            }`}
          >
            {t.label} ({t.id === 'all' ? recommendations.length : t.id === 'pending' ? pendingCount : acceptedCount})
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {loading && recommendations.length === 0 ? (
          <LoadingState label="Generating recommendations…" />
        ) : error ? (
          <ErrorState description={error} onRetry={refresh} />
        ) : filtered.length === 0 ? (
          <EmptyState icon="auto_awesome" title="Nothing here yet" description="Check back after your next habit-logging cycle." />
        ) : (
          filtered.map((r) => (
            <RecommendationCard
              key={r.id}
              recommendation={r}
              onAccept={(id) => respondRecommendation(id, 'accepted')}
              onDismiss={(id) => respondRecommendation(id, 'dismissed')}
            />
          ))
        )}
      </div>
    </>
  )
}
