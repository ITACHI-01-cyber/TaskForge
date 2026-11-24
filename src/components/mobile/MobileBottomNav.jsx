import { CalendarDays, ChartNoAxesCombined, House, ListTodo } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import ProfileAvatar from '../profile/ProfileAvatar'
const links = [['/dashboard','Home',House],['/tasks','Tasks',ListTodo],['/monthly','Calendar',CalendarDays],['/analytics','Analytics',ChartNoAxesCombined],['/profile','Profile',null]]
export default function MobileBottomNav() {
  const {user} = useAuth()
  const {pathname} = useLocation()
  return <nav className="mobile-bottom" aria-label="Quick navigation">
    {links.map(([to,label,Icon]) => <NavLink key={to} to={to} className={({isActive}) => isActive || (to === '/monthly' && pathname === '/calendar') ? 'active' : ''}>
      {Icon ? <Icon size={22}/> : <ProfileAvatar user={user}/>}<span>{label}</span>
    </NavLink>)}
  </nav>
}