'use client'

import { useState, useEffect } from 'react'
import {
    Plus, Pencil, Trash2, Loader2, Save, X, Package,
    ChevronRight, ToggleLeft, ToggleRight, Send, Check,
    Users, Search
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Product {
    id: string
    name: string
    category: string | null
    benefits: string | null
    usage: string | null
    warnings: string | null
    priceUnit: string | null
    pricePromo2: string | null
    priceSuper6: string | null
    currency: string
    welcomeMessage: string | null
    firstMessage: string | null
    hooks: string[]
    imageMainUrls: string[]
    imagePriceUnitUrl: string | null
    imagePricePromoUrl: string | null
    imagePriceSuperUrl: string | null
    productVideoUrls: string[]
    testimonialsVideoUrls: any[]
    shippingInfo: string | null
    coverage: string | null
    tags: string[]
    active: boolean
    createdAt: string
}

// ─── Form state ───────────────────────────────────────────────────────────────

const EMPTY_PRODUCT = {
    name: '', category: '', benefits: '', usage: '', warnings: '',
    priceUnit: '', pricePromo2: '', priceSuper6: '', currency: 'USD',
    welcomeMessage: '', firstMessage: '', hooks: '',
    img1: '', img2: '', img3: '', img4: '', img5: '', img6: '', img7: '', img8: '',
    vid1: '', vid2: '',
    test1Label: '', test1Url: '', test2Label: '', test2Url: '',
    test3Label: '', test3Url: '', test4Label: '', test4Url: '',
    test5Label: '', test5Url: '', test6Label: '', test6Url: '', test7Label: '', test7Url: '',
    test1VidLabel: '', test1VidUrl: '', test2VidLabel: '', test2VidUrl: '',
    test3VidLabel: '', test3VidUrl: '', test4VidLabel: '', test4VidUrl: '',
    test5VidLabel: '', test5VidUrl: '', test6VidLabel: '', test6VidUrl: '', test7VidLabel: '', test7VidUrl: '',
    shippingInfo: '', coverage: '', active: true,
}
type FormState = typeof EMPTY_PRODUCT

function parseTestimonials(p: Product) {
    const photos = Array.from({ length: 7 }, () => ({ label: '', url: '' }))
    const videos = Array.from({ length: 7 }, () => ({ label: '', url: '' }))
    let pi = 0, vi = 0
    for (const item of p.testimonialsVideoUrls) {
        if (typeof item === 'object' && item?.url) {
            if (item.type === 'video') { if (vi < 7) { videos[vi].url = item.url; videos[vi].label = item.label ?? ''; vi++ } }
            else { if (pi < 7) { photos[pi].url = item.url; photos[pi].label = item.label ?? ''; pi++ } }
        } else if (typeof item === 'string' && item.startsWith('http')) {
            if (pi < 7) { photos[pi].url = item; pi++ }
        }
    }
    return { photos, videos }
}

function productToForm(p: Product): FormState {
    const { photos, videos } = parseTestimonials(p)
    const imgs = [...(p.imageMainUrls || []), '', '', '', '', '', '', '', ''].slice(0, 8)
    return {
        name: p.name, category: p.category ?? '', benefits: p.benefits ?? '',
        usage: p.usage ?? '', warnings: p.warnings ?? '',
        priceUnit: p.priceUnit?.toString() ?? '', pricePromo2: p.pricePromo2?.toString() ?? '',
        priceSuper6: p.priceSuper6?.toString() ?? '', currency: p.currency ?? 'USD',
        welcomeMessage: p.welcomeMessage ?? '', firstMessage: p.firstMessage ?? '',
        hooks: (p.hooks || []).join('\n'),
        img1: imgs[0], img2: imgs[1], img3: imgs[2], img4: imgs[3],
        img5: imgs[4], img6: imgs[5], img7: imgs[6], img8: imgs[7],
        vid1: (p.productVideoUrls?.[0] as string) || '', vid2: (p.productVideoUrls?.[1] as string) || '',
        test1Label: photos[0].label, test1Url: photos[0].url,
        test2Label: photos[1].label, test2Url: photos[1].url,
        test3Label: photos[2].label, test3Url: photos[2].url,
        test4Label: photos[3].label, test4Url: photos[3].url,
        test5Label: photos[4].label, test5Url: photos[4].url,
        test6Label: photos[5].label, test6Url: photos[5].url,
        test7Label: photos[6].label, test7Url: photos[6].url,
        test1VidLabel: videos[0].label, test1VidUrl: videos[0].url,
        test2VidLabel: videos[1].label, test2VidUrl: videos[1].url,
        test3VidLabel: videos[2].label, test3VidUrl: videos[2].url,
        test4VidLabel: videos[3].label, test4VidUrl: videos[3].url,
        test5VidLabel: videos[4].label, test5VidUrl: videos[4].url,
        test6VidLabel: videos[5].label, test6VidUrl: videos[5].url,
        test7VidLabel: videos[6].label, test7VidUrl: videos[6].url,
        shippingInfo: p.shippingInfo ?? '', coverage: p.coverage ?? '', active: p.active,
    }
}

function formToPayload(f: FormState) {
    const testimonialsVideoUrls: any[] = []
    for (let i = 1; i <= 7; i++) {
        const lbl = f[`test${i}Label` as keyof FormState] as string
        const url = f[`test${i}Url` as keyof FormState] as string
        const vidLbl = f[`test${i}VidLabel` as keyof FormState] as string
        const vid = f[`test${i}VidUrl` as keyof FormState] as string
        if (url.trim()) testimonialsVideoUrls.push({ label: lbl.trim(), url: url.trim() })
        if (vid.trim()) testimonialsVideoUrls.push({ label: vidLbl.trim(), url: vid.trim(), type: 'video' })
    }
    return {
        name: f.name.trim(),
        category: f.category.trim() || null,
        benefits: f.benefits.trim() || null,
        usage: f.usage.trim() || null,
        warnings: f.warnings.trim() || null,
        priceUnit: f.priceUnit ? parseFloat(f.priceUnit) : null,
        pricePromo2: f.pricePromo2 ? parseFloat(f.pricePromo2) : null,
        priceSuper6: f.priceSuper6 ? parseFloat(f.priceSuper6) : null,
        currency: f.currency || 'USD',
        welcomeMessage: f.welcomeMessage.trim() || null,
        firstMessage: f.firstMessage.trim() || null,
        hooks: f.hooks.split('\n').map((s: string) => s.trim()).filter(Boolean),
        imageMainUrls: [f.img1, f.img2, f.img3, f.img4, f.img5, f.img6, f.img7, f.img8].map(s => s.trim()).filter(Boolean),
        productVideoUrls: [f.vid1, f.vid2].map(s => s.trim()).filter(Boolean),
        testimonialsVideoUrls,
        shippingInfo: f.shippingInfo.trim() || null,
        coverage: f.coverage.trim() || null,
        tags: [],
        active: f.active,
    }
}

// ─── Assign modal ─────────────────────────────────────────────────────────────

function AssignModal({ product, onClose }: { product: Product; onClose: () => void }) {
    const [identifier, setIdentifier] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

    async function handleAssign() {
        if (!identifier.trim()) return
        setLoading(true)
        setResult(null)
        const res = await fetch(`/api/admin/products/${product.id}/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: identifier.trim() }),
        })
        const data = await res.json()
        setResult({ type: res.ok ? 'success' : 'error', msg: data.message || data.error })
        setLoading(false)
        if (res.ok) setIdentifier('')
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-[#0E0E16] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                    <div>
                        <p className="font-black text-sm text-white">Asignar producto</p>
                        <p className="text-xs text-white/35 mt-0.5 truncate max-w-[280px]">{product.name}</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X size={16} /></button>
                </div>
                <div className="p-5 space-y-4">
                    <p className="text-xs text-white/40 leading-relaxed">
                        Se creará una copia de este producto en el catálogo del usuario. El usuario podrá editarla libremente sin afectar el original.
                    </p>
                    <div>
                        <label className="text-xs text-white/40 uppercase font-bold mb-1.5 block">Username o email del usuario</label>
                        <div className="flex gap-2">
                            <input
                                value={identifier}
                                onChange={e => setIdentifier(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAssign()}
                                placeholder="@usuario o email@ejemplo.com"
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50"
                            />
                            <button
                                type="button"
                                onClick={handleAssign}
                                disabled={loading || !identifier.trim()}
                                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 flex items-center gap-2"
                                style={{ background: 'linear-gradient(135deg, #15803d, #22c55e)' }}
                            >
                                {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                Asignar
                            </button>
                        </div>
                    </div>
                    {result && (
                        <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${result.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                            {result.type === 'success' ? <Check size={14} /> : <X size={14} />}
                            {result.msg}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Product Form ─────────────────────────────────────────────────────────────

function AdminProductForm({ product, onSaved, onCancel }: { product: Product | null; onSaved: () => void; onCancel: () => void }) {
    const [form, setForm] = useState<FormState>(product ? productToForm(product) : EMPTY_PRODUCT)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showTestimonialPhotos, setShowTestimonialPhotos] = useState(false)
    const [showTestimonialVideos, setShowTestimonialVideos] = useState(false)

    const setField = (key: keyof FormState, value: string | boolean) => setForm(f => ({ ...f, [key]: value }))

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const payload = formToPayload(form)
            const url = product ? `/api/admin/products/${product.id}` : '/api/admin/products'
            const method = product ? 'PATCH' : 'POST'
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Error guardando')
            onSaved()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error desconocido')
        } finally {
            setLoading(false)
        }
    }

    const inp = 'w-full bg-[#0B0B12]/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50'
    const tx = `${inp} resize-y`
    const lbl = 'block text-xs font-medium text-white/50 mb-1.5'
    const sec = 'bg-white/[0.03] border border-white/8 p-5 rounded-2xl space-y-4'
    const secH = 'flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider'

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <Package size={16} className="text-amber-400" />
                    {product ? 'Editar producto' : 'Nuevo producto del admin'}
                </h3>
                <button type="button" onClick={onCancel} className="text-white/35 hover:text-white transition-colors"><X size={18} /></button>
            </div>

            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}

            {/* Básico */}
            <div className={sec}>
                <div className={secH}><span className="w-1 h-3.5 bg-amber-400/70 rounded-full" />Información básica</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={lbl}>Nombre del producto *</label>
                        <input required value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Ej: Gel de Aloe Vera" className={inp} />
                    </div>
                    <div>
                        <label className={lbl}>Categoría</label>
                        <select value={form.category} onChange={e => setField('category', e.target.value)} className={`${inp} appearance-none`}>
                            <option value="">Selecciona una categoría...</option>
                            {['Salud y Bienestar','Belleza y Cuidado Personal','Electrónica y Gadgets','Hogar y Cocina','Deportes y Fitness','Moda y Accesorios','Juguetes y Bebés','Mascotas','Herramientas y Automotriz','Otros'].map(c => <option key={c} value={c} className="bg-[#0B0B12]">{c}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label className={lbl}>Primer mensaje del producto identificado</label>
                    <textarea rows={3} value={form.firstMessage} onChange={e => setField('firstMessage', e.target.value)} placeholder="Hola {nombre}! Te presento nuestro increíble producto..." className={tx} />
                </div>
                <button type="button" onClick={() => setField('active', !form.active)} className="flex items-center gap-2 text-sm">
                    {form.active ? <ToggleRight size={28} className="text-amber-400" /> : <ToggleLeft size={28} className="text-white/25" />}
                    <span className={form.active ? 'text-amber-400 font-medium' : 'text-white/35'}>{form.active ? 'Producto activo' : 'Producto inactivo'}</span>
                </button>
            </div>

            {/* Descripción */}
            <div className={sec}>
                <div className={secH}><span className="w-1 h-3.5 bg-indigo-400/70 rounded-full" />Descripción</div>
                <div><label className={lbl}>Beneficios</label><textarea rows={3} value={form.benefits} onChange={e => setField('benefits', e.target.value)} placeholder="Te ayuda en..." className={tx} /></div>
                <div><label className={lbl}>Modo de uso</label><textarea rows={2} value={form.usage} onChange={e => setField('usage', e.target.value)} placeholder="Aplicar 1 vez al día..." className={tx} /></div>
                <div><label className={lbl}>Advertencias / contraindicaciones</label><textarea rows={2} value={form.warnings} onChange={e => setField('warnings', e.target.value)} placeholder="No aplicar en heridas abiertas..." className={tx} /></div>
            </div>

            {/* Precios */}
            <div className={sec}>
                <div className={secH}><span className="w-1 h-3.5 bg-violet-400/70 rounded-full" />Precios</div>
                <div>
                    <label className={lbl}>Moneda</label>
                    <select value={form.currency} onChange={e => setField('currency', e.target.value)} className={inp}>
                        {['USD','BOB','PEN','COP','ARS','MXN','BRL','EUR'].map(c => <option key={c} value={c} className="bg-[#0B0B12]">{c}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div><label className={lbl}>Precio unitario</label><input type="number" step="0.01" min="0" value={form.priceUnit} onChange={e => setField('priceUnit', e.target.value)} placeholder="25.00" className={inp} /></div>
                    <div><label className={lbl}>Precio promo ×2</label><input type="number" step="0.01" min="0" value={form.pricePromo2} onChange={e => setField('pricePromo2', e.target.value)} placeholder="45.00" className={inp} /></div>
                    <div><label className={lbl}>Precio súper ×6</label><input type="number" step="0.01" min="0" value={form.priceSuper6} onChange={e => setField('priceSuper6', e.target.value)} placeholder="120.00" className={inp} /></div>
                </div>
            </div>

            {/* Imágenes */}
            <div className={sec}>
                <div className={secH}><span className="w-1 h-3.5 bg-amber-400/70 rounded-full" />Imágenes principales (URLs)</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(['img1','img2','img3'] as const).map((k,i) => (
                        <div key={k}><label className={lbl}>Imagen {i+1}</label><input value={form[k]} onChange={e => setField(k, e.target.value)} placeholder="https://..." className={inp} /></div>
                    ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(['img4','img5','img6','img7','img8'] as const).map((k,i) => (
                        <div key={k}><label className={lbl}>Imagen adicional {i+1}</label><input value={form[k]} onChange={e => setField(k, e.target.value)} placeholder="https://..." className={inp} /></div>
                    ))}
                </div>
                <div>
                    <div className={`${secH} mb-3`}><span className="w-1 h-3.5 bg-indigo-400/70 rounded-full" />Videos del producto</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(['vid1','vid2'] as const).map((k,i) => (
                            <div key={k}><label className={lbl}>Video {i+1}</label><input value={form[k]} onChange={e => setField(k, e.target.value)} placeholder="https://..." className={inp} /></div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Testimonios fotos */}
            <div className={sec}>
                <button type="button" onClick={() => setShowTestimonialPhotos(v => !v)} className="w-full flex items-center justify-between">
                    <div className={secH}><span className="w-1 h-3.5 bg-indigo-400/70 rounded-full" />Fotos de testimonios</div>
                    <ChevronRight size={16} className={`text-white/35 transition-transform ${showTestimonialPhotos ? 'rotate-90' : ''}`} />
                </button>
                {showTestimonialPhotos && (
                    <div className="space-y-3 pt-2">
                        {[1,2,3,4,5,6,7].map(n => (
                            <div key={n} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <input value={form[`test${n}Label` as keyof FormState] as string} onChange={e => setField(`test${n}Label` as keyof FormState, e.target.value)} placeholder={`Descripción testimonio ${n}`} className={inp} />
                                <input value={form[`test${n}Url` as keyof FormState] as string} onChange={e => setField(`test${n}Url` as keyof FormState, e.target.value)} placeholder="URL foto testimonio" className={inp} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Testimonios videos */}
            <div className={sec}>
                <button type="button" onClick={() => setShowTestimonialVideos(v => !v)} className="w-full flex items-center justify-between">
                    <div className={secH}><span className="w-1 h-3.5 bg-violet-400/70 rounded-full" />Videos de testimonios</div>
                    <ChevronRight size={16} className={`text-white/35 transition-transform ${showTestimonialVideos ? 'rotate-90' : ''}`} />
                </button>
                {showTestimonialVideos && (
                    <div className="space-y-3 pt-2">
                        {[1,2,3,4,5,6,7].map(n => (
                            <div key={n} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <input value={form[`test${n}VidLabel` as keyof FormState] as string} onChange={e => setField(`test${n}VidLabel` as keyof FormState, e.target.value)} placeholder={`Descripción video ${n}`} className={inp} />
                                <input value={form[`test${n}VidUrl` as keyof FormState] as string} onChange={e => setField(`test${n}VidUrl` as keyof FormState, e.target.value)} placeholder="URL video testimonio" className={inp} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Entrega */}
            <div className={sec}>
                <div className={secH}><span className="w-1 h-3.5 bg-green-400/70 rounded-full" />Entrega</div>
                <div><label className={lbl}>Información de envío</label><textarea rows={2} value={form.shippingInfo} onChange={e => setField('shippingInfo', e.target.value)} placeholder="Envío en 24-48h..." className={tx} /></div>
                <div><label className={lbl}>Cobertura</label><input value={form.coverage} onChange={e => setField('coverage', e.target.value)} placeholder="Todo Bolivia" className={inp} /></div>
                <div><label className={lbl}>Gatillos mentales (uno por línea)</label><textarea rows={3} value={form.hooks} onChange={e => setField('hooks', e.target.value)} placeholder="Oferta limitada&#10;Solo quedan 5 unidades&#10;Más de 500 clientes satisfechos" className={tx} /></div>
            </div>

            <div className="flex gap-3">
                <button type="button" onClick={onCancel} className="flex-1 py-3 bg-white/5 border border-white/10 text-white/50 font-medium rounded-xl hover:bg-white/8 transition-colors text-sm">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 py-3 bg-amber-400 text-[#0B0B12] font-bold rounded-xl hover:bg-amber-400/90 disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {product ? 'Actualizar' : 'Crear producto'}
                </button>
            </div>
        </form>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editProduct, setEditProduct] = useState<Product | null>(null)
    const [assignProduct, setAssignProduct] = useState<Product | null>(null)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [search, setSearch] = useState('')

    useEffect(() => { fetchProducts() }, [])

    async function fetchProducts() {
        setLoading(true)
        const res = await fetch('/api/admin/products')
        const data = await res.json()
        setProducts(data.products || [])
        setLoading(false)
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Eliminar este producto del admin?')) return
        setDeleting(id)
        await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
        setProducts(prev => prev.filter(p => p.id !== id))
        setDeleting(null)
    }

    function startEdit(p: Product) {
        setEditProduct(p)
        setShowForm(true)
    }

    function startNew() {
        setEditProduct(null)
        setShowForm(true)
    }

    function handleSaved() {
        setShowForm(false)
        setEditProduct(null)
        fetchProducts()
    }

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(search.toLowerCase())
    )

    if (showForm) {
        return (
            <div className="max-w-3xl mx-auto">
                <AdminProductForm product={editProduct} onSaved={handleSaved} onCancel={() => { setShowForm(false); setEditProduct(null) }} />
            </div>
        )
    }

    return (
        <div className="text-white">
            {assignProduct && <AssignModal product={assignProduct} onClose={() => setAssignProduct(null)} />}

            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter">Productos del Admin</h1>
                    <p className="text-white/40 text-sm mt-0.5">Crea productos y asígnalos a los usuarios que desees</p>
                </div>
                <button
                    onClick={startNew}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black uppercase text-white transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #B45309, #FFD700)' }}
                >
                    <Plus size={15} /> Nuevo producto
                </button>
            </div>

            {/* Search */}
            {products.length > 0 && (
                <div className="relative mb-5">
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por nombre o categoría..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 max-w-md"
                    />
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-amber-400" size={28} /></div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                    <Package size={40} className="text-white/15 mx-auto mb-3" />
                    <p className="text-white/30 text-sm">{search ? 'Sin resultados' : 'No hay productos creados todavía'}</p>
                    {!search && <button onClick={startNew} className="mt-3 text-amber-400 text-sm font-bold hover:underline">Crear primer producto →</button>}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map(p => (
                        <div key={p.id} className={`bg-white/[0.03] border rounded-2xl p-5 flex flex-col gap-3 ${p.active ? 'border-white/8' : 'border-white/4 opacity-60'}`}>
                            {/* Top */}
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-white truncate">{p.name}</p>
                                    <p className="text-xs text-white/30 mt-0.5">{p.category || 'Sin categoría'}</p>
                                </div>
                                {!p.active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30 font-bold shrink-0">Inactivo</span>}
                            </div>

                            {/* Preview imagen */}
                            {p.imageMainUrls?.[0] && (
                                <div className="aspect-video rounded-xl overflow-hidden border border-white/8">
                                    <img src={p.imageMainUrls[0]} alt={p.name} className="w-full h-full object-cover" />
                                </div>
                            )}

                            {/* Precios */}
                            {(p.priceUnit || p.pricePromo2) && (
                                <div className="flex gap-2 text-xs">
                                    {p.priceUnit && <span className="bg-white/5 rounded-lg px-2 py-1">{p.currency} {Number(p.priceUnit).toFixed(2)}</span>}
                                    {p.pricePromo2 && <span className="bg-amber-500/10 text-amber-400 rounded-lg px-2 py-1">×2: {Number(p.pricePromo2).toFixed(2)}</span>}
                                    {p.priceSuper6 && <span className="bg-amber-500/10 text-amber-400 rounded-lg px-2 py-1">×6: {Number(p.priceSuper6).toFixed(2)}</span>}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 mt-auto">
                                <button
                                    onClick={() => setAssignProduct(p)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-bold transition-all"
                                >
                                    <Users size={12} /> Asignar
                                </button>
                                <button
                                    onClick={() => startEdit(p)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold transition-all"
                                >
                                    <Pencil size={12} /> Editar
                                </button>
                                <button
                                    onClick={() => handleDelete(p.id)}
                                    disabled={deleting === p.id}
                                    className="w-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-all"
                                >
                                    {deleting === p.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
