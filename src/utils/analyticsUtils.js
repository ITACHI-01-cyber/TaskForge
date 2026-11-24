import { monthDays, today, shift } from './dateUtils.js'
import { scheduled, statusOn } from './statusUtils.js'

export function countStatuses(values) {
  const done = values.filter(value => value === 'DONE').length
  const missed = values.filter(value => value === 'MISSED').length
  return {done, missed, pending:values.length - done - missed, total:values.length, rate:values.length ? Math.round(done / values.length * 100) : 0}
}
export function summarize(items, dates) {
  let done = 0
  let missed = 0
  let pending = 0
  let futurePending = 0
  const current = today()
  for (const date of dates) {
    for (const item of items) {
      if (!scheduled(item,date)) continue
      const status = statusOn(item,date)
      if (status === 'DONE') done++
      else if (status === 'MISSED') missed++
      else {
        pending++
        if (date > current) futurePending++
      }
    }
  }
  const total = done + missed + pending
  const denominator = total - futurePending
  return {done,missed,pending,total,rate:denominator ? Math.round(done / denominator * 100) : 0}
}
export const yearDays = key => Array.from({length:12}, (_, i) => monthDays(key.slice(0, 4) + '-' + String(i + 1).padStart(2, '0') + '-01')).flat()
export function streakStats(items, end = today()) {
  const current = today()
  const last = end > current ? current : end
  const completed = items.flatMap(item => Object.entries(item.records).filter(([date,status]) => date <= last && status === 'DONE').map(([date]) => date))
  if (!completed.length) return {current:0,longest:0}
  const first = completed.reduce((left,right) => right < left ? right : left)
  let running = 0
  let longest = 0
  let previous = 0
  for (let date = first; date <= last; date = shift(date, 1)) {
    const due = items.filter(item => scheduled(item,date))
    if (!due.length) continue
    previous = running
    running = due.some(item => statusOn(item,date) === 'DONE') ? running + 1 : 0
    longest = Math.max(longest, running)
  }
  const todayPending = last === current && items.some(item => scheduled(item,last))
    && items.filter(item => scheduled(item,last)).every(item => statusOn(item,last) === 'PENDING')
  return {current:todayPending ? previous : running, longest}
}
export const streak = (items, end) => streakStats(items, end).current
