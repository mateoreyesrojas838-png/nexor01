export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const admin = await getAdminUser()
    if (!admin) return unauthorizedAdmin()

    const body = await req.json()
    const { name, description, content, category, isActive } = body

    if (name !== undefined && !name?.trim()) return NextResponse.json({ error: 'El nombre no puede estar vacío' }, { status: 400 })
    if (content !== undefined && !content?.trim()) return NextResponse.json({ error: 'El contenido no puede estar vacío' }, { status: 400 })

    const template = await (prisma as any).promptTemplate.update({
        where: { id: params.id },
        data: {
            ...(name !== undefined && { name: name.trim() }),
            ...(description !== undefined && { description: description?.trim() || null }),
            ...(content !== undefined && { content: content.trim() }),
            ...(category !== undefined && { category: category.trim() || 'general' }),
            ...(isActive !== undefined && { isActive }),
        },
    })

    return NextResponse.json({ template })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
    const admin = await getAdminUser()
    if (!admin) return unauthorizedAdmin()

    await (prisma as any).promptTemplate.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
}
