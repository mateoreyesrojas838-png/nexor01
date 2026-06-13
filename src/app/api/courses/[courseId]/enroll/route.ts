export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { verifyBscTransaction } from '@/lib/blockchain'

const TX_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/

/**
 * POST /api/courses/[courseId]/enroll
 * Inscripción/compra de un curso. Métodos: CRYPTO (USDT BEP-20 on-chain) o MANUAL (comprobante).
 */
export async function POST(req: NextRequest, { params }: { params: { courseId: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const course = await (prisma as any).course.findFirst({
    where: { id: params.courseId, active: true },
    select: { id: true, price: true },
  })
  if (!course) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })

  const price = Number(course.price)
  const body = await req.json().catch(() => ({}))
  const isCrypto = body.paymentMethod === 'CRYPTO'
  const txHash = (body.txHash as string) ?? null
  const proofUrl = (body.proofUrl as string) ?? null

  // ¿Ya tiene inscripción?
  const existing = await (prisma as any).courseEnrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: course.id } },
    select: { status: true },
  })
  if (existing?.status === 'APPROVED') return NextResponse.json({ error: 'Ya tenés acceso a este curso.' }, { status: 409 })
  if (existing && (existing.status === 'PENDING' || existing.status === 'PENDING_VERIFICATION')) {
    return NextResponse.json({ error: 'Ya tenés una solicitud pendiente para este curso.' }, { status: 409 })
  }

  // ─────────── CRIPTO (USDT BEP-20) ───────────
  if (isCrypto) {
    if (!txHash || !TX_HASH_REGEX.test(txHash)) {
      return NextResponse.json({ error: 'Hash de transacción inválido.' }, { status: 400 })
    }
    // Anti double-spend (mismo hash no usado en otra inscripción)
    const dup = await (prisma as any).courseEnrollment.findUnique({ where: { txHash } })
    if (dup) return NextResponse.json({ error: 'Este hash de transacción ya fue utilizado.' }, { status: 409 })

    const verification = await verifyBscTransaction(txHash, price)
    const status = verification.success ? 'APPROVED' : 'PENDING_VERIFICATION'

    const enrollment = await (prisma as any).courseEnrollment.upsert({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
      create: {
        userId: user.id, courseId: course.id, status,
        paymentMethod: 'CRYPTO', txHash,
        blockNumber: verification.blockNumber ?? null,
        notes: verification.success ? `Auto-aprobado on-chain. USDT: ${verification.amountUsdt?.toFixed(2)}` : null,
      },
      update: {
        status, paymentMethod: 'CRYPTO', txHash,
        blockNumber: verification.blockNumber ?? null,
        notes: verification.success ? `Auto-aprobado on-chain. USDT: ${verification.amountUsdt?.toFixed(2)}` : null,
      },
    })

    return NextResponse.json({
      success: true,
      status: verification.success ? 'approved' : 'pending_verification',
      message: verification.success
        ? '¡Curso desbloqueado! Pago verificado on-chain.'
        : 'Transacción recibida. Verificando en la blockchain (unos minutos).',
      enrollment: { id: enrollment.id, status: enrollment.status },
    })
  }

  // ─────────── MANUAL (comprobante) ───────────
  if (!proofUrl) return NextResponse.json({ error: 'Subí tu comprobante de pago.' }, { status: 400 })

  const enrollment = await (prisma as any).courseEnrollment.upsert({
    where: { userId_courseId: { userId: user.id, courseId: course.id } },
    create: { userId: user.id, courseId: course.id, status: 'PENDING', paymentMethod: 'MANUAL', proofUrl },
    update: { status: 'PENDING', paymentMethod: 'MANUAL', proofUrl, txHash: null, blockNumber: null },
  })

  return NextResponse.json({
    success: true,
    status: 'pending',
    message: 'Comprobante recibido. El equipo lo revisará y desbloqueará el curso.',
    enrollment: { id: enrollment.id, status: enrollment.status },
  })
}
