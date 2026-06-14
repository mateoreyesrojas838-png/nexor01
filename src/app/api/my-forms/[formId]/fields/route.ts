export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

const TYPES = ['text', 'paragraph', 'radio', 'checkbox', 'dropdown', 'number', 'email', 'phone', 'date', 'rating', 'file', 'heading', 'button']

/** POST — agrega un campo al formulario (solo el dueño) */
export async function POST(req: NextRequest, { params }: { params: { formId: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const form = await (prisma as any).form.findFirst({ where: { id: params.formId, userId: user.id }, select: { id: true } })
  if (!form) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const { type } = await req.json()
  if (!TYPES.includes(type)) return NextResponse.json({ error: 'Tipo de campo inválido' }, { status: 400 })

  const count = await (prisma as any).formField.count({ where: { formId: params.formId } })
  const needsOptions = ['radio', 'checkbox', 'dropdown'].includes(type)

  const field = await (prisma as any).formField.create({
    data: {
      formId: params.formId,
      type,
      label: type === 'heading' ? 'Título de sección' : type === 'button' ? 'Hacé clic acá' : 'Pregunta sin título',
      required: false,
      options: needsOptions ? ['Opción 1'] : type === 'button' ? [''] : undefined,
      order: count,
    },
  })
  return NextResponse.json({ field }, { status: 201 })
}
