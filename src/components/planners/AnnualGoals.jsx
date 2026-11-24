import { Trophy } from 'lucide-react'
import { useTasks } from '../../hooks/useTasks'
import GoalPanel from './GoalPanel'
export default function AnnualGoals() {
  const {date} = useTasks()
  return <GoalPanel kind="annual" title="Annual Goals" detail={'(' + date.slice(0, 4) + ')'} icon={Trophy}/>
}