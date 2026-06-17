import { prisma } from './prisma'

// Defaults si el pack no tiene límite configurado. 0 = ilimitado.
export const DEFAULT_LIMITS: Record<string, Record<string, number>> = {
  BASIC: { whatsapp: 1, crm: 500, social: 15, ads: 5, 'image-studio': 20, formularios: 3 },
  PRO: { whatsapp: 2, crm: 2000, social: 30, ads: 15, 'image-studio': 50, formularios: 10 },
  ELITE: { whatsapp: 5, crm: 0, social: 50, ads: 30, 'image-studio': 150, formularios: 0 },
}

// Servicios que tienen límite de uso (Imágenes va por créditos AI; Herramientas no se limita).
export const LIMITABLE = ['whatsapp', 'crm', 'social', 'ads', 'formularios']

// Cómo se cuenta cada servicio: por mes (se reinicia) o total acumulado.
export const PERIOD_KIND: Record<string, 'month' | 'total'> = {
  whatsapp: 'total', formularios: 'total',
  crm: 'month', social: 'month', ads: 'month',
}

// Texto del límite para mensajes al usuario.
export const LIMIT_LABEL: Record<string, string> = {
  whatsapp: 'agentes AI', crm: 'mensajes por mes', social: 'publicaciones por mes',
  ads: 'campañas por mes', 'image-studio': 'imágenes por mes', formularios: 'formularios',
}

const PLAN_NAMES: Record<string, string> = { NONE: 'Sin plan', BASIC: 'Pack Básico', PRO: 'Pack Pro', ELITE: 'Pack Elite' }

function monthStart() { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) }

/** Límite numérico del plan para un servicio (0 = ilimitado). */
export async function getLimit(plan: string, serviceKey: string): Promise<number> {
  if (!plan || plan === 'NONE') return 0
  const cfg = await (prisma as any).planConfig.findUnique({ where: { plan }, select: { limits: true } })
  const v = cfg?.limits?.[serviceKey]
  if (v != null && v !== '' && !isNaN(Number(v))) return Number(v)
  return DEFAULT_LIMITS[plan]?.[serviceKey] ?? 0
}

/** Cuenta el uso actual del usuario para un servicio (mes o total según corresponda). */
export async function countUsage(userId: string, serviceKey: string): Promise<number> {
  const gte = monthStart()
  switch (serviceKey) {
    case 'whatsapp':
      return prisma.bot.count({ where: { userId, NOT: { name: { startsWith: '__crm__' } } } })
    case 'formularios':
      return (prisma as any).form.count({ where: { userId } })
    case 'social':
      return (prisma as any).socialPost.count({ where: { userId, createdAt: { gte } } })
    case 'ads':
      return (prisma as any).adCampaignV2.count({ where: { userId, createdAt: { gte } } })
    case 'crm':
      return (prisma as any).broadcastLog.count({ where: { campaign: { userId }, sentAt: { gte } } })
    default:
      return 0
  }
}

export interface UsageCheck { allowed: boolean; unlimited: boolean; limit: number; used: number; plan: string; message?: string }

/**
 * ¿Puede el usuario hacer `add` usos más de este servicio?
 * - Sin plan activo (acceso por suscripción suelta) → sin límite.
 * - Con plan: aplica el límite configurado (0 = ilimitado).
 */
export async function checkUsage(userId: string, serviceKey: string, add = 1): Promise<UsageCheck> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true, planExpiresAt: true } })
  const planActive = !!user && user.plan !== 'NONE' && (!user.planExpiresAt || user.planExpiresAt > new Date())
  if (!planActive) return { allowed: true, unlimited: true, limit: 0, used: 0, plan: user?.plan || 'NONE' }

  const limit = await getLimit(user!.plan, serviceKey)
  if (!limit || limit <= 0) return { allowed: true, unlimited: true, limit: 0, used: 0, plan: user!.plan }

  const used = await countUsage(userId, serviceKey)
  const allowed = used + add <= limit
  return {
    allowed, unlimited: false, limit, used, plan: user!.plan,
    message: allowed ? undefined : `Tu ${PLAN_NAMES[user!.plan]} permite ${limit} ${LIMIT_LABEL[serviceKey] || 'usos'}. Ya usaste ${used}. Subí de plan para más.`,
  }
}
