export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** POST /api/crm/templates/[id]/use — increment usage count */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    await (prisma as any).promptTemplate.update({
        where: { id: params.id },
        data: { usageCount: { increment: 1 } },
    }).catch(() => {})

    return NextResponse.json({ ok: true })
}
