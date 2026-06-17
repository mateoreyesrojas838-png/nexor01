export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'

const PLAN_NAMES: Record<string, string> = { NONE: 'Sin plan', BASIC: 'Básico', PRO: 'Pro', ELITE: 'Elite' }

function csvCell(v: any): string {
  const s = v == null ? '' : String(v)
  return `"${s.replace(/"/g, '""')}"`
}

/** GET /api/admin/users/export — descarga CSV (Excel) de todos los usuarios. */
export async function GET() {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      fullName: true, username: true, email: true, phone: true, country: true, city: true,
      plan: true, isActive: true, isAdmin: true, aiCreditsUsd: true, referralCode: true, createdAt: true,
    },
  })

  const headers = ['Nombre completo', 'Usuario', 'Email', 'Teléfono', 'País', 'Ciudad', 'Plan', 'Activo', 'Admin', 'Créditos USD', 'Cód. referido', 'Registrado']
  const rows = users.map((u: any) => [
    u.fullName, u.username, u.email, u.phone || '', u.country || '', u.city || '',
    PLAN_NAMES[u.plan] || u.plan, u.isActive ? 'Sí' : 'No', u.isAdmin ? 'Sí' : 'No',
    (u.aiCreditsUsd ?? 0).toFixed(2), u.referralCode || '', new Date(u.createdAt).toLocaleString('es'),
  ])

  // BOM para que Excel abra UTF-8 correctamente
  const csv = '﻿' + [headers, ...rows].map(r => r.map(csvCell).join(',')).join('\r\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="usuarios-nexor.csv"`,
    },
  })
}
