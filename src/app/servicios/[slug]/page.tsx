import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { CheckCircle2, ShieldCheck, Zap, Layers, ArrowRight } from 'lucide-react'
import { SERVICE_UI } from '@/lib/services-ui'
import { ServiceCheckout } from '@/components/ServiceCheckout'

export const dynamic = 'force-dynamic'

async function getService(slug: string) {
  return (prisma as any).service.findUnique({ where: { slug } })
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const s = await getService(params.slug)
  if (!s) return { title: 'Servicio no encontrado' }
  return {
    title: `${s.name} — Nexor`,
    description: s.description?.slice(0, 150) || 'Servicio en Nexor',
    openGraph: { title: s.name, description: s.description?.slice(0, 150) || '', images: s.coverUrl ? [s.coverUrl] : [] },
  }
}

export default async function ServiceLandingPage({ params }: { params: { slug: string } }) {
  const s = await getService(params.slug)
  if (!s || !s.active || !s.sellSeparately) notFound()

  const ui = SERVICE_UI[s.key] || { href: '/dashboard', color: '#F59E0B', icon: 'fa-solid fa-cube' }
  const features = (s.features || '').split('\n').map((x: string) => x.trim()).filter(Boolean)
  const prices = {
    MONTHLY: s.priceMonthly == null ? null : Number(s.priceMonthly),
    QUARTERLY: s.priceQuarterly == null ? null : Number(s.priceQuarterly),
    ANNUAL: s.priceAnnual == null ? null : Number(s.priceAnnual),
  }

  return (
    <div className="min-h-screen text-white" style={{ background: '#0B0B12' }}>
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute -top-40 -left-32 w-[480px] h-[480px] rounded-full blur-[120px] pointer-events-none" style={{ background: `${ui.color}1a` }} />
        <div className="relative max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: `${ui.color}1f`, border: `1px solid ${ui.color}40` }}>
              <i className={ui.icon} style={{ color: ui.color, fontSize: 22 }} />
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.05]">{s.name}</h1>
            {s.description && <p className="text-white/50 mt-4 text-lg leading-relaxed whitespace-pre-line">{s.description}</p>}
            <div className="mt-7 flex items-center gap-4">
              <a href="#comprar" className="px-7 py-3.5 rounded-2xl text-sm font-black text-black transition-all hover:brightness-110 active:scale-[0.98]" style={{ background: 'linear-gradient(135deg,#B45309,#D97706,#FFD700)', boxShadow: '0 8px 30px rgba(255,215,0,0.25)' }}>
                Activar servicio →
              </a>
            </div>
          </div>
          <div className="rounded-3xl overflow-hidden border border-white/10 bg-white/5 aspect-video flex items-center justify-center shadow-2xl shadow-black/40">
            {s.coverUrl ? <img src={s.coverUrl} alt={s.name} className="w-full h-full object-cover" /> : <i className={ui.icon} style={{ color: `${ui.color}55`, fontSize: 56 }} />}
          </div>
        </div>
      </div>

      {/* Cuerpo */}
      <div className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-3 gap-10">
        <div className="md:col-span-2 space-y-10">
          {features.length > 0 && (
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
              <h2 className="text-xl font-black mb-4">Qué incluye</h2>
              <ul className="grid sm:grid-cols-2 gap-3">
                {features.map((f: string, i: number) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-white/65"><CheckCircle2 size={16} className="text-amber-400 shrink-0 mt-0.5" /> {f}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
            <h2 className="text-xl font-black mb-3 flex items-center gap-2"><Zap size={18} className="text-amber-400" /> Cómo funciona</h2>
            <ol className="space-y-2 text-sm text-white/60">
              <li>1. Creá tu cuenta (o iniciá sesión) acá mismo.</li>
              <li>2. Elegí el plan (mensual, 3 meses o anual) y pagá con USDT o comprobante.</li>
              <li>3. El servicio se activa y lo usás desde tu panel.</li>
            </ol>
          </div>
        </div>

        <div className="md:col-span-1">
          <div id="comprar" className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5 sticky top-6 scroll-mt-6">
            <ServiceCheckout serviceKey={s.key} serviceSlug={s.slug} serviceName={s.name} serviceHref={ui.href} prices={prices} />

            {/* Segunda opción: conseguirlo dentro de un plan/pack */}
            <div className="mt-4 pt-4 border-t border-white/8">
              <p className="text-[11px] text-white/40 mb-2 text-center">¿Querés más servicios? Conseguilo dentro de un pack:</p>
              <Link href="/dashboard/planes" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl text-sm font-bold border border-amber-500/30 bg-white/[0.03] text-amber-300 hover:bg-amber-500/10 transition-all">
                <Layers size={15} /> Ver planes <ArrowRight size={14} />
              </Link>
            </div>

            <div className="mt-4 pt-4 border-t border-white/8 space-y-2">
              <p className="flex items-center gap-2 text-[11px] text-white/40"><ShieldCheck size={13} className="text-amber-400" /> Pago seguro (USDT BEP-20 o comprobante)</p>
              <p className="flex items-center gap-2 text-[11px] text-white/40"><Zap size={13} className="text-amber-400" /> Activación al confirmar el pago</p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-[11px] text-white/20 pb-10">Powered by Nexor</p>
    </div>
  )
}
