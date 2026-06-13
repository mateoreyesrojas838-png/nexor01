import { prisma } from '@/lib/prisma'

/**
 * Determina si un usuario puede ver el contenido de un curso.
 * Acceso si:
 *   1. Tiene una inscripción APROBADA al curso (lo compró), O
 *   2. El curso es freeForPlan y el usuario tiene un plan activo.
 */
export async function userHasCourseAccess(userId: string, courseId: string): Promise<boolean> {
  // 1. Inscripción aprobada
  const enrollment = await (prisma as any).courseEnrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { status: true },
  })
  if (enrollment?.status === 'APPROVED') return true

  // 2. Gratis con plan activo
  const course = await (prisma as any).course.findUnique({
    where: { id: courseId },
    select: { freeForPlan: true },
  })
  if (course?.freeForPlan) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, planExpiresAt: true },
    })
    const planActive = !!user && user.plan !== 'NONE' &&
      (!user.planExpiresAt || user.planExpiresAt > new Date())
    if (planActive) return true
  }

  return false
}
