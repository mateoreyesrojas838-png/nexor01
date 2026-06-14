export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/** GET público — datos del servicio para su landing de venta (solo si activo y se vende por separado). */
export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const s = await (prisma as any).service.findUnique({ where: { slug: params.slug } })
  if (!s || !s.active) return NextResponse.json({ error: 'Servicio no disponible' }, { status: 404 })
  if (!s.sellSeparately) return NextResponse.json({ error: 'Este servicio no se vende por separado.' }, { status: 403 })

  return NextResponse.json({
    service: {
      key: s.key, name: s.name, slug: s.slug, description: s.description, coverUrl: s.coverUrl,
      features: s.features,
      priceMonthly: s.priceMonthly == null ? null : Number(s.priceMonthly),
      priceQuarterly: s.priceQuarterly == null ? null : Number(s.priceQuarterly),
      priceAnnual: s.priceAnnual == null ? null : Number(s.priceAnnual),
    },
  })
}
