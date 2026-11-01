import { apiFetch } from './client'

export const listInsights = () => apiFetch('/ai/insights')
export const analyze = (days = 30) => apiFetch('/ai/analyze', { method: 'POST', body: { days } })
export const weeklyReport = () => apiFetch('/ai/weekly-report')
export const monthlyReport = () => apiFetch('/ai/monthly-report')
export const suggestHabits = (goal) => apiFetch('/ai/suggest-habits', { method: 'POST', body: { goal } })

export const listConversations = () => apiFetch('/ai/conversations')
export const createConversation = (title = 'New chat') =>
  apiFetch('/ai/conversations', { method: 'POST', body: { title } })
export const getConversationMessages = (id) =>
  apiFetch(`/ai/conversations/${id}/messages`, { query: { limit: 500 } })
export const deleteConversation = (id) =>
  apiFetch(`/ai/conversations/${id}`, { method: 'DELETE' })

// messages: [{ role: 'user' | 'assistant', content: string }, ...]
export const chat = (messages, conversationId) =>
  apiFetch('/ai/chat', {
    method: 'POST',
    body: { messages, conversation_id: conversationId },
  })
