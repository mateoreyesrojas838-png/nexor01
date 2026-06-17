export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'
import { createNotification } from '@/lib/notifications'

/** PATCH — aprobar (acredita saldo) o rechazar una recarga manual. Body: { action } */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  const { action } = await req.json()
  if (action !== 'approve' && action !== 'reject') return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })

  const t = await (prisma as any).creditTopup.findUnique({ where: { id: params.id } })
  if (!t) return NextResponse.json({ error: 'Recarga no encontrada' }, { status: 404 })
  if (t.status === 'APPROVED' || t.status === 'PAID') return NextResponse.json({ error: 'Ya fue aprobada.' }, { status: 400 })

  if (action === 'approve') {
    const amount = Number(t.amountUsd)
    await prisma.$transaction(async (tx) => {
      await (tx as any).creditTopup.update({ where: { id: params.id }, data: { status: 'APPROVED', notes: 'Aprobado por admin' } })
      await tx.user.update({ where: { id: t.userId }, data: { aiCreditsUsd: { increment: amount } } })
    })
    createNotification(t.userId, 'Créditos acreditados', `Se sumaron $${amount.toFixed(2)} a tu saldo de créditos AI.`, '/dashboard/credits').catch(() => {})
  } else {
    await (prisma as any).creditTopup.update({ where: { id: params.id }, data: { status: 'REJECTED', notes: 'Rechazado por admin' } })
  }
  return NextResponse.json({ ok: true })
}
