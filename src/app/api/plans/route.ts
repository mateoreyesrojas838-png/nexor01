export const dynamic = 'force-dynamic'
export const revalidate = 0
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const num = (v: any) => (v == null ? null : Number(v))

/**
 * GET /api/plans — público. Packs activos con precios por período y los
 * servicios que incluye cada uno (nombres legibles para mostrar).
 */
export async function GET() {
  try {
    const [plans, services] = await Promise.all([
      (prisma as any).planConfig.findMany({ where: { active: true }, orderBy: { order: 'asc' } }),
      (prisma as any).service.findMany({ where: { active: true }, select: { key: true, name: true } }),
    ])
    const nameByKey: Record<string, string> = {}
    services.forEach((s: any) => { nameByKey[s.key] = s.name })

    return NextResponse.json({
      plans: plans.map((p: any) => {
        // Servicios incluidos (solo los activos), con key + nombre legible
        const included = (p.services || [])
          .filter((k: string) => nameByKey[k])
          .map((k: string) => ({ key: k, name: nameByKey[k] }))
        return {
          plan: p.plan,
          name: p.name,
          tagline: p.tagline,
          services: p.services,
          serviceNames: included.map((s: any) => s.name),
          includedServices: included, // [{ key, name }]
          prices: {
            MONTHLY: num(p.priceMonthly),
            QUARTERLY: num(p.priceQuarterly),
            ANNUAL: num(p.priceAnnual),
          },
        }
      }),
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[GET /api/plans]', err)
    return NextResponse.json({ plans: [] })
  }
}
