import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useTasks } from '../../hooks/useTasks'
export default function WorkspaceSearch({close}) {
  const {items,setEditor} = useTasks()
  const dialog = useRef(null)
  const [query,setQuery] = useState('')
  useEffect(() => {dialog.current.showModal()},[])
  const matches = query.trim() ? items.filter(item => [item.title,item.body,item.category,...(item.tags ?? [])].join(' ').toLowerCase().includes(query.trim().toLowerCase())).slice(0,24) : []
  return <dialog aria-labelledby="workspace-search-title" ref={dialog} className="editor panel workspace-search" onCancel={event => {event.preventDefault();close()}}>
    <div className="dialog-heading"><h2 id="workspace-search-title">Search workspace</h2><button className="icon-button" onClick={close} aria-label="Close search"><X size={18}/></button></div>
    <label><span className="sr-only">Search workspace records</span><input autoFocus type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by title, description or tag"/></label>
    {matches.map(item => <button className="search-match" key={item.id} onClick={() => {close();setEditor(item)}}><Search size={14}/>{item.title}<span>{item.kind}</span></button>)}
    {query.trim() && !matches.length && <p className="empty">No matching records.</p>}
  </dialog>
}