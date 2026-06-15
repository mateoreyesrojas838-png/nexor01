export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/admin/impersonate/stop — restaura la sesión de admin guardada en `admin_token`.
 * No usa getAdminUser porque auth_token apunta al usuario impersonado; valida admin_token.
 */
export async function POST(req: NextRequest) {
  const adminToken = req.cookies.get('admin_token')?.value
  if (!adminToken) return NextResponse.json({ error: 'No hay sesión de admin para restaurar.' }, { status: 400 })

  const claims = verifyToken(adminToken)
  if (!claims) return NextResponse.json({ error: 'Sesión de admin inválida.' }, { status: 401 })

  // Confirmar que ese token corresponde a un admin real
  const adminUser = await prisma.user.findUnique({ where: { id: claims.userId }, select: { id: true, isAdmin: true } })
  if (!adminUser?.isAdmin) return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })

  const res = NextResponse.json({ ok: true })
  res.cookies.set('auth_token', adminToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  res.cookies.set('admin_token', '', { httpOnly: true, path: '/', maxAge: 0 })
  return res
}
