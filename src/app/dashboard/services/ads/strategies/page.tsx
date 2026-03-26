'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Loader2, Filter, Image as ImageIcon, Video, Sparkles, ArrowRight, CheckCircle2, FileText, Edit2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const PLATFORM_FILTERS = [
    { id: 'ALL', label: 'Todas las plataformas' },
    { id: 'META', label: 'Meta Ads' },
]

const DESTINATION_FILTERS = [
    { id: 'ALL', label: 'Todos los destinos' },
    { id: 'instagram', label: 'Instagram' },
    { id: 'whatsapp', label: 'WhatsApp' },
    { id: 'website', label: 'Sitio Web' },
    { id: 'messenger', label: 'Messenger' },
]

const MEDIA_FILTERS = [
    { id: 'ALL', label: 'Todos' },
    { id: 'image', label: 'Imágenes' },
    { id: 'video', label: 'Videos' }
]

const PLATFORM_COLORS: Record<string, string> = {
    META: '#0081FB',
}

const ADVANTAGE_LABELS: Record<string, { label: string; color: string }> = {
    advantage: { label: 'Advantage+', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    smart_segmentation: { label: 'Segmentación Smart', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    custom: { label: 'Personalizado', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' }
}

const DESTINATION_LABELS: Record<string, string> = {
    instagram: '📷 Instagram',
    whatsapp: '💬 WhatsApp',
    website: '🌐 Sitio Web',
    messenger: '💬 Messenger',
}

const OBJECTIVE_LABELS: Record<string, string> = {
    conversions: 'Conversiones',
    traffic: 'Tráfico',
    leads: 'Leads',
    awareness: 'Reconocimiento'
}

export default function StrategiesPage() {
    const router = useRouter()
    const [strategies, setStrategies] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [platform, setPlatform] = useState('ALL')
    const [destination, setDestination] = useState('ALL')
    const [mediaType, setMediaType] = useState('ALL')
    const [brief, setBrief] = useState<any>(null)

    useEffect(() => {
        fetch('/api/ads/brief').then(r => r.json()).then(d => setBrief(d.brief))
    }, [])

    useEffect(() => {
        fetchStrategies()
    }, [platform, destination, mediaType])

    async function fetchStrategies() {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (platform !== 'ALL') params.set('platform', platform)
            if (destination !== 'ALL') params.set('destination', destination)
            if (mediaType !== 'ALL') params.set('mediaType', mediaType)
            const res = await fetch(`/api/ads/strategies?${params}`)
            const data = await res.json()
            setStrategies(data.strategies || [])
        } finally { setLoading(false) }
    }

    function handleSelect(strategy: any) {
        if (!brief) {
            router.push('/dashboard/services/ads/brief')
            return
        }
        router.push(`/dashboard/services/ads/campaign/${strategy.id}`)
    }

    return (
        <div className="px-4 md:px-6 pt-6 max-w-screen-2xl mx-auto pb-24 text-white">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/services/ads" className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                    <ArrowLeft size={16} />
                </Link>
                <div>
                    <h1 className="text-xl font-black uppercase tracking-tighter">Estrategias de Pauta</h1>
                    <p className="text-xs text-white/30">Estrategias generadas por IA según tu negocio</p>
                </div>
            </div>

            {/* Brief status bar */}
            {brief ? (
                <div className="mb-6 p-4 bg-green-500/5 border border-green-500/15 rounded-2xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                        <FileText size={14} className="text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-green-400/70 mb-0.5">Business Brief</p>
                        <p className="text-sm font-bold text-white truncate">{brief.name}</p>
                        {brief.industry && (
                            <p className="text-[11px] text-white/30 truncate">{brief.industry}{brief.targetAudience ? ` · ${brief.targetAudience}` : ''}</p>
                        )}
                    </div>
                    <Link href="/dashboard/services/ads/brief" className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-white/40 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-all whitespace-nowrap">
                        <Edit2 size={11} /> Editar
                    </Link>
                </div>
            ) : (
                <div className="mb-6 p-4 bg-yellow-500/8 border border-yellow-500/20 rounded-2xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                        <Sparkles size={14} className="text-yellow-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400/70 mb-0.5">Business Brief</p>
                        <p className="text-xs text-yellow-300/80">Configura tu Brief para que la IA genere copies personalizados para tu negocio.</p>
                    </div>
                    <Link href="/dashboard/services/ads/brief" className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-300 border border-yellow-500/30 rounded-xl transition-all whitespace-nowrap">
                        <CheckCircle2 size={12} /> Crear Brief
                    </Link>
                </div>
            )}

            {/* Filters */}
            <div className="mb-8 space-y-3">
                {/* Platform filter */}
                <div className="flex flex-wrap gap-2">
                    {PLATFORM_FILTERS.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setPlatform(f.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${platform === f.id
                                ? 'bg-white text-black border-white'
                                : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Sub filters */}
                {platform === 'META' && (
                    <div className="flex flex-wrap gap-2">
                        {DESTINATION_FILTERS.map(f => (
                            <button
                                key={f.id}
                                onClick={() => setDestination(f.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${destination === f.id
                                    ? 'bg-amber-600 text-white border-amber-600'
                                    : 'bg-white/3 border-white/8 text-white/40 hover:border-white/20'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex flex-wrap gap-2">
                    {MEDIA_FILTERS.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setMediaType(f.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${mediaType === f.id
                                ? 'bg-amber-600 text-white border-amber-600'
                                : 'bg-white/3 border-white/8 text-white/40 hover:border-white/20'
                                }`}
                        >
                            {f.id === 'image' && <ImageIcon size={11} />}
                            {f.id === 'video' && <Video size={11} />}
                            {f.label}
                        </button>
                    ))}
                    <span className="text-xs text-white/20 flex items-center gap-1 ml-auto">
                        <Filter size={11} />
                        {loading ? '...' : `${strategies.length} estrategias`}
                    </span>
                </div>
            </div>

            {/* Strategy grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-amber-400" size={28} />
                </div>
            ) : strategies.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.015] border border-dashed border-white/8 rounded-3xl px-6">
                    <Sparkles className="text-amber-400 mx-auto mb-4" size={28} />
                    <p className="font-bold text-sm text-white mb-1">Sin estrategias generadas</p>
                    <p className="text-xs text-white/30 mb-6">La IA generará estrategias personalizadas según tu Brief de negocio</p>
                    <Link href="/dashboard/services/ads/wizard"
                        className="inline-flex items-center gap-2 bg-amber-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-amber-500 transition-all">
                        <Sparkles size={14} /> Generar estrategias con IA
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {strategies.map((strategy: any) => {
                        const advLabel = ADVANTAGE_LABELS[strategy.advantageType]
                        const platformColor = PLATFORM_COLORS[strategy.platform]
                        return (
                            <div
                                key={strategy.id}
                                className="group relative bg-dark-900/40 border border-white/5 rounded-[24px] p-5 hover:border-white/15 hover:bg-dark-900/60 transition-all overflow-hidden"
                            >
                                <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-[50px] opacity-5 group-hover:opacity-15 transition-opacity"
                                    style={{ background: platformColor }} />

                                {/* Platform + advantage badges */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full border"
                                            style={{ color: platformColor, background: `${platformColor}15`, borderColor: `${platformColor}30` }}>
                                            {strategy.platform}
                                        </span>
                                        {advLabel && (
                                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${advLabel.color}`}>
                                                {advLabel.label}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Name */}
                                <h3 className="font-black text-sm leading-tight mb-2 group-hover:text-white transition-colors">
                                    {strategy.name}
                                </h3>
                                {strategy.description && (
                                    <p className="text-xs text-white/30 mb-4 leading-relaxed line-clamp-2">
                                        {strategy.description}
                                    </p>
                                )}

                                {/* Stats row */}
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="flex items-center gap-1.5 text-xs text-white/40">
                                        {strategy.mediaType === 'video'
                                            ? <Video size={12} className="text-amber-400" />
                                            : <ImageIcon size={12} className="text-amber-400" />
                                        }
                                        <span className="font-bold">{strategy.mediaCount}</span>
                                        <span>{strategy.mediaType === 'video' ? 'videos' : 'imágenes'}</span>
                                    </div>
                                    <div className="w-1 h-1 rounded-full bg-white/10" />
                                    <span className="text-xs text-white/40">
                                        {DESTINATION_LABELS[strategy.destination] || strategy.destination}
                                    </span>
                                    <div className="w-1 h-1 rounded-full bg-white/10" />
                                    <span className="text-xs text-white/40 capitalize">
                                        {OBJECTIVE_LABELS[strategy.objective] || strategy.objective}
                                    </span>
                                </div>

                                {/* Budget */}
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-[10px] text-white/20 font-bold uppercase">Presupuesto mínimo</p>
                                        <p className="text-lg font-black text-white">${strategy.minBudgetUSD}<span className="text-xs text-white/30 font-medium">/USD</span></p>
                                    </div>
                                </div>

                                {/* CTA */}
                                <button
                                    onClick={() => handleSelect(strategy)}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white/70 group-hover:bg-amber-600 group-hover:border-amber-600 group-hover:text-white transition-all"
                                >
                                    Usar esta estrategia <ArrowRight size={14} />
                                </button>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
