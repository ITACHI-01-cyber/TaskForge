import { lazy, Suspense } from 'react'
import { Check } from 'lucide-react'
import './auth.css'

const HalftoneCat = lazy(() => import('./HalftoneCat'))

export default function AuthLayout({children}) {
  return <main className="auth-screen">
    <section className="auth-card" aria-labelledby="auth-title">
      <div className="auth-content">
        <div className="auth-brand"><Check size={22} strokeWidth={4}/><span>Task<b>Forge</b></span></div>
        {children}
      </div>
      <div className="auth-art"><Suspense fallback={null}><HalftoneCat/></Suspense></div>
    </section>
  </main>
}