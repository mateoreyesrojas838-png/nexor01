'use client'

import { useState, useEffect, useCallback } from 'react'
import { Shield, CheckCircle2, Loader2, RefreshCw } from 'lucide-react'

const STORAGE_KEY = 'jd_permissions_granted'

type PermState = 'idle' | 'loading' | 'granted' | 'denied'

interface PermStatus {
  geo: PermState
  notifications: PermState
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

/** Send GPS once to server (best-effort, non-blocking) */
function sendGpsOnce(deviceId: string) {
  if (!navigator.geolocation) return

  function post(pos: GeolocationPosition) {
    fetch('/api/auth/device-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude, deviceId }),
    }).catch(() => {})
  }

  // Try high-accuracy GPS first (mobile), fall back to network/WiFi (desktop)
  navigator.geolocation.getCurrentPosition(
    pos => post(pos),
    () => {
      navigator.geolocation.getCurrentPosition(
        pos => post(pos),
        () => {}, // give up silently
        { enableHighAccuracy: false, maximumAge: 0, timeout: 15000 }
      )
    },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 8000 }
  )
}

export default function PermissionsModal() {
  const [visible, setVisible] = useState(false)
  const [status, setStatus] = useState<PermStatus>({ geo: 'idle', notifications: 'idle' })
  const [requesting, setRequesting] = useState(false)
  const [anyDenied, setAnyDenied] = useState(false)

  useEffect(() => {
    // auth_token is HttpOnly — invisible to JS. We're inside /dashboard so
    // middleware already guarantees the user is authenticated.
    const alreadyGranted = localStorage.getItem(STORAGE_KEY) === '1'
    if (!alreadyGranted) setVisible(true)
  }, [])

  const allGranted = Object.values(status).every(s => s === 'granted')

  useEffect(() => {
    if (!allGranted) return
    localStorage.setItem(STORAGE_KEY, '1')

    // Send GPS once when permissions are first granted (device registration moment)
    const deviceId = getCookie('device_id')
    if (deviceId) sendGpsOnce(deviceId)

    setTimeout(() => setVisible(false), 800)
  }, [allGranted])

  const requestAll = useCallback(async () => {
    setRequesting(true)
    setAnyDenied(false)
    setStatus({ geo: 'loading', notifications: 'loading' })

    // --- Geolocation ---
    let geoOk = false
    try {
      if (!navigator.geolocation) throw new Error('not supported')

      // Use Permissions API first (instant, no GPS fix needed)
      let state: PermissionState = 'prompt'
      if (navigator.permissions) {
        const q = await navigator.permissions.query({ name: 'geolocation' })
        state = q.state
      }

      if (state === 'granted') {
        geoOk = true
      } else if (state === 'denied') {
        geoOk = false
      } else {
        // 'prompt' — trigger the browser dialog
        await new Promise<void>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve(),
            () => reject(),
            { timeout: 15000, maximumAge: Infinity }
          )
        })
        geoOk = true
      }
    } catch { geoOk = false }

    // --- Notifications ---
    let notifOk = false
    try {
      if (typeof Notification === 'undefined') {
        notifOk = true // iOS Safari — not supported, skip
      } else if (Notification.permission === 'granted') {
        notifOk = true
      } else if (Notification.permission === 'denied') {
        notifOk = false
      } else {
        const p = await Notification.requestPermission()
        notifOk = p === 'granted'
      }
    } catch { notifOk = false }

    setStatus({
      geo: geoOk ? 'granted' : 'denied',
      notifications: notifOk ? 'granted' : 'denied',
    })
    setAnyDenied(!geoOk || !notifOk)
    setRequesting(false)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: 'rgba(7,8,15,0.97)', backdropFilter: 'blur(12px)' }}>

      {/* Glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-purple-600/8 blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-amber-500/6 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-xs flex flex-col items-center text-center gap-6">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
            <img src="/logo.png" alt="JD" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-base font-black tracking-[0.18em] text-white uppercase">Nexor</h1>
        </div>

        {/* Message */}
        {allGranted ? (
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-green-400" />
            <p className="text-sm font-bold text-green-400">¡Todo listo! Entrando...</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <p className="text-sm font-black text-white">
                {anyDenied ? 'Permisos denegados' : 'Permisos obligatorios'}
              </p>
              <p className="text-[12px] text-white/35 leading-relaxed">
                {anyDenied
                  ? 'Debes activar los permisos en la configuración de tu navegador para poder acceder a la plataforma. Haz clic en el ícono 🔒 en la barra de direcciones → Permisos → Permitir todo → recarga la página.'
                  : 'Es obligatorio aceptar todos los permisos para acceder a la plataforma. Sin ellos no podrás continuar.'}
              </p>
              {!anyDenied && (
                <p className="text-[11px] text-yellow-400/70 font-bold">
                  ⚠ Estos permisos son requeridos por la plataforma. No es opcional.
                </p>
              )}
            </div>

            <button
              onClick={requestAll}
              disabled={requesting}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-black uppercase tracking-[0.12em] transition-all active:scale-[0.98] disabled:opacity-60"
              style={{
                background: anyDenied
                  ? 'linear-gradient(135deg, #7f1d1d, #581c87)'
                  : 'linear-gradient(135deg, #B45309, #D97706)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 8px 32px rgba(217,119,6,0.35)',
              }}
            >
              {requesting
                ? <><Loader2 size={16} className="animate-spin" /> Solicitando...</>
                : anyDenied
                ? <><RefreshCw size={15} /> Reintentar</>
                : <><Shield size={15} /> Dar permisos</>
              }
            </button>

          </>
        )}
      </div>
    </div>
  )
}
