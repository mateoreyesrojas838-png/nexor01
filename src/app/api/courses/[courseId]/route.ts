export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { userHasCourseAccess } from '@/lib/course-access'

/**
 * GET — detalle del curso para el alumno.
 * NUNCA expone videoPath. Devuelve hasAccess + progreso del usuario.
 */
export async function GET(_req: NextRequest, { params }: { params: { courseId: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const course = await (prisma as any).course.findFirst({
    where: { id: params.courseId, active: true },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            select: { id: true, title: true, durationSec: true, order: true, videoPath: true },
          },
        },
      },
    },
  })
  if (!course) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })

  const hasAccess = await userHasCourseAccess(user.id, course.id)

  // Progreso del usuario
  const progressRows = await (prisma as any).lessonProgress.findMany({
    where: { userId: user.id, lesson: { module: { courseId: course.id } } },
    select: { lessonId: true, completed: true },
  })
  const completedSet = new Set(progressRows.filter((p: any) => p.completed).map((p: any) => p.lessonId))

  // Estado de inscripción (para mostrar "pendiente de verificación", etc. en Fase 3)
  const enrollment = await (prisma as any).courseEnrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: course.id } },
    select: { status: true },
  })

  // Sanitizar: nunca mandar videoPath; solo si hay video y si está completada
  const modules = course.modules.map((m: any) => ({
    id: m.id,
    title: m.title,
    order: m.order,
    lessons: m.lessons.map((l: any) => ({
      id: l.id,
      title: l.title,
      durationSec: l.durationSec,
      order: l.order,
      hasVideo: !!l.videoPath,
      completed: completedSet.has(l.id),
    })),
  }))

  return NextResponse.json({
    course: {
      id: course.id,
      title: course.title,
      subtitle: course.subtitle,
      description: course.description,
      coverUrl: course.coverUrl,
      price: Number(course.price),
      freeForPlan: course.freeForPlan,
      whatYouLearn: course.whatYouLearn,
      modules,
    },
    hasAccess,
    enrollmentStatus: enrollment?.status ?? null,
  })
}
