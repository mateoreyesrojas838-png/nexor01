export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'

const PERIOD_LABEL: Record<string, string> = { MONTHLY: 'Mensual', QUARTERLY: '3 meses', ANNUAL: 'Anual' }

/** GET — suscripciones a servicios que requieren acción (manual pendiente o verificación cripto) */
export async function GET() {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  const subs = await (prisma as any).serviceSubscription.findMany({
    where: { status: { in: ['PENDING', 'PENDING_VERIFICATION'] } },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { fullName: true, email: true } } },
  })
  const services = await (prisma as any).service.findMany({ select: { key: true, name: true } })
  const nameByKey: Record<string, string> = {}
  for (const s of services) nameByKey[s.key] = s.name

  return NextResponse.json({
    subscriptions: subs.map((s: any) => ({
      id: s.id, status: s.status, paymentMethod: s.paymentMethod, proofUrl: s.proofUrl, txHash: s.txHash,
      period: s.period, periodLabel: PERIOD_LABEL[s.period] || s.period, price: Number(s.price),
      serviceName: nameByKey[s.serviceKey] || s.serviceKey, createdAt: s.createdAt, user: s.user,
    })),
  })
}
