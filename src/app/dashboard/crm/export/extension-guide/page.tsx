'use client'

import Link from 'next/link'
import { ArrowLeft, Download, Globe, Play, Upload, CheckCircle2, AlertCircle, Code, Package } from 'lucide-react'

export default function ExtensionGuidePage() {
    return (
        <div className="px-4 md:px-6 pt-6 max-w-2xl mx-auto pb-24 text-white">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/crm/export" className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                    <ArrowLeft size={16} />
                </Link>
                <div>
                    <h1 className="text-xl font-black uppercase tracking-tighter">Nexor Desktop</h1>
                    <p className="text-white/30 text-xs mt-0.5">App de escritorio para extraer contactos de WhatsApp</p>
                </div>
            </div>

            {/* Hero */}
            <div className="bg-gradient-to-br from-amber-500/5 via-amber-600/5 to-yellow-500/5 border border-amber-500/20 rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <Globe size={28} className="text-amber-400" />
                    </div>
                    <div>
                        <p className="text-lg font-black">Nexor Desktop</p>
                        <p className="text-[11px] text-white/50">v1.0.0 · App de escritorio</p>
                    </div>
                </div>
                <p className="text-xs text-white/60 leading-relaxed mb-4">
                    App nativa con <b className="text-white">WhatsApp Web embebido</b>. Extrae contactos de grupos y etiquetas con los números reales, directamente desde el modelo interno de WhatsApp.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                    <a
                        href="/downloads/Nexor-Desktop-Windows.zip"
                        download
                        className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-black transition-all hover:opacity-90"
                        style={{ background: 'linear-gradient(135deg, #B45309, #D97706, #FFD700)' }}
                    >
                        <Download size={14} /> Descargar para Windows
                    </a>
                    <span className="text-[10px] text-white/30">~108 MB · Windows 10/11 · Portable</span>
                </div>
            </div>

            {/* Features */}
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Características</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
                <Feature icon="👥" title="Grupos" desc="Exporta miembros con números reales" />
                <Feature icon="🏷️" title="Etiquetas" desc="Contactos por etiqueta (Business)" />
                <Feature icon="💬" title="Todos los chats" desc="Lista completa de contactos" />
                <Feature icon="✅" title="Selección libre" desc="Checkbox + buscador" />
                <Feature icon="📞" title="Modo teléfono" desc="Solo número o con nombre" />
                <Feature icon="📊" title="Excel ready" desc="CSV con BOM UTF-8" />
            </div>

            {/* Pasos */}
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Cómo usarla</p>
            <div className="space-y-4">
                <Step
                    number={1}
                    icon={<Download size={18} />}
                    title="Descargar el ZIP"
                    description="Click en el botón de arriba para bajar el archivo Nexor-Desktop-Windows.zip (~108 MB). Se guarda en tu carpeta de Descargas."
                />
                <Step
                    number={2}
                    icon={<Package size={18} />}
                    title="Descomprimir"
                    description="Click derecho en el ZIP → Extraer todo. Te va a crear una carpeta llamada Nexor WhatsApp Extractor-win32-x64. Podés mover esa carpeta a donde quieras (Escritorio, Documentos, etc)."
                />
                <Step
                    number={3}
                    icon={<Play size={18} />}
                    title="Ejecutar la app"
                    description={
                        <>
                            Abrí la carpeta y doble click en <code className="bg-white/10 px-1.5 py-0.5 rounded text-amber-400 font-mono text-[10px]">Nexor WhatsApp Extractor.exe</code>. La primera vez Windows puede mostrar un warning de SmartScreen — click en "Más información" → "Ejecutar de todas formas". Se abre una ventana con WhatsApp Web adentro, escaneás el QR con tu celular.
                        </>
                    }
                />
                <Step
                    number={4}
                    icon={<CheckCircle2 size={18} />}
                    title="Elegir qué exportar"
                    description="En el panel lateral, click en Grupos, Etiquetas o Todos los chats. Podés seleccionar con checkboxes y buscar por nombre."
                />
                <Step
                    number={5}
                    icon={<Package size={18} />}
                    title="Exportar"
                    description="Elegís si querés solo teléfonos o teléfono + nombre. Click en Exportar y guardás el CSV donde quieras."
                />
                <Step
                    number={6}
                    icon={<Upload size={18} />}
                    title="Subir al CRM"
                    description={
                        <>
                            Volvé a <Link href="/dashboard/crm/new" className="text-amber-400 underline">Nexor → CRM → Nueva campaña</Link>. Subís el CSV en la sección de Contactos y lanzás la campaña.
                        </>
                    }
                />
            </div>

            {/* Technical */}
            <div className="mt-8 bg-white/[0.03] border border-white/8 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                    <Code size={14} className="text-amber-400" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Cómo funciona técnicamente</p>
                </div>
                <ul className="space-y-2 text-xs text-white/60 leading-relaxed">
                    <li className="flex items-start gap-2">
                        <span className="text-amber-400 mt-0.5">•</span>
                        <span>Electron embebe un Chromium completo con WhatsApp Web cargado en un <code className="bg-white/10 px-1 py-0.5 rounded text-amber-400 text-[10px]">webview</code></span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-amber-400 mt-0.5">•</span>
                        <span>Inyecta un script que hace webpack module hunting para encontrar el Store interno de WhatsApp</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-amber-400 mt-0.5">•</span>
                        <span>Lee <code className="bg-white/10 px-1 py-0.5 rounded text-amber-400 text-[10px]">Store.Chat</code>, <code className="bg-white/10 px-1 py-0.5 rounded text-amber-400 text-[10px]">Store.Label</code> y <code className="bg-white/10 px-1 py-0.5 rounded text-amber-400 text-[10px]">Store.Contact</code> con los modelos reales</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-amber-400 mt-0.5">•</span>
                        <span>Los números vienen directamente de <code className="bg-white/10 px-1 py-0.5 rounded text-amber-400 text-[10px]">chat.id.user</code> — sin parsear DOM, sin LIDs, sin problemas</span>
                    </li>
                </ul>
            </div>

            {/* Privacy */}
            <div className="mt-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                    <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-white/70 leading-relaxed space-y-1.5">
                        <p><b className="text-amber-400">Privacidad:</b></p>
                        <ul className="space-y-1 list-disc pl-4">
                            <li>Todos los datos quedan en tu computadora, no se envían a ningún servidor</li>
                            <li>La sesión de WhatsApp se guarda localmente en el perfil de la app</li>
                            <li>El CSV se guarda donde vos elijas</li>
                            <li>Las etiquetas solo funcionan con <b className="text-white">WhatsApp Business</b></li>
                            <li>Solo exportá contactos de grupos donde tenés autorización</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}

function Feature({ icon, title, desc }: { icon: string; title: string; desc: string }) {
    return (
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-3">
            <div className="text-2xl mb-1">{icon}</div>
            <p className="text-xs font-bold text-white">{title}</p>
            <p className="text-[10px] text-white/40 mt-0.5">{desc}</p>
        </div>
    )
}

function Step({ number, icon, title, description }: {
    number: number
    icon: React.ReactNode
    title: string
    description: React.ReactNode
}) {
    return (
        <div className="flex gap-4 bg-white/[0.03] border border-white/8 rounded-2xl p-5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 relative">
                {icon}
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-black text-[10px] font-black flex items-center justify-center">
                    {number}
                </div>
            </div>
            <div className="flex-1">
                <p className="text-sm font-bold text-white mb-1">{title}</p>
                <p className="text-[12px] text-white/50 leading-relaxed">{description}</p>
            </div>
        </div>
    )
}
