import { useEffect } from 'react'
export default function useReminders(items) {
  useEffect(() => {
    function notify() {
      if (globalThis.Notification?.permission !== 'granted') return
      const now = Date.now()
      for (const item of items) {
        if (item.archivedAt || (item.kind === 'note' && item.status === 'DONE')) continue
        const scheduled = item.kind === 'task' ? item.reminder : item.kind === 'note' && item.hasReminder !== false && item.time ? item.date+'T'+item.time : ''
        if (!scheduled) continue
        const diff = now - new Date(scheduled).getTime()
        if (diff < 0 || diff > 60_000 || Number.isNaN(diff) || item.records[scheduled.slice(0,10)] === 'DONE') continue
        const key = 'taskforge.reminder.' + item.id + scheduled
        try {
          if (sessionStorage.getItem(key)) continue
          new Notification('TaskForge reminder',{body:item.title,tag:key})
          sessionStorage.setItem(key,'sent')
        } catch { /* The browser may disable notification construction. */ }
      }
    }
    notify()
    const timer = setInterval(notify,20_000)
    return () => clearInterval(timer)
  },[items])
}