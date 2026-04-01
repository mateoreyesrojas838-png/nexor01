export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** GET /api/prompt-templates — lista plantillas activas para usuarios */
export async function GET() {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const templates = await (prisma as any).promptTemplate.findMany({
        where: { isActive: true },
        select: {
            id: true,
            name: true,
            description: true,
            content: true,
            category: true,
            usageCount: true,
        },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })
    return NextResponse.json({ templates })
}

/** POST /api/prompt-templates/[id]/use — incrementa contador de uso */
export async function POST(req: Request) {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

    await (prisma as any).promptTemplate.update({
        where: { id },
        data: { usageCount: { increment: 1 } },
    }).catch(() => {})

    return NextResponse.json({ ok: true })
}
