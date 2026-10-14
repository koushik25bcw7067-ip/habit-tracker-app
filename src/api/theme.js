import { apiFetch } from './client'

// Existing endpoints
export const listPresets = () => apiFetch('/theme/presets')
export const getTheme = () => apiFetch('/theme')
export const setPresetTheme = (preset_key) => apiFetch('/theme/preset', { method: 'PUT', body: { preset_key } })
export const setCustomTheme = (query) => apiFetch('/theme/custom', { method: 'POST', body: { query } }) // generate + save in one step

// Added for live preview: generate without saving, then save the exact theme the user previewed.
export const previewCustomTheme = (query) => apiFetch('/theme/custom/preview', { method: 'POST', body: { query } })
export const saveCustomTheme = (theme, query) => apiFetch('/theme/custom', { method: 'PUT', body: { theme, query } })
