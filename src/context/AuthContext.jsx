import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import * as authApi from '../api/auth'
import { hasSession, onSessionExpired, ApiError } from '../api/client'

const AuthContext = createContext(null)

// Maps the backend UserResponse {id, username, email, created_at, updated_at}
// onto the fields the existing UI reads (name, fullName, avatar, streakDays...).
// Fields the backend doesn't track yet (avatar, semester/term) get generic
// defaults instead of invented data; streak comes from /dashboard instead.
function adaptUser(u) {
  if (!u) return null
  return {
    id: u.id,
    name: u.username,
    fullName: u.username,
    email: u.email,
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.username)}`,
    streakDays: null,
    semester: null,
    term: null,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(true)
  const [authError, setAuthError] = useState(null)

  const loadMe = useCallback(async () => {
    try {
      const me = await authApi.me()
      setUser(adaptUser(me))
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    onSessionExpired(() => setUser(null))
    ;(async () => {
      if (hasSession()) await loadMe()
      setInitializing(false)
    })()
  }, [loadMe])

  const login = useCallback(
    async (email, password) => {
      setAuthError(null)
      try {
        await authApi.login({ email, password })
        await loadMe()
      } catch (err) {
        setAuthError(err instanceof ApiError ? err.message : 'Login failed')
        throw err
      }
    },
    [loadMe],
  )

  const register = useCallback(
    async (fields) => {
      setAuthError(null)
      try {
        await authApi.register({ username: fields.username, email: fields.email, password: fields.password })
        await authApi.login({ email: fields.email, password: fields.password })
        await loadMe()
      } catch (err) {
        setAuthError(err instanceof ApiError ? err.message : 'Registration failed')
        throw err
      }
    },
    [loadMe],
  )

  const logout = useCallback(async () => {
    await authApi.logout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, login, register, logout, isAuthenticated: !!user, initializing, authError }),
    [user, login, register, logout, initializing, authError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
