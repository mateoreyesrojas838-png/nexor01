export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

/** Verifica que el campo pertenece a un formulario del usuario */
async function ownField(fieldId: string, userId: string) {
  const field = await (prisma as any).formField.findUnique({
    where: { id: fieldId }, include: { form: { select: { userId: true } } },
  })
  if (!field || field.form?.userId !== userId) return null
  return field
}

/** PATCH — edita un campo */
export async function PATCH(req: NextRequest, { params }: { params: { fieldId: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!(await ownField(params.fieldId, user.id))) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const b = await req.json()
  const data: any = {}
  if (b.label !== undefined) data.label = String(b.label)
  if (b.description !== undefined) data.description = b.description || null
  if (b.required !== undefined) data.required = !!b.required
  if (b.options !== undefined) data.options = Array.isArray(b.options) ? b.options : null
  if (b.settings !== undefined) data.settings = b.settings || null
  if (b.order !== undefined) data.order = parseInt(b.order) || 0

  const field = await (prisma as any).formField.update({ where: { id: params.fieldId }, data })
  return NextResponse.json({ field })
}

/** DELETE — elimina un campo */
export async function DELETE(_req: NextRequest, { params }: { params: { fieldId: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!(await ownField(params.fieldId, user.id))) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  await (prisma as any).formField.delete({ where: { id: params.fieldId } })
  return NextResponse.json({ ok: true })
}
