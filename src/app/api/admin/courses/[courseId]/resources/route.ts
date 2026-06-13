export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'

/** POST — agrega un material (PDF/imagen) al curso. filePath/kind vienen de /upload-file */
export async function POST(req: NextRequest, { params }: { params: { courseId: string } }) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  const { title, filePath, kind } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: 'Poné un título al material' }, { status: 400 })
  if (!filePath) return NextResponse.json({ error: 'Subí el archivo primero' }, { status: 400 })

  const count = await (prisma as any).courseResource.count({ where: { courseId: params.courseId } })

  const resource = await (prisma as any).courseResource.create({
    data: {
      courseId: params.courseId,
      title: title.trim(),
      filePath,
      kind: kind === 'IMAGE' ? 'IMAGE' : 'PDF',
      order: count,
    },
  })

  return NextResponse.json({ resource }, { status: 201 })
}
