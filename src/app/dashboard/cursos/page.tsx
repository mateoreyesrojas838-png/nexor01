'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { GraduationCap, Loader2, Layers, CheckCircle2, Lock } from 'lucide-react'

interface CourseRow {
  id: string
  title: string
  subtitle: string | null
  coverUrl: string | null
  price: number
  freeForPlan: boolean
  hasAccess: boolean
  _count?: { modules: number }
}

export default function CoursesCatalogPage() {
  const [courses, setCourses] = useState<CourseRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/courses').then(r => r.json()).then(d => setCourses(d.courses || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-amber-400" size={32} /></div>

  return (
    <div className="px-4 md:px-6 pt-6 max-w-screen-xl mx-auto pb-24 text-white">
      <div className="mb-6">
        <h1 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2"><GraduationCap size={22} className="text-amber-400" /> Cursos</h1>
        <p className="text-white/40 text-sm mt-0.5">Aprendé con nuestros cursos en video.</p>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-24 text-white/30">
          <GraduationCap size={36} className="mx-auto mb-3 text-white/15" />
          <p className="text-sm">Todavía no hay cursos disponibles.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map(c => (
            <Link key={c.id} href={`/dashboard/cursos/${c.id}`} className="rounded-2xl border border-white/8 bg-white/[0.03] overflow-hidden hover:border-amber-500/30 transition-all group">
              <div className="h-36 bg-white/5 relative">
                {c.coverUrl ? <img src={c.coverUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><GraduationCap size={32} className="text-white/15" /></div>}
                {c.hasAccess ? (
                  <span className="absolute top-2 right-2 text-[10px] font-black px-2 py-1 rounded-lg bg-green-500/20 text-green-400 flex items-center gap-1"><CheckCircle2 size={11} /> Tenés acceso</span>
                ) : (
                  <span className="absolute top-2 right-2 text-[10px] font-black px-2 py-1 rounded-lg bg-black/50 text-white/70 flex items-center gap-1"><Lock size={11} /> Bloqueado</span>
                )}
              </div>
              <div className="p-4">
                <p className="font-black text-white truncate">{c.title}</p>
                {c.subtitle && <p className="text-xs text-white/40 truncate mt-0.5">{c.subtitle}</p>}
                <div className="flex items-center justify-between mt-3">
                  <span className="flex items-center gap-1 text-[11px] text-white/40"><Layers size={11} /> {c._count?.modules ?? 0} módulos</span>
                  {c.hasAccess
                    ? <span className="text-xs font-bold text-green-400">Entrar →</span>
                    : <span className="text-amber-400 font-black text-sm">${c.price.toFixed(2)} <span className="text-[10px] text-white/30 font-normal">USDT</span></span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
