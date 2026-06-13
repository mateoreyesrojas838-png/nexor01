export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { userHasCourseAccess } from '@/lib/course-access'

/** POST — marca/actualiza el progreso de una lección. Body: { completed: boolean } */
export async function POST(req: NextRequest, { params }: { params: { lessonId: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const lesson = await (prisma as any).courseLesson.findUnique({
    where: { id: params.lessonId },
    select: { module: { select: { courseId: true } } },
  })
  if (!lesson) return NextResponse.json({ error: 'Lección no encontrada' }, { status: 404 })

  // Solo alguien con acceso al curso puede registrar progreso
  const hasAccess = await userHasCourseAccess(user.id, lesson.module.courseId)
  if (!hasAccess) return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })

  const { completed } = await req.json().catch(() => ({ completed: true }))

  await (prisma as any).lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId: params.lessonId } },
    create: { userId: user.id, lessonId: params.lessonId, completed: completed !== false },
    update: { completed: completed !== false },
  })

  return NextResponse.json({ ok: true })
}
