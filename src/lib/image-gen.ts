/**
 * Generación de imágenes similares con gpt-image-2 (último modelo de imágenes de OpenAI, abr 2026).
 * El usuario sube una imagen de referencia + instrucciones y se generan N variantes.
 * Usa el endpoint /images/edits, que acepta una imagen de referencia + prompt.
 *
 * Se hacen N llamadas independientes (una por imagen) en paralelo: es más robusto
 * (si una falla, devolvemos las que sí salieron) y da más variedad entre variantes
 * que pedir n>1 en una sola llamada.
 */

const OPENAI_BASE = 'https://api.openai.com/v1'
const MODEL = 'gpt-image-2'

export type ImageStudioSize = '1024x1024' | '1024x1536' | '1536x1024'
export type ImageStudioQuality = 'low' | 'medium' | 'high'

export interface GenerateSimilarParams {
  imageBuffer: Buffer
  contentType: string
  prompt: string
  apiKey: string
  count: number
  size?: ImageStudioSize
  quality?: ImageStudioQuality
}

/** Genera UNA variante a partir de la imagen de referencia. */
async function editOnce(opts: {
  imageBuffer: Buffer
  contentType: string
  prompt: string
  apiKey: string
  size: ImageStudioSize
  quality: ImageStudioQuality
}): Promise<Buffer> {
  const { imageBuffer, contentType, prompt, apiKey, size, quality } = opts

  const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'
  // Copia a un ArrayBuffer concreto — BlobPart válido (evita el genérico ArrayBufferLike del Buffer)
  const ab = new ArrayBuffer(imageBuffer.byteLength)
  new Uint8Array(ab).set(imageBuffer)
  const blob = new Blob([ab], { type: contentType || 'image/png' })

  const form = new FormData()
  form.append('model', MODEL)
  form.append('image', blob, `referencia.${ext}`)
  form.append('prompt', prompt)
  form.append('n', '1')
  form.append('size', size)
  form.append('quality', quality)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 180000)

  let res: Response
  try {
    res = await fetch(`${OPENAI_BASE}/images/edits`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({} as any))
    throw new Error(err?.error?.message || `${MODEL} error ${res.status}`)
  }

  const data = await res.json()
  const b64 = data.data?.[0]?.b64_json
  if (!b64) throw new Error(`${MODEL} no devolvió imagen`)
  return Buffer.from(b64, 'base64')
}

/**
 * Genera `count` imágenes similares a la referencia siguiendo las instrucciones.
 * Devuelve los Buffers PNG que se generaron con éxito. Lanza error solo si fallan todas.
 */
export async function generateSimilarImages(params: GenerateSimilarParams): Promise<Buffer[]> {
  const { imageBuffer, contentType, prompt, apiKey, count, size = '1024x1024', quality = 'medium' } = params
  const n = Math.max(1, Math.min(10, Math.floor(count)))

  const settled = await Promise.allSettled(
    Array.from({ length: n }, () => editOnce({ imageBuffer, contentType, prompt, apiKey, size, quality }))
  )

  const ok = settled
    .filter((s): s is PromiseFulfilledResult<Buffer> => s.status === 'fulfilled')
    .map(s => s.value)

  if (ok.length === 0) {
    const firstErr = settled.find(s => s.status === 'rejected') as PromiseRejectedResult | undefined
    throw new Error(firstErr?.reason?.message || 'No se pudo generar ninguna imagen')
  }

  return ok
}
