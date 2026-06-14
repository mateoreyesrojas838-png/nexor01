export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

async function ownForm(formId: string, userId: string) {
  return (prisma as any).form.findFirst({ where: { id: formId, userId } })
}

/** GET — formulario del usuario con sus campos */
export async function GET(_req: NextRequest, { params }: { params: { formId: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const form = await (prisma as any).form.findFirst({
    where: { id: params.formId, userId: user.id },
    include: { fields: { orderBy: { order: 'asc' } }, _count: { select: { responses: true } } },
  })
  if (!form) return NextResponse.json({ error: 'Formulario no encontrado' }, { status: 404 })
  return NextResponse.json({ form })
}

/** PATCH — edita el formulario (datos/tema/estado) */
export async function PATCH(req: NextRequest, { params }: { params: { formId: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!(await ownForm(params.formId, user.id))) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

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

/** DELETE — elimina el formulario */
export async function DELETE(_req: NextRequest, { params }: { params: { formId: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!(await ownForm(params.formId, user.id))) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  await (prisma as any).form.delete({ where: { id: params.formId } })
  return NextResponse.json({ ok: true })
}
