export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'

/**
 * GET /api/plan-status
 *
 * SOLO LECTURA — no hace escrituras en DB.
 *
 * La desactivación de planes expirados se hace en el cron:
 *   POST /api/cron/expire-plans  (llamado por Vercel Cron / pg_cron)
 *
 * PlanGuard llama este endpoint en cada navegación.
 * Antes hacía UPDATE en users + bots + stores en cada page load.
 * Con 500 usuarios navegando simultáneamente = 1500 writes/seg innecesarios.
 */
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const plan = user.plan ?? 'NONE'
    const planExpiresAt: Date | null = user.planExpiresAt ?? null
    const now = new Date()
    const expired = plan !== 'NONE' && planExpiresAt !== null && planExpiresAt < now

    return NextResponse.json({
      plan: expired ? 'NONE' : plan,
      planExpiresAt: planExpiresAt?.toISOString() ?? null,
      expired,
    })
  } catch (err) {
    console.error('[GET /api/plan-status]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
