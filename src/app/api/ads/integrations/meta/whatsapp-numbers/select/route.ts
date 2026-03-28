export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { phoneId, displayPhone, name } = await req.json()
    if (!phoneId || !displayPhone) return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })

    const integration = await prisma.adIntegration.findUnique({
        where: { userId_platform: { userId: user.id, platform: 'META' } }
    })
    if (!integration) return NextResponse.json({ error: 'Meta no conectado' }, { status: 400 })

    await prisma.adConnectedAccount.upsert({
        where: { integrationId: integration.id },
        create: {
            integrationId: integration.id,
            providerAccountId: phoneId,
            displayName: `${name} · ${displayPhone}`,
            isDefault: true
        },
        update: {
            providerAccountId: phoneId,
            displayName: `${name} · ${displayPhone}`
        }
    })

    return NextResponse.json({ success: true })
}
