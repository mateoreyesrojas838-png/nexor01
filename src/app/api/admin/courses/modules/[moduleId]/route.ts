export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'

/** PATCH — renombra el módulo */
export async function PATCH(req: NextRequest, { params }: { params: { moduleId: string } }) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  const { title } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: 'Título requerido' }, { status: 400 })

  const courseModule = await (prisma as any).courseModule.update({
    where: { id: params.moduleId },
    data: { title: title.trim() },
  })
  return NextResponse.json({ module: courseModule })
}

/** DELETE — elimina el módulo (sus lecciones caen en cascada) */
export async function DELETE(_req: NextRequest, { params }: { params: { moduleId: string } }) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  await (prisma as any).courseModule.delete({ where: { id: params.moduleId } })
  return NextResponse.json({ ok: true })
}
