import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useTheme } from './context/ThemeContext'
import AppShell from './components/layout/AppShell'
import FloatingMascot from './components/FloatingMascot'
import AmbientLayer from './components/AmbientLayer'
import { LoadingState } from './components/ui/States'
import ThemeSelect from './pages/ThemeSelect'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import MyHabits from './pages/MyHabits'
import AddHabit from './pages/AddHabit'
import EditHabit from './pages/EditHabit'
import Tasks from './pages/Tasks'
import Goals from './pages/Goals'
import CalendarPage from './pages/CalendarPage'
import Statistics from './pages/Statistics'
import DayPlanner from './pages/DayPlanner'
import AiHub from './pages/AiHub'
import ProgressHub from './pages/ProgressHub'
import Profile from './pages/Profile'

function ProtectedLayout({ children }) {
  const { isAuthenticated } = useAuth()
  const { hasTheme, loading: themeLoading } = useTheme()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  // Wait for the account's theme (cached copy paints instantly on refresh) so one user's look never
  // flashes for another; send a user with no theme yet to the world picker once that is confirmed.
  if (themeLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <LoadingState label="Loading your world…" />
      </div>
    )
  }
  if (!hasTheme) return <Navigate to="/theme-select" replace />
  return <AppShell>{children}</AppShell>
}

export default function App() {
  const { isAuthenticated, initializing } = useAuth()

  // Wait to know real session status (GET /users/me with a stored token)
  // before routing — otherwise a refreshed page would flash to /login even
  // for an already-logged-in user.
  if (initializing) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <LoadingState label="Loading your session…" />
      </div>
    )
  }

  return (
    <>
    <AmbientLayer />
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />} />

      <Route path="/theme-select" element={isAuthenticated ? <ThemeSelect /> : <Navigate to="/login" replace />} />

      <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/habits" element={<ProtectedLayout><MyHabits /></ProtectedLayout>} />
      <Route path="/habits/new" element={<ProtectedLayout><AddHabit /></ProtectedLayout>} />
      <Route path="/habits/:id/edit" element={<ProtectedLayout><EditHabit /></ProtectedLayout>} />
      <Route path="/tasks" element={<ProtectedLayout><Tasks /></ProtectedLayout>} />
      <Route path="/goals" element={<ProtectedLayout><Goals /></ProtectedLayout>} />
      <Route path="/calendar" element={<ProtectedLayout><CalendarPage /></ProtectedLayout>} />
      <Route path="/statistics" element={<ProtectedLayout><Statistics /></ProtectedLayout>} />
      <Route path="/ai" element={<ProtectedLayout><AiHub /></ProtectedLayout>} />
      <Route path="/recommendations" element={<Navigate to="/ai?tab=recommendations" replace />} />
      <Route path="/report" element={<Navigate to="/ai?tab=report" replace />} />
      <Route path="/companion" element={<Navigate to="/ai?tab=companion" replace />} />
      <Route path="/day-planner" element={<ProtectedLayout><DayPlanner /></ProtectedLayout>} />
      <Route path="/progress" element={<ProtectedLayout><ProgressHub /></ProtectedLayout>} />
      <Route path="/reminders" element={<Navigate to="/progress?tab=reminders" replace />} />
      <Route path="/achievements" element={<Navigate to="/progress?tab=achievements" replace />} />
      <Route path="/profile" element={<ProtectedLayout><Profile /></ProtectedLayout>} />

      <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
    </Routes>
    <FloatingMascot />
    </>
  )
}
