'use client'

import { useState, useEffect } from 'react'
import { Loader2, Save, Eye, EyeOff, AlertCircle, CheckCircle2, Layers } from 'lucide-react'

const PERIODS = [
  { key: 'priceMonthly', label: 'Mensual' },
  { key: 'priceQuarterly', label: '3 meses' },
  { key: 'priceAnnual', label: 'Anual' },
] as const

// Servicios con límite de uso configurable (debe coincidir con lib/usage-limits)
const LIMITABLE = ['whatsapp', 'crm', 'social', 'ads', 'formularios']

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { load() }, [])
  async function load() {
    try {
      const r = await fetch('/api/admin/plans'); const d = await r.json()
      setPlans(d.plans || []); setServices(d.services || [])
    } catch { setError('Error al cargar') } finally { setLoading(false) }
  }

  function setField(id: string, patch: any) { setPlans(s => s.map(x => x.id === id ? { ...x, ...patch } : x)) }

  function toggleService(plan: any, key: string) {
    const set = new Set<string>(plan.services || [])
    if (set.has(key)) set.delete(key); else set.add(key)
    setField(plan.id, { services: Array.from(set) })
  }

  function setLimit(plan: any, key: string, value: string) {
    const limits = { ...(plan.limits || {}) }
    const n = Number(value)
    if (!value || isNaN(n) || n <= 0) delete limits[key]; else limits[key] = n
    setField(plan.id, { limits })
  }

  async function save(plan: any, extra?: any) {
    setSavingId(plan.id); setError(null)
    try {
      const body = extra ?? {
        name: plan.name, tagline: plan.tagline, services: plan.services,
        priceMonthly: plan.priceMonthly, priceQuarterly: plan.priceQuarterly, priceAnnual: plan.priceAnnual,
        limits: plan.limits || {},
      }
      const r = await fetch(`/api/admin/plans/${plan.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const d = await r.json()
      if (!r.ok) { setError(d.error || 'Error'); return }
      setPlans(s => s.map(x => x.id === plan.id ? d.plan : x))
      setMsg('Guardado'); setTimeout(() => setMsg(null), 1500)
    } catch { setError('Error al guardar') } finally { setSavingId(null) }
  }

  function toggleActive(plan: any) {
    const active = !plan.active
    setField(plan.id, { active })
    save(plan, { active })
  }

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-amber-400" size={28} /></div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Layers size={20} className="text-amber-400" /> Packs / Planes</h1>
        <p className="text-xs text-white/30 mt-0.5">Definí qué servicios incluye cada pack y sus precios por período (mensual / 3 meses / anual). Un pack inactivo no se vende.</p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-2 text-red-400 text-sm"><AlertCircle size={16} /><p className="flex-1">{error}</p><button onClick={() => setError(null)}>✕</button></div>}
      {msg && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex gap-2 text-green-400 text-sm"><CheckCircle2 size={16} /> {msg}</div>}

      <div className="space-y-3">
        {plans.map(plan => (
          <div key={plan.id} className={`rounded-2xl border bg-white/[0.03] p-5 transition-all ${plan.active ? 'border-white/8' : 'border-white/5 opacity-70'}`}>
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400/70 shrink-0">{plan.plan}</span>
                  <input value={plan.name} onChange={e => setField(plan.id, { name: e.target.value })} className="flex-1 bg-transparent text-white font-black text-base focus:outline-none border-b border-transparent focus:border-amber-500/40" />
                </div>
                <input value={plan.tagline || ''} onChange={e => setField(plan.id, { tagline: e.target.value })} placeholder="Eslogan corto" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/60 placeholder-white/20 focus:outline-none focus:border-amber-500/50 mt-2" />
              </div>
              <button onClick={() => toggleActive(plan)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shrink-0 ${plan.active ? 'bg-green-500/15 text-green-400' : 'bg-white/10 text-white/40'}`}>
                {plan.active ? <Eye size={14} /> : <EyeOff size={14} />} {plan.active ? 'A la venta' : 'Oculto'}
              </button>
            </div>

            {/* Servicios incluidos */}
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Servicios incluidos</p>
              <div className="flex flex-wrap gap-2">
                {services.map(s => {
                  const on = (plan.services || []).includes(s.key)
                  return (
                    <button key={s.key} onClick={() => toggleService(plan, s.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${on ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'}`}>
                      {on ? '✓ ' : ''}{s.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Límites de uso por servicio */}
            {(plan.services || []).length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Límites de uso <span className="text-white/20 normal-case tracking-normal">(0 o vacío = ilimitado)</span></p>
                <div className="flex flex-wrap gap-3">
                  {services.filter(s => LIMITABLE.includes(s.key)).map(s => (
                    <div key={s.key}>
                      <label className="block text-[10px] text-white/40 mb-1">{s.name}</label>
                      <input type="number" min="0" value={(plan.limits || {})[s.key] ?? ''} onChange={e => setLimit(plan, s.key, e.target.value)} placeholder="∞" className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500/50" />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-white/20 mt-1.5">Mensual: CRM (mensajes), Publisher (posts), Ads (campañas). Total: Agentes AI, Formularios. (Imágenes se limita por créditos AI.)</p>
              </div>
            )}

            {/* Precios por período */}
            <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-end gap-3">
              {PERIODS.map(p => (
                <div key={p.key}>
                  <label className="block text-[10px] uppercase tracking-widest text-white/30 mb-1">{p.label} (USDT)</label>
                  <input type="number" min="0" value={plan[p.key] ?? ''} onChange={e => setField(plan.id, { [p.key]: e.target.value })} placeholder="—" className="w-24 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500/50" />
                </div>
              ))}
              <button onClick={() => save(plan)} disabled={savingId === plan.id} className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-black disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}>
                {savingId === plan.id ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Guardar
              </button>
            </div>
            <p className="text-[10px] text-white/20 mt-2">Dejá un precio vacío para ocultar ese período. El usuario elige el período al comprar.</p>
          </div>
        ))}
      </div>
    </div>
  )
}
