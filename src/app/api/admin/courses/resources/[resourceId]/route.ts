export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabase'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'

const BUCKET = 'course-files'

/** DELETE — elimina el material y su archivo del bucket */
export async function DELETE(_req: NextRequest, { params }: { params: { resourceId: string } }) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  const resource = await (prisma as any).courseResource.findUnique({
    where: { id: params.resourceId }, select: { filePath: true },
  })
  if (resource?.filePath) {
    await supabaseAdmin.storage.from(BUCKET).remove([resource.filePath]).catch(() => {})
  }
  await (prisma as any).courseResource.delete({ where: { id: params.resourceId } })
  return NextResponse.json({ ok: true })
}
