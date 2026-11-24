import { useState } from 'react'
import { priorities, priorityRank, states } from '../../utils/statusUtils'
import { useTasks } from '../../hooks/useTasks'
import TaskActions from './TaskActions'

export function useTaskFilters(items) {
  const [query,setQuery] = useState('')
  const [priority,setPriority] = useState('')
  const [category,setCategory] = useState('')
  const [sort,setSort] = useState('manual')
  const [group,setGroup] = useState('')
  const all = items.filter(item => item.kind === 'task')
  const categories = [...new Set(all.map(item => item.category).filter(Boolean))].sort()
  const tasks = all.filter(item => (!priority || (item.priority ?? 'Medium') === priority) && (!category || item.category === category)
    && [item.title,item.body,item.category,...(item.tags ?? [])].join(' ').toLowerCase().includes(query.trim().toLowerCase()))
  if (sort === 'due') tasks.sort((a,b) => (a.dueDate || a.date).localeCompare(b.dueDate || b.date) || (a.time ?? '').localeCompare(b.time ?? ''))
  if (sort === 'priority') tasks.sort((a,b) => priorityRank(b)-priorityRank(a))
  return {query,setQuery,priority,setPriority,category,setCategory,sort,setSort,group,setGroup,categories,tasks}
}
export function taskGroups(tasks, group) {
  if (!group) return [['',tasks]]
  const result = new Map()
  for (const task of tasks) {
    const name = group === 'priority' ? task.priority ?? 'Medium' : task.category || 'Uncategorized'
    if (!result.has(name)) result.set(name,[])
    result.get(name).push(task)
  }
  return [...result]
}
export default function TaskFilters({filters, dayTasks, search}) {
  const {bulk,date} = useTasks()
  const archived = filters.tasks.filter(item => item.archivedAt)
  const [bulkState,setBulkState] = useState('')
  const [confirm,setConfirm] = useState(false)
  return <details className="panel task-filters">
    <summary>Search, filter and organize tasks</summary>
    <div className="filter-fields">
      <label>Search tasks<input type="search" value={filters.query} onChange={event => set('query',event.target.value)}/></label>
      <label>Priority<select value={filters.priority} onChange={event => set('priority',event.target.value)}><option value="">All priorities</option>{priorities.map(priority => <option key={priority}>{priority}</option>)}</select></label>
      <label>Category<select value={filters.category} onChange={event => set('category',event.target.value)}><option value="">All categories</option>{filters.categories.map(category => <option key={category}>{category}</option>)}</select></label>
      <label>Sort by<select value={filters.sort} onChange={event => set('sort',event.target.value)}><option value="manual">Manual order</option><option value="due">Due date</option><option value="priority">Priority</option></select></label>
      <label>Group by<select value={filters.group} onChange={event => set('group',event.target.value)}><option value="">No groups</option><option value="category">Category</option><option value="priority">Priority</option></select></label>
    </div>
    {search && <div className="profile-buttons"><button className="secondary-button" onClick={search}>Search workspace</button></div>}
    {dayTasks?.length > 0 && <div className="bulk-controls">
      <label>Set status for {dayTasks.length} visible {dayTasks.length === 1 ? 'task' : 'tasks'} on {date}<select value={bulkState} onChange={event => {setBulkState(event.target.value);setConfirm(false)}}><option value="">Choose status</option>{states.map(status => <option key={status}>{status}</option>)}</select></label>
      <button className="secondary-button" disabled={!bulkState} onClick={() => {
        if (!confirm) return setConfirm(true)
        bulk(dayTasks.map(item => item.id),date,bulkState)
        setConfirm(false)
      }}>{confirm ? 'Confirm update' : 'Apply status'}</button>
    </div>}
    {archived.length > 0 && <details><summary>Archived tasks ({archived.length})</summary>{archived.map(item => <div className="task-row" key={item.id}><span>{item.title}</span><TaskActions item={item}/></div>)}</details>}
  </details>
  function set(field,value) {filters['set'+field[0].toUpperCase()+field.slice(1)](value);setConfirm(false)}
}