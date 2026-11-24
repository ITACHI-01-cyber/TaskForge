import { useMobile } from '../hooks/useMobile'
import MobileDashboard from '../components/mobile/MobileDashboard'
import { Target } from 'lucide-react'
import PageHeading from '../components/layout/PageHeading'
import WeeklyTaskBoard from '../components/tasks/WeeklyTaskBoard'
import TriStateCheckbox from '../components/tasks/TriStateCheckbox'
import DailyTracker from '../components/planners/DailyTracker'
import HabitTracker from '../components/habits/HabitTracker'
import MonthlyPlanner from '../components/planners/MonthlyPlanner'
import GoalPanel from '../components/planners/GoalPanel'
import QuarterlyGoals from '../components/planners/QuarterlyGoals'
import AnnualGoals from '../components/planners/AnnualGoals'
import NotesPanel from '../components/planners/NotesPanel'
import { WeeklyAnalytics, ProgressOverview } from '../components/analytics/AnalyticsCharts'
export default function Dashboard() {
  const mobile = useMobile()
  if (mobile) return <MobileDashboard/>
  return <div className="dashboard">
    <PageHeading title="To-Do Dashboard" subtitle="Plan • Track • Complete • Repeat" add/>
    <WeeklyTaskBoard/>
    <div className="middle-grid"><DailyTracker/><HabitTracker/><GoalPanel kind="focus" title="Weekly Focus" icon={Target}/><WeeklyAnalytics/></div>
    <div className="planner-grid"><MonthlyPlanner/><ProgressOverview/></div>
    <div className="goals-grid"><QuarterlyGoals/><AnnualGoals/><NotesPanel compact/></div>
    <div className="legend"><strong>Legend</strong><span><TriStateCheckbox status="DONE"/>Completed</span><span><TriStateCheckbox status="MISSED"/>Missed</span><span><TriStateCheckbox status="PENDING"/>Pending</span></div>
  </div>
}