import TriStateCheckbox from '../tasks/TriStateCheckbox'
export default function MobileStatsCards({stats}) {
  return <div className="mobile-stats">
    {[['DONE','Done',stats.done],['MISSED','Missed',stats.missed],['PENDING','Pending',stats.pending]].map(([status,label,count]) => <div key={status} className={'panel stat-'+status.toLowerCase()}>
      <TriStateCheckbox status={status}/><strong>{count}</strong><span>{label}</span>
    </div>)}
  </div>
}