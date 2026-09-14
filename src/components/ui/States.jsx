import Icon from './Icon'
import Button from './Button'

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-on-surface-variant">
      <div className="w-9 h-9 rounded-full border-2 border-surface-container-high border-t-primary animate-spin" />
      <span className="text-body-sm">{label}</span>
    </div>
  )
}

export function ErrorState({ title = 'Something went wrong', description, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-error-container flex items-center justify-center">
        <Icon name="error" size={26} className="text-on-error-container" />
      </div>
      <h3 className="font-display text-headline-sm text-on-surface">{title}</h3>
      {description && <p className="text-body-sm text-on-surface-variant max-w-xs">{description}</p>}
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <Icon name="refresh" size={16} className="mr-1.5" />
          Retry
        </Button>
      )}
    </div>
  )
}

export function EmptyState({ icon = 'inbox', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-surface-container-low flex items-center justify-center">
        <Icon name={icon} size={26} className="text-on-surface-variant" />
      </div>
      <h3 className="font-display text-headline-sm text-on-surface">{title}</h3>
      {description && <p className="text-body-sm text-on-surface-variant max-w-xs">{description}</p>}
      {action}
    </div>
  )
}
