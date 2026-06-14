export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'

/** GET — detalle del curso con módulos y lecciones ordenados */
export async function GET(_req: NextRequest, { params }: { params: { courseId: string } }) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  const course = await (prisma as any).course.findUnique({
    where: { id: params.courseId },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: { lessons: { orderBy: { order: 'asc' } } },
      },
      resources: { orderBy: { order: 'asc' } },
      _count: { select: { enrollments: true } },
    },
  })

  if (!course) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
  return NextResponse.json({ course: { ...course, price: Number(course.price) } })
}

/** PATCH — edita el curso */
export async function PATCH(req: NextRequest, { params }: { params: { courseId: string } }) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  const body = await req.json()
  const { title, subtitle, description, coverUrl, price, freeForPlan, active, whatYouLearn, landingBlocks, introVideoPath } = body

  const data: any = {}
  if (title !== undefined) data.title = String(title).trim()
  if (landingBlocks !== undefined) data.landingBlocks = Array.isArray(landingBlocks) ? landingBlocks : null
  if (introVideoPath !== undefined) data.introVideoPath = introVideoPath || null
  if (subtitle !== undefined) data.subtitle = subtitle?.trim() || null
  if (description !== undefined) data.description = String(description).trim()
  if (coverUrl !== undefined) data.coverUrl = coverUrl?.trim() || null
  if (whatYouLearn !== undefined) data.whatYouLearn = whatYouLearn?.trim() || null
  if (freeForPlan !== undefined) data.freeForPlan = !!freeForPlan
  if (active !== undefined) data.active = !!active
  if (price !== undefined) {
    const p = parseFloat(price)
    if (isNaN(p) || p < 0) return NextResponse.json({ error: 'Precio inválido' }, { status: 400 })
    data.price = p
  }

  const course = await (prisma as any).course.update({ where: { id: params.courseId }, data })
  return NextResponse.json({ course: { ...course, price: Number(course.price) } })
}

/** DELETE — elimina el curso (módulos/lecciones caen en cascada) */
export async function DELETE(_req: NextRequest, { params }: { params: { courseId: string } }) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  await (prisma as any).course.delete({ where: { id: params.courseId } })
  return NextResponse.json({ ok: true })
}
