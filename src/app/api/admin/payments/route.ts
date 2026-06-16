export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'
import { PERIOD_LABEL } from '@/lib/plan-period'

const PLAN_NAME: Record<string, string> = { BASIC: 'Pack Básico', PRO: 'Pack Pro', ELITE: 'Pack Elite' }
const num = (v: any) => (v == null ? 0 : Number(v))

// Orden: pendientes primero, luego verificando, luego el resto; dentro, más nuevo primero.
const STATUS_RANK: Record<string, number> = { PENDING: 0, PENDING_VERIFICATION: 1, APPROVED: 2, PAID: 2, REJECTED: 3 }
function sortRows(rows: any[]) {
  return rows.sort((a, b) => (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9) || (b.createdAt > a.createdAt ? 1 : -1))
}

const isRevenue = (s: string) => s === 'APPROVED' || s === 'PAID'
function monthStart() { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) }

/** GET /api/admin/payments — todos los pagos, separados por tipo + resumen. */
export async function GET() {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  const [packs, subs, enrolls, services] = await Promise.all([
    prisma.packPurchaseRequest.findMany({
      orderBy: { createdAt: 'desc' }, take: 400,
      include: { user: { select: { fullName: true, email: true, username: true } } },
    }),
    (prisma as any).serviceSubscription.findMany({
      orderBy: { createdAt: 'desc' }, take: 400,
      include: { user: { select: { fullName: true, email: true, username: true } } },
    }),
    (prisma as any).courseEnrollment.findMany({
      orderBy: { createdAt: 'desc' }, take: 400,
      include: { user: { select: { fullName: true, email: true, username: true } }, course: { select: { title: true, price: true } } },
    }),
    (prisma as any).service.findMany({ select: { key: true, name: true } }),
  ])

  const svcName: Record<string, string> = {}
  services.forEach((s: any) => { svcName[s.key] = s.name })

  const plans = sortRows(packs.map((p: any) => ({
    id: p.id, kind: 'plan', label: PLAN_NAME[p.plan] || p.plan,
    method: (p.notes && String(p.notes).startsWith('LIBELULA')) ? 'LIBELULA' : p.paymentMethod,
    status: p.status, amount: num(p.price), period: PERIOD_LABEL[p.period] || null,
    proofUrl: p.paymentProofUrl, txHash: p.txHash,
    user: p.user, createdAt: p.createdAt,
  })))

  const servicesRows = sortRows(subs.map((s: any) => ({
    id: s.id, kind: 'service', serviceKey: s.serviceKey, label: svcName[s.serviceKey] || s.serviceKey,
    method: s.paymentMethod, status: s.status, amount: num(s.price), period: PERIOD_LABEL[s.period] || null,
    proofUrl: s.proofUrl, txHash: s.txHash, user: s.user, createdAt: s.createdAt,
  })))

  const courses = sortRows(enrolls.map((e: any) => ({
    id: e.id, kind: 'course', label: e.course?.title || 'Curso',
    method: e.paymentMethod, status: e.status, amount: num(e.course?.price), period: null,
    proofUrl: e.proofUrl, txHash: e.txHash, user: e.user, createdAt: e.createdAt,
  })))

  // Resumen
  const ms = monthStart()
  function summarize(rows: any[]) {
    const pending = rows.filter(r => r.status === 'PENDING' || r.status === 'PENDING_VERIFICATION').length
    const revenue = rows.filter(r => isRevenue(r.status)).reduce((a, r) => a + r.amount, 0)
    const revenueMonth = rows.filter(r => isRevenue(r.status) && new Date(r.createdAt) >= ms).reduce((a, r) => a + r.amount, 0)
    return { pending, revenue, revenueMonth }
  }
  const sPlans = summarize(plans), sServices = summarize(servicesRows), sCourses = summarize(courses)

  // Resumen por cada servicio (para las tarjetas/páginas separadas)
  const byService: Record<string, any> = {}
  services.forEach((s: any) => {
    byService[s.key] = { name: s.name, ...summarize(servicesRows.filter((r: any) => r.serviceKey === s.key)) }
  })

  return NextResponse.json({
    plans, services: servicesRows, courses,
    serviceList: services, // [{ key, name }]
    summary: {
      pendingTotal: sPlans.pending + sServices.pending + sCourses.pending,
      revenueTotal: sPlans.revenue + sServices.revenue + sCourses.revenue,
      revenueMonth: sPlans.revenueMonth + sServices.revenueMonth + sCourses.revenueMonth,
      byKind: { plan: sPlans, service: sServices, course: sCourses },
      byService,
    },
  })
}
