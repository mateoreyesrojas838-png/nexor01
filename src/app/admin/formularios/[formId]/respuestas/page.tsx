'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Download, MessageSquare, ExternalLink } from 'lucide-react'

function renderValue(v: any) {
  if (v == null || v === '') return <span className="text-white/20">—</span>
  if (Array.isArray(v)) return v.join(', ')
  if (typeof v === 'string' && v.startsWith('http')) return <a href={v} target="_blank" rel="noreferrer" className="text-amber-400 underline inline-flex items-center gap-1">archivo <ExternalLink size={10} /></a>
  return String(v)
}

export default function FormResponsesPage() {
  const { formId } = useParams() as { formId: string }
  const [data, setData] = useState<{ fields: any[]; responses: any[]; total: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/forms/${formId}/responses`).then(r => r.json()).then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [formId])

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-amber-400" size={28} /></div>

  const fields = data?.fields ?? []
  const responses = data?.responses ?? []

  return (
    <div>
      <Link href="/admin/formularios" className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-white/60 mb-5"><ArrowLeft size={13} /> Volver a Formularios</Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2"><MessageSquare size={19} className="text-amber-400" /> Respuestas</h1>
          <p className="text-xs text-white/30 mt-0.5">{data?.total ?? 0} respuestas recibidas</p>
        </div>
        {responses.length > 0 && (
          <a href={`/api/admin/forms/${formId}/responses?format=csv`} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-black" style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}>
            <Download size={15} /> Exportar CSV
          </a>
        )}
      </div>

      {responses.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          <MessageSquare size={36} className="mx-auto mb-3 text-white/15" />
          <p className="text-sm">Todavía no hay respuestas.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-left">
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/40 whitespace-nowrap">Fecha</th>
                {fields.map(f => <th key={f.id} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/40 whitespace-nowrap">{f.label}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {responses.map(r => (
                <tr key={r.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white/40 text-xs whitespace-nowrap">{new Date(r.createdAt).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                  {fields.map(f => <td key={f.id} className="px-4 py-3 text-white/70 max-w-xs truncate">{renderValue(r.answers?.[f.id])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
