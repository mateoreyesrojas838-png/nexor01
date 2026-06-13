export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabase'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'

const BUCKET = 'course-videos'

/** PATCH — edita la lección (título, video, duración) */
export async function PATCH(req: NextRequest, { params }: { params: { lessonId: string } }) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  const { title, videoPath, durationSec } = await req.json()
  const data: any = {}
  if (title !== undefined) data.title = String(title).trim()
  if (durationSec !== undefined) data.durationSec = parseInt(durationSec) || 0
  if (videoPath !== undefined) {
    // Si se reemplaza el video, borrar el anterior del bucket
    const current = await (prisma as any).courseLesson.findUnique({ where: { id: params.lessonId }, select: { videoPath: true } })
    if (current?.videoPath && current.videoPath !== videoPath) {
      await supabaseAdmin.storage.from(BUCKET).remove([current.videoPath]).catch(() => {})
    }
    data.videoPath = videoPath?.trim() || null
  }

  const lesson = await (prisma as any).courseLesson.update({ where: { id: params.lessonId }, data })
  return NextResponse.json({ lesson })
}

/** DELETE — elimina la lección y su video del bucket */
export async function DELETE(_req: NextRequest, { params }: { params: { lessonId: string } }) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  const lesson = await (prisma as any).courseLesson.findUnique({ where: { id: params.lessonId }, select: { videoPath: true } })
  if (lesson?.videoPath) {
    await supabaseAdmin.storage.from(BUCKET).remove([lesson.videoPath]).catch(() => {})
  }
  await (prisma as any).courseLesson.delete({ where: { id: params.lessonId } })
  return NextResponse.json({ ok: true })
}
