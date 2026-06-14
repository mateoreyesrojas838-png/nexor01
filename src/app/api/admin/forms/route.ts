export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'

function slugify(text: string): string {
  return (text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50)) || 'form'
}

/** GET — lista de formularios */
export async function GET() {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  const forms = await (prisma as any).form.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { responses: true, fields: true } } },
  })
  return NextResponse.json({ forms })
}

/** POST — crea un formulario */
export async function POST(req: NextRequest) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  const { title } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: 'El título es requerido' }, { status: 400 })

  let slug = slugify(title) + '-' + Math.random().toString(36).slice(2, 6)
  const exists = await (prisma as any).form.findUnique({ where: { slug } })
  if (exists) slug = slug + Math.random().toString(36).slice(2, 4)

  const form = await (prisma as any).form.create({
    data: { title: title.trim(), slug },
  })
  return NextResponse.json({ form }, { status: 201 })
}
