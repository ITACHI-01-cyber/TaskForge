import { CalendarDays } from 'lucide-react'
import { useTasks } from '../../hooks/useTasks'
import { useHabits } from '../../hooks/useHabits'
import { weekDays } from '../../utils/dateUtils'
import { scheduled } from '../../utils/statusUtils'
import Panel from '../layout/Panel'
import HabitMatrix from './HabitMatrix'
export default function HabitTracker({expanded = false, anchor}) {
  const {date, open} = useTasks()
  const days = weekDays(anchor ?? date)
  const habits = useHabits().filter(item => days.some(day => scheduled(item,day)))
  return <Panel title="Habit Tracker" detail="(Selected week)" icon={CalendarDays} add={() => open('habit',anchor ?? date)}>
    <HabitMatrix items={habits} days={days} showStats={expanded}/>
  </Panel>
}