'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, Wrench, Search, FileText, Download, Eye, ExternalLink, Quote } from 'lucide-react'

const VALID_SECTIONS = ['CATALOGO', 'TESTIMONIO', 'PROMOCION', 'BIBLIOTECA', 'GUION']

const SECTIONS = [
  { key: 'CATALOGO', label: 'Catálogo' },
  { key: 'TESTIMONIO', label: 'Testimonios' },
  { key: 'PROMOCION', label: 'Promociones' },
  { key: 'BIBLIOTECA', label: 'Biblioteca' },
  { key: 'GUION', label: 'Guiones' },
] as const

const dl = (url: string) => url + (url.includes('?') ? '&' : '?') + 'download'

function ToolsContent() {
  const sp = useSearchParams()
  const [sections, setSections] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('CATALOGO')
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('TODAS')

  // Abrir en la sección que venga por ?s= (desde el menú colapsable)
  useEffect(() => {
    const s = (sp.get('s') || '').toUpperCase()
    if (VALID_SECTIONS.includes(s)) { setTab(s); setQ(''); setCat('TODAS') }
  }, [sp])

  useEffect(() => {
    fetch('/api/herramientas').then(r => r.ok ? r.json() : null).then(d => setSections(d?.sections || {})).finally(() => setLoading(false))
  }, [])

  const list = sections[tab] || []

  const categories = useMemo(() => {
    if (tab !== 'CATALOGO') return []
    return Array.from(new Set(list.map((i: any) => i.category).filter(Boolean)))
  }, [list, tab])

  const filtered = useMemo(() => {
    let l = list
    if (tab === 'CATALOGO') {
      if (cat !== 'TODAS') l = l.filter((i: any) => i.category === cat)
      if (q.trim()) { const s = q.toLowerCase(); l = l.filter((i: any) => `${i.title} ${i.category} ${i.description}`.toLowerCase().includes(s)) }
    }
    return l
  }, [list, tab, q, cat])

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-amber-400" size={28} /></div>

  return (
    <div className="px-4 sm:px-6 pt-6 max-w-screen-xl mx-auto pb-24 text-white">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}>
          <Wrench size={20} className="text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">Herramientas</h1>
          <p className="text-xs text-white/30">Plantillas, testimonios, promociones, biblioteca y guiones.</p>
        </div>
      </div>

      {/* Pestañas */}
      <div className="flex gap-2 mb-5 border-b border-white/8 overflow-x-auto">
        {SECTIONS.map(s => (
          <button key={s.key} onClick={() => { setTab(s.key); setQ(''); setCat('TODAS') }}
            className={`px-4 py-2.5 text-sm font-bold whitespace-nowrap border-b-2 -mb-px ${tab === s.key ? 'text-amber-400 border-amber-400' : 'text-white/40 border-transparent hover:text-white/70'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Catálogo: búsqueda + categorías */}
      {tab === 'CATALOGO' && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button onClick={() => setCat('TODAS')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${cat === 'TODAS' ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-white/40 hover:text-white/70'}`}>Todas</button>
          {categories.map(c => (
            <button key={c} onClick={() => setCat(c)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${cat === c ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-white/40 hover:text-white/70'}`}>{c}</button>
          ))}
          <div className="relative ml-auto">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar plantilla..." className="pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 focus:outline-none focus:border-amber-500/40 w-48" />
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-white/30 text-sm">No hay contenido en esta sección todavía.</div>
      ) : tab === 'TESTIMONIO' ? (
        /* Testimonios */
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map((it: any) => (
            <div key={it.id} className="rounded-2xl border border-white/8 bg-white/[0.03] overflow-hidden">
              {it.imageUrl && (
                <div className="bg-black/20 flex items-center justify-center p-2" style={{ maxHeight: 320 }}>
                  <img src={it.imageUrl} alt="" className="max-w-full max-h-80 object-contain" />
                </div>
              )}
              <div className="p-5">
                <Quote size={18} className="text-amber-400/60 mb-2" />
                <p className="font-bold text-white">{it.title}</p>
                {it.description && <p className="text-sm text-white/50 mt-1 whitespace-pre-line">{it.description}</p>}
                {it.buttonUrl && <a href={it.buttonUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg text-xs font-bold text-black" style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}>{it.buttonLabel || 'Ver más'} <ExternalLink size={12} /></a>}
              </div>
            </div>
          ))}
        </div>
      ) : tab === 'PROMOCION' ? (
        /* Promociones */
        <div className="space-y-4">
          {filtered.map((it: any) => (
            <div key={it.id} className="rounded-2xl border border-white/8 bg-white/[0.03] overflow-hidden">
              {it.videoUrl ? (
                <video src={it.videoUrl} controls playsInline controlsList="nodownload" onContextMenu={e => e.preventDefault()} className="w-full max-h-72 bg-black" />
              ) : it.imageUrl ? <img src={it.imageUrl} alt="" className="w-full max-h-72 object-cover" /> : null}
              <div className="p-5">
                <p className="font-bold text-white">{it.title}</p>
                {it.description && <p className="text-sm text-white/50 mt-1 whitespace-pre-line">{it.description}</p>}
                <div className="flex flex-wrap gap-2 mt-3">
                  {it.fileUrl && <a href={it.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 hover:bg-white/10"><Eye size={12} /> Ver PDF</a>}
                  {it.fileUrl && <a href={dl(it.fileUrl)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 hover:bg-white/10"><Download size={12} /> Descargar</a>}
                  {it.buttonUrl && <a href={it.buttonUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-black" style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}>{it.buttonLabel || 'Abrir'} <ExternalLink size={12} /></a>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Catálogo / Biblioteca / Guiones — tarjetas con portada + acciones */
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((it: any) => (
            <div key={it.id} className="rounded-2xl border border-white/8 bg-white/[0.03] overflow-hidden flex flex-col">
              <div className="bg-black/20 flex items-center justify-center p-2" style={{ height: 200 }}>
                {it.coverUrl ? <img src={it.coverUrl} alt="" className="max-w-full max-h-full object-contain" /> : <FileText size={32} className="text-white/15" />}
              </div>
              <div className="p-4 flex flex-col flex-1">
                {it.category && <p className="text-[10px] uppercase tracking-widest text-amber-400/70 mb-1">{it.category}</p>}
                <p className="font-bold text-white text-sm">{it.title}</p>
                {it.description && <p className="text-xs text-white/40 mt-1 line-clamp-2 flex-1">{it.description}</p>}
                <div className="flex flex-wrap gap-2 mt-3">
                  {it.fileUrl && <a href={it.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white/5 hover:bg-white/10"><Eye size={12} /> Ver</a>}
                  {it.fileUrl && <a href={dl(it.fileUrl)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white/5 hover:bg-white/10"><Download size={12} /> Descargar</a>}
                  {it.buttonUrl && <a href={it.buttonUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-black" style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}>{it.buttonLabel || 'Abrir'} <ExternalLink size={11} /></a>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ToolsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-amber-400" size={28} /></div>}>
      <ToolsContent />
    </Suspense>
  )
}
