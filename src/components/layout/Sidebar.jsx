import { NavLink } from 'react-router-dom'
import Icon from '../ui/Icon'
import Button from '../ui/Button'
import { useAuth } from '../../context/AuthContext'

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: 'home' },
  { path: '/habits', label: 'My Habits', icon: 'checklist' },
  { path: '/calendar', label: 'Calendar', icon: 'calendar_month' },
  { path: '/statistics', label: 'Statistics', icon: 'bar_chart' },
  { path: '/recommendations', label: 'AI Recommendations', icon: 'auto_awesome' },
  { path: '/report', label: 'AI Report', icon: 'summarize' },
  { path: '/companion', label: 'AI Companion', icon: 'forum' },
  { path: '/profile', label: 'Profile', icon: 'person' },
]

export default function Sidebar() {
  const { logout } = useAuth()
  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 flex-col border-r border-surface-container-high bg-surface-container-lowest px-4 py-6 gap-6 z-40">
      <div className="flex items-center gap-2.5 px-2">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <Icon name="auto_awesome" size={20} className="text-white" />
        </div>
        <span className="font-display text-headline-sm text-on-surface">Mini AI</span>
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
            {item.label}
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
