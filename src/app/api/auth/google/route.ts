export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = process.env.GOOGLE_AUTH_REDIRECT_URI

  if (!clientId || !redirectUri) {
    return NextResponse.redirect(
      new URL('/register?error=google_not_configured', process.env.NEXT_PUBLIC_APP_URL!)
    )
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  })

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
}
