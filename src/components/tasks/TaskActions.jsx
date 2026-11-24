import { useEffect, useRef } from 'react'
import { Ellipsis } from 'lucide-react'
import { useTasks } from '../../hooks/useTasks'
export default function TaskActions({item,occurrence,icon:Icon = Ellipsis}) {
  const {setEditor,duplicate,archive,move} = useTasks()
  const menu = useRef(null)
  useEffect(() => {
    const close = event => {if ((event.type === 'keydown' && event.key === 'Escape') || (event.type === 'pointerdown' && !menu.current?.contains(event.target))) menu.current?.removeAttribute('open')}
    document.addEventListener('pointerdown',close)
    document.addEventListener('keydown',close)
    const scroll = () => menu.current?.removeAttribute('open')
    window.addEventListener('scroll',scroll,true)
    return () => {document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',close);window.removeEventListener('scroll',scroll,true)}
  },[])
  function run(action) {
    menu.current.open = false
    action()
  }
  return <details className="task-actions" ref={menu} onToggle={event => {
    if (!event.currentTarget.open) return
    const anchor = event.currentTarget.querySelector('summary').getBoundingClientRect()
    const popup = event.currentTarget.querySelector('.task-menu')
    popup.style.left = Math.max(8,anchor.right-popup.offsetWidth)+'px'
    popup.style.top = (anchor.bottom+popup.offsetHeight < innerHeight-8 ? anchor.bottom : Math.max(8,anchor.top-popup.offsetHeight))+'px'
  }}>
    <summary aria-label={'Actions for '+item.title}><Icon size={17}/></summary>
    <div className="panel task-menu">
      <button onClick={() => run(() => setEditor({...item,occurrence}))}>Edit details</button>
      <button onClick={() => run(() => duplicate(item))}>Duplicate</button>
      <button onClick={() => run(() => archive(item))}>{item.archivedAt ? 'Restore' : 'Archive'}</button>
      <button onClick={() => run(() => move(item.id,-1,occurrence))}>Move up</button>
      <button onClick={() => run(() => move(item.id,1,occurrence))}>Move down</button>
      <button className="red" onClick={() => run(() => setEditor({...item,confirmDelete:true}))}>Delete…</button>
    </div>
  </details>
}