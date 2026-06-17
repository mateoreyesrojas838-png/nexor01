export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

/** GET — recursos ACTIVOS para el usuario, agrupados por sección. (Acceso gateado por middleware.) */
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const items = await (prisma as any).toolResource.findMany({
    where: { active: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  })

  const grouped: Record<string, any[]> = { CATALOGO: [], TESTIMONIO: [], PROMOCION: [], BIBLIOTECA: [], GUION: [] }
  for (const it of items) (grouped[it.section] ||= []).push(it)

  return NextResponse.json({ sections: grouped })
}
