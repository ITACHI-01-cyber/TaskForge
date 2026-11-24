import { ClipboardCheck, Target } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { formatDate, shift } from '../utils/dateUtils'
import { activeTask } from '../utils/statusUtils'
import { useMobile } from '../hooks/useMobile'
import TaskFilters, {useTaskFilters} from '../components/tasks/TaskFilters'
import MobileWeeklyTasks from '../components/mobile/MobileWeeklyTasks'
import PageHeading from '../components/layout/PageHeading'
import Panel from '../components/layout/Panel'
import TaskCard from '../components/tasks/TaskCard'
import WeeklyTaskBoard from '../components/tasks/WeeklyTaskBoard'
import DailyTracker from '../components/planners/DailyTracker'
import GoalPanel from '../components/planners/GoalPanel'

function DatedTasks({upcoming = false}) {
  const {items, date, open} = useTasks()
  const later = items.filter(item => item.kind === 'task' && !item.archivedAt && item.date >= date).map(item => item.date)
  const days = upcoming ? [...new Set([...Array.from({length:30},(_,i) => shift(date,i)),...later])].sort() : [date]
  const dates = days.filter(day => items.some(item => activeTask(item,day)))
  return <Panel title={upcoming ? 'Scheduled tasks' : 'Tasks for this date'} icon={ClipboardCheck} add={() => open('task')}>
    {dates.map(day => <section className="date-group" key={day}>
      {upcoming && <h3>{formatDate(day, {weekday:'long', month:'short', day:'numeric', year:'numeric'})}</h3>}
      {items.filter(item => activeTask(item,day)).map(item => <TaskCard key={item.id} item={item} date={day}/>)}
    </section>)}
    {!dates.length && <p className="empty">No scheduled tasks.</p>}
  </Panel>
}
export function Today() {
  return <div className="page-stack"><PageHeading title="Today" step="day" add/><div className="two-col"><DatedTasks/><DailyTracker showHistory/></div></div>
}
export function Upcoming() {
  return <div className="page-stack"><PageHeading title="Upcoming" step="day" add/><DatedTasks upcoming/></div>
}
export function Tasks() {
  const {items,date,showSearch} = useTasks()
  const filters = useTaskFilters(items)
  const mobile = useMobile()
  const toolbar = <TaskFilters filters={filters} dayTasks={filters.tasks.filter(item => activeTask(item,date))} search={showSearch}/>
  if (mobile) return <MobileWeeklyTasks filters={filters} toolbar={toolbar}/>
  return <div className="page-stack">
    <PageHeading title="Tasks" add/>{toolbar}<WeeklyTaskBoard filtered={filters.tasks} group={filters.group}/>
    <GoalPanel kind="focus" title="Weekly Focus" icon={Target}/>
  </div>
}