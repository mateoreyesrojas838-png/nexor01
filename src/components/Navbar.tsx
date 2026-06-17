'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NotificationBell from './NotificationBell'

const navItems: { href: string; iconClass: string; label: string; serviceKey?: string }[] = [
  { href: '/dashboard', iconClass: 'fa-solid fa-house', label: 'Inicio' },
  { href: '/dashboard/services/whatsapp', iconClass: 'fa-solid fa-robot', label: 'Agentes AI', serviceKey: 'whatsapp' },
  { href: '/dashboard/crm', iconClass: 'fa-solid fa-bullhorn', label: 'CRM', serviceKey: 'crm' },
  { href: '/dashboard/cursos', iconClass: 'fa-solid fa-graduation-cap', label: 'Cursos' },
  { href: '/dashboard/formularios', iconClass: 'fa-solid fa-clipboard-list', label: 'Formularios', serviceKey: 'formularios' },
  { href: '/dashboard/credits', iconClass: 'fa-solid fa-bolt', label: 'Créditos' },
  { href: '/dashboard/services/social', iconClass: 'fa-solid fa-satellite-dish', label: 'Publisher', serviceKey: 'social' },
  { href: '/dashboard/services/ads', iconClass: 'fa-solid fa-chart-line', label: 'Ads', serviceKey: 'ads' },
  { href: '/dashboard/services/image-studio', iconClass: 'fa-solid fa-wand-magic-sparkles', label: 'Imágenes', serviceKey: 'image-studio' },
  { href: '/dashboard/herramientas', iconClass: 'fa-solid fa-toolbox', label: 'Herramientas', serviceKey: 'herramientas' },
]

// Secciones del servicio Herramientas (menú colapsable)
const TOOLS_SECTIONS = [
  { key: 'CATALOGO', label: 'Catálogo', icon: 'fa-solid fa-table-cells-large' },
  { key: 'TESTIMONIO', label: 'Testimonios', icon: 'fa-solid fa-quote-right' },
  { key: 'PROMOCION', label: 'Promociones', icon: 'fa-solid fa-bullhorn' },
  { key: 'BIBLIOTECA', label: 'Biblioteca', icon: 'fa-solid fa-book' },
  { key: 'GUION', label: 'Guiones', icon: 'fa-solid fa-file-lines' },
]

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' })
  window.location.href = '/login'
}

export default function Navbar() {
  const pathname = usePathname()
  const [activeKeys, setActiveKeys] = useState<Set<string> | null>(null)
  const [creditsEnabled, setCreditsEnabled] = useState(true)
  const [toolsOpen, setToolsOpen] = useState(false)

  useEffect(() => {
    if (pathname.startsWith('/dashboard/herramientas')) setToolsOpen(true)
  }, [pathname])

  useEffect(() => {
    fetch('/api/services').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.services) setActiveKeys(new Set(d.services.map((s: any) => s.key)))
    }).catch(() => {})
    fetch('/api/settings').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.settings) setCreditsEnabled(d.settings.CREDITS_ENABLED !== 'false')
    }).catch(() => {})
  }, [])

  // Mientras carga (null) mostramos todo; ya cargado, ocultamos los servicios desactivados
  const items = navItems.filter(it => {
    if (it.href === '/dashboard/credits' && !creditsEnabled) return false
    return !it.serviceKey || !activeKeys || activeKeys.has(it.serviceKey)
  })

  return (
    <>
      {/* ── SIDEBAR DESKTOP ── */}
      <aside className="sidebar hidden lg:flex" aria-label="Barra lateral">
        <Link href="/dashboard" className="sidebar__logo">
          <div className="sidebar__logo-ring">
            <img src="/logo.png" alt="Nexor" />
          </div>
          <div className="sidebar__logo-info">
            <span className="sidebar__logo-jd">NEXOR</span>
            <span className="sidebar__logo-intl">PLATFORM</span>
            <span className="sidebar__logo-badge"><span className="u-live-dot"></span>&nbsp;Premium</span>
          </div>
        </Link>

        <nav className="sidebar__nav" aria-label="Menú">
          {items.map(item => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

            // Herramientas → menú colapsable con sus secciones
            if (item.serviceKey === 'herramientas') {
              return (
                <div key="herramientas">
                  <button
                    onClick={() => setToolsOpen(o => !o)}
                    className={`nav-item ${isActive ? 'nav-item--active' : ''}`}
                    style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <span className="nav-item__icon"><i className={item.iconClass}></i></span>
                    <span className="nav-item__label">{item.label}</span>
                    <i className={`fa-solid fa-chevron-${toolsOpen ? 'up' : 'down'}`} style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.5 }}></i>
                  </button>
                  {toolsOpen && (
                    <div style={{ marginLeft: 14, borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: 6, marginTop: 2, marginBottom: 4 }}>
                      {TOOLS_SECTIONS.map(s => (
                        <Link key={s.key} href={`/dashboard/herramientas?s=${s.key}`} className="nav-item" style={{ paddingTop: 7, paddingBottom: 7 }}>
                          <span className="nav-item__icon"><i className={s.icon} style={{ fontSize: 12 }}></i></span>
                          <span className="nav-item__label" style={{ fontSize: 13 }}>{s.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive ? 'nav-item--active' : ''}`}
              >
                <span className="nav-item__icon"><i className={item.iconClass}></i></span>
                <span className="nav-item__label">{item.label}</span>
                <span className="nav-item__dot"></span>
              </Link>
            )
          })}
          <div className="sidebar__nav-sep"></div>
          <Link href="/dashboard/settings" className={`nav-item ${pathname === '/dashboard/settings' ? 'nav-item--active' : ''}`}>
            <span className="nav-item__icon"><i className="fa-solid fa-gear"></i></span>
            <span className="nav-item__label">Configuración</span>
            <span className="nav-item__dot"></span>
          </Link>
          <button onClick={logout} className="nav-item" style={{ width:'100%', background:'none', border:'none', cursor:'pointer', color:'rgba(255,100,100,0.8)' }}>
            <span className="nav-item__icon"><i className="fa-solid fa-right-from-bracket"></i></span>
            <span className="nav-item__label">Salir</span>
          </button>
        </nav>

        <div className="sidebar__user">
          <NotificationBell />
          <div className="sidebar__user-av" id="dAvatar"><i className="fa-solid fa-user"></i></div>
          <div>
            <p className="sidebar__user-name">Usuario</p>
            <p className="sidebar__user-role">@user · <span style={{ color: 'var(--clr-accent-lt)' }}>Activo</span></p>
          </div>
        </div>
      </aside>

      {/* ── BARRA MÓVIL ── */}
      <nav className="bottom-nav lg:hidden" aria-label="Navegación principal">
        {items.map(item => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`bnav__item ${isActive ? 'bnav__item--active' : ''}`}
            >
              <i className={item.iconClass}></i>
              {item.label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}

