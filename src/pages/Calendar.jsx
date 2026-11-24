import { CalendarDays } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { formatDate, monthDays, monthLabel, today, weekDays } from '../utils/dateUtils'
import { scheduled, statusOn } from '../utils/statusUtils'
import PageHeading from '../components/layout/PageHeading'
import Panel from '../components/layout/Panel'
import TaskCard from '../components/tasks/TaskCard'
export default function Calendar() {
  const {items, date, setDate, open} = useTasks()
  const days = monthDays(date)
  const start = weekDays(days[0]).indexOf(days[0])
  const entries = items.filter(item => ['task', 'habit'].includes(item.kind))
  const selected = entries.filter(item => scheduled(item, date))
  return <div className="page-stack"><PageHeading title="Calendar" step="month" add/>
    <div className="calendar-layout">
      <Panel title={monthLabel(date)} icon={CalendarDays}>
        <div className="calendar-grid">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => <b className="weekday" key={day}>{day}</b>)}
          {Array.from({length:start}, (_,index) => <span key={'blank' + index}/>)}
          {days.map(day => {
            const daily = entries.filter(item => scheduled(item, day))
            return <button className={'calendar-date' + (day === today() ? ' is-today' : '')} aria-pressed={day === date} aria-label={day + ', ' + daily.length + ' entries'} key={day} onClick={() => setDate(day)}>
              <strong>{Number(day.slice(-2))}</strong><span className="calendar-dots" aria-hidden="true">{daily.slice(0, 5).map(item => <i key={item.id} className={statusOn(item, day).toLowerCase()}/>)}{daily.length > 5 && <small>+{daily.length - 5}</small>}</span>
            </button>
          })}
        </div>
      </Panel>
      <Panel title={formatDate(date, {month:'long', day:'numeric'})} icon={CalendarDays} add={() => open('task',date)}>
        {['task','habit'].map(kind => <section className="date-group" key={kind}>
          <h3>{kind === 'task' ? 'Tasks' : 'Habits'}</h3>
          {selected.filter(item => item.kind === kind).map(item => <TaskCard key={item.id} item={item} date={date}/>)}
          {!selected.some(item => item.kind === kind) && <p className="empty">No {kind}s for this date.</p>}
        </section>)}
      </Panel>
    </div>
  </div>
}