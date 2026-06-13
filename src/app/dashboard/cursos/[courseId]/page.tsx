'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Loader2, Lock, CheckCircle2, PlayCircle, Film, ChevronDown, Clock, AlertCircle
} from 'lucide-react'

interface Lesson { id: string; title: string; durationSec: number; order: number; hasVideo: boolean; completed: boolean }
interface Module { id: string; title: string; order: number; lessons: Lesson[] }
interface CourseData {
  id: string; title: string; subtitle: string | null; description: string; coverUrl: string | null
  price: number; freeForPlan: boolean; whatYouLearn: string | null; modules: Module[]
}

function fmtDur(s: number) {
  if (!s) return ''
  const m = Math.floor(s / 60), sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

export default function CoursePlayerPage() {
  const { courseId } = useParams() as { courseId: string }
  const [course, setCourse] = useState<CourseData | null>(null)
  const [hasAccess, setHasAccess] = useState(false)
  const [enrollmentStatus, setEnrollmentStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState<Lesson | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [loadingVideo, setLoadingVideo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({})

  const fetchCourse = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}`)
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error'); return }
      setCourse(data.course)
      setHasAccess(data.hasAccess)
      setEnrollmentStatus(data.enrollmentStatus)
      // abrir el primer módulo por defecto
      if (data.course?.modules?.[0]) setOpenModules({ [data.course.modules[0].id]: true })
    } catch { setError('Error al cargar el curso') }
    finally { setLoading(false) }
  }, [courseId])

  useEffect(() => { fetchCourse() }, [fetchCourse])

  async function playLesson(lesson: Lesson) {
    if (!lesson.hasVideo) { setError('Esta lección aún no tiene video'); return }
    setCurrent(lesson); setVideoUrl(null); setLoadingVideo(true); setError(null)
    try {
      const res = await fetch(`/api/courses/${courseId}/lessons/${lesson.id}/play`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'No se pudo cargar el video'); return }
      setVideoUrl(data.url)
    } catch { setError('Error al cargar el video') }
    finally { setLoadingVideo(false) }
  }

  async function markComplete(lessonId: string) {
    try {
      await fetch(`/api/courses/lessons/${lessonId}/progress`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed: true }),
      })
      setCourse(prev => prev ? {
        ...prev,
        modules: prev.modules.map(m => ({ ...m, lessons: m.lessons.map(l => l.id === lessonId ? { ...l, completed: true } : l) })),
      } : prev)
    } catch { /* silencioso */ }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-amber-400" size={32} /></div>
  if (!course) return (
    <div className="px-4 pt-6 max-w-screen-md mx-auto text-white">
      <Link href="/dashboard/cursos" className="text-white/40 text-sm">← Volver</Link>
      <p className="mt-6 text-red-400">{error || 'Curso no encontrado'}</p>
    </div>
  )

  const allLessons = course.modules.flatMap(m => m.lessons)
  const total = allLessons.length
  const done = allLessons.filter(l => l.completed).length
  const pct = total ? Math.round((done / total) * 100) : 0
  const learnItems = (course.whatYouLearn || '').split('\n').map(s => s.trim()).filter(Boolean)

  return (
    <div className="px-4 md:px-6 pt-6 max-w-screen-xl mx-auto pb-24 text-white">
      <Link href="/dashboard/cursos" className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-white/60 mb-5"><ArrowLeft size={13} /> Volver a Cursos</Link>

      <div className="mb-5">
        <h1 className="text-2xl font-black tracking-tight">{course.title}</h1>
        {course.subtitle && <p className="text-white/40 text-sm mt-0.5">{course.subtitle}</p>}
      </div>

      {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-2 text-red-400 text-sm"><AlertCircle size={16} className="shrink-0" /><p className="flex-1">{error}</p><button onClick={() => setError(null)}>✕</button></div>}

      {/* ── SIN ACCESO ── */}
      {!hasAccess ? (
        <div className="grid md:grid-cols-3 gap-5">
          <div className="md:col-span-2 space-y-4">
            <div className="rounded-2xl overflow-hidden border border-white/8 bg-white/[0.03] relative">
              {course.coverUrl ? <img src={course.coverUrl} alt="" className="w-full max-h-72 object-cover" /> : <div className="h-48 flex items-center justify-center"><Film size={40} className="text-white/15" /></div>}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="text-center">
                  <Lock size={28} className="mx-auto text-white/70 mb-2" />
                  <p className="text-sm font-bold text-white/80">Contenido bloqueado</p>
                </div>
              </div>
            </div>
            {course.description && <p className="text-white/60 text-sm leading-relaxed whitespace-pre-line">{course.description}</p>}
            {learnItems.length > 0 && (
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-xs font-black uppercase tracking-widest text-white/30 mb-2">Qué vas a aprender</p>
                <ul className="space-y-1.5">
                  {learnItems.map((it, i) => <li key={i} className="flex items-start gap-2 text-sm text-white/60"><CheckCircle2 size={14} className="text-amber-400 shrink-0 mt-0.5" /> {it}</li>)}
                </ul>
              </div>
            )}
            {/* Temario (bloqueado) */}
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <p className="text-xs font-black uppercase tracking-widest text-white/30 mb-3">Contenido</p>
              {course.modules.map((m, i) => (
                <div key={m.id} className="mb-2">
                  <p className="text-sm font-bold text-white/70">{i + 1}. {m.title}</p>
                  <p className="text-[11px] text-white/30 ml-3">{m.lessons.length} lecciones</p>
                </div>
              ))}
            </div>
          </div>
          {/* Caja de compra */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5 h-fit">
            {enrollmentStatus === 'PENDING_VERIFICATION' ? (
              <div className="text-center">
                <Clock size={26} className="mx-auto text-amber-400 mb-2" />
                <p className="text-sm font-bold text-amber-300">Verificando tu pago...</p>
                <p className="text-xs text-white/40 mt-1">En cuanto se confirme, se desbloquea el curso.</p>
              </div>
            ) : enrollmentStatus === 'PENDING' ? (
              <div className="text-center">
                <Clock size={26} className="mx-auto text-amber-400 mb-2" />
                <p className="text-sm font-bold text-amber-300">Pago en revisión</p>
                <p className="text-xs text-white/40 mt-1">El equipo está verificando tu comprobante.</p>
              </div>
            ) : (
              <>
                <p className="text-3xl font-black text-white">${course.price.toFixed(2)} <span className="text-sm text-white/30 font-normal">USDT</span></p>
                <p className="text-xs text-white/40 mt-1 mb-4">Acceso de por vida al curso.</p>
                {/* La compra se habilita en la Fase 3 */}
                <button disabled className="w-full py-3 rounded-xl text-sm font-black text-black opacity-60 cursor-not-allowed" style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}>
                  Comprar (próximamente)
                </button>
                {course.freeForPlan && <p className="text-[11px] text-amber-300/80 mt-3 text-center">💡 Este curso es gratis si tenés un plan activo.</p>}
              </>
            )}
          </div>
        </div>
      ) : (
        /* ── CON ACCESO: reproductor ── */
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Player */}
          <div className="lg:col-span-2 space-y-3">
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-black aspect-video flex items-center justify-center">
              {loadingVideo ? (
                <Loader2 className="animate-spin text-amber-400" size={32} />
              ) : videoUrl ? (
                <video
                  key={videoUrl}
                  src={videoUrl}
                  controls
                  autoPlay
                  controlsList="nodownload noplaybackrate"
                  disablePictureInPicture
                  onContextMenu={e => e.preventDefault()}
                  onEnded={() => current && markComplete(current.id)}
                  className="w-full h-full"
                />
              ) : (
                <div className="text-center text-white/30">
                  <PlayCircle size={40} className="mx-auto mb-2 text-white/20" />
                  <p className="text-sm">Elegí una lección para empezar</p>
                </div>
              )}
            </div>
            {current && (
              <div className="flex items-center justify-between">
                <p className="font-bold text-white">{current.title}</p>
                {!current.completed && videoUrl && (
                  <button onClick={() => markComplete(current.id)} className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1">
                    <CheckCircle2 size={14} /> Marcar como vista
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Temario */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] overflow-hidden h-fit">
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-black uppercase tracking-widest text-white/40">Contenido</p>
                <span className="text-xs text-white/40">{done}/{total}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#D97706,#FFD700)' }} />
              </div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {course.modules.map((m, mi) => {
                const open = openModules[m.id]
                return (
                  <div key={m.id} className="border-b border-white/5">
                    <button onClick={() => setOpenModules(p => ({ ...p, [m.id]: !p[m.id] }))} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02]">
                      <span className="text-sm font-bold text-white/80">{mi + 1}. {m.title}</span>
                      <ChevronDown size={14} className={`text-white/30 transition-transform ${open ? 'rotate-180' : ''}`} />
                    </button>
                    {open && (
                      <div className="pb-2">
                        {m.lessons.map((l, li) => {
                          const active = current?.id === l.id
                          return (
                            <button key={l.id} onClick={() => playLesson(l)} disabled={!l.hasVideo}
                              className={`w-full flex items-center gap-2 px-4 py-2 text-left text-sm transition-all ${active ? 'bg-amber-500/10 text-amber-300' : 'text-white/55 hover:bg-white/[0.03]'} ${!l.hasVideo ? 'opacity-40' : ''}`}>
                              {l.completed ? <CheckCircle2 size={14} className="text-green-400 shrink-0" /> : <PlayCircle size={14} className="shrink-0 text-white/30" />}
                              <span className="flex-1 truncate">{mi + 1}.{li + 1} {l.title}</span>
                              {l.durationSec > 0 && <span className="text-[10px] text-white/25">{fmtDur(l.durationSec)}</span>}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
