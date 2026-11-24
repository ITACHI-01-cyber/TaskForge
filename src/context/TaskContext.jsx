import { createContext, useCallback, useEffect, useRef, useState } from 'react'
import { storageService, validate } from '../services/storageService'
import { activeTask, nextStatus, statusOn } from '../utils/statusUtils'
import { today } from '../utils/dateUtils'
import { useAuth } from './AuthContext'

export const TaskContext = createContext(null)
export function TaskProvider({children}) {
  const [data, setData] = useState(null)
  const [saved, setSaved] = useState(null)
  const [storageError, setStorageError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saveFailed, setSaveFailed] = useState(false)
  const writing = useRef(false)
  const [date, setDate] = useState(today)
  const [editor, setEditor] = useState(null)
  const [undoData,setUndoData] = useState(null)
  const [searching,setSearching] = useState(false)
  const [toast,setToast] = useState('')

  const {refresh, user} = useAuth()
  const account = user.accountId
  const load = useCallback(async () => {
    setLoading(true)
    setStorageError('')
    try {
      const workspace = await storageService.load(account)
      setSaved(workspace)
      setData(workspace.data)
    } catch (error) {
      if (error.status === 401) void refresh()
      setStorageError(error.message)
    } finally {
      setLoading(false)
    }
  }, [account, refresh])
  useEffect(() => { void load() }, [load])

  useEffect(() => {
    if (!saved || saved.data === data || writing.current || saveFailed) return
    writing.current = true
    async function persist() {
      try {
        const result = await storageService.save(data, saved.revision, account)
        writing.current = false
        setSaved({data, revision:result.revision})
        setStorageError('')
        setToast('Changes saved.')
      } catch (error) {
        writing.current = false
        setSaveFailed(true)
        setStorageError(error.status === 409
          ? 'Another device saved changes first. Export your unsaved changes from Settings before refreshing.'
          : error.message + ' Your changes are unsaved. Retry saving or export a backup from Settings.')
      }
    }
    void persist()
  }, [account, data, saved, saveFailed])

  useEffect(() => {
    if (!saved || saved.data === data) return
    const warn = event => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [data, saved])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 4500)
    return () => clearTimeout(timer)
  }, [toast])
  function updateItems(update) {
    setUndoData(data)
    setToast('')
    setData(previous => ({...previous, items: update(previous.items)}))
  }
  function save(fields, occurrence, status) {
    const id = fields.id ?? crypto.randomUUID()
    updateItems(items => {
      const existing = items.find(item => item.id === id)
      const records = {...existing?.records}
      if (occurrence && status) records[occurrence] = status
      if (!existing) return [...items, {status:'PENDING',...fields,id,records}]
      return items.map(item => item.id === id ? {...item,...fields,records} : item)
    })
    setEditor(null)
  }
  function remove(id) {
    updateItems(items => items.filter(item => item.id !== id))
    setEditor(null)
  }
  function cycle(id, day) {
    updateItems(items => items.map(item => {
      if (item.id !== id) return item
      return day ? {...item, records: {...item.records, [day]: nextStatus(statusOn(item, day))}} : {...item, status: nextStatus(item.status)}
    }))
  }
  function duplicate(item) {
    const id = crypto.randomUUID()
    updateItems(items => [...items,{...item,id,title:(item.title.slice(0,113)+' (copy)'),records:{},status:'PENDING',archivedAt:'',subtasks:item.subtasks?.map(step => ({...step,done:false})) ?? []}])
  }
  function archive(item) {
    updateItems(items => items.map(entry => entry.id === item.id ? {...entry,archivedAt:entry.archivedAt ? '' : today()} : entry))
  }
  function move(id,direction,day) {
    updateItems(items => {
      const index = items.findIndex(item => item.id === id)
      if (index < 0) return items
      let neighbor = index + direction
      while (items[neighbor] && (day ? !activeTask(items[neighbor],day) : items[neighbor].kind !== items[index].kind)) {
        neighbor += direction
      }
      if (!items[neighbor]) return items
      const next = [...items]
      ;[next[index],next[neighbor]] = [next[neighbor],next[index]]
      return next
    })
  }
  function bulk(ids,day,status) {
    updateItems(items => items.map(item => ids.includes(item.id) ? {...item,records:{...item.records,[day]:status}} : item))
  }
  function undo() {
    if (!undoData) return
    setData(undoData)
    setUndoData(null)
    setToast('')
  }
  const open = (kind, day = date) => setEditor({kind, date: day, title: '', body: ''})
  if (!data) return <main className="panel widget" style={{margin:20}}>
    {loading ? <div className="workspace-skeleton" role="status" aria-label="Loading workspace"/> : <>
      <p role="alert">{storageError}</p>
      <button className="secondary-button" onClick={load}>Retry connection</button>
    </>}
  </main>
  return <TaskContext.Provider value={{data, hasUnsavedChanges:saved?.data !== data, retrySave: saveFailed ? () => setSaveFailed(false) : null, items: data.items, storageError, date, setDate, editor, setEditor, open, save, remove, cycle, duplicate, archive, move, bulk, toast, undo, canUndo:!!undoData, searching, setSearching, showSearch:() => setSearching(true),
    importData: input => {const imported = validate(input); updateItems(() => imported.items)}}}>{children}</TaskContext.Provider>
}