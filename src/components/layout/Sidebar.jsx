import { CalendarDays, CalendarRange, ChartNoAxesCombined, ClipboardCheck, Clock, LayoutGrid, ListTodo, Settings, StickyNote, Target, Trophy, Database, UserRound, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useTasks } from '../../hooks/useTasks'
import { today } from '../../utils/dateUtils'
const groups = [
  [['/dashboard','Overview', LayoutGrid], ['/today','Today', ClipboardCheck], ['/upcoming','Upcoming', Clock], ['/calendar','Calendar', CalendarDays], ['/monthly','Monthly', CalendarRange], ['/quarterly','Quarterly', Target], ['/yearly','Yearly', Trophy]],
  [['/tasks','Tasks', ListTodo], ['/habits','Habits', ClipboardCheck], ['/analytics','Analytics', ChartNoAxesCombined], ['/notes','Notes', StickyNote], ['/profile','My Profile', UserRound]],
]
export default function Sidebar({visible, close}) {
  const {setDate, storageError} = useTasks()
  return <><button aria-label="Close navigation" className={'sidebar-shade ' + (visible ? 'shown' : '')} onClick={close}/>
    <aside id="sidebar" className={'sidebar ' + (visible ? 'shown' : '')}>
      <button className="icon-button mobile-close" onClick={close} aria-label="Close navigation"><X size={20}/></button>
      <nav aria-label="Workspace">{groups.map(group => <div className="nav-group" key={group[0][0]}>
        {group.map(([path, label, Icon]) => <NavLink end to={path} key={path} onClick={() => {if (path === '/today') setDate(today()); close()}}><Icon size={18}/>{label}</NavLink>)}
      </div>)}</nav>
      <div className="sidebar-bottom"><div className="storage-badge"><Database size={22}/><div><b>Cloud workspace</b><span>{storageError ? 'Storage needs attention' : 'MongoDB Atlas'}</span></div></div>
      <nav aria-label="Settings"><NavLink to="/settings" onClick={close}><Settings size={18}/>Settings</NavLink></nav></div>
    </aside>
  </>
}