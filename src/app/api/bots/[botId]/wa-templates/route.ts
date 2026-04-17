export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/crypto'
import { listWaTemplates, createWaTemplate, deleteWaTemplate } from '@/lib/whatsapp-cloud'

type Params = { params: { botId: string } }

async function getWaCloudBot(botId: string, userId: string) {
  const bot = await prisma.bot.findFirst({
    where: { id: botId, userId, type: 'WHATSAPP_CLOUD' },
    include: { secret: true },
  })
  return bot
}

/** GET — list all templates from Meta */
export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const bot = await getWaCloudBot(params.botId, user.id)
  if (!bot) return NextResponse.json({ error: 'Bot no encontrado' }, { status: 404 })

  const secret = bot.secret as any
  if (!secret?.metaPageTokenEnc || !secret?.metaWabaId) {
    return NextResponse.json({ error: 'Configurá el WABA ID en las credenciales del bot' }, { status: 400 })
  }

  const token = decrypt(secret.metaPageTokenEnc)
  const wabaId = secret.metaWabaId

  try {
    const data = await listWaTemplates(wabaId, token) as any
    return NextResponse.json({ templates: data.data ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 502 })
  }
}

/** POST — create a new template and submit for Meta review */
export async function POST(req: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const bot = await getWaCloudBot(params.botId, user.id)
  if (!bot) return NextResponse.json({ error: 'Bot no encontrado' }, { status: 404 })

  const secret = bot.secret as any
  if (!secret?.metaPageTokenEnc || !secret?.metaWabaId) {
    return NextResponse.json({ error: 'Configurá el WABA ID en las credenciales del bot' }, { status: 400 })
  }

  const body = await req.json() as {
    name?: string
    language?: string
    category?: string
    bodyText?: string
    headerText?: string
    footerText?: string
  }

  const { name, language, category, bodyText, headerText, footerText } = body

  if (!name?.trim()) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
  if (!bodyText?.trim()) return NextResponse.json({ error: 'El texto del cuerpo es requerido' }, { status: 400 })

  // Template names: lowercase, underscores only
  const safeName = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')

  const token = decrypt(secret.metaPageTokenEnc)
  const wabaId = secret.metaWabaId

  try {
    const result = await createWaTemplate(
      wabaId, token, safeName,
      language || 'es',
      category || 'MARKETING',
      bodyText.trim(),
      headerText,
      footerText,
    )
    return NextResponse.json({ ok: true, template: result }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 502 })
  }
}

/** DELETE — delete a template by name */
export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const bot = await getWaCloudBot(params.botId, user.id)
  if (!bot) return NextResponse.json({ error: 'Bot no encontrado' }, { status: 404 })

  const secret = bot.secret as any
  if (!secret?.metaPageTokenEnc || !secret?.metaWabaId) {
    return NextResponse.json({ error: 'Configurá el WABA ID en las credenciales del bot' }, { status: 400 })
  }

  const { searchParams } = new URL(req.url)
  const name = searchParams.get('name')
  if (!name) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })

  const token = decrypt(secret.metaPageTokenEnc)
  const wabaId = secret.metaWabaId

  try {
    await deleteWaTemplate(wabaId, token, name)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 502 })
  }
}
