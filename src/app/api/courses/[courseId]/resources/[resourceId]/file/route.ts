export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { userHasCourseAccess } from '@/lib/course-access'

const BUCKET = 'course-files'
const SIGNED_TTL = 60 * 60 // 1 hora

/** POST — URL firmada (expira) para descargar/ver un material. Solo con acceso al curso. */
export async function POST(_req: NextRequest, { params }: { params: { courseId: string; resourceId: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const hasAccess = await userHasCourseAccess(user.id, params.courseId)
  if (!hasAccess) return NextResponse.json({ error: 'No tenés acceso a este curso' }, { status: 403 })

  const resource = await (prisma as any).courseResource.findUnique({
    where: { id: params.resourceId },
    select: { filePath: true, courseId: true, title: true },
  })
  if (!resource || resource.courseId !== params.courseId) {
    return NextResponse.json({ error: 'Material no encontrado' }, { status: 404 })
  }

  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(resource.filePath, SIGNED_TTL)
  if (error || !data?.signedUrl) {
    console.error('[course resource] signed url error', error)
    return NextResponse.json({ error: 'No se pudo cargar el material' }, { status: 500 })
  }

  return NextResponse.json({ url: data.signedUrl })
}
