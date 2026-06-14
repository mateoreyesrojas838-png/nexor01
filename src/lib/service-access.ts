import { prisma } from '@/lib/prisma'

export const PERIOD_DAYS: Record<string, number> = { MONTHLY: 30, QUARTERLY: 90, ANNUAL: 365 }
export const PERIOD_LABEL: Record<string, string> = { MONTHLY: 'Mensual', QUARTERLY: '3 meses', ANNUAL: 'Anual' }

/** Devuelve el plan vigente del usuario (o null si no tiene). */
async function getActivePlan(userId: string): Promise<string | null> {
  const now = new Date()
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true, planExpiresAt: true } })
  if (!user || user.plan === 'NONE') return null
  if (user.planExpiresAt && user.planExpiresAt <= now) return null
  return user.plan
}

/**
 * Conjunto de keys que desbloquea el plan vigente.
 * Si el pack tiene una lista de servicios configurada → solo esos.
 * Si no hay PlanConfig o la lista está vacía → todos (backward compatible).
 */
async function planUnlockedKeys(plan: string, activeKeys: string[]): Promise<Set<string>> {
  const cfg = await (prisma as any).planConfig.findUnique({ where: { plan }, select: { services: true } })
  if (!cfg || !Array.isArray(cfg.services) || cfg.services.length === 0) {
    return new Set(activeKeys) // sin configurar → desbloquea todo (no rompe a quienes ya pagaron)
  }
  return new Set(cfg.services.filter((k: string) => activeKeys.includes(k)))
}

/** Mapa { serviceKey: hasAccess } para todos los servicios ACTIVOS. */
export async function getServiceAccess(userId: string): Promise<Record<string, boolean>> {
  const services = await (prisma as any).service.findMany({ where: { active: true }, select: { key: true } })
  const activeKeys: string[] = services.map((s: any) => s.key)
  const map: Record<string, boolean> = {}

  const unlocked = new Set<string>()

  const plan = await getActivePlan(userId)
  if (plan) {
    const planKeys = await planUnlockedKeys(plan, activeKeys)
    planKeys.forEach(k => unlocked.add(k))
  }

  // Suscripciones individuales vigentes (suman acceso al del pack)
  const subs = await (prisma as any).serviceSubscription.findMany({
    where: { userId, status: 'APPROVED', expiresAt: { gt: new Date() } },
    select: { serviceKey: true },
  })
  subs.forEach((s: any) => unlocked.add(s.serviceKey))

  for (const k of activeKeys) map[k] = unlocked.has(k)
  return map
}

/** ¿Puede el usuario usar este servicio? (activo + (pack que lo incluye | suscripción vigente)) */
export async function userCanUseService(userId: string, serviceKey: string): Promise<boolean> {
  const service = await (prisma as any).service.findUnique({ where: { key: serviceKey }, select: { active: true } })
  if (!service?.active) return false

  const plan = await getActivePlan(userId)
  if (plan) {
    const cfg = await (prisma as any).planConfig.findUnique({ where: { plan }, select: { services: true } })
    const list: string[] = cfg?.services ?? []
    if (list.length === 0 || list.includes(serviceKey)) return true
  }

  const sub = await (prisma as any).serviceSubscription.findFirst({
    where: { userId, serviceKey, status: 'APPROVED', expiresAt: { gt: new Date() } },
    select: { id: true },
  })
  return !!sub
}
