import { useState } from 'react'
import { Pin, StickyNote } from 'lucide-react'
import { useTasks } from '../../hooks/useTasks'
import { formatDate, today } from '../../utils/dateUtils'
import TriStateCheckbox from '../tasks/TriStateCheckbox'
import { priorityRank } from '../../utils/statusUtils'
import Panel from '../layout/Panel'
export default function NotesPanel({compact = false}) {
  const {items, open, setEditor, cycle} = useTasks()
  const [search,setSearch] = useState('')
  const [filter,setFilter] = useState('')
  const current = today()
  const time = new Date().toTimeString().slice(0,5)
  const notes = items.filter(item => item.kind === 'note' && (!compact || item.pinned || item.hasReminder === false || (item.date >= current && item.status !== 'DONE'))).sort((a,b) => Number(!!b.pinned)-Number(!!a.pinned) || (a.date+(a.time??'')).localeCompare(b.date+(b.time??'')) || priorityRank(b)-priorityRank(a))
  const visible = notes.filter(note => {
    if (compact) return true
    const matches = (note.title+' '+note.body).toLowerCase().includes(search.trim().toLowerCase())
    const selected = !filter || (filter === 'pinned' && note.pinned) || (filter === 'upcoming' && note.hasReminder !== false && note.status !== 'DONE' && (note.date > current || (note.date === current && (!note.time || note.time >= time))))
    return matches && selected
  })
  return <Panel title="Notes / Reminders" icon={StickyNote} add={() => open('note')}>
    {!compact && notes.length > 0 && <div className="filter-fields note-filters">
      <label>Search notes<input type="search" value={search} onChange={event => setSearch(event.target.value)}/></label>
      <label>Show<select aria-label="Filter notes" value={filter} onChange={event => setFilter(event.target.value)}><option value="">All notes</option><option value="pinned">Pinned notes</option><option value="upcoming">Upcoming reminders</option></select></label>
    </div>}
    {(compact ? visible.slice(0,5) : visible).map(item => <div className="note-row" key={item.id}>
      <button className="row-title" onClick={() => setEditor(item)}><span>{item.pinned && <Pin size={12}/>} {item.title}</span>{item.hasReminder !== false && <time dateTime={item.date}>{formatDate(item.date, compact ? {month:'short', day:'numeric'} : {month:'short', day:'numeric', year:'numeric'})}{item.time && ' · '+item.time}</time>}</button>
      {!compact && <div className="note-meta">{item.hasReminder !== false && <TriStateCheckbox status={item.status} label={item.title+' reminder'} onClick={() => cycle(item.id)}/>}<span>{item.priority ?? 'Medium'} priority</span></div>}
      {!compact && item.body && <p>{item.body}</p>}
    </div>)}{!visible.length && <p className="empty">{notes.length ? 'No matching notes.' : 'No notes or reminders.'}</p>}
  </Panel>
}