export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/ads/encryption'
import { generateSimilarImages, type ImageStudioSize, type ImageStudioQuality } from '@/lib/image-gen'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserCredits, getGlobalOpenAIKey, logAiUsage } from '@/lib/ai-credits'

const ENC_KEY = process.env.ADS_ENCRYPTION_KEY || ''
const BUCKET = 'image-studio'
const MAX_COUNT = 6

const VALID_SIZES: ImageStudioSize[] = ['1024x1024', '1024x1536', '1536x1024']
const VALID_QUALITIES: ImageStudioQuality[] = ['low', 'medium', 'high']

export async function POST(req: Request) {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    // ── Parsear el formulario multipart ──
    let formData: FormData
    try {
        formData = await req.formData()
    } catch {
        return NextResponse.json({ error: 'Formato de solicitud inválido' }, { status: 400 })
    }

    const file = formData.get('file') as File | null
    const prompt = String(formData.get('prompt') || '').trim()
    const count = parseInt(String(formData.get('count') || '1'), 10)
    const sizeRaw = String(formData.get('size') || '1024x1024') as ImageStudioSize
    const qualityRaw = String(formData.get('quality') || 'medium') as ImageStudioQuality

    if (!file) return NextResponse.json({ error: 'Subí una imagen de referencia' }, { status: 400 })
    if (!file.type?.startsWith('image/')) return NextResponse.json({ error: 'El archivo debe ser una imagen' }, { status: 400 })
    if (!prompt) return NextResponse.json({ error: 'Escribí las instrucciones para la IA' }, { status: 400 })
    if (isNaN(count) || count < 1 || count > MAX_COUNT) {
        return NextResponse.json({ error: `Elegí entre 1 y ${MAX_COUNT} imágenes` }, { status: 400 })
    }

    const size = VALID_SIZES.includes(sizeRaw) ? sizeRaw : '1024x1024'
    const quality = VALID_QUALITIES.includes(qualityRaw) ? qualityRaw : 'medium'

    // ── Resolver la API key: key propia del usuario → key global (con saldo) ──
    const oaiConfig = await (prisma as any).openAIConfig.findUnique({ where: { userId: user.id } })
    let apiKey = ''
    let isGlobalKey = false

    if (oaiConfig?.isValid && oaiConfig.apiKeyEnc) {
        try { apiKey = decrypt(oaiConfig.apiKeyEnc, ENC_KEY) } catch {}
    }
    if (!apiKey) {
        const credits = await getUserCredits(user.id)
        if (credits <= 0) {
            return NextResponse.json({ error: 'Sin saldo de créditos AI. Configurá tu API Key de OpenAI o recargá créditos.' }, { status: 400 })
        }
        apiKey = (await getGlobalOpenAIKey()) ?? ''
        if (!apiKey) return NextResponse.json({ error: 'Configurá tu API Key de OpenAI primero' }, { status: 400 })
        isGlobalKey = true
    }

    try {
        const imageBuffer = Buffer.from(await file.arrayBuffer())

        // ── Generar las variantes ──
        const buffers = await generateSimilarImages({
            imageBuffer,
            contentType: file.type,
            prompt,
            apiKey,
            count,
            size,
            quality,
        })

        // ── Subir cada resultado a storage ──
        const urls: string[] = []
        for (let i = 0; i < buffers.length; i++) {
            const path = `${user.id}/${Date.now()}-${i}.png`
            const { error: uploadErr } = await supabaseAdmin.storage
                .from(BUCKET)
                .upload(path, buffers[i], { contentType: 'image/png', upsert: true })
            if (uploadErr) {
                // El bucket puede no existir aún — crearlo y reintentar
                await supabaseAdmin.storage.createBucket(BUCKET, { public: true }).catch(() => {})
                const retry = await supabaseAdmin.storage
                    .from(BUCKET)
                    .upload(path, buffers[i], { contentType: 'image/png', upsert: true })
                if (retry.error) throw new Error(retry.error.message)
            }
            const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)
            urls.push(urlData.publicUrl)
        }

        // ── Registrar uso si se usó la key global ──
        if (isGlobalKey) {
            logAiUsage({
                userId: user.id,
                service: 'image-studio',
                model: 'gpt-image-2',
                promptTokens: 500 * buffers.length,
                completionTokens: 0,
            }).catch(() => {})
        }

        return NextResponse.json({ images: urls })
    } catch (err: any) {
        console.error('[ImageStudio]', err)
        return NextResponse.json({ error: err?.message || 'Error al generar las imágenes' }, { status: 500 })
    }
}
