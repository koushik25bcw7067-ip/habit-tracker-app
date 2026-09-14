import Icon from './ui/Icon'

export default function StatCard({ label, value, sublabel, icon, trend, trendPositive = true, tone = 'default' }) {
  const toneText = {
    default: 'text-on-surface',
    primary: 'text-primary',
    tertiary: 'text-tertiary',
  }[tone]

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-card-1 border border-surface-container-high/60 p-3.5 flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        {icon && <Icon name={icon} size={14} className="text-on-surface-variant" />}
        <span className="text-[10px] text-on-surface-variant font-semibold tracking-tight uppercase">{label}</span>
      </div>
      <span className={`font-display text-stat-counter ${toneText}`}>{value}</span>
      {sublabel && (
        <span className={`text-[11px] font-semibold flex items-center gap-0.5 ${trend ? (trendPositive ? 'text-tertiary' : 'text-error') : 'text-on-surface-variant'}`}>
          {trend && <Icon name={trendPositive ? 'trending_up' : 'trending_down'} size={12} />}
          {sublabel}
        </span>
      )}
    </div>
  )
}
