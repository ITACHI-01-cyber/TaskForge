export const today = () => dateKey(new Date())
export function dateKey(date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map((n, i) => i ? String(n).padStart(2, '0') : String(n).padStart(4, '0')).join('-')
}
export const parseDate = key => new Date(key + 'T12:00:00')
export function shift(key, days) {
  const date = parseDate(key)
  date.setDate(date.getDate() + days)
  return dateKey(date)
}
export function shiftMonth(key, months) {
  const date = parseDate(key)
  date.setMonth(date.getMonth() + months, 1)
  return dateKey(date)
}
export const formatDate = (key, options) => parseDate(key).toLocaleDateString('en-US', options)
export function weekDays(key) {
  const monday = shift(key, -((parseDate(key).getDay() + 6) % 7))
  return Array.from({length: 7}, (_, i) => shift(monday, i))
}
export function monthDays(key) {
  const date = parseDate(key)
  date.setMonth(date.getMonth() + 1, 0)
  const count = date.getDate()
  return Array.from({length: count}, (_, i) => key.slice(0, 7) + '-' + String(i + 1).padStart(2, '0'))
}
export const monthLabel = key => formatDate(key, {month: 'long', year: 'numeric'})
export const quarter = key => 'Q' + Math.ceil(Number(key.slice(5, 7)) / 3)
export const validDate = key => typeof key === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(key) && !Number.isNaN(+parseDate(key)) && dateKey(parseDate(key)) === key