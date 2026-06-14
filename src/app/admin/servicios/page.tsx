'use client'

import { useState, useEffect } from 'react'
import { Loader2, Save, Eye, EyeOff, AlertCircle, CheckCircle2, LayoutGrid, Upload, ExternalLink, Image as ImageIcon, Copy, Check } from 'lucide-react'
import { SERVICE_UI } from '@/lib/services-ui'

export default function AdminServicesPage() {
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  function copyUrl(svc: any) {
    const url = `${window.location.origin}/servicios/${svc.slug}`
    navigator.clipboard.writeText(url).then(() => { setCopiedId(svc.id); setTimeout(() => setCopiedId(null), 2000) }).catch(() => {})
  }

  useEffect(() => { load() }, [])
  async function load() {
    try { const r = await fetch('/api/admin/services'); const d = await r.json(); setServices(d.services || []) }
    catch { setError('Error al cargar') } finally { setLoading(false) }
  }

  function setField(id: string, patch: any) { setServices(s => s.map(x => x.id === id ? { ...x, ...patch } : x)) }

  async function save(svc: any, extra?: any) {
    setSavingId(svc.id); setError(null)
    try {
      const body = extra ?? {
        name: svc.name, description: svc.description, sellSeparately: svc.sellSeparately,
        coverUrl: svc.coverUrl, features: svc.features,
        priceMonthly: svc.priceMonthly, priceQuarterly: svc.priceQuarterly, priceAnnual: svc.priceAnnual,
      }
      const r = await fetch(`/api/admin/services/${svc.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const d = await r.json()
      if (!r.ok) { setError(d.error || 'Error'); return }
      setServices(s => s.map(x => x.id === svc.id ? d.service : x))
      setMsg('Guardado'); setTimeout(() => setMsg(null), 1500)
    } catch { setError('Error al guardar') } finally { setSavingId(null) }
  }

  function toggleActive(svc: any) {
    const active = !svc.active
    setField(svc.id, { active })
    save(svc, { active })
  }

  async function uploadCover(svc: any, file: File) {
    setSavingId(svc.id)
    try {
      const fd = new FormData(); fd.append('file', file)
      const r = await fetch('/api/upload', { method: 'POST', body: fd })
      const d = await r.json()
      if (!r.ok) { setError(d.error || 'Error al subir'); return }
      setField(svc.id, { coverUrl: d.url })
      await save({ ...svc, coverUrl: d.url })
    } catch { setError('Error al subir') } finally { setSavingId(null) }
  }

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-amber-400" size={28} /></div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-black text-white flex items-center gap-2"><LayoutGrid size={20} className="text-amber-400" /> Servicios</h1>
        <p className="text-xs text-white/30 mt-0.5">Activá o desactivá servicios (desactivado = no se muestra a los usuarios). Configurá precios para venta por separado.</p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-2 text-red-400 text-sm"><AlertCircle size={16} /><p className="flex-1">{error}</p><button onClick={() => setError(null)}>✕</button></div>}
      {msg && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex gap-2 text-green-400 text-sm"><CheckCircle2 size={16} /> {msg}</div>}

      <div className="space-y-3">
        {services.map(svc => {
          const ui = SERVICE_UI[svc.key]
          return (
            <div key={svc.id} className={`rounded-2xl border bg-white/[0.03] p-5 transition-all ${svc.active ? 'border-white/8' : 'border-white/5 opacity-70'}`}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${ui?.color ?? '#888'}18`, border: `1px solid ${ui?.color ?? '#888'}30` }}>
                  <i className={ui?.icon ?? 'fa-solid fa-cube'} style={{ color: ui?.color ?? '#888' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <input value={svc.name} onChange={e => setField(svc.id, { name: e.target.value })} className="w-full bg-transparent text-white font-black text-base focus:outline-none border-b border-transparent focus:border-amber-500/40" />
                  <textarea value={svc.description || ''} onChange={e => setField(svc.id, { description: e.target.value })} rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/60 placeholder-white/20 focus:outline-none focus:border-amber-500/50 resize-none mt-2" placeholder="Descripción" />
                </div>
                <button onClick={() => toggleActive(svc)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shrink-0 ${svc.active ? 'bg-green-500/15 text-green-400' : 'bg-white/10 text-white/40'}`}>
                  {svc.active ? <Eye size={14} /> : <EyeOff size={14} />} {svc.active ? 'Activo' : 'Oculto'}
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-end gap-3">
                <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer mr-2">
                  <input type="checkbox" checked={svc.sellSeparately} onChange={e => setField(svc.id, { sellSeparately: e.target.checked })} className="accent-amber-500" />
                  Vender por separado
                </label>
                {(['priceMonthly', 'priceQuarterly', 'priceAnnual'] as const).map((k, i) => (
                  <div key={k}>
                    <label className="block text-[10px] uppercase tracking-widest text-white/30 mb-1">{['Mensual', '3 meses', 'Anual'][i]} (USDT)</label>
                    <input type="number" min="0" value={svc[k] ?? ''} onChange={e => setField(svc.id, { [k]: e.target.value })} placeholder="—" className="w-24 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500/50" />
                  </div>
                ))}
                <button onClick={() => save(svc)} disabled={savingId === svc.id} className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-black disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}>
                  {savingId === svc.id ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Guardar
                </button>
              </div>

              {svc.sellSeparately && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Landing de venta · link para compartir</p>
                  <div className="flex items-center gap-2 mb-3">
                    <input readOnly value={typeof window !== 'undefined' ? `${window.location.origin}/servicios/${svc.slug}` : ''} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white/60 font-mono focus:outline-none" />
                    <button onClick={() => copyUrl(svc)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-black shrink-0" style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}>
                      {copiedId === svc.id ? <><Check size={11} /> Copiado</> : <><Copy size={11} /> Copiar</>}
                    </button>
                    {svc.active && <a href={`/servicios/${svc.slug}`} target="_blank" rel="noreferrer" className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-white/10 bg-white/5 text-white/60 hover:text-amber-400 flex items-center gap-1 shrink-0"><ExternalLink size={11} /> Ver</a>}
                  </div>
                  {!svc.active && <p className="text-[10px] text-amber-400/70 mb-2">Activá el servicio para que la landing sea visible.</p>}
                  <div className="flex gap-3">
                    <div className="w-28 h-16 rounded-lg overflow-hidden bg-white/5 border border-white/10 shrink-0 flex items-center justify-center">
                      {svc.coverUrl ? <img src={svc.coverUrl} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={16} className="text-white/15" />}
                    </div>
                    <div className="flex-1">
                      <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] text-white/60 cursor-pointer hover:bg-white/10 mb-2">
                        <Upload size={12} /> Portada
                        <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadCover(svc, f) }} />
                      </label>
                      <textarea value={svc.features || ''} onChange={e => setField(svc.id, { features: e.target.value })} onBlur={() => save(svc)} placeholder="Qué incluye (una línea por ítem)" rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 resize-none" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
