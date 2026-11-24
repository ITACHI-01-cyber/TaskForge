export default function ProgressRing({rate, caption, detail, color = 'var(--gold)'}) {
  return <div className="progress-ring" style={{'--rate': (rate ?? 0) + '%', '--ring-color': color}} role="img" aria-label={rate == null ? 'No tracked entries' : rate + '% ' + caption}>
    <div><strong>{rate == null ? '—' : rate + '%'}</strong>{detail && <b>{detail}</b>}<small>{caption}</small></div>
  </div>
}