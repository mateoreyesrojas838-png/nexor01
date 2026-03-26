'use client'

import { useState } from 'react'
import { Bell, Send, Users, User, CheckCircle2, AlertCircle, Loader2, Search } from 'lucide-react'

type Target = 'all' | 'user'

interface SendResult {
  sent: number
  failed: number
  total: number
  message?: string
}

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [link, setLink] = useState('')
  const [target, setTarget] = useState<Target>('all')
  const [userSearch, setUserSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<{ id: string; username: string; fullName: string } | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<{ id: string; username: string; fullName: string }[]>([])
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<SendResult | null>(null)
  const [error, setError] = useState('')

  async function searchUsers(q: string) {
    if (!q.trim()) { setSearchResults([]); return }
    setSearching(true)
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setSearchResults((data.users ?? []).slice(0, 5))
    setSearching(false)
  }

  async function handleSend() {
    setError('')
    setResult(null)

    if (!title.trim() || !body.trim()) {
      setError('Título y mensaje son requeridos')
      return
    }
    if (target === 'user' && !selectedUser) {
      setError('Selecciona un usuario')
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/admin/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          link: link.trim() || undefined,
          userId: target === 'user' ? selectedUser?.id : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al enviar')
      } else {
        setResult(data)
        setTitle('')
        setBody('')
        setLink('')
        setSelectedUser(null)
        setUserSearch('')
        setSearchResults([])
      }
    } catch {
      setError('Error de red')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
          <Bell size={18} className="text-white/50" /> Notificaciones Push
        </h1>
        <p className="text-xs text-white/30 mt-0.5">Envía notificaciones a tus usuarios en tiempo real.</p>
      </div>

      {/* Result banner */}
      {result && (
        <div className="flex items-start gap-3 bg-green-500/10 border border-green-500/20 rounded-2xl px-4 py-3">
          <CheckCircle2 size={16} className="text-green-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-green-400">¡Notificación enviada!</p>
            {result.message ? (
              <p className="text-xs text-white/40 mt-0.5">{result.message}</p>
            ) : (
              <p className="text-xs text-white/40 mt-0.5">
                {result.sent} enviados · {result.failed} fallidos · {result.total} total
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">
          <AlertCircle size={14} className="text-red-400 shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Form */}
      <div className="bg-white/[0.025] border border-white/8 rounded-2xl p-5 space-y-4">

        {/* Target selector */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Destinatario</p>
          <div className="flex gap-2">
            <button
              onClick={() => { setTarget('all'); setSelectedUser(null); setUserSearch(''); setSearchResults([]) }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                target === 'all'
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                  : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'
              }`}
            >
              <Users size={12} /> Todos los usuarios
            </button>
            <button
              onClick={() => setTarget('user')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                target === 'user'
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                  : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'
              }`}
            >
              <User size={12} /> Usuario específico
            </button>
          </div>
        </div>

        {/* User search */}
        {target === 'user' && (
          <div className="relative">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Buscar usuario</p>
            {selectedUser ? (
              <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2">
                <div>
                  <p className="text-xs font-bold text-amber-400">{selectedUser.fullName}</p>
                  <p className="text-[10px] text-white/30">@{selectedUser.username}</p>
                </div>
                <button
                  onClick={() => { setSelectedUser(null); setUserSearch(''); setSearchResults([]) }}
                  className="text-[10px] text-white/30 hover:text-white/60"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                  <input
                    type="text"
                    placeholder="Busca por nombre o usuario..."
                    value={userSearch}
                    onChange={e => { setUserSearch(e.target.value); searchUsers(e.target.value) }}
                    className="w-full bg-black/30 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder:text-white/20 outline-none focus:border-amber-500/40"
                  />
                  {searching && <Loader2 size={12} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-white/25" />}
                </div>
                {searchResults.length > 0 && (
                  <div className="absolute z-10 left-0 right-0 mt-1 bg-[#0d0d15] border border-white/10 rounded-xl overflow-hidden shadow-xl">
                    {searchResults.map(u => (
                      <button
                        key={u.id}
                        onClick={() => { setSelectedUser(u); setSearchResults([]); setUserSearch('') }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 text-left transition-colors"
                      >
                        <div className="w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-[10px] font-black text-amber-400 shrink-0">
                          {u.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{u.fullName}</p>
                          <p className="text-[10px] text-white/30">@{u.username}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-2">
            Título <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="ej. ¡Tu plan está activo!"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={80}
            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-amber-500/40"
          />
          <p className="text-[10px] text-white/20 mt-1 text-right">{title.length}/80</p>
        </div>

        {/* Body */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-2">
            Mensaje <span className="text-red-400">*</span>
          </label>
          <textarea
            placeholder="ej. Tu solicitud fue aprobada. ¡Ya puedes usar tus bots!"
            value={body}
            onChange={e => setBody(e.target.value)}
            maxLength={200}
            rows={3}
            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-amber-500/40 resize-none"
          />
          <p className="text-[10px] text-white/20 mt-1 text-right">{body.length}/200</p>
        </div>

        {/* Link */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-2">
            Link al hacer clic <span className="text-white/20">(opcional)</span>
          </label>
          <input
            type="text"
            placeholder="/dashboard  ó  /dashboard/planes"
            value={link}
            onChange={e => setLink(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-amber-500/40"
          />
        </div>

        {/* Preview */}
        {(title || body) && (
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-2">Vista previa</p>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/25 flex items-center justify-center shrink-0">
                <Bell size={14} className="text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">{title || '(sin título)'}</p>
                <p className="text-[11px] text-white/40 mt-0.5 leading-relaxed">{body || '(sin mensaje)'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={sending}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-black transition-all active:scale-[0.98] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #B45309, #D97706, #FFD700)' }}
        >
          {sending ? (
            <><Loader2 size={15} className="animate-spin" /> Enviando...</>
          ) : (
            <><Send size={15} /> {target === 'all' ? 'Enviar a todos' : 'Enviar al usuario'}</>
          )}
        </button>
      </div>

      {/* Info */}
      <div className="bg-white/[0.02] border border-white/6 rounded-2xl p-4">
        <p className="text-[11px] text-white/30 leading-relaxed">
          <strong className="text-white/50">Requisito:</strong> El usuario debe haber aceptado las notificaciones push desde su navegador. Las suscripciones expiradas se eliminan automáticamente al enviar.
        </p>
      </div>
    </div>
  )
}
