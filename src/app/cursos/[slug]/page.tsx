import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { GraduationCap, Lock, CheckCircle2, PlayCircle, Layers, Infinity as InfinityIcon, ShieldCheck } from 'lucide-react'
import { CourseCheckout } from '@/components/CourseCheckout'

export const dynamic = 'force-dynamic'

async function getCourse(slug: string) {
  return (prisma as any).course.findFirst({
    where: { slug, active: true },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: { lessons: { orderBy: { order: 'asc' }, select: { id: true, title: true } } },
      },
    },
  })
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const course = await getCourse(params.slug)
  if (!course) return { title: 'Curso no encontrado' }
  return {
    title: `${course.title} — Nexor`,
    description: course.subtitle || course.description?.slice(0, 150) || 'Curso en Nexor',
    openGraph: {
      title: course.title,
      description: course.subtitle || course.description?.slice(0, 150) || '',
      images: course.coverUrl ? [course.coverUrl] : [],
    },
  }
}

export default async function CourseLandingPage({ params }: { params: { slug: string } }) {
  const course = await getCourse(params.slug)
  if (!course) notFound()

  const price = Number(course.price)
  const learnItems = (course.whatYouLearn || '').split('\n').map((s: string) => s.trim()).filter(Boolean)
  const totalLessons = course.modules.reduce((acc: number, m: any) => acc + m.lessons.length, 0)

  const checkout = (
    <CourseCheckout courseId={course.id} courseTitle={course.title} price={price} freeForPlan={course.freeForPlan} />
  )

  return (
    <div className="min-h-screen text-white" style={{ background: '#0B0B12' }}>
      {/* ── HERO ── */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute -top-40 -left-32 w-[480px] h-[480px] rounded-full blur-[120px] pointer-events-none" style={{ background: 'rgba(245,158,11,0.10)' }} />
        <div className="relative max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-400/80 mb-3 flex items-center gap-2"><GraduationCap size={14} /> Academia Nexor</p>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.05]">{course.title}</h1>
            {course.subtitle && <p className="text-white/50 mt-4 text-lg leading-relaxed">{course.subtitle}</p>}

            <div className="flex flex-wrap items-center gap-2 mt-6">
              <span className="flex items-center gap-1.5 text-xs font-bold text-white/60 bg-white/5 border border-white/10 rounded-full px-3 py-1.5"><Layers size={13} className="text-amber-400" /> {course.modules.length} módulos</span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-white/60 bg-white/5 border border-white/10 rounded-full px-3 py-1.5"><PlayCircle size={13} className="text-amber-400" /> {totalLessons} lecciones</span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-white/60 bg-white/5 border border-white/10 rounded-full px-3 py-1.5"><InfinityIcon size={13} className="text-amber-400" /> Acceso de por vida</span>
            </div>

            <div className="mt-7 flex items-center gap-4">
              <span className="text-4xl font-black text-amber-400">${price.toFixed(2)} <span className="text-base text-white/30 font-normal">USDT</span></span>
              <a href="#comprar" className="px-7 py-3.5 rounded-2xl text-sm font-black text-black transition-all hover:brightness-110 active:scale-[0.98]" style={{ background: 'linear-gradient(135deg,#B45309,#D97706,#FFD700)', boxShadow: '0 8px 30px rgba(255,215,0,0.25)' }}>
                Obtener el curso →
              </a>
            </div>
            {course.freeForPlan && <p className="text-[12px] text-amber-300/80 mt-3">💡 Gratis si ya tenés un plan activo.</p>}
          </div>

          <div className="rounded-3xl overflow-hidden border border-white/10 bg-white/5 aspect-video flex items-center justify-center shadow-2xl shadow-black/40">
            {course.coverUrl ? <img src={course.coverUrl} alt={course.title} className="w-full h-full object-cover" /> : <GraduationCap size={56} className="text-white/15" />}
          </div>
        </div>
      </div>

      {/* ── CUERPO ── */}
      <div className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-3 gap-10">
        <div className="md:col-span-2 space-y-10">
          {course.description && (
            <div>
              <h2 className="text-xl font-black mb-3">Sobre el curso</h2>
              <p className="text-white/60 leading-relaxed whitespace-pre-line">{course.description}</p>
            </div>
          )}

          {learnItems.length > 0 && (
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
              <h2 className="text-xl font-black mb-4">Qué vas a aprender</h2>
              <ul className="grid sm:grid-cols-2 gap-3">
                {learnItems.map((it: string, i: number) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-white/65"><CheckCircle2 size={16} className="text-amber-400 shrink-0 mt-0.5" /> {it}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h2 className="text-xl font-black mb-4">Contenido del curso</h2>
            <p className="text-xs text-white/30 mb-3">{course.modules.length} módulos · {totalLessons} lecciones</p>
            <div className="space-y-2">
              {course.modules.map((m: any, mi: number) => (
                <div key={m.id} className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                  <p className="font-bold text-white/85 text-sm mb-2 flex items-center gap-2"><span className="text-amber-400">{mi + 1}.</span> {m.title}</p>
                  <ul className="space-y-1.5 pl-1">
                    {m.lessons.map((l: any, li: number) => (
                      <li key={l.id} className="flex items-center gap-2 text-[13px] text-white/45">
                        <Lock size={11} className="text-white/25 shrink-0" /> {mi + 1}.{li + 1} {l.title}
                      </li>
                    ))}
                    {m.lessons.length === 0 && <li className="text-[12px] text-white/25">Próximamente</li>}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Checkout (registro + pago) */}
        <div className="md:col-span-1">
          <div id="comprar" className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5 sticky top-6 scroll-mt-6">
            {checkout}
            <div className="mt-4 pt-4 border-t border-white/8 space-y-2">
              <p className="flex items-center gap-2 text-[11px] text-white/40"><InfinityIcon size={13} className="text-amber-400" /> Acceso de por vida</p>
              <p className="flex items-center gap-2 text-[11px] text-white/40"><ShieldCheck size={13} className="text-amber-400" /> Pago seguro (USDT BEP-20 o comprobante)</p>
              <p className="flex items-center gap-2 text-[11px] text-white/40"><PlayCircle size={13} className="text-amber-400" /> {totalLessons} lecciones en video</p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-[11px] text-white/20 pb-10">Powered by Nexor</p>
    </div>
  )
}
