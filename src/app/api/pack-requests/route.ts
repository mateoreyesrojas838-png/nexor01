export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyBscTransaction } from '@/lib/blockchain'
import { normalizePeriod, planPriceFor, computeExpiry } from '@/lib/plan-period'

const PRICE_DEFAULTS: Record<string, number> = {
  BASIC: 49, PRO: 99, ELITE: 199,
}

const TX_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/

/** GET /api/pack-requests — lista las solicitudes del usuario autenticado */
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const requests = await prisma.packPurchaseRequest.findMany({
      where: {
        userId: user.id,
        // Exclude Libélula records — those are handled automatically, not manually
        NOT: { notes: { startsWith: 'LIBELULA:' } },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        plan: true,
        price: true,
        status: true,
        notes: true,
        paymentProofUrl: true,
        paymentMethod: true,
        txHash: true,
        blockNumber: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      requests: requests.map(r => ({
        ...r,
        price: Number(r.price),
        blockNumber: r.blockNumber?.toString() ?? null,
      })),
    })
  } catch (err) {
    console.error('[GET /api/pack-requests]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

/** POST /api/pack-requests — crea una nueva solicitud de compra (Manual, HGW o Cripto USDT) */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json()
    const { plan, paymentProofUrl } = body
    const period = normalizePeriod(body.period)
    const isCrypto = body.paymentMethod === 'CRYPTO'
    const txHash = (body.txHash as string) ?? null

    const validPlans = ['BASIC', 'PRO', 'ELITE']
    if (!plan || !validPlans.includes(plan)) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }

    // Validaciones por método de pago
    if (!isCrypto && !paymentProofUrl) {
      return NextResponse.json({ error: 'Debes subir tu comprobante de pago.' }, { status: 400 })
    }
    if (isCrypto && (!txHash || !TX_HASH_REGEX.test(txHash))) {
      return NextResponse.json({ error: 'Hash de transacción inválido.' }, { status: 400 })
    }

    // ¿Es renovación? (compra del mismo plan que ya tiene)
    const isRenewal = user.plan === plan

    // No puede haber otra solicitud pendiente (manual o esperando verificación on-chain)
    const existing = await prisma.packPurchaseRequest.findFirst({
      where: { userId: user.id, status: { in: ['PENDING', 'PENDING_VERIFICATION'] } },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Ya tienes una solicitud pendiente. Espera a que sea procesada.' },
        { status: 409 }
      )
    }

    // Precio real desde la DB — nunca confiar en el frontend.
    // Prioridad: PlanConfig (por período). Fallback solo para mensual: setting PRICE_{plan} → default.
    let price = await planPriceFor(plan, period)
    if (price == null && period === 'MONTHLY') {
      const s = await prisma.appSetting.findUnique({ where: { key: `PRICE_${plan}` } })
      price = s?.value ? parseFloat(s.value) : PRICE_DEFAULTS[plan]
    }
    if (!price || price <= 0) {
      return NextResponse.json({ error: 'Ese período no está disponible para este plan.' }, { status: 400 })
    }

    // ─────────────── Pago con CRIPTO (USDT BEP-20) ───────────────
    if (isCrypto) {
      // Anti double-spend: el hash no puede haberse usado antes
      const existingTx = await prisma.packPurchaseRequest.findUnique({ where: { txHash: txHash! } })
      if (existingTx) {
        return NextResponse.json({ error: 'Este hash de transacción ya fue utilizado.' }, { status: 409 })
      }

      const verification = await verifyBscTransaction(txHash!, price)

      if (verification.success) {
        // Vencimiento según el período (renovación extiende desde el vencimiento actual)
        const expiresAt = computeExpiry(period, user.planExpiresAt ?? null, isRenewal)

        // Verificación inmediata exitosa → activar el plan en una transacción
        const req = await prisma.$transaction(async (tx) => {
          const newReq = await (tx as any).packPurchaseRequest.create({
            data: {
              userId: user.id,
              plan,
              period,
              price,
              paymentMethod: 'CRYPTO',
              txHash,
              blockNumber: verification.blockNumber ?? null,
              status: 'APPROVED',
              reviewedAt: new Date(),
              notes: `Auto-aprobado on-chain. USDT recibido: ${verification.amountUsdt?.toFixed(2)}`,
            },
          })

          if (isRenewal) {
            await tx.$executeRaw`
              UPDATE users
              SET is_active = true, plan_expires_at = ${expiresAt}
              WHERE id = ${user.id}::uuid
            `
          } else {
            await tx.$executeRaw`
              UPDATE users
              SET plan = ${plan}::"UserPlan", is_active = true, plan_expires_at = ${expiresAt}
              WHERE id = ${user.id}::uuid
            `
          }

          await tx.auditLog.create({
            data: {
              userId: user.id,
              actorUserId: user.id,
              action: 'PURCHASE_CRYPTO_AUTO_APPROVED',
              entityType: 'PackPurchaseRequest',
              entityId: newReq.id,
              payload: { plan, period, price, txHash, amountUsdt: verification.amountUsdt, blockNumber: verification.blockNumber?.toString() },
            },
          })

          return newReq
        })

        return NextResponse.json({
          success: true,
          status: 'approved',
          message: '¡Plan activado correctamente! La transacción fue verificada on-chain.',
          request: { ...req, price: Number(req.price), blockNumber: req.blockNumber?.toString() ?? null },
        })
      }

      // Verificación pendiente (latencia/confirmaciones) → el cron lo confirmará
      const req = await (prisma as any).packPurchaseRequest.create({
        data: {
          userId: user.id,
          plan,
          period,
          price,
          paymentMethod: 'CRYPTO',
          txHash,
          status: 'PENDING_VERIFICATION',
        },
      })

      return NextResponse.json({
        success: true,
        status: 'pending_verification',
        message: 'Transacción recibida. Verificando en la blockchain, puede tardar unos minutos.',
        request: { ...req, price: Number(req.price), blockNumber: null },
      })
    }

    // ─────────────── Pago MANUAL (revisión del admin) ───────────────
    const req = await (prisma.packPurchaseRequest as any).create({
      data: {
        userId: user.id,
        plan,
        period,
        price,
        paymentProofUrl,
        paymentMethod: 'MANUAL',
        status: 'PENDING',
        notes: isRenewal ? 'RENEWAL' : null,
      },
    })

    return NextResponse.json({ success: true, status: 'pending', request: { ...req, price: Number(req.price) } }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/pack-requests]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
