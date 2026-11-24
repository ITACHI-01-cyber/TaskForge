import { useMobile } from '../hooks/useMobile'
import MobileMonthlyPlanner from '../components/mobile/MobileMonthlyPlanner'
import PageHeading from '../components/layout/PageHeading'
import HabitTracker from '../components/habits/HabitTracker'
import MonthlyPlanner from '../components/planners/MonthlyPlanner'
import QuarterlyGoals from '../components/planners/QuarterlyGoals'
import AnnualGoals from '../components/planners/AnnualGoals'
import NotesPanel from '../components/planners/NotesPanel'
import { HistoryChart, ProductivityDetails, ProgressOverview, WeeklyAnalytics } from '../components/analytics/AnalyticsCharts'
export const Habits = () => <div className="page-stack"><PageHeading title="Habits"/><HabitTracker expanded/></div>
export function Monthly() {
  const mobile = useMobile()
  return mobile ? <MobileMonthlyPlanner/> : <div className="page-stack"><PageHeading title="Monthly" step="month"/><div className="planner-grid"><MonthlyPlanner showFilter/><ProgressOverview/></div></div>
}
export const Quarterly = () => <div className="page-stack"><PageHeading title="Quarterly" step="quarter"/><QuarterlyGoals/></div>
export const Yearly = () => <div className="page-stack"><PageHeading title="Yearly" step="year"/><AnnualGoals/></div>
export const Notes = () => <div className="page-stack"><PageHeading title="Notes and Reminders" dateControls={false}/><NotesPanel/></div>
export const Analytics = () => <div className="page-stack"><PageHeading title="Analytics" step="month"/><WeeklyAnalytics expanded/><HistoryChart/><ProductivityDetails/></div>