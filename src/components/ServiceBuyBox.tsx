'use client'

import { useState, useRef } from 'react'
import { CryptoPaymentGateway } from '@/components/CryptoPaymentGateway'
import { Upload, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface Props {
  serviceSlug: string
  serviceName: string
  prices: { MONTHLY: number | null; QUARTERLY: number | null; ANNUAL: number | null }
  onPurchased?: () => void
}

const PERIOD_META: { key: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'; label: string; hint: string }[] = [
  { key: 'MONTHLY', label: 'Mensual', hint: '/mes' },
  { key: 'QUARTERLY', label: '3 meses', hint: '/3 meses' },
  { key: 'ANNUAL', label: 'Anual', hint: '/año' },
]

export function ServiceBuyBox({ serviceSlug, serviceName, prices, onPurchased }: Props) {
  const available = PERIOD_META.filter(p => prices[p.key] != null && (prices[p.key] as number) > 0)
  const [period, setPeriod] = useState<'MONTHLY' | 'QUARTERLY' | 'ANNUAL'>(available[0]?.key ?? 'MONTHLY')
  const [tab, setTab] = useState<'usdt' | 'manual'>('usdt')
  const fileRef = useRef<HTMLInputElement>(null)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<null | 'approved' | 'pending'>(null)

  const price = (prices[period] as number) ?? 0

  if (available.length === 0) {
    return <p className="text-sm text-white/40 text-center py-4">Este servicio todavía no tiene precios configurados.</p>
  }

  async function submitCrypto(txHash: string): Promise<'approved' | 'pending_verification'> {
    const res = await fetch(`/api/services/${serviceSlug}/subscribe`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period, paymentMethod: 'CRYPTO', txHash }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error al registrar el pago')
    return data.status === 'approved' ? 'approved' : 'pending_verification'
  }

  async function submitManual() {
    if (!proofFile) { setError('Subí el comprobante'); return }
    setLoading(true); setError(null)
    try {
      const fd = new FormData(); fd.append('file', proofFile)
      const up = await fetch('/api/upload', { method: 'POST', body: fd })
      const upData = await up.json()
      if (!up.ok) { setError(upData.error || 'Error al subir comprobante'); return }
      const res = await fetch(`/api/services/${serviceSlug}/subscribe`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period, proofUrl: upData.url }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al enviar'); return }
      setDone('pending')
    } catch { setError('Error de conexión') } finally { setLoading(false) }
  }

  if (done) {
    return (
      <div className="text-center py-2">
        <CheckCircle2 size={28} className="mx-auto text-green-400 mb-2" />
        <p className="text-sm font-bold text-white">{done === 'approved' ? '¡Servicio activado!' : '¡Solicitud enviada!'}</p>
        <p className="text-xs text-white/40 mt-1">{done === 'approved' ? 'Ya podés usarlo.' : 'Cuando se confirme el pago, se activa el servicio.'}</p>
        {done === 'approved' && (
          <button onClick={() => onPurchased?.()} className="mt-3 px-4 py-2 rounded-xl text-sm font-black text-black" style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}>Ir al panel</button>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Selector de período */}
      <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Elegí el plan</p>
      <div className="space-y-2 mb-4">
        {available.map(p => (
          <button key={p.key} onClick={() => setPeriod(p.key)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${period === p.key ? 'border-amber-500/60 bg-amber-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
            <span className="text-sm font-bold text-white">{p.label}</span>
            <span className="text-sm font-black text-amber-400">${(prices[p.key] as number).toFixed(2)} <span className="text-[10px] text-white/30 font-normal">USDT {p.hint}</span></span>
          </button>
        ))}
      </div>

      {error && <div className="mb-3 p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-2 text-red-400 text-xs"><AlertCircle size={14} className="shrink-0" /><p className="flex-1">{error}</p></div>}

      <div className="flex rounded-xl overflow-hidden border border-white/10 mb-4">
        <button onClick={() => setTab('usdt')} className={`flex-1 py-2 text-xs font-black uppercase ${tab === 'usdt' ? 'text-black' : 'text-white/40'}`} style={tab === 'usdt' ? { background: 'linear-gradient(135deg,#ca8a04,#facc15)' } : {}}>USDT</button>
        <button onClick={() => setTab('manual')} className={`flex-1 py-2 text-xs font-black uppercase ${tab === 'manual' ? 'text-white bg-white/10' : 'text-white/40'}`}>Comprobante</button>
      </div>

      {tab === 'usdt' ? (
        <CryptoPaymentGateway plan={`${serviceName} (${PERIOD_META.find(p => p.key === period)?.label})`} price={price} onSubmitTx={submitCrypto} onSuccess={(s) => setDone(s === 'approved' ? 'approved' : 'pending')} />
      ) : (
        <div className="space-y-3">
          <p className="text-[11px] text-white/40">Subí la captura de tu pago. El equipo lo verifica y activa el servicio.</p>
          {proofPreview ? (
            <div className="relative rounded-xl overflow-hidden border border-white/10">
              <img src={proofPreview} alt="" className="w-full max-h-44 object-cover" />
              <button onClick={() => { setProofFile(null); setProofPreview(null) }} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center"><X size={13} className="text-white" /></button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()} className="w-full py-6 rounded-xl border-2 border-dashed border-white/15 hover:border-amber-500/40 flex flex-col items-center gap-1 text-white/30"><Upload size={18} /> <span className="text-xs">Subir comprobante</span></button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0] || null; setProofFile(f); if (f) setProofPreview(URL.createObjectURL(f)) }} />
          <button onClick={submitManual} disabled={loading} className="w-full py-3 rounded-xl text-sm font-black text-black disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}>{loading ? <Loader2 size={15} className="animate-spin inline" /> : 'Enviar comprobante'}</button>
        </div>
      )}
    </div>
  )
}
