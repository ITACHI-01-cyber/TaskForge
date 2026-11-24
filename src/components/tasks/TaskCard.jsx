import { useTasks } from '../../hooks/useTasks'
import { statusOn } from '../../utils/statusUtils'
import TaskActions from './TaskActions'
import TriStateCheckbox from './TriStateCheckbox'
export default function TaskCard({item, date, number, actions}) {
  const {cycle, setEditor} = useTasks()
  return <div className="task-row">
    {number != null && <span className="row-number">{number}</span>}
    <TriStateCheckbox status={date ? statusOn(item, date) : item.status} label={item.title} onClick={() => cycle(item.id, date)}/>
    <button type="button" className="row-title" title={'Edit ' + item.title} onClick={() => setEditor(item.kind === 'task' ? {...item,occurrence:date} : item)}>{item.title}{item.kind === 'routine' && item.time && <small> · {item.time}</small>}</button>
    {actions && <TaskActions item={item} occurrence={date}/> }
  </div>
}