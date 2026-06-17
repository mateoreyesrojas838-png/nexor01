'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Zap, QrCode, ExternalLink, Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'
import { PaymentGateway } from '@/components/PaymentGateway'
import { CryptoPaymentGateway } from '@/components/CryptoPaymentGateway'
import GlobalAiKeyToggle from '@/components/GlobalAiKeyToggle'

const PRESETS = [5, 10, 20, 50]

function CreditsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [balance, setBalance] = useState<number | null>(null)
  const [loadingBalance, setLoadingBalance] = useState(true)

  const [enabled, setEnabled] = useState(true)
  const [libelulaAvailable, setLibelulaAvailable] = useState(false)
  const [manualAvailable, setManualAvailable] = useState(true)
  const [cryptoAvailable, setCryptoAvailable] = useState(true)
  const [payMethod, setPayMethod] = useState<'libelula' | 'manual' | 'usdt'>('manual')

  const [amount, setAmount] = useState<string>('10')
  const [customAmount, setCustomAmount] = useState('')
  const [useCustom, setUseCustom] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [payData, setPayData] = useState<{ transactionId: string; paymentUrl: string; qrUrl?: string; cardUrl?: string; priceBob: number; amountUsd: number } | null>(null)
  const [qrSecondsLeft, setQrSecondsLeft] = useState<number | null>(null)
  const [done, setDone] = useState(false)
  const [doneMsg, setDoneMsg] = useState<string>('')

  const fetchBalance = useCallback(async () => {
    setLoadingBalance(true)
    try { const res = await fetch('/api/credits/balance'); const data = await res.json(); setBalance(data.balance ?? 0) }
    catch { setBalance(0) } finally { setLoadingBalance(false) }
  }, [])

  useEffect(() => {
    const payment = searchParams.get('payment'); const amt = searchParams.get('amount')
    if (payment === 'success' && amt) { setDoneMsg(`+$${parseFloat(amt).toFixed(2)} USD acreditados`); setDone(true); fetchBalance() }
  }, [searchParams, fetchBalance])

  useEffect(() => {
    fetchBalance()
    fetch('/api/settings').then(r => r.json()).then(d => {
      const map = d.settings ?? {}
      const hasLib = map['LIBELULA_AVAILABLE'] === 'true'
      const hasManual = map['STORE_PAYMENT_MANUAL'] !== 'false'
      const hasCrypto = map['CRYPTO_ENABLED'] !== 'false'
      setEnabled(map['CREDITS_ENABLED'] !== 'false')
      setLibelulaAvailable(hasLib); setManualAvailable(hasManual); setCryptoAvailable(hasCrypto)
      setPayMethod(hasLib ? 'libelula' : hasManual ? 'manual' : 'usdt')
    }).catch(() => {})
  }, [fetchBalance])

  // QR countdown + polling (solo Libélula)
  useEffect(() => {
    if (!payData || done) return
    setQrSecondsLeft(5 * 60)
    const tick = setInterval(() => setQrSecondsLeft(prev => (prev === null || prev <= 1 ? 0 : prev - 1)), 1000)
    return () => clearInterval(tick)
  }, [payData, done])
  useEffect(() => { if (qrSecondsLeft === 0 && !done) { setPayData(null); setQrSecondsLeft(null) } }, [qrSecondsLeft, done])
  useEffect(() => {
    if (!payData || done) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/libelula/status-check?transaction_id=${payData.transactionId}`)
        const data = await res.json()
        if (data.paid) { clearInterval(interval); setDoneMsg(`+$${payData.amountUsd.toFixed(2)} USD acreditados`); setDone(true); fetchBalance() }
      } catch { /* */ }
    }, 5000)
    return () => clearInterval(interval)
  }, [payData, done, fetchBalance])

  const finalAmount = useCallback(() => (useCustom ? parseFloat(customAmount) || 0 : parseFloat(amount) || 0), [useCustom, customAmount, amount])

  async function handleGenerateLibelula() {
    const usd = finalAmount()
    if (!usd || usd <= 0) { setError('Seleccioná un monto válido'); return }
    if (usd > 500) { setError('Monto máximo: $500 USD'); return }
    setLoading(true); setError(''); setPayData(null)
    try {
      const res = await fetch('/api/payments/libelula/credits/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: usd }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear el pago')
      setPayData(data)
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error al conectar') } finally { setLoading(false) }
  }

  // Manual: PaymentGateway sube el comprobante y nos da la URL
  const submitManual = async (proofUrl: string): Promise<'approved' | 'pending_verification'> => {
    const res = await fetch('/api/credits/topup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amountUsd: finalAmount(), paymentMethod: 'MANUAL', proofUrl }) })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Error al enviar')
    return 'pending_verification'
  }
  // USDT: CryptoPaymentGateway nos da el txHash
  const submitCrypto = async (txHash: string): Promise<'approved' | 'pending_verification'> => {
    const res = await fetch('/api/credits/topup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amountUsd: finalAmount(), paymentMethod: 'CRYPTO', txHash }) })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Error al registrar el pago')
    return data.status === 'approved' ? 'approved' : 'pending_verification'
  }

  const amountValid = finalAmount() > 0 && finalAmount() <= 500
  const methodsCount = [libelulaAvailable, manualAvailable, cryptoAvailable].filter(Boolean).length

  // Página desactivada por el admin → bloqueo (como los servicios)
  if (!enabled) {
    return (
      <div className="min-h-screen px-4 py-8" style={{ background: '#0B0B12' }}>
        <div className="max-w-md mx-auto">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-white/60 mb-8"><ArrowLeft size={13} /> Volver</Link>
          <div className="rounded-2xl p-8 flex flex-col items-center gap-3 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <AlertCircle size={28} className="text-white/20" />
            <p className="text-sm font-bold text-white/50">Recarga de créditos no disponible</p>
            <p className="text-xs text-white/25 leading-relaxed">No está habilitada en este momento.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: '#0B0B12' }}>
      <div className="max-w-md mx-auto">
        <Link href="/dashboard/settings" className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors mb-8"><ArrowLeft size={13} /> Volver</Link>

        <div className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-1">Créditos AI</p>
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Recargar saldo</h1>
        </div>

        {/* Balance */}
        <div className="rounded-2xl p-5 mb-4 flex items-center justify-between" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Saldo actual</p>
            {loadingBalance ? <div className="w-20 h-7 bg-white/5 rounded animate-pulse" /> : <p className="text-3xl font-black text-white">${(balance ?? 0).toFixed(4)}<span className="text-sm font-normal text-white/30 ml-1">USD</span></p>}
          </div>
          <button onClick={fetchBalance} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"><RefreshCw size={14} className="text-white/40" /></button>
        </div>

        {/* Switch API key de la app (para que los servicios de GPT funcionen con créditos) */}
        <div className="mb-6"><GlobalAiKeyToggle /></div>

        {done ? (
          <div className="rounded-3xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <div className="p-6 flex flex-col items-center gap-5 py-10 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}><CheckCircle2 size={30} className="text-green-400" /></div>
              <div>
                <p className="text-lg font-black text-white mb-1">¡Listo!</p>
                <p className="text-xs text-white/40 leading-relaxed max-w-xs">{doneMsg || 'Tu solicitud fue recibida.'}</p>
              </div>
              <button onClick={() => { setDone(false); setPayData(null); setDoneMsg(''); router.replace('/dashboard/credits') }} className="w-full py-3 rounded-2xl text-sm font-black text-white/70 bg-white/5 hover:bg-white/10 transition-all">Recargar más</button>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <div className="p-6 space-y-5">
              {/* Monto */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Monto a recargar</p>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {PRESETS.map(p => (
                    <button key={p} onClick={() => { setUseCustom(false); setAmount(String(p)) }} className="py-3 rounded-xl text-sm font-black transition-all"
                      style={!useCustom && amount === String(p) ? { background: 'linear-gradient(135deg,#4f46e5,#6366f1)', color: '#fff' } : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>${p}</button>
                  ))}
                </div>
                <div onClick={() => setUseCustom(true)} className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-text" style={useCustom ? { background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.4)' } : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span className="text-sm text-white/40 font-bold shrink-0">$</span>
                  <input type="number" min="1" max="500" step="1" placeholder="Otro monto..." value={customAmount} onChange={e => { setCustomAmount(e.target.value); setUseCustom(true) }} className="flex-1 bg-transparent text-sm text-white placeholder-white/20 outline-none" />
                  <span className="text-xs text-white/25 shrink-0">USD</span>
                </div>
                {amountValid && <p className="text-xs text-indigo-400 font-bold mt-2">Recibirás +${finalAmount().toFixed(2)} USD en créditos</p>}
              </div>

              {/* Método */}
              {methodsCount > 1 && (
                <div className="flex rounded-xl overflow-hidden border border-white/10">
                  {libelulaAvailable && <button onClick={() => setPayMethod('libelula')} className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider ${payMethod === 'libelula' ? 'text-white bg-indigo-500/30' : 'text-white/40'}`}>QR Libélula</button>}
                  {manualAvailable && <button onClick={() => setPayMethod('manual')} className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider ${payMethod === 'manual' ? 'text-white bg-white/10' : 'text-white/40'}`}>Comprobante</button>}
                  {cryptoAvailable && <button onClick={() => setPayMethod('usdt')} className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider ${payMethod === 'usdt' ? 'text-black bg-yellow-400' : 'text-white/40'}`}>USDT</button>}
                </div>
              )}

              {error && <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 bg-red-500/10 border border-red-500/20"><AlertCircle size={13} className="text-red-400 shrink-0" /><p className="text-[11px] text-red-400">{error}</p></div>}

              {!amountValid ? (
                <p className="text-xs text-white/30 text-center py-2">Elegí un monto válido ($1–$500) para continuar.</p>
              ) : payMethod === 'libelula' && libelulaAvailable ? (
                !payData ? (
                  <button onClick={handleGenerateLibelula} disabled={loading} className="w-full py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg,#4f46e5,#6366f1)' }}>{loading ? <Loader2 size={15} className="animate-spin" /> : <QrCode size={15} />} Generar QR · ${finalAmount().toFixed(2)}</button>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-white/10 p-5 flex flex-col items-center gap-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Escaneá con tu app bancaria</p>
                      {payData.qrUrl ? <div className="w-52 h-52 rounded-2xl overflow-hidden bg-white p-2.5"><img src={payData.qrUrl} alt="QR" className="w-full h-full object-contain" /></div> : <div className="w-52 h-52 flex items-center justify-center border border-white/10 rounded-2xl"><QrCode size={32} className="text-white/20" /></div>}
                      <p className="text-sm font-black text-indigo-400">Bs. {payData.priceBob.toFixed(2)}</p>
                    </div>
                    <a href={payData.cardUrl || payData.paymentUrl} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8' }}><ExternalLink size={13} /> Pagar con Tarjeta</a>
                    {qrSecondsLeft !== null && qrSecondsLeft > 0 && <p className="text-center text-[11px] text-white/40">Esperando pago... {Math.floor(qrSecondsLeft / 60)}:{String(qrSecondsLeft % 60).padStart(2, '0')}</p>}
                    <button onClick={() => { setPayData(null); setQrSecondsLeft(null) }} className="w-full py-2 text-xs text-white/30 hover:text-white/60">Cancelar</button>
                  </div>
                )
              ) : payMethod === 'manual' && manualAvailable ? (
                <PaymentGateway plan={`Recarga de créditos · $${finalAmount().toFixed(2)}`} price={finalAmount()} onSubmitPayment={submitManual} onSuccess={() => { setDoneMsg('Comprobante recibido. Se acreditará cuando el equipo lo apruebe.'); setDone(true) }} onCancel={() => {}} />
              ) : payMethod === 'usdt' && cryptoAvailable ? (
                <CryptoPaymentGateway plan="Recarga de créditos" price={finalAmount()} onSubmitTx={submitCrypto} onSuccess={(st) => { setDoneMsg(st === 'approved' ? `+$${finalAmount().toFixed(2)} USD acreditados` : 'Pago recibido. Se acredita al confirmarse en la red (unos minutos).'); setDone(true); fetchBalance() }} onCancel={() => {}} />
              ) : (
                <p className="text-xs text-white/30 text-center py-2">No hay métodos de pago disponibles. Contactá al administrador.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CreditsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: '#0B0B12' }}><div className="w-8 h-8 border-2 border-white/10 border-t-indigo-400 rounded-full animate-spin" /></div>}>
      <CreditsContent />
    </Suspense>
  )
}
