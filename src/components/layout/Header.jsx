import { Link } from 'react-router-dom'
import Icon from '../ui/Icon'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/habits': 'Routines',
  '/habits/new': 'New Routine',
  '/tasks': 'Tasks',
  '/goals': 'Goals',
  '/calendar': 'Calendar',
  '/day-planner': 'Day Planner',
  '/statistics': 'Statistics',
  '/ai': 'AI Hub',
  '/progress': 'My Progress',
  '/profile': 'Profile',
}

export default function Header({ pathname }) {
  const { user } = useAuth()
  const { t } = useTheme()
  const VK = { '/dashboard': 'dashboard', '/habits': 'habits', '/tasks': 'tasks', '/goals': 'goals' }
  const hit = Object.entries(PAGE_TITLES).find(([p]) => pathname.startsWith(p))
  const title = hit ? (pathname.startsWith('/habits/new') ? hit[1] : VK[hit[0]] ? t(VK[hit[0]]) : hit[1]) : 'Mini AI'

  return (
    <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgb(var(--c-primary)/0.06)]">
      <div className="h-16 px-gutter flex items-center justify-between gap-space-sm max-w-3xl mx-auto">
        <div className="flex items-center gap-space-sm min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
            <Icon name="auto_awesome" size={18} className="text-on-primary" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-display text-headline-sm text-on-surface tracking-tight truncate">Mini AI</span>
            <span className="text-label-sm text-on-surface-variant truncate">{title}</span>
          </div>
        </div>
        <div className="flex items-center gap-space-sm flex-shrink-0">
          <Link
            to="/progress?tab=reminders"
            aria-label="View reminders"
            className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low transition-colors"
          >
            <Icon name="notifications" size={20} />
          </Link>
          <Link to="/profile" className="w-11 h-11 flex items-center justify-center rounded-full hover:opacity-90 transition-opacity">
            <img alt="Profile" className="w-8 h-8 rounded-full object-cover" src={user?.avatar} />
          </Link>
        </div>
      </div>
    </header>
  )
}
