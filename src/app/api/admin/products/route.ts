export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

function parseJsonArray(value: unknown): unknown[] {
    if (Array.isArray(value)) return value
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value)
            return Array.isArray(parsed) ? parsed : []
        } catch {
            return value.split('\n').map(s => s.trim()).filter(Boolean)
        }
    }
    return []
}

/** GET /api/admin/products — lista todos los productos del admin */
export async function GET() {
    const admin = await getAdminUser()
    if (!admin) return unauthorizedAdmin()

    const products = await prisma.product.findMany({
        where: { userId: (admin as any).id },
        orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ products })
}

/** POST /api/admin/products — crea producto del admin */
export async function POST(req: NextRequest) {
    const admin = await getAdminUser()
    if (!admin) return unauthorizedAdmin()

    const body = await req.json() as Record<string, unknown>
    const name = (body.name as string)?.trim()
    if (!name) return NextResponse.json({ error: 'El nombre del producto es requerido' }, { status: 400 })

    const imageMainUrls = parseJsonArray(body.imageMainUrls)
    const productVideoUrls = parseJsonArray(body.productVideoUrls)
    const testimonialsVideoUrls = parseJsonArray(body.testimonialsVideoUrls)
    const hooks = parseJsonArray(body.hooks)
    const tags = parseJsonArray(body.tags)
    const active = body.active !== false

    const product = await prisma.product.create({
        data: {
            userId: (admin as any).id,
            name,
            category: (body.category as string) || null,
            benefits: (body.benefits as string) || null,
            usage: (body.usage as string) || null,
            warnings: (body.warnings as string) || null,
            priceUnit: (body.priceUnit !== undefined && body.priceUnit !== null && body.priceUnit !== '') ? Number(body.priceUnit) : null,
            pricePromo2: (body.pricePromo2 !== undefined && body.pricePromo2 !== null && body.pricePromo2 !== '') ? Number(body.pricePromo2) : null,
            priceSuper6: (body.priceSuper6 !== undefined && body.priceSuper6 !== null && body.priceSuper6 !== '') ? Number(body.priceSuper6) : null,
            currency: (body.currency as string) || 'USD',
            welcomeMessage: (body.welcomeMessage as string) || null,
            firstMessage: (body.firstMessage as string) || null,
            hooks: hooks as Prisma.InputJsonValue,
            imageMainUrls: imageMainUrls as Prisma.InputJsonValue,
            imagePriceUnitUrl: (body.imagePriceUnitUrl as string) || null,
            imagePricePromoUrl: (body.imagePricePromoUrl as string) || null,
            imagePriceSuperUrl: (body.imagePriceSuperUrl as string) || null,
            productVideoUrls: productVideoUrls as Prisma.InputJsonValue,
            testimonialsVideoUrls: testimonialsVideoUrls as Prisma.InputJsonValue,
            shippingInfo: (body.shippingInfo as string) || null,
            coverage: (body.coverage as string) || null,
            tags: tags as Prisma.InputJsonValue,
            active,
        },
    })

    return NextResponse.json({ product }, { status: 201 })
}
