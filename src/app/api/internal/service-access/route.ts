export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { userCanUseService } from '@/lib/service-access'

/**
 * GET /api/internal/service-access?key=<serviceKey>
 * Verificación de acceso usada SOLO por el middleware (server-to-server).
 * Devuelve { ok } según plan/pack/suscripción vigente y si el servicio está activo.
 * Los admins siempre pasan (para poder probar los servicios).
 */
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key') || ''
  if (!key) return NextResponse.json({ ok: false }, { status: 400 })

  const user = await getAuthUser()
  if (!user) return NextResponse.json({ ok: false, reason: 'auth' }, { status: 401 })
  if ((user as any).isAdmin) return NextResponse.json({ ok: true })

  const ok = await userCanUseService(user.id, key)
  return NextResponse.json({ ok })
}
