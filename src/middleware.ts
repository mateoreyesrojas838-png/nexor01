import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rate limiter inline para Edge Runtime (no setInterval, no Node.js APIs)
// Clave: primeros 32 chars del JWT → 1 entrada por usuario
const _apiStore = new Map<string, { count: number; resetAt: number }>()

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

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  const { pathname } = request.nextUrl

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

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/register', '/verify-device', '/api/:path*'],
}
