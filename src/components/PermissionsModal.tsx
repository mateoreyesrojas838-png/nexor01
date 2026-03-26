'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, CheckCircle2, Loader2 } from 'lucide-react'

const STORAGE_KEY = 'jd_permissions_granted'

export default function PermissionsModal() {
  const [visible, setVisible] = useState(false)
  const [granted, setGranted] = useState(false)
  const [denied, setDenied] = useState(false)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === '1') return
    // Already granted in browser → skip modal
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      localStorage.setItem(STORAGE_KEY, '1')
      return
    }
    setVisible(true)
  }, [])

  useEffect(() => {
    if (!granted) return
    localStorage.setItem(STORAGE_KEY, '1')
    setTimeout(() => setVisible(false), 700)
  }, [granted])

  const requestPermission = useCallback(async () => {
    setRequesting(true)
    setDenied(false)
    try {
      if (typeof Notification === 'undefined') {
        // iOS Safari — not supported, let them in
        setGranted(true)
      } else if (Notification.permission === 'granted') {
        setGranted(true)
      } else if (Notification.permission === 'denied') {
        setDenied(true)
      } else {
        const p = await Notification.requestPermission()
        if (p === 'granted') setGranted(true)
        else setDenied(true)
      }
    } catch {
      setGranted(true) // if API not available, let them in
    } finally {
      setRequesting(false)
    }
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(7,8,15,0.97)', backdropFilter: 'blur(12px)' }}>

      {/* Glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] rounded-full bg-amber-500/8 blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] rounded-full bg-amber-500/5 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-xs flex flex-col items-center text-center gap-6">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
            <img src="/logo.png" alt="Nexor" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-base font-black tracking-[0.18em] text-white uppercase">Nexor</h1>
        </div>

        {granted ? (
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-green-400" />
            <p className="text-sm font-bold text-green-400">¡Todo listo! Entrando...</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <p className="text-sm font-black text-white">
                {denied ? 'Notificaciones bloqueadas' : 'Activa las notificaciones'}
              </p>
              <p className="text-[12px] text-white/35 leading-relaxed">
                {denied
                  ? 'Haz clic en el ícono 🔒 en la barra de tu navegador → Notificaciones → Permitir → recarga la página.'
                  : 'Necesitamos tu permiso para enviarte alertas de ventas y mensajes importantes en tiempo real.'}
              </p>
            </div>

            <button
              onClick={requestPermission}
              disabled={requesting}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-black uppercase tracking-[0.12em] transition-all active:scale-[0.98] disabled:opacity-60"
              style={{
                background: denied
                  ? 'linear-gradient(135deg, #7f1d1d, #581c87)'
                  : 'linear-gradient(135deg, #B45309, #D97706)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 8px 32px rgba(217,119,6,0.35)',
              }}
            >
              {requesting
                ? <><Loader2 size={16} className="animate-spin" /> Solicitando...</>
                : <><Bell size={15} /> Activar notificaciones</>
              }
            </button>

            <button
              onClick={() => { localStorage.setItem(STORAGE_KEY, '1'); setVisible(false) }}
              className="text-[11px] text-white/20 hover:text-white/40 transition-colors"
            >
              Omitir por ahora
            </button>
          </>
        )}
      </div>
    </div>
  )
}
