export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const VALID_PLATFORMS = ['META']
const VALID_OBJECTIVES = ['conversions', 'leads', 'traffic', 'awareness', 'engagement', 'app_promotion']
const VALID_DESTINATIONS = ['instagram', 'whatsapp', 'website', 'messenger']
const VALID_MEDIA_TYPES = ['image', 'video', 'carousel']

export async function PATCH(req: Request, { params }: { params: { strategyId: string } }) {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const strategy = await (prisma as any).adStrategy.findFirst({
        where: { id: params.strategyId, userId: user.id, isGlobal: false }
    })
    if (!strategy) return NextResponse.json({ error: 'Estrategia no encontrada o no editable' }, { status: 404 })

    const body = await req.json()
    const {
        name, description, platform, objective,
        destination, mediaType, mediaCount, minBudgetUSD, savedByUser
    } = body

    const data: any = {}
    if (name && typeof name === 'string') data.name = name.trim().slice(0, 80)
    if (description && typeof description === 'string') data.description = description.trim()
    if (platform && VALID_PLATFORMS.includes(platform)) data.platform = platform
    if (objective && VALID_OBJECTIVES.includes(objective)) data.objective = objective
    if (destination && VALID_DESTINATIONS.includes(destination)) data.destination = destination
    if (mediaType && VALID_MEDIA_TYPES.includes(mediaType)) data.mediaType = mediaType
    if (mediaCount && Number.isInteger(mediaCount) && mediaCount > 0 && mediaCount <= 30) data.mediaCount = mediaCount
    if (minBudgetUSD && typeof minBudgetUSD === 'number' && minBudgetUSD > 0) data.minBudgetUSD = minBudgetUSD
    if (typeof savedByUser === 'boolean') data.savedByUser = savedByUser

    if (Object.keys(data).length === 0) {
        return NextResponse.json({ error: 'No hay campos válidos para actualizar' }, { status: 400 })
    }

    const updated = await (prisma as any).adStrategy.update({
        where: { id: params.strategyId },
        data
    })

    return NextResponse.json({ strategy: updated })
}

export async function DELETE(_req: Request, { params }: { params: { strategyId: string } }) {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const strategy = await (prisma as any).adStrategy.findFirst({
        where: { id: params.strategyId, userId: user.id, isGlobal: false }
    })
    if (!strategy) return NextResponse.json({ error: 'Estrategia no encontrada' }, { status: 404 })

    // Check if any campaign uses this strategy
    const campaignCount = await (prisma as any).adCampaignV2.count({
        where: { strategyId: params.strategyId }
    })
    if (campaignCount > 0) {
        return NextResponse.json({ error: 'No puedes eliminar una estrategia que ya tiene campañas asociadas' }, { status: 400 })
    }

    await (prisma as any).adStrategy.delete({ where: { id: params.strategyId } })

    return NextResponse.json({ message: 'Estrategia eliminada' })
}
