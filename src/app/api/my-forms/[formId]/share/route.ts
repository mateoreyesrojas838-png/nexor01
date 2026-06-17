export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

function slugify(text: string): string {
  return (text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50)) || 'form'
}

/**
 * POST /api/my-forms/[formId]/share — Body: { identifier }  (@username o email)
 * Crea una copia independiente del formulario (con sus campos) para el destinatario.
 */
export async function POST(req: NextRequest, { params }: { params: { formId: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const identifier = String(body.identifier ?? '').trim().replace(/^@/, '')
  if (!identifier) return NextResponse.json({ error: 'username o email requerido' }, { status: 400 })

  const source = await (prisma as any).form.findFirst({
    where: { id: params.formId, userId: user.id },
    include: { fields: { orderBy: { order: 'asc' } } },
  })
  if (!source) return NextResponse.json({ error: 'Formulario no encontrado' }, { status: 404 })

  const recipient = await prisma.user.findFirst({
    where: { OR: [{ username: identifier }, { email: identifier.toLowerCase() }] },
    select: { id: true, username: true, email: true },
  })
  if (!recipient) return NextResponse.json({ error: 'Usuario no encontrado. Verificá el username o email.' }, { status: 404 })
  if (recipient.id === user.id) return NextResponse.json({ error: 'No puedes compartir un formulario contigo mismo.' }, { status: 400 })

  const already = await (prisma as any).form.findFirst({ where: { userId: recipient.id, clonedFromId: source.id } })
  if (already) return NextResponse.json({ error: `Ya compartiste este formulario con @${recipient.username ?? recipient.email}.` }, { status: 409 })

  let slug = slugify(source.title) + '-' + Math.random().toString(36).slice(2, 6)
  if (await (prisma as any).form.findUnique({ where: { slug } })) slug += Math.random().toString(36).slice(2, 4)

  // Copia independiente (en DRAFT) + sus campos
  await prisma.$transaction(async (tx) => {
    const copy = await (tx as any).form.create({
      data: {
        userId: recipient.id,
        title: source.title,
        description: source.description,
        slug,
        status: 'DRAFT',
        themeColor: source.themeColor,
        themeColors: source.themeColors ?? undefined,
        buttonColor: source.buttonColor,
        coverUrl: source.coverUrl,
        headerVideoUrl: source.headerVideoUrl,
        showSubmit: source.showSubmit,
        redirectUrl: source.redirectUrl,
        notifyEmail: source.notifyEmail,
        thankYouMsg: source.thankYouMsg,
        clonedFromId: source.id,
        sharedByUsername: user.username ?? null,
      },
    })
    if (source.fields?.length) {
      await (tx as any).formField.createMany({
        data: source.fields.map((f: any) => ({
          formId: copy.id, type: f.type, label: f.label, description: f.description,
          required: f.required, options: f.options ?? undefined, settings: f.settings ?? undefined, order: f.order,
        })),
      })
    }
  })

  return NextResponse.json({ ok: true, message: `Formulario compartido con @${recipient.username ?? recipient.email}` })
}
