'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import NotificationBell from '@/components/NotificationBell'
import PushPermission from '@/components/PushPermission'

interface User {
  fullName: string
  username: string
  avatarUrl?: string | null
  plan: string
}

const PLAN_COLORS: Record<string, string> = {
  ELITE: '#F59E0B',
  PRO:   '#A78BFA',
  BASIC: '#34D399',
  NONE:  '#6B7280',
}

const services = [
  {
    href: '/dashboard/services/whatsapp',
    icon: 'fa-solid fa-robot',
    title: 'Agentes AI',
    sub: 'WhatsApp · Ventas automáticas',
    description: 'Bots con IA que atienden clientes, responden preguntas y cierran ventas las 24 h.',
    color: '#F59E0B',
    glow: 'rgba(245,158,11,0.12)',
  },
  {
    href: '/dashboard/services/social',
    icon: 'fa-solid fa-satellite-dish',
    title: 'Publisher',
    sub: 'Redes sociales · Programación',
    description: 'Programa y publica contenido en Facebook, Instagram, TikTok y YouTube.',
    color: '#818CF8',
    glow: 'rgba(129,140,248,0.12)',
  },
  {
    href: '/dashboard/services/ads',
    icon: 'fa-solid fa-chart-line',
    title: 'Ads Manager',
    sub: 'Meta Ads · IA',
    description: 'Crea y lanza campañas publicitarias en Facebook e Instagram impulsadas por IA.',
    color: '#34D399',
    glow: 'rgba(52,211,153,0.12)',
  },
]

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => { if (r.status === 401) { router.push('/login'); return null } return r.json() })
      .then(json => { if (json?.id) setUser({ fullName: json.fullName, username: json.username, avatarUrl: json.avatarUrl, plan: json.plan }) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [router])

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !user) return
    setUploading(true)
    const fd = new FormData(); fd.append('file', file)
    try {
      const res = await fetch('/api/users/avatar', { method: 'POST', body: fd })
      const json = await res.json()
      if (res.ok) setUser(prev => prev ? { ...prev, avatarUrl: json.avatarUrl } : prev)
    } catch { /**/ } finally {
      setUploading(false); if (fileRef.current) fileRef.current.value = ''
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B0B12' }}>
      <div className="w-9 h-9 border-2 border-white/10 border-t-amber-400/60 rounded-full animate-spin" />
    </div>
  )

  const planColor = PLAN_COLORS[user?.plan || 'NONE'] || '#6B7280'
  const firstName = user?.fullName?.split(' ')[0] || 'Usuario'

  return (
    <div className="min-h-screen px-4 py-7 md:px-10 md:py-9" style={{ background: '#0B0B12' }}>
      <PushPermission />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">

        {/* Avatar + name */}
        <div className="flex items-center gap-3.5">
          <div className="relative cursor-pointer group shrink-0" onClick={() => fileRef.current?.click()}>
            <div className="w-12 h-12 md:w-13 md:h-13 rounded-2xl overflow-hidden border border-white/10 group-hover:border-amber-500/40 transition-all flex items-center justify-center"
              style={{ background: 'rgba(245,158,11,0.1)' }}>
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                : <i className="fa-solid fa-user text-amber-400/60 text-lg" />
              }
            </div>
            {uploading && (
              <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/60">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            )}
            {/* edit hint */}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 border-2 border-[#0B0B12] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <i className="fa-solid fa-pen text-[8px] text-black" />
            </div>
          </div>
          <div>
            <h1 className="text-base md:text-lg font-black text-white leading-tight">
              Hola, {firstName} 👋
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-white/30">@{user?.username}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${planColor}18`, color: planColor, border: `1px solid ${planColor}35` }}>
                {user?.plan || 'NONE'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Link href="/dashboard/planes"
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-black transition-all hover:opacity-90 active:scale-[0.97]"
            style={{ background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}>
            Mejorar plan
            <i className="fa-solid fa-arrow-right text-xs" />
          </Link>
          {/* mobile upgrade — compact */}
          <Link href="/dashboard/planes"
            className="sm:hidden w-9 h-9 flex items-center justify-center rounded-xl text-amber-400 border border-amber-500/30 bg-amber-500/10 transition-all hover:bg-amber-500/20"
            title="Mejorar plan">
            <i className="fa-solid fa-crown text-sm" />
          </Link>
          <button
            onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/login' }}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all active:scale-95"
            title="Cerrar sesión">
            <i className="fa-solid fa-right-from-bracket text-sm" />
          </button>
        </div>
      </div>

      {/* ── QUICK STATS ────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Plan activo', value: user?.plan || 'NONE', icon: 'fa-solid fa-star', color: planColor },
          { label: 'Servicios', value: '3', icon: 'fa-solid fa-briefcase', color: '#F59E0B' },
          { label: 'Estado', value: 'Activo', icon: 'fa-solid fa-circle-check', color: '#34D399' },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl p-3.5 md:p-4 border border-white/6 flex flex-col gap-2"
            style={{ background: 'rgba(255,255,255,0.025)' }}>
            <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}25` }}>
              <i className={`${stat.icon} text-xs`} style={{ color: stat.color }} />
            </div>
            <div>
              <p className="text-sm md:text-base font-black text-white leading-none">{stat.value}</p>
              <p className="text-[10px] text-white/25 mt-0.5 uppercase tracking-widest">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── SERVICES ───────────────────────────────────────────── */}
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-4">Servicios</p>
      <div className="grid md:grid-cols-3 gap-4">
        {services.map(svc => (
          <Link key={svc.href} href={svc.href}
            className="group relative overflow-hidden block rounded-3xl border border-white/6 hover:border-white/14 transition-all duration-300 active:scale-[0.98]"
            style={{ background: 'rgba(255,255,255,0.025)' }}>

            {/* Glow blob */}
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: svc.glow }} />

            <div className="relative p-5 md:p-6">
              {/* Icon + badge row */}
              <div className="flex items-start justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: `${svc.color}18`, border: `1px solid ${svc.color}30` }}>
                  <i className={`${svc.icon} text-xl`} style={{ color: svc.color }} />
                </div>
                <span className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide"
                  style={{ color: svc.color, borderColor: `${svc.color}35`, background: `${svc.color}12`, border: `1px solid ${svc.color}30` }}>
                  Activo
                </span>
              </div>

              {/* Text */}
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: `${svc.color}99` }}>{svc.sub}</p>
              <h3 className="text-base font-black text-white mb-2 group-hover:text-white transition-colors">{svc.title}</h3>
              <p className="text-xs text-white/35 leading-relaxed">{svc.description}</p>

              {/* CTA */}
              <div className="mt-5 flex items-center gap-2 text-xs font-bold transition-all"
                style={{ color: svc.color }}>
                Abrir
                <i className="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── BOTTOM SPACER FOR MOBILE NAV ───────────────────────── */}
      <div className="h-8 lg:hidden" />
    </div>
  )
}
