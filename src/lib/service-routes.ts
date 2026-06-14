// Mapa prefijo de API → key de servicio. Pure/edge-safe (sin imports de Node).
// Usado por el middleware para saber qué servicio protege cada ruta.
export const GATED_API_PREFIXES: Record<string, string> = {
  '/api/bots': 'whatsapp',
  '/api/ads': 'ads',
  '/api/social': 'social',
  '/api/crm': 'crm',
  '/api/image-studio': 'image-studio',
  // Solo la gestión del dueño. El formulario público (/api/forms/[slug]) queda
  // abierto para que cualquiera pueda llenarlo y enviarlo sin cuenta.
  '/api/my-forms': 'formularios',
}

/** Devuelve la key del servicio que protege esta ruta de API, o null si no está gateada. */
export function serviceKeyForApiPath(pathname: string): string | null {
  for (const prefix in GATED_API_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) return GATED_API_PREFIXES[prefix]
  }
  return null
}
