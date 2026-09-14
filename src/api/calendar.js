import { apiFetch } from './client'

export const getCalendarMonth = (year, month) => apiFetch('/calendar', { query: { year, month } })
