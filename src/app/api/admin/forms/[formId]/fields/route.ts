export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'

const TYPES = ['text', 'paragraph', 'radio', 'checkbox', 'dropdown', 'number', 'email', 'phone', 'date', 'rating', 'file', 'heading']

/** POST — agrega un campo al formulario */
export async function POST(req: NextRequest, { params }: { params: { formId: string } }) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  const { type } = await req.json()
  if (!TYPES.includes(type)) return NextResponse.json({ error: 'Tipo de campo inválido' }, { status: 400 })

  const count = await (prisma as any).formField.count({ where: { formId: params.formId } })
  const needsOptions = ['radio', 'checkbox', 'dropdown'].includes(type)

  const field = await (prisma as any).formField.create({
    data: {
      formId: params.formId,
      type,
      label: type === 'heading' ? 'Título de sección' : 'Pregunta sin título',
      required: false,
      options: needsOptions ? ['Opción 1'] : undefined,
      order: count,
    },
  })
  return NextResponse.json({ field }, { status: 201 })
}
