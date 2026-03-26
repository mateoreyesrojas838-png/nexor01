'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Clock, ShieldCheck } from 'lucide-react'
import { PaymentGateway } from '@/components/PaymentGateway'

const PLAN_LABELS: Record<string, string> = {
  BASIC: 'Pack Básico',
  PRO: 'Pack Pro',
  ELITE: 'Pack Elite',
}

const PRICE_DEFAULTS: Record<string, number> = {
  BASIC: 49,
  PRO: 99,
  ELITE: 199,
  RENEWAL: 19,
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const planId = (searchParams.get('plan') ?? '').toUpperCase()
  const isRenewal = searchParams.get('renewal') === 'true'

  const [price, setPrice] = useState<number | null>(null)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!['BASIC', 'PRO', 'ELITE'].includes(planId)) {
      router.replace('/dashboard/planes')
      return
    }

    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        const map = d.settings ?? {}
        const key = isRenewal ? 'PRICE_RENEWAL' : `PRICE_${planId}`
        const val = parseFloat(map[key])
        setPrice(val > 0 ? val : isRenewal ? PRICE_DEFAULTS.RENEWAL : PRICE_DEFAULTS[planId])
      })
      .catch(() => {
        setPrice(isRenewal ? PRICE_DEFAULTS.RENEWAL : PRICE_DEFAULTS[planId])
      })
  }, [planId, isRenewal, router])

  const handleSubmitPayment = async (proofUrl: string): Promise<'approved' | 'pending_verification'> => {
    const res = await fetch('/api/pack-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: planId, price, paymentProofUrl: proofUrl }),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error ?? 'Error al enviar la solicitud')
    }
    return 'pending_verification'
  }

  const handleSuccess = () => {
    setDone(true)
  }

  if (!['BASIC', 'PRO', 'ELITE'].includes(planId)) return null

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: '#0B0B12' }}>
      <div className="max-w-md mx-auto">

        {/* Back */}
        <Link
          href="/dashboard/planes"
          className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors mb-8"
        >
          <ArrowLeft size={13} /> Volver a Planes
        </Link>

        {/* Header */}
        <div className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-1">
            {isRenewal ? 'Renovación' : 'Adquirir plan'}
          </p>
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter">
            {PLAN_LABELS[planId] ?? planId}
          </h1>
        </div>

        {/* Card */}
        <div className="rounded-3xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,215,0,0.15)' }}>
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.5), transparent)' }} />

          <div className="p-6">
            {done ? (
              /* Success screen */
              <div className="flex flex-col items-center gap-5 py-6 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.25)' }}>
                  <CheckCircle2 size={30} style={{ color: '#FFD700' }} />
                </div>
                <div>
                  <p className="text-base font-black text-white mb-1">¡Solicitud enviada!</p>
                  <p className="text-xs text-white/40 leading-relaxed max-w-xs">
                    Tu comprobante fue recibido. El equipo lo revisará y activará tu plan en menos de 24 horas.
                  </p>
                </div>

                <div className="w-full rounded-2xl p-4 flex items-start gap-3"
                  style={{ background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.1)' }}>
                  <Clock size={14} style={{ color: '#FFD700' }} className="shrink-0 mt-0.5" />
                  <p className="text-xs text-white/40 leading-relaxed">
                    Recibirás una notificación cuando tu plan esté activo. También puedes revisar el estado en la sección <strong className="text-white/60">Planes</strong>.
                  </p>
                </div>

                <Link
                  href="/dashboard"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black text-black transition-all active:scale-[0.98] hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg, #B45309, #D97706, #FFD700)' }}
                >
                  Ir al Dashboard
                </Link>
              </div>
            ) : price === null ? (
              /* Loading */
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-white/10 border-t-amber-400 rounded-full animate-spin" />
              </div>
            ) : (
              /* Payment flow */
              <>
                {error && (
                  <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-2.5 mb-5">
                    <p className="text-[11px] text-red-400">{error}</p>
                  </div>
                )}
                <PaymentGateway
                  plan={PLAN_LABELS[planId] ?? planId}
                  price={price}
                  onSubmitPayment={handleSubmitPayment}
                  onSuccess={handleSuccess}
                  onCancel={() => router.push('/dashboard/planes')}
                />
              </>
            )}
          </div>
        </div>

        {/* Trust badge */}
        {!done && (
          <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-white/20">
            <ShieldCheck size={11} />
            Proceso verificado manualmente por el equipo Nexor
          </div>
        )}

      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B0B12' }}>
        <div className="w-8 h-8 border-2 border-white/10 border-t-amber-400 rounded-full animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
