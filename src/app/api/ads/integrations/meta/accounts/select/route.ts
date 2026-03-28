export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { providerAccountId, displayName, currency, timezone } = await req.json()
    if (!providerAccountId) return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })

    const integration = await prisma.adIntegration.findUnique({
        where: { userId_platform: { userId: user.id, platform: 'META' } }
    })
    if (!integration) return NextResponse.json({ error: 'Meta no conectado' }, { status: 400 })

    const connectedAccount = await prisma.adConnectedAccount.upsert({
        where: { integrationId: integration.id },
        create: { integrationId: integration.id, providerAccountId, displayName, currency, timezone, isDefault: true },
        update: { providerAccountId, displayName, currency, timezone, isDefault: true }
    })

    return NextResponse.json({ success: true, connectedAccount })
}
