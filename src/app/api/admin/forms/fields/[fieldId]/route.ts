export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'

/** PATCH — edita un campo (label, requerido, opciones, orden) */
export async function PATCH(req: NextRequest, { params }: { params: { fieldId: string } }) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

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

/** DELETE — elimina el campo */
export async function DELETE(_req: NextRequest, { params }: { params: { fieldId: string } }) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  await (prisma as any).formField.delete({ where: { id: params.fieldId } })
  return NextResponse.json({ ok: true })
}
