import { Plus } from 'lucide-react'
export default function Panel({title, detail, icon: Icon, add, actions, className = '', children}) {
  return <section className={'panel widget ' + className}>
    <div className="panel-heading"><Icon size={19}/><h2>{title} {detail && <small>{detail}</small>}</h2><div className="panel-actions">{actions}{add && <button aria-label={'Add to ' + title} title={'Add to ' + title} className="icon-button" onClick={add}><Plus size={17}/></button>}</div></div>
    {children}
  </section>
}