export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'

const num = (v: any) => (v === '' || v == null ? null : Number(v))

/** GET — packs configurables + catálogo de servicios activos para los checkboxes */
export async function GET() {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  const [plans, services] = await Promise.all([
    (prisma as any).planConfig.findMany({ orderBy: { order: 'asc' } }),
    (prisma as any).service.findMany({ where: { active: true }, orderBy: { order: 'asc' }, select: { key: true, name: true } }),
  ])

  return NextResponse.json({
    plans: plans.map((p: any) => ({
      ...p,
      priceMonthly: num(p.priceMonthly),
      priceQuarterly: num(p.priceQuarterly),
      priceAnnual: num(p.priceAnnual),
    })),
    services,
  })
}
