export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'
import { sendCustomEmail } from '@/lib/email'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** GET — cuántos respondientes tienen email (para mostrar en la UI) */
export async function GET(_req: NextRequest, { params }: { params: { formId: string } }) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  const emails = await collectEmails(params.formId)
  return NextResponse.json({ count: emails.length })
}

/** POST — envía un correo a todos los que respondieron y dejaron un email. Body: { subject, message } */
export async function POST(req: NextRequest, { params }: { params: { formId: string } }) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  const { subject, message } = await req.json()
  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Asunto y mensaje son requeridos' }, { status: 400 })
  }

  const emails = await collectEmails(params.formId)
  if (emails.length === 0) return NextResponse.json({ error: 'No hay respondientes con email en este formulario.' }, { status: 400 })

  // Enviar (en serie con un pequeño respiro para no saturar Gmail)
  let sent = 0
  for (const to of emails) {
    const ok = await sendCustomEmail(to, subject.trim(), message.trim())
    if (ok) sent++
  }

  return NextResponse.json({ ok: true, sent, total: emails.length })
}

/** Extrae los emails únicos de las respuestas (de los campos tipo email). */
async function collectEmails(formId: string): Promise<string[]> {
  const form = await (prisma as any).form.findUnique({
    where: { id: formId },
    include: { fields: true },
  })
  if (!form) return []
  const emailFieldIds = form.fields.filter((f: any) => f.type === 'email').map((f: any) => f.id)
  if (emailFieldIds.length === 0) return []

  const responses = await (prisma as any).formResponse.findMany({ where: { formId } })
  const set = new Set<string>()
  for (const r of responses) {
    for (const fid of emailFieldIds) {
      const v = (r.answers as any)?.[fid]
      if (typeof v === 'string' && EMAIL_RE.test(v.trim())) set.add(v.trim().toLowerCase())
    }
  }
  return [...set]
}
