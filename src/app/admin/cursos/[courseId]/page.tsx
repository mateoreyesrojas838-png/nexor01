'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Loader2, Save, Plus, Trash2, Upload, Film, CheckCircle2,
  Layers, X, AlertCircle, Image as ImageIcon, Eye, EyeOff, FileText, FileDown, ChevronUp, ChevronDown
} from 'lucide-react'

export default function AdminCourseEditor() {
  const { courseId } = useParams() as { courseId: string }
  const router = useRouter()
  const coverRef = useRef<HTMLInputElement>(null)

  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)

  const [form, setForm] = useState({ title: '', subtitle: '', description: '', price: '', whatYouLearn: '', coverUrl: '', freeForPlan: false, active: true })

  // Estado para agregar módulo / lección
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [addingModule, setAddingModule] = useState(false)
  const [lessonForms, setLessonForms] = useState<Record<string, { title: string; file: File | null; uploading: boolean; progress?: number }>>({})

  // Materiales (PDF / imágenes)
  const [resTitle, setResTitle] = useState('')
  const [resFile, setResFile] = useState<File | null>(null)
  const [resUploading, setResUploading] = useState(false)
  const resFileRef = useRef<HTMLInputElement>(null)

  const fetchCourse = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`)
      const data = await res.json()
      if (!res.ok) { router.push('/admin/cursos'); return }
      setCourse(data.course)
      setForm({
        title: data.course.title || '',
        subtitle: data.course.subtitle || '',
        description: data.course.description || '',
        price: String(data.course.price ?? ''),
        whatYouLearn: data.course.whatYouLearn || '',
        coverUrl: data.course.coverUrl || '',
        freeForPlan: !!data.course.freeForPlan,
        active: !!data.course.active,
      })
    } catch { setError('Error al cargar') }
    finally { setLoading(false) }
  }, [courseId, router])

  useEffect(() => { fetchCourse() }, [fetchCourse])

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(null), 2500) }

  async function saveCourse() {
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al guardar'); return }
      flash('Cambios guardados')
      fetchCourse()
    } catch { setError('Error de conexión') }
    finally { setSaving(false) }
  }

  async function uploadCover(file: File) {
    setUploadingCover(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al subir portada'); return }
      setForm(f => ({ ...f, coverUrl: data.url }))
      flash('Portada subida — recordá Guardar')
    } catch { setError('Error al subir portada') }
    finally { setUploadingCover(false) }
  }

  async function addModule() {
    if (!newModuleTitle.trim()) return
    setAddingModule(true)
    try {
      await fetch(`/api/admin/courses/${courseId}/modules`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newModuleTitle.trim() }),
      })
      setNewModuleTitle('')
      fetchCourse()
    } finally { setAddingModule(false) }
  }

  async function deleteModule(id: string) {
    if (!confirm('¿Eliminar este módulo y todas sus lecciones?')) return
    await fetch(`/api/admin/courses/modules/${id}`, { method: 'DELETE' })
    fetchCourse()
  }

  // Sube el video con progreso real (XHR expone onprogress; fetch no)
  function uploadVideoWithProgress(file: File, onProgress: (pct: number) => void): Promise<string> {
    return new Promise((resolve, reject) => {
      const fd = new FormData(); fd.append('file', file)
      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/admin/courses/upload-video')
      xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)) }
      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText)
          if (xhr.status >= 200 && xhr.status < 300 && data.videoPath) resolve(data.videoPath)
          else reject(new Error(data.error || 'Error al subir el video'))
        } catch { reject(new Error('Error al subir el video')) }
      }
      xhr.onerror = () => reject(new Error('Error de conexión al subir'))
      xhr.send(fd)
    })
  }

  function setLF(moduleId: string, patch: Partial<{ title: string; file: File | null; uploading: boolean; progress: number }>) {
    setLessonForms(prev => {
      const curr = prev[moduleId] || { title: '', file: null, uploading: false }
      return { ...prev, [moduleId]: { ...curr, ...patch } }
    })
  }

  async function addLesson(moduleId: string) {
    const lf = lessonForms[moduleId]
    if (!lf?.title?.trim()) { setError('Poné un título a la lección'); return }
    if (!lf?.file) { setError('Subí el video de la lección'); return }
    setLF(moduleId, { uploading: true, progress: 0 }); setError(null)
    try {
      // 1. Subir video al bucket privado (con progreso real)
      const videoPath = await uploadVideoWithProgress(lf.file, pct => setLF(moduleId, { progress: pct }))

      // 2. Crear la lección con la ruta del video
      const res = await fetch(`/api/admin/courses/modules/${moduleId}/lessons`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: lf.title.trim(), videoPath }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Error al crear la lección'); return }
      setLessonForms(prev => ({ ...prev, [moduleId]: { title: '', file: null, uploading: false } }))
      fetchCourse()
    } catch (e: any) { setError(e?.message || 'Error al agregar la lección') }
    finally { setLF(moduleId, { uploading: false }) }
  }

  async function deleteLesson(id: string) {
    if (!confirm('¿Eliminar esta lección y su video?')) return
    await fetch(`/api/admin/courses/lessons/${id}`, { method: 'DELETE' })
    fetchCourse()
  }

  async function addResource() {
    if (!resTitle.trim()) { setError('Poné un título al material'); return }
    if (!resFile) { setError('Elegí un PDF o imagen'); return }
    setResUploading(true); setError(null)
    try {
      const fd = new FormData(); fd.append('file', resFile)
      const up = await fetch('/api/admin/courses/upload-file', { method: 'POST', body: fd })
      const upData = await up.json()
      if (!up.ok) { setError(upData.error || 'Error al subir el archivo'); return }
      const res = await fetch(`/api/admin/courses/${courseId}/resources`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: resTitle.trim(), filePath: upData.filePath, kind: upData.kind }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Error al guardar el material'); return }
      setResTitle(''); setResFile(null); if (resFileRef.current) resFileRef.current.value = ''
      fetchCourse()
    } catch { setError('Error al agregar el material') }
    finally { setResUploading(false) }
  }

  async function deleteResource(id: string) {
    if (!confirm('¿Eliminar este material?')) return
    await fetch(`/api/admin/courses/resources/${id}`, { method: 'DELETE' })
    fetchCourse()
  }

  // Reordenar: intercambia el "order" con el vecino y refresca
  async function moveModule(mi: number, dir: -1 | 1) {
    const mods = course.modules
    const j = mi + dir
    if (j < 0 || j >= mods.length) return
    await Promise.all([
      fetch(`/api/admin/courses/modules/${mods[mi].id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: mods[j].order }) }),
      fetch(`/api/admin/courses/modules/${mods[j].id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: mods[mi].order }) }),
    ])
    fetchCourse()
  }

  async function moveLesson(mod: any, li: number, dir: -1 | 1) {
    const lessons = mod.lessons
    const j = li + dir
    if (j < 0 || j >= lessons.length) return
    await Promise.all([
      fetch(`/api/admin/courses/lessons/${lessons[li].id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: lessons[j].order }) }),
      fetch(`/api/admin/courses/lessons/${lessons[j].id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: lessons[li].order }) }),
    ])
    fetchCourse()
  }

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-amber-400" size={28} /></div>
  if (!course) return null

  return (
    <div className="max-w-3xl">
      <Link href="/admin/cursos" className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-white/60 mb-5"><ArrowLeft size={13} /> Volver a Cursos</Link>

      {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-2 text-red-400 text-sm"><AlertCircle size={16} className="shrink-0" /><p className="flex-1">{error}</p><button onClick={() => setError(null)}>✕</button></div>}
      {msg && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex gap-2 text-green-400 text-sm"><CheckCircle2 size={16} /> {msg}</div>}

      {/* ── Datos del curso ── */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-white">Datos del curso</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setForm(f => ({ ...f, active: !f.active }))} className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg ${form.active ? 'bg-green-500/15 text-green-400' : 'bg-white/10 text-white/40'}`}>
              {form.active ? <Eye size={13} /> : <EyeOff size={13} />} {form.active ? 'Activo' : 'Oculto'}
            </button>
          </div>
        </div>

        {/* Portada */}
        <div className="flex gap-4 mb-4">
          <div className="w-40 h-24 rounded-xl overflow-hidden bg-white/5 border border-white/10 shrink-0 flex items-center justify-center">
            {form.coverUrl ? <img src={form.coverUrl} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={22} className="text-white/15" />}
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <button onClick={() => coverRef.current?.click()} disabled={uploadingCover} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70 hover:bg-white/10 w-fit">
              {uploadingCover ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Subir portada
            </button>
            <p className="text-[11px] text-white/25 mt-1">JPG, PNG, WEBP</p>
            <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadCover(f) }} />
          </div>
        </div>

        <div className="space-y-3">
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Título" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50" />
          <input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="Subtítulo" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50" />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripción" rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 resize-none" />
          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/30">Qué van a aprender (una línea por ítem)</label>
            <textarea value={form.whatYouLearn} onChange={e => setForm(f => ({ ...f, whatYouLearn: e.target.value }))} placeholder={'Ej:\nA crear campañas\nA usar IA\nA vender más'} rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 resize-none mt-1" />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-[10px] uppercase tracking-widest text-white/30">Precio (USDT)</label>
              <input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} type="number" min="0" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 mt-1" />
            </div>
            <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer mt-4">
              <input type="checkbox" checked={form.freeForPlan} onChange={e => setForm(f => ({ ...f, freeForPlan: e.target.checked }))} className="accent-amber-500" />
              Gratis para quien tenga plan activo
            </label>
          </div>
          <button onClick={saveCourse} disabled={saving} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-black text-black disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Guardar cambios
          </button>
        </div>
      </div>

      {/* ── Módulos y lecciones ── */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
        <h2 className="font-black text-white flex items-center gap-2 mb-4"><Layers size={17} className="text-amber-400" /> Contenido del curso</h2>

        {/* Agregar módulo */}
        <div className="flex gap-2 mb-5">
          <input value={newModuleTitle} onChange={e => setNewModuleTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && addModule()} placeholder="Nombre del módulo (ej: Módulo 1 — Introducción)" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50" />
          <button onClick={addModule} disabled={addingModule} className="flex items-center gap-1.5 px-4 rounded-xl text-sm font-bold text-black disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}>
            {addingModule ? <Loader2 size={14} className="animate-spin" /> : <Plus size={15} />} Módulo
          </button>
        </div>

        {(course.modules || []).length === 0 ? (
          <p className="text-center text-white/25 text-sm py-8">Sin módulos todavía. Agregá el primero arriba.</p>
        ) : (
          <div className="space-y-4">
            {course.modules.map((mod: any, mi: number) => {
              const lf = lessonForms[mod.id] || { title: '', file: null, uploading: false }
              return (
                <div key={mod.id} className="rounded-xl border border-white/8 bg-white/[0.02]">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                    <p className="font-bold text-white text-sm">{mi + 1}. {mod.title}</p>
                    <div className="flex items-center gap-1">
                      <button onClick={() => moveModule(mi, -1)} disabled={mi === 0} className="text-white/25 hover:text-amber-400 disabled:opacity-20"><ChevronUp size={15} /></button>
                      <button onClick={() => moveModule(mi, 1)} disabled={mi === course.modules.length - 1} className="text-white/25 hover:text-amber-400 disabled:opacity-20"><ChevronDown size={15} /></button>
                      <button onClick={() => deleteModule(mod.id)} className="text-white/30 hover:text-red-400 ml-1"><Trash2 size={14} /></button>
                    </div>
                  </div>

                  {/* Lecciones */}
                  <div className="px-4 py-3 space-y-2">
                    {(mod.lessons || []).map((les: any, li: number) => (
                      <div key={les.id} className="flex items-center gap-2 text-sm">
                        <Film size={13} className="text-amber-400/70 shrink-0" />
                        <span className="text-white/70 flex-1 truncate">{li + 1}. {les.title}</span>
                        {les.videoPath ? <CheckCircle2 size={13} className="text-green-400 shrink-0" /> : <span className="text-[10px] text-amber-400">sin video</span>}
                        <button onClick={() => moveLesson(mod, li, -1)} disabled={li === 0} className="text-white/20 hover:text-amber-400 disabled:opacity-20"><ChevronUp size={13} /></button>
                        <button onClick={() => moveLesson(mod, li, 1)} disabled={li === mod.lessons.length - 1} className="text-white/20 hover:text-amber-400 disabled:opacity-20"><ChevronDown size={13} /></button>
                        <button onClick={() => deleteLesson(les.id)} className="text-white/25 hover:text-red-400"><Trash2 size={12} /></button>
                      </div>
                    ))}
                    {(mod.lessons || []).length === 0 && <p className="text-[11px] text-white/20">Sin lecciones aún.</p>}

                    {/* Agregar lección */}
                    <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                      <input value={lf.title} onChange={e => setLF(mod.id, { title: e.target.value })} placeholder="Título de la lección" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50" />
                      <div className="flex items-center gap-2">
                        <label className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-white/10 hover:border-amber-500/30 cursor-pointer text-xs text-white/40">
                          <Upload size={13} />
                          {lf.file ? <span className="text-white/70 truncate">{lf.file.name}</span> : 'Elegir video (MP4, MOV, WEBM)'}
                          <input type="file" accept="video/*" className="hidden" onChange={e => setLF(mod.id, { file: e.target.files?.[0] || null })} />
                        </label>
                        <button onClick={() => addLesson(mod.id)} disabled={lf.uploading} className="px-3 py-2 rounded-lg text-xs font-bold text-black disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}>
                          {lf.uploading ? <Loader2 size={13} className="animate-spin" /> : 'Agregar'}
                        </button>
                      </div>
                      {lf.uploading && (
                        <div>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${lf.progress ?? 0}%`, background: 'linear-gradient(90deg,#D97706,#FFD700)' }} />
                          </div>
                          <p className="text-[10px] text-amber-400/70 mt-1">Subiendo video... {lf.progress ?? 0}% · no cierres la página.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Materiales (PDF / imágenes) ── */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 mt-5">
        <h2 className="font-black text-white flex items-center gap-2 mb-1"><FileText size={17} className="text-amber-400" /> Materiales <span className="text-white/30 text-xs font-normal">(opcional)</span></h2>
        <p className="text-[11px] text-white/30 mb-4">PDFs e imágenes descargables para los alumnos del curso.</p>

        {(course.resources || []).length > 0 && (
          <div className="space-y-2 mb-4">
            {course.resources.map((r: any) => (
              <div key={r.id} className="flex items-center gap-2 text-sm bg-white/[0.02] rounded-lg px-3 py-2">
                {r.kind === 'IMAGE' ? <ImageIcon size={14} className="text-amber-400/70 shrink-0" /> : <FileDown size={14} className="text-amber-400/70 shrink-0" />}
                <span className="text-white/70 flex-1 truncate">{r.title}</span>
                <span className="text-[10px] text-white/30">{r.kind}</span>
                <button onClick={() => deleteResource(r.id)} className="text-white/25 hover:text-red-400"><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <input value={resTitle} onChange={e => setResTitle(e.target.value)} placeholder="Título del material (ej: Guía PDF Módulo 1)" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50" />
          <div className="flex items-center gap-2">
            <label className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-white/10 hover:border-amber-500/30 cursor-pointer text-xs text-white/40">
              <Upload size={13} />
              {resFile ? <span className="text-white/70 truncate">{resFile.name}</span> : 'Elegir PDF o imagen'}
              <input ref={resFileRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={e => setResFile(e.target.files?.[0] || null)} />
            </label>
            <button onClick={addResource} disabled={resUploading} className="px-3 py-2 rounded-lg text-xs font-bold text-black disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}>
              {resUploading ? <Loader2 size={13} className="animate-spin" /> : 'Agregar'}
            </button>
          </div>
          {resUploading && <p className="text-[10px] text-amber-400/70">Subiendo archivo...</p>}
        </div>
      </div>
    </div>
  )
}
