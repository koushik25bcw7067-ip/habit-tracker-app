import { apiFetch } from './client'

export const getNotifications = () => apiFetch('/notifications')
