'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Loader2, Save, Plus, Trash2, ChevronUp, ChevronDown, AlertCircle, CheckCircle2,
  Copy, Check, ExternalLink, Upload, Image as ImageIcon, X, Film
} from 'lucide-react'

const FIELD_TYPES: { type: string; label: string }[] = [
  { type: 'text', label: 'Texto corto' },
  { type: 'paragraph', label: 'Párrafo' },
  { type: 'radio', label: 'Opción múltiple' },
  { type: 'checkbox', label: 'Casillas' },
  { type: 'dropdown', label: 'Desplegable' },
  { type: 'number', label: 'Número' },
  { type: 'email', label: 'Email' },
  { type: 'phone', label: 'Teléfono' },
  { type: 'date', label: 'Fecha' },
  { type: 'rating', label: 'Escala (estrellas)' },
  { type: 'file', label: 'Subir archivo' },
  { type: 'heading', label: 'Encabezado / sección' },
  { type: 'button', label: 'Botón con enlace' },
]
const typeLabel = (t: string) => FIELD_TYPES.find(f => f.type === t)?.label ?? t
const hasOptions = (t: string) => ['radio', 'checkbox', 'dropdown'].includes(t)

export default function FormBuilder() {
  const { formId } = useParams() as { formId: string }
  const coverRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<any>(null)
  const [fields, setFields] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [addType, setAddType] = useState('text')
  const videoRef = useRef<HTMLInputElement>(null)

  const [meta, setMeta] = useState<any>({ title: '', description: '', themeColor: '#F59E0B', themeColors: ['#F59E0B'], buttonColor: '#F59E0B', coverUrl: '', headerVideoUrl: '', showSubmit: true, redirectUrl: '', notifyEmail: false, thankYouMsg: '', status: 'DRAFT' })

  const fetchForm = useCallback(async () => {
    try {
      const r = await fetch(`/api/admin/forms/${formId}`)
      const d = await r.json()
      if (!r.ok) { setError(d.error || 'Error'); return }
      setForm(d.form); setFields(d.form.fields || [])
      setMeta({
        title: d.form.title || '', description: d.form.description || '', themeColor: d.form.themeColor || '#F59E0B',
        themeColors: Array.isArray(d.form.themeColors) && d.form.themeColors.length ? d.form.themeColors : [d.form.themeColor || '#F59E0B'],
        buttonColor: d.form.buttonColor || d.form.themeColor || '#F59E0B',
        coverUrl: d.form.coverUrl || '', headerVideoUrl: d.form.headerVideoUrl || '',
        showSubmit: d.form.showSubmit !== false, redirectUrl: d.form.redirectUrl || '',
        notifyEmail: !!d.form.notifyEmail, thankYouMsg: d.form.thankYouMsg || '', status: d.form.status,
      })
    } catch { setError('Error al cargar') } finally { setLoading(false) }
  }, [formId])
  useEffect(() => { fetchForm() }, [fetchForm])

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(null), 2000) }

  async function saveForm(patch?: any) {
    setSaving(true); setError(null)
    try {
      const r = await fetch(`/api/admin/forms/${formId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch ?? meta) })
      const d = await r.json()
      if (!r.ok) { setError(d.error || 'Error al guardar'); return }
      if (patch?.status) setMeta((m: any) => ({ ...m, status: patch.status }))
      setForm((f: any) => ({ ...f, ...d.form }))
      flash('Guardado')
    } catch { setError('Error al guardar') } finally { setSaving(false) }
  }

  async function uploadCover(file: File) {
    setUploadingCover(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const r = await fetch('/api/upload', { method: 'POST', body: fd })
      const d = await r.json()
      if (!r.ok) { setError(d.error || 'Error'); return }
      setMeta((m: any) => ({ ...m, coverUrl: d.url })); flash('Portada subida — guardá')
    } catch { setError('Error al subir') } finally { setUploadingCover(false) }
  }

  async function uploadVideo(file: File) {
    setUploadingVideo(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const r = await fetch('/api/upload', { method: 'POST', body: fd })
      const d = await r.json()
      if (!r.ok) { setError(d.error || 'Error'); return }
      setMeta((m: any) => ({ ...m, headerVideoUrl: d.url })); flash('Video subido — guardá')
    } catch { setError('Error al subir') } finally { setUploadingVideo(false) }
  }
  // Helpers de colores del estilo
  function setColor(i: number, v: string) { setMeta((m: any) => ({ ...m, themeColors: m.themeColors.map((c: string, idx: number) => idx === i ? v : c) })) }
  function addColor() { setMeta((m: any) => m.themeColors.length >= 5 ? m : ({ ...m, themeColors: [...m.themeColors, '#D97706'] })) }
  function removeColor(i: number) { setMeta((m: any) => m.themeColors.length <= 1 ? m : ({ ...m, themeColors: m.themeColors.filter((_: any, idx: number) => idx !== i) })) }

  // ── Campos ──
  async function addField() {
    const r = await fetch(`/api/admin/forms/${formId}/fields`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: addType }) })
    const d = await r.json()
    if (r.ok) setFields(f => [...f, d.field])
  }
  async function patchField(id: string, data: any) {
    setFields(f => f.map(x => x.id === id ? { ...x, ...data } : x))
    await fetch(`/api/admin/forms/fields/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
  }
  async function deleteField(id: string) {
    if (!confirm('¿Eliminar este campo?')) return
    setFields(f => f.filter(x => x.id !== id))
    await fetch(`/api/admin/forms/fields/${id}`, { method: 'DELETE' })
  }
  async function moveField(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= fields.length) return
    const a = fields[i], b = fields[j]
    setFields(f => { const c = [...f];[c[i], c[j]] = [c[j], c[i]]; return c })
    await Promise.all([patchFieldOrder(a.id, b.order), patchFieldOrder(b.id, a.order)])
  }
  async function patchFieldOrder(id: string, order: number) {
    await fetch(`/api/admin/forms/fields/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order }) })
  }
  function setOption(field: any, idx: number, val: string) {
    const opts = [...(field.options || [])]; opts[idx] = val; patchField(field.id, { options: opts })
  }
  function addOption(field: any) { patchField(field.id, { options: [...(field.options || []), `Opción ${(field.options?.length || 0) + 1}`] }) }
  function removeOption(field: any, idx: number) { patchField(field.id, { options: (field.options || []).filter((_: any, i: number) => i !== idx) }) }

  const shareUrl = form?.slug && typeof window !== 'undefined' ? `${window.location.origin}/f/${form.slug}` : ''
  function copyShare() { navigator.clipboard.writeText(shareUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }).catch(() => {}) }

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-amber-400" size={28} /></div>
  if (!form) return null

  return (
    <div className="max-w-3xl">
      <Link href="/admin/formularios" className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-white/60 mb-5"><ArrowLeft size={13} /> Volver a Formularios</Link>

      {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-2 text-red-400 text-sm"><AlertCircle size={16} /><p className="flex-1">{error}</p><button onClick={() => setError(null)}>✕</button></div>}
      {msg && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex gap-2 text-green-400 text-sm"><CheckCircle2 size={16} /> {msg}</div>}

      {/* Estado + link */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 mb-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            {(['DRAFT', 'PUBLISHED', 'CLOSED'] as const).map(s => (
              <button key={s} onClick={() => saveForm({ status: s })} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${meta.status === s ? (s === 'PUBLISHED' ? 'bg-green-500/20 text-green-400' : s === 'CLOSED' ? 'bg-red-500/20 text-red-400' : 'bg-white/15 text-white') : 'bg-white/5 text-white/40 hover:text-white/70'}`}>
                {s === 'DRAFT' ? 'Borrador' : s === 'PUBLISHED' ? 'Publicado' : 'Cerrado'}
              </button>
            ))}
          </div>
        </div>
        {meta.status === 'PUBLISHED' && (
          <div className="flex items-center gap-2 mt-3">
            <input readOnly value={shareUrl} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/70 font-mono focus:outline-none" />
            <button onClick={copyShare} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-black" style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}>{copied ? <><Check size={13} /> ✓</> : <><Copy size={13} /> Copiar</>}</button>
            <a href={shareUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-white/10 bg-white/5 text-white/60 hover:text-amber-400"><ExternalLink size={13} /></a>
          </div>
        )}
        {meta.status !== 'PUBLISHED' && <p className="text-[11px] text-white/30 mt-2">Publicá el formulario para obtener el link y recibir respuestas.</p>}
      </div>

      {/* Datos + diseño */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 mb-5 space-y-3">
        <h2 className="font-black text-white">Encabezado y diseño</h2>
        {/* Cabecera: portada (imagen) + video */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1.5">Portada (imagen)</p>
            <div className="h-20 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center mb-2">
              {meta.coverUrl ? <img src={meta.coverUrl} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-white/15" />}
            </div>
            <button onClick={() => coverRef.current?.click()} disabled={uploadingCover} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70 hover:bg-white/10 w-full justify-center">
              {uploadingCover ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} Subir
            </button>
            <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadCover(f) }} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1.5">Video de cabecera</p>
            <div className="h-20 rounded-xl overflow-hidden bg-black border border-white/10 flex items-center justify-center mb-2">
              {meta.headerVideoUrl ? <video src={meta.headerVideoUrl} className="w-full h-full object-cover" muted /> : <Film size={20} className="text-white/15" />}
            </div>
            <div className="flex gap-1">
              <button onClick={() => videoRef.current?.click()} disabled={uploadingVideo} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70 hover:bg-white/10 flex-1 justify-center">
                {uploadingVideo ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} Subir
              </button>
              {meta.headerVideoUrl && <button onClick={() => setMeta((m: any) => ({ ...m, headerVideoUrl: '' }))} className="px-2 rounded-lg bg-white/5 border border-white/10 text-white/30 hover:text-red-400"><X size={13} /></button>}
            </div>
            <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadVideo(f) }} />
          </div>
        </div>

        {/* Colores del estilo (2-5) */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1.5">Colores del estilo (degradado)</p>
          <div className="flex items-center gap-2 flex-wrap">
            {meta.themeColors.map((c: string, i: number) => (
              <div key={i} className="relative">
                <input type="color" value={c} onChange={e => setColor(i, e.target.value)} className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border border-white/10" />
                {meta.themeColors.length > 1 && <button onClick={() => removeColor(i)} className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500/80 text-white flex items-center justify-center text-[10px]">×</button>}
              </div>
            ))}
            {meta.themeColors.length < 5 && <button onClick={addColor} className="w-9 h-9 rounded-lg border-2 border-dashed border-white/15 text-white/30 hover:text-amber-400 flex items-center justify-center"><Plus size={14} /></button>}
          </div>
          <div className="h-2 rounded-full mt-2" style={{ background: `linear-gradient(90deg, ${meta.themeColors.join(', ')})` }} />
        </div>

        {/* Color del botón */}
        <label className="flex items-center gap-2 text-xs text-white/60">
          Color del botón: <input type="color" value={meta.buttonColor} onChange={e => setMeta((m: any) => ({ ...m, buttonColor: e.target.value }))} className="w-9 h-7 rounded cursor-pointer bg-transparent" />
        </label>
        <input value={meta.title} onChange={e => setMeta((m: any) => ({ ...m, title: e.target.value }))} placeholder="Título del formulario" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50" />
        <textarea value={meta.description} onChange={e => setMeta((m: any) => ({ ...m, description: e.target.value }))} placeholder="Descripción (opcional)" rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 resize-none" />
        <input value={meta.thankYouMsg} onChange={e => setMeta((m: any) => ({ ...m, thankYouMsg: e.target.value }))} placeholder="Mensaje de gracias al enviar (opcional)" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50" />
        <input value={meta.redirectUrl} onChange={e => setMeta((m: any) => ({ ...m, redirectUrl: e.target.value }))} placeholder="Redirigir a este enlace al enviar (opcional)" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 font-mono" />
        <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
          <input type="checkbox" checked={meta.showSubmit} onChange={e => setMeta((m: any) => ({ ...m, showSubmit: e.target.checked }))} className="accent-amber-500" />
          Mostrar el botón &quot;Enviar&quot; (desactivalo si vas a enviar con un botón personalizado)
        </label>
        <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
          <input type="checkbox" checked={meta.notifyEmail} onChange={e => setMeta((m: any) => ({ ...m, notifyEmail: e.target.checked }))} className="accent-amber-500" />
          Avisarme por email cuando llega una respuesta
        </label>
        <button onClick={() => saveForm()} disabled={saving} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-black text-black disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}>
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Guardar
        </button>
      </div>

      {/* Campos */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
        <h2 className="font-black text-white mb-4">Campos del formulario</h2>

        <div className="space-y-3">
          {fields.map((fld, i) => (
            <div key={fld.id} className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400/70">{typeLabel(fld.type)}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveField(i, -1)} disabled={i === 0} className="text-white/25 hover:text-amber-400 disabled:opacity-20"><ChevronUp size={14} /></button>
                  <button onClick={() => moveField(i, 1)} disabled={i === fields.length - 1} className="text-white/25 hover:text-amber-400 disabled:opacity-20"><ChevronDown size={14} /></button>
                  <button onClick={() => deleteField(fld.id)} className="text-white/30 hover:text-red-400 ml-1"><Trash2 size={13} /></button>
                </div>
              </div>
              <input defaultValue={fld.label} onBlur={e => patchField(fld.id, { label: e.target.value })} placeholder={fld.type === 'heading' ? 'Título de sección' : fld.type === 'button' ? 'Texto del botón' : 'Tu pregunta'} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50" />

              {fld.type === 'button' && (
                <>
                  <input defaultValue={fld.options?.[0] || ''} onBlur={e => patchField(fld.id, { options: [e.target.value] })} placeholder="Enlace del botón (https://...)" className="w-full mt-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 font-mono" />
                  <label className="flex items-center gap-2 text-[11px] text-white/50 mt-2 cursor-pointer">
                    <input type="checkbox" checked={!!fld.settings?.submits} onChange={e => patchField(fld.id, { settings: { ...(fld.settings || {}), submits: e.target.checked } })} className="accent-amber-500" />
                    Este botón envía el formulario (lo registra y redirige al enlace)
                  </label>
                </>
              )}

              {hasOptions(fld.type) && (
                <div className="mt-2 space-y-1.5">
                  {(fld.options || []).map((opt: string, oi: number) => (
                    <div key={oi} className="flex items-center gap-2">
                      <span className="text-white/25 text-xs">{fld.type === 'dropdown' ? `${oi + 1}.` : fld.type === 'checkbox' ? '☐' : '○'}</span>
                      <input defaultValue={opt} onBlur={e => setOption(fld, oi, e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/50" />
                      <button onClick={() => removeOption(fld, oi)} className="text-white/25 hover:text-red-400"><X size={13} /></button>
                    </div>
                  ))}
                  <button onClick={() => addOption(fld)} className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"><Plus size={11} /> Agregar opción</button>
                </div>
              )}

              {fld.type !== 'heading' && fld.type !== 'button' && (
                <label className="flex items-center gap-2 text-[11px] text-white/50 mt-2 cursor-pointer">
                  <input type="checkbox" checked={fld.required} onChange={e => patchField(fld.id, { required: e.target.checked })} className="accent-amber-500" /> Requerido
                </label>
              )}
            </div>
          ))}
        </div>

        {/* Agregar campo */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/8">
          <select value={addType} onChange={e => setAddType(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50">
            {FIELD_TYPES.map(t => <option key={t.type} value={t.type} className="bg-[#0d0d15]">{t.label}</option>)}
          </select>
          <button onClick={addField} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-black" style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}><Plus size={15} /> Agregar</button>
        </div>
      </div>
    </div>
  )
}
