export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const admin = await getAdminUser()
    if (!admin) return unauthorizedAdmin()

    const templates = await (prisma as any).promptTemplate.findMany({
        orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ templates })
}

export async function POST(req: NextRequest) {
    const admin = await getAdminUser()
    if (!admin) return unauthorizedAdmin()

    const body = await req.json()
    const { name, description, content, category } = body

    if (!name?.trim()) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    if (!content?.trim()) return NextResponse.json({ error: 'El contenido es requerido' }, { status: 400 })

    const template = await (prisma as any).promptTemplate.create({
        data: {
            name: name.trim(),
            description: description?.trim() || null,
            content: content.trim(),
            category: category?.trim() || 'general',
        },
    })

    return NextResponse.json({ template }, { status: 201 })
}
