export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'

/** PATCH — edita un recurso. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()
  const b = await req.json()
  const data: any = {}
  for (const k of ['category', 'description', 'coverUrl', 'fileUrl', 'imageUrl', 'videoUrl', 'buttonLabel', 'buttonUrl'] as const) {
    if (b[k] !== undefined) data[k] = b[k] || null
  }
  if (b.title !== undefined) data.title = String(b.title).trim()
  if (b.active !== undefined) data.active = !!b.active
  if (b.order !== undefined) data.order = Number(b.order) || 0

  const item = await (prisma as any).toolResource.update({ where: { id: params.id }, data })
  return NextResponse.json({ item })
}

/** DELETE — elimina un recurso. */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()
  await (prisma as any).toolResource.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
