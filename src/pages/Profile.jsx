import { useState, useEffect } from 'react'
import Icon from '../components/ui/Icon'
import PageHeader from '../components/PageHeader'
import Button from '../components/ui/Button'
import { Field, Input } from '../components/ui/Form'
import { Chip } from '../components/ui/Primitives'
import { useAuth } from '../context/AuthContext'
import { updateMe } from '../api/auth'
import { getDashboard } from '../api/dashboard'
import { ApiError } from '../api/client'

const TOGGLES = [
  { id: 'reminders', label: 'Daily habit reminders', desc: 'Nudge notifications for scheduled habits', icon: 'notifications' },
  { id: 'ai', label: 'AI adaptive insights', desc: 'Personalized recommendations based on your logs', icon: 'auto_awesome' },
  { id: 'weekly', label: 'Weekly report email', desc: 'A summary of your progress every Sunday', icon: 'mail' },
  { id: 'sound', label: 'Completion sound', desc: 'Play a sound when a habit is marked done', icon: 'volume_up' },
]

export default function Profile() {
  const { user, logout } = useAuth()
  const [toggles, setToggles] = useState({ reminders: true, ai: true, weekly: false, sound: true })
  const [username, setUsername] = useState(user?.fullName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [streak, setStreak] = useState(null)

  useEffect(() => {
    getDashboard()
      .then((d) => setStreak(d.current_overall_streak))
      .catch(() => setStreak(null))
  }, [])

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
        <div className="flex items-center justify-between py-2.5">
          <span className="text-body-md text-on-surface">ESP32 Habit Device</span>
          <Chip tone="neutral">Not connected · future phase</Chip>
        </div>
      </div>

      <Button variant="danger" fullWidth icon="logout" onClick={logout}>
        <Icon name="logout" size={18} className="mr-2" />
        Log Out
      </Button>
    </>
  )
}
