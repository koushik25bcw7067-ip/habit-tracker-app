import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AppShell from './components/layout/AppShell'
import { LoadingState } from './components/ui/States'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import MyHabits from './pages/MyHabits'
import AddHabit from './pages/AddHabit'
import EditHabit from './pages/EditHabit'
import CalendarPage from './pages/CalendarPage'
import Statistics from './pages/Statistics'
import Recommendations from './pages/Recommendations'
import AiReport from './pages/AiReport'
import AiCompanion from './pages/AiCompanion'
import DayPlanner from './pages/DayPlanner'
import Profile from './pages/Profile'

function ProtectedLayout({ children }) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <AppShell>{children}</AppShell>
}

export default function App() {
  const { isAuthenticated, initializing } = useAuth()

  // Wait to know real session status before routing.
  // This prevents a logged-in user from briefly seeing /login
  // after refreshing the page.
  if (initializing) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <LoadingState label="Loading your session…" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Login />
          )
        }
      />

      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Register />
          )
        }
      />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        }
      />

      <Route
        path="/habits"
        element={
          <ProtectedLayout>
            <MyHabits />
          </ProtectedLayout>
        }
      />

      <Route
        path="/habits/new"
        element={
          <ProtectedLayout>
            <AddHabit />
          </ProtectedLayout>
        }
      />

      <Route
        path="/habits/:id/edit"
        element={
          <ProtectedLayout>
            <EditHabit />
          </ProtectedLayout>
        }
      />

      <Route
        path="/calendar"
        element={
          <ProtectedLayout>
            <CalendarPage />
          </ProtectedLayout>
        }
      />

      <Route
        path="/statistics"
        element={
          <ProtectedLayout>
            <Statistics />
          </ProtectedLayout>
        }
      />

      <Route
        path="/recommendations"
        element={
          <ProtectedLayout>
            <Recommendations />
          </ProtectedLayout>
        }
      />

      <Route
        path="/report"
        element={
          <ProtectedLayout>
            <AiReport />
          </ProtectedLayout>
        }
      />

      <Route
        path="/companion"
        element={
          <ProtectedLayout>
            <AiCompanion />
          </ProtectedLayout>
        }
      />

      {/* Day Planner */}
      <Route
        path="/day-planner"
        element={
          <ProtectedLayout>
            <DayPlanner />
          </ProtectedLayout>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedLayout>
            <Profile />
          </ProtectedLayout>
        }
      />

      {/* Default route */}
      <Route
        path="/"
        element={
          <Navigate
            to={isAuthenticated ? '/dashboard' : '/login'}
            replace
          />
        }
      />

      {/* Unknown route */}
      <Route
        path="*"
        element={
          <Navigate
            to={isAuthenticated ? '/dashboard' : '/login'}
            replace
          />
        }
      />
    </Routes>
  )
}