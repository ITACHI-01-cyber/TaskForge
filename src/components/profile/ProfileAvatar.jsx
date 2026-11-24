import { useState } from 'react'
export default function ProfileAvatar({user, large = false}) {
  const [failed, setFailed] = useState('')
  const words = user?.name?.trim().split(/\s+/) ?? []
  const initials = (words.length > 1 ? words[0][0] + words.at(-1)[0] : words[0]?.slice(0,2) || 'TF').toUpperCase()
  const url = user?.profileImageUrl
  return <span className={'avatar profile-avatar' + (large ? ' profile-avatar-large' : '')} aria-hidden="true">
    {url && url !== failed ? <img src={url} alt="" onError={() => setFailed(url)}/> : initials}
  </span>
}