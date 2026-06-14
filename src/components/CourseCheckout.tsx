'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Loader2, CheckCircle2, AlertCircle, ArrowRight, Lock } from 'lucide-react'

// Carga diferida: el SDK de wallet solo se descarga cuando se muestra la caja de pago
const CourseBuyBox = dynamic(() => import('@/components/CourseBuyBox').then(m => m.CourseBuyBox), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin text-amber-400" size={22} /></div>,
})

interface Props {
  courseId: string
  courseTitle: string
  price: number
  freeForPlan: boolean
}

type Step = 'loading' | 'register' | 'buy' | 'has-access'

export function CourseCheckout({ courseId, courseTitle, price, freeForPlan }: Props) {
  const [step, setStep] = useState<Step>('loading')
  const [reg, setReg] = useState({ fullName: '', email: '', password: '', confirmPassword: '', acceptTerms: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { checkAuth() }, [])

  async function checkAuth() {
    try {
      const me = await fetch('/api/auth/me')
      if (!me.ok) { setStep('register'); return }
      const c = await fetch(`/api/courses/${courseId}`)
      if (c.ok) {
        const d = await c.json()
        setStep(d.hasAccess ? 'has-access' : 'buy')
      } else setStep('buy')
    } catch { setStep('register') }
  }

  async function doRegister() {
    if (!reg.fullName.trim() || !reg.email.trim() || !reg.password) { setError('Completá todos los campos'); return }
    if (reg.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    if (reg.password !== reg.confirmPassword) { setError('Las contraseñas no coinciden'); return }
    if (!reg.acceptTerms) { setError('Tenés que aceptar los términos'); return }
    setLoading(true); setError(null)
    try {
      const r = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...reg, turnstileToken: '' }),
      })
      const d = await r.json()
      if (!r.ok) { setError(d.error || 'Error al crear la cuenta'); return }
      setStep('buy') // cuenta creada + sesión iniciada → a pagar
    } catch { setError('Error de conexión') } finally { setLoading(false) }
  }

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-amber-500/50'

  if (step === 'loading') return (
    <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin text-amber-400" size={24} /></div>
  )

  if (step === 'has-access') return (
    <div className="text-center">
      <CheckCircle2 size={28} className="mx-auto text-green-400 mb-2" />
      <p className="text-sm font-bold text-white mb-3">Ya tenés acceso a este curso</p>
      <a href={`/dashboard/cursos/${courseId}`} className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-black text-black" style={{ background: 'linear-gradient(135deg,#B45309,#D97706,#FFD700)' }}>
        Entrar al curso <ArrowRight size={15} />
      </a>
    </div>
  )

  if (step === 'buy') return (
    <CourseBuyBox courseId={courseId} courseTitle={courseTitle} price={price} onPurchased={() => { window.location.href = `/dashboard/cursos/${courseId}` }} />
  )

  // step === 'register'
  return (
    <div>
      <p className="text-3xl font-black text-white">${price.toFixed(2)} <span className="text-sm text-white/30 font-normal">USDT</span></p>
      <p className="text-xs text-white/40 mt-1 mb-4">Creá tu cuenta y obtené el curso al instante.</p>

      {error && <div className="mb-3 p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-2 text-red-400 text-xs"><AlertCircle size={14} className="shrink-0" /><p className="flex-1">{error}</p></div>}

      <div className="space-y-2.5">
        <input className={inputCls} placeholder="Nombre completo" value={reg.fullName} onChange={e => setReg(r => ({ ...r, fullName: e.target.value }))} autoComplete="name" />
        <input className={inputCls} placeholder="Correo electrónico" type="email" value={reg.email} onChange={e => setReg(r => ({ ...r, email: e.target.value }))} autoComplete="email" />
        <input className={inputCls} placeholder="Contraseña" type="password" value={reg.password} onChange={e => setReg(r => ({ ...r, password: e.target.value }))} autoComplete="new-password" />
        <input className={inputCls} placeholder="Repetir contraseña" type="password" value={reg.confirmPassword} onChange={e => setReg(r => ({ ...r, confirmPassword: e.target.value }))} autoComplete="new-password" />
        <label className="flex items-start gap-2 text-[11px] text-white/40 cursor-pointer pt-1">
          <input type="checkbox" checked={reg.acceptTerms} onChange={e => setReg(r => ({ ...r, acceptTerms: e.target.checked }))} className="mt-0.5 accent-amber-500" />
          Acepto los <a href="/terms" target="_blank" className="text-amber-400 underline">Términos</a> y la <a href="/privacy" target="_blank" className="text-amber-400 underline">Privacidad</a>
        </label>
        <button onClick={doRegister} disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black text-black disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#B45309,#D97706,#FFD700)' }}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <>Crear cuenta y continuar <ArrowRight size={15} /></>}
        </button>
        <p className="text-[10px] text-white/25 text-center flex items-center justify-center gap-1"><Lock size={10} /> Pago con USDT (BEP-20) o comprobante</p>
        {freeForPlan && <p className="text-[11px] text-amber-300/80 text-center">💡 Gratis si ya tenés un plan activo (iniciá sesión).</p>}
      </div>
    </div>
  )
}
