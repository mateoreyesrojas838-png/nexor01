export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'

/** POST — crea una lección dentro del módulo. videoPath viene de /upload-video */
export async function POST(req: NextRequest, { params }: { params: { moduleId: string } }) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  const { title, videoPath, durationSec } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: 'El título de la lección es requerido' }, { status: 400 })

  const count = await (prisma as any).courseLesson.count({ where: { moduleId: params.moduleId } })

  const lesson = await (prisma as any).courseLesson.create({
    data: {
      moduleId: params.moduleId,
      title: title.trim(),
      videoPath: videoPath?.trim() || null,
      durationSec: parseInt(durationSec) || 0,
      order: count,
    },
  })

  return NextResponse.json({ lesson }, { status: 201 })
}
