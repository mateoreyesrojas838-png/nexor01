export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** GET /api/pack-requests — lista las solicitudes del usuario autenticado */
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const requests = await prisma.packPurchaseRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        plan: true,
        price: true,
        status: true,
        notes: true,
        paymentProofUrl: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      requests: requests.map(r => ({ ...r, price: Number(r.price) })),
    })
  } catch (err) {
    console.error('[GET /api/pack-requests]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

/** POST /api/pack-requests — crea una nueva solicitud de compra */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json()
    const { plan, price, paymentProofUrl } = body

    if (!plan || !price || !paymentProofUrl) {
      return NextResponse.json(
        { error: 'plan, price y paymentProofUrl son requeridos' },
        { status: 400 }
      )
    }

    const validPlans = ['BASIC', 'PRO', 'ELITE']
    if (!validPlans.includes(plan)) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }

    // Solo una solicitud PENDING a la vez por usuario
    const existing = await prisma.packPurchaseRequest.findFirst({
      where: { userId: user.id, status: 'PENDING' },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Ya tienes una solicitud pendiente. Espera a que sea procesada.' },
        { status: 409 }
      )
    }

    const req = await prisma.packPurchaseRequest.create({
      data: {
        userId: user.id,
        plan,
        price,
        paymentProofUrl,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ request: { ...req, price: Number(req.price) } }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/pack-requests]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
