import { useEffect, useState } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { profileService } from '../../services/profileService'

const formats = ['image/jpeg','image/png','image/webp']
export default function AvatarUploader({user, onUpdate}) {
  const [source, setSource] = useState('')
  const [dimensions, setDimensions] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [x, setX] = useState(50)
  const [y, setY] = useState(50)
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState('')
  useEffect(() => () => {if (source) URL.revokeObjectURL(source)}, [source])
  function select(event) {
    const file = event.target.files[0]
    event.target.value = ''
    if (!file) return
    setError('')
    if (!formats.includes(file.type) || file.size > 5 * 1024 * 1024) return setError('Choose a JPG, PNG, or WebP image up to 5 MB.')
    setDimensions(null)
    setZoom(1)
    setX(50)
    setY(50)
    setSource(URL.createObjectURL(file))
  }
  const crop = dimensions && (() => {
    const {naturalWidth:width,naturalHeight:height} = dimensions
    const size = Math.min(width,height) / zoom
    return {width,height,size,left:(width-size)*x/100,top:(height-size)*y/100}
  })()
  async function action(remove = false) {
    setBusy(true)
    setError('')
    try {
      if (remove) onUpdate(await profileService.remove())
      else {
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = 256
        canvas.getContext('2d').drawImage(dimensions,crop.left,crop.top,crop.size,crop.size,0,0,256,256)
        onUpdate(await profileService.upload(canvas.toDataURL('image/webp',.9).split(',')[1]))
      }
      setSource('')
      setDimensions(null)
    } catch (error) {setError(error.message)}
    finally {setBusy(false)}
  }
  return <div className="profile-upload">
    <div className="profile-buttons">
      <label className="secondary-button avatar-file"><ImagePlus size={17}/>{user.profileImageUrl ? 'Change picture' : 'Choose picture'}<input type="file" accept={formats.join(',')} onChange={select} disabled={busy}/></label>
      {user.profileImageUrl && <button className="secondary-button" disabled={busy} onClick={() => action(true)}><Trash2 size={16}/>Remove picture</button>}
    </div>
    {source && <div className="avatar-crop">
      <img hidden src={source} alt="" onLoad={event => setDimensions(event.currentTarget)} onError={() => {setSource('');setError('This picture could not be opened.')}}/>
      {crop && <>
        <div className="crop-preview" role="img" aria-label="Circular picture preview" style={{backgroundImage:'url('+source+')',backgroundSize:(crop.width/crop.size*100)+'% '+(crop.height/crop.size*100)+'%',backgroundPosition:x+'% '+y+'%'}}/>
        <div className="crop-controls">
          <label>Zoom<input type="range" min="1" max="3" step=".05" value={zoom} onChange={event => setZoom(+event.target.value)}/></label>
          <label>Horizontal position<input type="range" min="0" max="100" value={x} onChange={event => setX(+event.target.value)}/></label>
          <label>Vertical position<input type="range" min="0" max="100" value={y} onChange={event => setY(+event.target.value)}/></label>
          <button className="gold-button" disabled={busy} onClick={() => action()}>{busy ? 'Saving…' : 'Save picture'}</button>
          <button className="secondary-button" disabled={busy} onClick={() => {setSource('');setDimensions(null)}}>Cancel crop</button>
        </div>
      </>}
    </div>}
    {error && <p role="alert" className="storage-error">{error}</p>}
  </div>
}