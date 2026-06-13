export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = process.env.GOOGLE_AUTH_REDIRECT_URI

  if (!clientId || !redirectUri) {
    return NextResponse.redirect(
      new URL('/register?error=google_not_configured', process.env.NEXT_PUBLIC_APP_URL!)
    )
  }

  // Preservar a dónde volver tras el login (viaja en el state de OAuth)
  const r = request.nextUrl.searchParams.get('redirect')
  const state = r && r.startsWith('/') && !r.startsWith('//') && !r.startsWith('/\\') ? r : ''

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
    ...(state ? { state } : {}),
  })

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
}
