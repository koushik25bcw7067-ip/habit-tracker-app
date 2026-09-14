import { apiFetch, setTokens, clearTokens } from './client'

export function register({ username, email, password }) {
  return apiFetch('/auth/register', { method: 'POST', body: { username, email, password }, auth: false })
}

export async function login(emailOrObj, maybePassword) {
  const payload = typeof emailOrObj === 'object'
    ? emailOrObj
    : { email: emailOrObj, password: maybePassword }

  const data = await apiFetch('/auth/login', { method: 'POST', body: payload, auth: false })
  setTokens(data)
  return data
}

export async function logout() {
  try {
    await apiFetch('/auth/logout', { method: 'POST' })
  } catch {
    // Logout is best-effort server-side (access tokens just expire); always
    // clear local tokens regardless of whether the network call succeeded.
  }
  clearTokens()
}

export function me() {
  return apiFetch('/users/me')
}

export function updateMe(data) {
  return apiFetch('/users/me', { method: 'PUT', body: data })
}
