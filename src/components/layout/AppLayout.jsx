import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import useReminders from '../../hooks/useReminders'
import { useTasks } from '../../hooks/useTasks'
import MobileBottomNav from '../mobile/MobileBottomNav'
import WorkspaceSearch from './WorkspaceSearch'
import Header from './Header'
import Sidebar from './Sidebar'
import TaskModal from '../tasks/TaskModal'
export default function AppLayout() {
  const [visible, setVisible] = useState(false)
  const {items, storageError, retrySave, editor, hasUnsavedChanges, toast, undo, canUndo, searching, setSearching} = useTasks()
  useReminders(items)
  useEffect(() => {
    function keys(event) {
      if (event.key === 'Escape') setVisible(false)
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && !editor) {
        event.preventDefault()
        setSearching(true)
      }
    }
    window.addEventListener('keydown',keys)
    return () => window.removeEventListener('keydown',keys)
  }, [editor,setSearching])
  return <><Header visible={visible} toggle={() => setVisible(!visible)}/><div className="shell">
    <Sidebar visible={visible} close={() => setVisible(false)}/>
    <main className="main-content">{storageError && <p className="storage-error" role="alert">{storageError} {retrySave && <button className="secondary-button" onClick={retrySave}>Retry saving</button>}</p>}<Outlet/></main>
    <MobileBottomNav/>
    {!storageError && (toast || hasUnsavedChanges) && <div className="workspace-toast"><span role="status">{hasUnsavedChanges ? 'Saving changes…' : toast}</span>{canUndo && !hasUnsavedChanges && <button onClick={undo}>Undo</button>}</div>}
    {searching && <WorkspaceSearch close={() => setSearching(false)}/>}
    {editor && <TaskModal key={editor.id ?? editor.kind + editor.date} item={editor}/>}
  </div></>
}