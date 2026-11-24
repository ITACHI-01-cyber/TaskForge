import { BarChart3 } from 'lucide-react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useTasks } from '../../hooks/useTasks'
import { monthDays, weekDays } from '../../utils/dateUtils'
import { streakStats, summarize, yearDays } from '../../utils/analyticsUtils'
import { priorities, scheduled } from '../../utils/statusUtils'
import Panel from '../layout/Panel'

function BreakdownChart({title,data,series}) {
  return <div><h3 className="analytics-subtitle">{title}</h3><div className="distribution-chart">
    <ResponsiveContainer width="100%" height="100%"><BarChart data={data}><XAxis dataKey="name" stroke="#acadb4"/><YAxis allowDecimals={false} stroke="#acadb4"/>
      <Tooltip contentStyle={{background:'#252629'}} labelStyle={{color:'#fff'}}/>
      {series.map(([key,name,fill]) => <Bar key={key} dataKey={key} name={name} fill={fill} stackId="series"/>)}
    </BarChart></ResponsiveContainer></div>
  </div>
}
export default function ProductivityDetails() {
  const {date,items} = useTasks()
  const entries = items.filter(item => ['task','routine','habit','activity'].includes(item.kind))
  if (!entries.length) return <Panel title="Productivity Breakdown" icon={BarChart3}><p className="empty">Your breakdown will appear once you add a tracked entry.</p></Panel>
  const days = yearDays(date)
  const totals = [['Daily',[date]],['Weekly',weekDays(date)],['Monthly',monthDays(date)],['Yearly',days]]
  const habit = summarize(entries.filter(item => item.kind === 'habit'),monthDays(date))
  const streaks = streakStats(entries,date)
  const tasks = entries.filter(task => task.kind === 'task' && days.some(day => scheduled(task,day)))
  const categories = [...new Set(tasks.map(task => task.category || 'Uncategorized'))]
  const categoryData = categories.map(name => ({name,...summarize(tasks.filter(task => (task.category || 'Uncategorized') === name),days)}))
  const priorityData = priorities.map(name => ({name,tasks:tasks.filter(task => (task.priority ?? 'Medium') === name).length}))
  const heat = days.map(day => ({date:day,...summarize(entries,[day])}))
  return <Panel title="Productivity Breakdown" detail={'('+date.slice(0,4)+')'} icon={BarChart3}>
    <dl className="profile-metrics">{totals.map(([name,period]) => {
      const stats = summarize(entries,period)
      return <div key={name}><dt>{name} completion</dt><dd>{stats.total ? stats.rate+'%' : '—'}</dd><small>{stats.done} done · {stats.missed} missed · {stats.pending} pending</small></div>
    })}
    <div><dt>Monthly habit consistency</dt><dd>{habit.total ? habit.rate+'%' : '—'}</dd></div>
    <div><dt>Current / longest streak</dt><dd>{streaks.current} / {streaks.longest} days</dd></div></dl>
    <h3 className="analytics-subtitle">Yearly activity</h3>
    <div className="heatmap-scroll" tabIndex={0} aria-label="Scrollable yearly activity heatmap">
      <div className="heatmap">{heat.map(day => <span key={day.date} title={day.date+' · '+day.done+' done, '+day.missed+' missed, '+day.pending+' pending'} className={day.done ? 'heat-done' : day.missed ? 'heat-missed' : day.pending ? 'heat-pending' : ''} style={day.done ? {opacity:Math.min(1,.4+day.done*.12)} : undefined}/>)}</div>
    </div>
    {tasks.length > 0 && <div className="two-col">
      <BreakdownChart title="Task completion by category" data={categoryData} series={ [['done','Completed','#8ee59a'],['missed','Missed','#f2777d']] }/>
      <BreakdownChart title="Priority distribution" data={priorityData} series={ [['tasks','Tasks','#f6c667']] }/>
    </div>}
  </Panel>
}