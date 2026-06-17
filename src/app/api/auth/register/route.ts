export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken, generateReferralCode } from '@/lib/auth'
import { sendWelcomeEmail } from '@/lib/email'
import { rateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit'
import { verifyTurnstile } from '@/lib/turnstile'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rl = rateLimit(`register:${ip}`, RATE_LIMITS.register)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Demasiados registros desde esta dirección. Intenta más tarde.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    )
  }

  try {
    const body = await request.json()
    const { fullName, email, password, confirmPassword, acceptTerms, turnstileToken, phone, country } = body

    // Turnstile anti-bot
    const turnstileOk = await verifyTurnstile(turnstileToken, ip)
    if (!turnstileOk) {
      return NextResponse.json({ error: 'Verificación de seguridad fallida. Recarga la página.' }, { status: 403 })
    }

    if (!fullName || !email || !password || !confirmPassword || !acceptTerms) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 })
    }

    if (!phone || String(phone).replace(/\D/g, '').length < 6) {
      return NextResponse.json({ error: 'El número de teléfono es obligatorio' }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Las contraseñas no coinciden' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'El correo electrónico ya está registrado' }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)
    const referralCode = generateReferralCode()

    // Auto-generate unique username from email
    const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '')
    let username = baseUsername
    let suffix = 0
    while (await prisma.user.findUnique({ where: { username } })) {
      suffix++
      username = `${baseUsername}${suffix}`
    }

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        fullName,
        phone: String(phone).trim(),
        country: country ? String(country).trim() : null,
        referralCode,
      }
    })

    sendWelcomeEmail(email, fullName, referralCode).catch(e => console.error('[email] welcome:', e))

    const token = generateToken({
      userId: newUser.id,
      username: newUser.username,
      email: newUser.email,
    })

    const response = NextResponse.json({
      message: 'Registro exitoso',
      user: { id: newUser.id, username: newUser.username, fullName: newUser.fullName }
    }, { status: 201 })

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
