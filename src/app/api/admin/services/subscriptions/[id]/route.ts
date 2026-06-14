export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'
import { PERIOD_DAYS } from '@/lib/service-access'
import { createNotification } from '@/lib/notifications'

/** PATCH — aprobar/rechazar una suscripción. Al aprobar setea el vencimiento según el período. Body: { action } */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  const { action } = await req.json()
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
  }

  const sub = await (prisma as any).serviceSubscription.findUnique({ where: { id: params.id } })
  if (!sub) return NextResponse.json({ error: 'Suscripción no encontrada' }, { status: 404 })

  if (action === 'approve') {
    const expiresAt = new Date(Date.now() + (PERIOD_DAYS[sub.period] || 30) * 24 * 60 * 60 * 1000)
    await (prisma as any).serviceSubscription.update({
      where: { id: params.id },
      data: { status: 'APPROVED', expiresAt, notes: 'Aprobado manualmente por admin' },
    })
    createNotification(sub.userId, 'Servicio activado', 'Tu pago fue aprobado. Ya podés usar el servicio.', '/dashboard').catch(() => {})
  } else {
    await (prisma as any).serviceSubscription.update({
      where: { id: params.id },
      data: { status: 'REJECTED', notes: 'Rechazado por admin' },
    })
  }

  return NextResponse.json({ ok: true })
}
