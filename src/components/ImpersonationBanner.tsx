'use client'

import { useState, useEffect } from 'react'
import { Eye, LogOut, Loader2 } from 'lucide-react'

/**
 * Barra fija que aparece cuando un admin está viendo el panel "como" un usuario.
 * Permite volver a la sesión de admin.
 */
export function ImpersonationBanner() {
  const [info, setInfo] = useState<{ username: string; fullName?: string } | null>(null)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.impersonating) setInfo({ username: d.username, fullName: d.fullName })
    }).catch(() => {})
  }, [])

  async function stop() {
    setLeaving(true)
    try {
      await fetch('/api/admin/impersonate/stop', { method: 'POST' })
      window.location.href = '/admin/users'
    } catch { setLeaving(false) }
  }

  if (!info) return null

  return (
    <div className="fixed top-0 inset-x-0 z-[100] flex items-center justify-center gap-3 px-4 py-2 text-sm font-bold text-black"
      style={{ background: 'linear-gradient(135deg,#F59E0B,#FFD700)', boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
      <Eye size={15} />
      <span className="truncate">Viendo como <strong>{info.fullName || info.username}</strong></span>
      <button onClick={stop} disabled={leaving} className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/85 text-amber-300 hover:bg-black transition-colors disabled:opacity-60">
        {leaving ? <Loader2 size={13} className="animate-spin" /> : <LogOut size={13} />} Volver a admin
      </button>
    </div>
  )
}
