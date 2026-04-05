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
        // ─── STEP 1: Force app state resync ────────────────────────────────
        try {
            await sock.resyncAppState(['critical_block', 'regular', 'regular_low'], false)
        } catch { /* ignore */ }

        // ─── STEP 2: Fetch all groups and extract participant mappings ─────
        try {
            const groups = await sock.groupFetchAllParticipating()
            for (const gid of Object.keys(groups || {})) {
                const g = groups[gid]
                if (!g?.participants) continue

                for (const p of g.participants) {
                    if (!p?.id) continue

                    const idStr = typeof p.id === 'string' ? p.id : (p.id._serialized || '')

                    // Case A: id is phone JID → capture name if present
                    if (idStr.endsWith('@s.whatsapp.net')) {
                        const phone = idStr.replace('@s.whatsapp.net', '').split(':')[0]
                        // If participant also has a lid field, map them
                        const lidField = p.lid || p.lidJid || p.participantLid
                        if (lidField) {
                            await persistLidMapping(botId, String(lidField), phone, p.name || null, 'group').catch(() => {})
                        }
                    }

                    // Case B: id is LID format → try to find phone in other fields
                    if (idStr.endsWith('@lid')) {
                        const phoneField = p.phoneNumber || p.jid || p.phoneJid || p.participantPhone
                        if (phoneField) {
                            const phone = String(phoneField).replace(/@.*/, '').replace(/\D/g, '')
                            if (phone.length >= 8) {
                                await persistLidMapping(botId, idStr, phone, p.name || null, 'group').catch(() => {})
                            }
                        }
                    }
                }
            }
        } catch { /* ignore */ }

        // ─── STEP 3: Use existing conversations to build reverse PN→LID map
        //     This is the KEY optimization: we know these phones from real
        //     conversations, so we ask WhatsApp for their LIDs and store the
        //     mapping in the reverse direction.
        try {
            const conversations = await prisma.conversation.findMany({
                where: { botId },
                select: { userPhone: true, userName: true },
                take: 500, // limit to avoid rate limits
            })

            // Batch onWhatsApp in chunks of 50
            const phones = conversations
                .map(c => c.userPhone?.replace(/\D/g, ''))
                .filter((p): p is string => !!p && p.length >= 8)

            const phoneToName = new Map(
                conversations.map(c => [c.userPhone?.replace(/\D/g, '') || '', c.userName || ''])
            )

            const CHUNK = 50
            for (let i = 0; i < phones.length; i += CHUNK) {
                const batch = phones.slice(i, i + CHUNK)
                try {
                    const results = await sock.onWhatsApp(...batch)
                    if (!Array.isArray(results)) continue

                    for (const r of results) {
                        if (!r?.exists) continue
                        const pnJid = r.jid || r.id
                        if (!pnJid) continue

                        // Extract phone from PN JID
                        const match = String(pnJid).match(/^(\d+)/)
                        if (!match) continue
                        const phone = match[1]

                        // Check if result includes a LID field
                        const lid = r.lid || r.lidJid
                        if (lid) {
                            const name = phoneToName.get(phone) || null
                            await persistLidMapping(botId, String(lid), phone, name, 'onwhatsapp').catch(() => {})
                        }
                    }
                } catch { /* ignore batch errors */ }
            }
        } catch { /* ignore */ }

        // ─── STEP 4: Persist in-memory Baileys lidToPhone map to DB ────────
        if (conn?.lidToPhone) {
            for (const [lid, phone] of conn.lidToPhone.entries()) {
                await persistLidMapping(botId, lid, phone, null, 'memory').catch(() => {})
            }
        }

        // ─── STEP 5: Wait for async events to flush ────────────────────────
        await new Promise(r => setTimeout(r, 2000))

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
