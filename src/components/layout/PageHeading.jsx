import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useTasks } from '../../hooks/useTasks'
import { formatDate, shift, shiftMonth, today, validDate } from '../../utils/dateUtils'
export default function PageHeading({title, subtitle, step = 'week', add = false, dateControls = true}) {
  const {date, setDate, open} = useTasks()
  const move = direction => {
    const next = step === 'day' ? shift(date, direction) : step === 'week' ? shift(date, 7 * direction)
      : shiftMonth(date, direction * ({month:1, quarter:3, year:12}[step] ?? 1))
    if (validDate(next)) setDate(next)
  }
  return <div className="page-heading">
    <div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
    <div className="page-controls">
      {dateControls && <><label className="date-picker"><CalendarDays size={17}/><span>{formatDate(date, {weekday:'short', month:'short', day:'numeric', year:'numeric'})}</span><input aria-label="Selected date" type="date" min="0001-01-01" max="9999-12-31" value={date} onChange={event => {if (validDate(event.target.value)) setDate(event.target.value)}} onClick={event => event.currentTarget.showPicker?.()}/></label>
      <div className="date-arrows"><button className="icon-button" aria-label={'Previous ' + step} onClick={() => move(-1)}><ChevronLeft size={19}/></button><button className="icon-button" aria-label={'Next ' + step} onClick={() => move(1)}><ChevronRight size={19}/></button></div></>}
      {dateControls && step === 'week' && <button className="secondary-button current-week" onClick={() => setDate(today())}>This week</button>}
      {add && <button className="gold-button" onClick={() => open('task')}><Plus size={19}/>Add Task</button>}
    </div>
  </div>
}