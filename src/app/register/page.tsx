'use client'

import { useState, useCallback, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'
import TurnstileWidget from '@/components/TurnstileWidget'

function safeRedirect(r: string | null): string {
  return r && r.startsWith('/') && !r.startsWith('//') && !r.startsWith('/\\') ? r : ''
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}

function RegisterForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [redirect, setRedirect] = useState('')
  const handleTurnstile = useCallback((token: string) => setTurnstileToken(token), [])
  const handleTurnstileExpire = useCallback(() => setTurnstileToken(''), [])

  useEffect(() => {
    setRedirect(safeRedirect(new URLSearchParams(window.location.search).get('redirect')))
  }, [])

  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '', acceptTerms: false,
  })

  const update = (field: string, value: string | boolean) => {
    setForm(f => ({ ...f, [field]: value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.fullName || !form.email || !form.password || !form.confirmPassword) {
      setError('Completa todos los campos'); return
    }
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden'); return
    }
    if (!form.acceptTerms) {
      setError('Debes aceptar los términos y condiciones'); return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, turnstileToken }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setSuccess(true)
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = () => {
    window.location.href = '/api/auth/google'
  }

  const inputCls = 'w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/15 transition-colors'
  const labelCls = 'block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5'

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-green-500/5 blur-[140px]" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-amber-700/6 blur-[130px]" />
        </div>
        <div className="w-full max-w-[360px] relative z-10">
          <div className="water-glass relative overflow-hidden" style={{ padding: '2rem' }}>
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, #00FF9D 40%, #FFD700 60%, transparent)' }} />
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(0,255,157,0.08)', border: '1px solid rgba(0,255,157,0.25)' }}>
                <CheckCircle2 size={26} style={{ color: '#00FF9D' }} />
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.22em] mb-1" style={{ color: '#00FF9D' }}>¡Cuenta creada!</p>
              <h1 className="text-lg font-black text-white">Bienvenido a Nexor</h1>
              <p className="text-xs text-white/40 mt-1">Tu cuenta está lista para usar</p>
            </div>
            <button
              onClick={() => { window.location.href = redirect || '/dashboard' }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-[0.97] hover:brightness-110"
              style={{
                background: 'linear-gradient(135deg, #B45309, #D97706, #FFD700)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 6px 24px rgba(217,119,6,0.3)',
              }}
            >
              {redirect ? 'Continuar' : 'Ir a mi panel'} <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-amber-600/8 blur-[120px]" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-amber-500/6 blur-[120px]" />
      </div>

      <div className="w-full max-w-[360px] relative z-10">

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 mb-3 rounded-xl overflow-hidden border border-white/10 shadow-lg shadow-black/40">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-lg font-black text-white tracking-tight">Nexor</h1>
          <p className="text-xs text-white/35 mt-0.5">Crea tu cuenta gratuita</p>
        </div>

        {/* Card */}
        <div className="water-glass p-6 shadow-2xl shadow-black/50">

          {/* Accent line */}
          <div className="absolute top-0 left-0 right-0 h-px rounded-t-[1.5rem]"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.5) 40%, rgba(217,119,6,0.4) 60%, transparent)' }} />

          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl text-sm font-semibold text-white/80 hover:text-white transition-all hover:bg-white/8 active:scale-[0.98] mb-4"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/[0.07]" />
            <span className="text-[10px] text-white/20 uppercase tracking-widest">o con correo</span>
            <div className="flex-1 h-px bg-white/[0.07]" />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 mb-4">
              <AlertCircle size={13} className="text-red-400 shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">

            {/* Nombre completo */}
            <div>
              <label className={labelCls}>Nombre completo</label>
              <input
                type="text"
                className={inputCls}
                placeholder="Juan Pérez"
                value={form.fullName}
                onChange={e => update('fullName', e.target.value)}
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div>
              <label className={labelCls}>Correo electrónico</label>
              <input
                type="email"
                className={inputCls}
                placeholder="tu@correo.com"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                autoComplete="email"
              />
            </div>

            {/* Contraseña */}
            <div>
              <label className={labelCls}>Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`${inputCls} pr-11`}
                  placeholder="Ingresa tu contraseña"
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label className={labelCls}>Confirmar contraseña</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className={`${inputCls} pr-11`}
                  placeholder="Repite tu contraseña"
                  value={form.confirmPassword}
                  onChange={e => update('confirmPassword', e.target.value)}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Términos */}
            <label className="flex items-start gap-2.5 cursor-pointer pt-0.5">
              <input
                type="checkbox"
                checked={form.acceptTerms}
                onChange={e => update('acceptTerms', e.target.checked)}
                className="mt-0.5 w-3.5 h-3.5 rounded shrink-0"
                style={{ accentColor: '#D97706' }}
              />
              <span className="text-[11px] text-white/30 leading-relaxed">
                Acepto los{' '}
                <Link href="/terms" className="text-amber-400 hover:text-amber-300 transition-colors">Términos</Link>
                {' '}y la{' '}
                <Link href="/privacy" className="text-amber-400 hover:text-amber-300 transition-colors">Política de Privacidad</Link>
              </span>
            </label>

            {/* Turnstile */}
            <TurnstileWidget onToken={handleTurnstile} onExpire={handleTurnstileExpire} />

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #B45309, #D97706, #FFD700)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 4px 20px rgba(217,119,6,0.25)',
              }}
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                : <><span>Crear cuenta</span><ArrowRight size={13} /></>
              }
            </button>

          </form>
        </div>

        <p className="text-center text-white/25 text-xs mt-5">
          ¿Ya tienes cuenta?{' '}
          <Link href={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="text-amber-400 hover:text-amber-300 font-bold transition-colors">
            Iniciar sesión
          </Link>
        </p>

      </div>
    </div>
  )
}
