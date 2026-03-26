'use client'

import { useState, useEffect, useRef } from 'react'
import {
    ArrowLeft, Loader2, TrendingUp, Eye, MousePointerClick,
    DollarSign, Users, RefreshCw, BarChart3
} from 'lucide-react'
import Link from 'next/link'

interface DayData {
    date: string
    impressions: number
    clicks: number
    spend: number
    reach: number
    conversations: number
}

const PERIODS = [
    { key: '7d',  label: '7 días' },
    { key: '14d', label: '14 días' },
    { key: '30d', label: '30 días' },
]

const METRICS = [
    { key: 'spend',         label: 'Gasto',         color: '#10B981', glow: '#10B981' },
    { key: 'clicks',        label: 'Clics',          color: '#8B5CF6', glow: '#8B5CF6' },
    { key: 'impressions',   label: 'Impresiones',    color: '#38BDF8', glow: '#38BDF8' },
    { key: 'reach',         label: 'Alcance',        color: '#F59E0B', glow: '#F59E0B' },
    { key: 'conversations', label: 'Conversaciones', color: '#EC4899', glow: '#EC4899' },
]

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function fmtShort(iso: string) {
    const d = new Date(iso + 'T00:00:00')
    return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

function fmt(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return String(n)
}

function smoothCurve(pts: { x: number; y: number }[]): string {
    if (pts.length === 0) return ''
    if (pts.length === 1) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
    const t = 0.25
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)]
        const p1 = pts[i]
        const p2 = pts[i + 1]
        const p3 = pts[Math.min(pts.length - 1, i + 2)]
        const cp1x = p1.x + (p2.x - p0.x) * t
        const cp1y = p1.y + (p2.y - p0.y) * t
        const cp2x = p2.x - (p3.x - p1.x) * t
        const cp2y = p2.y - (p3.y - p1.y) * t
        d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
    }
    return d
}

// SVG chart — each metric normalized to its own max so all lines fill the chart
function MultiLineChart({ days, activeMetrics }: { days: DayData[]; activeMetrics: Set<string> }) {
    const svgRef = useRef<SVGSVGElement>(null)
    const [hoverIdx, setHoverIdx] = useState<number | null>(null)

    const W = 620, H = 220, padL = 8, padR = 8, padT = 20, padB = 32

    const xOf = (i: number) =>
        padL + (days.length > 1 ? i / (days.length - 1) : 0.5) * (W - padL - padR)
    // Normalize each metric to its own 0-1 range so they all visually fill the chart
    const yOf = (v: number, max: number) =>
        padT + (1 - (max > 0 ? v / max : 0)) * (H - padT - padB)

    const activeList = METRICS.filter(m => activeMetrics.has(m.key))

    const lines = activeList.map(m => {
        const vals = days.map(d => (d as any)[m.key] as number)
        const max = Math.max(...vals, 1)
        const pts = days.map((_, i) => ({ x: xOf(i), y: yOf(vals[i], max), val: vals[i] }))
        const path = smoothCurve(pts)
        const area = path
            ? `${path} L ${pts[pts.length - 1].x.toFixed(1)} ${(H - padB).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(H - padB).toFixed(1)} Z`
            : ''
        return { ...m, pts, path, area }
    })

    // X axis ticks — max 6 labels
    const step = Math.max(1, Math.floor(days.length / 6))
    const xIdx = days.map((_, i) => i).filter(i => i % step === 0 || i === days.length - 1)

    function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
        if (!svgRef.current || days.length < 2) return
        const rect = svgRef.current.getBoundingClientRect()
        const mx = ((e.clientX - rect.left) / rect.width) * W
        const svgWidth = W - padL - padR
        const fraction = Math.max(0, Math.min(1, (mx - padL) / svgWidth))
        const idx = Math.round(fraction * (days.length - 1))
        setHoverIdx(idx)
    }

    const hoverX = hoverIdx !== null ? xOf(hoverIdx) : null

    return (
        <div style={{ position: 'relative' }}>
            <svg
                ref={svgRef}
                viewBox={`0 0 ${W} ${H}`}
                style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible', cursor: 'crosshair' }}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoverIdx(null)}
            >
                <defs>
                    {activeList.map(m => (
                        <linearGradient key={m.key} id={`ag-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor={m.color} stopOpacity="0.2" />
                            <stop offset="100%" stopColor={m.color} stopOpacity="0" />
                        </linearGradient>
                    ))}
                    {activeList.map(m => (
                        <filter key={m.key} id={`aglow-${m.key}`} x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="2" result="blur" />
                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                    ))}
                </defs>

                {/* Grid lines */}
                {[0, 0.5, 1].map((f, i) => {
                    const y = padT + f * (H - padT - padB)
                    return (
                        <line key={i}
                            x1={padL} y1={y} x2={W - padR} y2={y}
                            stroke="rgba(255,255,255,0.05)" strokeWidth="1"
                            strokeDasharray={i === 0 ? 'none' : '4 6'}
                        />
                    )
                })}
                <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB}
                    stroke="rgba(255,255,255,0.07)" strokeWidth="1" />

                {/* Areas + Lines */}
                {lines.map(l => (
                    <g key={l.key}>
                        {days.length === 1 ? (
                            // Single point: horizontal line + dot
                            <>
                                <line
                                    x1={padL} y1={l.pts[0].y} x2={W - padR} y2={l.pts[0].y}
                                    stroke={l.color} strokeWidth="1.5" strokeDasharray="4 4"
                                    opacity={0.5}
                                />
                                <circle cx={l.pts[0].x} cy={l.pts[0].y} r="5"
                                    fill={l.color} stroke="rgba(0,0,0,0.5)" strokeWidth="1.5"
                                    filter={`url(#aglow-${l.key})`}
                                />
                            </>
                        ) : (
                            <>
                                {l.area && <path d={l.area} fill={`url(#ag-${l.key})`} />}
                                {l.path && (
                                    <path d={l.path} fill="none"
                                        stroke={l.color} strokeWidth="2"
                                        strokeLinejoin="round" strokeLinecap="round"
                                        filter={`url(#aglow-${l.key})`}
                                    />
                                )}
                            </>
                        )}
                    </g>
                ))}

                {/* Hover crosshair + dots */}
                {hoverIdx !== null && hoverX !== null && (
                    <>
                        <line
                            x1={hoverX} y1={padT} x2={hoverX} y2={H - padB}
                            stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4 3"
                        />
                        {lines.map(l => (
                            <circle key={l.key}
                                cx={l.pts[hoverIdx]?.x} cy={l.pts[hoverIdx]?.y}
                                r="4" fill={l.color}
                                stroke="rgba(0,0,0,0.6)" strokeWidth="1.5"
                            />
                        ))}
                    </>
                )}

                {/* X axis labels */}
                {xIdx.map(i => (
                    <text key={i} x={xOf(i)} y={H - 8}
                        textAnchor="middle" fontSize="8.5"
                        fill="rgba(255,255,255,0.25)" fontFamily="system-ui">
                        {fmtShort(days[i].date)}
                    </text>
                ))}
            </svg>

            {/* Hover tooltip */}
            {hoverIdx !== null && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: `clamp(8px, calc(${(hoverIdx / Math.max(days.length - 1, 1)) * 100}% - 80px), calc(100% - 168px))`,
                    background: '#0D0F1E',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    pointerEvents: 'none',
                    zIndex: 10,
                    minWidth: '160px',
                }}>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '10px', fontWeight: 700, marginBottom: '6px' }}>
                        {fmtShort(days[hoverIdx].date)}
                    </p>
                    {lines.map(l => (
                        <div key={l.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
                            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>{l.label}:</span>
                            <span style={{ color: '#fff', fontSize: '10px', fontWeight: 700 }}>
                                {l.key === 'spend'
                                    ? `$${Number(l.pts[hoverIdx]?.val ?? 0).toFixed(2)}`
                                    : fmt(l.pts[hoverIdx]?.val ?? 0)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default function AnalyticsPage() {
    const [daily, setDaily] = useState<DayData[]>([])
    const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([])
    const [period, setPeriod] = useState('30d')
    const [selectedCampaign, setSelectedCampaign] = useState('ALL')
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [activeMetrics, setActiveMetrics] = useState<Set<string>>(
        new Set(['spend', 'clicks', 'impressions', 'reach'])
    )

    useEffect(() => { fetchData(false) }, [period, selectedCampaign])

    async function fetchData(manual: boolean) {
        if (manual) setRefreshing(true)
        else setLoading(true)
        try {
            const params = new URLSearchParams({ period })
            if (selectedCampaign !== 'ALL') params.set('campaignIds', selectedCampaign)
            const res = await fetch(`/api/ads/metrics/daily?${params}`)
            const data = await res.json()
            setDaily(data.daily || [])
            setCampaigns(data.campaigns || [])
        } catch {}
        finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const totals = daily.reduce((acc, d) => ({
        impressions:   acc.impressions   + d.impressions,
        clicks:        acc.clicks        + d.clicks,
        spend:         acc.spend         + d.spend,
        reach:         acc.reach         + d.reach,
        conversations: acc.conversations + d.conversations,
    }), { impressions: 0, clicks: 0, spend: 0, reach: 0, conversations: 0 })

    const ctr = totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : '0.00'
    const cpm = totals.impressions > 0 ? ((totals.spend / totals.impressions) * 1000).toFixed(2) : '0.00'

    const hasData = daily.length > 0
    const hasConversations = daily.some(d => d.conversations > 0)

    function toggleMetric(key: string) {
        setActiveMetrics(prev => {
            const next = new Set(prev)
            if (next.has(key)) {
                if (next.size === 1) return prev
                next.delete(key)
            } else {
                next.add(key)
            }
            return next
        })
    }

    const summaryCards = [
        { label: 'Gasto',       value: `$${totals.spend.toFixed(2)}`, color: '#10B981', icon: DollarSign },
        { label: 'Clics',       value: fmt(totals.clicks),             color: '#8B5CF6', icon: MousePointerClick },
        { label: 'Impresiones', value: fmt(totals.impressions),        color: '#38BDF8', icon: Eye },
        { label: 'Alcance',     value: fmt(totals.reach),              color: '#F59E0B', icon: Users },
        { label: 'CTR',         value: `${ctr}%`,                     color: '#2DD4BF', icon: TrendingUp },
        { label: 'CPM',         value: `$${cpm}`,                     color: '#EC4899', icon: DollarSign },
    ]

    return (
        <div className="px-4 md:px-6 pt-6 max-w-5xl mx-auto pb-24 text-white">

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Link href="/dashboard/services/ads"
                    className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all shrink-0">
                    <ArrowLeft size={15} />
                </Link>
                <div className="flex-1 min-w-0">
                    <h1 className="text-lg md:text-xl font-black uppercase tracking-tighter">Analytics de Campañas</h1>
                    <p className="text-[11px] text-white/30">Métricas diarias de tus campañas publicadas</p>
                </div>
                <button onClick={() => fetchData(true)}
                    className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                    <RefreshCw size={14} className={refreshing ? 'animate-spin text-amber-400' : ''} />
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
                <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                    {PERIODS.map(p => (
                        <button key={p.key} onClick={() => setPeriod(p.key)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${period === p.key ? 'bg-amber-600 text-white' : 'text-white/40 hover:text-white/70'}`}>
                            {p.label}
                        </button>
                    ))}
                </div>
                {campaigns.length > 1 && (
                    <select value={selectedCampaign} onChange={e => setSelectedCampaign(e.target.value)}
                        className="bg-[#0d0d1a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50 [&>option]:bg-[#0d0d1a]">
                        <option value="ALL">Todas las campañas</option>
                        {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                )}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-3">
                    <Loader2 size={28} className="animate-spin text-amber-400" />
                    <p className="text-white/30 text-sm">Cargando métricas...</p>
                </div>
            ) : !hasData ? (
                <div className="text-center py-24 bg-white/[0.015] border border-dashed border-white/8 rounded-3xl">
                    <BarChart3 size={32} className="text-white/20 mx-auto mb-3" />
                    <p className="text-white/40 font-bold text-sm">Sin datos para este período</p>
                    <p className="text-white/20 text-xs mt-1">Publica campañas para ver métricas aquí</p>
                </div>
            ) : (
                <>
                    {/* Summary cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                        {summaryCards.map(({ label, value, color, icon: Icon }) => (
                            <div key={label} className="bg-white/3 border border-white/8 rounded-2xl p-3.5">
                                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest mb-1.5"
                                    style={{ color }}>
                                    <Icon size={11} /> {label}
                                </div>
                                <p className="text-base font-black">{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Chart card */}
                    <div className="bg-white/3 border border-white/8 rounded-2xl p-4 md:p-5 mb-4">
                        {/* Metric toggles */}
                        <div className="flex flex-wrap gap-2 mb-5">
                            {METRICS.filter(m => m.key !== 'conversations' || hasConversations).map(m => {
                                const on = activeMetrics.has(m.key)
                                return (
                                    <button key={m.key} onClick={() => toggleMetric(m.key)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
                                        style={on
                                            ? { background: m.color + '20', borderColor: m.color + '50', color: m.color }
                                            : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }
                                        }>
                                        <span style={{
                                            width: 7, height: 7, borderRadius: '50%',
                                            background: on ? m.color : 'rgba(255,255,255,0.2)',
                                            display: 'inline-block', flexShrink: 0
                                        }} />
                                        {m.label}
                                    </button>
                                )
                            })}
                        </div>

                        <MultiLineChart days={daily} activeMetrics={activeMetrics} />
                    </div>

                    {/* Daily table */}
                    <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/6">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Detalle diario</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        {['Fecha', 'Gasto', 'Clics', 'Impresiones', 'Alcance', 'CTR',
                                          ...(hasConversations ? ['Conversaciones'] : [])].map(h => (
                                            <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-white/25">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...daily].reverse().map(d => {
                                        const ctrDay = d.impressions > 0
                                            ? ((d.clicks / d.impressions) * 100).toFixed(2) : '0.00'
                                        return (
                                            <tr key={d.date} className="border-b border-white/4 hover:bg-white/[0.02] transition-colors">
                                                <td className="px-4 py-2.5 text-white/60 font-medium">{fmtShort(d.date)}</td>
                                                <td className="px-4 py-2.5 font-bold" style={{ color: '#10B981' }}>${d.spend.toFixed(2)}</td>
                                                <td className="px-4 py-2.5 font-bold" style={{ color: '#8B5CF6' }}>{fmt(d.clicks)}</td>
                                                <td className="px-4 py-2.5" style={{ color: '#38BDF8' }}>{fmt(d.impressions)}</td>
                                                <td className="px-4 py-2.5" style={{ color: '#F59E0B' }}>{fmt(d.reach)}</td>
                                                <td className="px-4 py-2.5" style={{ color: '#2DD4BF' }}>{ctrDay}%</td>
                                                {hasConversations && <td className="px-4 py-2.5" style={{ color: '#EC4899' }}>{d.conversations}</td>}
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
