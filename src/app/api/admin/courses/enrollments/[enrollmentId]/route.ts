export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'

/** PATCH — aprobar o rechazar una inscripción. Body: { action: 'approve' | 'reject' } */
export async function PATCH(req: NextRequest, { params }: { params: { enrollmentId: string } }) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  const { action } = await req.json()
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
  }

  const enrollment = await (prisma as any).courseEnrollment.findUnique({ where: { id: params.enrollmentId } })
  if (!enrollment) return NextResponse.json({ error: 'Inscripción no encontrada' }, { status: 404 })

  const updated = await (prisma as any).courseEnrollment.update({
    where: { id: params.enrollmentId },
    data: {
      status: action === 'approve' ? 'APPROVED' : 'REJECTED',
      notes: action === 'approve' ? 'Aprobado manualmente por admin' : 'Rechazado por admin',
    },
  })

  return NextResponse.json({ ok: true, status: updated.status })
}
