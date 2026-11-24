import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { LogOut, Settings, UserRound } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTasks } from '../../hooks/useTasks'
import ProfileAvatar from './ProfileAvatar'
export default function ProfileDropdown() {
  const {user, logout} = useAuth()
  const {hasUnsavedChanges} = useTasks()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const root = useRef(null)
  const trigger = useRef(null)
  useEffect(() => {
    if (!open) return
    const outside = event => {if (!root.current?.contains(event.target)) setOpen(false)}
    const escape = event => {if (event.key === 'Escape') {setOpen(false); trigger.current?.focus()}}
    document.addEventListener('pointerdown',outside)
    document.addEventListener('keydown',escape)
    return () => {
      document.removeEventListener('pointerdown',outside)
      document.removeEventListener('keydown',escape)
    }
  }, [open])
  async function signOut() {
    setBusy(true)
    setError('')
    try {await logout()}
    catch (error) {setError(error.message); setBusy(false)}
  }
  return <div className="profile-menu" ref={root}>
    <button className="avatar-trigger" ref={trigger} aria-label="Open profile menu" aria-expanded={open} onClick={() => setOpen(!open)}><ProfileAvatar user={user}/></button>
    {open && <div className="panel profile-popover">
      <div className="profile-identity"><ProfileAvatar user={user}/><div><strong>{user.name}</strong><small>{user.email}</small></div></div>
      <Link to="/profile" onClick={() => setOpen(false)}><UserRound size={17}/>My Profile</Link>
      <Link to="/settings" onClick={() => setOpen(false)}><Settings size={17}/>Settings</Link>
      <button disabled={busy || hasUnsavedChanges} onClick={signOut}><LogOut size={17}/>{busy ? 'Logging out…' : 'Logout'}</button>
      {hasUnsavedChanges && <small>Workspace changes are still unsaved.</small>}
      {error && <small role="alert">{error}</small>}
    </div>}
  </div>
}