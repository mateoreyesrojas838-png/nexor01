export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { getServiceAccess } from '@/lib/service-access'

/** GET — servicios ACTIVOS + si el usuario tiene acceso a cada uno (dashboard/navbar). */
export async function GET() {
  const services = await (prisma as any).service.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
    select: { key: true, name: true, description: true, slug: true, sellSeparately: true, priceMonthly: true, priceQuarterly: true, priceAnnual: true },
  })

  let access: Record<string, boolean> = {}
  const user = await getAuthUser()
  if (user) access = await getServiceAccess(user.id)

  return NextResponse.json({
    services: services.map((s: any) => {
      // ¿se puede comprar suelto? sellSeparately + al menos un precio configurado
      const sellable = !!s.sellSeparately && [s.priceMonthly, s.priceQuarterly, s.priceAnnual].some((p: any) => p != null && Number(p) > 0)
      return { key: s.key, name: s.name, description: s.description, slug: s.slug, sellSeparately: s.sellSeparately, sellable, hasAccess: !!access[s.key] }
    }),
  })
}
