export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { listGroups, getSession } from '@/lib/waweb-extractor'

/** GET /api/crm/waweb/groups — list groups from WhatsApp Web session */
export async function GET() {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const session = getSession(user.id)
    console.log(`[WAWEB API] /groups — session status: ${session?.status || 'null'}`)
    if (!session || session.status !== 'ready') {
        return NextResponse.json({ error: `Sesión no lista (status: ${session?.status || 'none'})` }, { status: 400 })
    }

    const groups = await listGroups(user.id)
    console.log(`[WAWEB API] /groups — returned ${groups.length} groups`)
    return NextResponse.json({ groups })
}
