'use client'

import Link from 'next/link'
import { ArrowLeft, Globe, Search, Puzzle, Download, Upload, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react'

export default function ExtensionGuidePage() {
    return (
        <div className="px-4 md:px-6 pt-6 max-w-2xl mx-auto pb-24 text-white">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/crm/export" className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                    <ArrowLeft size={16} />
                </Link>
                <div>
                    <h1 className="text-xl font-black uppercase tracking-tighter">Guía de Exportación</h1>
                    <p className="text-white/30 text-xs mt-0.5">Exportá contactos desde WhatsApp Web</p>
                </div>
            </div>

            {/* Intro */}
            <div className="bg-gradient-to-br from-amber-500/5 via-amber-600/5 to-yellow-500/5 border border-amber-500/20 rounded-2xl p-5 mb-6">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                        <Globe size={20} className="text-amber-400" />
                    </div>
                    <div>
                        <p className="text-sm font-black mb-1">WA Group Contact Exporter</p>
                        <p className="text-[11px] text-white/50 leading-relaxed">
                            Extensión gratis de Globe Web Store que extrae contactos de grupos y etiquetas de WhatsApp Web con los números reales. Después subís el Excel al CRM.
                        </p>
                    </div>
                </div>
            </div>

            {/* Pasos */}
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Pasos</p>
            <div className="space-y-4">
                <Step
                    number={1}
                    icon={<Search size={18} />}
                    title="Buscar la extensión en Globe Web Store"
                    description={
                        <>
                            Abrí la Globe Web Store y buscá <b className="text-amber-400">"WA Group Contact Exporter"</b>. También podés buscar alternativas como <i>"WhatsApp Group Extractor"</i> o <i>"WAPlus Sender"</i>.
                        </>
                    }
                    action={
                        <a
                            href="https://chromewebstore.google.com/search/WA%20Group%20Contact%20Exporter"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-bold text-amber-400 hover:text-amber-300"
                        >
                            Abrir Globe Web Store <ExternalLink size={10} />
                        </a>
                    }
                />

                <Step
                    number={2}
                    icon={<Puzzle size={18} />}
                    title="Instalar"
                    description="Click en 'Añadir a Globe' → 'Añadir extensión'. Se instala en 1 segundo y aparece en la barra de extensiones."
                />

                <Step
                    number={3}
                    icon={<Globe size={18} />}
                    title="Abrir WhatsApp Web"
                    description={
                        <>
                            Andá a <code className="bg-white/10 px-1.5 py-0.5 rounded text-amber-400 font-mono text-[10px]">web.whatsapp.com</code> y escaneá el QR con tu celular. Esperá que carguen todos los chats.
                        </>
                    }
                />

                <Step
                    number={4}
                    icon={<Download size={18} />}
                    title="Exportar contactos"
                    description="Abrí la extensión desde la barra de Globe. Elegí el grupo o etiqueta, click en 'Export' y descargá el archivo CSV/Excel con los números y nombres."
                />

                <Step
                    number={5}
                    icon={<Upload size={18} />}
                    title="Subir al CRM de Nexor"
                    description={
                        <>
                            Volvé a <Link href="/dashboard/crm/new" className="text-amber-400 underline">Nexor → CRM → Nueva campaña</Link>. En la sección "Contactos", subí el archivo Excel/CSV descargado. Los contactos aparecen listos para enviar.
                        </>
                    }
                />

                <Step
                    number={6}
                    icon={<CheckCircle2 size={18} />}
                    title="Listo"
                    description="Configurás el mensaje, la IA, los archivos multimedia y lanzás la campaña."
                />
            </div>

            {/* Alternativas */}
            <div className="mt-8 bg-white/[0.03] border border-white/8 rounded-2xl p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Otras extensiones que también sirven</p>
                <ul className="space-y-2 text-xs text-white/60">
                    <li className="flex items-start gap-2">
                        <span className="text-amber-400 mt-0.5">•</span>
                        <div>
                            <b className="text-white">WAPlus Sender</b> — Más completa, exporta grupos + etiquetas + permite enviar mensajes. Versión gratis con límites.
                        </div>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-amber-400 mt-0.5">•</span>
                        <div>
                            <b className="text-white">WA Toolkit</b> — Suite de herramientas para WhatsApp Web, incluye exportación.
                        </div>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-amber-400 mt-0.5">•</span>
                        <div>
                            <b className="text-white">Contact Exporter for WhatsApp</b> — Simple y directa, solo para exportar contactos.
                        </div>
                    </li>
                </ul>
            </div>

            {/* Warnings */}
            <div className="mt-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                    <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-white/70 leading-relaxed space-y-1.5">
                        <p><b className="text-amber-400">Importante:</b></p>
                        <ul className="space-y-1 list-disc pl-4">
                            <li>Estas extensiones son de terceros — Nexor no garantiza su funcionamiento</li>
                            <li>Las etiquetas solo funcionan con <b className="text-white">WhatsApp Business</b></li>
                            <li>Revisá los permisos que pide cada extensión antes de instalarla</li>
                            <li>Solo exportá contactos de grupos donde tenés autorización</li>
                            <li>Una vez exportado el Excel, subilo en la <Link href="/dashboard/crm/new" className="text-amber-400 underline">nueva campaña</Link></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}

function Step({ number, icon, title, description, action }: {
    number: number
    icon: React.ReactNode
    title: string
    description: React.ReactNode
    action?: React.ReactNode
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
                {action}
            </div>
        </div>
    )
}
