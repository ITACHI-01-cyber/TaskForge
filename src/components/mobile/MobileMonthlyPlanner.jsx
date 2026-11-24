import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTasks } from '../../hooks/useTasks'
import { monthLabel, shiftMonth, validDate } from '../../utils/dateUtils'
import MonthlyPlanner from '../planners/MonthlyPlanner'
import NotesPanel from '../planners/NotesPanel'
import { ProgressOverview } from '../analytics/AnalyticsCharts'

export default function MobileMonthlyPlanner() {
  const {date,setDate} = useTasks()
  return <div className="page-stack mobile-month">
    <div className="mobile-view-heading"><Link to="/dashboard" aria-label="Back to dashboard"><ChevronLeft/></Link><h1>Monthly Planner</h1></div>
    <div className="mobile-period">
      <button aria-label="Previous month" onClick={() => setDate(shiftMonth(date,-1))}><ChevronLeft size={20}/></button>
      <label className="period-label"><CalendarDays size={17}/>{monthLabel(date)}<input aria-label="Month and year" type="month" value={date.slice(0,7)} onClick={event => event.currentTarget.showPicker?.()} onChange={event => {const next=event.target.value+'-01';if (validDate(next)) setDate(next)}}/></label>
      <button aria-label="Next month" onClick={() => setDate(shiftMonth(date,1))}><ChevronRight size={20}/></button>
    </div>
    <ProgressOverview/>
    <MonthlyPlanner hideControls/>
    <NotesPanel compact/>
  </div>
}