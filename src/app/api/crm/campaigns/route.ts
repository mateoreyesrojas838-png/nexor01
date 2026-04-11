export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateSecureToken } from '@/lib/crypto'

export async function GET() {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const campaigns = await (prisma as any).broadcastCampaign.findMany({
        where: { userId: user.id },
        include: {
            bot: { select: { id: true, name: true, baileysPhone: true } },
            images: { orderBy: { order: 'asc' } },
            _count: { select: { contacts: true, logs: true } },
        },
        orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ campaigns })
}

export async function POST(req: NextRequest) {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const { name, prompt, delayValue, delayUnit, scheduledAt } = body

    if (!name?.trim()) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    if (!prompt?.trim()) return NextResponse.json({ error: 'El prompt es requerido' }, { status: 400 })

    // Auto-crear bot Baileys dedicado para esta campaña
    const webhookToken = generateSecureToken(32)
    const bot = await prisma.bot.create({
        data: {
            userId: user.id,
            name: `CRM: ${name.trim()}`,
            type: 'BAILEYS',
            webhookToken,
            systemPromptTemplate: '',
        },
    })

    const campaign = await (prisma as any).broadcastCampaign.create({
        data: {
            userId: user.id,
            botId: bot.id,
            name: name.trim(),
            prompt: prompt.trim(),
            delayValue: parseInt(delayValue) || 30,
            delayUnit: delayUnit || 'seconds',
            scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
            status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
        },
        include: {
            bot: { select: { id: true, name: true } },
            images: true,
        },
    })

    return NextResponse.json({ campaign }, { status: 201 })
}
