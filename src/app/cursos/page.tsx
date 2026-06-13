import Link from 'next/link'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { GraduationCap, Layers, PlayCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Cursos — Nexor',
  description: 'Aprendé con nuestros cursos en video. Marketing, IA, ventas y más.',
}

export default async function PublicCoursesCatalog() {
  const courses = await (prisma as any).course.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, title: true, subtitle: true, slug: true, coverUrl: true, price: true,
      _count: { select: { modules: true } },
    },
  })

  return (
    <div className="min-h-screen text-white" style={{ background: '#0B0B12' }}>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <p className="text-[11px] font-black uppercase tracking-widest text-amber-400/70 mb-2 flex items-center justify-center gap-2"><GraduationCap size={15} /> Academia Nexor</p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Cursos en video</h1>
          <p className="text-white/40 mt-2">Aprendé a tu ritmo. Acceso de por vida.</p>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-24 text-white/30">
            <GraduationCap size={40} className="mx-auto mb-3 text-white/15" />
            <p>Pronto vamos a publicar cursos. ¡Volvé pronto!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((c: any) => (
              <Link key={c.id} href={`/cursos/${c.slug}`} className="rounded-2xl border border-white/8 bg-white/[0.03] overflow-hidden hover:border-amber-500/30 transition-all group">
                <div className="h-40 bg-white/5 relative">
                  {c.coverUrl ? <img src={c.coverUrl} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center"><GraduationCap size={34} className="text-white/15" /></div>}
                </div>
                <div className="p-4">
                  <p className="font-black text-white truncate">{c.title}</p>
                  {c.subtitle && <p className="text-xs text-white/40 truncate mt-0.5">{c.subtitle}</p>}
                  <div className="flex items-center justify-between mt-3">
                    <span className="flex items-center gap-1 text-[11px] text-white/40"><Layers size={11} /> {c._count?.modules ?? 0} módulos</span>
                    <span className="text-amber-400 font-black">${Number(c.price).toFixed(2)} <span className="text-[10px] text-white/30 font-normal">USDT</span></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
