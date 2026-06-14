export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendFormResponseEmail } from '@/lib/email'
import { createNotification } from '@/lib/notifications'

/** POST público — guarda una respuesta del formulario. Body: { answers: { fieldId: value } } */
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const form = await (prisma as any).form.findUnique({
    where: { slug: params.slug },
    include: { fields: true },
  })
  if (!form || form.status !== 'PUBLISHED') {
    return NextResponse.json({ error: 'Este formulario no está disponible.' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const answers = (body.answers && typeof body.answers === 'object') ? body.answers : {}

  // Validar campos requeridos (heading y button no son campos de respuesta)
  for (const f of form.fields) {
    if (f.type === 'heading' || f.type === 'button' || !f.required) continue
    const v = answers[f.id]
    const empty = v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)
    if (empty) return NextResponse.json({ error: `Falta responder: "${f.label}"` }, { status: 400 })
  }

  await (prisma as any).formResponse.create({ data: { formId: form.id, answers } })

  // Aviso si está activado: al DUEÑO del formulario (o a los admins si no tiene dueño)
  if (form.notifyEmail) {
    try {
      if (form.userId) {
        const owner = await prisma.user.findUnique({ where: { id: form.userId }, select: { email: true } })
        if (owner?.email) {
          createNotification(form.userId, 'Nueva respuesta de formulario', `"${form.title}" recibió una respuesta.`, `/dashboard/formularios/${form.id}/respuestas`).catch(() => {})
          sendFormResponseEmail(owner.email, form.title, form.id, 'dashboard').catch(() => {})
        }
      } else {
        const admins = await prisma.user.findMany({ where: { isAdmin: true }, select: { id: true, email: true } })
        await Promise.all(admins.flatMap(a => [
          createNotification(a.id, 'Nueva respuesta de formulario', `"${form.title}" recibió una respuesta.`, `/admin/formularios/${form.id}/respuestas`),
          sendFormResponseEmail(a.email, form.title, form.id, 'admin'),
        ]))
      }
    } catch { /* no romper el envío del usuario */ }
  }

  return NextResponse.json({ success: true, thankYouMsg: form.thankYouMsg || '¡Gracias por tu respuesta!' })
}
