import { lazy, Suspense } from 'react'
import { BarChart3, Target } from 'lucide-react'
import Panel from '../layout/Panel'

const loadCharts = () => import('./ChartPanels')
const Weekly = lazy(() => loadCharts().then(module => ({default:module.WeeklyAnalytics})))
const Monthly = lazy(() => loadCharts().then(module => ({default:module.ProgressOverview})))
const History = lazy(() => loadCharts().then(module => ({default:module.HistoryChart})))

export function WeeklyAnalytics(props) {
  return <Suspense fallback={<Panel title="Analytics" icon={BarChart3}><div className={props.expanded ? 'history-chart' : 'weekly-chart'}/></Panel>}><Weekly {...props}/></Suspense>
}
export function ProgressOverview() {
  return <Suspense fallback={<Panel title="Progress Overview" icon={Target}><div className="weekly-chart"/></Panel>}><Monthly/></Suspense>
}
export function HistoryChart() {
  return <Suspense fallback={<Panel title="Monthly History" icon={BarChart3}><div className="history-chart"/></Panel>}><History/></Suspense>
}
const Details = lazy(() => import('./ProductivityDetails'))
export function ProductivityDetails() {
  return <Suspense fallback={<Panel title="Productivity Breakdown" icon={BarChart3}><div className="workspace-skeleton" role="status" aria-label="Loading analytics"/></Panel>}><Details/></Suspense>
}