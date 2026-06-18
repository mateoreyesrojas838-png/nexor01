'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Zap, Sparkles, Crown, Check, ChevronRight, Loader2, X, ArrowRight, Layers, ShieldCheck } from 'lucide-react'
import { COUNTRIES } from '@/lib/countries'

const PERIODS = [
  { key: 'MONTHLY', label: 'Mensual', sub: '30 días' },
  { key: 'QUARTERLY', label: '3 meses', sub: '90 días' },
  { key: 'ANNUAL', label: 'Anual', sub: '365 días' },
] as const
type Period = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'

const PLAN_ICON: Record<string, React.ElementType> = { BASIC: Zap, PRO: Sparkles, ELITE: Crown }

export default function PublicPlanesPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('MONTHLY')
  const [logged, setLogged] = useState<boolean | null>(null)
  const [selected, setSelected] = useState<any>(null) // pack para el modal de registro
  const [reg, setReg] = useState({ fullName: '', email: '', password: '', confirmPassword: '', acceptTerms: false, countryName: 'Bolivia', dial: '+591', phone: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/plans').then(r => r.json()).then(d => setPlans(d.plans || [])).finally(() => setLoading(false))
    fetch('/api/auth/me').then(r => setLogged(r.ok)).catch(() => setLogged(false))
  }, [])

  const availablePeriods = (['MONTHLY', 'QUARTERLY', 'ANNUAL'] as Period[]).filter(p => plans.some(pl => (pl.prices?.[p] ?? 0) > 0))

  function goCheckout(plan: string) {
    router.push(`/dashboard/planes/checkout?plan=${plan}&period=${period}`)
  }

  function onBuy(pl: any) {
    if (logged) goCheckout(pl.plan)
    else { setSelected(pl); setError(null) }
  }

  async function doRegister() {
    if (!reg.fullName.trim() || !reg.email.trim() || !reg.password) { setError('Completá todos los campos'); return }
    if (!reg.phone.trim() || reg.phone.replace(/\D/g, '').length < 6) { setError('Ingresá un teléfono válido'); return }
    if (reg.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    if (reg.password !== reg.confirmPassword) { setError('Las contraseñas no coinciden'); return }
    if (!reg.acceptTerms) { setError('Tenés que aceptar los términos'); return }
    setBusy(true); setError(null)
    try {
      const r = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...reg, phone: `${reg.dial} ${reg.phone.trim()}`, country: reg.countryName, regSource: 'planes', turnstileToken: '' }) })
      const d = await r.json()
      if (!r.ok) { setError(d.error || 'Error al crear la cuenta'); return }
      goCheckout(selected.plan)
    } catch { setError('Error de conexión') } finally { setBusy(false) }
  }

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-amber-500/50'

  return (
    <div className="min-h-screen px-4 py-10" style={{ background: '#0B0B12' }}>
      <div className="max-w-5xl mx-auto pb-16">
        <Link href="/" className="text-xs text-white/30 hover:text-white/60">← Inicio</Link>

        <div className="text-center mb-10 mt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest mb-4" style={{ background: 'rgba(255,215,0,0.05)', borderColor: 'rgba(255,215,0,0.15)', color: 'rgba(255,215,0,0.6)' }}>
            <Layers size={9} /> Packs · Todo en uno
          </div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white mb-3">Elegí tu Plan</h1>
          <p className="text-sm text-white/40 max-w-md mx-auto">Combiná varios servicios en un solo pack y ahorrá. Creá tu cuenta y activá al instante.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-amber-400" size={28} /></div>
        ) : plans.length === 0 ? (
          <p className="text-center text-white/30 py-16">No hay planes disponibles por ahora.</p>
        ) : (
          <>
            {/* Selector de período */}
            {availablePeriods.length > 1 && (
              <div className="flex justify-center mb-8">
                <div className="inline-flex rounded-2xl p-1 border border-white/10 bg-white/[0.03]">
                  {PERIODS.filter(p => availablePeriods.includes(p.key as Period)).map(p => {
                    const active = period === p.key
                    return (
                      <button key={p.key} onClick={() => setPeriod(p.key as Period)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${active ? 'text-black' : 'text-white/40 hover:text-white/70'}`} style={active ? { background: 'linear-gradient(135deg,#D97706,#FFD700)' } : {}}>{p.label}</button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-5 items-start">
              {plans.map((pl, i) => {
                const Icon = PLAN_ICON[pl.plan] || Zap
                const price = pl.prices?.[period] ?? null
                const featured = i === 1
                const unavailable = price == null || price <= 0
                return (
                  <div key={pl.plan} className="relative flex flex-col rounded-3xl p-5" style={{ background: featured ? 'linear-gradient(160deg, rgba(255,215,0,0.07), rgba(11,11,18,0.95) 60%)' : 'rgba(255,255,255,0.02)', border: featured ? '1px solid rgba(255,215,0,0.35)' : '1px solid rgba(255,255,255,0.06)' }}>
                    {featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest text-black" style={{ background: 'linear-gradient(135deg,#D97706,#FFD700)' }}>Más popular</span>}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)' }}><Icon size={18} style={{ color: '#FFD700' }} /></div>
                      <div><p className="text-[11px] font-black uppercase tracking-widest" style={{ color: '#FFD700' }}>{pl.name}</p><p className="text-[10px] text-white/35">{pl.tagline}</p></div>
                    </div>
                    <div className="mb-4">
                      <span className="text-[40px] font-black leading-none text-white">{unavailable ? '—' : `$${price}`}</span>
                      <span className="text-sm text-white/30 ml-1">USDT</span>
                      <p className="text-[10px] text-white/20 mt-0.5">{PERIODS.find(p => p.key === period)?.sub} de acceso</p>
                    </div>
                    <div className="flex-1 space-y-2 mb-5">
                      {(pl.includedServices || []).map((s: any) => (
                        <div key={s.key} className="flex items-start gap-2">
                          <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(255,215,0,0.1)' }}><Check size={8} style={{ color: '#FFD700' }} /></div>
                          <div><p className="text-[11px] font-bold leading-snug" style={{ color: '#FBBF24' }}>{s.name}</p>{s.detail && <p className="text-[11px] text-white/50 leading-snug">{s.detail}</p>}</div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => onBuy(pl)} disabled={unavailable} className="w-full py-3 rounded-2xl text-sm font-black flex items-center justify-center gap-2 disabled:opacity-40" style={featured ? { background: 'linear-gradient(135deg,#B45309,#D97706,#FFD700)', color: '#000' } : { background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)', color: '#FFD700' }}>
                      {unavailable ? 'No disponible' : <>Adquirir <ChevronRight size={14} /></>}
                    </button>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal registro → checkout */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md my-8 rounded-2xl border border-amber-500/20 bg-[#0d0d15] p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1"><h2 className="font-black text-white">Creá tu cuenta</h2><button onClick={() => setSelected(null)} className="text-white/40 hover:text-white"><X size={18} /></button></div>
            <p className="text-xs text-white/40 mb-4">Para activar el <strong className="text-amber-300">{selected.name}</strong> primero creá tu cuenta. Después seguís al pago.</p>
            {error && <div className="mb-3 p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">{error}</div>}
            <div className="space-y-2.5">
              <input className={inputCls} placeholder="Nombre completo" value={reg.fullName} onChange={e => setReg(r => ({ ...r, fullName: e.target.value }))} />
              <input className={inputCls} placeholder="Correo electrónico" type="email" value={reg.email} onChange={e => setReg(r => ({ ...r, email: e.target.value }))} />
              <div className="flex gap-2">
                <select value={reg.countryName} onChange={e => { const c = COUNTRIES.find(x => x.name === e.target.value); if (c) setReg(r => ({ ...r, countryName: c.name, dial: c.dial })) }} className="bg-white/5 border border-white/10 rounded-xl px-2 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 [&>option]:bg-[#0d0d15] shrink-0" style={{ maxWidth: 120 }}>
                  {COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.flag} {c.dial}</option>)}
                </select>
                <input className={`${inputCls} flex-1`} placeholder="Teléfono (WhatsApp)" type="tel" inputMode="numeric" value={reg.phone} onChange={e => setReg(r => ({ ...r, phone: e.target.value.replace(/[^\d\s]/g, '') }))} />
              </div>
              <input className={inputCls} placeholder="Contraseña" type="password" value={reg.password} onChange={e => setReg(r => ({ ...r, password: e.target.value }))} />
              <input className={inputCls} placeholder="Repetir contraseña" type="password" value={reg.confirmPassword} onChange={e => setReg(r => ({ ...r, confirmPassword: e.target.value }))} />
              <label className="flex items-start gap-2 text-[11px] text-white/40 cursor-pointer pt-1">
                <input type="checkbox" checked={reg.acceptTerms} onChange={e => setReg(r => ({ ...r, acceptTerms: e.target.checked }))} className="mt-0.5 accent-amber-500" />
                Acepto los <a href="/terms" target="_blank" className="text-amber-400 underline">Términos</a> y la <a href="/privacy" target="_blank" className="text-amber-400 underline">Privacidad</a>
              </label>
              <button onClick={doRegister} disabled={busy} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black text-black disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#B45309,#D97706,#FFD700)' }}>
                {busy ? <Loader2 size={16} className="animate-spin" /> : <>Crear cuenta y continuar <ArrowRight size={15} /></>}
              </button>
              <p className="text-[10px] text-white/25 text-center">¿Ya tenés cuenta? <a href={`/login?redirect=${encodeURIComponent(`/dashboard/planes/checkout?plan=${selected.plan}&period=${period}`)}`} className="text-amber-400 underline">Iniciá sesión</a></p>
              <p className="text-[10px] text-white/20 text-center flex items-center justify-center gap-1"><ShieldCheck size={10} /> Pago con USDT, comprobante o QR</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
