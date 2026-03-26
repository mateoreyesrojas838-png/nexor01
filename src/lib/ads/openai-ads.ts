/**
 * OpenAI integration for the Ads AI System.
 * Uses native fetch (no SDK) with the user's own API key.
 */

export interface BusinessBriefData {
    name: string
    industry: string
    description: string
    valueProposition: string
    painPoints: string[]
    interests: string[]
    brandVoice: string
    brandColors: string[]
    visualStyle: string[]
    primaryObjective: string
    mainCTA: string
    targetLocations: string[]
    keyMessages: string[]
    personalityTraits: string[]
    contentThemes: string[]
    engagementLevel: string
}

export interface AdCopyData {
    slotIndex: number
    primaryText: string
    headline: string
    description: string
    hook: string
    hashtags?: string   // space-separated winning hashtags e.g. "#FitnessMotivation #GymLife"
}

const OPENAI_BASE = 'https://api.openai.com/v1'

/** Validates a user's OpenAI API key with a lightweight model call */
export async function validateApiKey(apiKey: string): Promise<boolean> {
    try {
        const res = await fetch(`${OPENAI_BASE}/models`, {
            headers: { Authorization: `Bearer ${apiKey}` }
        })
        return res.ok
    } catch {
        return false
    }
}

/** Transcribes audio using OpenAI Whisper-1 */
export async function transcribeAudio(
    audioBuffer: Buffer,
    fileName: string,
    apiKey: string
): Promise<string> {
    const formData = new FormData()
    const blob = new Blob([audioBuffer.buffer as ArrayBuffer], { type: 'audio/webm' })
    formData.append('file', blob, fileName)
    formData.append('model', 'whisper-1')
    formData.append('language', 'es')

    const res = await fetch(`${OPENAI_BASE}/audio/transcriptions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData
    })

    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error?.message || `Whisper error ${res.status}`)
    }

    const data = await res.json()
    return data.text as string
}

/** Generates a structured BusinessBrief from free text using GPT-4o */
export async function generateBusinessBrief(
    text: string,
    apiKey: string,
    model = 'gpt-4o'
): Promise<BusinessBriefData> {
    const systemPrompt = `Eres un experto en marketing digital, copywriting y estrategia de marca. Tu tarea es analizar la descripción de un negocio y extraer información estructurada para crear campañas publicitarias de alto rendimiento. Responde ÚNICAMENTE con un JSON válido, sin markdown, sin texto adicional.`

    const userPrompt = `Analiza el siguiente texto sobre un negocio y extrae la información de marketing. Si no se menciona algún campo, inferlo inteligentemente del contexto.

TEXTO DEL NEGOCIO:
"""
${text}
"""

Devuelve EXACTAMENTE este JSON (todos los campos son obligatorios):
{
  "name": "nombre del negocio",
  "industry": "industria (ej: Salud y Bienestar, Moda, Tecnología, Alimentación, Belleza, etc)",
  "description": "descripción completa del negocio en 2-3 oraciones claras",
  "valueProposition": "propuesta de valor única que diferencia al negocio en 1-2 oraciones directas",
  "painPoints": ["problema que resuelve 1", "problema que resuelve 2", "problema que resuelve 3", "problema 4", "problema 5"],
  "interests": ["interés del cliente ideal 1", "interés 2", "interés 3", "interés 4", "interés 5"],
  "brandVoice": "tono de comunicación (ej: casual e informativo, profesional y confiable, urgente y directo)",
  "brandColors": ["#hexcolor1", "#hexcolor2", "#hexcolor3"],
  "visualStyle": ["estilo visual 1 (ej: minimalista)", "estilo 2", "estilo 3"],
  "primaryObjective": "conversion",
  "mainCTA": "llamada a la acción principal (ej: Comprar ahora, Solicitar info, Ver oferta)",
  "targetLocations": ["país o ciudad principal"],
  "keyMessages": ["mensaje clave 1", "mensaje clave 2", "mensaje clave 3"],
  "personalityTraits": ["rasgo de marca 1", "rasgo 2", "rasgo 3"],
  "contentThemes": ["tema de contenido 1", "tema 2", "tema 3"],
  "engagementLevel": "alto"
}`

    const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.4,
            max_tokens: 1200,
            response_format: { type: 'json_object' }
        })
    })

    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error?.message || `OpenAI error ${res.status}`)
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error('OpenAI no devolvió contenido')

    try {
        return JSON.parse(content) as BusinessBriefData
    } catch {
        throw new Error('Error al parsear el brief generado por IA')
    }
}

/** Generates N ad copies based on brief + strategy using GPT-4o */
export async function generateAdCopies(params: {
    brief: BusinessBriefData
    strategyName: string
    platform: string
    objective: string
    destination: string
    mediaType: string
    count: number
    apiKey: string
    model?: string
}): Promise<AdCopyData[]> {
    const { brief, strategyName, platform, objective, destination, mediaType, count, apiKey, model = 'gpt-4o' } = params

    const platformLimits: Record<string, { primaryText: number; headline: number; description: number }> = {
        META: { primaryText: 500, headline: 40, description: 30 },
    }

    const limits = platformLimits[platform] || platformLimits['META']

    const destinationMap: Record<string, string> = {
        instagram: 'Instagram (feed y stories)',
        whatsapp: 'WhatsApp Business',
        website: 'Sitio web / tienda online',
        messenger: 'Facebook Messenger',
    }

    const hashtagInstructions = `- hashtags: string con 5-8 hashtags Instagram/Facebook ganadores (mezcla: 2 masivos populares + 3-4 de nicho específico del negocio + 1 de acción). Formato: "#Tag1 #Tag2 #Tag3"`

    const systemPrompt = `Eres Alex Hormozi mezclado con Gary Vaynerchuk — el mejor copywriter de publicidad digital en español del mundo. Tienes 15 años de experiencia lanzando campañas de millones de dólares en Meta Ads para marcas latinoamericanas. Conoces los patrones psicológicos que hacen que las personas detengan el scroll, lean y compren.

Tu copy SIEMPRE:
✓ Para el scroll en los primeros 3 segundos (hook brutalmente directo)
✓ Activa una emoción fuerte: aspiración, miedo a perder, FOMO, curiosidad
✓ Habla el idioma del cliente ideal (no jerga corporativa)
✓ Tiene prueba social o autoridad implícita
✓ Crea urgencia REAL sin sonar falso
✓ Usa emojis estratégicamente para romper el texto y llamar atención
✓ Termina con CTA irresistible

Respondes ÚNICAMENTE con JSON válido. NUNCA texto fuera del JSON.`

    const platformGuide = 'Para META/Instagram: copy conversacional y aspiracional. Hook emocional en la primera línea. Usa emojis para separar párrafos y llamar atención. Mezcla beneficios racionales y emocionales.'

    const userPrompt = `Crea exactamente ${count} variaciones PREMIUM de anuncios para ${platform} que generen ventas reales.

═══ NEGOCIO ═══
Nombre: ${brief.name}
Industria: ${brief.industry}
Descripción: ${brief.description}
Propuesta de valor ÚNICA: ${brief.valueProposition}
Puntos de dolor del cliente: ${brief.painPoints.join(' | ')}
Voz de marca: ${brief.brandVoice}
Mensajes clave: ${brief.keyMessages.join(' | ')}
CTA principal: ${brief.mainCTA}
Intereses de la audiencia: ${brief.interests?.join(', ')}

═══ ESTRATEGIA ═══
Nombre: ${strategyName}
Plataforma: ${platform}
Objetivo: ${objective}
Destino: ${destinationMap[destination] || destination}
Tipo de creativo: ${mediaType}

${platformGuide}

═══ LÍMITES ESTRICTOS ═══
Primary Text: máx ${limits.primaryText} caracteres
Headline: máx ${limits.headline} caracteres
Description: máx ${limits.description} caracteres

═══ FRAMEWORKS A ROTAR (uno por variación) ═══
Var 1: PAS — Pain → Agitate → Solution (agita el dolor antes de ofrecer la solución)
Var 2: AIDA — Attention → Interest → Desire → Action (clásico pero devastador)
Var 3: Social Proof — Empieza con resultado de un cliente real/hipotético
Var 4: Curiosity Gap — Pregunta o afirmación que OBLIGA a seguir leyendo
Var 5+: Fear of Missing Out — Lo que pierden si no actúan HOY

═══ REGLAS DE ORO ═══
1. Hook (primera oración) = 90% del éxito. Hazlo IMPOSIBLE de ignorar
2. Emojis: usarlos para guiar la lectura (✅ ⚡ 🔥 💡 👇 etc.), no decorar
3. Párrafos cortos: máx 2-3 líneas cada uno
4. Urgencia real: plazo, cantidad limitada, o consecuencia de no actuar
5. Siempre termina con: "${brief.mainCTA}"
6. Varía completamente el ángulo entre variaciones — NO repitas la misma idea
7. Habla de "tú/tu" (tuteo directo al lector)

${hashtagInstructions}

═══ FORMATO DE RESPUESTA ═══
Devuelve EXACTAMENTE este JSON:
{
  "copies": [
    {
      "slotIndex": 0,
      "hook": "primera oración del copy — el hook solo",
      "primaryText": "copy completo con emojis y párrafos...",
      "headline": "titular de hasta ${limits.headline} chars",
      "description": "descripción breve de hasta ${limits.description} chars",
      "hashtags": "#Tag1 #Tag2 #Tag3"
    }
  ]
}
Genera EXACTAMENTE ${count} objetos (slotIndex del 0 al ${count - 1}).`

    const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.8,
            max_tokens: 4000,
            response_format: { type: 'json_object' }
        })
    })

    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error?.message || `OpenAI error ${res.status}`)
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error('OpenAI no devolvió contenido')

    try {
        const parsed = JSON.parse(content)
        let copies: AdCopyData[]
        if (Array.isArray(parsed)) {
            copies = parsed
        } else {
            // Find the first array value in the object (handles: copies, ads, anuncios, variaciones, etc.)
            const arrayVal = Object.values(parsed).find(v => Array.isArray(v))
            if (!arrayVal) throw new Error('La respuesta de OpenAI no contiene un array de copies')
            copies = arrayVal as AdCopyData[]
        }
        return copies.slice(0, count)
    } catch (e: any) {
        throw new Error(e.message || 'Error al parsear los copies generados por IA')
    }
}

export interface SuggestedStrategy {
    name: string
    description: string
    reason: string
    platform: 'META'
    objective: string
    destination: string
    mediaType: string
    mediaCount: number
    minBudgetUSD: number
    advantageType: string
}

/** Generates AI-personalized strategy suggestions based on a business brief */
export async function generateStrategySuggestions(
    brief: BusinessBriefData,
    apiKey: string,
    model = 'gpt-5.1'
): Promise<SuggestedStrategy[]> {
    const systemPrompt = `Eres un experto en publicidad digital con 15 años de experiencia en Meta Ads. Tu especialidad es analizar negocios y recomendar exactamente qué tipo de campaña publicitaria les funcionará mejor. Respondes ÚNICAMENTE con JSON válido.`

    const userPrompt = `Analiza este negocio y recomienda entre 5 y 6 estrategias de campaña publicitaria PERSONALIZADAS para Meta Ads. Cada estrategia debe explicar específicamente por qué funciona para este negocio concreto.

NEGOCIO:
- Nombre: ${brief.name}
- Industria: ${brief.industry}
- Descripción: ${brief.description}
- Propuesta de valor: ${brief.valueProposition}
- Objetivo principal: ${brief.primaryObjective}
- CTA principal: ${brief.mainCTA}
- Audiencia objetivo (intereses): ${brief.interests?.join(', ')}
- Puntos de dolor del cliente: ${brief.painPoints?.join(', ')}
- Voz de marca: ${brief.brandVoice}
- Ubicaciones objetivo: ${brief.targetLocations?.join(', ')}

REGLAS:
1. Todas las estrategias son para META (Facebook & Instagram)
2. Varía los destinos: whatsapp (ventas directas), instagram (branding), website (e-commerce), messenger
3. Varía los objetivos: usa los 6 objetivos disponibles según el negocio — no repitas el mismo objetivo más de 2 veces
4. Cantidad de anuncios: 5 para presupuesto bajo, 10 para medio, 20 para escalar
5. minBudgetUSD: mínimo 4 USD/día
6. advantageType: "advantage" para audiencia automática Meta Advantage+, "smart_segmentation" para segmentación por intereses, "custom" para campañas manuales
7. El campo "reason" explica ESPECÍFICAMENTE por qué esa estrategia funciona para ESTE negocio (máx 120 caracteres)
8. El campo "name" debe ser profesional, atractivo y descriptivo (máx 55 chars)
9. Para "app_promotion" usa solo si el negocio tiene app móvil; para "engagement" úsalo para comunidades y marcas de contenido

GUÍA DE OBJETIVOS:
- conversions → ventas directas, compras, registros con pago
- leads → captación de datos, formularios, clientes potenciales
- traffic → visitas al sitio web, blog, landing page
- awareness → reconocimiento de marca, alcance masivo
- engagement → interacciones, me gusta, comentarios, comunidad
- app_promotion → descargas e instalaciones de app móvil

Devuelve EXACTAMENTE este JSON (entre 5 y 6 estrategias):
{
  "strategies": [
    {
      "name": "nombre profesional y atractivo",
      "description": "descripción clara de 1-2 oraciones de cómo funciona la estrategia",
      "reason": "por qué funciona específicamente para este negocio",
      "platform": "META",
      "objective": "conversions",
      "destination": "whatsapp",
      "mediaType": "image",
      "mediaCount": 10,
      "minBudgetUSD": 4,
      "advantageType": "advantage"
    }
  ]
}

Plataforma válida: META
Objetivos válidos: conversions, leads, traffic, awareness, engagement, app_promotion
Destinos válidos: instagram, whatsapp, website, messenger`

    const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.5,
            max_tokens: 2000,
            response_format: { type: 'json_object' }
        })
    })

    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error?.message || `OpenAI error ${res.status}`)
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error('OpenAI no devolvió contenido')

    const parsed = JSON.parse(content)
    const strategies = Array.isArray(parsed)
        ? parsed
        : (parsed.strategies ?? Object.values(parsed).find((v: any) => Array.isArray(v)) ?? [])
    return (strategies as SuggestedStrategy[]).slice(0, 6)
}

/**
 * Generates 8-12 Meta-compatible interest keyword strings from a business brief.
 * These keyword strings are then resolved to real Meta interest IDs via the Targeting Search API.
 */
export async function generateAudienceInterests(
    brief: BusinessBriefData,
    apiKey: string,
    model = 'gpt-5.1'
): Promise<string[]> {
    const prompt = `Eres un experto en segmentación de audiencias en Meta Ads. Analiza este negocio y devuelve 10 intereses de audiencia específicos para usar en la API de segmentación de Meta.

NEGOCIO:
- Nombre: ${brief.name}
- Industria: ${brief.industry}
- Descripción: ${brief.description}
- Propuesta de valor: ${brief.valueProposition || ''}
- Intereses del cliente: ${brief.interests?.join(', ') || ''}
- Puntos de dolor: ${brief.painPoints?.join(', ') || ''}
- Objetivo principal: ${brief.primaryObjective || ''}

REGLAS:
1. Usa nombres de intereses tal como existen en Meta Ads Manager (en inglés)
2. Mezcla intereses amplios y específicos relacionados al negocio
3. Incluye: intereses del producto, estilo de vida relacionado, demografía comportamental
4. Exactamente 10 intereses
5. Devuelve SOLO JSON: {"interests": ["interés1", "interés2", ...]}`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15_000)
    let res: Response
    try {
        res = await fetch(`${OPENAI_BASE}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
                max_tokens: 400,
                response_format: { type: 'json_object' }
            }),
            signal: controller.signal,
        })
    } catch (e: any) {
        if (e?.name === 'AbortError') throw new Error('OpenAI tardó demasiado (>15s) al generar intereses de audiencia. Inténtalo de nuevo.')
        throw new Error(`Error de red al contactar OpenAI: ${e?.message || e}`)
    } finally {
        clearTimeout(timeout)
    }
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        const msg = err?.error?.message || `OpenAI respondió con error ${res.status}`
        throw new Error(`OpenAI: ${msg}`)
    }
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error('OpenAI no devolvió contenido al generar intereses de audiencia')
    const parsed = JSON.parse(content)
    const arr = Array.isArray(parsed)
        ? parsed
        : (parsed.interests ?? Object.values(parsed).find((v: any) => Array.isArray(v)) ?? [])
    const keywords = (arr as unknown[]).filter((s): s is string => typeof s === 'string').slice(0, 12)
    if (keywords.length === 0) throw new Error('OpenAI no generó ningún interés de audiencia válido')
    return keywords
}

export type ImageQuality = 'fast' | 'standard' | 'premium'
export type ImageSize = '1024x1024' | '1024x1792' | '1792x1024'

/** Generates an ad image using DALL-E 3 based on brief */
export async function generateAdImage(params: {
    brief: BusinessBriefData
    mediaType: string
    slotIndex: number
    apiKey: string
    customPrompt?: string
    quality?: ImageQuality
    size?: ImageSize
}): Promise<string> {
    const { brief, mediaType, slotIndex, apiKey, customPrompt, quality = 'standard', size = '1024x1024' } = params

    const colorStr = brief.brandColors.slice(0, 2).join(' and ')
    const styleStr = brief.visualStyle.slice(0, 3).join(', ')
    const productContext = brief.contentThemes.slice(0, 2).join(' and ')
    const valueProposition = brief.valueProposition?.substring(0, 120) || ''
    const keyMessage = brief.keyMessages?.[0] || ''

    let prompt: string
    if (customPrompt) {
        prompt = customPrompt
    } else if (quality === 'fast') {
        prompt = `Professional advertising photo for ${brief.name} (${brief.industry}).
Style: ${styleStr || 'modern and clean'}.
Colors: ${colorStr || 'neutral tones'}.
${mediaType === 'video' ? 'Dynamic lifestyle shot' : 'Clean product shot'}, no text, no watermarks.`
    } else if (quality === 'standard') {
        prompt = `High-quality advertising photo for ${brief.name}, a ${brief.industry} brand.
Visual style: ${styleStr}, elegant and modern.
Brand color palette: ${colorStr || 'neutral and clean'}.
Context: ${productContext || brief.description.substring(0, 120)}.
Shot ${slotIndex + 1}: ${mediaType === 'video' ? 'dynamic lifestyle shot showing product in use' : 'clean product/brand hero shot with strong visual impact'}.
Commercial photography quality, no text overlay, no watermarks, no logos.`
    } else {
        // premium — hd quality with full brand context
        prompt = `Award-winning advertising campaign photo for ${brief.name}, premium ${brief.industry} brand.
Brand identity: ${styleStr}, sophisticated and compelling.
Exact brand colors: ${colorStr || 'elegant neutral palette'}.
Core message to convey visually: "${keyMessage || valueProposition}".
Pain points resolved: ${brief.painPoints?.slice(0, 2).join(', ')}.
Shot ${slotIndex + 1} concept: ${mediaType === 'video' ? 'cinematic lifestyle scene, emotionally engaging, aspirational' : 'studio-quality hero shot, razor-sharp focus, perfect lighting, aspirational composition'}.
Target audience interests: ${brief.interests?.slice(0, 3).join(', ')}.
High-end commercial photography, magazine quality, no text, no watermarks, no logos.`
    }

    const dalleQuality = quality === 'premium' ? 'hd' : 'standard'
    const dalleStyle = quality === 'fast' ? 'natural' : 'vivid'

    const res = await fetch(`${OPENAI_BASE}/images/generations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'dall-e-3',
            prompt,
            n: 1,
            size,
            quality: dalleQuality,
            style: dalleStyle,
        })
    })

    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error?.message || `DALL-E error ${res.status}`)
    }

    const data = await res.json()
    const url = data.data?.[0]?.url
    if (!url) throw new Error('DALL-E no devolvió una imagen')
    return url
}

/**
 * Edits/improves an existing image using gpt-image-1.
 * Returns a Buffer (PNG) so the caller can upload to storage.
 */
export async function editAdImageWithReference(params: {
    imageUrl: string
    prompt: string
    apiKey: string
    size?: '1024x1024' | '1024x1536' | '1536x1024'
}): Promise<Buffer> {
    const { imageUrl, prompt, apiKey, size = '1024x1024' } = params

    // Download the reference image
    const imgRes = await fetch(imageUrl)
    if (!imgRes.ok) throw new Error('No se pudo descargar la imagen de referencia')
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer())
    const contentType = imgRes.headers.get('content-type') || 'image/png'

    // Build multipart form data
    const form = new FormData()
    const blob = new Blob([imgBuffer], { type: contentType })
    form.append('image', blob, 'reference.png')
    form.append('prompt', prompt)
    form.append('model', 'gpt-image-1')
    form.append('size', size)
    form.append('n', '1')

    const res = await fetch(`${OPENAI_BASE}/images/edits`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form
    })

    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error?.message || `gpt-image-1 error ${res.status}`)
    }

    const data = await res.json()
    const b64 = data.data?.[0]?.b64_json
    if (!b64) throw new Error('gpt-image-1 no devolvió imagen')
    return Buffer.from(b64, 'base64')
}
