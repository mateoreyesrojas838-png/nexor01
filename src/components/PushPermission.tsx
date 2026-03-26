'use client'

import { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'

const STORAGE_KEY = 'push_permission_asked'

export default function PushPermission() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Solo mostrar si el navegador soporta notificaciones y no se ha pedido antes
    if (typeof window === 'undefined') return
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return
    if (Notification.permission !== 'default') return
    if (localStorage.getItem(STORAGE_KEY)) return
    // Pequeño delay para no mostrarlo de inmediato al entrar
    const t = setTimeout(() => setShow(true), 1500)
    return () => clearTimeout(t)
  }, [])

  const allow = async () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setShow(false)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) return

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
      })
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      })
    } catch { /* silently ignore */ }
  }

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
      <div className="rounded-2xl p-4 flex items-start gap-3 shadow-2xl shadow-black/60"
        style={{ background: '#161620', border: '1px solid rgba(255,215,0,0.15)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)' }}>
          <Bell size={16} style={{ color: '#FFD700' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-white mb-0.5">Activar notificaciones</p>
          <p className="text-[11px] text-white/40 leading-relaxed">
            Recibe alertas cuando tu plan sea aprobado o haya novedades.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={allow}
              className="px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider text-black transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #D97706, #FFD700)' }}
            >
              Activar
            </button>
            <button
              onClick={dismiss}
              className="px-4 py-1.5 rounded-lg text-[11px] font-semibold text-white/40 hover:text-white/70 transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              Ahora no
            </button>
          </div>
        </div>
        <button onClick={dismiss} className="text-white/20 hover:text-white/50 transition-colors shrink-0">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const arr = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    arr[i] = rawData.charCodeAt(i)
  }
  return arr
}
