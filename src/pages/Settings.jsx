import { useRef, useState } from 'react'
import { Database, Download, Upload } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { useAuth } from '../context/AuthContext'
import { today } from '../utils/dateUtils'
import { storageService, validate } from '../services/storageService'
import PageHeading from '../components/layout/PageHeading'
import { workspaceCsv } from '../utils/dataExport'
import ReminderSettings from '../components/layout/ReminderSettings'
import Panel from '../components/layout/Panel'
export default function Settings() {
  const {data, importData, hasUnsavedChanges} = useTasks()
  const {user, logout} = useAuth()
  const [signingOut, setSigningOut] = useState(false)
  const [signoutError, setSignoutError] = useState('')
  async function signOut() {
    setSignoutError('')
    setSigningOut(true)
    try { await logout() }
    catch (error) { setSignoutError(error.message); setSigningOut(false) }
  }
  const [legacy] = useState(storageService.readLegacy)
  const input = useRef(null)
  const [message, setMessage] = useState('')
  const [candidate, setCandidate] = useState(null)
  const [reading, setReading] = useState(false)
  function download(dataToExport = data, prefix = 'taskforge', format = 'json') {
    const output = format === 'csv' ? workspaceCsv(dataToExport.items) : JSON.stringify(dataToExport,null,2)
    const url = URL.createObjectURL(new Blob([output],{type:format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json'}))
    const link = document.createElement('a')
    link.href = url
    link.download = prefix + '-' + today() + '.' + format
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMessage('Workspace exported.')
  }
  async function read(event) {
    const file = event.target.files[0]
    event.target.value = ''
    if (!file) return
    setCandidate(null)
    setMessage('')
    setReading(true)
    try {
      setCandidate(validate(JSON.parse(await file.text())))
    } catch (error) {
      setMessage(error instanceof SyntaxError ? 'This file does not contain valid JSON.' : error.message)
    } finally {
      setReading(false)
    }
  }
  return <div className="page-stack"><PageHeading title="Settings" dateControls={false}/>
    <Panel title="Account" icon={Database}>
      <div className="settings-content">
        <p>{user.name} · {user.email}</p>
        {hasUnsavedChanges && <p>Wait for workspace changes to save before logging out.</p>}
        {signoutError && <p role="alert">{signoutError}</p>}
        <div><button className="secondary-button" disabled={signingOut || hasUnsavedChanges} onClick={signOut}>{signingOut ? 'Logging out…' : 'Log out'}</button></div>
      </div>
    </Panel>
    <ReminderSettings/>
    <Panel title="Workspace Data" icon={Database}>
      <div className="settings-content">
        <p>TaskForge saves changes automatically to MongoDB Atlas. Use JSON for backups and CSV for spreadsheets.</p>
        <div className="settings-actions"><button className="gold-button" onClick={() => download()}><Download size={18}/>Export JSON</button>
          <button className="secondary-button" onClick={() => download(data,'taskforge','csv')}><Download size={17}/>Export CSV</button>
          <button className="secondary-button" disabled={reading} onClick={() => input.current.click()}><Upload size={17}/>Import JSON</button>
          <input ref={input} type="file" accept=".json,application/json" hidden onChange={read}/>
        </div>
        {legacy && <div className="import-confirm"><p>This browser still has an earlier local workspace. Export it to review or restore it separately.</p>
          <button className="secondary-button" onClick={() => download(legacy, 'taskforge-legacy')}><Download size={17}/>Export earlier local data</button></div>}
        {candidate && <div className="import-confirm"><p>Import {candidate.items.length} entries. Merging keeps local records with matching IDs.</p>
          <button className="gold-button" onClick={() => {importData(candidate); setCandidate(null); setMessage('Workspace imported.')}}>Replace workspace</button>
          <button className="secondary-button" onClick={() => {
            const existing = new Set(data.items.map(item => item.id))
            importData({version:1,items:[...data.items,...candidate.items.filter(item => !existing.has(item.id))]})
            setCandidate(null)
            setMessage('Workspace merged.')
          }}>Merge entries</button>
          <button className="secondary-button" onClick={() => setCandidate(null)}>Cancel</button></div>}
        {message && <p role="status">{message}</p>}
      </div>
    </Panel>
  </div>
}