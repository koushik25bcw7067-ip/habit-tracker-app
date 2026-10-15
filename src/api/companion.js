import { apiFetch } from './client'

export const listCompanionDevices = () => apiFetch('/companion/devices')
export const createCompanionPairingCode = (name) =>
  apiFetch('/companion/pairing-codes', {
    method: 'POST',
    body: { name },
  })
export const revokeCompanionDevice = (id) =>
  apiFetch(`/companion/devices/${id}`, { method: 'DELETE' })

export const getCompanionChanges = () => apiFetch('/companion/changes')

export function emitCompanionAction(actionType) {
  if (!actionType) return
  const detail = { action_type: actionType }
  window.dispatchEvent(new CustomEvent('companion:action', { detail }))
  localStorage.setItem(
    'habit_tracker_companion_action',
    JSON.stringify({ ...detail, at: Date.now() }),
  )
}

export function emitCompanionDevicesChanged() {
  window.dispatchEvent(new Event('companion:devices-changed'))
  localStorage.setItem('habit_tracker_companion_devices', String(Date.now()))
}

const VOICE_SESSION_KEY = 'habit_tracker_voice_session'

function getVoiceSessionId() {
  let sessionId = localStorage.getItem(VOICE_SESSION_KEY)
  if (!sessionId) {
    const bytes = new Uint8Array(32)
    window.crypto.getRandomValues(bytes)
    sessionId = btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    localStorage.setItem(VOICE_SESSION_KEY, sessionId)
  }
  return sessionId
}

export async function sendVoiceTurn(wavAudio) {
  const response = await apiFetch('/companion/web/voice/turn', {
    method: 'POST',
    rawBody: wavAudio,
    headers: {
      'Content-Type': 'audio/wav',
      'X-Voice-Session': getVoiceSessionId(),
    },
    responseType: 'response',
  })
  if (!response.headers.get('content-type')?.startsWith('audio/wav')) {
    const fallback = await response.json()
    return {
      audio: null,
      transcript: fallback.transcript,
      reply: fallback.reply,
      status: fallback.status,
      actionId: fallback.action_id,
      actionType: fallback.action_type,
    }
  }
  const decodeHeader = (name) => {
    const value = response.headers.get(name)
    return value ? decodeURIComponent(value) : ''
  }
  return {
    audio: await response.blob(),
    transcript: decodeHeader('X-Companion-Transcript'),
    reply: decodeHeader('X-Companion-Reply'),
    status: response.headers.get('X-Companion-Status'),
    actionId: response.headers.get('X-Companion-Action-Id'),
    actionType: response.headers.get('X-Companion-Action-Type'),
  }
}
