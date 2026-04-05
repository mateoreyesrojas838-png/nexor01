export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { BaileysManager } from '@/lib/baileys-manager'

function getAuth() {
    const token = cookies().get('auth_token')?.value
    if (!token) return null
    return verifyToken(token)
}

/** GET /api/bots/[botId]/baileys/groups — returns WhatsApp groups the bot is in */
export async function GET(
    _req: NextRequest,
    { params }: { params: { botId: string } },
) {
    const auth = getAuth()
    if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const bot = await prisma.bot.findFirst({
        where: { id: params.botId, userId: auth.userId },
        select: { id: true },
    })
    if (!bot) return NextResponse.json({ error: 'Bot no encontrado' }, { status: 404 })

    const status = BaileysManager.getStatus(params.botId)
    if (status.status !== 'connected') {
        return NextResponse.json({ groups: [], error: 'Bot no conectado' })
    }

    const groups = await BaileysManager.getGroups(params.botId)
    return NextResponse.json({ groups })
}

/** POST /api/bots/[botId]/baileys/groups — returns contacts of a specific group */
export async function POST(
    req: NextRequest,
    { params }: { params: { botId: string } },
) {
    const auth = getAuth()
    if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const bot = await prisma.bot.findFirst({
        where: { id: params.botId, userId: auth.userId },
        select: { id: true },
    })
    if (!bot) return NextResponse.json({ error: 'Bot no encontrado' }, { status: 404 })

    const status = BaileysManager.getStatus(params.botId)
    if (status.status !== 'connected') {
        return NextResponse.json({ error: 'Bot no conectado' }, { status: 400 })
    }

    const { groupId } = await req.json()
    if (!groupId) return NextResponse.json({ error: 'groupId requerido' }, { status: 400 })

    const contacts = await BaileysManager.getGroupContacts(params.botId, groupId)
    return NextResponse.json({ contacts })
}
