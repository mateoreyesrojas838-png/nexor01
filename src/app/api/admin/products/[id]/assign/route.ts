export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

/**
 * POST /api/admin/products/[id]/assign
 * Body: { identifier: string } — @username o email del destinatario
 * Clona el producto del admin al usuario destinatario.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const admin = await getAdminUser()
    if (!admin) return unauthorizedAdmin()

    const body = await req.json()
    const rawIdentifier: string = body.identifier ?? ''
    const identifier = rawIdentifier.trim().replace(/^@/, '')
    if (!identifier) return NextResponse.json({ error: 'username o email requerido' }, { status: 400 })

    const source = await prisma.product.findFirst({
        where: { id: params.id, userId: (admin as any).id },
    })
    if (!source) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })

    const recipient = await prisma.user.findFirst({
        where: {
            OR: [
                { username: identifier },
                { email: identifier.toLowerCase() },
            ],
        },
        select: { id: true, username: true, email: true },
    })
    if (!recipient) return NextResponse.json({ error: 'Usuario no encontrado. Verifica el username o email.' }, { status: 404 })

    // Evitar duplicado
    const alreadyShared = await prisma.product.findFirst({
        where: { userId: recipient.id, clonedFromId: source.id } as any,
    })
    if (alreadyShared) {
        return NextResponse.json({
            error: `Ya asignaste este producto a @${recipient.username ?? recipient.email}.`,
        }, { status: 409 })
    }

    const adminUser = await prisma.user.findUnique({
        where: { id: (admin as any).id },
        select: { username: true },
    })

    await (prisma.product as any).create({
        data: {
            userId: recipient.id,
            name: source.name,
            category: source.category,
            benefits: source.benefits,
            usage: source.usage,
            warnings: source.warnings,
            priceUnit: source.priceUnit,
            pricePromo2: source.pricePromo2,
            priceSuper6: source.priceSuper6,
            currency: source.currency,
            welcomeMessage: source.welcomeMessage,
            firstMessage: source.firstMessage,
            hooks: source.hooks as Prisma.InputJsonValue,
            imageMainUrls: source.imageMainUrls as Prisma.InputJsonValue,
            imagePriceUnitUrl: source.imagePriceUnitUrl,
            imagePricePromoUrl: source.imagePricePromoUrl,
            imagePriceSuperUrl: source.imagePriceSuperUrl,
            productVideoUrls: source.productVideoUrls as Prisma.InputJsonValue,
            testimonialsVideoUrls: source.testimonialsVideoUrls as Prisma.InputJsonValue,
            shippingInfo: source.shippingInfo,
            coverage: source.coverage,
            tags: source.tags as Prisma.InputJsonValue,
            active: source.active,
            clonedFromId: source.id,
            sharedByUsername: adminUser?.username ?? 'admin',
        },
    })

    return NextResponse.json({
        ok: true,
        message: `Producto asignado a @${recipient.username ?? recipient.email}`,
    })
}
