export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { userHasCourseAccess } from '@/lib/course-access'

const BUCKET = 'course-videos'
const SIGNED_TTL = 60 * 60 * 2

/** POST — URL firmada para reproducir el video de introducción del curso (solo con acceso). */
export async function POST(_req: NextRequest, { params }: { params: { courseId: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const hasAccess = await userHasCourseAccess(user.id, params.courseId)
  if (!hasAccess) return NextResponse.json({ error: 'No tenés acceso a este curso' }, { status: 403 })

  const course = await (prisma as any).course.findUnique({
    where: { id: params.courseId }, select: { introVideoPath: true },
  })
  if (!course?.introVideoPath) return NextResponse.json({ error: 'Sin introducción' }, { status: 404 })

  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(course.introVideoPath, SIGNED_TTL)
  if (error || !data?.signedUrl) {
    console.error('[course intro] signed url error', error)
    return NextResponse.json({ error: 'No se pudo cargar la introducción' }, { status: 500 })
  }
  return NextResponse.json({ url: data.signedUrl })
}
