export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'

const PLAN_NAMES: Record<string, string> = { NONE: 'Sin plan', BASIC: 'Básico', PRO: 'Pro', ELITE: 'Elite' }

function csvCell(v: any): string {
  const s = v == null ? '' : String(v)
  return `"${s.replace(/"/g, '""')}"`
}
function buildCsv(headers: string[], rows: any[][]): string {
  return '﻿' + [headers, ...rows].map(r => r.map(csvCell).join(',')).join('\r\n')
}
function csvResponse(csv: string, filename: string) {
  return new NextResponse(csv, {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${filename}"` },
  })
}

/**
 * GET /api/admin/users/export        → todos los usuarios registrados.
 * GET /api/admin/users/export?service=<key> → solo los que tienen acceso a ese servicio
 *   (suscripción suelta aprobada y vigente, o plan activo que lo incluye).
 */
export async function GET(req: NextRequest) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  const serviceKey = req.nextUrl.searchParams.get('service')

  // ── Export GENERAL (todos los registrados) ──
  if (!serviceKey) {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { fullName: true, username: true, email: true, phone: true, country: true, city: true, plan: true, isActive: true, isAdmin: true, aiCreditsUsd: true, referralCode: true, createdAt: true },
    })
    const headers = ['Nombre completo', 'Usuario', 'Email', 'Teléfono', 'País', 'Ciudad', 'Plan', 'Activo', 'Admin', 'Créditos USD', 'Cód. referido', 'Registrado']
    const rows = users.map((u: any) => [
      u.fullName, u.username, u.email, u.phone || '', u.country || '', u.city || '',
      PLAN_NAMES[u.plan] || u.plan, u.isActive ? 'Sí' : 'No', u.isAdmin ? 'Sí' : 'No',
      (u.aiCreditsUsd ?? 0).toFixed(2), u.referralCode || '', new Date(u.createdAt).toLocaleString('es'),
    ])
    return csvResponse(buildCsv(headers, rows), 'usuarios-nexor.csv')
  }

  // ── Export POR SERVICIO ──
  const service = await (prisma as any).service.findUnique({ where: { key: serviceKey }, select: { name: true } })
  const serviceName = service?.name || serviceKey
  const now = new Date()

  // 1) Por suscripción suelta vigente
  const subs = await (prisma as any).serviceSubscription.findMany({
    where: { serviceKey, status: 'APPROVED', expiresAt: { gt: now } },
    include: { user: { select: { fullName: true, username: true, email: true, phone: true, country: true, createdAt: true } } },
    orderBy: { createdAt: 'desc' },
  })

  // 2) Por plan activo que incluye el servicio
  const plansWith = await (prisma as any).planConfig.findMany({ where: { services: { has: serviceKey } }, select: { plan: true } })
  const planKeys = plansWith.map((p: any) => p.plan)
  const planUsers = planKeys.length
    ? await prisma.user.findMany({
        where: { plan: { in: planKeys as any }, OR: [{ planExpiresAt: null }, { planExpiresAt: { gt: now } }] },
        select: { fullName: true, username: true, email: true, phone: true, country: true, plan: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      })
    : []

  // 3) Registrados desde la página de ESE servicio (aunque no hayan comprado)
  const regOnly = await prisma.user.findMany({
    where: { regSource: serviceKey },
    select: { fullName: true, username: true, email: true, phone: true, country: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  // Unir por email. Prioridad de etiqueta: Suscripción > Plan > Solo registrado.
  const byEmail = new Map<string, any>()
  for (const u of regOnly) byEmail.set(u.email, { ...u, via: 'Solo registrado' })
  for (const u of planUsers) byEmail.set(u.email, { ...u, via: `Plan ${PLAN_NAMES[u.plan] || u.plan}` })
  for (const s of subs) {
    const u = s.user
    byEmail.set(u.email, { ...u, via: `Suscripción (${s.period})` })
  }

  const headers = ['Nombre completo', 'Usuario', 'Email', 'Teléfono', 'País', 'Acceso vía', 'Registrado']
  const rows = Array.from(byEmail.values()).map((u: any) => [
    u.fullName, u.username, u.email, u.phone || '', u.country || '', u.via, new Date(u.createdAt).toLocaleString('es'),
  ])
  const safeName = serviceName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return csvResponse(buildCsv(headers, rows), `usuarios-${safeName}.csv`)
}
