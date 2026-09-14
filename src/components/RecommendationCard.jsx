import Icon from './ui/Icon'
import Button from './ui/Button'
import { Chip } from './ui/Primitives'

const STATUS_LABEL = { pending: 'Pending', accepted: 'Accepted', dismissed: 'Dismissed' }
const STATUS_TONE = { pending: 'warning', accepted: 'tertiary', dismissed: 'neutral' }

export default function RecommendationCard({ recommendation, onAccept, onDismiss }) {
  const r = recommendation
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-card-1 border border-surface-container-high/60 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary-fixed flex items-center justify-center flex-shrink-0">
            <Icon name={r.icon} size={18} className="text-primary" />
          </div>
          <div>
            <h3 className="font-display text-headline-sm text-on-surface leading-snug">{r.title}</h3>
            <span className="text-body-sm text-primary font-medium">{r.tag}</span>
          </div>
        </div>
        <Chip tone={STATUS_TONE[r.status]} className="flex-shrink-0">
          {STATUS_LABEL[r.status]}
        </Chip>
      </div>

      <p className="text-body-sm text-on-surface-variant">
        <span className="font-semibold text-on-surface">AI Rationale: </span>
        {r.rationale}
      </p>

      <div className="bg-surface-container-low rounded-md px-3 py-2.5 flex items-center gap-2 text-body-sm text-on-surface">
        <Icon name="sync_alt" size={16} className="text-primary flex-shrink-0" />
        {r.action}
      </div>

      {r.status === 'pending' && (
        <div className="flex items-center gap-3">
          <Button variant="primary" size="md" fullWidth icon="check" onClick={() => onAccept?.(r.id)}>
            <Icon name="check" size={16} className="mr-1.5" />
            {r.acceptLabel}
          </Button>
          <button onClick={() => onDismiss?.(r.id)} className="text-body-md text-on-surface-variant font-semibold px-2 whitespace-nowrap hover:text-on-surface">
            {r.dismissLabel}
          </button>
        </div>
      )}
    </div>
  )
}
