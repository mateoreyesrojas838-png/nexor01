'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    ArrowLeft, ArrowRight, Building2, Sparkles, Loader2,
    CheckCircle2, AlertCircle, Plus, Target, Globe,
    MessageCircle, TrendingUp, Eye, ShoppingCart, DollarSign,
    Brain, RefreshCw, Pencil, X, Save, Bookmark, Trash2,
    Smartphone, Heart, BookMarked
} from 'lucide-react'
import Link from 'next/link'

interface Brief { id: string; name: string; industry: string; description: string }
interface Strategy {
    id: string; name: string; description: string; reason?: string; platform: string
    objective: string; destination: string; mediaType: string; mediaCount: number
    minBudgetUSD: number; advantageType: string; savedByUser?: boolean
}

const PLATFORM_LABELS: Record<string, { label: string; letter: string; color: string; bg: string }> = {
    META: { label: 'Meta Ads', letter: 'f', color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/25' },
}

const OBJECTIVE_ICONS: Record<string, React.ReactNode> = {
    conversions: <ShoppingCart size={11} />,
    leads: <MessageCircle size={11} />,
    traffic: <Globe size={11} />,
    awareness: <Eye size={11} />,
    engagement: <Heart size={11} />,
    app_promotion: <Smartphone size={11} />,
}

const OBJECTIVE_LABELS: Record<string, string> = {
    conversions: 'Ventas',
    leads: 'Clientes potenciales',
    traffic: 'Tráfico',
    awareness: 'Reconocimiento',
    engagement: 'Interacción',
    app_promotion: 'Promoción de app',
}

const OBJECTIVE_COLORS: Record<string, string> = {
    conversions: 'text-green-400',
    leads: 'text-amber-400',
    traffic: 'text-amber-400',
    awareness: 'text-amber-400',
    engagement: 'text-pink-400',
    app_promotion: 'text-orange-400',
}

const DESTINATION_LABELS: Record<string, string> = {
    whatsapp: 'WhatsApp',
    instagram: 'Instagram',
    website: 'Sitio web',
    messenger: 'Messenger',
}

function WizardContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const initialBriefId = searchParams.get('briefId')

    const [step, setStep] = useState<1 | 2 | 3>(initialBriefId ? 2 : 1)
    const [briefs, setBriefs] = useState<Brief[]>([])
    const [strategies, setStrategies] = useState<Strategy[]>([])
    const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null)
    const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null)
    const [campaignName, setCampaignName] = useState('')
    const [dailyBudget, setDailyBudget] = useState('5')
    const [loadingBriefs, setLoadingBriefs] = useState(true)
    const [loadingSuggestions, setLoadingSuggestions] = useState(false)
    const [loadingSaved, setLoadingSaved] = useState(false)
    const [creating, setCreating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [suggestError, setSuggestError] = useState<string | null>(null)
    const [showSourceChoice, setShowSourceChoice] = useState(false)
    const [savedCount, setSavedCount] = useState<number | null>(null)

    // Strategy editing
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState<Partial<Strategy>>({})
    const [saving, setSaving] = useState(false)
    const [savingStrategyId, setSavingStrategyId] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    useEffect(() => {
        fetch('/api/ads/brief').then(r => r.json()).then(data => {
            const allBriefs: Brief[] = data.briefs || []
            setBriefs(allBriefs)
            if (initialBriefId) {
                const found = allBriefs.find(b => b.id === initialBriefId)
                if (found) { setSelectedBrief(found); showChoice(found) }
            }
            setLoadingBriefs(false)
        }).catch(() => setLoadingBriefs(false))
    }, [initialBriefId])

    useEffect(() => {
        if (selectedBrief && selectedStrategy) {
            setCampaignName(`${selectedBrief.name} · ${selectedStrategy.name}`)
        }
    }, [selectedBrief, selectedStrategy])

    async function showChoice(brief: Brief) {
        setStep(2)
        setShowSourceChoice(true)
        setStrategies([])
        setSelectedStrategy(null)
        setSuggestError(null)
        // Preload saved count
        try {
            const res = await fetch('/api/ads/strategies?savedOnly=true')
            const data = await res.json()
            setSavedCount((data.strategies || []).length)
        } catch { setSavedCount(0) }
    }

    async function fetchSavedStrategies() {
        setShowSourceChoice(false)
        setLoadingSaved(true)
        setSuggestError(null)
        setStrategies([])
        setSelectedStrategy(null)
        setEditingId(null)
        try {
            const res = await fetch('/api/ads/strategies?savedOnly=true')
            const data = await res.json()
            const saved = (data.strategies || []).map((s: any) => ({
                ...s,
                // parse reason from description if encoded
                description: s.description?.includes('||REASON:') ? s.description.split('||REASON:')[0] : s.description,
                reason: s.description?.includes('||REASON:') ? s.description.split('||REASON:')[1] : undefined,
                savedByUser: true,
            }))
            if (saved.length === 0) {
                setSuggestError('No tienes estrategias guardadas. Genera nuevas con IA.')
            } else {
                setStrategies(saved)
            }
        } catch { setSuggestError('Error al cargar estrategias guardadas.') }
        finally { setLoadingSaved(false) }
    }

    async function fetchSuggestions(briefId: string) {
        setShowSourceChoice(false)
        setStep(2)
        setLoadingSuggestions(true)
        setSuggestError(null)
        setStrategies([])
        setSelectedStrategy(null)
        setEditingId(null)
        try {
            const res = await fetch('/api/ads/strategies/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ briefId })
            })
            let data: any = {}
            try { data = await res.json() } catch { /* non-JSON response */ }
            if (!res.ok) {
                setSuggestError(data.error || 'Error al generar estrategias')
            } else {
                setStrategies(data.strategies || [])
            }
        } catch (e: any) {
            setSuggestError(e?.message || 'Error de conexión. Verifica tu internet e inténtalo de nuevo.')
        } finally {
            setLoadingSuggestions(false)
        }
    }

    function startEdit(strategy: Strategy) {
        setEditingId(strategy.id)
        setEditForm({
            name: strategy.name,
            description: strategy.description,
            platform: strategy.platform,
            objective: strategy.objective,
            destination: strategy.destination,
            mediaType: strategy.mediaType,
            mediaCount: strategy.mediaCount,
            minBudgetUSD: strategy.minBudgetUSD,
        })
    }

    async function saveEdit(strategyId: string) {
        setSaving(true)
        try {
            const res = await fetch(`/api/ads/strategies/${strategyId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            })
            const data = await res.json()
            if (!res.ok) { setError(data.error || 'Error al guardar'); return }
            setStrategies(prev => prev.map(s =>
                s.id === strategyId ? { ...s, ...editForm } : s
            ))
            if (selectedStrategy?.id === strategyId) {
                setSelectedStrategy(prev => prev ? { ...prev, ...editForm } : prev)
            }
            setEditingId(null)
        } catch { setError('Error de conexión') }
        finally { setSaving(false) }
    }

    async function toggleSaveStrategy(strategy: Strategy) {
        setSavingStrategyId(strategy.id)
        const newSaved = !strategy.savedByUser
        try {
            const res = await fetch(`/api/ads/strategies/${strategy.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ savedByUser: newSaved })
            })
            if (res.ok) {
                setStrategies(prev => prev.map(s => s.id === strategy.id ? { ...s, savedByUser: newSaved } : s))
            }
        } catch { /* silent */ }
        finally { setSavingStrategyId(null) }
    }

    async function deleteStrategy(strategyId: string) {
        setDeletingId(strategyId)
        try {
            const res = await fetch(`/api/ads/strategies/${strategyId}`, { method: 'DELETE' })
            const data = await res.json()
            if (!res.ok) { setError(data.error || 'Error al eliminar'); return }
            setStrategies(prev => prev.filter(s => s.id !== strategyId))
            if (selectedStrategy?.id === strategyId) setSelectedStrategy(null)
        } catch { setError('Error de conexión') }
        finally { setDeletingId(null) }
    }

    async function createCampaign() {
        if (!selectedBrief || !selectedStrategy) return
        setCreating(true); setError(null)
        try {
            const res = await fetch('/api/ads/campaign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    briefId: selectedBrief.id,
                    strategyId: selectedStrategy.id,
                    name: campaignName.trim() || `${selectedBrief.name} · ${selectedStrategy.name}`,
                    dailyBudgetUSD: selectedStrategy.minBudgetUSD || 5,
                })
            })
            const data = await res.json()
            if (!res.ok) { setError(data.error || 'Error al crear campaña'); setCreating(false); return }
            router.push(`/dashboard/services/ads/campaign/${selectedStrategy.id}?edit=${data.campaign.id}`)
        } catch {
            setError('Error de conexión'); setCreating(false)
        }
    }

    return (
        <div className="px-4 md:px-6 pt-6 max-w-3xl mx-auto pb-24 text-white">

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/services/ads" className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                    <ArrowLeft size={16} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-xl font-black uppercase tracking-tighter">Nueva Campaña</h1>
                    <p className="text-xs text-white/30">3 pasos para lanzar tu anuncio</p>
                </div>
            </div>

            {/* Step indicators */}
            <div className="flex items-center gap-2 mb-8">
                {([1, 2, 3] as const).map((s, i) => (
                    <div key={s} className="flex items-center gap-2 flex-1">
                        <div className={`flex items-center gap-2 ${step === s ? 'flex-1' : ''}`}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${step > s ? 'bg-green-500 text-white' : step === s ? 'bg-amber-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]' : 'bg-white/5 border border-white/10 text-white/30'}`}>
                                {step > s ? <CheckCircle2 size={14} /> : s}
                            </div>
                            {step === s && (
                                <span className="text-xs font-bold text-white/70 whitespace-nowrap hidden sm:block">
                                    {s === 1 ? 'Negocio' : s === 2 ? 'Estrategia IA' : 'Configurar'}
                                </span>
                            )}
                        </div>
                        {i < 2 && <div className={`flex-1 h-px transition-all ${step > s ? 'bg-green-500/40' : 'bg-white/8'}`} />}
                    </div>
                ))}
            </div>

            {error && (
                <div className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-3 text-red-400 text-sm">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <p className="flex-1">{error}</p>
                    <button onClick={() => setError(null)} className="font-bold text-xs">✕</button>
                </div>
            )}

            {/* ── Step 1: Select Brief ── */}
            {step === 1 && (
                <div>
                    <div className="mb-6">
                        <h2 className="text-lg font-black">¿Para qué negocio?</h2>
                        <p className="text-xs text-white/30 mt-1">La IA analizará tu negocio y sugerirá las mejores estrategias</p>
                    </div>

                    {loadingBriefs ? (
                        <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin text-amber-400" size={24} /></div>
                    ) : briefs.length === 0 ? (
                        <div className="text-center py-16 bg-white/[0.015] border border-dashed border-white/10 rounded-3xl">
                            <Building2 size={28} className="text-white/20 mx-auto mb-3" />
                            <p className="text-white/40 font-bold mb-1">Sin negocios</p>
                            <p className="text-white/20 text-xs mb-5">Crea primero el perfil de tu negocio</p>
                            <Link href="/dashboard/services/ads/brief" className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white text-sm font-bold rounded-xl hover:bg-amber-500 transition-all">
                                <Plus size={14} /> Crear negocio
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {briefs.map(brief => (
                                <button key={brief.id} onClick={() => { setSelectedBrief(brief); showChoice(brief) }}
                                    className="w-full text-left bg-white/3 border border-white/8 rounded-2xl p-4 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shrink-0">
                                            <Building2 size={18} className="text-amber-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm">{brief.name}</p>
                                            <p className="text-xs text-white/40">{brief.industry}</p>
                                        </div>
                                        <ArrowRight size={16} className="text-white/20 group-hover:text-amber-400 transition-all" />
                                    </div>
                                </button>
                            ))}
                            <Link href="/dashboard/services/ads/brief"
                                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-dashed border-white/10 text-white/30 hover:border-white/25 hover:text-white/50 text-sm font-bold transition-all">
                                <Plus size={15} /> Agregar otro negocio
                            </Link>
                        </div>
                    )}
                </div>
            )}

            {/* ── Step 2: AI Strategy Suggestions ── */}
            {step === 2 && (
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <button onClick={() => setStep(1)} className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                            <ArrowLeft size={14} />
                        </button>
                        <div className="flex-1">
                            <h2 className="text-lg font-black">Estrategias recomendadas</h2>
                            {selectedBrief && <p className="text-xs text-white/30 mt-0.5">Para: <span className="text-amber-400">{selectedBrief.name}</span></p>}
                        </div>
                        {!loadingSuggestions && !loadingSaved && !showSourceChoice && strategies.length > 0 && (
                            <button onClick={() => selectedBrief && showChoice(selectedBrief)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/40 hover:text-white/70 hover:bg-white/10 transition-all">
                                <RefreshCw size={12} /> Cambiar
                            </button>
                        )}
                    </div>

                    {/* ── Source choice screen ── */}
                    {showSourceChoice && !loadingSuggestions && !loadingSaved && (
                        <div className="space-y-3">
                            <p className="text-xs text-white/30 mb-5 text-center">¿Cómo quieres definir la estrategia para este anuncio?</p>

                            {/* Option A: saved templates */}
                            <button
                                onClick={fetchSavedStrategies}
                                disabled={savedCount === 0}
                                className={`w-full flex items-start gap-4 p-5 rounded-2xl border text-left transition-all group ${savedCount === 0
                                    ? 'border-white/5 bg-white/[0.015] opacity-40 cursor-not-allowed'
                                    : 'border-green-500/20 bg-green-500/5 hover:border-green-500/40 hover:bg-green-500/10'
                                }`}
                            >
                                <div className="w-11 h-11 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                                    <BookMarked size={20} className="text-green-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-black text-sm text-white">Usar estrategia guardada</p>
                                        {savedCount !== null && savedCount > 0 && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/25 text-green-400">
                                                {savedCount} guardada{savedCount !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-white/35 leading-relaxed">
                                        {savedCount === 0
                                            ? 'No tienes estrategias guardadas aún'
                                            : 'Reutiliza estrategias que ya funcionaron. Más rápido y sin consumir créditos de IA.'
                                        }
                                    </p>
                                </div>
                                {savedCount !== null && savedCount > 0 && (
                                    <ArrowRight size={16} className="text-green-400/50 group-hover:text-green-400 transition-all shrink-0 mt-1" />
                                )}
                            </button>

                            {/* Option B: generate new */}
                            <button
                                onClick={() => selectedBrief && fetchSuggestions(selectedBrief.id)}
                                className="w-full flex items-start gap-4 p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40 hover:bg-amber-500/10 text-left transition-all group"
                            >
                                <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                                    <Brain size={20} className="text-amber-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-sm text-white mb-1">Generar nuevas con IA</p>
                                    <p className="text-xs text-white/35 leading-relaxed">
                                        La IA analiza tu negocio y crea estrategias personalizadas. Los 6 tipos de objetivo disponibles.
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                                        {Object.entries(OBJECTIVE_LABELS).map(([key, label]) => (
                                            <span key={key} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 ${OBJECTIVE_COLORS[key]}`}>
                                                {label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <ArrowRight size={16} className="text-amber-400/50 group-hover:text-amber-400 transition-all shrink-0 mt-1" />
                            </button>
                        </div>
                    )}

                    {/* Loading saved */}
                    {loadingSaved && (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="relative">
                                <div className="w-14 h-14 border-2 border-green-500/20 border-t-green-500 rounded-full animate-spin" />
                                <BookMarked size={20} className="text-green-400 absolute inset-0 m-auto" />
                            </div>
                            <div className="text-center">
                                <p className="text-white/70 font-bold">Cargando tus estrategias guardadas...</p>
                            </div>
                        </div>
                    )}

                    {/* Loading AI */}
                    {loadingSuggestions && (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="relative">
                                <div className="w-14 h-14 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                                <Brain size={20} className="text-amber-400 absolute inset-0 m-auto" />
                            </div>
                            <div className="text-center">
                                <p className="text-white/70 font-bold">La IA está analizando tu negocio...</p>
                                <p className="text-xs text-white/30 mt-1">Generando estrategias personalizadas</p>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {!loadingSuggestions && suggestError && (
                        <div className="py-12 text-center">
                            <AlertCircle size={28} className="text-red-400 mx-auto mb-3" />
                            <p className="text-red-400 font-bold text-sm mb-1">Error al generar estrategias</p>
                            <p className="text-xs text-white/30 mb-5">{suggestError}</p>
                            <button onClick={() => selectedBrief && fetchSuggestions(selectedBrief.id)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 rounded-xl text-sm font-bold hover:bg-amber-500 transition-all">
                                <RefreshCw size={14} /> Reintentar
                            </button>
                        </div>
                    )}

                    {/* Strategy cards */}
                    {!loadingSuggestions && !suggestError && strategies.length > 0 && (
                        <>
                            <div className="space-y-3 mb-6">
                                {strategies.map(strategy => {
                                    const isSelected = selectedStrategy?.id === strategy.id
                                    const isEditing = editingId === strategy.id
                                    const plat = PLATFORM_LABELS[strategy.platform]
                                    return (
                                        <div key={strategy.id}
                                            className={`rounded-2xl border transition-all ${isSelected ? 'border-amber-500/60 bg-amber-500/10 shadow-[0_0_20px_rgba(139,92,246,0.15)]' : 'border-white/8 bg-white/3 hover:border-white/20'}`}>

                                            {/* Card header — always visible */}
                                            <div className="p-4">
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${plat?.bg || 'bg-white/5 border-white/10'}`}>
                                                        <span className={`font-black text-base ${plat?.color}`}>{plat?.letter}</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start gap-2">
                                                            <p className="font-bold text-sm flex-1 leading-snug">{strategy.name}</p>
                                                            {isSelected && !isEditing && <CheckCircle2 size={16} className="text-amber-400 shrink-0 mt-0.5" />}
                                                        </div>
                                                        {!isEditing && (
                                                            <>
                                                                <p className="text-xs text-white/40 mt-1 leading-relaxed">{strategy.description}</p>
                                                                {strategy.reason && (
                                                                    <div className="mt-2 flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg"
                                                                        style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
                                                                        <Sparkles size={10} className="text-amber-400 shrink-0 mt-0.5" />
                                                                        <p className="text-[10px] text-amber-300/80 leading-relaxed">{strategy.reason}</p>
                                                                    </div>
                                                                )}
                                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5">
                                                                    <span className={`flex items-center gap-1 text-[10px] font-bold ${OBJECTIVE_COLORS[strategy.objective] || 'text-white/35'}`}>
                                                                        {OBJECTIVE_ICONS[strategy.objective] || <Target size={10} />}
                                                                        {OBJECTIVE_LABELS[strategy.objective] || strategy.objective}
                                                                    </span>
                                                                    <span className="text-[10px] text-white/25">{DESTINATION_LABELS[strategy.destination] || strategy.destination}</span>
                                                                    <span className="text-[10px] text-white/25">{strategy.mediaCount} {strategy.mediaType === 'video' ? 'videos' : 'imágenes'}</span>
                                                                    <span className="flex items-center gap-0.5 text-[10px] text-white/25">
                                                                        <DollarSign size={9} /> desde ${strategy.minBudgetUSD}/día
                                                                    </span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                    {/* Edit / Cancel button */}
                                                    <button
                                                        onClick={e => {
                                                            e.stopPropagation()
                                                            if (isEditing) { setEditingId(null) } else { startEdit(strategy) }
                                                        }}
                                                        className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/15 transition-all"
                                                        title={isEditing ? 'Cancelar edición' : 'Editar estrategia'}
                                                    >
                                                        {isEditing ? <X size={12} className="text-white/50" /> : <Pencil size={12} className="text-white/40" />}
                                                    </button>
                                                </div>

                                                {/* Inline edit form */}
                                                {isEditing && (
                                                    <div className="mt-4 space-y-3 border-t border-white/8 pt-4">
                                                        <div>
                                                            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1">Nombre</label>
                                                            <input
                                                                value={editForm.name || ''}
                                                                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1">Descripción</label>
                                                            <textarea
                                                                value={editForm.description || ''}
                                                                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                                                                rows={2}
                                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 resize-none"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1">Plataforma</label>
                                                                <select value={editForm.platform || ''} onChange={e => setEditForm(f => ({ ...f, platform: e.target.value }))}
                                                                    className="w-full bg-[#0d0d1a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 [&>option]:bg-[#0d0d1a]">
                                                                    <option value="META">Meta Ads</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1">Objetivo</label>
                                                                <select value={editForm.objective || ''} onChange={e => setEditForm(f => ({ ...f, objective: e.target.value }))}
                                                                    className="w-full bg-[#0d0d1a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 [&>option]:bg-[#0d0d1a]">
                                                                    <option value="conversions">Ventas</option>
                                                                    <option value="leads">Clientes potenciales</option>
                                                                    <option value="traffic">Tráfico</option>
                                                                    <option value="awareness">Reconocimiento</option>
                                                                    <option value="engagement">Interacción</option>
                                                                    <option value="app_promotion">Promoción de app</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1">Destino</label>
                                                                <select value={editForm.destination || ''} onChange={e => setEditForm(f => ({ ...f, destination: e.target.value }))}
                                                                    className="w-full bg-[#0d0d1a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 [&>option]:bg-[#0d0d1a]">
                                                                    <option value="whatsapp">WhatsApp</option>
                                                                    <option value="instagram">Instagram</option>
                                                                    <option value="website">Sitio web</option>
                                                                    <option value="messenger">Messenger</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1">Tipo media</label>
                                                                <select value={editForm.mediaType || ''} onChange={e => setEditForm(f => ({ ...f, mediaType: e.target.value }))}
                                                                    className="w-full bg-[#0d0d1a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 [&>option]:bg-[#0d0d1a]">
                                                                    <option value="image">Imagen</option>
                                                                    <option value="video">Video</option>
                                                                    <option value="carousel">Carrusel</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1">Cantidad creativos</label>
                                                                <input type="number" min={1} max={20}
                                                                    value={editForm.mediaCount || 5}
                                                                    onChange={e => setEditForm(f => ({ ...f, mediaCount: parseInt(e.target.value) || 5 }))}
                                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1">Presupuesto mín (USD/día)</label>
                                                                <input type="number" min={1}
                                                                    value={editForm.minBudgetUSD || 5}
                                                                    onChange={e => setEditForm(f => ({ ...f, minBudgetUSD: parseFloat(e.target.value) || 5 }))}
                                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                                                                />
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => saveEdit(strategy.id)}
                                                            disabled={saving}
                                                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-bold transition-all"
                                                        >
                                                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                                            Guardar cambios
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Select + Save/Delete buttons — only when not editing */}
                                                {!isEditing && (
                                                    <div className="mt-3 space-y-2">
                                                        <button
                                                            onClick={() => setSelectedStrategy(isSelected ? null : strategy)}
                                                            className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${isSelected
                                                                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                                                                : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10'
                                                            }`}
                                                        >
                                                            {isSelected ? <span className="flex items-center justify-center gap-1.5"><CheckCircle2 size={12} /> Seleccionada</span> : 'Seleccionar esta estrategia'}
                                                        </button>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={e => { e.stopPropagation(); toggleSaveStrategy(strategy) }}
                                                                disabled={savingStrategyId === strategy.id}
                                                                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] font-bold transition-all ${strategy.savedByUser
                                                                    ? 'bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-red-500/10 hover:border-red-500/25 hover:text-red-400'
                                                                    : 'bg-white/4 border border-white/10 text-white/35 hover:bg-green-500/10 hover:border-green-500/25 hover:text-green-400'
                                                                } disabled:opacity-40`}
                                                                title={strategy.savedByUser ? 'Quitar de guardados' : 'Guardar estrategia'}
                                                            >
                                                                {savingStrategyId === strategy.id
                                                                    ? <Loader2 size={11} className="animate-spin" />
                                                                    : strategy.savedByUser
                                                                        ? <><Bookmark size={11} className="fill-current" /> Guardada</>
                                                                        : <><Bookmark size={11} /> Guardar</>
                                                                }
                                                            </button>
                                                            <button
                                                                onClick={e => { e.stopPropagation(); deleteStrategy(strategy.id) }}
                                                                disabled={deletingId === strategy.id}
                                                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-red-500/8 border border-red-500/20 text-red-400/60 hover:bg-red-500/15 hover:text-red-400 transition-all disabled:opacity-40"
                                                                title="Eliminar estrategia"
                                                            >
                                                                {deletingId === strategy.id
                                                                    ? <Loader2 size={11} className="animate-spin" />
                                                                    : <Trash2 size={11} />
                                                                }
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            <button onClick={() => setStep(3)} disabled={!selectedStrategy}
                                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-600 text-white font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_30px_rgba(139,92,246,0.2)]">
                                <ArrowRight size={18} /> Continuar con esta estrategia
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* ── Step 3: Configure ── */}
            {step === 3 && (
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <button onClick={() => setStep(2)} className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                            <ArrowLeft size={14} />
                        </button>
                        <div>
                            <h2 className="text-lg font-black">Configura tu campaña</h2>
                            <p className="text-xs text-white/30 mt-0.5">Casi listo</p>
                        </div>
                    </div>

                    <div className="bg-white/3 border border-white/8 rounded-2xl p-4 mb-6 space-y-3">
                        <div className="flex items-center gap-3">
                            <Building2 size={14} className="text-amber-400 shrink-0" />
                            <div>
                                <p className="text-[10px] text-white/30 uppercase font-bold">Negocio</p>
                                <p className="text-sm font-bold">{selectedBrief?.name}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Sparkles size={14} className="text-amber-400 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-white/30 uppercase font-bold">Estrategia</p>
                                <p className="text-sm font-bold">{selectedStrategy?.name}</p>
                                {selectedStrategy?.reason && (
                                    <p className="text-[10px] text-amber-300/70 mt-0.5">{selectedStrategy.reason}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Nombre de la Campaña</label>
                        <input value={campaignName} onChange={e => setCampaignName(e.target.value)}
                            placeholder="Ej: Campaña verano 2026"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 placeholder:text-white/20" />
                    </div>

                    <p className="text-xs text-white/20 mt-5 leading-relaxed text-center">
                        En el siguiente paso podrás configurar presupuesto, cuenta publicitaria, páginas, píxeles y creativos.
                    </p>

                    <button onClick={createCampaign} disabled={creating || !campaignName.trim()}
                        className="mt-6 w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-600 text-white font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                        {creating
                            ? <><Loader2 size={18} className="animate-spin" /> Creando campaña...</>
                            : <><Sparkles size={18} /> Crear Campaña y Continuar</>
                        }
                    </button>
                </div>
            )}
        </div>
    )
}

export default function WizardPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-amber-400" size={28} />
            </div>
        }>
            <WizardContent />
        </Suspense>
    )
}
