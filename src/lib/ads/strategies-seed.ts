import { AdPlatform } from '@prisma/client'

export interface StrategySeedData {
    name: string
    description: string
    platform: AdPlatform
    objective: string
    destination: string
    mediaType: string
    mediaCount: number
    minBudgetUSD: number
    advantageType: string
    sortOrder: number
}

export const STRATEGIES_SEED: StrategySeedData[] = [
    // ── META · Instagram ────────────────────────────────────────────
    {
        name: 'Élite Advantage — Instagram',
        description: 'Máximo alcance en Instagram con Advantage+ de Meta. 20 imágenes para prueba A/B masiva.',
        platform: 'META',
        objective: 'conversions',
        destination: 'instagram',
        mediaType: 'image',
        mediaCount: 20,
        minBudgetUSD: 4,
        advantageType: 'advantage',
        sortOrder: 1
    },
    {
        name: 'Legión Advantage — Instagram',
        description: 'Campaña de conversiones en Instagram con audiencia Advantage+ y alto volumen de creativos.',
        platform: 'META',
        objective: 'conversions',
        destination: 'instagram',
        mediaType: 'image',
        mediaCount: 20,
        minBudgetUSD: 4,
        advantageType: 'advantage',
        sortOrder: 2
    },
    {
        name: 'Versátil Advantage — Instagram',
        description: 'Videos cortos en Instagram con Advantage+. Estrategia de alto engagement y conversión.',
        platform: 'META',
        objective: 'conversions',
        destination: 'instagram',
        mediaType: 'video',
        mediaCount: 10,
        minBudgetUSD: 4,
        advantageType: 'advantage',
        sortOrder: 3
    },
    {
        name: 'Gladiador Advantage — Instagram',
        description: 'Videos masivos en Instagram. La estrategia más potente para ventas directas.',
        platform: 'META',
        objective: 'conversions',
        destination: 'instagram',
        mediaType: 'video',
        mediaCount: 20,
        minBudgetUSD: 4,
        advantageType: 'advantage',
        sortOrder: 4
    },
    {
        name: 'Espartana Advantage — Instagram',
        description: 'Estrategia compacta de videos en Instagram. Ideal para empezar con bajo presupuesto.',
        platform: 'META',
        objective: 'conversions',
        destination: 'instagram',
        mediaType: 'video',
        mediaCount: 10,
        minBudgetUSD: 4,
        advantageType: 'advantage',
        sortOrder: 5
    },
    {
        name: 'Dominante Smart — Instagram',
        description: 'Segmentación inteligente por intereses en Instagram. 5 imágenes de alto impacto.',
        platform: 'META',
        objective: 'conversions',
        destination: 'instagram',
        mediaType: 'image',
        mediaCount: 5,
        minBudgetUSD: 4,
        advantageType: 'smart_segmentation',
        sortOrder: 6
    },

    // ── META · WhatsApp ──────────────────────────────────────────────
    {
        name: 'Blindada Advantage — WhatsApp',
        description: 'Máximo volumen de mensajes a WhatsApp con Advantage+. 20 imágenes para escalar.',
        platform: 'META',
        objective: 'conversions',
        destination: 'whatsapp',
        mediaType: 'image',
        mediaCount: 20,
        minBudgetUSD: 4,
        advantageType: 'advantage',
        sortOrder: 7
    },
    {
        name: 'Selección Smart — WhatsApp',
        description: 'Segmentación inteligente dirigida a WhatsApp. 10 imágenes y audiencia precisa.',
        platform: 'META',
        objective: 'conversions',
        destination: 'whatsapp',
        mediaType: 'image',
        mediaCount: 10,
        minBudgetUSD: 4,
        advantageType: 'smart_segmentation',
        sortOrder: 8
    },
    {
        name: 'Escudo Advantage — WhatsApp',
        description: 'Estrategia defensiva con imágenes y Advantage+. Costo por mensaje optimizado.',
        platform: 'META',
        objective: 'conversions',
        destination: 'whatsapp',
        mediaType: 'image',
        mediaCount: 10,
        minBudgetUSD: 4,
        advantageType: 'advantage',
        sortOrder: 9
    },
    {
        name: 'Vanguardia Advantage — WhatsApp',
        description: 'Videos de alto impacto que dirigen a WhatsApp. 20 videos para máxima cobertura.',
        platform: 'META',
        objective: 'conversions',
        destination: 'whatsapp',
        mediaType: 'video',
        mediaCount: 20,
        minBudgetUSD: 4,
        advantageType: 'advantage',
        sortOrder: 10
    },
    {
        name: 'Magnética Smart — WhatsApp',
        description: 'Videos con segmentación inteligente por intereses. 10 videos hipersegmentados.',
        platform: 'META',
        objective: 'conversions',
        destination: 'whatsapp',
        mediaType: 'video',
        mediaCount: 10,
        minBudgetUSD: 4,
        advantageType: 'smart_segmentation',
        sortOrder: 11
    },
    {
        name: 'Flujo Advantage — WhatsApp',
        description: 'Flujo continuo de mensajes a WhatsApp con videos y Advantage+.',
        platform: 'META',
        objective: 'conversions',
        destination: 'whatsapp',
        mediaType: 'video',
        mediaCount: 10,
        minBudgetUSD: 4,
        advantageType: 'advantage',
        sortOrder: 12
    },
    {
        name: 'Imperial Smart — WhatsApp',
        description: 'Estrategia premium de 5 videos con segmentación de audiencia precisa.',
        platform: 'META',
        objective: 'conversions',
        destination: 'whatsapp',
        mediaType: 'video',
        mediaCount: 5,
        minBudgetUSD: 4,
        advantageType: 'smart_segmentation',
        sortOrder: 13
    },

    // ── META · Sitio Web ─────────────────────────────────────────────
    {
        name: 'Élite Web Advantage',
        description: 'Máximas conversiones en sitio web con Advantage+. 20 imágenes para escala masiva.',
        platform: 'META',
        objective: 'conversions',
        destination: 'website',
        mediaType: 'image',
        mediaCount: 20,
        minBudgetUSD: 4,
        advantageType: 'advantage',
        sortOrder: 14
    },
    {
        name: 'Relámpago Advantage — Web',
        description: 'Conversiones rápidas al sitio web con imágenes y Advantage+. Rápido encendido.',
        platform: 'META',
        objective: 'conversions',
        destination: 'website',
        mediaType: 'image',
        mediaCount: 10,
        minBudgetUSD: 4,
        advantageType: 'advantage',
        sortOrder: 15
    },
    {
        name: 'Radar Smart — Web',
        description: 'Segmentación inteligente hacia sitio web. Audiencias de alto valor de compra.',
        platform: 'META',
        objective: 'conversions',
        destination: 'website',
        mediaType: 'image',
        mediaCount: 10,
        minBudgetUSD: 4,
        advantageType: 'smart_segmentation',
        sortOrder: 16
    },
    {
        name: 'Leonidas Advantage — Web',
        description: 'Videos masivos hacia sitio web. La estrategia definitiva para e-commerce.',
        platform: 'META',
        objective: 'conversions',
        destination: 'website',
        mediaType: 'video',
        mediaCount: 20,
        minBudgetUSD: 4,
        advantageType: 'advantage',
        sortOrder: 17
    },
    {
        name: 'Asalto Smart — Web',
        description: 'Ataque preciso con 5 videos y segmentación inteligente hacia tu tienda online.',
        platform: 'META',
        objective: 'conversions',
        destination: 'website',
        mediaType: 'video',
        mediaCount: 5,
        minBudgetUSD: 4,
        advantageType: 'smart_segmentation',
        sortOrder: 18
    },

    // ── META · Leads ─────────────────────────────────────────────────
    {
        name: 'Captación Élite — Formulario',
        description: 'Generación de leads con formulario nativo de Meta. Alta tasa de conversión.',
        platform: 'META',
        objective: 'leads',
        destination: 'website',
        mediaType: 'image',
        mediaCount: 10,
        minBudgetUSD: 4,
        advantageType: 'advantage',
        sortOrder: 19
    },
    {
        name: 'Formulario Pro Smart',
        description: 'Leads de calidad con segmentación por intereses y formulario nativo.',
        platform: 'META',
        objective: 'leads',
        destination: 'website',
        mediaType: 'image',
        mediaCount: 5,
        minBudgetUSD: 4,
        advantageType: 'smart_segmentation',
        sortOrder: 20
    },

    // ── META · Messenger ─────────────────────────────────────────────
    {
        name: 'Mensajero Advantage',
        description: 'Conversaciones directas vía Messenger con Advantage+. Cierra ventas en el chat.',
        platform: 'META',
        objective: 'leads',
        destination: 'messenger',
        mediaType: 'image',
        mediaCount: 10,
        minBudgetUSD: 4,
        advantageType: 'advantage',
        sortOrder: 21
    },
    {
        name: 'Diálogo Smart — Messenger',
        description: 'Videos que generan conversaciones en Messenger. Segmentación de alto potencial.',
        platform: 'META',
        objective: 'leads',
        destination: 'messenger',
        mediaType: 'video',
        mediaCount: 10,
        minBudgetUSD: 4,
        advantageType: 'smart_segmentation',
        sortOrder: 22
    },
]
