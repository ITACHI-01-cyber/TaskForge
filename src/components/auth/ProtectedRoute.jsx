import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AuthLayout from './AuthLayout'

export default function ProtectedRoute({guest = false}) {
  const {user, checking, error, refresh} = useAuth()
  if (checking || error) return <AuthLayout>
    <h1 id="auth-title">{checking ? 'Loading TaskForge' : 'Connection unavailable'}</h1>
    {error ? <><p className="auth-error" role="alert">{error}</p><button className="auth-submit" onClick={refresh}>Try again</button></> : <p className="auth-intro" role="status">Checking your session…</p>}
  </AuthLayout>
  if (guest) return user ? <Navigate to="/dashboard" replace/> : <Outlet/>
  return user ? <Outlet/> : <Navigate to="/login" replace/>
}