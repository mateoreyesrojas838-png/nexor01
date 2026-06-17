export const dynamic = 'force-dynamic'
export const revalidate = 0
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const num = (v: any) => (v == null ? null : Number(v))

// Límites por defecto si el pack no los configuró (coincide con lib/usage-limits)
const DEFAULT_LIMITS: Record<string, Record<string, number>> = {
  BASIC: { whatsapp: 1, crm: 500, social: 15, ads: 5, 'image-studio': 20, formularios: 3 },
  PRO: { whatsapp: 2, crm: 2000, social: 30, ads: 15, 'image-studio': 50, formularios: 10 },
  ELITE: { whatsapp: 5, crm: 0, social: 50, ads: 30, 'image-studio': 150, formularios: 0 },
}

/** Línea de detalle legible por servicio, según el límite configurado del plan. */
function detailFor(plan: string, key: string, limits: any): string {
  const n = Number(limits?.[key] ?? DEFAULT_LIMITS[plan]?.[key] ?? 0)
  const cap = (txt: string) => (n > 0 ? `Hasta ${n} ${txt}` : `${txt} ilimitados`)
  switch (key) {
    case 'whatsapp': return n > 0 ? `${n} agente${n > 1 ? 's' : ''} AI en WhatsApp` : 'Agentes AI ilimitados'
    case 'crm': return n > 0 ? `Hasta ${n} mensajes/mes (envíos masivos)` : 'Envíos masivos ilimitados'
    case 'social': return n > 0 ? `Hasta ${n} publicaciones/mes` : 'Publicaciones ilimitadas'
    case 'ads': return n > 0 ? `Hasta ${n} campañas de ads/mes` : 'Campañas de ads ilimitadas'
    case 'formularios': return n > 0 ? `Hasta ${n} formularios` : 'Formularios ilimitados'
    case 'image-studio': return 'Generador de imágenes con IA'
    case 'herramientas': return 'Plantillas, biblioteca y guiones'
    default: return 'Incluido'
  }
}

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
          .map((k: string) => ({ key: k, name: nameByKey[k], detail: detailFor(p.plan, k, p.limits) }))
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
