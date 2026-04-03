export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** GET /api/crm/templates — returns active CRM prompt templates for users */
export async function GET() {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const templates = await (prisma as any).promptTemplate.findMany({
        where: { category: 'crm', isActive: true },
        orderBy: { usageCount: 'desc' },
        select: {
            id: true,
            name: true,
            description: true,
            content: true,
            usageCount: true,
        },
    })

    return NextResponse.json({ templates })
}
