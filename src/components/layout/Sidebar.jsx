import { NavLink } from 'react-router-dom'
import Icon from '../ui/Icon'
import Button from '../ui/Button'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', vk: 'dashboard', icon: 'home' },
  { path: '/habits', label: 'My Routines', vk: 'habits', icon: 'checklist' },
  { path: '/tasks', label: 'Tasks', vk: 'tasks', icon: 'task_alt' },
  { path: '/goals', label: 'Goals', vk: 'goals', icon: 'flag' },
  { path: '/calendar', label: 'Calendar', icon: 'calendar_month' },
  { path: '/day-planner', label: 'Day Planner', icon: 'event_note' },
  { path: '/statistics', label: 'Statistics', icon: 'bar_chart' },
  { path: '/ai', label: 'AI Hub', icon: 'auto_awesome' },
  { path: '/progress', label: 'My Progress', icon: 'monitoring' },
  { path: '/profile', label: 'Profile', icon: 'person' },
]

export default function Sidebar() {
  const { logout } = useAuth()
  const { t } = useTheme()
  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 flex-col border-r border-surface-container-high bg-surface-container-lowest px-4 py-6 gap-6 z-40">
      <div className="flex items-center gap-2.5 px-2">
        <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-card-1">
          <Icon name="face_3" size={23} className="text-on-primary" />
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface-container-lowest bg-tertiary" />
        </div>
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="font-display text-headline-sm text-on-surface">Mini AI</span>
          <span className="text-[9px] font-bold tracking-[0.16em] text-primary">COMPANION</span>
        </div>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 h-11 rounded-md text-body-md font-medium transition-colors ${
                isActive ? 'bg-primary-fixed text-primary-strong font-semibold' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
              }`
            }
          >
            <Icon name={item.icon} size={20} />
            {item.vk ? t(item.vk) : item.label}
          </NavLink>
        ))}
      </nav>

      <Button variant="ghost" icon="logout" onClick={logout} className="justify-start">
        <Icon name="logout" size={18} className="mr-2" />
        Log out
      </Button>
    </aside>
  )
}
