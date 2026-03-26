'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, CheckCircle2, AlertCircle, X, QrCode, Loader2 } from 'lucide-react'

interface PaymentGatewayProps {
  plan: string
  price: number
  onSubmitPayment?: (proofUrl: string) => Promise<'approved' | 'pending_verification'>
  onSuccess?: (status: 'approved' | 'pending_verification') => void
  onCancel?: () => void
}

export function PaymentGateway({
  plan,
  price,
  onSubmitPayment,
  onSuccess,
  onCancel,
}: PaymentGatewayProps) {
  const [step, setStep] = useState<'qr' | 'upload' | 'processing' | 'success' | 'error'>('qr')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        setQrUrl(d.settings?.PAYMENT_QR_URL || null)
        setQrLoading(false)
      })
      .catch(() => setQrLoading(false))
  }, [])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setProofFile(file)
    const reader = new FileReader()
    reader.onload = ev => setProofPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    setStep('upload')
  }

  const handleSubmit = async () => {
    if (!proofFile || !onSubmitPayment) return
    setStep('processing')
    try {
      const fd = new FormData()
      fd.append('file', proofFile)
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Error al subir comprobante')

      const status = await onSubmitPayment(uploadData.url)
      setStep('success')
      onSuccess?.(status)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al procesar el pago')
      setStep('error')
    }
  }

  if (step === 'success') return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.25)' }}>
        <CheckCircle2 size={30} style={{ color: '#FFD700' }} />
      </div>
      <div>
        <p className="text-sm font-black text-white uppercase tracking-widest">¡Solicitud enviada!</p>
        <p className="text-xs text-white/40 mt-1 leading-relaxed">
          Tu comprobante está siendo revisado.<br />Recibirás confirmación pronto.
        </p>
      </div>
    </div>
  )

  if (step === 'error') return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
        <AlertCircle size={30} className="text-red-400" />
      </div>
      <p className="text-xs text-red-400">{errorMsg}</p>
      <button onClick={() => setStep('qr')} className="text-xs text-white/40 hover:text-white transition-colors underline">
        Intentar de nuevo
      </button>
    </div>
  )

  return (
    <div className="space-y-5">

      {/* Plan summary */}
      <div className="flex items-center justify-between px-4 py-3 rounded-2xl"
        style={{ background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.15)' }}>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Plan seleccionado</p>
          <p className="text-sm font-black text-white">{plan}</p>
        </div>
        <p className="text-2xl font-black text-white">
          ${price} <span className="text-xs text-white/40">USD</span>
        </p>
      </div>

      {/* QR + upload */}
      {(step === 'qr' || step === 'upload') && (
        <>
          {/* QR section */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">
              Escanea y paga <span style={{ color: '#FFD700' }}>${price} USD</span>
            </p>
            <div className="flex justify-center">
              {qrLoading ? (
                <div className="w-44 h-44 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)' }}>
                  <Loader2 size={24} className="animate-spin text-white/20" />
                </div>
              ) : qrUrl ? (
                <div className="w-44 h-44 rounded-2xl overflow-hidden bg-white p-2">
                  <img src={qrUrl} alt="QR de pago" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-44 h-44 rounded-2xl flex flex-col items-center justify-center gap-2"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)' }}>
                  <QrCode size={32} className="text-white/15" />
                  <p className="text-[10px] text-white/20 text-center px-4">QR no configurado.<br />Contacta al administrador.</p>
                </div>
              )}
            </div>
          </div>

          <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

          {/* Upload proof */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">
              Sube tu comprobante de pago
            </p>

            {proofPreview ? (
              <div className="relative rounded-xl overflow-hidden mb-3"
                style={{ border: '1px solid rgba(255,215,0,0.2)' }}>
                <img src={proofPreview} alt="comprobante" className="w-full max-h-48 object-cover" />
                <button
                  onClick={() => { setProofFile(null); setProofPreview(null); setStep('qr') }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white"
                  style={{ background: 'rgba(0,0,0,0.7)' }}>
                  <X size={13} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full flex flex-col items-center gap-2 py-6 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,215,0,0.3)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
              >
                <Upload size={20} className="text-white/25" />
                <span className="text-xs text-white/30">Toca para subir imagen</span>
                <span className="text-[10px] text-white/15">PNG, JPG, JPEG</span>
              </button>
            )}

            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>

          {proofPreview && (
            <button
              onClick={handleSubmit}
              className="w-full py-3 rounded-xl text-sm font-black uppercase tracking-widest text-black transition-all active:scale-[0.98] hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #D97706, #F59E0B, #FFD700)' }}
            >
              Enviar comprobante
            </button>
          )}
        </>
      )}

      {step === 'processing' && (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="w-8 h-8 border-2 border-white/10 border-t-amber-400 rounded-full animate-spin" />
          <p className="text-xs text-white/40">Enviando solicitud...</p>
        </div>
      )}

      {onCancel && (
        <button onClick={onCancel} className="w-full text-xs text-white/25 hover:text-white/50 transition-colors py-1">
          Cancelar
        </button>
      )}
    </div>
  )
}
