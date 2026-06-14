'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Clock, ShieldCheck, QrCode, ExternalLink, Loader2, AlertCircle, Zap, Sparkles, Crown } from 'lucide-react'
import { PaymentGateway } from '@/components/PaymentGateway'
import { CryptoPaymentGateway } from '@/components/CryptoPaymentGateway'

const PLAN_LABELS: Record<string, string> = { BASIC: 'Pack Básico', PRO: 'Pack Pro', ELITE: 'Pack Elite' }
const PLAN_ICONS: Record<string, React.ElementType> = { BASIC: Zap, PRO: Sparkles, ELITE: Crown }

const PERIODS = [
  { key: 'MONTHLY', label: 'Mensual', sub: '30 días' },
  { key: 'QUARTERLY', label: '3 meses', sub: '90 días' },
  { key: 'ANNUAL', label: 'Anual', sub: '365 días' },
] as const

type Period = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const planId = (searchParams.get('plan') ?? '').toUpperCase()
  const autoStart = searchParams.get('autostart') === '1'
  const initialPeriod = ((searchParams.get('period') ?? 'MONTHLY').toUpperCase()) as Period

  const [period, setPeriod] = useState<Period>(['MONTHLY', 'QUARTERLY', 'ANNUAL'].includes(initialPeriod) ? initialPeriod : 'MONTHLY')
  const [prices, setPrices] = useState<Record<string, number | null>>({ MONTHLY: null, QUARTERLY: null, ANNUAL: null })
  const [serviceNames, setServiceNames] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)
  const [usdToBob, setUsdToBob] = useState(0)
  const [done, setDone] = useState(false)

  const [libelulaAvailable, setLibelulaAvailable] = useState(false)
  const [manualAvailable, setManualAvailable] = useState(true)
  const [cryptoAvailable, setCryptoAvailable] = useState(true)
  const [payMethod, setPayMethod] = useState<'libelula' | 'manual' | 'usdt'>('libelula')

  const [libelulaLoading, setLibelulaLoading] = useState(false)
  const [libelulaData, setLibelulaData] = useState<{ qrUrl?: string; paymentUrl: string; cardUrl?: string; transactionId: string; priceBob?: number } | null>(null)
  const [libelulaError, setLibelulaError] = useState('')
  const [qrSecondsLeft, setQrSecondsLeft] = useState<number | null>(null)

  const price = prices[period]

  const triggerLibelula = useCallback(async () => {
    setLibelulaLoading(true); setLibelulaError(''); setLibelulaData(null); setQrSecondsLeft(null)
    try {
      const res = await fetch('/api/payments/libelula/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, period }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear el pago')
      setLibelulaData(data)
    } catch (err: unknown) {
      setLibelulaError(err instanceof Error ? err.message : 'Error al conectar con la pasarela de pago')
    } finally { setLibelulaLoading(false) }
  }, [planId, period])

  // Load plan config (prices per period) + settings (availability)
  useEffect(() => {
    if (!['BASIC', 'PRO', 'ELITE'].includes(planId)) { router.replace('/dashboard/planes'); return }

    Promise.all([
      fetch('/api/plans').then(r => r.json()).catch(() => ({ plans: [] })),
      fetch('/api/settings').then(r => r.json()).catch(() => ({ settings: {} })),
    ]).then(([plansData, settingsData]) => {
      const cfg = (plansData.plans ?? []).find((p: any) => p.plan === planId)
      if (cfg) { setPrices(cfg.prices); setServiceNames(cfg.serviceNames ?? []) }

      const map = settingsData.settings ?? {}
      const rate = parseFloat(map['USD_TO_BOB_RATE']); if (rate > 0) setUsdToBob(rate)
      const hasLibelula = map['LIBELULA_AVAILABLE'] === 'true'
      const hasManual = map['STORE_PAYMENT_MANUAL'] !== 'false'
      const hasCrypto = map['CRYPTO_ENABLED'] !== 'false'
      setLibelulaAvailable(hasLibelula); setManualAvailable(hasManual); setCryptoAvailable(hasCrypto)
      if (!hasLibelula && hasManual) setPayMethod('manual')
      else if (!hasLibelula && !hasManual && hasCrypto) setPayMethod('usdt')

      // Si el período inicial no tiene precio, elegir el primero disponible
      const avail = (['MONTHLY', 'QUARTERLY', 'ANNUAL'] as Period[]).filter(p => (cfg?.prices?.[p] ?? 0) > 0)
      if (cfg && !avail.includes(initialPeriod) && avail.length) setPeriod(avail[0])

      setLoaded(true)
      if (hasLibelula && autoStart) triggerLibelula()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId, router, autoStart])

  // Cambiar período → resetear QR (el precio cambió)
  useEffect(() => { setLibelulaData(null); setQrSecondsLeft(null) }, [period])

  // QR countdown — 5 min
  useEffect(() => {
    if (!libelulaData || done) return
    setQrSecondsLeft(5 * 60)
    const tick = setInterval(() => setQrSecondsLeft(prev => (prev === null || prev <= 1 ? 0 : prev - 1)), 1000)
    return () => clearInterval(tick)
  }, [libelulaData, done])
  useEffect(() => { if (qrSecondsLeft === 0 && !done) { setLibelulaData(null); setQrSecondsLeft(null) } }, [qrSecondsLeft, done])

  // Poll payment confirmation
  useEffect(() => {
    if (!libelulaData || done) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/libelula/status-check?transaction_id=${libelulaData.transactionId}`)
        const data = await res.json()
        if (data.paid) { clearInterval(interval); setDone(true); setTimeout(() => router.push('/dashboard?payment=success'), 2000) }
      } catch { /* ignore */ }
    }, 5000)
    return () => clearInterval(interval)
  }, [libelulaData, done, router])

  const handleSubmitPayment = async (proofUrl: string): Promise<'approved' | 'pending_verification'> => {
    const res = await fetch('/api/pack-requests', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: planId, period, paymentProofUrl: proofUrl }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Error al enviar la solicitud')
    return 'pending_verification'
  }

  if (!['BASIC', 'PRO', 'ELITE'].includes(planId)) return null

  const PlanIcon = PLAN_ICONS[planId] ?? Zap
  const bobPrice = libelulaData?.priceBob ?? (price && usdToBob > 0 ? Math.round(price * usdToBob * 100) / 100 : null)
  const availablePeriods = (['MONTHLY', 'QUARTERLY', 'ANNUAL'] as Period[]).filter(p => (prices[p] ?? 0) > 0)

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: '#0B0B12' }}>
      <div className="max-w-md mx-auto">
        <Link href="/dashboard/planes" className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors mb-8">
          <ArrowLeft size={13} /> Volver a Planes
        </Link>

        <div className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-1">Adquirir plan</p>
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter">{PLAN_LABELS[planId] ?? planId}</h1>
        </div>

        <div className="rounded-3xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,215,0,0.15)' }}>
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.5), transparent)' }} />

          <div className="p-6">
            {done ? (
              <div className="flex flex-col items-center gap-5 py-6 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.25)' }}>
                  <CheckCircle2 size={30} style={{ color: '#FFD700' }} />
                </div>
                <div>
                  <p className="text-base font-black text-white mb-1">{libelulaData ? '¡Pago confirmado!' : '¡Solicitud enviada!'}</p>
                  <p className="text-xs text-white/40 leading-relaxed max-w-xs">
                    {libelulaData ? 'Tu pago fue verificado. Tu plan ya está activo. Redirigiendo...' : 'Tu comprobante fue recibido. El equipo lo revisará y activará tu plan en menos de 24 horas.'}
                  </p>
                </div>
                <Link href="/dashboard" className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black text-black transition-all active:scale-[0.98] hover:brightness-110" style={{ background: 'linear-gradient(135deg, #B45309, #D97706, #FFD700)' }}>
                  Ir al Dashboard
                </Link>
              </div>
            ) : !loaded ? (
              <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-white/10 border-t-amber-400 rounded-full animate-spin" /></div>
            ) : availablePeriods.length === 0 || price == null ? (
              <div className="text-center py-10">
                <p className="text-sm text-white/50">Este plan no tiene precios configurados todavía.</p>
                <Link href="/dashboard/planes" className="text-xs text-amber-400 mt-3 inline-block">Volver a planes</Link>
              </div>
            ) : (
              <>
                {/* Selector de período */}
                {availablePeriods.length > 1 && (
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    {PERIODS.filter(p => availablePeriods.includes(p.key as Period)).map(p => {
                      const active = period === p.key
                      return (
                        <button key={p.key} onClick={() => setPeriod(p.key as Period)}
                          className={`rounded-xl py-2.5 text-center border transition-all ${active ? 'text-black' : 'text-white/50 border-white/10 bg-white/5 hover:text-white/80'}`}
                          style={active ? { background: 'linear-gradient(135deg,#D97706,#FFD700)', borderColor: 'transparent' } : {}}>
                          <p className="text-xs font-black">{p.label}</p>
                          <p className={`text-[10px] ${active ? 'text-black/60' : 'text-white/30'}`}>${prices[p.key as Period]}</p>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Resumen */}
                <div className="px-4 py-4 rounded-2xl mb-5" style={{ background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.15)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)' }}>
                        <PlanIcon size={16} style={{ color: '#FFD700' }} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30">{PERIODS.find(p => p.key === period)?.label}</p>
                        <p className="text-sm font-black text-white">{PLAN_LABELS[planId] ?? planId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-white leading-none">${price}</p>
                      <p className="text-[10px] text-white/30">USDT</p>
                      {bobPrice && <p className="text-sm font-black mt-0.5" style={{ color: '#FFD700' }}>Bs. {bobPrice.toFixed(2)}</p>}
                    </div>
                  </div>
                  {serviceNames.length > 0 && (
                    <div className="border-t pt-3" style={{ borderColor: 'rgba(255,215,0,0.1)' }}>
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2">Incluye</p>
                      <ul className="space-y-1">
                        {serviceNames.map((item, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#FFD700' }} />
                            <span className="text-[11px] text-white/50">{item}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-[10px] text-white/20 mt-2">{PERIODS.find(p => p.key === period)?.sub} de acceso · renovable</p>
                    </div>
                  )}
                </div>

                {/* Tabs de método */}
                {[libelulaAvailable, manualAvailable, cryptoAvailable].filter(Boolean).length > 1 && (
                  <div className="flex rounded-xl overflow-hidden border border-white/10 mb-5">
                    {libelulaAvailable && (
                      <button onClick={() => setPayMethod('libelula')} className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider transition-all ${payMethod === 'libelula' ? 'text-black' : 'text-white/40 hover:text-white/60'}`} style={payMethod === 'libelula' ? { background: 'linear-gradient(135deg, #D97706, #FFD700)' } : { background: 'transparent' }}>QR Libélula</button>
                    )}
                    {manualAvailable && (
                      <button onClick={() => setPayMethod('manual')} className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider transition-all ${payMethod === 'manual' ? 'text-white bg-white/10' : 'text-white/40 hover:text-white/60'}`}>Comprobante</button>
                    )}
                    {cryptoAvailable && (
                      <button onClick={() => setPayMethod('usdt')} className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider transition-all ${payMethod === 'usdt' ? 'text-black' : 'text-white/40 hover:text-white/60'}`} style={payMethod === 'usdt' ? { background: 'linear-gradient(135deg, #ca8a04, #facc15)' } : { background: 'transparent' }}>USDT</button>
                    )}
                  </div>
                )}

                {/* Libélula */}
                {payMethod === 'libelula' && libelulaAvailable && (
                  <div className="space-y-4">
                    {libelulaError && (
                      <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-2.5">
                        <AlertCircle size={13} className="text-red-400 shrink-0" /><p className="text-[11px] text-red-400">{libelulaError}</p>
                      </div>
                    )}
                    {libelulaLoading ? (
                      <div className="flex flex-col items-center gap-3 py-8"><div className="w-8 h-8 border-2 border-white/10 border-t-amber-400 rounded-full animate-spin" /><p className="text-xs text-white/30">Generando QR de pago...</p></div>
                    ) : !libelulaData ? (
                      <button onClick={() => triggerLibelula()} className="w-full py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-black" style={{ background: 'linear-gradient(135deg, #B45309, #D97706, #FFD700)', boxShadow: '0 4px 24px rgba(255,215,0,0.25)' }}>
                        <QrCode size={15} /> Generar QR de pago
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-white/10 p-5 flex flex-col items-center gap-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Escaneá con tu app bancaria</p>
                          {libelulaData.qrUrl ? (
                            <div className="w-52 h-52 rounded-2xl overflow-hidden bg-white p-2.5"><img src={libelulaData.qrUrl} alt="QR de pago" className="w-full h-full object-contain" /></div>
                          ) : (
                            <div className="w-52 h-52 rounded-2xl flex flex-col items-center justify-center gap-2 border border-white/10"><QrCode size={32} className="text-white/20" /><p className="text-[10px] text-white/30 text-center px-4">QR no disponible</p></div>
                          )}
                          <p className="text-[10px] text-white/25">Tigo Money · BNB · Banco Unión y más</p>
                          {libelulaData.priceBob && <p className="text-sm font-black" style={{ color: '#FFD700' }}>Bs. {libelulaData.priceBob.toFixed(2)}</p>}
                        </div>
                        <a href={libelulaData.cardUrl || libelulaData.paymentUrl} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black transition-all active:scale-[0.98]" style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', color: '#FFD700' }}>
                          <ExternalLink size={13} /> Pagar con Tarjeta
                        </a>
                        {qrSecondsLeft !== null && qrSecondsLeft > 0 && (
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-2"><Loader2 size={11} className="animate-spin text-amber-400" /><p className="text-[11px] text-white/40">Esperando pago...</p><p className="text-[11px] font-black tabular-nums" style={{ color: '#FFD700' }}>{Math.floor(qrSecondsLeft / 60)}:{String(qrSecondsLeft % 60).padStart(2, '0')}</p></div>
                            <p className="text-[10px] text-white/20">Tu plan se activa automáticamente al confirmar el pago</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Manual */}
                {payMethod === 'manual' && manualAvailable && (
                  <PaymentGateway plan={`${PLAN_LABELS[planId] ?? planId} · ${PERIODS.find(p => p.key === period)?.label}`} price={price} onSubmitPayment={handleSubmitPayment} onSuccess={() => setDone(true)} onCancel={() => router.push('/dashboard/planes')} />
                )}

                {/* USDT */}
                {payMethod === 'usdt' && cryptoAvailable && (
                  <CryptoPaymentGateway plan={planId} price={price} period={period} onSuccess={() => setDone(true)} onCancel={() => router.push('/dashboard/planes')} />
                )}
              </>
            )}
          </div>
        </div>

        {!done && (
          <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-white/20">
            <ShieldCheck size={11} />
            {payMethod === 'libelula' && libelulaAvailable ? 'Pago procesado por Libélula · Banco Mercantil Santa Cruz'
              : payMethod === 'usdt' ? 'Pago verificado on-chain · USDT BEP-20 (BNB Smart Chain)'
              : 'Proceso verificado manualmente por el equipo Nexor'}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: '#0B0B12' }}><div className="w-8 h-8 border-2 border-white/10 border-t-amber-400 rounded-full animate-spin" /></div>}>
      <CheckoutContent />
    </Suspense>
  )
}
