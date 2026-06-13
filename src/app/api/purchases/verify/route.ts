export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyBscTransaction } from '@/lib/blockchain'
import { sendPlanPurchaseConfirmedEmail, sendCourseEnrollmentEmail } from '@/lib/email'
import { createNotification } from '@/lib/notifications'

const PLAN_RANK: Record<string, number> = { NONE: 0, BASIC: 1, PRO: 2, ELITE: 3 }

/**
 * GET /api/purchases/verify
 * Cron job protegido por CRON_SECRET.
 * Busca compras CRYPTO en PENDING_VERIFICATION y las verifica on-chain.
 * Configurar en Render como cron job cada 2 minutos.
 */
export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret') ?? request.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  let pending: any[]
  try {
    pending = await (prisma as any).packPurchaseRequest.findMany({
      where: { status: 'PENDING_VERIFICATION', paymentMethod: 'CRYPTO', txHash: { not: null } },
      include: { user: { select: { id: true, fullName: true, email: true, plan: true } } },
      orderBy: { createdAt: 'asc' },
      take: 20,
    })
  } catch (err) {
    console.error('[cron/verify] Error fetching pending purchases:', err)
    return NextResponse.json({ error: 'Error consultando compras pendientes' }, { status: 500 })
  }

  const results = { verified: 0, failed: 0, pending: pending.length }

  for (const req of pending) {
    const verification = await verifyBscTransaction(req.txHash!, Number(req.price))

    if (!verification.success) {
      // Si lleva más de 30 minutos sin confirmarse, rechazar
      const ageMinutes = (Date.now() - req.createdAt.getTime()) / 60000
      if (ageMinutes > 30) {
        await (prisma as any).packPurchaseRequest.update({
          where: { id: req.id },
          data: { status: 'REJECTED', notes: `Timeout verificación: ${verification.error}` },
        })
        results.failed++
      }
      continue
    }

    // Verificado — activar plan en transacción
    try {
      const newPlan = req.plan as string
      const currentPlan = req.user.plan ?? 'NONE'
      const currentRank = PLAN_RANK[currentPlan] ?? 0
      const newRank = PLAN_RANK[newPlan] ?? 0
      const isRenewal = newPlan === currentPlan && currentRank > 0

      await prisma.$transaction(async (tx) => {
        await (tx as any).packPurchaseRequest.update({
          where: { id: req.id },
          data: {
            status: 'APPROVED',
            blockNumber: verification.blockNumber ?? null,
            reviewedAt: new Date(),
            notes: `Auto-aprobado por cron. USDT: ${verification.amountUsdt?.toFixed(2)}`,
          },
        })

        if (isRenewal) {
          await tx.$executeRaw`
            UPDATE users
            SET is_active = true,
                plan_expires_at = GREATEST(COALESCE(plan_expires_at, NOW()), NOW()) + INTERVAL '30 days'
            WHERE id = ${req.userId}::uuid
          `
        } else if (newRank > currentRank) {
          await tx.$executeRaw`
            UPDATE users
            SET plan = ${newPlan}::"UserPlan",
                is_active = true,
                plan_expires_at = NOW() + INTERVAL '30 days'
            WHERE id = ${req.userId}::uuid
          `
        }

        await tx.auditLog.create({
          data: {
            userId: req.userId,
            actorUserId: req.userId,
            action: 'PURCHASE_CRYPTO_CRON_APPROVED',
            entityType: 'PackPurchaseRequest',
            entityId: req.id,
            payload: { plan: newPlan, txHash: req.txHash, amountUsdt: verification.amountUsdt },
          },
        })
      })

      // Email de confirmación (fire-and-forget)
      sendPlanPurchaseConfirmedEmail(
        req.user.email,
        req.user.fullName,
        {
          id: req.id,
          plan: newPlan,
          price: Number(req.price),
          paymentMethod: 'CRYPTO',
          txHash: req.txHash,
          createdAt: new Date(),
        }
      ).catch(e => console.error('[email] cron plan confirmed:', e))

      results.verified++
    } catch (err) {
      console.error('[cron/verify] Error activando plan:', req.id, err)
      results.failed++
    }
  }

  // ── Inscripciones a cursos pagadas con cripto ──────────────────────────────
  let pendingEnrollments: any[] = []
  try {
    pendingEnrollments = await (prisma as any).courseEnrollment.findMany({
      where: { status: 'PENDING_VERIFICATION', paymentMethod: 'CRYPTO', txHash: { not: null } },
      include: {
        course: { select: { price: true, title: true } },
        user: { select: { email: true, fullName: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 20,
    })
  } catch (err) {
    console.error('[cron/verify] Error fetching course enrollments:', err)
    return NextResponse.json({ success: true, ...results, enrollments: { verified: 0, failed: 0 } })
  }

  const enrollResults = { verified: 0, failed: 0 }
  for (const enr of pendingEnrollments) {
    const verification = await verifyBscTransaction(enr.txHash!, Number(enr.course.price))
    if (!verification.success) {
      const ageMinutes = (Date.now() - enr.createdAt.getTime()) / 60000
      if (ageMinutes > 30) {
        await (prisma as any).courseEnrollment.update({
          where: { id: enr.id },
          data: { status: 'REJECTED', notes: `Timeout verificación: ${verification.error}` },
        })
        enrollResults.failed++
      }
      continue
    }
    try {
      await (prisma as any).courseEnrollment.update({
        where: { id: enr.id },
        data: {
          status: 'APPROVED',
          blockNumber: verification.blockNumber ?? null,
          notes: `Auto-aprobado por cron. USDT: ${verification.amountUsdt?.toFixed(2)}`,
        },
      })
      // Avisar al alumno: email + notificación in-app
      sendCourseEnrollmentEmail(enr.user.email, enr.user.fullName || enr.user.email, {
        courseTitle: enr.course.title, price: Number(enr.course.price), paymentMethod: 'CRYPTO', status: 'approved',
      }).catch(() => {})
      createNotification(enr.userId, 'Curso desbloqueado', `Tu pago se confirmó. Ya tenés acceso a "${enr.course.title}".`, `/dashboard/cursos/${enr.courseId}`).catch(() => {})
      enrollResults.verified++
    } catch (err) {
      console.error('[cron/verify] Error aprobando inscripción:', enr.id, err)
      enrollResults.failed++
    }
  }

  return NextResponse.json({ success: true, ...results, enrollments: enrollResults })
}
