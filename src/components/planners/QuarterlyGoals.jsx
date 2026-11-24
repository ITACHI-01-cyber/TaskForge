import { Target } from 'lucide-react'
import { useTasks } from '../../hooks/useTasks'
import { quarter } from '../../utils/dateUtils'
import GoalPanel from './GoalPanel'
export default function QuarterlyGoals() {
  const {date} = useTasks()
  return <GoalPanel kind="quarter" title="Quarterly Goals" detail={'(' + quarter(date) + ' ' + date.slice(0, 4) + ')'} icon={Target}/>
}