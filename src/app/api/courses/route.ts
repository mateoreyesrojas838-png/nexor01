export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { userHasCourseAccess } from '@/lib/course-access'

/** GET — catálogo de cursos activos + si el usuario tiene acceso a cada uno */
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const courses = await (prisma as any).course.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, title: true, subtitle: true, slug: true, coverUrl: true,
      price: true, freeForPlan: true,
      _count: { select: { modules: true } },
    },
  })

  const withAccess = await Promise.all(
    courses.map(async (c: any) => ({
      ...c,
      price: Number(c.price),
      hasAccess: await userHasCourseAccess(user.id, c.id),
    }))
  )

  return NextResponse.json({ courses: withAccess })
}
