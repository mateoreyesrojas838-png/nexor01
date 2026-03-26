/**
 * Cloudflare Turnstile — server-side token validation.
 * Docs: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 *
 * Si TURNSTILE_SECRET_KEY no está configurada, la validación se omite
 * (útil para desarrollo local sin claves).
 */

interface TurnstileResponse {
  success: boolean
  'error-codes'?: string[]
}

/**
 * Verifica un token Turnstile con la API de Cloudflare.
 * @returns true si es válido (o si Turnstile no está configurado)
 */
export async function verifyTurnstile(token: string | null | undefined, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true // sin clave configurada → skip (dev local)
  if (!token) return false

  try {
    const body: Record<string, string> = { secret, response: token }
    if (ip && ip !== 'unknown') body.remoteip = ip

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    })

    const data: TurnstileResponse = await res.json()
    return data.success === true
  } catch {
    // Si Cloudflare no responde, no bloqueamos al usuario
    return true
  }
}
