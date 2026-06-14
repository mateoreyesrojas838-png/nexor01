export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'

function csvCell(v: any): string {
  let s = Array.isArray(v) ? v.join('; ') : (v == null ? '' : String(v))
  if (/[",\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"'
  return s
}

/** GET — respuestas del formulario. ?format=csv para exportar. */
export async function GET(req: NextRequest, { params }: { params: { formId: string } }) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  const form = await (prisma as any).form.findUnique({
    where: { id: params.formId },
    include: { fields: { orderBy: { order: 'asc' } } },
  })
  if (!form) return NextResponse.json({ error: 'Formulario no encontrado' }, { status: 404 })

  const responses = await (prisma as any).formResponse.findMany({
    where: { formId: params.formId },
    orderBy: { createdAt: 'desc' },
  })

  const cols = form.fields.filter((f: any) => f.type !== 'heading')

  if (req.nextUrl.searchParams.get('format') === 'csv') {
    const header = ['Fecha', ...cols.map((c: any) => c.label)]
    const lines = [header.map(csvCell).join(',')]
    for (const r of responses) {
      const row = [new Date(r.createdAt).toLocaleString('es-ES'), ...cols.map((c: any) => csvCell((r.answers as any)?.[c.id]))]
      lines.push(row.join(','))
    }
    const csv = '﻿' + lines.join('\n') // BOM para Excel
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${form.slug}-respuestas.csv"`,
      },
    })
  }

  return NextResponse.json({
    fields: cols.map((c: any) => ({ id: c.id, label: c.label, type: c.type })),
    responses: responses.map((r: any) => ({ id: r.id, answers: r.answers, createdAt: r.createdAt })),
    total: responses.length,
  })
}
