export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken, generateReferralCode } from '@/lib/auth'
import { sendWelcomeEmail } from '@/lib/email'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const errorParam = searchParams.get('error')
  const stateRaw = searchParams.get('state')
  const dest = stateRaw && stateRaw.startsWith('/') && !stateRaw.startsWith('//') && !stateRaw.startsWith('/\\') ? stateRaw : '/dashboard'

  if (errorParam || !code) {
    return NextResponse.redirect(`${APP_URL}/login?error=google_cancelled`)
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID!
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
    const redirectUri = process.env.GOOGLE_AUTH_REDIRECT_URI!

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    const tokenData = await tokenRes.json()
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('[Google OAuth] token exchange failed:', tokenData)
      return NextResponse.redirect(`${APP_URL}/login?error=google_token_failed`)
    }

    // Get user info from Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const googleUser = await userInfoRes.json()

    if (!googleUser.email) {
      return NextResponse.redirect(`${APP_URL}/login?error=google_no_email`)
    }

    // Find or create user
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId: googleUser.id }, { email: googleUser.email }] }
    })

    const isNew = !user

    if (!user) {
      // New user — auto-generate username
      const baseUsername = googleUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '')
      let username = baseUsername
      let suffix = 0
      while (await prisma.user.findUnique({ where: { username } })) {
        suffix++
        username = `${baseUsername}${suffix}`
      }

      user = await prisma.user.create({
        data: {
          username,
          email: googleUser.email,
          fullName: googleUser.name ?? googleUser.email.split('@')[0],
          googleId: googleUser.id,
          avatarUrl: googleUser.picture ?? null,
          referralCode: generateReferralCode(),
        }
      })
    } else if (!user.googleId) {
      // Existing email user — link Google account
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: googleUser.id, avatarUrl: user.avatarUrl ?? googleUser.picture ?? null },
      })
    }

    if (isNew) {
      sendWelcomeEmail(user.email, user.fullName, user.referralCode ?? '')
        .catch(e => console.error('[email] welcome google:', e))
    }

    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    })

    const response = NextResponse.redirect(`${APP_URL}${dest}`)
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (err) {
    console.error('[Google OAuth] callback error:', err)
    return NextResponse.redirect(`${APP_URL}/login?error=google_failed`)
  }
}
