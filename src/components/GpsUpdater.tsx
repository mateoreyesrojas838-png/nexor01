'use client'

import { useEffect } from 'react'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

/** Silently updates GPS address on every dashboard visit */
export default function GpsUpdater() {
  useEffect(() => {
    if (!navigator.geolocation) return
    const deviceId = getCookie('device_id')
    if (!deviceId) return

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
          () => {},
          { enableHighAccuracy: false, maximumAge: 0, timeout: 15000 }
        )
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 8000 }
    )
  }, [])

  return null
}
