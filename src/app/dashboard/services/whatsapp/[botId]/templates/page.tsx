'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Loader2, CheckCircle2, Clock, XCircle, RefreshCw, Sparkles } from 'lucide-react'

interface WaTemplate {
  id: string
  name: string
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'PAUSED' | string
  language: string
  category: string
  components: Array<{ type: string; text?: string; format?: string }>
}

const STATUS_LABEL: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  APPROVED: { label: 'Aprobado', color: 'text-green-400', icon: CheckCircle2 },
  PENDING:  { label: 'En revisión', color: 'text-amber-400', icon: Clock },
  REJECTED: { label: 'Rechazado', color: 'text-red-400', icon: XCircle },
  PAUSED:   { label: 'Pausado', color: 'text-white/40', icon: XCircle },
}

export default function WaTemplatesPage() {
  const { botId } = useParams<{ botId: string }>()
  const router = useRouter()

  const [templates, setTemplates] = useState<WaTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create form
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', bodyText: '', headerText: '', footerText: '', category: 'MARKETING', language: 'es' })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Delete
  const [deletingName, setDeletingName] = useState<string | null>(null)

  async function loadTemplates() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/bots/${botId}/wa-templates`)
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setTemplates(data.templates ?? [])
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTemplates() }, [botId])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaveError(null)
    setSaving(true)
    try {
      const res = await fetch(`/api/bots/${botId}/wa-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setSaveError(data.error); return }
      setShowForm(false)
      setForm({ name: '', bodyText: '', headerText: '', footerText: '', category: 'MARKETING', language: 'es' })
      await loadTemplates()
    } catch {
      setSaveError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(name: string) {
    if (!confirm(`¿Eliminar el template "${name}"? Esta acción no se puede deshacer.`)) return
    setDeletingName(name)
    try {
      await fetch(`/api/bots/${botId}/wa-templates?name=${encodeURIComponent(name)}`, { method: 'DELETE' })
      setTemplates(prev => prev.filter(t => t.name !== name))
    } finally {
      setDeletingName(null)
    }
  }

  function getBodyText(t: WaTemplate) {
    return t.components?.find(c => c.type === 'BODY')?.text ?? ''
  }
  function getHeaderText(t: WaTemplate) {
    return t.components?.find(c => c.type === 'HEADER')?.text ?? ''
  }

  return (
    <div className="px-4 sm:px-6 pt-6 max-w-screen-xl mx-auto pb-20 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/5 transition-colors">
          <ArrowLeft className="w-4 h-4 text-white/50" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-medium text-white tracking-widest uppercase">Templates de WhatsApp</h1>
          <p className="text-xs text-white/30 mt-0.5">Creá y gestioná tus plantillas aprobadas por Meta</p>
        </div>
        <button onClick={loadTemplates} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/5 transition-colors" title="Refrescar">
          <RefreshCw className={`w-4 h-4 text-white/40 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-black transition-all"
          style={{ background: 'linear-gradient(135deg, #FFD700, #FFB800)' }}
        >
          <Plus className="w-4 h-4" />
          Nuevo template
        </button>
      </div>

      <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, rgba(255,215,0,0.3), transparent)' }} />

      {/* Error de configuración */}
      {error?.includes('WABA ID') && (
        <div className="rounded-2xl p-5 border border-amber-500/20 bg-amber-500/5">
          <p className="text-sm text-amber-400 font-bold mb-1">WABA ID no configurado</p>
          <p className="text-xs text-white/40">Andá a <strong className="text-white/60">Servicios → WhatsApp → Credenciales</strong> y guardá el WhatsApp Business Account ID para poder usar templates.</p>
        </div>
      )}

      {/* Formulario de creación */}
      {showForm && (
        <div className="rounded-2xl p-6 border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-black uppercase tracking-widest text-amber-400">Nuevo template</h2>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/40 mb-1.5">Nombre <span className="text-white/20">(solo minúsculas y guiones bajos)</span></label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))}
                  placeholder="promocion_evento"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5">Categoría</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
                >
                  <option value="MARKETING">Marketing</option>
                  <option value="UTILITY">Utilidad</option>
                  <option value="AUTHENTICATION">Autenticación</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-white/40 mb-1.5">Encabezado <span className="text-white/20">(opcional)</span></label>
              <input
                value={form.headerText}
                onChange={e => setForm(f => ({ ...f, headerText: e.target.value }))}
                placeholder="Ej: 🎟️ Renzo Entradas"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-xs text-white/40 mb-1.5">
                Cuerpo del mensaje <span className="text-white/20">(podés usar {'{{1}}'}, {'{{2}}'} para variables)</span>
              </label>
              <textarea
                value={form.bodyText}
                onChange={e => setForm(f => ({ ...f, bodyText: e.target.value }))}
                placeholder="Ej: ¡Hola! 👋 Tenemos entradas disponibles para el próximo evento. ¿Te interesa?"
                required
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs text-white/40 mb-1.5">Pie de página <span className="text-white/20">(opcional)</span></label>
              <input
                value={form.footerText}
                onChange={e => setForm(f => ({ ...f, footerText: e.target.value }))}
                placeholder="Ej: Respondé STOP para no recibir más mensajes"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {saveError && <p className="text-xs text-red-400">{saveError}</p>}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => { setShowForm(false); setSaveError(null) }}
                className="flex-1 py-2.5 rounded-xl text-sm text-white/50 border border-white/10 hover:bg-white/5 transition-all">
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-black flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                style={{ background: 'linear-gradient(135deg, #FFD700, #FFB800)' }}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {saving ? 'Enviando a Meta...' : 'Enviar a revisión'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de templates */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
        </div>
      ) : error && !error.includes('WABA ID') ? (
        <div className="rounded-2xl p-5 border border-red-500/20 bg-red-500/5">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-2xl p-10 border border-white/5 bg-white/[0.02] flex flex-col items-center text-center">
          <Sparkles className="w-8 h-8 text-white/10 mb-3" />
          <p className="text-sm text-white/30">No tenés templates creados aún</p>
          <p className="text-xs text-white/20 mt-1">Creá uno arriba y Meta lo revisará en minutos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map(t => {
            const status = STATUS_LABEL[t.status] ?? { label: t.status, color: 'text-white/40', icon: Clock }
            const StatusIcon = status.icon
            const body = getBodyText(t)
            const header = getHeaderText(t)
            return (
              <div key={t.id} className="rounded-2xl p-5 border border-white/8 bg-white/[0.03] flex gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <code className="text-sm font-bold text-amber-400">{t.name}</code>
                    <span className={`flex items-center gap-1 text-xs font-bold ${status.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                    <span className="text-[10px] text-white/20 uppercase tracking-widest">{t.category}</span>
                    <span className="text-[10px] text-white/20">{t.language}</span>
                  </div>
                  {header && <p className="text-xs text-white/50 font-bold mb-1">{header}</p>}
                  {body && <p className="text-sm text-white/70 leading-relaxed">{body}</p>}
                </div>
                <button
                  onClick={() => handleDelete(t.name)}
                  disabled={deletingName === t.name}
                  className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all shrink-0 disabled:opacity-40"
                >
                  {deletingName === t.name ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
