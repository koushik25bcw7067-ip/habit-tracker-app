import { apiFetch } from './client'

export const listReminders = () => apiFetch('/reminders')
export const createReminder = (data) => apiFetch('/reminders', { method: 'POST', body: data })
export const updateReminder = (id, data) => apiFetch(`/reminders/${id}`, { method: 'PUT', body: data })
export const deleteReminder = (id) => apiFetch(`/reminders/${id}`, { method: 'DELETE' })
