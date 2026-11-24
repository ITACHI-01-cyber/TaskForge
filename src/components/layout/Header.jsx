import { NavLink } from 'react-router-dom'
import { Bell, Check, House, Menu } from 'lucide-react'
import ProfileDropdown from '../profile/ProfileDropdown'
export default function Header({toggle, visible}) {
  return <header className="topbar">
    <button className="icon-button menu-toggle" onClick={toggle} aria-label="Toggle navigation" aria-expanded={visible} aria-controls="sidebar"><Menu size={23}/></button>
    <NavLink to="/dashboard" className="brand" aria-label="TaskForge dashboard"><Check size={28} strokeWidth={4}/><span>Task<b>Forge</b></span></NavLink>
    <nav className="top-nav" aria-label="Main navigation"><NavLink end to="/dashboard"><House size={19}/>Dashboard</NavLink></nav>
    <div className="header-tools">
      <NavLink className="icon-button notifications" to="/notes" aria-label="Notes and reminders"><Bell size={20}/></NavLink>
      <ProfileDropdown/>
    </div>
  </header>
}