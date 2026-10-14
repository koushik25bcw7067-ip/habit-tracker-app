import { useEffect, useState, useCallback, useMemo } from 'react'
import Icon from '../components/ui/Icon'
import PageHeader from '../components/PageHeader'
import { useTheme } from '../context/ThemeContext'
import { Card, Chip, ProgressBar } from '../components/ui/Primitives'
import { LoadingState, ErrorState } from '../components/ui/States'
import * as achievementsApi from '../api/achievements'
import { ApiError } from '../api/client'

// Simple round-number tiers for a visual "level" — purely a presentation grouping of the
// backend's real XP total, not a separate progression system (no new state, no invented data).
function levelFor(xp) {
  const level = Math.floor(xp / 100) + 1
  const into = xp % 100
  return { level, into, next: 100 }
}

export default function Achievements() {
  const { t } = useTheme()
  const [defs, setDefs] = useState(null)
  const [unlocked, setUnlocked] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [d, u] = await Promise.all([achievementsApi.listAchievements(), achievementsApi.listUserAchievements()])
      setDefs(d)
      setUnlocked(u)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load achievements')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const { items, totalXp } = useMemo(() => {
    if (!defs || !unlocked) return { items: [], totalXp: 0 }
    const unlockedByAchievementId = new Map(unlocked.map((u) => [u.achievement_id, u]))
    const items = defs
      .map((a) => ({ ...a, unlockedAt: unlockedByAchievementId.get(a.id)?.unlocked_at || null }))
      .sort((a, b) => (b.unlockedAt ? 1 : 0) - (a.unlockedAt ? 1 : 0) || (a.unlockedAt && b.unlockedAt ? b.unlockedAt.localeCompare(a.unlockedAt) : 0))
    const totalXp = defs.filter((a) => unlockedByAchievementId.has(a.id)).reduce((sum, a) => sum + a.xp, 0)
    return { items, totalXp }
  }, [defs, unlocked])

  if (loading && !defs) return <LoadingState label="Loading achievements…" />
  if (error && !defs) return <ErrorState description={error} onRetry={load} />

  const { level, into, next } = levelFor(totalXp)
  const unlockedCount = items.filter((i) => i.unlockedAt).length

  return (
    <>
      <PageHeader title={t('achievements')} subtitle="Earned from your real activity — nothing here is awarded by the app itself" />

      <Card className="p-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary-fixed flex flex-col items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">Lvl</span>
          <span className="font-display text-headline-md text-primary leading-none">{level}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-display text-headline-sm text-on-surface">{totalXp} XP</span>
            <span className="text-body-sm text-on-surface-variant">{unlockedCount} / {items.length} unlocked</span>
          </div>
          <ProgressBar value={(into / next) * 100} tone="primary" />
          <span className="text-body-sm text-on-surface-variant">{next - into} XP to level {level + 1}</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {items.map((a) => (
          <Card key={a.id} className={`p-3.5 flex items-center gap-3 ${!a.unlockedAt ? 'opacity-50' : ''}`}>
            <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${a.unlockedAt ? 'bg-tertiary-fixed' : 'bg-surface-container-low'}`}>
              <Icon name={a.unlockedAt ? 'emoji_events' : 'lock'} size={20} className={a.unlockedAt ? 'text-tertiary-strong' : 'text-on-surface-variant'} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-body-md font-semibold text-on-surface truncate">{a.name}</div>
              <div className="text-body-sm text-on-surface-variant truncate">{a.description}</div>
            </div>
            <Chip tone={a.unlockedAt ? 'tertiary' : 'neutral'} className="flex-shrink-0">+{a.xp} XP</Chip>
          </Card>
        ))}
      </div>
    </>
  )
}
