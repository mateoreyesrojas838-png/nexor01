export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyBscTransaction } from '@/lib/blockchain'
import { addCredits } from '@/lib/ai-credits'
import { createNotification } from '@/lib/notifications'

const TX_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/

async function notifyAdmins(title: string, body: string) {
  try {
    const admins = await prisma.user.findMany({ where: { isAdmin: true }, select: { id: true } })
    await Promise.all(admins.map(a => createNotification(a.id, title, body, '/admin/pagos/credit')))
  } catch { /* */ }
}

/** POST /api/credits/topup — recarga de créditos por Comprobante (MANUAL) o USDT (CRYPTO). */
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const amountUsd = parseFloat(body.amountUsd ?? body.amount)
  if (!amountUsd || amountUsd <= 0 || amountUsd > 500) {
    return NextResponse.json({ error: 'Monto inválido (entre $1 y $500).' }, { status: 400 })
  }
  const isCrypto = body.paymentMethod === 'CRYPTO'
  const txHash = (body.txHash as string) ?? null
  const proofUrl = (body.proofUrl as string) ?? null

  // ───────── CRIPTO (USDT BEP-20) ─────────
  if (isCrypto) {
    if (!txHash || !TX_HASH_REGEX.test(txHash)) return NextResponse.json({ error: 'Hash de transacción inválido.' }, { status: 400 })
    const dup = await (prisma as any).creditTopup.findUnique({ where: { txHash } })
    if (dup) return NextResponse.json({ error: 'Este hash ya fue utilizado.' }, { status: 409 })

    const verification = await verifyBscTransaction(txHash, amountUsd)
    if (verification.success) {
      const topup = await prisma.$transaction(async (tx) => {
        const t = await (tx as any).creditTopup.create({
          data: {
            userId: user.id, amountUsd, paymentMethod: 'CRYPTO', txHash,
            blockNumber: verification.blockNumber ?? null, status: 'APPROVED',
            notes: `Auto-aprobado on-chain. USDT: ${verification.amountUsdt?.toFixed(2)}`,
          },
        })
        await tx.user.update({ where: { id: user.id }, data: { aiCreditsUsd: { increment: amountUsd } } })
        return t
      })
      return NextResponse.json({ success: true, status: 'approved', message: `¡Se acreditaron $${amountUsd.toFixed(2)} a tu saldo!`, id: topup.id })
    }

    const t = await (prisma as any).creditTopup.create({
      data: { userId: user.id, amountUsd, paymentMethod: 'CRYPTO', txHash, status: 'PENDING_VERIFICATION' },
    })
    return NextResponse.json({ success: true, status: 'pending_verification', message: 'Transacción recibida. Verificando en la blockchain (unos minutos).', id: t.id })
  }

  // ───────── MANUAL (comprobante) ─────────
  if (!proofUrl) return NextResponse.json({ error: 'Subí tu comprobante de pago.' }, { status: 400 })
  const t = await (prisma as any).creditTopup.create({
    data: { userId: user.id, amountUsd, paymentMethod: 'MANUAL', proofUrl, status: 'PENDING' },
  })
  notifyAdmins('Nueva recarga de créditos', `${user.fullName || user.email} cargó $${amountUsd.toFixed(2)} (comprobante). Revisá y aprobá.`)
  return NextResponse.json({ success: true, status: 'pending', message: 'Comprobante recibido. El equipo lo revisará y acreditará tu saldo.', id: t.id })
}
