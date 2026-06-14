export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'

/** PATCH — edita/activa/desactiva un servicio */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  const b = await req.json()
  const data: any = {}
  if (b.name !== undefined) data.name = String(b.name).trim()
  if (b.description !== undefined) data.description = b.description || null
  if (b.coverUrl !== undefined) data.coverUrl = b.coverUrl || null
  if (b.features !== undefined) data.features = b.features || null
  if (b.active !== undefined) data.active = !!b.active
  if (b.sellSeparately !== undefined) data.sellSeparately = !!b.sellSeparately
  const num = (v: any) => (v === '' || v == null ? null : (isNaN(parseFloat(v)) ? undefined : parseFloat(v)))
  if (b.priceMonthly !== undefined) data.priceMonthly = num(b.priceMonthly)
  if (b.priceQuarterly !== undefined) data.priceQuarterly = num(b.priceQuarterly)
  if (b.priceAnnual !== undefined) data.priceAnnual = num(b.priceAnnual)

  const service = await (prisma as any).service.update({ where: { id: params.id }, data })
  return NextResponse.json({
    service: {
      ...service,
      priceMonthly: service.priceMonthly == null ? null : Number(service.priceMonthly),
      priceQuarterly: service.priceQuarterly == null ? null : Number(service.priceQuarterly),
      priceAnnual: service.priceAnnual == null ? null : Number(service.priceAnnual),
    },
  })
}
