import { Check, Minus, X } from 'lucide-react'
const icons = {DONE: Check, MISSED: X, PENDING: Minus}
const labels = {DONE: 'Completed', MISSED: 'Missed', PENDING: 'Pending'}
export default function TriStateCheckbox({status = 'PENDING', label, onClick}) {
  const Icon = icons[status]
  const title = label ? label + ' · ' + labels[status] : labels[status]
  const content = <Icon size={13} strokeWidth={3.5} aria-hidden="true"/>
  const className = 'state state-' + status.toLowerCase()
  return onClick ? <button type="button" className={className} onClick={onClick} title={title} aria-label={title}>{content}</button>
    : <span className={className} title={title} aria-label={title}>{content}</span>
}