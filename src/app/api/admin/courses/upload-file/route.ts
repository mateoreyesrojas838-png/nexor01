export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'

// Bucket PRIVADO — materiales (PDF/imágenes) solo accesibles vía URL firmada
const BUCKET = 'course-files'

const ALLOWED: Record<string, { ext: string; kind: 'PDF' | 'IMAGE' }> = {
  'application/pdf': { ext: 'pdf', kind: 'PDF' },
  'image/jpeg': { ext: 'jpg', kind: 'IMAGE' },
  'image/png': { ext: 'png', kind: 'IMAGE' },
  'image/webp': { ext: 'webp', kind: 'IMAGE' },
}

export async function POST(request: Request) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  let formData: FormData
  try { formData = await request.formData() } catch { return NextResponse.json({ error: 'Formato inválido' }, { status: 400 }) }

  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No se subió ningún archivo' }, { status: 400 })

  const meta = ALLOWED[file.type]
  if (!meta) return NextResponse.json({ error: 'Solo se permiten PDF o imágenes (JPG, PNG, WEBP)' }, { status: 400 })

  const path = `${randomUUID()}.${meta.ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  let { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, buffer, { contentType: file.type, upsert: false })
  if (error) {
    await supabaseAdmin.storage.createBucket(BUCKET, { public: false }).catch(() => {})
    const retry = await supabaseAdmin.storage.from(BUCKET).upload(path, buffer, { contentType: file.type, upsert: false })
    if (retry.error) {
      console.error('[upload-file]', retry.error)
      return NextResponse.json({ error: retry.error.message || 'Error al subir el archivo' }, { status: 500 })
    }
  }

  return NextResponse.json({ filePath: path, kind: meta.kind })
}
