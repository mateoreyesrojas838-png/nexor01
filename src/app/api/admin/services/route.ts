export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'

/** GET — todos los servicios (admin) */
export async function GET() {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  const services = await (prisma as any).service.findMany({ orderBy: { order: 'asc' } })
  return NextResponse.json({
    services: services.map((s: any) => ({
      ...s,
      priceMonthly: s.priceMonthly == null ? null : Number(s.priceMonthly),
      priceQuarterly: s.priceQuarterly == null ? null : Number(s.priceQuarterly),
      priceAnnual: s.priceAnnual == null ? null : Number(s.priceAnnual),
    })),
  })
}
