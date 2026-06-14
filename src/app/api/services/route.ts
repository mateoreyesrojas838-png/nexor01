export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/** GET — servicios ACTIVOS (para dashboard/navbar). Público a usuarios logueados. */
export async function GET() {
  const services = await (prisma as any).service.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
    select: { key: true, name: true, description: true, slug: true, sellSeparately: true },
  })
  return NextResponse.json({ services })
}
