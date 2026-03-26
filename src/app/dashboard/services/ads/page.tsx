'use client'

import { useState, useEffect, Suspense } from 'react'
import {
    Megaphone, Plus, ArrowRight, CheckCircle2,
    Sparkles, FileText, Zap, BarChart3, Settings2,
    AlertCircle, Loader2, Brain, Rocket, TrendingUp,
    Play, Clock, XCircle, RefreshCw, ChevronRight,
    Target, Layers, Eye
} from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const PLATFORMS = [
    { id: 'META', label: 'Meta Ads', sub: 'Facebook & Instagram', color: '#0081FB', letter: 'f', textColor: 'text-amber-400' },
]

const STATUS_LABELS: Record<string, { label: string; color: string; dot: string }> = {
    DRAFT: { label: 'Borrador', color: 'text-white/50 bg-white/5 border-white/10', dot: 'bg-white/30' },
    READY: { label: 'Listo', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-400' },
    PUBLISHING: { label: 'Publicando', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', dot: 'bg-yellow-400 animate-pulse' },
    PUBLISHED: { label: 'Publicado', color: 'text-green-400 bg-green-500/10 border-green-500/20', dot: 'bg-green-400' },
    FAILED: { label: 'Fallido', color: 'text-red-400 bg-red-500/10 border-red-500/20', dot: 'bg-red-400' },
    PAUSED: { label: 'Pausado', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', dot: 'bg-orange-400' },
}

export default function AdsDashboard() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    }>
      <AdsDashboardInner />
    </Suspense>
  )
}

function AdsDashboardInner() {
    const [integrations, setIntegrations] = useState<any[]>([])
    const [campaigns, setCampaigns] = useState<any[]>([])
    const [brief, setBrief] = useState<any>(null)
    const [allBriefs, setAllBriefs] = useState<any[]>([])
    const [openaiConfig, setOpenaiConfig] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const searchParams = useSearchParams()

    useEffect(() => {
        const err = searchParams.get('error')
        if (err) setError(decodeURIComponent(err))
        fetchAll()
    }, [searchParams])

    async function fetchAll() {
        setLoading(true)
        try {
            const [intRes, campaignRes, briefRes, oaiRes] = await Promise.all([
                fetch('/api/ads/integrations/status'),
                fetch('/api/ads/campaign'),
                fetch('/api/ads/brief'),
                fetch('/api/ads/config/openai')
            ])
            const [iData, cData, bData, oData] = await Promise.all([
                intRes.json(), campaignRes.json(), briefRes.json(), oaiRes.json()
            ])
            setIntegrations(iData.integrations || [])
            setCampaigns(cData.campaigns || [])
            setBrief(bData.brief || null)
            setAllBriefs(bData.briefs || [])
            setOpenaiConfig(oData.config || null)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleConnect = async (platformId: string) => {
        try {
            const res = await fetch(`/api/ads/integrations/${platformId.toLowerCase()}/connect/start`, { method: 'POST' })
            const { authUrl } = await res.json()
            if (authUrl) window.location.href = authUrl
        } catch { alert('Error al conectar plataforma') }
    }

    const hasOpenAI = openaiConfig?.isValid
    const hasBrief = !!brief
    const hasIntegration = integrations.some(i => i.status === 'CONNECTED')
    const allReady = hasOpenAI && hasBrief && hasIntegration
    const stepsCompleted = [hasOpenAI, hasBrief, hasIntegration].filter(Boolean).length

    const published = campaigns.filter(c => c.status === 'PUBLISHED').length
    const drafts = campaigns.filter(c => ['DRAFT', 'READY'].includes(c.status)).length
    const failed = campaigns.filter(c => c.status === 'FAILED').length

    const metaIntegration = integrations.find(i => i.platform === 'META')
    const isMetaConnected = metaIntegration?.status === 'CONNECTED'

    return (
        <div className="px-4 md:px-6 pt-6 max-w-screen-xl mx-auto pb-28 text-white">

            {/* Error banner */}
            {error && (
                <div className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-400 text-sm">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <p className="flex-1 text-xs md:text-sm"><b>Error:</b> {error}</p>
                    <button onClick={() => setError(null)} className="text-xs shrink-0 opacity-60 hover:opacity-100">✕</button>
                </div>
            )}

            {/* Hero Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a0a12] via-[#0d0d18] to-[#0a0a12] border border-white/8 p-6 md:p-8 mb-6">
                {/* Background glow */}
                <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-amber-500/5 blur-[80px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-blue-500/5 blur-[100px] translate-x-1/4 translate-y-1/4 pointer-events-none" />

                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-amber-500/25 to-amber-600/10 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
                            <Megaphone className="w-7 h-7 text-amber-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter leading-none">
                                    Ads <span className="text-amber-400">AI</span>
                                </h1>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-400 uppercase tracking-widest">Beta</span>
                            </div>
                            <p className="text-xs text-white/35 font-medium">Meta Ads · Facebook & Instagram</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/dashboard/services/ads/wizard"
                            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-5 py-2.5 rounded-xl font-black text-sm transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] active:scale-[0.97]"
                        >
                            <Plus size={15} strokeWidth={3} />
                            Nueva Campaña
                        </Link>
                        <button
                            onClick={fetchAll}
                            disabled={loading}
                            className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all shrink-0"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Stats row inline */}
                {campaigns.length > 0 && (
                    <div className="relative mt-6 pt-5 border-t border-white/6 grid grid-cols-4 gap-4">
                        {[
                            { label: 'Total', value: campaigns.length, color: 'text-white' },
                            { label: 'Publicadas', value: published, color: 'text-green-400' },
                            { label: 'Borradores', value: drafts, color: 'text-amber-400' },
                            { label: 'Fallidas', value: failed, color: 'text-red-400' },
                        ].map(s => (
                            <div key={s.label} className="text-center">
                                <p className={`text-2xl font-black leading-none ${s.color}`}>{s.value}</p>
                                <p className="text-[10px] text-white/25 mt-1 font-medium">{s.label}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-3">
                    <Loader2 className="animate-spin text-amber-400" size={28} />
                    <p className="text-white/25 text-xs">Cargando...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* LEFT COLUMN — main content */}
                    <div className="lg:col-span-2 space-y-5">

                        {/* Setup progress */}
                        {!allReady && (
                            <div className="bg-gradient-to-br from-amber-500/5 to-transparent border border-amber-500/15 rounded-3xl p-5 md:p-6">
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-2">
                                        <Rocket size={15} className="text-amber-400" />
                                        <span className="text-sm font-black">Completa la configuración</span>
                                    </div>
                                    <span className="text-xs text-amber-400 font-bold">{stepsCompleted}/3 pasos</span>
                                </div>
                                {/* Progress bar */}
                                <div className="flex gap-1 mb-5">
                                    {[0, 1, 2].map(i => (
                                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i < stepsCompleted ? 'bg-amber-400' : 'bg-white/8'}`} />
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    {[
                                        { id: 1, label: 'API Key de OpenAI', desc: 'Conecta tu cuenta para generar copies con IA', done: hasOpenAI, href: '/dashboard/services/ads/setup', icon: Brain },
                                        { id: 2, label: 'Perfil de Negocio', desc: 'La IA necesita conocer tu negocio para personalizar', done: hasBrief, href: '/dashboard/services/ads/brief', icon: FileText },
                                        { id: 3, label: 'Conectar Meta Ads', desc: 'Vincula tu cuenta de Facebook & Instagram', done: hasIntegration, href: '/dashboard/services/ads/setup', icon: Zap },
                                    ].map(step => {
                                        const Icon = step.icon
                                        return (
                                            <Link key={step.id} href={step.href}
                                                className={`group flex items-center gap-3.5 p-4 rounded-2xl border transition-all active:scale-[0.99] ${step.done
                                                    ? 'bg-green-500/5 border-green-500/15 cursor-default pointer-events-none'
                                                    : 'bg-white/3 border-white/8 hover:border-amber-500/30 hover:bg-amber-500/5'
                                                }`}>
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${step.done ? 'bg-green-500/15' : 'bg-white/5 group-hover:bg-amber-500/15'}`}>
                                                    {step.done
                                                        ? <CheckCircle2 size={16} className="text-green-400" />
                                                        : <Icon size={16} className="text-white/35 group-hover:text-amber-400 transition-colors" />
                                                    }
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-xs font-bold ${step.done ? 'text-white/40 line-through' : ''}`}>{step.label}</p>
                                                    <p className="text-[10px] text-white/25 truncate mt-0.5">{step.done ? 'Completado ✓' : step.desc}</p>
                                                </div>
                                                {!step.done && <ChevronRight size={14} className="text-white/20 group-hover:text-amber-400 shrink-0 transition-colors" />}
                                            </Link>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Quick actions */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                                {
                                    href: '/dashboard/services/ads/wizard',
                                    icon: Plus,
                                    label: 'Nueva Campaña',
                                    desc: 'Crea con IA en minutos',
                                    accent: 'from-amber-500/20 to-amber-600/5 border-amber-500/20 hover:border-amber-500/40',
                                    iconColor: 'text-amber-400',
                                    iconBg: 'bg-amber-500/15',
                                },
                                {
                                    href: '/dashboard/services/ads/strategies',
                                    icon: Target,
                                    label: 'Estrategias',
                                    desc: 'Templates optimizados',
                                    accent: 'from-blue-500/10 to-blue-600/5 border-blue-500/15 hover:border-blue-500/30',
                                    iconColor: 'text-blue-400',
                                    iconBg: 'bg-blue-500/15',
                                },
                                {
                                    href: '/dashboard/services/ads/history',
                                    icon: Layers,
                                    label: 'Historial',
                                    desc: 'Todas tus campañas',
                                    accent: 'from-white/5 to-white/3 border-white/10 hover:border-white/20',
                                    iconColor: 'text-white/50',
                                    iconBg: 'bg-white/8',
                                },
                            ].map(a => {
                                const Icon = a.icon
                                return (
                                    <Link key={a.href} href={a.href}
                                        className={`group flex flex-col gap-3 p-4 rounded-2xl bg-gradient-to-br border transition-all active:scale-[0.98] ${a.accent}`}>
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${a.iconBg}`}>
                                            <Icon size={16} className={a.iconColor} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black">{a.label}</p>
                                            <p className="text-[11px] text-white/30 mt-0.5">{a.desc}</p>
                                        </div>
                                        <ArrowRight size={13} className="text-white/15 group-hover:text-white/40 transition-colors mt-auto" />
                                    </Link>
                                )
                            })}
                        </div>

                        {/* Campaigns */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-[11px] font-bold uppercase tracking-widest text-white/30 flex items-center gap-1.5">
                                    <TrendingUp size={12} /> Campañas recientes
                                </h2>
                                {campaigns.length > 0 && (
                                    <Link href="/dashboard/services/ads/history" className="text-[11px] text-amber-400/70 hover:text-amber-400 transition-colors flex items-center gap-1">
                                        Ver todas <ArrowRight size={10} />
                                    </Link>
                                )}
                            </div>

                            {campaigns.length === 0 ? (
                                <div className="bg-white/[0.02] border border-dashed border-white/8 rounded-3xl py-16 text-center px-6">
                                    <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Sparkles className="text-amber-400" size={22} />
                                    </div>
                                    <p className="text-white/50 text-sm font-bold mb-1">Sin campañas todavía</p>
                                    <p className="text-white/20 text-xs mb-6 max-w-[220px] mx-auto">Crea tu primera campaña impulsada por IA en pocos minutos</p>
                                    <Link href="/dashboard/services/ads/wizard"
                                        className="inline-flex items-center gap-2 bg-amber-500 text-black text-sm font-black px-5 py-2.5 rounded-xl hover:bg-amber-400 transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                                        <Plus size={14} strokeWidth={3} /> Crear campaña
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {campaigns.slice(0, 6).map((campaign: any) => {
                                        const status = STATUS_LABELS[campaign.status] || STATUS_LABELS['DRAFT']
                                        const platform = PLATFORMS.find(p => p.id === campaign.platform)
                                        return (
                                            <div key={campaign.id}
                                                className="group bg-white/[0.025] border border-white/8 rounded-2xl p-4 hover:border-white/15 hover:bg-white/[0.04] transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-[#0081FB]/10 border border-[#0081FB]/20 flex items-center justify-center shrink-0">
                                                        <span className="font-black text-sm text-amber-400">f</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2 mb-0.5">
                                                            <h4 className="font-bold text-sm leading-tight truncate">{campaign.name}</h4>
                                                            <span className={`shrink-0 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.color}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                                                {status.label}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-white/25 truncate">{campaign.strategy?.name}</p>
                                                    </div>
                                                </div>
                                                {(campaign.status === 'READY' || campaign.status === 'DRAFT' || campaign.status === 'FAILED') && (
                                                    <div className="mt-3 pt-3 border-t border-white/5 flex gap-2">
                                                        {campaign.status === 'READY' && (
                                                            <Link href={`/dashboard/services/ads/preview/${campaign.id}`}
                                                                className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-all">
                                                                <Eye size={11} /> Revisar y publicar
                                                            </Link>
                                                        )}
                                                        {campaign.status === 'DRAFT' && (
                                                            <Link href={`/dashboard/services/ads/campaign/${campaign.strategyId}?edit=${campaign.id}`}
                                                                className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-white/8 text-white/60 hover:bg-white/15 transition-all">
                                                                Continuar <ArrowRight size={11} />
                                                            </Link>
                                                        )}
                                                        {campaign.status === 'FAILED' && (
                                                            <Link href={`/dashboard/services/ads/preview/${campaign.id}`}
                                                                className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all">
                                                                <RefreshCw size={11} /> Reintentar
                                                            </Link>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                    {campaigns.length > 6 && (
                                        <Link href="/dashboard/services/ads/history"
                                            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/3 border border-white/8 text-xs text-white/35 hover:text-white/60 hover:bg-white/5 transition-all font-bold">
                                            Ver todas las campañas <ArrowRight size={11} />
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN — sidebar */}
                    <div className="space-y-4">

                        {/* Meta Ads status */}
                        <div className={`relative overflow-hidden rounded-2xl border p-4 ${isMetaConnected ? 'bg-[#0081FB]/5 border-[#0081FB]/20' : 'bg-white/[0.02] border-dashed border-white/10'}`}>
                            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-[40px] opacity-20 bg-[#0081FB]" />
                            <div className="relative flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-[#0081FB]/15 border border-[#0081FB]/25 flex items-center justify-center shrink-0">
                                    <span className="font-black text-base text-amber-400">f</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold">Meta Ads</p>
                                    <p className="text-[10px] text-white/30">Facebook & Instagram</p>
                                </div>
                                {isMetaConnected
                                    ? <span className="shrink-0 flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-bold">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" /> Activo
                                    </span>
                                    : <span className="shrink-0 text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/25 font-bold">—</span>
                                }
                            </div>
                            {isMetaConnected && metaIntegration?.connectedAccount && (
                                <p className="text-[10px] text-white/30 mb-3 truncate pl-1">↳ {metaIntegration.connectedAccount.displayName}</p>
                            )}
                            <button
                                onClick={() => handleConnect('META')}
                                className="w-full text-[11px] font-bold py-2 rounded-xl bg-white/5 border border-white/8 hover:bg-white hover:text-black transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                            >
                                {isMetaConnected ? <><Settings2 size={11} /> Reconfigurar</> : <><Zap size={11} /> Conectar Meta</>}
                            </button>
                        </div>

                        {/* OpenAI status */}
                        <div className={`rounded-2xl border p-4 ${hasOpenAI ? 'bg-green-500/5 border-green-500/15' : 'bg-white/[0.02] border-white/8'}`}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${hasOpenAI ? 'bg-green-500/15' : 'bg-white/5'}`}>
                                    <Brain size={15} className={hasOpenAI ? 'text-green-400' : 'text-white/30'} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold">OpenAI</p>
                                    <p className="text-[10px] text-white/25">{hasOpenAI ? `Modelo: ${openaiConfig?.model || 'GPT-4'}` : 'Sin configurar'}</p>
                                </div>
                                {hasOpenAI
                                    ? <CheckCircle2 size={15} className="text-green-400 shrink-0" />
                                    : <AlertCircle size={15} className="text-white/20 shrink-0" />
                                }
                            </div>
                            <Link href="/dashboard/services/ads/setup"
                                className="flex items-center justify-center gap-1.5 w-full text-[11px] font-bold py-2 rounded-xl bg-white/5 border border-white/8 hover:bg-white hover:text-black transition-all">
                                <Settings2 size={11} /> {hasOpenAI ? 'Configuración' : 'Configurar API Key'}
                            </Link>
                        </div>

                        {/* Business briefs */}
                        <div className="bg-white/[0.025] border border-white/8 rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <FileText size={13} className="text-amber-400" />
                                    <span className="text-xs font-bold">Mis Negocios</span>
                                </div>
                                <Link href="/dashboard/services/ads/brief" className="text-[10px] text-amber-400/70 hover:text-amber-400 transition-colors flex items-center gap-0.5">
                                    Gestionar <ChevronRight size={10} />
                                </Link>
                            </div>
                            {allBriefs.length === 0 ? (
                                <div className="text-center py-4">
                                    <p className="text-[11px] text-white/20 mb-3">Sin perfiles de negocio</p>
                                    <Link href="/dashboard/services/ads/brief"
                                        className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-400 hover:bg-amber-500/25 transition-all">
                                        <Plus size={11} /> Crear Brief
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {allBriefs.slice(0, 3).map((b: any) => (
                                        <div key={b.id} className="flex items-center gap-2.5 bg-white/3 rounded-xl px-3 py-2.5">
                                            <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shrink-0">
                                                <FileText size={10} className="text-amber-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] font-bold truncate">{b.name}</p>
                                                <p className="text-[10px] text-white/25 truncate">{b.industry}</p>
                                            </div>
                                            <Link href={`/dashboard/services/ads/wizard?briefId=${b.id}`}
                                                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-all shrink-0 whitespace-nowrap">
                                                Usar
                                            </Link>
                                        </div>
                                    ))}
                                    {allBriefs.length > 3 && (
                                        <Link href="/dashboard/services/ads/brief" className="block text-center text-[10px] text-white/25 hover:text-white/50 py-1 transition-all">
                                            +{allBriefs.length - 3} más →
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Analytics link */}
                        <Link href="/dashboard/services/ads/analytics"
                            className="group flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/8 hover:border-white/15 hover:bg-white/5 transition-all">
                            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                <BarChart3 size={15} className="text-white/40 group-hover:text-amber-400 transition-colors" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-bold">Analytics</p>
                                <p className="text-[10px] text-white/25">Rendimiento de campañas</p>
                            </div>
                            <ChevronRight size={13} className="text-white/15 group-hover:text-white/40 transition-colors shrink-0" />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}
