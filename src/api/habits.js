import { apiFetch } from './client'

export const listHabits = (query) => apiFetch('/habits', { query })
export const getHabit = (id) => apiFetch(`/habits/${id}`)
export const createHabit = (data) => apiFetch('/habits', { method: 'POST', body: data })
export const updateHabit = (id, data) => apiFetch(`/habits/${id}`, { method: 'PUT', body: data })
export const deleteHabit = (id) => apiFetch(`/habits/${id}`, { method: 'DELETE' })
export const archiveHabit = (id) => apiFetch(`/habits/${id}/archive`, { method: 'POST' })
export const restoreHabit = (id) => apiFetch(`/habits/${id}/restore`, { method: 'POST' })
export const activateHabit = (id) => apiFetch(`/habits/${id}/activate`, { method: 'POST' })
export const deactivateHabit = (id) => apiFetch(`/habits/${id}/deactivate`, { method: 'POST' })

// data: { completion_date: 'YYYY-MM-DD', actual_value?, notes? }
export const completeHabit = (id, data) => apiFetch(`/habits/${id}/complete`, { method: 'POST', body: data })
export const undoCompletion = (id, completionDate) =>
  apiFetch(`/habits/${id}/complete/${completionDate}`, { method: 'DELETE' })
