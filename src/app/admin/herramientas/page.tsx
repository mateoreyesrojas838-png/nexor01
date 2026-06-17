'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, Plus, Trash2, Save, X, Upload, Eye, EyeOff, Wrench, FileText, Image as ImageIcon, Film, ExternalLink } from 'lucide-react'

const SECTIONS = [
  { key: 'CATALOGO', label: 'Catálogo' },
  { key: 'TESTIMONIO', label: 'Testimonios' },
  { key: 'PROMOCION', label: 'Promociones' },
  { key: 'BIBLIOTECA', label: 'Biblioteca' },
  { key: 'GUION', label: 'Guiones' },
] as const

// Qué campos mostrar por sección
const FIELDS: Record<string, { category?: boolean; cover?: boolean; file?: boolean; image?: boolean; video?: boolean; button?: boolean; buttonHint?: string }> = {
  CATALOGO: { category: true, cover: true, file: true, button: true, buttonHint: 'Ej. "Abrir en Canva"' },
  TESTIMONIO: { button: true, buttonHint: 'Botón de acción (opcional)' },
  PROMOCION: { image: true, video: true, file: true },
  BIBLIOTECA: { cover: true, file: true },
  GUION: { cover: true, file: true },
}

const empty = (section: string) => ({ id: '', section, title: '', category: '', description: '', coverUrl: '', fileUrl: '', imageUrl: '', videoUrl: '', buttonLabel: '', buttonUrl: '', active: true })

function AdminToolsContent() {
  const sp = useSearchParams()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [section, setSection] = useState('CATALOGO')
  const [editor, setEditor] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Abrir en la sección que venga por ?s= (desde el menú colapsable del admin)
  useEffect(() => {
    const s = (sp.get('s') || '').toUpperCase()
    if (SECTIONS.some(x => x.key === s)) setSection(s)
  }, [sp])

  async function load() {
    try { const r = await fetch('/api/admin/herramientas'); const d = await r.json(); setItems(d.items || []) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function uploadTo(field: string, file: File, accept: string) {
    if (accept === 'pdf' && file.type !== 'application/pdf') { setError('Subí un PDF válido.'); return }
    setUploading(field)
    try {
      const fd = new FormData(); fd.append('file', file)
      const r = await fetch('/api/upload', { method: 'POST', body: fd })
      const d = await r.json()
      if (!r.ok) { setError(d.error || 'Error al subir'); return }
      setEditor((e: any) => ({ ...e, [field]: d.url }))
    } catch { setError('Error al subir') } finally { setUploading(null) }
  }

  async function save() {
    if (!editor.title.trim()) { setError('Poné un título'); return }
    setSaving(true); setError(null)
    try {
      const isNew = !editor.id
      const r = await fetch(isNew ? '/api/admin/herramientas' : `/api/admin/herramientas/${editor.id}`, {
        method: isNew ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editor),
      })
      const d = await r.json()
      if (!r.ok) { setError(d.error || 'Error'); return }
      setEditor(null); await load()
    } catch { setError('Error al guardar') } finally { setSaving(false) }
  }

  async function del(id: string) {
    if (!confirm('¿Eliminar este recurso?')) return
    await fetch(`/api/admin/herramientas/${id}`, { method: 'DELETE' }); await load()
  }
  async function toggleActive(it: any) {
    await fetch(`/api/admin/herramientas/${it.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !it.active }) })
    await load()
  }

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-amber-400" size={28} /></div>

  const list = items.filter(i => i.section === section)
  const f = FIELDS[section]
  const sectionLabel = SECTIONS.find(s => s.key === section)?.label || ''

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2"><Wrench size={20} className="text-amber-400" /> Herramientas · {sectionLabel}</h1>
          <p className="text-xs text-white/30 mt-0.5">{list.length} ítem(s) en esta sección. Elegí otra sección desde el menú lateral.</p>
        </div>
        <button onClick={() => setEditor(empty(section))} className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-black" style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}>
          <Plus size={15} /> Nuevo
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-2 text-red-400 text-sm"><X size={16} /><p className="flex-1">{error}</p><button onClick={() => setError(null)}>✕</button></div>}

      {/* Lista */}
      {list.length === 0 ? (
        <div className="text-center py-16 text-white/30 text-sm">No hay nada en esta sección todavía.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {list.map(it => (
            <div key={it.id} className={`rounded-2xl border bg-white/[0.03] overflow-hidden ${it.active ? 'border-white/8' : 'border-white/5 opacity-60'}`}>
              {(it.coverUrl || it.imageUrl) && <div className="bg-black/20 flex items-center justify-center p-1.5" style={{ height: 140 }}><img src={it.coverUrl || it.imageUrl} alt="" className="max-w-full max-h-full object-contain" /></div>}
              <div className="p-4">
                {it.category && <p className="text-[10px] uppercase tracking-widest text-amber-400/70 mb-1">{it.category}</p>}
                <p className="font-bold text-white text-sm">{it.title}</p>
                {it.description && <p className="text-xs text-white/40 mt-1 line-clamp-2">{it.description}</p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  {it.fileUrl && <a href={it.fileUrl} target="_blank" rel="noreferrer" className="text-[11px] text-amber-400 underline flex items-center gap-1"><FileText size={11} /> Archivo</a>}
                  {it.videoUrl && <span className="text-[11px] text-white/40 flex items-center gap-1"><Film size={11} /> Video</span>}
                  {it.buttonUrl && <span className="text-[11px] text-white/40 flex items-center gap-1"><ExternalLink size={11} /> {it.buttonLabel || 'Botón'}</span>}
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                  <button onClick={() => setEditor({ ...empty(it.section), ...it, category: it.category || '', description: it.description || '', coverUrl: it.coverUrl || '', fileUrl: it.fileUrl || '', imageUrl: it.imageUrl || '', videoUrl: it.videoUrl || '', buttonLabel: it.buttonLabel || '', buttonUrl: it.buttonUrl || '' })} className="flex-1 text-center py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold">Editar</button>
                  <button onClick={() => toggleActive(it)} className={`px-2.5 py-1.5 rounded-lg text-xs ${it.active ? 'bg-green-500/15 text-green-400' : 'bg-white/10 text-white/40'}`}>{it.active ? <Eye size={13} /> : <EyeOff size={13} />}</button>
                  <button onClick={() => del(it.id)} className="px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor modal */}
      {editor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto" onClick={() => setEditor(null)}>
          <div className="w-full max-w-lg my-8 rounded-2xl border border-white/10 bg-[#0d0d15] p-5 space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-black text-white">{editor.id ? 'Editar' : 'Nuevo'} · {SECTIONS.find(s => s.key === editor.section)?.label}</h2>
              <button onClick={() => setEditor(null)} className="text-white/40 hover:text-white"><X size={18} /></button>
            </div>

            <input value={editor.title} onChange={e => setEditor({ ...editor, title: e.target.value })} placeholder="Título" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50" />

            {f.category && <input value={editor.category} onChange={e => setEditor({ ...editor, category: e.target.value })} placeholder="Categoría (ej. Posts, Historias, Flyers)" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50" />}

            <textarea value={editor.description} onChange={e => setEditor({ ...editor, description: e.target.value })} placeholder="Descripción (opcional)" rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 resize-none" />

            {/* Uploads condicionales */}
            <div className="grid grid-cols-2 gap-2">
              {f.cover && <UploadBox label="Portada (imagen)" icon={ImageIcon} value={editor.coverUrl} busy={uploading === 'coverUrl'} accept="image/*" onPick={(file: File) => uploadTo('coverUrl', file, 'image')} onClear={() => setEditor({ ...editor, coverUrl: '' })} />}
              {f.image && <UploadBox label="Imagen" icon={ImageIcon} value={editor.imageUrl} busy={uploading === 'imageUrl'} accept="image/*" onPick={(file: File) => uploadTo('imageUrl', file, 'image')} onClear={() => setEditor({ ...editor, imageUrl: '' })} />}
              {f.video && <UploadBox label="Video" icon={Film} value={editor.videoUrl} busy={uploading === 'videoUrl'} accept="video/*" onPick={(file: File) => uploadTo('videoUrl', file, 'video')} onClear={() => setEditor({ ...editor, videoUrl: '' })} />}
              {f.file && <UploadBox label="Archivo (PDF)" icon={FileText} value={editor.fileUrl} busy={uploading === 'fileUrl'} accept="application/pdf" onPick={(file: File) => uploadTo('fileUrl', file, 'pdf')} onClear={() => setEditor({ ...editor, fileUrl: '' })} />}
            </div>

            {f.button && (
              <div className="grid grid-cols-2 gap-2">
                <input value={editor.buttonLabel} onChange={e => setEditor({ ...editor, buttonLabel: e.target.value })} placeholder={f.buttonHint || 'Texto del botón'} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50" />
                <input value={editor.buttonUrl} onChange={e => setEditor({ ...editor, buttonUrl: e.target.value })} placeholder="https://enlace..." className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50" />
              </div>
            )}

            <button onClick={save} disabled={saving || !!uploading} className="w-full py-3 rounded-xl text-sm font-black text-black disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminToolsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-amber-400" size={28} /></div>}>
      <AdminToolsContent />
    </Suspense>
  )
}

function UploadBox({ label, icon: Icon, value, busy, accept, onPick, onClear }: any) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-white/30 mb-1">{label}</label>
      {value ? (
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
          <Icon size={14} className="text-amber-400 shrink-0" />
          <span className="text-[11px] text-white/50 truncate flex-1">Cargado ✓</span>
          <button onClick={onClear} className="text-white/30 hover:text-red-400"><X size={13} /></button>
        </div>
      ) : (
        <label className="flex items-center justify-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-white/50 cursor-pointer hover:bg-white/10">
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} Subir
          <input type="file" accept={accept} className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) onPick(file) }} />
        </label>
      )}
    </div>
  )
}
