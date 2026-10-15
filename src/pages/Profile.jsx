import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import PageHeader from '../components/PageHeader'
import Button from '../components/ui/Button'
import { Field, Input } from '../components/ui/Form'
import { Chip } from '../components/ui/Primitives'
import MascotFace from '../components/MascotFace'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { updateMe } from '../api/auth'
import { getDashboard } from '../api/dashboard'
import {
  createCompanionPairingCode,
  emitCompanionDevicesChanged,
  listCompanionDevices,
  revokeCompanionDevice,
} from '../api/companion'
import { ApiError } from '../api/client'

const TOGGLES = [
  { id: 'reminders', label: 'Daily habit reminders', desc: 'Nudge notifications for scheduled habits', icon: 'notifications' },
  { id: 'ai', label: 'AI adaptive insights', desc: 'Personalized recommendations based on your logs', icon: 'auto_awesome' },
  { id: 'weekly', label: 'Weekly report email', desc: 'A summary of your progress every Sunday', icon: 'mail' },
  { id: 'sound', label: 'Completion sound', desc: 'Play a sound when a habit is marked done', icon: 'volume_up' },
]

export default function Profile() {
  const { user, logout } = useAuth()
  const { world, companion, setCompanion } = useTheme()
  const [toggles, setToggles] = useState({ reminders: true, ai: true, weekly: false, sound: true })
  const [username, setUsername] = useState(user?.fullName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [streak, setStreak] = useState(null)
  const [devices, setDevices] = useState([])
  const [pairing, setPairing] = useState(null)
  const [deviceBusy, setDeviceBusy] = useState(false)
  const [deviceMsg, setDeviceMsg] = useState('')

  useEffect(() => {
    getDashboard()
      .then((d) => setStreak(d.current_overall_streak))
      .catch(() => setStreak(null))
  }, [])

  const loadDevices = useCallback(async () => {
    try {
      setDevices(await listCompanionDevices())
      setDeviceMsg('')
    } catch (err) {
      setDeviceMsg(err instanceof ApiError ? err.message : 'Could not load companion devices.')
    }
  }, [])

  useEffect(() => {
    loadDevices()
  }, [loadDevices])

  useEffect(() => {
    if (!pairing) return undefined
    const checkPairing = async () => {
      if (Date.now() >= new Date(pairing.expires_at).getTime()) {
        setPairing(null)
        setDeviceMsg('Pairing code expired. Generate a new one.')
        return
      }
      try {
        const currentDevices = await listCompanionDevices()
        setDevices(currentDevices)
        const pairedDevice = currentDevices.find(
          (device) => device.id === pairing.device_id && device.paired_at,
        )
        if (pairedDevice) {
          setPairing(null)
          setDeviceMsg(`${pairedDevice.name} connected.`)
          emitCompanionDevicesChanged()
        }
      } catch (err) {
        setDeviceMsg(err instanceof ApiError ? err.message : 'Could not check device pairing status.')
      }
    }
    const interval = window.setInterval(checkPairing, 3000)
    return () => window.clearInterval(interval)
  }, [pairing])

  function toggle(id) {
    setToggles((t) => ({ ...t, [id]: !t[id] }))
  }

  async function handleSave() {
    setSaving(true)
    setSaveMsg('')
    try {
      await updateMe({ username, email })
      setSaveMsg('Saved.')
    } catch (err) {
      setSaveMsg(err instanceof ApiError ? err.message : 'Could not save changes.')
    } finally {
      setSaving(false)
    }
  }

  async function handlePairDevice() {
    setDeviceBusy(true)
    setDeviceMsg('')
    setPairing(null)
    try {
      const result = await createCompanionPairingCode('Habit Companion')
      setPairing(result)
      await loadDevices()
      emitCompanionDevicesChanged()
    } catch (err) {
      setDeviceMsg(err instanceof ApiError ? err.message : 'Could not create a pairing code.')
    } finally {
      setDeviceBusy(false)
    }
  }

  async function handleRevokeDevice(device) {
    if (!window.confirm(`Disconnect ${device.name}? The device will stop accessing your account.`)) return
    setDeviceBusy(true)
    setDeviceMsg('')
    try {
      await revokeCompanionDevice(device.id)
      setPairing(null)
      await loadDevices()
      emitCompanionDevicesChanged()
    } catch (err) {
      setDeviceMsg(err instanceof ApiError ? err.message : 'Could not disconnect this device.')
    } finally {
      setDeviceBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Profile & Settings" subtitle="Manage your account and preferences" />

      <div className="bg-surface-container-lowest rounded-xl shadow-card-1 p-4 flex items-center gap-4">
        <img src={user?.avatar} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-headline-sm text-on-surface truncate">{user?.fullName}</h2>
          <p className="text-body-sm text-on-surface-variant truncate">{user?.email}</p>
          {streak != null && (
            <div className="flex items-center gap-2 mt-1.5">
              <Chip tone="tertiary">🔥 {streak} day streak</Chip>
            </div>
          )}
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-card-1 p-4 flex flex-col gap-4">
        <Link to="/theme-select" className="flex items-center gap-4 rounded-lg hover:bg-surface-container-low transition-colors -m-1 p-1">
          <MascotFace mascot={world.mascot} secondary={world.colors.secondary} size={48} />
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-headline-sm text-on-surface">{world.mascot.name}</h3>
            <p className="text-body-sm text-on-surface-variant">World: {world.label} — tap to change</p>
          </div>
          <Icon name="chevron_right" size={20} className="text-on-surface-variant" />
        </Link>
        <div className="flex flex-col gap-2 border-t border-surface-container-high pt-3">
          {[
            ['enabled', 'Show companion'],
            ['roam', 'Let it stroll along the bottom'],
            ['minimized', 'Keep it minimised'],
          ].map(([k, label]) => (
            <label key={k} className="flex items-center justify-between gap-3 text-body-md text-on-surface min-h-[44px]">
              <span>{label}</span>
              <input
                type="checkbox"
                className="w-5 h-5 accent-primary"
                checked={!!companion[k]}
                onChange={(e) => setCompanion({ [k]: e.target.checked })}
              />
            </label>
          ))}
          <label className="flex items-center justify-between gap-3 text-body-md text-on-surface min-h-[44px]">
            <span>Chatter</span>
            <select
              className="rounded-md border border-surface-container-high bg-surface px-2 h-9 text-body-sm"
              value={companion.chatter}
              onChange={(e) => setCompanion({ chatter: e.target.value })}
            >
              <option value="quiet">Quiet</option>
              <option value="normal">Normal</option>
            </select>
          </label>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-card-1 p-4 flex flex-col gap-4">
        <h3 className="font-display text-headline-sm text-on-surface">Account Details</h3>
        <Field label="Username">
          <Input value={username} onChange={(e) => setUsername(e.target.value)} />
        </Field>
        <Field label="Email">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="self-start" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
          {saveMsg && <span className="text-body-sm text-on-surface-variant">{saveMsg}</span>}
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-card-1 p-4 flex flex-col gap-1">
        <h3 className="font-display text-headline-sm text-on-surface mb-1">Notifications & AI</h3>
        <p className="text-body-sm text-on-surface-variant mb-2">Local preferences — the backend doesn't yet store these server-side.</p>
        {TOGGLES.map((t) => (
          <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-surface-container-high last:border-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center flex-shrink-0">
                <Icon name={t.icon} size={16} className="text-on-surface-variant" />
              </div>
              <div className="min-w-0">
                <div className="text-body-md font-medium text-on-surface truncate">{t.label}</div>
                <div className="text-body-sm text-on-surface-variant truncate">{t.desc}</div>
              </div>
            </div>
            <button
              onClick={() => toggle(t.id)}
              className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${toggles[t.id] ? 'bg-tertiary' : 'bg-outline-variant'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${toggles[t.id] ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-card-1 p-4 flex flex-col gap-1">
        <h3 className="font-display text-headline-sm text-on-surface mb-1">Connections</h3>
        <div className="flex items-center justify-between py-2.5 border-b border-surface-container-high">
          <span className="text-body-md text-on-surface">FastAPI Backend</span>
          <Chip tone="tertiary">Connected</Chip>
        </div>
        <div className="flex flex-col gap-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-body-md text-on-surface">ESP32 Habit Companion</span>
            <Button variant="outline" onClick={handlePairDevice} disabled={deviceBusy}>
              {deviceBusy ? 'Please wait…' : 'Pair device'}
            </Button>
          </div>
          <p className="text-body-sm text-on-surface-variant">
            Pair using a short-lived code. The device gets its own revocable credential; your website password and login tokens are never placed on it.
          </p>
          {pairing && (
            <div className="rounded-lg bg-surface-container-low p-3" role="status">
              <p className="text-body-sm text-on-surface-variant">Enter this code on your device within 5 minutes:</p>
              <p className="font-mono text-headline-sm tracking-[0.2em] text-on-surface" aria-label="Device pairing code">
                {pairing.pairing_code}
              </p>
              <p className="text-body-sm text-on-surface-variant">
                Expires {new Date(pairing.expires_at).toLocaleTimeString()}.
              </p>
            </div>
          )}
          {deviceMsg && <p className="text-body-sm text-error" role="alert">{deviceMsg}</p>}
          {devices.map((device) => (
            <div key={device.id} className="flex items-center justify-between gap-3 border-t border-surface-container-high pt-3">
              <div className="min-w-0">
                <p className="text-body-md text-on-surface truncate">{device.name}</p>
                <p className="text-body-sm text-on-surface-variant">
                  {device.revoked_at
                    ? 'Disconnected'
                    : device.paired_at
                      ? `Connected${device.last_seen_at ? ` · Active ${new Date(device.last_seen_at).toLocaleString()}` : ''}`
                      : 'Waiting for pairing'}
                </p>
              </div>
              {!device.revoked_at && (
                <Button variant="danger" onClick={() => handleRevokeDevice(device)} disabled={deviceBusy}>
                  Disconnect
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <Button variant="danger" fullWidth icon="logout" onClick={logout}>
        <Icon name="logout" size={18} className="mr-2" />
        Log Out
      </Button>
    </>
  )
}
