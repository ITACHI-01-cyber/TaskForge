import { useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTasks } from '../../hooks/useTasks'
import { monthDays, monthLabel, shiftMonth } from '../../utils/dateUtils'
import { scheduled } from '../../utils/statusUtils'
import Panel from '../layout/Panel'
import HabitMatrix from '../habits/HabitMatrix'
export default function MonthlyPlanner({hideControls = false, showFilter = hideControls}) {
  const {items, date, setDate, open} = useTasks()
  const [filter,setFilter] = useState('')
  const days = monthDays(date)
  const activities = items.filter(item => item.kind === 'activity' && days.some(day => scheduled(item,day)) && item.title.toLowerCase().includes(filter.toLowerCase()))
  return <Panel title="Monthly Planner" icon={CalendarDays} add={() => open('activity')} className="monthly-planner" actions={!hideControls && <div className="month-controls">
    <button className="icon-button" aria-label="Previous month" onClick={() => setDate(shiftMonth(date, -1))}><ChevronLeft size={16}/></button>
    <label className="period-label month-label">{monthLabel(date)}<input type="month" aria-label="Select month and year" value={date.slice(0,7)} onChange={event => {if (/^\d{4}-\d{2}$/.test(event.target.value)) setDate(event.target.value+'-01')}} onClick={event => event.currentTarget.showPicker?.()}/></label><button className="icon-button" aria-label="Next month" onClick={() => setDate(shiftMonth(date, 1))}><ChevronRight size={16}/></button>
  </div>}>{showFilter && <label className="monthly-filter"><span className="sr-only">Filter activities</span><input type="search" placeholder="Filter activities" value={filter} onChange={event => setFilter(event.target.value)}/></label>}<HabitMatrix items={activities} days={days} monthly/></Panel>
}