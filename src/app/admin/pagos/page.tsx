'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Loader2, Wallet, ChevronRight, Layers, GraduationCap, Boxes, Coins } from 'lucide-react'

const fmt = (n: number) => `$${(n ?? 0).toFixed(2)}`

function Card({ href, title, icon, pending, revenue }: { href: string; title: string; icon: React.ReactNode; pending: number; revenue: number }) {
  return (
    <Link href={href} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 hover:border-amber-500/30 hover:bg-white/[0.05] transition-all flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-400">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-black text-white truncate">{title}</p>
        <p className="text-[11px] text-white/40">{fmt(revenue)} cobrados</p>
      </div>
      {pending > 0 && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 shrink-0">{pending} pend.</span>}
      <ChevronRight size={16} className="text-white/30 shrink-0" />
    </Link>
  )
}

export default function PaymentsHubPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/payments').then(r => r.json()).then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-amber-400" size={28} /></div>

  const sum = data?.summary
  const byKind = sum?.byKind || {}
  const byService = sum?.byService || {}
  const serviceList = data?.serviceList || []

  return (
    <div>
      <h1 className="text-xl font-black text-white flex items-center gap-2 mb-1"><Wallet size={20} className="text-amber-400" /> Pagos</h1>
      <p className="text-xs text-white/30 mb-5">Cada servicio y los planes tienen su propia página, separados y ordenados. Entrá a la que quieras administrar.</p>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
          <p className="text-[10px] uppercase tracking-widest text-white/30">Pendientes</p>
          <p className="text-2xl font-black text-amber-400">{sum?.pendingTotal ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <p className="text-[10px] uppercase tracking-widest text-white/30">Ingresos (total)</p>
          <p className="text-2xl font-black text-white">{fmt(sum?.revenueTotal)}</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <p className="text-[10px] uppercase tracking-widest text-white/30">Ingresos del mes</p>
          <p className="text-2xl font-black text-green-400">{fmt(sum?.revenueMonth)}</p>
        </div>
      </div>

      {/* Grupal */}
      <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Grupal</p>
      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        <Card href="/admin/pagos/plan" title="Planes (Packs)" icon={<Layers size={18} />} pending={byKind.plan?.pending ?? 0} revenue={byKind.plan?.revenue ?? 0} />
        <Card href="/admin/pagos/course" title="Cursos" icon={<GraduationCap size={18} />} pending={byKind.course?.pending ?? 0} revenue={byKind.course?.revenue ?? 0} />
        <Card href="/admin/pagos/credit" title="Recargas de créditos" icon={<Coins size={18} />} pending={byKind.credit?.pending ?? 0} revenue={byKind.credit?.revenue ?? 0} />
      </div>

      {/* Cada servicio por separado */}
      <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Servicios (uno por uno)</p>
      <div className="grid sm:grid-cols-2 gap-3">
        {serviceList.map((s: any) => (
          <Card key={s.key} href={`/admin/pagos/${s.key}`} title={s.name} icon={<Boxes size={18} />}
            pending={byService[s.key]?.pending ?? 0} revenue={byService[s.key]?.revenue ?? 0} />
        ))}
      </div>
    </div>
  )
}
