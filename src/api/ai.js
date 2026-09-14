import { apiFetch } from './client'

export const listInsights = () => apiFetch('/ai/insights')
export const analyze = (days = 30) => apiFetch('/ai/analyze', { method: 'POST', body: { days } })
export const weeklyReport = () => apiFetch('/ai/weekly-report')
export const monthlyReport = () => apiFetch('/ai/monthly-report')
export const suggestHabits = (goal) => apiFetch('/ai/suggest-habits', { method: 'POST', body: { goal } })

// messages: [{ role: 'user' | 'assistant', content: string }, ...]
export const chat = (messages) => apiFetch('/ai/chat', { method: 'POST', body: { messages } })
