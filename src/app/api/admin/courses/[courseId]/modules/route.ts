export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'

/** POST — crea un módulo dentro del curso */
export async function POST(req: NextRequest, { params }: { params: { courseId: string } }) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  const { title } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: 'El título del módulo es requerido' }, { status: 400 })

  const count = await (prisma as any).courseModule.count({ where: { courseId: params.courseId } })

  const courseModule = await (prisma as any).courseModule.create({
    data: { courseId: params.courseId, title: title.trim(), order: count },
  })

  return NextResponse.json({ module: courseModule }, { status: 201 })
}
