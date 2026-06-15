export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'
import { generateToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
}

/** POST /api/admin/users/[id]/impersonate — el admin inicia sesión "Ver como" ese usuario. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  if (params.id === (admin as any).id) {
    return NextResponse.json({ error: 'Ya estás en tu propia sesión.' }, { status: 400 })
  }

  const target = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, username: true, email: true, fullName: true },
  })
  if (!target) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  // Token de la sesión del usuario, marcado como impersonación (imp = id del admin)
  const userToken = generateToken({ userId: target.id, username: target.username, email: target.email, imp: (admin as any).id })

  // Guardamos el token de admin actual para poder volver, y reemplazamos auth_token.
  const adminToken = req.cookies.get('auth_token')?.value

  const res = NextResponse.json({ ok: true, user: { id: target.id, username: target.username, fullName: target.fullName } })
  if (adminToken) {
    res.cookies.set('admin_token', adminToken, { ...COOKIE_BASE, maxAge: 60 * 60 * 4 }) // 4h
  }
  res.cookies.set('auth_token', userToken, { ...COOKIE_BASE, maxAge: 60 * 60 * 4 })

  // Auditoría: quién vio a quién
  prisma.auditLog.create({
    data: {
      userId: target.id,
      actorUserId: (admin as any).id,
      action: 'ADMIN_IMPERSONATE_START',
      entityType: 'User',
      entityId: target.id,
      payload: { adminUsername: (admin as any).username, targetUsername: target.username },
    },
  }).catch(() => {})

  return res
}
