import { apiFetch } from './client'

export const listGoals = (status) => apiFetch('/goals', { query: { status } })
export const createGoal = (data) => apiFetch('/goals', { method: 'POST', body: data })
export const setGoalProgress = (id, current_value) =>
  apiFetch(`/goals/${id}/progress`, { method: 'PUT', body: { current_value } })
export const completeGoal = (id) => apiFetch(`/goals/${id}/complete`, { method: 'POST' })
export const archiveGoal = (id) => apiFetch(`/goals/${id}/archive`, { method: 'POST' })
export const deleteGoal = (id) => apiFetch(`/goals/${id}`, { method: 'DELETE' })
