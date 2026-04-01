'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Loader2, Check, X, ChevronDown, ChevronUp, Eye, EyeOff, BarChart2 } from 'lucide-react'

const CATEGORIES = ['general', 'ventas', 'soporte', 'ecommerce', 'servicios', 'otro']

interface Template {
    id: string
    name: string
    description: string | null
    content: string
    category: string
    isActive: boolean
    usageCount: number
    createdAt: string
}

const emptyForm = { name: '', description: '', content: '', category: 'general' }

export default function AdminPromptTemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState(emptyForm)
    const [editId, setEditId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [expanded, setExpanded] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [saved, setSaved] = useState(false)

    useEffect(() => { fetchTemplates() }, [])

    async function fetchTemplates() {
        const res = await fetch('/api/admin/prompt-templates')
        const data = await res.json()
        setTemplates(data.templates || [])
        setLoading(false)
    }

    async function handleSave() {
        setError(null)
        if (!form.name.trim()) { setError('El nombre es requerido'); return }
        if (!form.content.trim()) { setError('El contenido es requerido'); return }
        setSaving(true)
        try {
            const url = editId ? `/api/admin/prompt-templates/${editId}` : '/api/admin/prompt-templates'
            const method = editId ? 'PUT' : 'POST'
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            const data = await res.json()
            if (!res.ok) { setError(data.error); return }
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
            setShowForm(false)
            setEditId(null)
            setForm(emptyForm)
            fetchTemplates()
        } finally { setSaving(false) }
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Eliminar esta plantilla?')) return
        setDeleting(id)
        await fetch(`/api/admin/prompt-templates/${id}`, { method: 'DELETE' })
        setTemplates(prev => prev.filter(t => t.id !== id))
        setDeleting(null)
    }

    async function toggleActive(t: Template) {
        await fetch(`/api/admin/prompt-templates/${t.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: !t.isActive }),
        })
        setTemplates(prev => prev.map(x => x.id === t.id ? { ...x, isActive: !x.isActive } : x))
    }

    function startEdit(t: Template) {
        setEditId(t.id)
        setForm({ name: t.name, description: t.description || '', content: t.content, category: t.category })
        setShowForm(true)
        setError(null)
    }

    function cancelForm() {
        setShowForm(false)
        setEditId(null)
        setForm(emptyForm)
        setError(null)
    }

    const grouped = CATEGORIES.reduce((acc, cat) => {
        const items = templates.filter(t => t.category === cat)
        if (items.length) acc[cat] = items
        return acc
    }, {} as Record<string, Template[]>)

    return (
        <div className="min-h-screen bg-[#06060A] text-white p-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter">Plantillas de Prompt</h1>
                    <p className="text-white/40 text-sm mt-0.5">Los usuarios podrán cargar estas plantillas en sus agentes de IA</p>
                </div>
                {!showForm && (
                    <button
                        onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm) }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black uppercase text-white transition-all hover:opacity-90"
                        style={{ background: 'linear-gradient(135deg, #B45309, #FFD700)' }}
                    >
                        <Plus size={15} /> Nueva plantilla
                    </button>
                )}
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 mb-8 space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-widest text-white/50">
                        {editId ? 'Editar plantilla' : 'Nueva plantilla'}
                    </h2>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-white/40 uppercase font-bold mb-1.5 block">Nombre *</label>
                            <input
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="Ej: Vendedor Bolivia Pro"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-white/40 uppercase font-bold mb-1.5 block">Categoría</label>
                            <select
                                value={form.category}
                                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
                            >
                                {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0B0B12]">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-white/40 uppercase font-bold mb-1.5 block">Descripción <span className="normal-case text-white/20">(opcional)</span></label>
                        <input
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="Breve descripción de para qué sirve esta plantilla"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-white/40 uppercase font-bold mb-1.5 block">Contenido del prompt *</label>
                        <textarea
                            value={form.content}
                            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                            rows={14}
                            placeholder="Escribe aquí el prompt completo de la plantilla..."
                            className="w-full bg-[#0B0B12]/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 font-mono resize-y min-h-[200px]"
                        />
                        <p className="text-[11px] text-white/25 mt-1">{form.content.length} caracteres</p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white transition-all disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg, #15803d, #22c55e)' }}
                        >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Plus size={14} />}
                            {editId ? 'Guardar cambios' : 'Crear plantilla'}
                        </button>
                        <button onClick={cancelForm} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white/5 hover:bg-white/10 transition-all">
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-amber-400" size={28} /></div>
            ) : templates.length === 0 ? (
                <div className="text-center py-20 text-white/30">
                    <p className="text-sm">No hay plantillas creadas todavía.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(grouped).map(([cat, items]) => (
                        <div key={cat}>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3 flex items-center gap-2">
                                <span className="w-5 h-px bg-white/10" />
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                <span className="text-white/20">({items.length})</span>
                            </p>
                            <div className="space-y-3">
                                {items.map(t => (
                                    <div key={t.id} className={`bg-white/[0.03] border rounded-2xl overflow-hidden transition-all ${t.isActive ? 'border-white/8' : 'border-white/4 opacity-50'}`}>
                                        <div className="flex items-center gap-3 px-5 py-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-black text-white text-sm">{t.name}</p>
                                                    {!t.isActive && <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30 font-bold">Inactiva</span>}
                                                </div>
                                                {t.description && <p className="text-xs text-white/35 mt-0.5 truncate">{t.description}</p>}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-white/25 text-[11px] shrink-0">
                                                <BarChart2 size={11} /> {t.usageCount} usos
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 transition-all"
                                                    title="Ver contenido"
                                                >
                                                    {expanded === t.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                                </button>
                                                <button
                                                    onClick={() => toggleActive(t)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                                                    title={t.isActive ? 'Desactivar' : 'Activar'}
                                                >
                                                    {t.isActive ? <Eye size={13} className="text-green-400" /> : <EyeOff size={13} className="text-white/30" />}
                                                </button>
                                                <button
                                                    onClick={() => startEdit(t)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-amber-400 transition-all"
                                                    title="Editar"
                                                >
                                                    <Pencil size={13} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(t.id)}
                                                    disabled={deleting === t.id}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-all"
                                                    title="Eliminar"
                                                >
                                                    {deleting === t.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                                </button>
                                            </div>
                                        </div>
                                        {expanded === t.id && (
                                            <div className="px-5 pb-4 border-t border-white/5">
                                                <pre className="mt-3 text-xs text-white/50 font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto bg-black/20 rounded-xl p-4">
                                                    {t.content}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
