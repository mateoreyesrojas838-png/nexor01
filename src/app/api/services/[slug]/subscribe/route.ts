export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { verifyBscTransaction } from '@/lib/blockchain'
import { PERIOD_DAYS } from '@/lib/service-access'
import { createNotification } from '@/lib/notifications'

const TX_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/
const PERIODS = ['MONTHLY', 'QUARTERLY', 'ANNUAL']

function priceFor(service: any, period: string): number | null {
  const v = period === 'ANNUAL' ? service.priceAnnual : period === 'QUARTERLY' ? service.priceQuarterly : service.priceMonthly
  return v == null ? null : Number(v)
}

async function notifyAdmins(title: string, body: string) {
  try {
    const admins = await prisma.user.findMany({ where: { isAdmin: true }, select: { id: true } })
    await Promise.all(admins.map(a => createNotification(a.id, title, body, '/admin/servicios')))
  } catch { /* */ }
}

/** POST /api/services/[slug]/subscribe — compra de un servicio por período. Body: { period, paymentMethod, txHash?, proofUrl? } */
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const service = await (prisma as any).service.findUnique({ where: { slug: params.slug } })
  if (!service || !service.active || !service.sellSeparately) {
    return NextResponse.json({ error: 'Servicio no disponible para compra.' }, { status: 404 })
  }

  const body = await req.json().catch(() => ({}))
  const period = PERIODS.includes(body.period) ? body.period : 'MONTHLY'
  const isCrypto = body.paymentMethod === 'CRYPTO'
  const txHash = (body.txHash as string) ?? null
  const proofUrl = (body.proofUrl as string) ?? null

  const price = priceFor(service, period)
  if (price == null || price <= 0) return NextResponse.json({ error: 'Este período no tiene precio configurado.' }, { status: 400 })

  // ¿Ya tiene acceso o una solicitud pendiente?
  const now = new Date()
  const active = await (prisma as any).serviceSubscription.findFirst({ where: { userId: user.id, serviceKey: service.key, status: 'APPROVED', expiresAt: { gt: now } } })
  if (active) return NextResponse.json({ error: 'Ya tenés acceso vigente a este servicio.' }, { status: 409 })
  const pending = await (prisma as any).serviceSubscription.findFirst({ where: { userId: user.id, serviceKey: service.key, status: { in: ['PENDING', 'PENDING_VERIFICATION'] } } })
  if (pending) return NextResponse.json({ error: 'Ya tenés una solicitud pendiente para este servicio.' }, { status: 409 })

  const expiresAt = new Date(now.getTime() + (PERIOD_DAYS[period] || 30) * 24 * 60 * 60 * 1000)

  // ───────── CRIPTO (USDT BEP-20) ─────────
  if (isCrypto) {
    if (!txHash || !TX_HASH_REGEX.test(txHash)) return NextResponse.json({ error: 'Hash de transacción inválido.' }, { status: 400 })
    const dup = await (prisma as any).serviceSubscription.findUnique({ where: { txHash } })
    if (dup) return NextResponse.json({ error: 'Este hash de transacción ya fue utilizado.' }, { status: 409 })

    const verification = await verifyBscTransaction(txHash, price)
    const approved = verification.success

    const sub = await (prisma as any).serviceSubscription.create({
      data: {
        userId: user.id, serviceKey: service.key, period, price,
        paymentMethod: 'CRYPTO', txHash, blockNumber: verification.blockNumber ?? null,
        status: approved ? 'APPROVED' : 'PENDING_VERIFICATION',
        expiresAt: approved ? expiresAt : null,
        notes: approved ? `Auto-aprobado on-chain. USDT: ${verification.amountUsdt?.toFixed(2)}` : null,
      },
    })

    return NextResponse.json({
      success: true,
      status: approved ? 'approved' : 'pending_verification',
      message: approved ? '¡Servicio activado! Pago verificado on-chain.' : 'Transacción recibida. Verificando en la blockchain (unos minutos).',
      subscription: { id: sub.id, status: sub.status },
    })
  }

  // ───────── MANUAL (comprobante) ─────────
  if (!proofUrl) return NextResponse.json({ error: 'Subí tu comprobante de pago.' }, { status: 400 })

  const sub = await (prisma as any).serviceSubscription.create({
    data: { userId: user.id, serviceKey: service.key, period, price, paymentMethod: 'MANUAL', proofUrl, status: 'PENDING' },
  })
  notifyAdmins('Nueva compra de servicio', `${user.fullName || user.email} compró "${service.name}" (${period}). Revisá y aprobá.`)

  return NextResponse.json({ success: true, status: 'pending', message: 'Comprobante recibido. El equipo lo revisará y activará el servicio.', subscription: { id: sub.id, status: sub.status } })
}
