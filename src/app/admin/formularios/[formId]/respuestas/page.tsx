'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Download, MessageSquare, ExternalLink, Mail, X, Send, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react'

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
  const [emailCount, setEmailCount] = useState(0)

  // Modal de envío de correo
  const [showEmail, setShowEmail] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/admin/forms/${formId}/responses`).then(r => r.json()).then(setData).catch(() => {}).finally(() => setLoading(false))
    fetch(`/api/admin/forms/${formId}/email`).then(r => r.json()).then(d => setEmailCount(d.count || 0)).catch(() => {})
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
    // Ancho de columnas para que quede ordenado
    ws['!cols'] = header.map((h, i) => ({ wch: Math.min(40, Math.max(14, h.length, ...rows.map(r => String(r[i] ?? '').length))) }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Respuestas')
    XLSX.writeFile(wb, 'respuestas.xlsx')
  }

  async function sendEmail() {
    if (!subject.trim() || !message.trim()) { setError('Completá asunto y mensaje'); return }
    setSending(true); setError(null); setResult(null)
    try {
      const r = await fetch(`/api/admin/forms/${formId}/email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject, message }) })
      const d = await r.json()
      if (!r.ok) { setError(d.error || 'Error al enviar'); return }
      setResult(`Enviado a ${d.sent} de ${d.total} personas.`)
      setSubject(''); setMessage('')
    } catch { setError('Error de conexión') } finally { setSending(false) }
  }

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-amber-400" size={28} /></div>

  const fields = data?.fields ?? []
  const responses = data?.responses ?? []

  return (
    <div>
      <Link href="/admin/formularios" className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-white/60 mb-5"><ArrowLeft size={13} /> Volver a Formularios</Link>

      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2"><MessageSquare size={19} className="text-amber-400" /> Respuestas</h1>
          <p className="text-xs text-white/30 mt-0.5">{data?.total ?? 0} respuestas · {emailCount} con email</p>
        </div>
        <div className="flex items-center gap-2">
          {emailCount > 0 && (
            <button onClick={() => setShowEmail(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white/5 border border-white/10 text-white/70 hover:border-amber-500/40 hover:text-amber-400">
              <Mail size={15} /> Enviar correo ({emailCount})
            </button>
          )}
          {responses.length > 0 && (
            <>
              <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-black" style={{ background: 'linear-gradient(135deg,#15803d,#22c55e)' }}>
                <FileSpreadsheet size={15} /> Excel
              </button>
              <a href={`/api/admin/forms/${formId}/responses?format=csv`} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white/5 border border-white/10 text-white/60 hover:text-white">
                <Download size={15} /> CSV
              </a>
            </>
          )}
        </div>
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
                {fields.map(f => <th key={f.id} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/40 whitespace-nowrap">{f.label}{f.type === 'email' && ' 📧'}</th>)}
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

      {/* Modal enviar correo */}
      {showEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowEmail(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d0d15] p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-black text-white flex items-center gap-2"><Mail size={17} className="text-amber-400" /> Enviar correo</h2>
              <button onClick={() => setShowEmail(false)} className="text-white/40 hover:text-white"><X size={18} /></button>
            </div>
            <p className="text-[11px] text-white/30 mb-4">Se envía a las <strong className="text-white/60">{emailCount}</strong> personas que dejaron su email en el formulario.</p>

            {error && <div className="mb-3 p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-2 text-red-400 text-xs"><AlertCircle size={14} /><p className="flex-1">{error}</p></div>}
            {result && <div className="mb-3 p-2.5 bg-green-500/10 border border-green-500/20 rounded-xl flex gap-2 text-green-400 text-xs"><CheckCircle2 size={14} /> {result}</div>}

            <div className="space-y-3">
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Asunto" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50" />
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Escribí tu mensaje..." rows={6} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 resize-none" />
              <button onClick={sendEmail} disabled={sending} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-black disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}>
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Enviar a {emailCount} personas
              </button>
              <p className="text-[10px] text-white/20 text-center">Nota: Gmail limita ~500 correos por día.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
