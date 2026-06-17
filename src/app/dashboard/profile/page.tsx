'use client'

import { useState, useEffect } from 'react'
import { User, Mail, MapPin, Calendar, FileText, Shield, UserCircle, Cake, Gift, Layers, Coins } from 'lucide-react'

interface UserProfile {
  fullName: string
  username: string
  email: string
  country: string
  city: string
  identityDocument: string
  dateOfBirth: string
  referralCode: string
  isActive: boolean
  createdAt: string
  plan: string
  planExpiresAt: string | null
  aiCreditsUsd: number
}

const PLAN_LABEL: Record<string, string> = { NONE: 'Sin plan', BASIC: 'Pack Básico', PRO: 'Pack Pro', ELITE: 'Pack Elite' }

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.id) setUser(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-2 rounded-full animate-spin"
          style={{ borderColor: 'rgba(255,215,0,0.2)', borderTopColor: '#FFD700' }} />
      </div>
    )
  }

  if (!user) return null

  const planValue = PLAN_LABEL[user.plan] || user.plan
    + (user.planExpiresAt ? ` · vence ${new Date(user.planExpiresAt).toLocaleDateString()}` : '')

  const fields = [
    { icon: User,     label: 'Usuario',            value: `@${user.username}`,         color: '#FFD700' },
    { icon: Mail,     label: 'Correo Electrónico',  value: user.email || '-',           color: '#FF2DF7' },
    { icon: MapPin,   label: 'Ubicación',           value: user.city && user.country ? `${user.city}, ${user.country}` : (user.country || 'No especificada'), color: '#FFB800' },
    { icon: Shield,   label: 'Documento de Identidad', value: user.identityDocument || '-', color: '#B45309' },
    { icon: Cake,     label: 'Fecha de Nacimiento', value: user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : '-', color: '#FF8FB1' },
    { icon: Gift,     label: 'Código de Referido',  value: user.referralCode || '-',    color: '#22d3ee' },
    { icon: Layers,   label: 'Plan',                value: planValue,                   color: '#FFD700' },
    { icon: Coins,    label: 'Créditos AI',         value: `$${(user.aiCreditsUsd ?? 0).toFixed(2)}`, color: '#00FF88' },
    { icon: Calendar, label: 'Miembro desde',       value: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-', color: '#00FF88' },
  ]

  return (
    <div className="px-4 sm:px-6 pt-6 max-w-screen-xl mx-auto pb-20 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)' }}>
          <User className="w-5 h-5" style={{ color: '#FFD700' }} />
        </div>
        <div>
          <h1 className="text-xl font-medium text-white tracking-widest uppercase">Mi Perfil</h1>
          <p className="text-xs font-light tracking-widest mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Gestiona tu información personal</p>
        </div>
      </div>

      {/* Línea decorativa */}
      <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, rgba(255,215,0,0.3), rgba(255,45,247,0.2), transparent)' }} />

      <div className="grid md:grid-cols-3 gap-6">

        {/* Card de perfil */}
        <div className="md:col-span-1 relative rounded-2xl p-6 flex flex-col items-center text-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,215,0,0.06), rgba(123,0,255,0.04))',
            border: '1px solid rgba(255,215,0,0.12)',
            boxShadow: '0 0 40px rgba(255,215,0,0.05)'
          }}>
          {/* Barra neon superior */}
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, #FFD70060, #FF2DF740, transparent)' }} />
          {/* Orbe decorativo */}
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl opacity-20"
            style={{ background: 'radial-gradient(circle, #B45309, transparent)' }} />

          {/* Avatar */}
          <div className="relative mb-4 mt-2">
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: '#050314', border: '2px solid rgba(255,215,0,0.25)', boxShadow: '0 0 20px rgba(255,215,0,0.1)' }}>
              <UserCircle className="w-14 h-14" style={{ color: 'rgba(255,255,255,0.1)' }} />
            </div>
            <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full border-2 border-[#03010E]"
              style={{ background: user.isActive ? '#00FF88' : '#ef4444', boxShadow: user.isActive ? '0 0 8px #00FF88' : 'none' }} />
          </div>

          <h2 className="text-base font-medium text-white uppercase tracking-widest mb-1">{user.fullName}</h2>
          <p className="text-xs font-light tracking-[0.3em] uppercase mb-5" style={{ color: '#FFD700' }}>@{user.username}</p>

          <div className="w-full py-2.5 px-4 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.25)' }}>Estado de Cuenta</p>
            <p className="text-sm font-black uppercase tracking-widest"
              style={{ color: user.isActive ? '#00FF88' : '#ef4444' }}>
              {user.isActive ? 'Activo' : 'Inactivo'}
            </p>
          </div>
        </div>

        {/* Detalles */}
        <div className="md:col-span-2 relative rounded-2xl p-6 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,45,247,0.04), rgba(255,215,0,0.03))',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, #FF2DF740, #FFD70030, transparent)' }} />

          <div className="flex items-center gap-2 mb-6">
            <FileText className="w-4 h-4" style={{ color: '#FF2DF7' }} />
            <h3 className="text-sm font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Detalles de la Cuenta
            </h3>
          </div>

          <div className="grid gap-3">
            {fields.map((field, i) => (
              <div key={i} className="flex items-center gap-4 p-3.5 rounded-xl transition-all duration-300 group"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.04)' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = `${field.color}30`)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)')}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${field.color}12`, border: `1px solid ${field.color}25` }}>
                  <field.icon className="w-4 h-4" style={{ color: field.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{field.label}</p>
                  <p className="text-sm font-light text-white truncate">{field.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
