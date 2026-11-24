import { Pencil } from 'lucide-react'
import ProfileAvatar from './ProfileAvatar'
export default function ProfileHeader({user, edit}) {
  return <section className="panel profile-hero">
    <ProfileAvatar user={user} large/>
    <div><h1>{user.name}</h1><p>{user.email}</p>
      {user.createdAt && <p>Member since {new Date(user.createdAt).toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric'})}</p>}</div>
    <button className="gold-button" onClick={edit}><Pencil size={16}/>Edit Profile</button>
  </section>
}