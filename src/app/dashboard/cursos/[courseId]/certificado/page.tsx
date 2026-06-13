'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ArrowLeft, Printer, Award } from 'lucide-react'

export default function CertificatePage() {
  const { courseId } = useParams() as { courseId: string }
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [courseTitle, setCourseTitle] = useState('')
  const [ok, setOk] = useState(false)
  const [reason, setReason] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const [meRes, cRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch(`/api/courses/${courseId}`),
        ])
        const me = meRes.ok ? await meRes.json() : null
        const data = cRes.ok ? await cRes.json() : null
        if (me?.fullName) setName(me.fullName)
        if (!data?.course) { setReason('Curso no encontrado'); return }
        setCourseTitle(data.course.title)
        if (!data.hasAccess) { setReason('No tenés acceso a este curso'); return }
        const lessons = (data.course.modules || []).flatMap((m: any) => m.lessons)
        const done = lessons.filter((l: any) => l.completed).length
        if (lessons.length === 0 || done < lessons.length) { setReason('Completá el 100% del curso para obtener tu certificado'); return }
        setOk(true)
      } catch { setReason('Error al cargar') }
      finally { setLoading(false) }
    })()
  }, [courseId])

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-amber-400" size={28} /></div>

  if (!ok) return (
    <div className="px-4 pt-10 max-w-md mx-auto text-center text-white">
      <Award size={40} className="mx-auto text-white/20 mb-3" />
      <p className="text-white/60">{reason}</p>
      <Link href={`/dashboard/cursos/${courseId}`} className="inline-block mt-4 text-amber-400 text-sm font-bold">← Volver al curso</Link>
    </div>
  )

  const today = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="px-4 py-8 max-w-3xl mx-auto text-white">
      <style>{`@media print { body * { visibility: hidden !important; } #cert, #cert * { visibility: visible !important; } #cert { position: absolute; top: 0; left: 0; width: 100%; } .no-print { display: none !important; } }`}</style>

      <div className="flex items-center justify-between mb-5 no-print">
        <Link href={`/dashboard/cursos/${courseId}`} className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-white/70"><ArrowLeft size={13} /> Volver</Link>
        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black text-black" style={{ background: 'linear-gradient(135deg,#D97706,#FFD700)' }}>
          <Printer size={15} /> Descargar / Imprimir
        </button>
      </div>

      {/* Certificado */}
      <div id="cert" className="rounded-3xl p-10 text-center" style={{ background: 'linear-gradient(135deg,#0d0d15,#15110a)', border: '2px solid rgba(255,215,0,0.4)' }}>
        <div className="flex justify-center mb-4"><Award size={48} style={{ color: '#FFD700' }} /></div>
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-400/70">Certificado de finalización</p>
        <p className="text-white/40 text-sm mt-6">Se otorga el presente certificado a</p>
        <h1 className="text-3xl md:text-4xl font-black my-3" style={{ color: '#FFD700' }}>{name || 'Alumno'}</h1>
        <p className="text-white/40 text-sm">por haber completado exitosamente el curso</p>
        <h2 className="text-xl md:text-2xl font-black text-white mt-3 mb-8">{courseTitle}</h2>
        <div className="flex items-center justify-between mt-10 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="text-left">
            <p className="text-[10px] uppercase tracking-widest text-white/30">Fecha</p>
            <p className="text-sm text-white/70">{today}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-black" style={{ background: 'linear-gradient(135deg,#FFD700,#B45309)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>NEXOR</p>
            <p className="text-[10px] uppercase tracking-widest text-white/30">Academia</p>
          </div>
        </div>
      </div>
    </div>
  )
}
