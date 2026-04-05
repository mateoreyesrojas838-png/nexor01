export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BaileysManager } from '@/lib/baileys-manager'
import { persistLidMapping } from '@/lib/whatsapp-extractor'

/** POST /api/crm/extract/sync?botId=X — forces a deep sync to populate LID mappings */
export async function POST(req: NextRequest) {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const botId = searchParams.get('botId')
    if (!botId) return NextResponse.json({ error: 'botId requerido' }, { status: 400 })

    const bot = await prisma.bot.findFirst({ where: { id: botId, userId: user.id } })
    if (!bot) return NextResponse.json({ error: 'Bot no encontrado' }, { status: 404 })

    const status = BaileysManager.getStatus(botId)
    if (status.status !== 'connected') {
        return NextResponse.json({ error: 'Bot no conectado' }, { status: 400 })
    }

    const conn = (BaileysManager as any).getConnection?.(botId)
    const sock = conn?.sock
    if (!sock) return NextResponse.json({ error: 'Socket no disponible' }, { status: 500 })

    const startCount = await (prisma as any).whatsAppLidMap.count({ where: { botId } })

    try {
        // 1. Force app state resync — pulls contact list + label associations
        try {
            await sock.resyncAppState(['critical_block', 'regular', 'regular_low'], false)
        } catch { /* ignore resync errors */ }

        // 2. Fetch all groups — each group's metadata may populate participant phones
        try {
            const groups = await sock.groupFetchAllParticipating()
            for (const gid of Object.keys(groups || {})) {
                const g = groups[gid]
                if (!g?.participants) continue
                for (const p of g.participants) {
                    // Try to capture LID↔Phone from participant data
                    const pid = p.id
                    if (!pid) continue

                    // Case 1: id is phone format
                    if (typeof pid === 'string' && pid.endsWith('@s.whatsapp.net')) {
                        const phone = pid.replace('@s.whatsapp.net', '').split(':')[0]
                        // We have a phone — if there's also a lid field, map them
                        if (p.lid) {
                            await persistLidMapping(botId, p.lid, phone, null, 'group-sync').catch(() => {})
                        }
                    }
                    // Case 2: id is lid format + phoneNumber field exists
                    if (typeof pid === 'string' && pid.endsWith('@lid') && p.phoneNumber) {
                        const phone = String(p.phoneNumber).replace(/\D/g, '')
                        await persistLidMapping(botId, pid, phone, null, 'group-sync').catch(() => {})
                    }
                    // Case 3: id object with both .user and .lid
                    if (typeof pid === 'object') {
                        if (pid.user && pid.lid) {
                            await persistLidMapping(botId, pid.lid, pid.user, null, 'group-sync').catch(() => {})
                        }
                    }
                }
            }
        } catch { /* ignore */ }

        // 3. Iterate in-memory lidToPhone map and persist to DB
        if (conn?.lidToPhone) {
            for (const [lid, phone] of conn.lidToPhone.entries()) {
                await persistLidMapping(botId, lid, phone, null, 'memory-sync').catch(() => {})
            }
        }

        // 4. Give time for async events to fire
        await new Promise(r => setTimeout(r, 3000))

        const endCount = await (prisma as any).whatsAppLidMap.count({ where: { botId } })
        const newlyResolved = endCount - startCount

        return NextResponse.json({
            success: true,
            totalMappings: endCount,
            newlyResolved,
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Error al sincronizar' }, { status: 500 })
    }
}
