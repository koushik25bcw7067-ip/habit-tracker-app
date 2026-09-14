import Icon from './ui/Icon'

const STATUS_DOT = {
  full: 'bg-tertiary-strong',
  high: 'bg-tertiary-fixed-dim',
  partial: 'bg-secondary-container',
  missed: 'bg-error',
  upcoming: 'bg-outline-variant',
}

const LEGEND = [
  { status: 'full', label: '100%' },
  { status: 'high', label: '75-99%' },
  { status: 'partial', label: '50-74%' },
  { status: 'missed', label: 'Missed' },
  { status: 'upcoming', label: 'Upcoming' },
]

export default function CalendarGrid({ monthLabel, days, selectedDate, onSelect, onPrev, onNext, onToday, startWeekday = 0 }) {
  // startWeekday = day-of-week index (0=Mon) that the 1st of the month falls on
  const leadingBlanks = Array.from({ length: startWeekday })

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-card-1 border border-surface-container-high/60 p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onPrev} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low">
          <Icon name="chevron_left" size={20} />
        </button>
        <h3 className="font-display text-headline-sm text-on-surface">{monthLabel}</h3>
        <button onClick={onNext} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low">
          <Icon name="chevron_right" size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={i} className="text-[11px] text-on-surface-variant font-semibold">
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {leadingBlanks.map((_, i) => (
          <div key={`b${i}`} />
        ))}
        {days.map((day) => {
          const isSelected = selectedDate === day.date
          const isToday = day.status === 'today'
          return (
            <button
              key={day.date}
              onClick={() => onSelect?.(day.date)}
              className={`aspect-square rounded-md flex flex-col items-center justify-center gap-0.5 text-body-sm transition-colors ${
                isSelected || isToday ? 'bg-primary text-on-primary font-bold' : 'hover:bg-surface-container-low text-on-surface'
              }`}
            >
              <span>{day.date}</span>
              {!isToday && !isSelected && <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[day.status]}`} />}
              {(isToday || isSelected) && <span className="w-1.5 h-1.5 rounded-full bg-white/80" />}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-surface-container-high">
        {LEGEND.map((l) => (
          <div key={l.status} className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${STATUS_DOT[l.status]}`} />
            <span className="text-[11px] text-on-surface-variant">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
