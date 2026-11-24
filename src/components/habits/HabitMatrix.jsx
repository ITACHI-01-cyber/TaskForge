import { Activity, BookOpen, Droplet, Sparkles, Target } from 'lucide-react'
import { useTasks } from '../../hooks/useTasks'
import { formatDate, monthDays } from '../../utils/dateUtils'
import { scheduled, statusOn } from '../../utils/statusUtils'
import { streakStats, summarize } from '../../utils/analyticsUtils'
import TriStateCheckbox from '../tasks/TriStateCheckbox'
const icons = {activity:Activity,book:BookOpen,water:Droplet,sparkles:Sparkles,target:Target}
export default function HabitMatrix({items, days, monthly = false, showStats = false}) {
  const {cycle, setEditor} = useTasks()
  return <div className="matrix-wrap"><table className={'matrix ' + (monthly ? 'monthly-matrix' : '')}>
    <thead><tr><th scope="col"><span>{monthly ? 'Activity' : 'Habit'}</span></th>{days.map(day => <th scope="col" key={day} title={day}>{monthly ? Number(day.slice(-2)) : formatDate(day, {weekday:'narrow'})}</th>)}
    {showStats && <><th scope="col">Streak</th><th scope="col">Longest</th><th scope="col">Missed</th><th scope="col">Week</th><th scope="col">Month</th></>}</tr></thead>
    <tbody>{items.map(item => {
      const Icon = icons[item.icon] ?? Target
      const stats = showStats ? streakStats([item],days.at(-1)) : null
      const week = showStats ? summarize([item],days) : null
      const month = showStats ? summarize([item],monthDays(days.at(-1))) : null
      return <tr key={item.id}><th scope="row"><button className="row-title" title={'Edit ' + item.title} onClick={() => setEditor(item)}>{!monthly && <Icon size={14} style={{color:item.color ?? 'var(--gold)'}}/>}{item.title}{item.target && <small> · {item.target}/day</small>}</button></th>
    {days.map(day => <td key={day}>{scheduled(item, day) && <TriStateCheckbox label={item.title + ' · ' + day} status={statusOn(item, day)} onClick={() => cycle(item.id, day)}/>}</td>)}
    {showStats && <><td>{stats.current}d</td><td>{stats.longest}d</td><td>{week.missed}</td><td>{week.total ? week.rate+'%' : '—'}</td><td>{month.total ? month.rate+'%' : '—'}</td></>}</tr>})}</tbody>
  </table>{!items.length && <p className="empty">{monthly ? 'No activities for this period. Add an activity to get started.' : 'No habits for this week. Add a habit to start tracking.'}</p>}</div>
}