export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'
import { normalizePeriod, planPriceFor, PERIOD_LABEL } from '@/lib/plan-period'

const LIBELULA_API_PROD = 'https://api.todotix.com/rest/deuda/registrar'
const LIBELULA_API_TEST = 'http://www.todotix.com:10888/rest/deuda/registrar'

const PRICE_DEFAULTS: Record<string, number> = {
  BASIC: 49,
  PRO: 99,
  ELITE: 199,
}

const PLAN_LABELS: Record<string, string> = {
  BASIC: 'Pack Básico',
  PRO: 'Pack Pro',
  ELITE: 'Pack Elite',
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const reqBody = await req.json()
  const { plan } = reqBody
  const period = normalizePeriod(reqBody.period)
  const isRenewal = (reqBody.plan && (user as any).plan === reqBody.plan)

  // Validate plan
  const validPlans = ['BASIC', 'PRO', 'ELITE']
  if (!validPlans.includes(plan)) {
    return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
  }

  // Check Libélula is configured AND enabled by admin
  const [appkeySetting, enabledSetting, testModeSetting] = await Promise.all([
    prisma.appSetting.findUnique({ where: { key: 'LIBELULA_APPKEY' } }),
    prisma.appSetting.findUnique({ where: { key: 'LIBELULA_ENABLED' } }),
    prisma.appSetting.findUnique({ where: { key: 'LIBELULA_TEST_MODE' } }),
  ])
  const appkey = appkeySetting?.value?.trim()
  if (!appkey || enabledSetting?.value !== 'true') {
    return NextResponse.json({ error: 'Pasarela de pago no disponible.' }, { status: 503 })
  }

  // ── Fetch real price from DB (never trust frontend) ──────────────────────────
  // Prioridad: PlanConfig (por período). Fallback solo mensual: setting PRICE_{plan} → default.
  const rateSetting = await prisma.appSetting.findUnique({ where: { key: 'USD_TO_BOB_RATE' } })
  let priceUsd = await planPriceFor(plan, period)
  if (priceUsd == null && period === 'MONTHLY') {
    const priceSetting = await prisma.appSetting.findUnique({ where: { key: `PRICE_${plan}` } })
    priceUsd = priceSetting?.value ? parseFloat(priceSetting.value) : PRICE_DEFAULTS[plan]
  }
  if (!priceUsd || priceUsd <= 0) {
    return NextResponse.json({ error: 'Ese período no está disponible para este plan.' }, { status: 400 })
  }

  // Convert USD → BOB for Libélula (admin sets the market rate, default 6.96 official)
  const usdToBobRaw = rateSetting?.value ? parseFloat(rateSetting.value) : NaN
  const usdToBob = isNaN(usdToBobRaw) || usdToBobRaw <= 0 ? 6.96 : usdToBobRaw
  const priceBob = Math.round(priceUsd * usdToBob * 100) / 100

  // Check for existing pending request (only block manual PENDING, not Libélula awaiting payment)
  const existing = await prisma.packPurchaseRequest.findFirst({
    where: { userId: user.id, status: 'PENDING' },
  })
  if (existing) {
    return NextResponse.json({ error: 'Ya tienes una solicitud manual pendiente. Espera a que sea procesada.' }, { status: 409 })
  }

  // Derive callback URL — prefer env var, then x-forwarded-host (set by Render/proxies), then req host
  const reqUrl = new URL(req.url)
  const forwardedHost = req.headers.get('x-forwarded-host')
  const forwardedProto = req.headers.get('x-forwarded-proto') || 'https'
  const derivedBase = forwardedHost ? `${forwardedProto}://${forwardedHost}` : `${reqUrl.protocol}//${reqUrl.host}`
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || derivedBase
  const callbackUrl = `${appUrl}/api/payments/libelula/callback`
  console.log(`[Libélula] callback_url: ${callbackUrl} (env:${!!process.env.NEXT_PUBLIC_APP_URL} fwd:${forwardedHost})`)
  const identificadorDeuda = randomUUID()

  const descripcion = `${PLAN_LABELS[plan]} · ${PERIOD_LABEL[period]} — Nexor`
  const [firstName, ...rest] = (user.fullName || user.username || 'Cliente').split(' ')
  const lastName = rest.join(' ') || firstName

  // Expiry: tomorrow's date in Bolivia (UTC-4) — Libélula requires fecha_vencimiento > today (strictly greater)
  const pad = (n: number) => String(n).padStart(2, '0')
  const boliviaOffsetMs = -4 * 60 * 60 * 1000
  const tomorrowBolivia = new Date(Date.now() + boliviaOffsetMs + 24 * 60 * 60 * 1000)
  const fechaVencimiento = `${tomorrowBolivia.getUTCFullYear()}-${pad(tomorrowBolivia.getUTCMonth() + 1)}-${pad(tomorrowBolivia.getUTCDate())}`
  console.log(`[Libélula] fecha_vencimiento: ${fechaVencimiento}`)

  const body = {
    appkey,
    descripcion,
    email_cliente: user.email,
    nombre_cliente: firstName,
    apellido_cliente: lastName,
    identificador_deuda: identificadorDeuda,
    callback_url: callbackUrl,
    fecha_vencimiento: fechaVencimiento,
    lineas_detalle_deuda: [
      {
        concepto: descripcion,
        cantidad: 1,
        costo_unitario: priceBob,
        descuento_unitario: 0,
      },
    ],
  }

  let libelulaData: {
    id_transaccion?: string
    url_pasarela_pagos?: string
    qr_simple_url?: string
    url_tarjeta?: string
    error?: string
    message?: string
  }

  const libelulaApi = testModeSetting?.value === 'true' ? LIBELULA_API_TEST : LIBELULA_API_PROD
  console.log(`[Libélula] usando ${testModeSetting?.value === 'true' ? 'TEST' : 'PRODUCCIÓN'}: ${libelulaApi}`)
  console.log(`[Libélula] request body:`, JSON.stringify({ ...body, appkey: '***' }))

  try {
    const libelulaRes = await fetch(libelulaApi, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    libelulaData = await libelulaRes.json()

    if (!libelulaRes.ok || !libelulaData.id_transaccion) {
      const rawBody = JSON.stringify(libelulaData)
      console.error(`[Libélula create] HTTP ${libelulaRes.status} | Response: ${rawBody}`)
      return NextResponse.json({
        error: `Error Libélula — respuesta del servidor: ${rawBody}`,
        debug: { httpStatus: libelulaRes.status, response: libelulaData }
      }, { status: 502 })
    }
  } catch (err) {
    console.error('[Libélula create] fetch error', err)
    return NextResponse.json({ error: 'No se pudo conectar con la pasarela de pago' }, { status: 502 })
  }

  // Store identificadorDeuda (our UUID) — this is what Libélula sends back as transaction_id in the callback
  const notes = `LIBELULA:${identificadorDeuda}${isRenewal ? ':RENEWAL' : ''}`

  // Use PENDING_VERIFICATION for Libélula — won't block user if they don't pay
  await (prisma.packPurchaseRequest as any).create({
    data: {
      userId: user.id,
      plan: plan as 'BASIC' | 'PRO' | 'ELITE',
      period,
      price: priceUsd,
      status: 'PENDING_VERIFICATION',
      notes,
    },
  })

  return NextResponse.json({
    transactionId: identificadorDeuda,
    paymentUrl: libelulaData.url_pasarela_pagos,
    qrUrl: libelulaData.qr_simple_url,
    cardUrl: libelulaData.url_tarjeta ?? libelulaData.url_pasarela_pagos,
    price: priceUsd,
    priceBob,
    usdToBob,
  })
}
