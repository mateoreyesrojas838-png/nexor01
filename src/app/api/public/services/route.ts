export const dynamic = 'force-dynamic'
export const revalidate = 0
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const numMin = (...vals: any[]) => {
  const nums = vals.map(v => (v == null ? null : Number(v))).filter((n): n is number => n != null && n > 0)
  return nums.length ? Math.min(...nums) : null
}

/** GET /api/public/services — público. Servicios vendibles (con precio) + packs activos. */
export async function GET() {
  try {
    const [svcs, packs] = await Promise.all([
      (prisma as any).service.findMany({ where: { active: true, sellSeparately: true }, orderBy: { order: 'asc' } }),
      (prisma as any).planConfig.findMany({ where: { active: true }, orderBy: { order: 'asc' } }),
    ])

    const services = svcs
      .map((s: any) => ({ key: s.key, name: s.name, slug: s.slug, description: s.description, coverUrl: s.coverUrl, features: s.features, minPrice: numMin(s.priceMonthly, s.priceQuarterly, s.priceAnnual) }))
      .filter((s: any) => s.minPrice != null) // solo los que tienen precio configurado

    const plans = packs
      .map((p: any) => ({ plan: p.plan, name: p.name, tagline: p.tagline, monthly: p.priceMonthly == null ? null : Number(p.priceMonthly), services: (p.services || []).length }))
      .filter((p: any) => p.monthly != null && p.monthly > 0)

    return NextResponse.json({ services, plans }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[GET /api/public/services]', err)
    return NextResponse.json({ services: [], plans: [] })
  }
}
