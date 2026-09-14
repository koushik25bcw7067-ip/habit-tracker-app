// ---------------------------------------------------------------------------
// Central API client. Every request to the FastAPI backend goes through
// apiFetch() below — no component or context talks to fetch() directly.
// Handles: base URL, JSON, auth headers, 401 -> refresh-once -> retry-once,
// and normalized error objects (ApiError) that pages can render.
// ---------------------------------------------------------------------------

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const ACCESS_KEY = 'mini_ai_access_token'
const REFRESH_KEY = 'mini_ai_refresh_token'

export class ApiError extends Error {
  constructor(message, status, detail) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY)
}

export function setTokens({ access_token, refresh_token } = {}) {
  if (access_token) localStorage.setItem(ACCESS_KEY, access_token)
  if (refresh_token) localStorage.setItem(REFRESH_KEY, refresh_token)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export function hasSession() {
  return !!getAccessToken()
}

// Called by AuthContext so the client can force a logout + redirect when a
// refresh attempt fails (refresh token expired/invalid).
let sessionExpiredHandler = null
export function onSessionExpired(fn) {
  sessionExpiredHandler = fn
}

// Multiple simultaneous 401s should trigger exactly one refresh call, not one
// per in-flight request. This shared promise makes every caller wait on the
// same refresh instead of racing (and prevents refresh-retry loops).
let refreshPromise = null

async function refreshAccessToken() {
  const refresh_token = getRefreshToken()
  if (!refresh_token) throw new ApiError('No refresh token available', 401)

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token }),
  })

  if (!res.ok) {
    throw new ApiError('Session expired', res.status)
  }

  const data = await res.json()
  setTokens(data)
  return data.access_token
}

function buildQuery(params) {
  if (!params) return ''
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  if (entries.length === 0) return ''
  const qs = new URLSearchParams(entries.map(([k, v]) => [k, String(v)]))
  return `?${qs.toString()}`
}

/**
 * @param {string} path - e.g. '/habits'
 * @param {object} opts
 * @param {'GET'|'POST'|'PUT'|'DELETE'} [opts.method]
 * @param {object} [opts.body]
 * @param {object} [opts.query]
 * @param {boolean} [opts.auth] - attach Authorization header (default true)
 */
export async function apiFetch(path, opts = {}) {
  const { method = 'GET', body, query, auth = true, _retry = true } = opts

  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getAccessToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let res
  try {
    res = await fetch(`${BASE_URL}${path}${buildQuery(query)}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    throw new ApiError('Cannot reach the backend. Is it running?', 0)
  }

  if (res.status === 401 && auth && _retry) {
    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null
        })
      }
      await refreshPromise
    } catch (err) {
      clearTokens()
      sessionExpiredHandler?.()
      throw new ApiError('Your session expired. Please log in again.', 401)
    }
    return apiFetch(path, { ...opts, _retry: false })
  }

  if (!res.ok) {
    let detail = null
    try {
      const data = await res.json()
      detail = data?.detail
    } catch {
      /* no JSON body */
    }
    if (res.status === 401 && auth) {
      clearTokens()
      sessionExpiredHandler?.()
    }
    const message = typeof detail === 'string' ? detail : `Request failed (${res.status})`
    throw new ApiError(message, res.status, detail)
  }

  if (res.status === 204) return null
  const text = await res.text()
  return text ? JSON.parse(text) : null
}
