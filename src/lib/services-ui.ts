/**
 * Metadatos de UI de cada servicio (íconos, colores, ruta). El estado active/nombre/desc
 * viene del catálogo en la DB; esto solo aporta lo visual, mapeado por `key`.
 */
export interface ServiceUI {
  href: string
  icon: string       // FontAwesome (dashboard cards)
  iconClass: string  // FontAwesome (navbar)
  color: string
  glow: string
  sub: string
}

export const SERVICE_UI: Record<string, ServiceUI> = {
  whatsapp: {
    href: '/dashboard/services/whatsapp',
    icon: 'fa-solid fa-robot', iconClass: 'fa-solid fa-robot',
    color: '#F59E0B', glow: 'rgba(245,158,11,0.12)', sub: 'WhatsApp · Ventas automáticas',
  },
  social: {
    href: '/dashboard/services/social',
    icon: 'fa-solid fa-satellite-dish', iconClass: 'fa-solid fa-satellite-dish',
    color: '#818CF8', glow: 'rgba(129,140,248,0.12)', sub: 'Redes sociales · Programación',
  },
  ads: {
    href: '/dashboard/services/ads',
    icon: 'fa-solid fa-chart-line', iconClass: 'fa-solid fa-chart-line',
    color: '#34D399', glow: 'rgba(52,211,153,0.12)', sub: 'Meta Ads · IA',
  },
  crm: {
    href: '/dashboard/crm',
    icon: 'fa-solid fa-paper-plane', iconClass: 'fa-solid fa-bullhorn',
    color: '#22D3EE', glow: 'rgba(34,211,238,0.12)', sub: 'WhatsApp · Envíos masivos',
  },
  'image-studio': {
    href: '/dashboard/services/image-studio',
    icon: 'fa-solid fa-wand-magic-sparkles', iconClass: 'fa-solid fa-wand-magic-sparkles',
    color: '#E879F9', glow: 'rgba(232,121,249,0.12)', sub: 'IA · Imágenes similares',
  },
  formularios: {
    href: '/dashboard/formularios',
    icon: 'fa-solid fa-clipboard-list', iconClass: 'fa-solid fa-clipboard-list',
    color: '#60A5FA', glow: 'rgba(96,165,250,0.12)', sub: 'Encuestas y registros',
  },
}
