export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  const [totalUsers, activeUsers, pendingPurchases, recentPurchases, revenueAgg] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.packPurchaseRequest.count({ where: { status: 'PENDING' } }),
    prisma.packPurchaseRequest.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { username: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.packPurchaseRequest.aggregate({
      where: { status: 'APPROVED' },
      _sum: { price: true },
    }),
  ])

  const totalRevenue = Number(revenueAgg._sum.price ?? 0)

  return NextResponse.json({
    stats: {
      totalUsers,
      activeUsers,
      pendingPurchases,
      pendingWithdrawals: 0,
      totalCommissions: 0,
      totalRevenue,
    },
    recentPurchases: recentPurchases.map(r => ({ ...r, price: Number(r.price) })),
    recentWithdrawals: [],
  })
}
