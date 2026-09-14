import { NavLink } from 'react-router-dom'
import Icon from '../ui/Icon'

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: 'home' },
  { path: '/habits', label: 'Habits', icon: 'checklist' },
  { path: '/calendar', label: 'Calendar', icon: 'calendar_month' },
  { path: '/statistics', label: 'Statistics', icon: 'bar_chart' },
  { path: '/companion', label: 'Companion', icon: 'auto_awesome', dot: true },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 w-full z-50 pb-safe bg-surface/85 backdrop-blur-xl shadow-[0_-2px_16px_rgba(79,70,229,0.06)]">
      <div className="h-16 px-space-xs flex items-center justify-around max-w-3xl mx-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `min-w-[56px] min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors relative ${
                isActive ? 'text-primary font-semibold' : 'text-on-surface-variant hover:text-on-surface'
              }`
            }
          >
            <Icon name={item.icon} size={22} />
            <span className="text-[10px] tracking-tight font-medium">{item.label}</span>
            {item.dot && <span className="absolute top-0 right-2.5 w-2 h-2 rounded-full bg-secondary-container shadow-streak" />}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
