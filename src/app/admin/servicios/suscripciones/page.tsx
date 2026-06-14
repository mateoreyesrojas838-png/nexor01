'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, CheckCircle2, XCircle, ExternalLink, LayoutGrid } from 'lucide-react'

export default function AdminSubscriptionsPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  async function load() {
    try { const r = await fetch('/api/admin/services/subscriptions'); const d = await r.json(); setRows(d.subscriptions || []) }
    catch { /* */ } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function act(id: string, action: 'approve' | 'reject') {
    setActing(id)
    try {
      await fetch(`/api/admin/services/subscriptions/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
      setRows(prev => prev.filter(r => r.id !== id))
    } finally { setActing(null) }
  }

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-amber-400" size={28} /></div>

  return (
    <div>
      <Link href="/admin/servicios" className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-white/60 mb-5"><ArrowLeft size={13} /> Volver a Servicios</Link>
      <h1 className="text-xl font-black text-white flex items-center gap-2 mb-1"><LayoutGrid size={20} className="text-amber-400" /> Suscripciones pendientes</h1>
      <p className="text-xs text-white/30 mb-6">Aprobá los pagos manuales. Los pagos cripto se confirman solos por el cron.</p>

      {rows.length === 0 ? (
        <div className="text-center py-16 text-white/30 text-sm">No hay suscripciones pendientes. ✓</div>
      ) : (
        <div className="space-y-3">
          {rows.map(r => (
            <div key={r.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm truncate">{r.serviceName} · <span className="text-white/50">{r.periodLabel}</span></p>
                <p className="text-xs text-white/40">{r.user.fullName} · {r.user.email}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded ${r.paymentMethod === 'CRYPTO' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-white/10 text-white/50'}`}>{r.paymentMethod === 'CRYPTO' ? 'USDT' : 'Comprobante'}</span>
                  <span className="text-[11px] text-amber-400">${r.price.toFixed(2)}</span>
                  {r.proofUrl && <a href={r.proofUrl} target="_blank" rel="noreferrer" className="text-[11px] text-amber-400 underline flex items-center gap-1">Ver comprobante <ExternalLink size={10} /></a>}
                  {r.txHash && <a href={`https://bscscan.com/tx/${r.txHash}`} target="_blank" rel="noreferrer" className="text-[11px] text-amber-400 underline flex items-center gap-1">Ver tx <ExternalLink size={10} /></a>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => act(r.id, 'approve')} disabled={acting === r.id} className="flex items-center gap-1 px-3 py-2 rounded-xl bg-green-500/15 text-green-400 text-xs font-bold hover:bg-green-500/25 disabled:opacity-50">
                  {acting === r.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Aprobar
                </button>
                <button onClick={() => act(r.id, 'reject')} disabled={acting === r.id} className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 disabled:opacity-50">
                  <XCircle size={13} /> Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
