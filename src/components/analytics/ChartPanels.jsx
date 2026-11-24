import { BarChart3, Target } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar, CartesianGrid } from 'recharts'
import { useTasks } from '../../hooks/useTasks'
import { formatDate, monthDays, today, weekDays } from '../../utils/dateUtils'
import { summarize, streak } from '../../utils/analyticsUtils'
import Panel from '../layout/Panel'
import TriStateCheckbox from '../tasks/TriStateCheckbox'
import ProgressRing from './ProgressRing'

const tracked = (items, kinds) => items.filter(item => kinds.includes(item.kind))
const colors = {done:'#88ed78', missed:'#ff696c', pending:'#a6a8ac'}
const tooltipStyle = {background:'#24262b', border:'1px solid #555761', borderRadius:8, color:'#f5f5f5'}

export function WeeklyAnalytics({expanded = false}) {
  const {date, items} = useTasks()
  const entries = tracked(items, ['task', 'routine', 'habit'])
  const days = weekDays(date)
  const stats = summarize(entries, days)
  const points = days.map(day => {
    const daily = summarize(entries, [day])
    return {date:day, name:formatDate(day, {weekday:'short'}), rate:day <= today() || daily.done + daily.missed > 0 ? daily.rate : null}
  })
  const daysInStreak = streak(entries, days.at(-1))
  if (!stats.total) return <Panel title="Analytics" detail="(Selected week)" icon={BarChart3}><p className="empty">Track tasks, routines, or habits to see your weekly trends.</p></Panel>
  return <Panel title="Analytics" detail="(Selected week)" icon={BarChart3}>
    <div className={'analytics-content' + (expanded ? ' expanded' : '')}>
      <dl className="metric-list">
        <div><dt>Completed</dt><dd>{stats.done}</dd></div><div><dt>Missed</dt><dd className="red">{stats.missed}</dd></div>
        <div><dt>Pending</dt><dd>{stats.pending}</dd></div><div><dt>Completion rate</dt><dd className="gold">{stats.rate}%</dd></div>
        <div><dt>Streak</dt><dd className="gold">{daysInStreak} {daysInStreak === 1 ? 'day' : 'days'}</dd></div>
      </dl>
      <div className="weekly-chart" aria-label="Daily completion trend">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{top:8,right:8,bottom:0,left:expanded ? 0 : 4}}>
            <defs><linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#f6c667" stopOpacity={0.48}/><stop offset="100%" stopColor="#f6c667" stopOpacity={0}/></linearGradient></defs>
            {expanded && <><XAxis dataKey="name" stroke="#acadb4"/><YAxis stroke="#acadb4" domain={[0, 100]} unit="%"/></>}
            <Tooltip contentStyle={tooltipStyle} labelStyle={{color:'#f5f5f5'}} itemStyle={{color:'#f6c667'}} formatter={value => [value + '%', 'Completion rate']} labelFormatter={(_, payload) => payload?.[0]?.payload.name}/>
            <Area type="monotone" dataKey="rate" stroke="#f6c667" strokeWidth={2} fill="url(#trend-fill)" dot={{r:3, fill:'#f6c667'}} isAnimationActive={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  </Panel>
}

export function ProgressOverview() {
  const {date, items} = useTasks()
  const stats = summarize(tracked(items, ['activity']), monthDays(date))
  return <Panel title="Progress Overview" icon={Target}>
    <div className="progress-content"><ProgressRing color="var(--green)" rate={stats.total ? stats.rate : null} caption="Monthly"/>
      <dl className="metric-list">{[['DONE','Completed', stats.done], ['MISSED','Missed', stats.missed], ['PENDING','Pending', stats.pending]].map(([value,label,count]) => <div key={value}><dt><TriStateCheckbox status={value}/>{label}</dt><dd>{count}</dd></div>)}</dl>
    </div>
  </Panel>
}

export function HistoryChart() {
  const {date, items} = useTasks()
  const entries = tracked(items, ['task', 'routine', 'habit', 'activity'])
  const history = monthDays(date).map(day => ({date:day, name: day.slice(-2), ...summarize(entries, [day])}))
  if (!history.some(day => day.total)) return <Panel title="Monthly History" icon={BarChart3}><p className="empty">No tracked entries for this month.</p></Panel>
  return <Panel title="Monthly History" icon={BarChart3}>
    <div className="history-chart"><ResponsiveContainer width="100%" height="100%">
      <BarChart data={history} margin={{top:12,right:12,left:0,bottom:0}}>
        <CartesianGrid vertical={false} stroke="#35373e"/><XAxis dataKey="name" stroke="#acadb4"/><YAxis allowDecimals={false} stroke="#acadb4"/>
        <Tooltip contentStyle={tooltipStyle} labelStyle={{color:'#f5f5f5'}} labelFormatter={(_, payload) => payload?.[0]?.payload.date}/>
        {Object.entries(colors).map(([key,color]) => <Bar key={key} dataKey={key} name={key[0].toUpperCase() + key.slice(1)} stackId="status" fill={color} isAnimationActive={false}/>)}
      </BarChart>
    </ResponsiveContainer></div>
    <div className="history-table"><table className="matrix"><thead><tr>{['Date','Completed','Missed','Pending','Rate'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead><tbody>
      {history.map(day => <tr key={day.date}><th scope="row">{day.date}</th><td>{day.done}</td><td>{day.missed}</td><td>{day.pending}</td><td>{day.total ? day.rate+'%' : '—'}</td></tr>)}
    </tbody></table></div>
  </Panel>
}