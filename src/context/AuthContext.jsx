import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)
export function AuthProvider({children}) {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')
  const refresh = useCallback(async () => {
    setChecking(true)
    setError('')
    try { setUser(await authService.session()) }
    catch (error) { setError(error.message) }
    finally { setChecking(false) }
  }, [])
  useEffect(() => { void refresh() }, [refresh])
  async function submit(action, fields) {
    setUser(await authService.submit(action, fields))
  }
  async function logout() {
    await authService.logout()
    setUser(null)
  }
  return <AuthContext.Provider value={{user, checking, error, refresh, submit, logout, setUser}}>{children}</AuthContext.Provider>
}