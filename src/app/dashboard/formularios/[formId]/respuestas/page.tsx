'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Download, MessageSquare, ExternalLink, FileSpreadsheet } from 'lucide-react'

function valueToText(v: any): string {
  if (v == null) return ''
  if (Array.isArray(v)) return v.join(', ')
  return String(v)
}
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
    fetch(`/api/my-forms/${formId}/responses`).then(r => r.json()).then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [formId])

  async function exportExcel() {
    if (!data) return
    const XLSX = await import('xlsx')
    const header = ['Fecha', ...data.fields.map(f => f.label)]
    const rows = data.responses.map(r => [
      new Date(r.createdAt).toLocaleString('es-ES'),
      ...data.fields.map(f => valueToText(r.answers?.[f.id])),
    ])
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
    ws['!cols'] = header.map((h, i) => ({ wch: Math.min(40, Math.max(14, h.length, ...rows.map(r => String(r[i] ?? '').length))) }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Respuestas')
    XLSX.writeFile(wb, 'respuestas.xlsx')
  }

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-amber-400" size={28} /></div>

  const fields = data?.fields ?? []
  const responses = data?.responses ?? []

  return (
    <div className="px-4 md:px-6 pt-6 max-w-screen-xl mx-auto pb-24 text-white">
      <Link href="/dashboard/formularios" className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-white/60 mb-5"><ArrowLeft size={13} /> Volver a Formularios</Link>

      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2"><MessageSquare size={19} className="text-amber-400" /> Respuestas</h1>
          <p className="text-xs text-white/30 mt-0.5">{data?.total ?? 0} respuestas recibidas</p>
        </div>
        {responses.length > 0 && (
          <div className="flex items-center gap-2">
            <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-black" style={{ background: 'linear-gradient(135deg,#15803d,#22c55e)' }}>
              <FileSpreadsheet size={15} /> Excel
            </button>
            <a href={`/api/my-forms/${formId}/responses?format=csv`} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white/5 border border-white/10 text-white/60 hover:text-white">
              <Download size={15} /> CSV
            </a>
          </div>
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
