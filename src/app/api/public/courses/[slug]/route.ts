export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/** GET público (sin auth) — datos del curso para la landing de ventas. Nunca expone videoPath. */
export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const course = await (prisma as any).course.findFirst({
    where: { slug: params.slug, active: true },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: { lessons: { orderBy: { order: 'asc' }, select: { id: true, title: true, durationSec: true } } },
      },
    },
  })
  if (!course) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })

  return NextResponse.json({
    course: {
      id: course.id, title: course.title, subtitle: course.subtitle, description: course.description,
      coverUrl: course.coverUrl, price: Number(course.price), freeForPlan: course.freeForPlan,
      whatYouLearn: course.whatYouLearn,
      modules: course.modules.map((m: any) => ({
        id: m.id, title: m.title,
        lessons: m.lessons.map((l: any) => ({ id: l.id, title: l.title, durationSec: l.durationSec })),
      })),
    },
  })
}
