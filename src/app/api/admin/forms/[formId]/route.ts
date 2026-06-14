export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'

/** GET — formulario con sus campos ordenados */
export async function GET(_req: NextRequest, { params }: { params: { formId: string } }) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  const form = await (prisma as any).form.findUnique({
    where: { id: params.formId },
    include: { fields: { orderBy: { order: 'asc' } }, _count: { select: { responses: true } } },
  })
  if (!form) return NextResponse.json({ error: 'Formulario no encontrado' }, { status: 404 })
  return NextResponse.json({ form })
}

/** PATCH — edita datos/tema/estado del formulario */
export async function PATCH(req: NextRequest, { params }: { params: { formId: string } }) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  const b = await req.json()
  const data: any = {}
  if (b.title !== undefined) data.title = String(b.title).trim()
  if (b.description !== undefined) data.description = b.description || null
  if (b.themeColor !== undefined) data.themeColor = b.themeColor || '#F59E0B'
  if (b.themeColors !== undefined) data.themeColors = Array.isArray(b.themeColors) ? b.themeColors.slice(0, 5) : null
  if (b.buttonColor !== undefined) data.buttonColor = b.buttonColor || null
  if (b.coverUrl !== undefined) data.coverUrl = b.coverUrl || null
  if (b.headerVideoUrl !== undefined) data.headerVideoUrl = b.headerVideoUrl || null
  if (b.showSubmit !== undefined) data.showSubmit = !!b.showSubmit
  if (b.redirectUrl !== undefined) data.redirectUrl = b.redirectUrl || null
  if (b.notifyEmail !== undefined) data.notifyEmail = !!b.notifyEmail
  if (b.thankYouMsg !== undefined) data.thankYouMsg = b.thankYouMsg || null
  if (b.status !== undefined && ['DRAFT', 'PUBLISHED', 'CLOSED'].includes(b.status)) data.status = b.status

  const form = await (prisma as any).form.update({ where: { id: params.formId }, data })
  return NextResponse.json({ form })
}

/** DELETE — elimina el formulario (campos y respuestas en cascada) */
export async function DELETE(_req: NextRequest, { params }: { params: { formId: string } }) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  await (prisma as any).form.delete({ where: { id: params.formId } })
  return NextResponse.json({ ok: true })
}
