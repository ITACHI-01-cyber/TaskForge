import { BarChart3, Camera, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTasks } from '../hooks/useTasks'
import { monthDays, today } from '../utils/dateUtils'
import { streak, summarize } from '../utils/analyticsUtils'
import Panel from '../components/layout/Panel'
import ProfileHeader from '../components/profile/ProfileHeader'
import EditProfileModal from '../components/profile/EditProfileModal'
import AvatarUploader from '../components/profile/AvatarUploader'

export default function Profile() {
  const {user,setUser} = useAuth()
  const {items} = useTasks()
  const [editing,setEditing] = useState(false)
  const [notice,setNotice] = useState('')
  const current = today()
  const tasks = items.filter(item => item.kind === 'task')
  const habits = items.filter(item => item.kind === 'habit')
  const total = tasks.reduce((count,item) => count+Object.values(item.records).filter(status => status === 'DONE').length,0)
  const monthly = summarize([...tasks,...habits],monthDays(current).filter(day => day <= current))
  function update(next) {setUser(next);setNotice('Profile updated.')}
  return <div className="page-stack profile-page">
    <ProfileHeader user={user} edit={() => setEditing(true)}/>
    {notice && <p className="profile-notice" role="status">{notice}</p>}
    <div className="two-col">
      <Panel title="Personal Information" icon={UserRound}><dl className="profile-fields"><div><dt>Full name</dt><dd>{user.name}</dd></div><div><dt>Gmail address</dt><dd>{user.email}</dd></div></dl></Panel>
      <Panel title="Profile Picture" icon={Camera}><AvatarUploader user={user} onUpdate={update}/></Panel>
    </div>
    <Panel title="Productivity" icon={BarChart3}><dl className="profile-metrics">
      {[['Tasks completed',total],['Current streak',streak([...tasks,...habits])+' days'],['Total habits',habits.length],['Monthly completion',monthly.total ? monthly.rate+'%' : '—']].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
    </dl></Panel>
    {editing && <EditProfileModal user={user} onUpdate={update} close={() => setEditing(false)}/>}
  </div>
}