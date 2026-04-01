export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/payments/libelula/credits/callback?transaction_id=UUID
 * Called by Libélula when a credit recharge payment is confirmed.
 * Automatically adds the purchased USD amount to the user's aiCreditsUsd balance.
 */
export async function GET(req: NextRequest) {
  const transactionId = req.nextUrl.searchParams.get('transaction_id')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nex180.site'

  if (!transactionId) {
    return NextResponse.redirect(`${appUrl}/dashboard/credits?payment=error`)
  }

  // Find the pending credit purchase by transaction ID
  const packRequest = await prisma.packPurchaseRequest.findFirst({
    where: {
      notes: { startsWith: `LIBELULA:${transactionId}:CREDITS:` },
      status: 'PENDING_VERIFICATION',
    },
  })

  if (!packRequest) {
    console.log(`[credits/callback] Transaction ${transactionId} not found or already processed`)
    return NextResponse.redirect(`${appUrl}/dashboard/credits?payment=already_processed`)
  }

  // Parse the amount from notes: LIBELULA:{uuid}:CREDITS:{amount}
  // Use the :CREDITS: marker for precise extraction — avoids any split fragility
  const creditsMarker = ':CREDITS:'
  const creditsIdx = (packRequest.notes ?? '').indexOf(creditsMarker)
  const rawAmount = creditsIdx >= 0 ? packRequest.notes!.slice(creditsIdx + creditsMarker.length).split(':')[0] : ''
  const amountUsd = parseFloat(rawAmount)

  if (!amountUsd || amountUsd <= 0) {
    console.error(`[credits/callback] Could not parse amount from notes: ${packRequest.notes}`)
    return NextResponse.redirect(`${appUrl}/dashboard/credits?payment=error`)
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Mark purchase as approved
      await tx.packPurchaseRequest.update({
        where: { id: packRequest.id },
        data: {
          status: 'APPROVED',
          notes: `${packRequest.notes}:PAID`,
          reviewedAt: new Date(),
        },
      })

      // Add credits to user balance
      await tx.user.update({
        where: { id: packRequest.userId },
        data: { aiCreditsUsd: { increment: amountUsd } },
      })
    })

    console.log(`[credits/callback] Added $${amountUsd} USD credits to user ${packRequest.userId}`)
    return NextResponse.redirect(`${appUrl}/dashboard/credits?payment=success&amount=${amountUsd}`)
  } catch (err) {
    console.error('[credits/callback] Error adding credits:', err)
    return NextResponse.redirect(`${appUrl}/dashboard/credits?payment=error`)
  }
}
