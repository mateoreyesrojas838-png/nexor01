export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { createSession, getSession, destroySession } from '@/lib/waweb-extractor'

/** POST /api/crm/waweb/session — start session in background, return immediately */
export async function POST() {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    // Check if session already exists
    const existing = getSession(user.id)
    if (existing) {
        return NextResponse.json({
            status: existing.status,
            qr: existing.qrBase64 || null,
            phone: existing.phone || null,
        })
    }

    // Start in background — don't await! Return immediately.
    createSession(user.id).catch(err => {
        console.error('[WAWEB] Background init error:', err)
    })

    return NextResponse.json({
        status: 'loading',
        qr: null,
        phone: null,
        message: 'Iniciando sesión... Esperá unos segundos.',
    })
}

/** GET /api/crm/waweb/session — poll status */
export async function GET() {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const session = getSession(user.id)
    if (!session) {
        return NextResponse.json({ status: 'none' })
    }

    // Log only on state changes (not every 2s)
    if (session.status === 'ready' || session.status === 'error') {
        console.log(`[WAWEB API] GET /session — status: ${session.status}, phone: ${session.phone}`)
    }

    return NextResponse.json({
        status: session.status,
        qr: session.qrBase64 || null,
        phone: session.phone || null,
    })
}

/** DELETE /api/crm/waweb/session — destroy session */
export async function DELETE() {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    await destroySession(user.id)
    return NextResponse.json({ ok: true })
}
