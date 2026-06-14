import { prisma } from '@/lib/prisma'

export const PERIOD_DAYS: Record<string, number> = { MONTHLY: 30, QUARTERLY: 90, ANNUAL: 365 }
export const PERIOD_LABEL: Record<string, string> = { MONTHLY: 'Mensual', QUARTERLY: '3 meses', ANNUAL: 'Anual' }

async function hasActivePlan(userId: string): Promise<boolean> {
  const now = new Date()
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true, planExpiresAt: true } })
  return !!user && user.plan !== 'NONE' && (!user.planExpiresAt || user.planExpiresAt > now)
}

/** Mapa { serviceKey: hasAccess } para todos los servicios ACTIVOS. */
export async function getServiceAccess(userId: string): Promise<Record<string, boolean>> {
  const services = await (prisma as any).service.findMany({ where: { active: true }, select: { key: true } })
  const map: Record<string, boolean> = {}

  if (await hasActivePlan(userId)) {
    for (const s of services) map[s.key] = true
    return map
  }

  const subs = await (prisma as any).serviceSubscription.findMany({
    where: { userId, status: 'APPROVED', expiresAt: { gt: new Date() } },
    select: { serviceKey: true },
  })
  const subKeys = new Set(subs.map((s: any) => s.serviceKey))
  for (const s of services) map[s.key] = subKeys.has(s.key)
  return map
}

/** ¿Puede el usuario usar este servicio? (activo + plan vigente o suscripción vigente) */
export async function userCanUseService(userId: string, serviceKey: string): Promise<boolean> {
  const service = await (prisma as any).service.findUnique({ where: { key: serviceKey }, select: { active: true } })
  if (!service?.active) return false
  if (await hasActivePlan(userId)) return true
  const sub = await (prisma as any).serviceSubscription.findFirst({
    where: { userId, serviceKey, status: 'APPROVED', expiresAt: { gt: new Date() } },
    select: { id: true },
  })
  return !!sub
}
