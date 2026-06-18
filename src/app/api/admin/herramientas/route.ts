export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'

const SECTIONS = ['CATALOGO', 'PLANTILLA', 'TESTIMONIO', 'PROMOCION', 'BIBLIOTECA', 'GUION']

/** GET — todos los recursos (admin), ordenados por sección y orden. */
export async function GET() {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()
  const items = await (prisma as any).toolResource.findMany({ orderBy: [{ section: 'asc' }, { order: 'asc' }, { createdAt: 'desc' }] })
  return NextResponse.json({ items })
}

/** POST — crea un recurso. */
export async function POST(req: NextRequest) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()
  const b = await req.json()
  if (!SECTIONS.includes(b.section)) return NextResponse.json({ error: 'Sección inválida' }, { status: 400 })
  if (!b.title?.trim()) return NextResponse.json({ error: 'El título es requerido' }, { status: 400 })

  const item = await (prisma as any).toolResource.create({
    data: {
      section: b.section,
      title: String(b.title).trim(),
      category: b.category?.trim() || null,
      description: b.description || null,
      coverUrl: b.coverUrl || null,
      fileUrl: b.fileUrl || null,
      imageUrl: b.imageUrl || null,
      videoUrl: b.videoUrl || null,
      buttonLabel: b.buttonLabel?.trim() || null,
      buttonUrl: b.buttonUrl?.trim() || null,
      active: b.active !== false,
    },
  })
  return NextResponse.json({ item }, { status: 201 })
}
