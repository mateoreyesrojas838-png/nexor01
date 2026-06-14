export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/** GET público — definición del formulario para responderlo (solo si está PUBLICADO). */
export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const form = await (prisma as any).form.findUnique({
    where: { slug: params.slug },
    include: { fields: { orderBy: { order: 'asc' } } },
  })
  if (!form) return NextResponse.json({ error: 'Formulario no encontrado' }, { status: 404 })
  if (form.status !== 'PUBLISHED') {
    return NextResponse.json({ error: 'Este formulario no está disponible.', closed: form.status === 'CLOSED' }, { status: 403 })
  }

  return NextResponse.json({
    form: {
      id: form.id,
      title: form.title,
      description: form.description,
      themeColor: form.themeColor,
      themeColors: form.themeColors,
      buttonColor: form.buttonColor,
      coverUrl: form.coverUrl,
      headerVideoUrl: form.headerVideoUrl,
      showSubmit: form.showSubmit,
      redirectUrl: form.redirectUrl,
      thankYouMsg: form.thankYouMsg,
      fields: form.fields.map((f: any) => ({
        id: f.id, type: f.type, label: f.label, description: f.description,
        required: f.required, options: f.options, settings: f.settings,
      })),
    },
  })
}
