import { prisma } from '@/lib/prisma'

export const PERIOD_DAYS: Record<string, number> = { MONTHLY: 30, QUARTERLY: 90, ANNUAL: 365 }
export const PERIOD_LABEL: Record<string, string> = { MONTHLY: 'Mensual', QUARTERLY: '3 meses', ANNUAL: 'Anual' }
export type PlanPeriod = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'

export function normalizePeriod(p: any): PlanPeriod {
  return p === 'QUARTERLY' || p === 'ANNUAL' ? p : 'MONTHLY'
}

export function periodDays(p: any): number {
  return PERIOD_DAYS[normalizePeriod(p)]
}

/**
 * Nueva fecha de vencimiento. Si renueva (mismo plan aún vigente) extiende desde
 * el vencimiento actual; si no, parte de ahora.
 */
export function computeExpiry(period: any, currentExpiry: Date | null, isRenewal: boolean): Date {
  const now = new Date()
  const base = isRenewal && currentExpiry && currentExpiry > now ? currentExpiry : now
  return new Date(base.getTime() + periodDays(period) * 86400000)
}

const PRICE_FIELD: Record<PlanPeriod, string> = {
  MONTHLY: 'priceMonthly',
  QUARTERLY: 'priceQuarterly',
  ANNUAL: 'priceAnnual',
}

/** Precio del pack para el período (desde PlanConfig). null si ese período no está configurado. */
export async function planPriceFor(plan: string, period: any): Promise<number | null> {
  const cfg = await (prisma as any).planConfig.findUnique({ where: { plan } })
  if (!cfg) return null
  const v = cfg[PRICE_FIELD[normalizePeriod(period)]]
  return v == null ? null : Number(v)
}
