export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, getSessionClaims } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  const claims = getSessionClaims()
  return NextResponse.json({
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    plan: user.plan,
    planExpiresAt: user.planExpiresAt,
    isAdmin: user.isAdmin,
    impersonating: !!claims?.imp, // sesión "Ver como usuario" iniciada por un admin
  })
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json() as { avatarUrl?: string }
  if (!body.avatarUrl?.trim()) {
    return NextResponse.json({ error: 'URL de avatar requerida' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl: body.avatarUrl.trim() },
  })

  return NextResponse.json({ ok: true })
}
