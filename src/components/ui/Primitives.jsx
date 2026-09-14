export function Card({ children, className = '', as: As = 'div', ...props }) {
  return (
    <As
      className={`bg-surface-container-lowest rounded-xl shadow-card-1 border border-surface-container-high/60 ${className}`}
      {...props}
    >
      {children}
    </As>
  )
}

const CHIP_TONES = {
  primary: 'bg-primary-fixed text-on-primary-fixed-variant',
  tertiary: 'bg-tertiary-fixed/40 text-tertiary-strong',
  secondary: 'bg-secondary-fixed text-on-secondary-fixed-variant',
  warning: 'bg-warning/15 text-warning',
  error: 'bg-error-container text-on-error-container',
  neutral: 'bg-surface-container text-on-surface-variant',
}

export function Chip({ children, tone = 'neutral', className = '', icon }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-label-sm font-semibold ${CHIP_TONES[tone]} ${className}`}
    >
      {icon}
      {children}
    </span>
  )
}

export function ProgressBar({ value = 0, className = '', tone = 'primary', trackClassName = '' }) {
  const toneClass = {
    primary: 'bg-primary',
    tertiary: 'bg-tertiary',
    warning: 'bg-warning',
    secondary: 'bg-secondary',
  }[tone]
  return (
    <div className={`h-2 w-full rounded-full bg-surface-container-high overflow-hidden ${trackClassName}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${toneClass} ${className}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
