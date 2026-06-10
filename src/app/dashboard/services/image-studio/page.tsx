'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import {
    ArrowLeft, Upload, X, Loader2, AlertCircle, Sparkles,
    Download, Image as ImageIcon, Wand2, ExternalLink
} from 'lucide-react'

const SIZES = [
    { id: '1024x1024', label: 'Cuadrada', hint: '1:1' },
    { id: '1024x1536', label: 'Vertical', hint: '2:3' },
    { id: '1536x1024', label: 'Horizontal', hint: '3:2' },
] as const

const QUALITIES = [
    { id: 'low', label: 'Económica', hint: 'Más barata' },
    { id: 'medium', label: 'Equilibrada', hint: 'Recomendada' },
    { id: 'high', label: 'Alta', hint: 'Más cara' },
] as const

const MAX_COUNT = 6

export default function ImageStudioPage() {
    const fileRef = useRef<HTMLInputElement>(null)

    const [refImage, setRefImage] = useState<{ file: File; preview: string } | null>(null)
    const [prompt, setPrompt] = useState('')
    const [count, setCount] = useState(2)
    const [size, setSize] = useState<string>('1024x1024')
    const [quality, setQuality] = useState<string>('medium')

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [results, setResults] = useState<string[]>([])

    function selectImage(files: FileList | null) {
        const f = files?.[0]
        if (!f) return
        if (!f.type.startsWith('image/')) { setError('El archivo debe ser una imagen'); return }
        if (refImage?.preview) URL.revokeObjectURL(refImage.preview)
        setRefImage({ file: f, preview: URL.createObjectURL(f) })
        setError(null)
    }

    function removeImage() {
        if (refImage?.preview) URL.revokeObjectURL(refImage.preview)
        setRefImage(null)
        if (fileRef.current) fileRef.current.value = ''
    }

    async function generate() {
        setError(null)
        if (!refImage) { setError('Subí una imagen de referencia'); return }
        if (!prompt.trim()) { setError('Escribí las instrucciones para la IA'); return }

        setLoading(true)
        setResults([])
        try {
            const fd = new FormData()
            fd.append('file', refImage.file)
            fd.append('prompt', prompt.trim())
            fd.append('count', String(count))
            fd.append('size', size)
            fd.append('quality', quality)

            const res = await fetch('/api/image-studio/generate', { method: 'POST', body: fd })
            const data = await res.json()
            if (!res.ok) { setError(data.error || 'Error al generar las imágenes'); return }
            setResults(data.images || [])
        } catch {
            setError('Error de conexión')
        } finally {
            setLoading(false)
        }
    }

    async function download(url: string, i: number) {
        try {
            const res = await fetch(url)
            const blob = await res.blob()
            const a = document.createElement('a')
            const objUrl = URL.createObjectURL(blob)
            a.href = objUrl
            a.download = `imagen-${i + 1}.png`
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(objUrl)
        } catch {
            window.open(url, '_blank')
        }
    }

    return (
        <div className="px-4 md:px-6 pt-6 max-w-3xl mx-auto pb-24 text-white">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard" className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                    <ArrowLeft size={16} />
                </Link>
                <div>
                    <h1 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                        <Wand2 size={18} className="text-fuchsia-400" /> Generador de Imágenes
                    </h1>
                    <p className="text-white/30 text-xs mt-0.5">IA · Subí una referencia y generá variantes similares con gpt-image-2</p>
                </div>
            </div>

            {error && (
                <div className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-3 text-red-400 text-sm">
                    <AlertCircle size={16} className="shrink-0" />
                    <p className="flex-1">{error}</p>
                    <button onClick={() => setError(null)} className="font-bold">✕</button>
                </div>
            )}

            <div className="space-y-6">

                {/* Imagen de referencia */}
                <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
                    <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-3 flex items-center gap-2">
                        <ImageIcon size={12} /> Imagen de referencia
                    </label>
                    {refImage ? (
                        <div className="relative w-full max-w-xs">
                            <img src={refImage.preview} alt="referencia" className="w-full rounded-xl border border-white/10" />
                            <button
                                onClick={removeImage}
                                className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/60 hover:bg-red-500/40 flex items-center justify-center transition-all"
                            >
                                <X size={15} className="text-white" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => fileRef.current?.click()}
                            className="w-full flex flex-col items-center justify-center gap-2 py-10 rounded-xl border-2 border-dashed border-white/15 hover:border-fuchsia-500/40 text-white/30 hover:text-fuchsia-400 transition-all"
                        >
                            <Upload size={22} />
                            <span className="text-sm font-bold">Subir imagen</span>
                            <span className="text-[11px] text-white/20">JPG, PNG, WEBP</span>
                        </button>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => selectImage(e.target.files)} />
                </div>

                {/* Instrucciones */}
                <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
                    <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-1 flex items-center gap-2">
                        <Sparkles size={12} /> Instrucciones
                    </label>
                    <p className="text-[11px] text-white/25 mb-3">
                        Describí cómo querés que sean las imágenes generadas a partir de la referencia (estilo, fondo, colores, cambios, etc.).
                    </p>
                    <textarea
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder="Ej: Mantené el producto igual pero cambiá el fondo a un estudio profesional con luz cálida, estilo publicitario premium. Sin texto ni logos."
                        rows={4}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/10 resize-none leading-relaxed"
                    />
                </div>

                {/* Cantidad */}
                <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
                    <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-3">
                        ¿Cuántas imágenes querés? <span className="text-fuchsia-400">({count})</span>
                    </label>
                    <div className="flex gap-2 flex-wrap">
                        {Array.from({ length: MAX_COUNT }, (_, i) => i + 1).map(n => (
                            <button
                                key={n}
                                onClick={() => setCount(n)}
                                className={`w-11 h-11 rounded-xl text-sm font-black border-2 transition-all ${count === n ? 'border-fuchsia-500/60 bg-fuchsia-500/15 text-fuchsia-300' : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20'}`}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                    <p className="text-[11px] text-white/25 mt-2">Cada imagen consume créditos/saldo de tu API key. Más imágenes = más costo.</p>
                </div>

                {/* Formato + Calidad */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
                        <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-3">Formato</label>
                        <div className="flex flex-col gap-2">
                            {SIZES.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => setSize(s.id)}
                                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all ${size === s.id ? 'border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-300' : 'border-white/10 bg-white/5 text-white/55 hover:border-white/20'}`}
                                >
                                    <span className="text-xs font-bold">{s.label}</span>
                                    <span className="text-[10px] text-white/30">{s.hint}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
                        <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-3">Calidad</label>
                        <div className="flex flex-col gap-2">
                            {QUALITIES.map(q => (
                                <button
                                    key={q.id}
                                    onClick={() => setQuality(q.id)}
                                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all ${quality === q.id ? 'border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-300' : 'border-white/10 bg-white/5 text-white/55 hover:border-white/20'}`}
                                >
                                    <span className="text-xs font-bold">{q.label}</span>
                                    <span className="text-[10px] text-white/30">{q.hint}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Generar */}
                <button
                    onClick={generate}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-black uppercase tracking-widest text-white transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #7E22CE, #C026D3, #E879F9)' }}
                >
                    {loading ? (
                        <><Loader2 size={16} className="animate-spin" /> Generando {count} imagen{count !== 1 ? 'es' : ''}...</>
                    ) : (
                        <><Wand2 size={16} /> Generar {count} imagen{count !== 1 ? 'es' : ''}</>
                    )}
                </button>

                {loading && (
                    <p className="text-center text-[11px] text-white/30">Esto puede tardar hasta un minuto. No cierres la página.</p>
                )}

                {/* Resultados */}
                {results.length > 0 && (
                    <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
                        <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-3">
                            Resultados ({results.length})
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {results.map((url, i) => (
                                <div key={i} className="relative group rounded-xl overflow-hidden border border-white/10">
                                    <img src={url} alt={`resultado ${i + 1}`} className="w-full aspect-square object-cover" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                        <button
                                            onClick={() => download(url, i)}
                                            title="Descargar"
                                            className="w-9 h-9 rounded-lg bg-white/15 hover:bg-fuchsia-500/60 backdrop-blur flex items-center justify-center transition-all"
                                        >
                                            <Download size={15} className="text-white" />
                                        </button>
                                        <a
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title="Abrir"
                                            className="w-9 h-9 rounded-lg bg-white/15 hover:bg-white/30 backdrop-blur flex items-center justify-center transition-all"
                                        >
                                            <ExternalLink size={15} className="text-white" />
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
