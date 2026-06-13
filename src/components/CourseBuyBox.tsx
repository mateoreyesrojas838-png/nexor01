'use client'

import { useState, useRef } from 'react'
import { CryptoPaymentGateway } from '@/components/CryptoPaymentGateway'
import { Upload, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface CourseBuyBoxProps {
  courseId: string
  courseTitle: string
  price: number
  onPurchased?: () => void
}

export function CourseBuyBox({ courseId, courseTitle, price, onPurchased }: CourseBuyBoxProps) {
  const [tab, setTab] = useState<'usdt' | 'manual'>('usdt')
  const fileRef = useRef<HTMLInputElement>(null)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<null | 'approved' | 'pending'>(null)

  async function submitCrypto(txHash: string): Promise<'approved' | 'pending_verification'> {
    const res = await fetch(`/api/courses/${courseId}/enroll`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethod: 'CRYPTO', txHash }),
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
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proofUrl: upData.url }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al enviar'); return }
      setDone('pending')
    } catch { setError('Error de conexión') }
    finally { setLoading(false) }
  }

  if (done) {
    return (
      <div className="text-center py-2">
        <CheckCircle2 size={28} className="mx-auto text-green-400 mb-2" />
        <p className="text-sm font-bold text-white">{done === 'approved' ? '¡Curso desbloqueado!' : '¡Solicitud enviada!'}</p>
        <p className="text-xs text-white/40 mt-1">
          {done === 'approved' ? 'Ya podés ver el contenido.' : 'En cuanto se confirme el pago, se desbloquea el curso.'}
        </p>
        {done === 'approved' && (
          <button onClick={() => onPurchased?.()} className="mt-3 px-4 py-2 rounded-xl text-sm font-black text-black" style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}>
            Entrar al curso
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      <p className="text-3xl font-black text-white">${price.toFixed(2)} <span className="text-sm text-white/30 font-normal">USDT</span></p>
      <p className="text-xs text-white/40 mt-1 mb-4">Acceso de por vida al curso.</p>

      {error && <div className="mb-3 p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-2 text-red-400 text-xs"><AlertCircle size={14} className="shrink-0" /><p className="flex-1">{error}</p></div>}

      <div className="flex rounded-xl overflow-hidden border border-white/10 mb-4">
        <button onClick={() => setTab('usdt')} className={`flex-1 py-2 text-xs font-black uppercase ${tab === 'usdt' ? 'text-black' : 'text-white/40'}`} style={tab === 'usdt' ? { background: 'linear-gradient(135deg,#ca8a04,#facc15)' } : {}}>USDT</button>
        <button onClick={() => setTab('manual')} className={`flex-1 py-2 text-xs font-black uppercase ${tab === 'manual' ? 'text-white bg-white/10' : 'text-white/40'}`}>Comprobante</button>
      </div>

      {tab === 'usdt' ? (
        <CryptoPaymentGateway
          plan={courseTitle}
          price={price}
          onSubmitTx={submitCrypto}
          onSuccess={(status) => { setDone(status === 'approved' ? 'approved' : 'pending') }}
        />
      ) : (
        <div className="space-y-3">
          <p className="text-[11px] text-white/40">Subí la captura de tu pago. El equipo lo verifica y desbloquea el curso.</p>
          {proofPreview ? (
            <div className="relative rounded-xl overflow-hidden border border-white/10">
              <img src={proofPreview} alt="" className="w-full max-h-44 object-cover" />
              <button onClick={() => { setProofFile(null); setProofPreview(null) }} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center"><X size={13} className="text-white" /></button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()} className="w-full py-6 rounded-xl border-2 border-dashed border-white/15 hover:border-amber-500/40 flex flex-col items-center gap-1 text-white/30">
              <Upload size={18} /> <span className="text-xs">Subir comprobante</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0] || null; setProofFile(f); if (f) setProofPreview(URL.createObjectURL(f)) }} />
          <button onClick={submitManual} disabled={loading} className="w-full py-3 rounded-xl text-sm font-black text-black disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}>
            {loading ? <Loader2 size={15} className="animate-spin inline" /> : 'Enviar comprobante'}
          </button>
        </div>
      )}
    </div>
  )
}
