import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { gmailPattern, normalizeEmail, validPassword } from '../../utils/authValidation'
import AuthLayout from './AuthLayout'

export default function AuthForm({signup = false}) {
  const {submit} = useAuth()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [visible, setVisible] = useState(false)
  const title = signup ? 'Sign Up' : 'Login'
  async function handleSubmit(event) {
    event.preventDefault()
    const fields = Object.fromEntries(new FormData(event.currentTarget))
    if (signup && !fields.name.trim()) return setError('Enter your name.')
    fields.email = normalizeEmail(fields.email)
    if (!gmailPattern.test(fields.email)) return setError('Enter a valid Gmail address.')
    if (!validPassword(fields.password)) return setError('Password must be 8 to 128 characters.')
    setError('')
    setSubmitting(true)
    try { await submit(signup ? 'signup' : 'login', fields) }
    catch (error) { setError(error.message) }
    finally { setSubmitting(false) }
  }
  return <AuthLayout>
    <h1 id="auth-title">{title}</h1>
    <p className="auth-intro">{signup ? 'Create your account and start tracking.' : 'Welcome back, continue your progress.'}</p>
    <form className="auth-form" onSubmit={handleSubmit} noValidate aria-busy={submitting}>
      {signup && <label htmlFor="auth-name">Name<span className="auth-input"><UserRound size={17}/><input id="auth-name" name="name" autoComplete="name" placeholder="Enter your name" required maxLength={100}/></span></label>}
      <label htmlFor="auth-email">Email<span className="auth-input"><Mail size={17}/><input id="auth-email" type="email" name="email" autoComplete="username" placeholder="Enter your email" maxLength={254} required/></span></label>
      <div className="auth-field"><label htmlFor="auth-password">Password</label><span className="auth-input"><LockKeyhole size={17}/><input id="auth-password" type={visible ? 'text' : 'password'} name="password" autoComplete={signup ? 'new-password' : 'current-password'} placeholder="Enter your password" required maxLength={128}/>
        <button type="button" className="auth-password-toggle" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(value => !value)}>{visible ? <Eye size={17}/> : <EyeOff size={17}/>}</button></span></div>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button type="submit" className="auth-submit" disabled={submitting}>{submitting ? (signup ? 'Creating account…' : 'Logging in…') : title}</button>
    </form>
    <p className="auth-switch">{signup ? 'Already have an account? ' : 'Don’t have an account? '}<Link to={signup ? '/login' : '/signup'}>{signup ? 'Login' : 'Sign Up'}</Link></p>
  </AuthLayout>
}