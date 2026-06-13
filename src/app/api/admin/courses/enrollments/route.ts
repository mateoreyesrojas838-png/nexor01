export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'

/** GET — inscripciones que requieren acción del admin (manual pendiente o verificación cripto) */
export async function GET() {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  const enrollments = await (prisma as any).courseEnrollment.findMany({
    where: { status: { in: ['PENDING', 'PENDING_VERIFICATION'] } },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { fullName: true, email: true, username: true } },
      course: { select: { title: true, price: true } },
    },
  })

  return NextResponse.json({
    enrollments: enrollments.map((e: any) => ({
      id: e.id, status: e.status, paymentMethod: e.paymentMethod, proofUrl: e.proofUrl,
      txHash: e.txHash, notes: e.notes, createdAt: e.createdAt,
      user: e.user, course: { ...e.course, price: Number(e.course.price) },
    })),
  })
}
