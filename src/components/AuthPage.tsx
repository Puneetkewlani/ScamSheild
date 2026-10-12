import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, LoaderCircle, Shield, ShieldCheck } from 'lucide-react'
import { api, ApiError } from '../services/apiClient'
import { useAuth } from '../services/useAuth'
import './auth.css'

type AuthMode = 'login' | 'register' | 'forgot' | 'reset'

function modeFromPath(path: string): AuthMode {
  if (path === '/register') return 'register'
  if (path === '/forgot-password') return 'forgot'
  if (path === '/reset-password') return 'reset'
  return 'login'
}

export function AuthPage() {
  const mode = modeFromPath(useLocation().pathname)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login, register } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (mode !== 'reset' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.')
      return
    }
    if (mode === 'register' && !fullName.trim()) {
      setError('Enter your full name.')
      return
    }
    if (['login', 'register', 'reset'].includes(mode) && !password) {
      setError('Enter your password.')
      return
    }
    if (mode === 'register') {
      if (!termsAccepted) { setError('Accept the Terms and Privacy Policy to create an account.'); return }
      if (password !== confirmation) { setError('Passwords do not match.'); return }
    }
    if ((mode === 'register' || mode === 'reset') && (password.length < 12 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password))) {
      setError('Use at least 12 characters with uppercase, lowercase, a number, and a symbol.')
      return
    }
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
        navigate('/', { replace: true })
      } else if (mode === 'register') {
        await register(fullName, email, password, confirmation)
        navigate('/login', { replace: true, state: { notice: 'Account created. Sign in with your new credentials.' } })
      } else if (mode === 'forgot') {
        const response = await api.forgotPassword(email)
        setNotice(response.message)
      } else {
        const token = searchParams.get('token') ?? ''
        if (!token) throw new Error('This reset link is missing its token.')
        const response = await api.resetPassword(token, password)
        setNotice(response.message)
      }
    } catch (reason) {
      setError(reason instanceof ApiError || reason instanceof Error ? reason.message : 'The request could not be completed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const title = mode === 'login' ? 'Welcome back.' : mode === 'register' ? 'Create your account.' : mode === 'forgot' ? 'Reset your password.' : 'Choose a new password.'
  const description = mode === 'login' ? 'Sign in to review and manage your investigations.' : mode === 'register' ? 'Your scans stay connected to your own private account.' : mode === 'forgot' ? 'Enter your account email and we will send reset instructions if available.' : 'Use a strong password you have not used elsewhere.'

  return <main className="auth-shell">
    <section className="auth-aside" aria-label="ScamShield security workspace">
      <Link to="/login" className="auth-brand"><span className="auth-brand-mark"><Shield size={19} /></span><span><strong>ScamShield</strong><small>THREAT DEFENSE</small></span></Link>
      <div className="auth-aside-copy"><span className="auth-kicker"><ShieldCheck size={15} /> A SECOND LOOK FOR THE INTERNET</span><h1>Before you click,<br />know.</h1><p>Review suspicious links and messages with explainable signals, saved securely to your account.</p></div>
      <div className="auth-aside-foot"><span className="auth-status-dot" /> Private account workspace <span>·</span> Demo heuristic analysis</div>
    </section>
    <section className="auth-main"><div className="auth-card">
      <div className="auth-mobile-brand"><span className="auth-brand-mark"><Shield size={18} /></span><strong>ScamShield</strong></div>
      <div className="auth-heading"><span className="auth-kicker">ACCOUNT ACCESS</span><h2>{title}</h2><p>{description}</p></div>
      <form className="auth-form" onSubmit={submit} noValidate>
        {mode === 'register' && <label>Full name<input autoComplete="name" required maxLength={120} value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your name" /></label>}
        {mode !== 'reset' && <label>Email address<input type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>}
        {(mode === 'login' || mode === 'register' || mode === 'reset') && <label>Password<span className="auth-password"><input type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'login' ? undefined : 12} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === 'login' ? 'Enter your password' : 'At least 12 characters'} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>}
        {mode === 'register' && <><p className="auth-guidance">Use 12 or more characters with uppercase, lowercase, a number, and a symbol.</p><label className="auth-terms"><input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} /><span>I agree to the <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.</span></label></>}
        {mode === 'register' && <label>Confirm password<input type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={12} maxLength={128} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Enter password again" /></label>}
        {error && <p className="auth-feedback error" role="alert">{error}</p>}
        {notice && <p className="auth-feedback success" role="status">{notice}</p>}
        <button className="auth-submit" type="submit" disabled={loading}>{loading && <LoaderCircle className="auth-spinner" size={17} />}{loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : mode === 'forgot' ? 'Send reset instructions' : 'Update password'}</button>
      </form>
      <div className="auth-links">{mode === 'login' && <><Link to="/forgot-password">Forgot password?</Link><p>New to ScamShield? <Link to="/register">Create an account</Link></p></>}{mode === 'register' && <p>Already have an account? <Link to="/login">Sign in</Link></p>}{mode === 'forgot' && <p>Remembered your password? <Link to="/login">Back to sign in</Link></p>}{mode === 'reset' && <p><Link to="/login">Back to sign in</Link></p>}</div>
      <p className="auth-disclaimer">Analysis is heuristic demonstration only. No live reputation or destination checks are performed.</p>
    </div></section>
  </main>
}