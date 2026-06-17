'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, ClipboardList, MessageSquare, ListChecks, X, AlertCircle, Link2, Check, Trash2, Share2, Gift } from 'lucide-react'

const STATUS: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: 'Borrador', cls: 'bg-white/10 text-white/50' },
  PUBLISHED: { label: 'Publicado', cls: 'bg-green-500/15 text-green-400' },
  CLOSED: { label: 'Cerrado', cls: 'bg-red-500/15 text-red-400' },
}

export default function AdminFormsPage() {
  const router = useRouter()
  const [forms, setForms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [title, setTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [sharing, setSharing] = useState<any>(null)        // form que se está compartiendo
  const [shareId, setShareId] = useState('')               // @username o email
  const [shareBusy, setShareBusy] = useState(false)
  const [shareMsg, setShareMsg] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function copyLink(f: any) {
    const url = `${window.location.origin}/f/${f.slug}`
    navigator.clipboard.writeText(url).then(() => { setCopiedId(f.id); setTimeout(() => setCopiedId(null), 2000) }).catch(() => {})
  }

  async function del(f: any) {
    if (!confirm(`¿Eliminar el formulario "${f.title}"? Se borran también sus respuestas. Esta acción no se puede deshacer.`)) return
    setDeletingId(f.id)
    try {
      const r = await fetch(`/api/my-forms/${f.id}`, { method: 'DELETE' })
      if (r.ok) setForms(prev => prev.filter(x => x.id !== f.id)); else setError('No se pudo eliminar')
    } catch { setError('Error al eliminar') } finally { setDeletingId(null) }
  }

  async function doShare() {
    if (!shareId.trim()) { setShareMsg('Poné el usuario o email'); return }
    setShareBusy(true); setShareMsg(null)
    try {
      const r = await fetch(`/api/my-forms/${sharing.id}/share`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: shareId.trim() }) })
      const d = await r.json()
      if (!r.ok) { setShareMsg(d.error || 'Error'); return }
      setShareMsg(d.message || 'Compartido ✓'); setShareId('')
      setTimeout(() => { setSharing(null); setShareMsg(null) }, 1400)
    } catch { setShareMsg('Error al compartir') } finally { setShareBusy(false) }
  }

  useEffect(() => { load() }, [])
  async function load() {
    try { const r = await fetch('/api/my-forms'); const d = await r.json(); setForms(d.forms || []) }
    catch { setError('Error al cargar') } finally { setLoading(false) }
  }

  async function create() {
    if (!title.trim()) { setError('Poné un título'); return }
    setCreating(true); setError(null)
    try {
      const r = await fetch('/api/my-forms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) })
      const d = await r.json()
      if (!r.ok) { setError(d.error || 'Error'); return }
      router.push(`/dashboard/formularios/${d.form.id}`)
    } catch { setError('Error de conexión') } finally { setCreating(false) }
  }

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-amber-400" size={28} /></div>

  return (
    <div className="px-4 md:px-6 pt-6 max-w-screen-xl mx-auto pb-24 text-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2"><ClipboardList size={20} className="text-amber-400" /> Formularios</h1>
          <p className="text-xs text-white/30 mt-0.5">Creá formularios y encuestas. Compartí el link y recibí respuestas.</p>
        </div>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-black" style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}>
          <Plus size={15} /> Nuevo formulario
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-2 text-red-400 text-sm"><AlertCircle size={16} /> <p className="flex-1">{error}</p><button onClick={() => setError(null)}>✕</button></div>}

      {forms.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          <ClipboardList size={36} className="mx-auto mb-3 text-white/15" />
          <p className="text-sm">No hay formularios todavía.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map(f => (
            <div key={f.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <p className="font-bold text-white flex-1 min-w-0 truncate">{f.title}</p>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg shrink-0 ${STATUS[f.status]?.cls}`}>{STATUS[f.status]?.label}</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-white/40 mb-2">
                <span className="flex items-center gap-1"><ListChecks size={12} /> {f._count?.fields ?? 0} campos</span>
                <span className="flex items-center gap-1"><MessageSquare size={12} /> {f._count?.responses ?? 0} respuestas</span>
              </div>
              {f.sharedByUsername && <p className="text-[10px] text-indigo-300/70 mb-2 flex items-center gap-1"><Gift size={11} /> Compartido por @{f.sharedByUsername}</p>}
              <div className="flex gap-2">
                <Link href={`/dashboard/formularios/${f.id}`} className="flex-1 text-center py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all">Editar</Link>
                <Link href={`/dashboard/formularios/${f.id}/respuestas`} className="flex-1 text-center py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all">Respuestas</Link>
                <button onClick={() => copyLink(f)} title="Copiar enlace" className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${copiedId === f.id ? 'bg-green-500/15 text-green-400' : 'bg-white/5 hover:bg-white/10 text-white/60'}`}>
                  {copiedId === f.id ? <Check size={13} /> : <Link2 size={13} />}
                </button>
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => { setSharing(f); setShareId(''); setShareMsg(null) }} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-bold transition-all">
                  <Share2 size={13} /> Compartir
                </button>
                <button onClick={() => del(f)} disabled={deletingId === f.id} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-all disabled:opacity-50">
                  {deletingId === f.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                </button>
              </div>
              {f.status !== 'PUBLISHED' && <p className="text-[10px] text-amber-400/60 mt-2">Publicá el formulario para que el enlace funcione.</p>}
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowNew(false)}>
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d0d15] p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="font-black text-white">Nuevo formulario</h2><button onClick={() => setShowNew(false)} className="text-white/40 hover:text-white"><X size={18} /></button></div>
            <input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && create()} placeholder="Título del formulario" autoFocus className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 mb-3" />
            <button onClick={create} disabled={creating} className="w-full py-3 rounded-xl text-sm font-black text-black disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}>{creating ? <Loader2 size={15} className="animate-spin inline" /> : 'Crear y continuar'}</button>
          </div>
        </div>
      )}

      {/* Modal compartir */}
      {sharing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSharing(null)}>
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d0d15] p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1"><h2 className="font-black text-white flex items-center gap-2"><Share2 size={16} className="text-indigo-400" /> Compartir formulario</h2><button onClick={() => setSharing(null)} className="text-white/40 hover:text-white"><X size={18} /></button></div>
            <p className="text-xs text-white/40 mb-4">Se crea una copia para ese usuario (con sus campos). Él puede editarla sin afectar la tuya.</p>
            <input value={shareId} onChange={e => setShareId(e.target.value)} onKeyDown={e => e.key === 'Enter' && doShare()} placeholder="@usuario o email" autoFocus className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 mb-3" />
            {shareMsg && <p className="text-xs mb-3 text-amber-300">{shareMsg}</p>}
            <button onClick={doShare} disabled={shareBusy} className="w-full py-3 rounded-xl text-sm font-black text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#4f46e5,#6366f1)' }}>{shareBusy ? <Loader2 size={15} className="animate-spin inline" /> : 'Compartir'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
