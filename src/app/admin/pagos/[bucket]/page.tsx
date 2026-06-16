'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle2, XCircle, ExternalLink, Search, Clock, ArrowLeft, Wallet } from 'lucide-react'

const ACTION_URL: Record<string, (id: string) => string> = {
  plan: id => `/api/admin/purchases/${id}`,
  service: id => `/api/admin/services/subscriptions/${id}`,
  course: id => `/api/admin/courses/enrollments/${id}`,
}

const STATUS_UI: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Pendiente', cls: 'bg-amber-500/15 text-amber-400' },
  PENDING_VERIFICATION: { label: 'Verificando', cls: 'bg-yellow-500/15 text-yellow-300' },
  APPROVED: { label: 'Aprobado', cls: 'bg-green-500/15 text-green-400' },
  PAID: { label: 'Pagado', cls: 'bg-green-500/15 text-green-400' },
  REJECTED: { label: 'Rechazado', cls: 'bg-red-500/15 text-red-400' },
}
const STATUS_FILTERS = [
  { key: 'PENDIENTES', label: 'Pendientes' },
  { key: 'APPROVED', label: 'Aprobados' },
  { key: 'REJECTED', label: 'Rechazados' },
  { key: 'ALL', label: 'Todos' },
]
const methodBadge = (m: string) =>
  m === 'CRYPTO' ? { t: 'USDT', cls: 'bg-yellow-500/15 text-yellow-400' }
  : m === 'LIBELULA' ? { t: 'Libélula', cls: 'bg-sky-500/15 text-sky-300' }
  : { t: 'Comprobante', cls: 'bg-white/10 text-white/50' }

export default function PaymentBucketPage() {
  const { bucket } = useParams() as { bucket: string }
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('PENDIENTES')
  const [q, setQ] = useState('')
  const [acting, setActing] = useState<string | null>(null)

  async function load() {
    try { const r = await fetch('/api/admin/payments'); const d = await r.json(); setData(d) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function act(kind: string, id: string, action: 'approve' | 'reject') {
    if (action === 'reject' && !confirm('¿Rechazar este pago?')) return
    setActing(id)
    try {
      await fetch(ACTION_URL[kind](id), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
      await load()
    } finally { setActing(null) }
  }

  const { title, baseRows } = useMemo(() => {
    if (!data) return { title: '', baseRows: [] as any[] }
    if (bucket === 'plan') return { title: 'Planes (Grupal)', baseRows: data.plans || [] }
    if (bucket === 'course') return { title: 'Cursos', baseRows: data.courses || [] }
    const name = (data.serviceList || []).find((s: any) => s.key === bucket)?.name || bucket
    return { title: name, baseRows: (data.services || []).filter((r: any) => r.serviceKey === bucket) }
  }, [data, bucket])

  const rows = useMemo(() => {
    let list = [...baseRows]
    if (statusFilter === 'PENDIENTES') list = list.filter(r => r.status === 'PENDING' || r.status === 'PENDING_VERIFICATION')
    else if (statusFilter === 'APPROVED') list = list.filter(r => r.status === 'APPROVED' || r.status === 'PAID')
    else if (statusFilter === 'REJECTED') list = list.filter(r => r.status === 'REJECTED')
    if (q.trim()) {
      const s = q.toLowerCase()
      list = list.filter(r => `${r.user?.fullName} ${r.user?.email} ${r.user?.username}`.toLowerCase().includes(s))
    }
    return list
  }, [baseRows, statusFilter, q])

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-amber-400" size={28} /></div>

  return (
    <div>
      <Link href="/admin/pagos" className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-white/60 mb-4"><ArrowLeft size={13} /> Todos los pagos</Link>
      <h1 className="text-xl font-black text-white flex items-center gap-2 mb-5"><Wallet size={20} className="text-amber-400" /> Pagos · {title}</h1>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {STATUS_FILTERS.map(f => (
          <button key={f.key} onClick={() => setStatusFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === f.key ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-white/40 hover:text-white/70'}`}>
            {f.label}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar usuario..." className="pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 focus:outline-none focus:border-amber-500/40 w-48" />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-16 text-white/30 text-sm">No hay pagos en esta vista.</div>
      ) : (
        <div className="space-y-2.5">
          {rows.map((r: any) => {
            const mb = methodBadge(r.method)
            const st = STATUS_UI[r.status] || { label: r.status, cls: 'bg-white/10 text-white/50' }
            const actionable = r.status === 'PENDING' || r.status === 'PENDING_VERIFICATION'
            return (
              <div key={r.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{r.label}{r.period && <span className="text-white/40"> · {r.period}</span>}</p>
                  <p className="text-xs text-white/40 truncate">{r.user?.fullName || r.user?.username} · {r.user?.email}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${st.cls}`}>{st.label}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${mb.cls}`}>{mb.t}</span>
                    <span className="text-[11px] text-amber-400 font-bold">${r.amount.toFixed(2)}</span>
                    <span className="text-[10px] text-white/25">{new Date(r.createdAt).toLocaleDateString()}</span>
                    {r.proofUrl && <a href={r.proofUrl} target="_blank" rel="noreferrer" className="text-[11px] text-amber-400 underline flex items-center gap-1">Comprobante <ExternalLink size={10} /></a>}
                    {r.txHash && <a href={`https://bscscan.com/tx/${r.txHash}`} target="_blank" rel="noreferrer" className="text-[11px] text-amber-400 underline flex items-center gap-1">Tx <ExternalLink size={10} /></a>}
                  </div>
                </div>
                {actionable ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => act(r.kind, r.id, 'approve')} disabled={acting === r.id} className="flex items-center gap-1 px-3 py-2 rounded-xl bg-green-500/15 text-green-400 text-xs font-bold hover:bg-green-500/25 disabled:opacity-50">
                      {acting === r.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Aprobar
                    </button>
                    <button onClick={() => act(r.kind, r.id, 'reject')} disabled={acting === r.id} className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 disabled:opacity-50">
                      <XCircle size={13} /> Rechazar
                    </button>
                  </div>
                ) : <span className="shrink-0 text-white/20"><Clock size={15} /></span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
