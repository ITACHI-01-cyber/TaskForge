function cell(value) {
  let text = String(value ?? '')
  if (/^[\s]*[=+\-@]/.test(text)) text = "'" + text
  return '"' + text.replaceAll('"','""') + '"'
}
export function workspaceCsv(items) {
  const rows = [['Kind','Title','Description','Start date','Due date','Time','Priority','Category','Tags','Status date','Status']]
  for (const item of items) {
    const records = Object.entries(item.records).sort(([a],[b]) => a.localeCompare(b))
    for (const [date,status] of records.length ? records : [['',item.status]]) {
      rows.push([item.kind,item.title,item.body,item.date,item.dueDate,item.time,item.priority,item.category,item.tags?.join(', '),date,status])
    }
  }
  return rows.map(row => row.map(cell).join(',')).join('\r\n')
}