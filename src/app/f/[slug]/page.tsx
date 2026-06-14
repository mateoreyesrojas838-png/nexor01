'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, AlertCircle, CheckCircle2, Upload, Star, Send } from 'lucide-react'

export default function PublicFormPage() {
  const { slug } = useParams() as { slug: string }
  const [form, setForm] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/forms/${slug}`).then(async r => {
      const d = await r.json()
      if (!r.ok) { setLoadError(d.error || 'No disponible'); return }
      setForm(d.form)
    }).catch(() => setLoadError('Error al cargar')).finally(() => setLoading(false))
  }, [slug])

  function setAnswer(id: string, v: any) { setAnswers(a => ({ ...a, [id]: v })) }
  function toggleCheck(id: string, opt: string) {
    setAnswers(a => {
      const arr: string[] = Array.isArray(a[id]) ? a[id] : []
      return { ...a, [id]: arr.includes(opt) ? arr.filter(x => x !== opt) : [...arr, opt] }
    })
  }

  async function uploadFile(id: string, file: File | null) {
    if (!file) return
    setUploading(id); setError(null)
    try {
      const fd = new FormData(); fd.append('file', file)
      const r = await fetch(`/api/forms/${slug}/upload`, { method: 'POST', body: fd })
      const d = await r.json()
      if (!r.ok) { setError(d.error || 'Error al subir'); return }
      setAnswer(id, d.url)
    } catch { setError('Error al subir el archivo') } finally { setUploading(null) }
  }

  // Normaliza un destino de redirección. Devuelve una URL navegable o null si no
  // parece una URL (así un texto suelto como "INF." no rompe la navegación).
  function resolveRedirect(raw?: string): string | null {
    const dest = (raw || '').trim()
    if (!dest) return null
    if (/^https?:\/\//i.test(dest)) return dest          // ya es absoluta
    if (dest.startsWith('/')) return dest                 // ruta interna
    if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/.*)?$/i.test(dest)) return 'https://' + dest // dominio sin protocolo
    return null                                           // texto que no es URL → no redirigir
  }

  async function doSubmit(redirectTo?: string) {
    setError(null)
    for (const f of form.fields) {
      if (f.type === 'heading' || f.type === 'button' || !f.required) continue
      const v = answers[f.id]
      if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) { setError(`Falta responder: "${f.label}"`); return }
    }
    setSubmitting(true)
    try {
      const r = await fetch(`/api/forms/${slug}/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers }) })
      const d = await r.json()
      if (!r.ok) { setError(d.error || 'Error al enviar'); return }
      const dest = resolveRedirect(redirectTo || form.redirectUrl)
      if (dest) { window.location.href = dest; return }
      setDone(d.thankYouMsg || '¡Gracias por tu respuesta!')
    } catch { setError('Error de conexión') } finally { setSubmitting(false) }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B0B12' }}><Loader2 className="animate-spin text-amber-400" size={30} /></div>

  if (loadError) return (
    <div className="min-h-screen flex items-center justify-center px-4 text-center" style={{ background: '#0B0B12' }}>
      <div className="text-white/50"><AlertCircle size={36} className="mx-auto mb-3 text-white/20" /><p>{loadError}</p></div>
    </div>
  )

  const colors: string[] = Array.isArray(form.themeColors) && form.themeColors.length ? form.themeColors : [form.themeColor || '#F59E0B']
  const color = colors[0]
  const gradient = colors.length > 1 ? `linear-gradient(135deg, ${colors.join(', ')})` : color
  const btnColor = form.buttonColor || color

  if (done) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0B0B12' }}>
      <div className="max-w-md w-full text-center rounded-3xl border border-white/10 bg-white/[0.03] p-10">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: `${color}22`, border: `1px solid ${color}55` }}>
          <CheckCircle2 size={30} style={{ color }} />
        </div>
        <p className="text-lg font-black text-white">{done}</p>
        <p className="text-white/40 text-sm mt-2">Tu respuesta fue registrada.</p>
      </div>
    </div>
  )

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none'

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: '#0B0B12' }}>
      <div className="max-w-2xl mx-auto">
        {/* Cabecera */}
        <div className="rounded-3xl overflow-hidden border border-white/10 mb-5" style={{ background: 'rgba(255,255,255,0.03)' }}>
          {form.headerVideoUrl ? (
            <video src={form.headerVideoUrl} controls playsInline className="w-full max-h-80 bg-black" />
          ) : form.coverUrl ? (
            <img src={form.coverUrl} alt="" className="w-full max-h-52 object-cover" />
          ) : null}
          <div className="h-1.5" style={{ background: gradient }} />
          <div className="p-6">
            <h1 className="text-2xl font-black text-white">{form.title}</h1>
            {form.description && <p className="text-white/50 text-sm mt-2 whitespace-pre-line">{form.description}</p>}
          </div>
        </div>

        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-2 text-red-400 text-sm"><AlertCircle size={16} className="shrink-0" /><p className="flex-1">{error}</p></div>}

        {/* Campos */}
        <div className="space-y-4">
          {form.fields.map((f: any) => (
            f.type === 'heading' ? (
              <h2 key={f.id} className="text-lg font-black text-white pt-4">{f.label}</h2>
            ) : f.type === 'button' ? (
              f.settings?.submits ? (
                <button key={f.id} onClick={() => doSubmit(f.options?.[0])} disabled={submitting} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-black text-black transition-all active:scale-[0.98] disabled:opacity-50" style={{ background: btnColor }}>
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : f.label}
                </button>
              ) : (
                <a key={f.id} href={resolveRedirect(f.options?.[0]) || '#'} target="_blank" rel="noreferrer" className="block text-center py-3.5 rounded-2xl text-sm font-black text-black transition-all active:scale-[0.98]" style={{ background: btnColor }}>
                  {f.label}
                </a>
              )
            ) : (
              <div key={f.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
                <label className="block text-sm font-bold text-white mb-1">{f.label} {f.required && <span style={{ color }}>*</span>}</label>
                {f.description && <p className="text-[11px] text-white/30 mb-2">{f.description}</p>}
                <div className="mt-2">
                  {f.type === 'paragraph' ? (
                    <textarea rows={3} className={`${inputCls} resize-none`} onChange={e => setAnswer(f.id, e.target.value)} />
                  ) : f.type === 'radio' ? (
                    <div className="space-y-2">
                      {(f.options || []).map((o: string, i: number) => (
                        <label key={i} className="flex items-center gap-2.5 text-sm text-white/70 cursor-pointer">
                          <input type="radio" name={f.id} onChange={() => setAnswer(f.id, o)} style={{ accentColor: color }} /> {o}
                        </label>
                      ))}
                    </div>
                  ) : f.type === 'checkbox' ? (
                    <div className="space-y-2">
                      {(f.options || []).map((o: string, i: number) => (
                        <label key={i} className="flex items-center gap-2.5 text-sm text-white/70 cursor-pointer">
                          <input type="checkbox" onChange={() => toggleCheck(f.id, o)} style={{ accentColor: color }} /> {o}
                        </label>
                      ))}
                    </div>
                  ) : f.type === 'dropdown' ? (
                    <select className={inputCls} defaultValue="" onChange={e => setAnswer(f.id, e.target.value)}>
                      <option value="" disabled className="bg-[#0d0d15]">Elegí una opción...</option>
                      {(f.options || []).map((o: string, i: number) => <option key={i} value={o} className="bg-[#0d0d15]">{o}</option>)}
                    </select>
                  ) : f.type === 'rating' ? (
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} type="button" onClick={() => setAnswer(f.id, n)}>
                          <Star size={26} style={{ color: (answers[f.id] || 0) >= n ? color : 'rgba(255,255,255,0.2)' }} fill={(answers[f.id] || 0) >= n ? color : 'none'} />
                        </button>
                      ))}
                    </div>
                  ) : f.type === 'file' ? (
                    <div>
                      <label className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-white/15 hover:border-amber-500/40 cursor-pointer text-sm text-white/40 w-fit">
                        {uploading === f.id ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                        {answers[f.id] ? 'Archivo subido ✓' : 'Subir archivo'}
                        <input type="file" className="hidden" onChange={e => uploadFile(f.id, e.target.files?.[0] || null)} />
                      </label>
                    </div>
                  ) : (
                    <input
                      type={f.type === 'number' ? 'number' : f.type === 'email' ? 'email' : f.type === 'phone' ? 'tel' : f.type === 'date' ? 'date' : 'text'}
                      className={inputCls} style={{ colorScheme: 'dark' }}
                      onChange={e => setAnswer(f.id, e.target.value)}
                    />
                  )}
                </div>
              </div>
            )
          ))}
        </div>

        {form.showSubmit !== false && (
          <button onClick={() => doSubmit()} disabled={submitting} className="w-full mt-5 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-black text-black transition-all active:scale-[0.98] disabled:opacity-50" style={{ background: btnColor }}>
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <><Send size={15} /> Enviar</>}
          </button>
        )}
        <p className="text-center text-[10px] text-white/20 mt-4">Formulario creado con Nexor</p>
      </div>
    </div>
  )
}
