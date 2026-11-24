import { parseDate } from './dateUtils.js'

export const states = ['PENDING', 'DONE', 'MISSED']
export const priorities = ['Low', 'Medium', 'High', 'Urgent']
export const frequencies = ['None', 'Daily', 'Weekly', 'Monthly', 'Custom']
export const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const nextStatus = status => states[(states.indexOf(status) + 1) % states.length]
export const statusOn = (item, date) => item.records[date] ?? 'PENDING'

export function scheduled(item, date) {
  if (Object.hasOwn(item.records, date)) return true
  if (date < item.date || (item.endDate && date > item.endDate) || (item.archivedAt && date >= item.archivedAt)) return false
  const frequency = item.frequency ?? (item.kind === 'task' ? 'None' : 'Daily')
  if (frequency === 'None') return date === item.date
  if (frequency === 'Weekly') return parseDate(date).getDay() === parseDate(item.date).getDay()
  if (frequency === 'Monthly') return date.slice(-2) === item.date.slice(-2)
  if (frequency === 'Custom') return (item.weekdays ?? []).includes(parseDate(date).getDay())
  return true
}
export const activeTask = (item, date) => item.kind === 'task' && !item.archivedAt && scheduled(item, date)
export const priorityRank = item => priorities.indexOf(item.priority ?? 'Medium')
export function goalProgress(item, items = []) {
  const milestones = item.milestones ?? []
  if (milestones.length) return Math.round(milestones.filter(step => step.done).length * 100 / milestones.length)
  const linked = items.filter(task => task.kind === 'task' && item.linkedTasks?.includes(task.id))
  if (linked.length) return Math.round(linked.filter(task => Object.values(task.records).includes('DONE')).length * 100 / linked.length)
  return item.progress ?? (item.status === 'DONE' ? 100 : 0)
}