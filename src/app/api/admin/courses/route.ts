export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // quitar acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'curso'
}

/** GET — lista todos los cursos (admin) */
export async function GET() {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  const courses = await (prisma as any).course.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { modules: true, enrollments: true } },
    },
  })

  return NextResponse.json({
    courses: courses.map((c: any) => ({ ...c, price: Number(c.price) })),
  })
}

/** POST — crea un curso */
export async function POST(req: NextRequest) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  const body = await req.json()
  const { title, subtitle, description, coverUrl, price, freeForPlan, whatYouLearn } = body

  if (!title?.trim()) return NextResponse.json({ error: 'El título es requerido' }, { status: 400 })
  const parsedPrice = parseFloat(price)
  if (isNaN(parsedPrice) || parsedPrice < 0) return NextResponse.json({ error: 'Precio inválido' }, { status: 400 })

  // Slug único
  let slug = slugify(title)
  const existing = await (prisma as any).course.findUnique({ where: { slug } })
  if (existing) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`

  const course = await (prisma as any).course.create({
    data: {
      title: title.trim(),
      slug,
      subtitle: subtitle?.trim() || null,
      description: description?.trim() || '',
      coverUrl: coverUrl?.trim() || null,
      price: parsedPrice,
      freeForPlan: !!freeForPlan,
      whatYouLearn: whatYouLearn?.trim() || null,
      active: true,
    },
  })

  return NextResponse.json({ course: { ...course, price: Number(course.price) } }, { status: 201 })
}
