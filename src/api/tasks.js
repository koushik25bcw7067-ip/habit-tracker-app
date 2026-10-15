import { apiFetch } from './client'

export const listTasks = (query) => apiFetch('/tasks', { query })
export const listTasksToday = () => apiFetch('/tasks/today')
export const createTask = (data) => apiFetch('/tasks', { method: 'POST', body: data })
export const updateTask = (id, data) => apiFetch(`/tasks/${id}`, { method: 'PUT', body: data })
export const completeTask = (id) => apiFetch(`/tasks/${id}/complete`, { method: 'POST' })
export const reopenTask = (id) => apiFetch(`/tasks/${id}/reopen`, { method: 'POST' })
export const deleteTask = (id) => apiFetch(`/tasks/${id}`, { method: 'DELETE' })
