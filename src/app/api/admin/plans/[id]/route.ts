export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'

/** PATCH — edita un pack: nombre, tagline, servicios incluidos, precios por período, activo */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  const b = await req.json()
  const data: any = {}
  if (b.name !== undefined) data.name = String(b.name).trim()
  if (b.tagline !== undefined) data.tagline = b.tagline || null
  if (b.active !== undefined) data.active = !!b.active
  if (b.services !== undefined) data.services = Array.isArray(b.services) ? b.services.map(String) : []
  const num = (v: any) => (v === '' || v == null ? null : (isNaN(parseFloat(v)) ? undefined : parseFloat(v)))
  if (b.priceMonthly !== undefined) data.priceMonthly = num(b.priceMonthly)
  if (b.priceQuarterly !== undefined) data.priceQuarterly = num(b.priceQuarterly)
  if (b.priceAnnual !== undefined) data.priceAnnual = num(b.priceAnnual)

  const plan = await (prisma as any).planConfig.update({ where: { id: params.id }, data })
  return NextResponse.json({
    plan: {
      ...plan,
      priceMonthly: plan.priceMonthly == null ? null : Number(plan.priceMonthly),
      priceQuarterly: plan.priceQuarterly == null ? null : Number(plan.priceQuarterly),
      priceAnnual: plan.priceAnnual == null ? null : Number(plan.priceAnnual),
    },
  })
}
