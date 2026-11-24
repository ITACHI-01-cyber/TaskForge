import { ChevronLeft, ChevronRight, Ellipsis, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTasks } from '../../hooks/useTasks'
import { formatDate, shift, today, validDate, weekDays } from '../../utils/dateUtils'
import { activeTask, statusOn } from '../../utils/statusUtils'
import TriStateCheckbox from '../tasks/TriStateCheckbox'
import { taskGroups } from '../tasks/TaskFilters'
import TaskActions from '../tasks/TaskActions'

export default function MobileWeeklyTasks({filters,toolbar}) {
  const {items,date,setDate,open,cycle,setEditor} = useTasks()
  const days = weekDays(date)
  const changeWeek = offset => {const next = shift(date,offset);if (validDate(next)) setDate(next)}
  const tasks = filters.tasks.filter(item => activeTask(item,date))
  return <div className="page-stack mobile-week">
    <div className="mobile-view-heading"><Link to="/dashboard" aria-label="Back to dashboard"><ChevronLeft/></Link><h1>Weekly Tasks</h1><button aria-label="Add task for selected date" onClick={() => open('task')}><Plus/></button></div>
    <div className="mobile-period">
      <button aria-label="Previous week" onClick={() => changeWeek(-7)}><ChevronLeft size={20}/></button>
      <button className="period-label" title="Jump to current week" onClick={() => setDate(today())}>{formatDate(days[0],{month:'short',day:'numeric'})} – {formatDate(days.at(-1),{month:'short',day:'numeric',year:'numeric'})}</button>
      <button aria-label="Next week" onClick={() => changeWeek(7)}><ChevronRight size={20}/></button>
    </div>
    <div className="mobile-day-strip" aria-label="Days of the week">
      {days.map(day => <button key={day} aria-pressed={day === date} onClick={() => setDate(day)}><span>{formatDate(day,{weekday:'short'})}</span><strong>{Number(day.slice(-2))}</strong><small>({items.filter(item => activeTask(item,day)).length})</small></button>)}
    </div>
    <section className="panel mobile-task-panel">
      <div className="mobile-panel-title"><h2>{formatDate(date,{weekday:'long',month:'short',day:'numeric'})}</h2><span>{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</span></div>
      {taskGroups(tasks,filters.group).map(([label,rows]) => <div key={label}>{label && <h3 className="task-group-label">{label}</h3>}{rows.map(item => <div className={'mobile-task-row status-'+statusOn(item,date).toLowerCase()} key={item.id}>
        <TriStateCheckbox status={statusOn(item,date)} label={item.title} onClick={() => cycle(item.id,date)}/>
        <button className="row-title" onClick={() => setEditor({...item,occurrence:date})}>{item.title}</button>
        <span className={'priority-badge priority-'+(item.priority ?? 'Medium').toLowerCase()}>{item.priority ?? 'Medium'}</span>
        <TaskActions item={item} occurrence={date} icon={Ellipsis}/>
      </div>)}</div>)}
      {!tasks.length && <p className="empty">No tasks for this day. Create your first task.</p>}
    </section>
    <button className="mobile-add secondary-button" onClick={() => open('task')}><Plus size={20}/>Add Task</button>
    {toolbar}
  </div>
}