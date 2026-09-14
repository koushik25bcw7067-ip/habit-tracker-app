import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import { Input, Field } from '../components/ui/Form'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function validate() {
    const next = {}
    if (!form.username.trim()) next.username = 'Username is required'
    if (!form.email.trim()) next.email = 'Email is required'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email'
    if (!form.password) next.password = 'Password is required'
    else if (form.password.length < 8) next.password = 'Use at least 8 characters'
    if (form.confirm !== form.password) next.confirm = 'Passwords do not match'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const [formError, setFormError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setFormError('')
    try {
      await register(form)
      navigate('/dashboard')
    } catch (err) {
      setFormError(err.message || 'Unable to create your account. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-fixed/40 via-surface to-surface flex flex-col items-center px-gutter py-10">
      <div className="w-full max-w-sm flex flex-col items-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-card-2 relative">
          <Icon name="auto_awesome" size={34} className="text-white" />
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-tertiary border-2 border-surface" />
        </div>
        <h1 className="mt-4 font-display text-headline-lg text-on-surface text-center">Create your account</h1>
        <p className="mt-1.5 text-body-md text-on-surface-variant text-center">
          Start building unstoppable momentum, one habit at a time.
        </p>

        <div className="w-full mt-6 flex rounded-md bg-surface-container-low p-1">
          <Link to="/login" className="flex-1 h-10 rounded text-body-md font-semibold text-on-surface-variant flex items-center justify-center">
            Log In
          </Link>
          <button className="flex-1 h-10 rounded text-body-md font-semibold bg-surface-container-lowest text-primary shadow-card-1">
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="w-full mt-4 bg-surface-container-lowest rounded-xl shadow-card-1 p-5 flex flex-col gap-4">
          <Field label="Username" required error={errors.username}>
            <Input placeholder="koushik.rao" value={form.username} onChange={(e) => set('username', e.target.value)} error={errors.username} />
          </Field>
          <Field label="Email" required error={errors.email}>
            <Input type="email" placeholder="koushik@university.edu" value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
          </Field>
          <Field label="Password" required hint="At least 8 characters" error={errors.password}>
            <Input type="password" placeholder="Create a password" value={form.password} onChange={(e) => set('password', e.target.value)} error={errors.password} />
          </Field>
          <Field label="Confirm Password" required error={errors.confirm}>
            <Input type="password" placeholder="Re-enter your password" value={form.confirm} onChange={(e) => set('confirm', e.target.value)} error={errors.confirm} />
          </Field>

          {formError && (
            <div className="flex items-center gap-2 bg-error-container/50 text-on-error-container rounded-md px-3 py-2.5 text-body-sm">
              <Icon name="error" size={16} className="flex-shrink-0" />
              {formError}
            </div>
          )}

          <Button type="submit" fullWidth size="lg" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create Account'}
            <Icon name="arrow_forward" size={18} className="ml-2" />
          </Button>
        </form>

        <p className="mt-5 text-body-sm text-on-surface-variant">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
