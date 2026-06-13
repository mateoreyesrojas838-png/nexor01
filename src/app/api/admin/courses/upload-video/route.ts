export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'

// Bucket PRIVADO — los videos nunca se sirven con URL pública (solo URLs firmadas)
const BUCKET = 'course-videos'

const ALLOWED: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'video/x-matroska': 'mkv',
  'video/3gpp': '3gp',
}

export async function POST(request: Request) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Formato inválido' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No se subió ningún archivo' }, { status: 400 })

  const ext = ALLOWED[file.type]
  if (!ext) return NextResponse.json({ error: 'Formato de video no permitido (MP4, MOV, WEBM, MKV)' }, { status: 400 })

  const path = `${randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  let { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false })

  if (error) {
    // El bucket privado puede no existir aún — crearlo (NO público) y reintentar
    await supabaseAdmin.storage.createBucket(BUCKET, { public: false }).catch(() => {})
    const retry = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: false })
    if (retry.error) {
      console.error('[upload-video]', retry.error)
      return NextResponse.json({ error: retry.error.message || 'Error al subir el video' }, { status: 500 })
    }
  }

  // Devolvemos solo la RUTA (no una URL) — la URL firmada se genera al reproducir
  return NextResponse.json({ videoPath: path })
}
