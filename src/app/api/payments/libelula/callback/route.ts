export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPlanPurchaseConfirmedEmail } from '@/lib/email'
import { computeExpiry } from '@/lib/plan-period'

/**
 * GET /api/payments/libelula/callback?transaction_id=UUID
 * Called by Libélula when a payment is confirmed.
 */
export async function GET(req: NextRequest) {
  const transactionId = req.nextUrl.searchParams.get('transaction_id')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nex180.site'

  if (!transactionId) {
    return NextResponse.redirect(`${appUrl}/dashboard/planes?payment=error`)
  }

  // Find pending pack request — notes starts with LIBELULA:{transactionId}
  const packRequest = await prisma.packPurchaseRequest.findFirst({
    where: {
      notes: { startsWith: `LIBELULA:${transactionId}` },
      status: 'PENDING_VERIFICATION',
    },
  })

  if (!packRequest) {
    // Already processed or not found — redirect to dashboard
    console.log(`[Libélula callback] Transaction ${transactionId} not found or already processed`)
    return NextResponse.redirect(`${appUrl}/dashboard?payment=already_processed`)
  }

  const isRenewal = packRequest.notes?.includes(':RENEWAL') ?? false
  const now = new Date()

  try {
    // Vencimiento según el período comprado; en renovación extiende desde el actual.
    const userRows = await prisma.$queryRaw<Array<{ plan_expires_at: Date | null }>>`
      SELECT plan_expires_at FROM users WHERE id = ${packRequest.userId}::uuid LIMIT 1
    `
    const expiresAt = computeExpiry((packRequest as any).period, userRows[0]?.plan_expires_at ?? null, isRenewal)

    await prisma.$transaction(async (tx) => {
      await tx.packPurchaseRequest.update({
        where: { id: packRequest.id },
        data: {
          status: 'APPROVED',
          notes: `${packRequest.notes}:PAID`,
          reviewedAt: now,
        },
      })

      const plan = packRequest.plan as string
      await tx.$executeRaw`
        UPDATE users
        SET plan = ${plan}::"UserPlan",
            is_active = true,
            plan_expires_at = ${expiresAt}
        WHERE id = ${packRequest.userId}::uuid
      `
    })

    console.log(`[Libélula callback] Plan ${packRequest.plan} ${isRenewal ? 'renewed' : 'activated'} for user ${packRequest.userId} until ${expiresAt.toISOString()}`)

    // Send confirmation email (fire-and-forget)
    const userRow = await prisma.user.findUnique({
      where: { id: packRequest.userId },
      select: { email: true, fullName: true },
    })
    if (userRow) {
      sendPlanPurchaseConfirmedEmail(
        userRow.email,
        userRow.fullName ?? userRow.email,
        {
          id: packRequest.id,
          plan: packRequest.plan as string,
          price: Number(packRequest.price),
          paymentMethod: 'Libélula QR',
          createdAt: now,
        }
      ).catch(e => console.error('[email] libelula plan confirmed:', e))
    }

    return NextResponse.redirect(`${appUrl}/dashboard?payment=success`)
  } catch (err) {
    console.error('[Libélula callback] Error activating plan:', err)
    return NextResponse.redirect(`${appUrl}/dashboard/planes?payment=error`)
  }
}
