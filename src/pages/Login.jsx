import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import { Input } from '../components/ui/Form'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  function validate() {
    const next = {}
    if (!email.trim()) next.email = 'Email is required'
    else if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Enter a valid email'
    if (!password) next.password = 'Password is required'
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
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setFormError(err.message || 'Unable to sign in. Check your credentials and try again.')
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

        <span className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-primary text-label-sm font-semibold">
          <Icon name="auto_awesome" size={13} /> CAMPUS HABIT INTELLIGENCE
        </span>
        <h1 className="mt-3 font-display text-headline-lg text-on-surface text-center">Mini AI Companion</h1>
        <p className="mt-1.5 text-body-md text-on-surface-variant text-center">
          Build better habits. Understand yourself. Grow every day.
        </p>

        <div className="w-full mt-6 flex rounded-md bg-surface-container-low p-1">
          <button className="flex-1 h-10 rounded text-body-md font-semibold bg-surface-container-lowest text-primary shadow-card-1">
            Log In
          </button>
          <Link to="/register" className="flex-1 h-10 rounded text-body-md font-semibold text-on-surface-variant flex items-center justify-center">
            Create Account
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="w-full mt-4 bg-surface-container-lowest rounded-xl shadow-card-1 p-5 flex flex-col gap-4">
          <button
            type="button"
            className="h-12 rounded-md bg-surface-container-low flex items-center gap-3 px-3.5 text-left hover:bg-surface-container transition-colors"
          >
            <div className="w-8 h-8 rounded-md bg-primary-fixed flex items-center justify-center">
              <Icon name="school" size={16} className="text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-body-md font-semibold text-on-surface">University SSO</div>
              <div className="text-body-sm text-on-surface-variant">Instant access via .edu portal</div>
            </div>
            <Icon name="arrow_forward" size={16} className="text-on-surface-variant" />
          </button>

          <button
            type="button"
            className="h-12 rounded-md bg-surface-container-low flex items-center gap-3 px-3.5 text-left hover:bg-surface-container transition-colors"
          >
            <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center shadow-card-1 text-sm font-bold">G</div>
            <div className="flex-1 text-body-md font-semibold text-on-surface">Continue with Google</div>
            <Icon name="arrow_forward" size={16} className="text-on-surface-variant" />
          </button>

          <div className="flex items-center gap-2 my-1">
            <div className="h-px flex-1 bg-outline-variant" />
            <span className="text-label-sm text-on-surface-variant uppercase tracking-wide">or continue with email</span>
            <div className="h-px flex-1 bg-outline-variant" />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-semibold text-on-surface">University / Personal Email</span>
              <span className="text-label-sm text-primary font-semibold">Student priority</span>
            </div>
            <div className="relative">
              <Icon name="alternate_email" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <Input
                type="email"
                placeholder="koushik@university.edu"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
              />
            </div>
            {errors.email && <span className="text-body-sm text-error">{errors.email}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[14px] font-semibold text-on-surface">Password</span>
            <div className="relative">
              <Icon name="lock" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                className="pl-10 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
              >
                <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={18} />
              </button>
            </div>
            {errors.password && <span className="text-body-sm text-error">{errors.password}</span>}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-body-sm text-on-surface">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded accent-primary"
              />
              Remember me (30d)
            </label>
            <button type="button" className="text-body-sm text-primary font-semibold">
              Forgot password?
            </button>
          </div>

          {formError && (
            <div className="flex items-center gap-2 bg-error-container/50 text-on-error-container rounded-md px-3 py-2.5 text-body-sm">
              <Icon name="error" size={16} className="flex-shrink-0" />
              {formError}
            </div>
          )}

          <Button type="submit" fullWidth size="lg" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign In to Dashboard'}
            <Icon name="arrow_forward" size={18} className="ml-2" />
          </Button>
        </form>

        <div className="flex items-center gap-2 mt-5 text-body-sm text-on-surface-variant">
          <Icon name="lock" size={14} className="text-tertiary-strong" />
          256-bit encrypted <span>·</span> <span className="text-tertiary-strong">Student-first privacy</span>
        </div>
        <div className="mt-2 text-[11px] px-3 py-1.5 rounded-full bg-surface-container-low text-on-surface-variant flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
          FastAPI Backend Auth with JWT verification
        </div>
      </div>
    </div>
  )
}
