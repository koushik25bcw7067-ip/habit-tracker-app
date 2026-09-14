import { apiFetch } from './client'

export const dailyStats = (day) => apiFetch('/statistics/daily', { query: { day } })
export const weeklyStats = (end_date) => apiFetch('/statistics/weekly', { query: { end_date } })
export const monthlyStats = (year, month) => apiFetch('/statistics/monthly', { query: { year, month } })
export const categoryStats = () => apiFetch('/statistics/category')
export const habitStats = (habitId) => apiFetch(`/statistics/habits/${habitId}`)
