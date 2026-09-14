import { apiFetch } from './client'

export const listAchievements = () => apiFetch('/achievements')
export const listUserAchievements = () => apiFetch('/achievements/user')
