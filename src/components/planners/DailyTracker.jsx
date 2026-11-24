import { Timer } from 'lucide-react'
import { useTasks } from '../../hooks/useTasks'
import { streak, summarize } from '../../utils/analyticsUtils'
import { formatDate, shift } from '../../utils/dateUtils'
import { scheduled } from '../../utils/statusUtils'
import Panel from '../layout/Panel'
import TaskCard from '../tasks/TaskCard'
import ProgressRing from '../analytics/ProgressRing'
export default function DailyTracker({showHistory = false}) {
  const {items, date, open, setDate} = useTasks()
  const allRoutines = items.filter(item => item.kind === 'routine')
  const routines = allRoutines.filter(item => scheduled(item,date))
  const stats = summarize(routines, [date])
  return <Panel title="Daily Tracker" icon={Timer} add={() => open('routine')}>
    <div className="daily-content"><ProgressRing rate={stats.total ? stats.rate : null} caption="Tasks done" detail={stats.done + ' / ' + stats.total}/>
      <div>{routines.map((item, i) => <TaskCard key={item.id} item={item} date={date} number={i + 1}/>)}{!routines.length ? <p className="empty">No routines for this date.</p> : <p className="routine-streak">{streak(routines,date)}-day streak</p>}</div>
    </div>
    {showHistory && <details className="routine-history"><summary>Last seven days</summary>
      {Array.from({length:7},(_,i) => shift(date,-i)).map(day => {
        const stats = summarize(allRoutines,[day])
        return <button key={day} className="row-title" onClick={() => setDate(day)}>{formatDate(day,{weekday:'short',day:'numeric',month:'short'})} · {stats.total ? stats.done+' / '+stats.total+' completed' : 'No routines'}</button>
      })}
    </details>}
  </Panel>
}