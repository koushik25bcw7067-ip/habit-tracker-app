import { apiFetch } from './client'

export const listRecommendations = () => apiFetch('/recommendations')
export const habitRecommendations = (habitId) => apiFetch(`/recommendations/habits/${habitId}`)
export const weeklyPlan = () => apiFetch('/recommendations/weekly')
export const monthlyPlan = () => apiFetch('/recommendations/monthly')
export const scheduleSuggestions = () => apiFetch('/recommendations/schedule')
export const acceptRecommendation = (id) => apiFetch(`/recommendations/${id}/accept`, { method: 'POST' })
export const rejectRecommendation = (id) => apiFetch(`/recommendations/${id}/reject`, { method: 'POST' })
