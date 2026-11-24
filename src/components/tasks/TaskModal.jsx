import { useEffect, useRef, useState } from 'react'
import { Trash2, X, Plus } from 'lucide-react'
import { useTasks } from '../../hooks/useTasks'
import { dayLabels, frequencies, priorities, states, goalProgress, scheduled, statusOn } from '../../utils/statusUtils'
export const kindLabels = {task:'Task', routine:'Routine', habit:'Habit', activity:'Activity', focus:'Priority', quarter:'Quarterly goal', annual:'Annual goal', note:'Note'}

function Steps({title, steps, onChange}) {
  return <fieldset className="editor-steps"><legend>{title}</legend>
    {steps.map((step,index) => <div className="editor-step" key={index}>
      <input type="checkbox" aria-label={'Complete step '+(index+1)} checked={step.done} onChange={event => onChange(steps.map((entry,i) => i === index ? {...entry,done:event.target.checked} : entry))}/>
      <input aria-label={title+' '+(index+1)} maxLength={160} value={step.title} onChange={event => onChange(steps.map((entry,i) => i === index ? {...entry,title:event.target.value} : entry))}/>
      <button type="button" aria-label={'Remove step '+(index+1)} className="icon-button" onClick={() => onChange(steps.filter((_,i) => i !== index))}><X size={16}/></button>
    </div>)}
    <button type="button" className="secondary-button" disabled={steps.length >= 100} onClick={() => onChange([...steps,{title:'',done:false}])}><Plus size={15}/>Add step</button>
  </fieldset>
}
export default function TaskModal({item}) {
  const {save,remove,setEditor,items,move} = useTasks()
  const dialog = useRef(null)
  const [draft,setDraft] = useState(item)
  const [confirm,setConfirm] = useState(!!item.confirmDelete)
  const [error,setError] = useState('')
  const task = item.kind === 'task'
  const note = item.kind === 'note'
  const goal = ['quarter','annual','focus'].includes(item.kind)
  const recurring = ['task','habit','routine','activity'].includes(item.kind)
  const habit = item.kind === 'habit'
  const hasReminder = draft.hasReminder ?? !!item.id
  const [occurrence,setOccurrence] = useState(item.occurrence ?? item.date)
  const [occurrenceStatus,setOccurrenceStatus] = useState('')
  const frequency = draft.frequency ?? (task ? 'None' : 'Daily')
  const set = (field,value) => setDraft(previous => ({...previous,[field]:value}))
  const close = () => setEditor(null)
  useEffect(() => {dialog.current.showModal()},[])
  function submit(event) {
    event.preventDefault()
    if (!draft.title.trim()) return setError('Enter a title.')
    if (task && draft.dueDate && draft.dueDate < draft.date) return setError('Due date must be on or after the start date.')
    if (recurring && draft.endDate && draft.endDate < draft.date) return setError('End date must be on or after the start date.')
    if (recurring && frequency === 'Custom' && !draft.weekdays?.length) return setError('Choose at least one weekday.')
    const fields = {...draft,title:draft.title.trim(),body:draft.body.trim()}
    delete fields.confirmDelete
    delete fields.records
    delete fields.occurrence
    if (recurring) fields.frequency = frequency
    if (note) fields.hasReminder = hasReminder
    if (task) fields.tags = [...new Set((typeof draft.tags === 'string' ? draft.tags.split(',') : draft.tags ?? []).map(tag => tag.trim()).filter(Boolean))].slice(0,25)
    for (const name of ['subtasks','milestones']) if (fields[name]) fields[name] = fields[name].filter(step => step.title.trim()).map(step => ({...step,title:step.title.trim()}))
    const recordDay = item.id ? occurrence : draft.date
    if (occurrenceStatus && !scheduled({...fields,records:item.records ?? {}},recordDay)) return setError('Choose a scheduled date for this status.')
    save(fields,recordDay,occurrenceStatus)
  }
  const field = (name,label,type = 'text',props = {}) => <label>{label}<input type={type} value={draft[name] ?? ''} {...props} onChange={event => set(name,type === 'number' ? (event.target.value === '' ? '' : +event.target.value) : event.target.value)}/></label>
  return <dialog aria-labelledby="task-editor-title" className="editor panel advanced-editor" ref={dialog} onCancel={event => {event.preventDefault();close()}} onClick={event => {if (event.target === dialog.current) close()}}>
    <form onSubmit={submit}>
      <div className="dialog-heading"><h2 id="task-editor-title">{confirm ? 'Delete ' : item.id ? 'Edit ' : 'New '}{kindLabels[item.kind].toLowerCase()}</h2><button type="button" className="icon-button" aria-label="Close" onClick={close}><X size={20}/></button></div>
      {confirm ? <><p>Delete “{item.title}” and its tracking history?</p><div className="dialog-actions">
        <button type="button" className="secondary-button" onClick={() => setConfirm(false)}>Cancel</button>
        <button type="button" className="danger" onClick={() => remove(item.id)}><Trash2 size={16}/>Confirm delete</button></div></> : <>
        {field('title',habit ? 'Habit name' : 'Title','text',{required:true,autoFocus:true,maxLength:120})}
        <label>{note ? 'Note' : 'Description'}<textarea rows={2} maxLength={3000} value={draft.body} onChange={event => set('body',event.target.value)}/></label>
        <div className="editor-grid">
          {(!note || hasReminder) && field('date',recurring ? 'Start date' : note ? 'Reminder date' : 'Target date','date',{required:true,min:'0001-01-01',max:'9999-12-31'})}
          {task && field('dueDate','Due date','date',{min:draft.date,max:'9999-12-31'})}
          {(task || (note && hasReminder) || item.kind === 'routine') && field('time',task ? 'Due time' : note ? 'Reminder time' : 'Routine time','time')}
          {(task || note || goal) && <label>Priority<select aria-label="Priority" value={draft.priority ?? 'Medium'} onChange={event => set('priority',event.target.value)}>{priorities.map(priority => <option key={priority}>{priority}</option>)}</select></label>}
          {task && field('category','Category','text',{maxLength:80})}
          {task && <label>Tags (comma-separated)<input value={Array.isArray(draft.tags) ? draft.tags.join(', ') : draft.tags ?? ''} maxLength={300} onChange={event => set('tags',event.target.value)}/></label>}
          {task && field('reminder','Reminder','datetime-local')}
          {recurring && <label>{task ? 'Recurrence' : 'Frequency'}<select aria-label={task ? 'Recurrence' : 'Frequency'} value={frequency} onChange={event => set('frequency',event.target.value)}>{frequencies.map(option => <option key={option}>{option}</option>)}</select></label>}
          {recurring && frequency !== 'None' && field('endDate','End date','date',{min:draft.date,max:'9999-12-31'})}
          {habit && field('target','Daily target','number',{min:1,max:10000})}
          {habit && <label>Icon<select value={draft.icon ?? 'target'} onChange={event => set('icon',event.target.value)}><option value="target">Target</option><option value="book">Book</option><option value="water">Water</option><option value="activity">Activity</option><option value="sparkles">Sparkles</option></select></label>}
          {habit && <label>Color<input type="color" value={draft.color ?? '#f6c667'} onChange={event => set('color',event.target.value)}/></label>}
          {task && item.id && <label>Status date<input type="date" min="0001-01-01" max="9999-12-31" value={occurrence} required onChange={event => {setOccurrence(event.target.value);setOccurrenceStatus('')}}/></label>}
          {task && <label>Task status<select aria-label="Task status" value={occurrenceStatus || statusOn({records:item.records ?? {}},occurrence)} onChange={event => setOccurrenceStatus(event.target.value)}>{states.map(status => <option key={status}>{status}</option>)}</select></label>}
          {(goal || note) && <label>Status<select value={draft.status ?? 'PENDING'} onChange={event => set('status',event.target.value)}>{states.map(status => <option key={status}>{status}</option>)}</select></label>}
        </div>
        {recurring && frequency === 'Custom' && <fieldset className="editor-weekdays"><legend>Scheduled weekdays</legend>{dayLabels.map((label,index) => <label key={label}><input type="checkbox" checked={draft.weekdays?.includes(index) ?? false} onChange={event => set('weekdays',event.target.checked ? [...(draft.weekdays ?? []),index] : draft.weekdays.filter(day => day !== index))}/>{label}</label>)}</fieldset>}
        {note && <label className="inline-check"><input type="checkbox" checked={hasReminder} onChange={event => set('hasReminder',event.target.checked)}/>Schedule reminder</label>}
        {note && <label className="inline-check"><input type="checkbox" checked={!!draft.pinned} onChange={event => set('pinned',event.target.checked)}/>Pin note</label>}
        {task && <Steps title="Subtasks" steps={draft.subtasks ?? []} onChange={value => set('subtasks',value)}/>}
        {goal && <>
          <Steps title="Milestones" steps={draft.milestones ?? []} onChange={value => set('milestones',value)}/>
          <label>Linked tasks<select multiple value={draft.linkedTasks ?? []} onChange={event => set('linkedTasks',Array.from(event.target.selectedOptions,option => option.value))}>{items.filter(entry => entry.kind === 'task' && !entry.archivedAt).map(entry => <option key={entry.id} value={entry.id}>{entry.title}</option>)}</select></label>
          {draft.milestones?.length || draft.linkedTasks?.length ? <p>Calculated progress {goalProgress(draft,items)}%</p> : field('progress','Progress (%)','number',{min:0,max:100})}
        </>}
        {item.id && item.kind === 'routine' && <div className="profile-buttons"><button className="secondary-button" type="button" onClick={() => move(item.id,-1)}>Move routine up</button><button className="secondary-button" type="button" onClick={() => move(item.id,1)}>Move routine down</button></div>}
        {error && <p role="alert" className="storage-error">{error}</p>}
        <div className="dialog-actions">
          {item.id && <button type="button" className="danger" onClick={() => setConfirm(true)}><Trash2 size={15}/>Delete</button>}
          <button type="button" className="secondary-button" onClick={close}>Cancel</button>
          <button className="gold-button" type="submit">Save {kindLabels[item.kind].toLowerCase()}</button>
        </div>
      </>}
    </form>
  </dialog>
}