import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { profileService } from '../../services/profileService'
export default function EditProfileModal({user, onUpdate, close}) {
  const dialog = useRef(null)
  const [email,setEmail] = useState(user.email)
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState('')
  useEffect(() => {dialog.current.showModal()},[])
  async function submit(event) {
    event.preventDefault()
    const fields = Object.fromEntries(new FormData(event.currentTarget))
    setBusy(true)
    setError('')
    try {onUpdate(await profileService.update(fields)); close()}
    catch (error) {setError(error.message);setBusy(false)}
  }
  return <dialog aria-labelledby="edit-profile-title" className="editor panel" ref={dialog} onCancel={event => {event.preventDefault();if (!busy) close()}}>
    <form onSubmit={submit}>
      <div className="dialog-heading"><h2 id="edit-profile-title">Edit Profile</h2><button type="button" className="icon-button" aria-label="Close" disabled={busy} onClick={close}><X size={20}/></button></div>
      <label>Full name<input name="name" autoComplete="name" defaultValue={user.name} required maxLength={100}/></label>
      <label>Gmail address<input type="email" name="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required maxLength={254}/></label>
      {email.trim().toLowerCase() !== user.email && <label>Current password<input type="password" name="currentPassword" autoComplete="current-password" required maxLength={128}/></label>}
      {error && <p role="alert" className="storage-error">{error}</p>}
      <div className="dialog-actions"><button type="button" className="secondary-button" disabled={busy} onClick={close}>Cancel</button><button className="gold-button" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button></div>
    </form>
  </dialog>
}