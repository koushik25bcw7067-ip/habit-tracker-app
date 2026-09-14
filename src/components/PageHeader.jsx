export default function PageHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-3 mt-2 ${className}`}>
      <div>
        <h1 className="font-display text-headline-lg-mobile md:text-headline-lg text-on-surface tracking-tight">{title}</h1>
        {subtitle && <p className="text-body-sm text-on-surface-variant mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
