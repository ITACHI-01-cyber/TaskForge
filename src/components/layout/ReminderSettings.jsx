import { useState } from 'react'
import { Bell } from 'lucide-react'
import Panel from './Panel'
export default function ReminderSettings() {
  const [permission,setPermission] = useState(() => globalThis.Notification?.permission ?? 'unsupported')
  return <Panel title="Browser reminders" icon={Bell}>
    <div className="settings-content">
      <p>Receive scheduled task and note reminders while TaskForge is open.</p>
      {permission === 'default' ? <div><button className="secondary-button" onClick={async () => {
        try {setPermission(await Notification.requestPermission())}
        catch {setPermission('unsupported')}
      }}>Enable notifications</button></div> : <p role="status">{permission === 'granted' ? 'Notifications enabled. Change this in your browser’s site settings.' : permission === 'denied' ? 'Notifications are blocked in your browser’s site settings.' : 'Notifications are unavailable in this browser.'}</p>}
    </div>
  </Panel>
}