import { Plus } from 'lucide-react'
import { useTasks } from '../../hooks/useTasks'
import { formatDate, today, weekDays } from '../../utils/dateUtils'
import { activeTask, statusOn } from '../../utils/statusUtils'
import TaskCard from './TaskCard'
import { taskGroups } from './TaskFilters'
export default function WeeklyTaskBoard({filtered, group = ''}) {
  const {items, date, open, setDate} = useTasks()
  return <section className="panel weekly-board" aria-label="Weekly to-do board">
    {weekDays(date).map(day => {
      const tasks = (filtered ?? items).filter(item => activeTask(item,day))
      const left = tasks.filter(item => statusOn(item, day) !== 'DONE').length
      return <div className={'day-column' + (day === today() ? ' current-day' : '')} key={day}>
        <div className="day-header">
          <span className={'left-count ' + (!left ? 'clear' : '')}><b>{left}</b><small>Left</small></span>
          <button className="day-label" onClick={() => setDate(day)} aria-pressed={day === date}><b>{formatDate(day, {weekday:'long'})}</b><span>{formatDate(day, {month:'short', day:'numeric'})}</span></button>
          <button className="icon-button add-day" aria-label={'Add task for ' + day} title="Add task" onClick={() => open('task', day)}><Plus size={15}/></button>
        </div>
        {taskGroups(tasks,group).map(([label,groupItems]) => <div key={label}>{label && <h3 className="task-group-label">{label}</h3>}{groupItems.map(item => <TaskCard key={item.id} item={item} date={day} actions/>)}</div>)}
        {!tasks.length && <span className="muted empty-day">No tasks</span>}
      </div>
    })}
  </section>
}