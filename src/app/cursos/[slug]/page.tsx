import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { GraduationCap, Lock, CheckCircle2, PlayCircle, Layers } from 'lucide-react'

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

  // Si no hay sesión, el CTA manda a registrarse y vuelve solo al curso después
  const isLogged = !!cookies().get('auth_token')?.value
  const courseUrl = `/dashboard/cursos/${course.id}`
  const goUrl = isLogged ? courseUrl : `/register?redirect=${encodeURIComponent(courseUrl)}`

  return (
    <div className="min-h-screen text-white" style={{ background: '#0B0B12' }}>
      {/* Hero */}
      <div className="border-b border-white/5" style={{ background: 'linear-gradient(180deg, rgba(245,158,11,0.06), transparent)' }}>
        <div className="max-w-5xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-amber-400/70 mb-2 flex items-center gap-2"><GraduationCap size={14} /> Curso</p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">{course.title}</h1>
            {course.subtitle && <p className="text-white/50 mt-3 text-lg">{course.subtitle}</p>}
            <div className="flex items-center gap-4 mt-5 text-sm text-white/40">
              <span className="flex items-center gap-1.5"><Layers size={14} /> {course.modules.length} módulos</span>
              <span className="flex items-center gap-1.5"><PlayCircle size={14} /> {totalLessons} lecciones</span>
            </div>
            <div className="mt-6 flex items-center gap-4">
              <span className="text-3xl font-black text-amber-400">${price.toFixed(2)} <span className="text-sm text-white/30 font-normal">USDT</span></span>
              <Link href={goUrl} className="px-6 py-3 rounded-2xl text-sm font-black text-black transition-all hover:brightness-110" style={{ background: 'linear-gradient(135deg,#B45309,#D97706,#FFD700)' }}>
                Obtener el curso →
              </Link>
            </div>
            {course.freeForPlan && <p className="text-[12px] text-amber-300/80 mt-3">💡 Gratis si tenés un plan activo.</p>}
          </div>
          <div className="rounded-3xl overflow-hidden border border-white/10 bg-white/5 aspect-video flex items-center justify-center">
            {course.coverUrl ? <img src={course.coverUrl} alt={course.title} className="w-full h-full object-cover" /> : <GraduationCap size={48} className="text-white/15" />}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Bloques armados por el admin (video / texto / mockups) */}
          {Array.isArray(course.landingBlocks) && course.landingBlocks.length > 0 && (
            <div className="space-y-6">
              {course.landingBlocks.map((blk: any, i: number) => (
                blk.type === 'text' ? (
                  <div key={i}>
                    {blk.title && <h2 className="text-xl font-black mb-2">{blk.title}</h2>}
                    {blk.body && <p className="text-white/60 leading-relaxed whitespace-pre-line">{blk.body}</p>}
                  </div>
                ) : blk.type === 'video' ? (
                  <video key={i} src={blk.url} controls className="w-full rounded-2xl bg-black border border-white/10" />
                ) : (
                  <img key={i} src={blk.url} alt="" className="w-full rounded-2xl border border-white/10" />
                )
              ))}
            </div>
          )}
          {course.description && (
            <div>
              <h2 className="text-lg font-black mb-3">Descripción</h2>
              <p className="text-white/60 leading-relaxed whitespace-pre-line">{course.description}</p>
            </div>
          )}
          {learnItems.length > 0 && (
            <div>
              <h2 className="text-lg font-black mb-3">Qué vas a aprender</h2>
              <ul className="grid sm:grid-cols-2 gap-2">
                {learnItems.map((it: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/60"><CheckCircle2 size={15} className="text-amber-400 shrink-0 mt-0.5" /> {it}</li>
                ))}
              </ul>
            </div>
          )}
          {/* Temario bloqueado */}
          <div>
            <h2 className="text-lg font-black mb-3">Contenido del curso</h2>
            <div className="space-y-2">
              {course.modules.map((m: any, mi: number) => (
                <div key={m.id} className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                  <p className="font-bold text-white/80 text-sm mb-2">{mi + 1}. {m.title}</p>
                  <ul className="space-y-1">
                    {m.lessons.map((l: any, li: number) => (
                      <li key={l.id} className="flex items-center gap-2 text-[13px] text-white/45">
                        <Lock size={11} className="text-white/25 shrink-0" /> {mi + 1}.{li + 1} {l.title}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Caja lateral de precio */}
        <div className="md:col-span-1">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5 sticky top-6">
            <p className="text-3xl font-black">${price.toFixed(2)} <span className="text-sm text-white/30 font-normal">USDT</span></p>
            <p className="text-xs text-white/40 mt-1 mb-4">Acceso de por vida.</p>
            <Link href={goUrl} className="block text-center px-6 py-3 rounded-2xl text-sm font-black text-black transition-all hover:brightness-110" style={{ background: 'linear-gradient(135deg,#B45309,#D97706,#FFD700)' }}>
              Obtener el curso
            </Link>
            <p className="text-[11px] text-white/30 mt-3 text-center">Pago con USDT (BEP-20) o comprobante.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
