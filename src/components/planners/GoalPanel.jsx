import { useTasks } from '../../hooks/useTasks'
import { inPeriod } from '../../services/storageService'
import { goalProgress } from '../../utils/statusUtils'
import Panel from '../layout/Panel'
import TaskCard from '../tasks/TaskCard'
const emptyLabels = {focus:'Set your first weekly priority.',quarter:'Set your first quarterly goal.',annual:'Set your first annual goal.'}
export default function GoalPanel({kind, title, detail, icon}) {
  const {items, date, open} = useTasks()
  const goals = items.filter(item => item.kind === kind && inPeriod(item, date))
  return <Panel title={title} detail={detail} icon={icon} add={() => open(kind)}>
    {goals.map(item => <div className="goal-line" key={item.id}><TaskCard item={item}/><small aria-label="Goal progress">{goalProgress(item,items)}%</small></div>)}{!goals.length && <p className="empty">{emptyLabels[kind]}</p>}
  </Panel>
}