import { useState } from 'react'
import { CalendarDays, Target } from 'lucide-react'
import { useTasks } from '../../hooks/useTasks'
import { formatDate, monthDays, today, weekDays } from '../../utils/dateUtils'
import { summarize } from '../../utils/analyticsUtils'
import ProgressRing from '../analytics/ProgressRing'
import TriStateCheckbox from '../tasks/TriStateCheckbox'
import HabitTracker from '../habits/HabitTracker'
import MobileStatsCards from './MobileStatsCards'

export default function MobileDashboard() {
  const {items, open} = useTasks()
  const [period,setPeriod] = useState('week')
  const current = today()
  const time = new Date().getHours()
  const greeting = time < 12 ? 'Morning' : time < 18 ? 'Afternoon' : 'Evening'
  const tasks = items.filter(item => item.kind === 'task')
  const week = summarize(tasks,weekDays(current))
  const progress = period === 'week' ? week : summarize(tasks,monthDays(current))
  const focus = summarize(tasks,[current])
  return <div className="page-stack mobile-dashboard">
    <div className="mobile-welcome">
      <div><h1>Good {greeting}</h1><p>Stay consistent, make progress.</p></div>
      <time dateTime={current}><CalendarDays size={16}/>{formatDate(current,{weekday:'short',month:'short',day:'numeric'})}</time>
    </div>
    <MobileStatsCards stats={week}/>
    <section className="panel mobile-progress">
      <div className="mobile-panel-title"><h2>Overall Progress</h2><select aria-label="Progress period" value={period} onChange={event => setPeriod(event.target.value)}><option value="week">This Week</option><option value="month">This Month</option></select></div>
      <div className="progress-content">
        <ProgressRing rate={progress.total ? progress.rate : null} caption="Completed" color="var(--green)"/>
        <dl className="metric-list">{[['DONE','Completed',progress.done],['MISSED','Missed',progress.missed],['PENDING','Pending',progress.pending]].map(([status,label,count]) => <div key={status}><dt><TriStateCheckbox status={status}/>{label}</dt><dd>{count}</dd></div>)}</dl>
      </div>
    </section>
    <section className="panel mobile-focus">
      <Target size={24}/><div><h2>Today’s Focus</h2>
      {focus.total ? <><p>{focus.done} of {focus.total} completed</p><div className="focus-meter"><progress value={focus.done} max={focus.total}/><strong>{focus.rate}%</strong></div></> :
        <><p>No tasks scheduled today.</p><button className="text-action" onClick={() => open('task',current)}>Add a task</button></>}
      </div>
    </section>
    <HabitTracker anchor={current}/>
  </div>
}