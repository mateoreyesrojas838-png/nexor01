export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { userHasCourseAccess } from '@/lib/course-access'

const BUCKET = 'course-videos'
const SIGNED_TTL = 60 * 60 * 2 // 2 horas

/**
 * POST — devuelve una URL FIRMADA (expira) para reproducir la lección.
 * Solo si el usuario tiene acceso al curso. Nunca expone la ruta real.
 */
export async function POST(_req: NextRequest, { params }: { params: { courseId: string; lessonId: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // 1. Verificar acceso al curso
  const hasAccess = await userHasCourseAccess(user.id, params.courseId)
  if (!hasAccess) return NextResponse.json({ error: 'No tenés acceso a este curso' }, { status: 403 })

  // 2. La lección debe pertenecer a ese curso
  const lesson = await (prisma as any).courseLesson.findUnique({
    where: { id: params.lessonId },
    select: { videoPath: true, module: { select: { courseId: true } } },
  })
  if (!lesson || lesson.module.courseId !== params.courseId) {
    return NextResponse.json({ error: 'Lección no encontrada' }, { status: 404 })
  }
  if (!lesson.videoPath) return NextResponse.json({ error: 'Esta lección aún no tiene video' }, { status: 404 })

  // 3. Generar URL firmada temporal del bucket privado
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(lesson.videoPath, SIGNED_TTL)

  if (error || !data?.signedUrl) {
    console.error('[course play] signed url error', error)
    return NextResponse.json({ error: 'No se pudo cargar el video' }, { status: 500 })
  }

  return NextResponse.json({ url: data.signedUrl, expiresIn: SIGNED_TTL })
}
