import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { serviceKeyForApiPath } from '@/lib/service-routes'

// Rate limiter inline para Edge Runtime (no setInterval, no Node.js APIs)
// Clave: primeros 32 chars del JWT → 1 entrada por usuario
const _apiStore = new Map<string, { count: number; resetAt: number }>()

// Caché de acceso por servicio (memoria edge). Evita un hop por request.
const _accessStore = new Map<string, { ok: boolean; exp: number }>()
const ACCESS_TTL_MS = 20_000

/** Verifica acceso a un servicio consultando el endpoint interno (Node + Prisma), con caché. */
async function hasServiceAccess(token: string, serviceKey: string, request: NextRequest): Promise<boolean> {
  // Clave por token COMPLETO (los primeros chars de un JWT son iguales entre usuarios).
  const ck = token + ':' + serviceKey
  const now = Date.now()
  const hit = _accessStore.get(ck)
  if (hit && hit.exp > now) return hit.ok
  try {
    const url = new URL('/api/internal/service-access', request.url)
    url.searchParams.set('key', serviceKey)
    const res = await fetch(url, { headers: { cookie: request.headers.get('cookie') ?? '' } })
    if (res.status === 401) return true // sin sesión válida → que el endpoint real responda 401
    const data = await res.json().catch(() => ({ ok: true }))
    const ok = !!data.ok
    _accessStore.set(ck, { ok, exp: now + ACCESS_TTL_MS })
    return ok
  } catch {
    return true // fail-open ante error de red (evita lockouts por fallos transitorios)
  }
}

function dashboardRateLimit(token: string): boolean {
  const key = token.slice(0, 32)
  const now = Date.now()
  const entry = _apiStore.get(key)

  if (!entry || entry.resetAt < now) {
    _apiStore.set(key, { count: 1, resetAt: now + 10_000 }) // ventana 10s
    return true
  }
  if (entry.count >= 10) return false // bloqueado: 10 requests / 10s
  entry.count++
  return true
}

// User-Agents de bots, scrapers y herramientas automatizadas
const BOT_UA_PATTERNS = [
  'curl', 'wget', 'python-requests', 'python-urllib', 'httpx',
  'axios', 'node-fetch', 'got/', 'superagent', 'okhttp',
  'java/', 'ruby/', 'go-http', 'libwww', 'scrapy',
  'bot', 'crawl', 'spider', 'scraper', 'headless',
  'phantomjs', 'selenium', 'puppeteer', 'playwright',
]

function isBotRequest(request: NextRequest): boolean {
  const ua = request.headers.get('user-agent') ?? ''
  if (!ua) return true // sin User-Agent → siempre bot
  const lower = ua.toLowerCase()
  return BOT_UA_PATTERNS.some(p => lower.includes(p))
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  const { pathname } = request.nextUrl

  // La ruta interna de verificación es server-to-server (llamada por este mismo middleware).
  // Se deja pasar sin bot-block, rate-limit ni gating, para evitar recursión.
  if (pathname.startsWith('/api/internal/')) {
    return NextResponse.next()
  }

  // Bloquear bots/scrapers en rutas API (excluir webhooks, callbacks de pago, health check
  // y el cron de verificación on-chain que se llama vía curl/cron-job y va protegido por CRON_SECRET)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/webhooks/') && !pathname.startsWith('/api/payments/libelula/callback') && pathname !== '/api/health' && pathname !== '/api/purchases/verify') {
    if (isBotRequest(request)) {
      return new NextResponse(
        JSON.stringify({ error: 'Acceso denegado.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  // Solo permitimos redirects internos (evita open-redirect a sitios externos)
  const safeRedirect = (r: string | null): string | null =>
    r && r.startsWith('/') && !r.startsWith('//') && !r.startsWith('/\\') ? r : null

  // Rutas protegidas — requieren sesión. Guardamos a dónde iba para volver tras login.
  if (!token && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname + request.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  // Si ya tiene sesión y va a login/registro → al destino guardado o al dashboard
  if (token && (pathname === '/login' || pathname === '/register')) {
    const dest = safeRedirect(request.nextUrl.searchParams.get('redirect')) ?? '/dashboard'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // Rate limiting en todas las rutas /api/ autenticadas
  // Excluir: auth, webhooks (no tienen token → excluidos naturalmente)
  if (pathname.startsWith('/api/') && token &&
      !pathname.startsWith('/api/auth/') &&
      !pathname.startsWith('/api/webhooks/')) {
    if (!dashboardRateLimit(token)) {
      return new NextResponse(
        JSON.stringify({ error: 'Demasiadas solicitudes. Espera 10 segundos.' }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '10' } }
      )
    }
  }

  // Control de acceso por servicio (server-side). Si la ruta de API pertenece a un
  // servicio gateado y el usuario no tiene acceso (plan/pack/suscripción vigente, o el
  // servicio está desactivado) → 403. Cubre todas las sub-rutas del servicio.
  if (token && pathname.startsWith('/api/')) {
    const serviceKey = serviceKeyForApiPath(pathname)
    if (serviceKey && !(await hasServiceAccess(token, serviceKey, request))) {
      return new NextResponse(
        JSON.stringify({ error: 'No tenés acceso a este servicio. Activá un plan o suscripción.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/register', '/verify-device', '/api/:path*'],
}
