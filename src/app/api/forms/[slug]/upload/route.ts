export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabase'

const BUCKET = 'form-uploads'
const MAX_BYTES = 15 * 1024 * 1024 // 15 MB

/** POST público — subida de archivo de un campo "file" (solo si el form está publicado). */
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const form = await (prisma as any).form.findUnique({ where: { slug: params.slug }, select: { id: true, status: true } })
  if (!form || form.status !== 'PUBLISHED') {
    return NextResponse.json({ error: 'Formulario no disponible' }, { status: 403 })
  }

  let formData: FormData
  try { formData = await req.formData() } catch { return NextResponse.json({ error: 'Formato inválido' }, { status: 400 }) }
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No se subió ningún archivo' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'El archivo supera los 15 MB' }, { status: 400 })

  const safeExt = (file.name.split('.').pop() || 'dat').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) || 'dat'
  const path = `${form.id}/${randomUUID()}.${safeExt}`
  const buffer = Buffer.from(await file.arrayBuffer())

  let { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, buffer, { contentType: file.type || 'application/octet-stream', upsert: false })
  if (error) {
    await supabaseAdmin.storage.createBucket(BUCKET, { public: true }).catch(() => {})
    const retry = await supabaseAdmin.storage.from(BUCKET).upload(path, buffer, { contentType: file.type || 'application/octet-stream', upsert: false })
    if (retry.error) return NextResponse.json({ error: retry.error.message || 'Error al subir' }, { status: 500 })
  }

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl, name: file.name })
}
