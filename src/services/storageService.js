import { weekDays, quarter, validDate } from '../utils/dateUtils.js'
import { frequencies, priorities, states } from '../utils/statusUtils.js'

const legacyKey = 'taskforge.workspace.v1'
const kinds = ['task', 'routine', 'habit', 'activity', 'focus', 'quarter', 'annual', 'note']
const optional = (value,test) => value == null || value === '' || test(value)
const string = (value,max) => typeof value === 'string' && value.length <= max
const choices = (value,options) => optional(value, entry => options.includes(entry))
const strings = (value,max,length) => Array.isArray(value) && value.length <= max && value.every(entry => string(entry,length))
const steps = value => Array.isArray(value) && value.length <= 100 && value.every(entry => entry && string(entry.title,160) && typeof entry.done === 'boolean')
function validDetails(item) {
  return ['date','dueDate','endDate','archivedAt'].every(key => optional(item[key],validDate))
    && choices(item.priority,priorities) && choices(item.frequency,frequencies)
    && optional(item.weekdays, entry => Array.isArray(entry) && entry.length <= 7 && entry.every(day => Number.isInteger(day) && day >= 0 && day <= 6))
    && optional(item.tags, entry => strings(entry,25,300))
    && optional(item.linkedTasks, entry => strings(entry,500,120))
    && ['subtasks','milestones'].every(key => optional(item[key],steps))
    && optional(item.category, entry => string(entry,80))
    && optional(item.color, entry => typeof entry === 'string' && /^#[\da-f]{6}$/i.test(entry))
    && choices(item.icon,['target','book','water','activity','sparkles'])
    && optional(item.target, entry => Number.isInteger(entry) && entry >= 1 && entry <= 10000)
    && optional(item.progress, entry => Number.isInteger(entry) && entry >= 0 && entry <= 100)
    && ['pinned','hasReminder'].every(key => optional(item[key],entry => typeof entry === 'boolean'))
    && optional(item.time, entry => typeof entry === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(entry))
    && optional(item.reminder, entry => typeof entry === 'string' && validDate(entry.slice(0,10)) && /^T(?:[01]\d|2[0-3]):[0-5]\d$/.test(entry.slice(10)))
}
export function validate(data) {
  const ids = new Set()
  if (data?.version !== 1 || !Array.isArray(data.items)) throw new Error('Choose a TaskForge version 1 JSON export.')
  for (const item of data.items) {
    if (!item || typeof item.id !== 'string' || !item.id || ids.has(item.id) || !kinds.includes(item.kind) ||
        typeof item.title !== 'string' || !item.title.trim() || !validDate(item.date) || typeof item.body !== 'string' ||
        !validDetails(item) || !states.includes(item.status) || !item.records || typeof item.records !== 'object' || Array.isArray(item.records) ||
        Object.entries(item.records).some(([date, status]) => !validDate(date) || !states.includes(status))) {
      throw new Error('The export contains an invalid or duplicate record.')
    }
    ids.add(item.id)
  }
  return data
}
async function request(method, account, body) {
  const response = await fetch('/api/workspace', {method, cache:'no-store',
    headers:{'X-TaskForge-Account':account, ...(body && {'Content-Type':'application/json'})},
    ...(body && {body:JSON.stringify(body)})})
  const result = await response.json().catch(() => null)
  if (!response.ok || !result) {
    const error = new Error(result?.error ?? 'The TaskForge API is unavailable.')
    error.status = response.status
    error.workspace = result
    throw error
  }
  return result
}

function readLegacy() {
  try {
    const raw = localStorage.getItem(legacyKey)
    return raw === null ? null : validate(JSON.parse(raw))
  } catch {
    return null
  }
}

export const storageService = {
  readLegacy,
  save: (data, revision, account) => request('PUT', account, {data, revision}),
  async load(account) {
    const cloud = await request('GET', account)
    if (cloud.data) return cloud
    try {
      return await this.save({version:1, items:[]}, 0, account)
    } catch (error) {
      if (error.status === 409 && error.workspace?.data) return error.workspace
      throw error
    }
  },
}
export function inPeriod(item, date) {
  if (item.kind === 'focus') return weekDays(item.date)[0] === weekDays(date)[0]
  if (item.kind === 'quarter') return item.date.slice(0, 4) === date.slice(0, 4) && quarter(item.date) === quarter(date)
  if (item.kind === 'annual') return item.date.slice(0, 4) === date.slice(0, 4)
  return true
}