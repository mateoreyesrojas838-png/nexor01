export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { listLabels, getSession } from '@/lib/waweb-extractor'

/** GET /api/crm/waweb/labels — list labels from WhatsApp Web session */
export async function GET() {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const session = getSession(user.id)
    console.log(`[WAWEB API] /labels — session status: ${session?.status || 'null'}`)
    if (!session || session.status !== 'ready') {
        return NextResponse.json({ error: `Sesión no lista (status: ${session?.status || 'none'})` }, { status: 400 })
    }

    const labels = await listLabels(user.id)
    console.log(`[WAWEB API] /labels — returned ${labels.length} labels`)
    return NextResponse.json({ labels })
}
