export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

const BUCKET = 'bot-audio'

const ALLOWED_AUDIO: Record<string, string> = {
    'audio/ogg': 'ogg',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/wave': 'wav',
    'audio/mp4': 'm4a',
    'audio/x-m4a': 'm4a',
    'audio/aac': 'aac',
    'audio/webm': 'webm',
}

function getAuth() {
    const token = cookies().get('auth_token')?.value
    if (!token) return null
    return verifyToken(token)
}

/** POST /api/products/[productId]/audio — sube audio PTT y guarda URL en el producto */
export async function POST(req: NextRequest, { params }: { params: { productId: string } }) {
    const auth = getAuth()
    if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const product = await prisma.product.findFirst({
        where: { id: params.productId, userId: auth.userId },
    })
    if (!product) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })

    const ext = ALLOWED_AUDIO[file.type]
    if (!ext) {
        return NextResponse.json(
            { error: 'Formato no soportado. Usa OGG, MP3, WAV, M4A, AAC o WEBM' },
            { status: 400 },
        )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const path = `${auth.userId}/${params.productId}/first-message-${Date.now()}.${ext}`

    // Try upload; create bucket if missing
    let { error: uploadErr } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(path, buffer, { contentType: file.type, upsert: true })

    if (uploadErr) {
        await supabaseAdmin.storage.createBucket(BUCKET, { public: true }).catch(() => {})
        const retry = await supabaseAdmin.storage
            .from(BUCKET)
            .upload(path, buffer, { contentType: file.type, upsert: true })
        if (retry.error) return NextResponse.json({ error: retry.error.message }, { status: 500 })
    }

    const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)
    const audioUrl = urlData.publicUrl

    await prisma.product.update({
        where: { id: params.productId },
        data: { firstMessageAudioUrl: audioUrl },
    })

    return NextResponse.json({ audioUrl })
}

/** DELETE /api/products/[productId]/audio — elimina el audio del producto */
export async function DELETE(_req: NextRequest, { params }: { params: { productId: string } }) {
    const auth = getAuth()
    if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const product = await prisma.product.findFirst({
        where: { id: params.productId, userId: auth.userId },
    })
    if (!product) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })

    await prisma.product.update({
        where: { id: params.productId },
        data: { firstMessageAudioUrl: null },
    })

    return NextResponse.json({ ok: true })
}
