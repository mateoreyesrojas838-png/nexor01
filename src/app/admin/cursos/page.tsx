'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, GraduationCap, Users, Layers, X, AlertCircle } from 'lucide-react'

interface CourseRow {
  id: string
  title: string
  slug: string
  price: number
  active: boolean
  freeForPlan: boolean
  coverUrl: string | null
  _count?: { modules: number; enrollments: number }
}

export default function AdminCoursesPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<CourseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({ title: '', subtitle: '', description: '', price: '', freeForPlan: false })

  useEffect(() => { fetchCourses() }, [])

  async function fetchCourses() {
    try {
      const res = await fetch('/api/admin/courses')
      const data = await res.json()
      setCourses(data.courses || [])
    } catch { setError('Error al cargar cursos') }
    finally { setLoading(false) }
  }

  async function createCourse() {
    if (!form.title.trim()) { setError('El título es requerido'); return }
    setCreating(true); setError(null)
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al crear'); return }
      router.push(`/admin/cursos/${data.course.id}`)
    } catch { setError('Error de conexión') }
    finally { setCreating(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="animate-spin text-amber-400" size={28} />
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2"><GraduationCap size={20} className="text-amber-400" /> Cursos</h1>
          <p className="text-xs text-white/30 mt-0.5">Creá cursos por módulos y subí los videos.</p>
        </div>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-black" style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}>
          <Plus size={15} /> Nuevo curso
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-2 text-red-400 text-sm">
          <AlertCircle size={16} className="shrink-0" /> <p className="flex-1">{error}</p>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {courses.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          <GraduationCap size={36} className="mx-auto mb-3 text-white/15" />
          <p className="text-sm">No hay cursos todavía.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(c => (
            <Link key={c.id} href={`/admin/cursos/${c.id}`} className="rounded-2xl border border-white/8 bg-white/[0.03] overflow-hidden hover:border-amber-500/30 transition-all">
              <div className="h-28 bg-white/5 relative">
                {c.coverUrl ? <img src={c.coverUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><GraduationCap size={28} className="text-white/15" /></div>}
                <span className={`absolute top-2 right-2 text-[10px] font-black px-2 py-0.5 rounded-lg ${c.active ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}`}>{c.active ? 'Activo' : 'Oculto'}</span>
              </div>
              <div className="p-4">
                <p className="font-bold text-white truncate">{c.title}</p>
                <p className="text-amber-400 font-black mt-0.5">${c.price.toFixed(2)} <span className="text-[10px] text-white/30 font-normal">USDT</span></p>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-white/40">
                  <span className="flex items-center gap-1"><Layers size={11} /> {c._count?.modules ?? 0} módulos</span>
                  <span className="flex items-center gap-1"><Users size={11} /> {c._count?.enrollments ?? 0} inscriptos</span>
                </div>
                {c.freeForPlan && <span className="inline-block mt-2 text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded">Gratis con plan</span>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal nuevo curso */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowNew(false)}>
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d0d15] p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-white">Nuevo curso</h2>
              <button onClick={() => setShowNew(false)} className="text-white/40 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Título del curso" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50" />
              <input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="Subtítulo (opcional)" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50" />
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripción" rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 resize-none" />
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-[10px] uppercase tracking-widest text-white/30">Precio (USDT)</label>
                  <input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} type="number" min="0" placeholder="49" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 mt-1" />
                </div>
                <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer mt-4">
                  <input type="checkbox" checked={form.freeForPlan} onChange={e => setForm(f => ({ ...f, freeForPlan: e.target.checked }))} className="accent-amber-500" />
                  Gratis con plan
                </label>
              </div>
              <button onClick={createCourse} disabled={creating} className="w-full py-3 rounded-xl text-sm font-black text-black disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}>
                {creating ? <Loader2 size={15} className="animate-spin inline" /> : 'Crear y continuar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
