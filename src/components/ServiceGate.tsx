'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Loader2, Lock, ArrowRight } from 'lucide-react'

/**
 * Bloquea el acceso directo a la página de un servicio si el usuario no tiene acceso
 * (servicio inactivo, o sin plan/suscripción vigente). Fail-open ante error de red.
 */
export function ServiceGate({ serviceKey, children }: { serviceKey: string; children: React.ReactNode }) {
  const [state, setState] = useState<'loading' | 'ok' | 'denied'>(serviceKey ? 'loading' : 'ok')
  const [svc, setSvc] = useState<any>(null)

  useEffect(() => {
    if (!serviceKey) { setState('ok'); return }
    let cancel = false
    fetch('/api/services').then(r => r.ok ? r.json() : null).then(d => {
      if (cancel) return
      if (!d?.services) { setState('ok'); return } // fail-open
      const s = d.services.find((x: any) => x.key === serviceKey)
      if (!s) { setState('denied'); setSvc(null); return } // inactivo/desconocido
      if (s.hasAccess) { setState('ok'); return }
      setSvc(s); setState('denied')
    }).catch(() => { if (!cancel) setState('ok') }) // fail-open
    return () => { cancel = true }
  }, [serviceKey])

  if (state === 'loading') {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-amber-400" size={28} /></div>
  }

  if (state === 'denied') {
    const buyHref = svc?.sellSeparately ? `/servicios/${svc.slug}` : '/dashboard/planes'
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center rounded-3xl border border-white/10 bg-white/[0.03] p-8">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mx-auto mb-4">
            <Lock size={24} className="text-amber-400" />
          </div>
          <p className="text-lg font-black text-white">Necesitás activar este servicio</p>
          <p className="text-sm text-white/40 mt-2 mb-5">{svc ? 'Comprá el acceso o activá un plan que lo incluya.' : 'Este servicio no está disponible en este momento.'}</p>
          {svc && (
            <Link href={buyHref} className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-black text-black" style={{ background: 'linear-gradient(135deg,#B45309,#D97706,#FFD700)' }}>
              {svc.sellSeparately ? 'Ver / Comprar' : 'Ver planes'} <ArrowRight size={15} />
            </Link>
          )}
          <Link href="/dashboard" className="block mt-3 text-xs text-white/40 hover:text-white/70">Volver al inicio</Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
