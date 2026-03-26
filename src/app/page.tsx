'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bot, TrendingUp, Megaphone, Store, Layers, ArrowRight, CheckCircle2, Globe, Users, BarChart3, Star, Quote, GraduationCap, Share2, Package } from 'lucide-react'
import TiltCard from '@/components/TiltCard'

// ─────────────────────────────────────────────────────────────────────────────
// PARTICLE CANVAS
// ─────────────────────────────────────────────────────────────────────────────
function ParticleCanvas({ mouseRef }: { mouseRef: React.MutableRefObject<{x:number,y:number}> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    let animId: number
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize(); window.addEventListener('resize', resize)
    type P = { x:number; y:number; vx:number; vy:number; r:number; alpha:number }
    const pts: P[] = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random()-.5)*.32, vy: (Math.random()-.5)*.32,
      r: Math.random()*1.4+.4, alpha: Math.random()*.45+.12,
    }))
    const frame = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height)
      const mx = mouseRef.current.x, my = mouseRef.current.y
      for (const p of pts) {
        const dx=p.x-mx, dy=p.y-my, d2=dx*dx+dy*dy
        if (d2<10000) { const d=Math.sqrt(d2),f=(100-d)/100; p.vx+=(dx/d)*f*.22; p.vy+=(dy/d)*f*.22 }
        p.vx*=.986; p.vy*=.986; p.x+=p.vx; p.y+=p.vy
        if(p.x<0)p.x=canvas.width; if(p.x>canvas.width)p.x=0
        if(p.y<0)p.y=canvas.height; if(p.y>canvas.height)p.y=0
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2)
        ctx.fillStyle=`rgba(255,215,0,${p.alpha})`; ctx.fill()
      }
      for (let i=0;i<pts.length;i++) for (let j=i+1;j<pts.length;j++) {
        const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y, d=Math.sqrt(dx*dx+dy*dy)
        if (d<130) { ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y); ctx.strokeStyle=`rgba(255,215,0,${(1-d/130)*.1})`; ctx.lineWidth=.5; ctx.stroke() }
      }
      animId = requestAnimationFrame(frame)
    }
    frame()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize',resize) }
  }, [mouseRef])
  return <canvas ref={canvasRef} style={{ position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:0 }} />
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED COUNTER
// ─────────────────────────────────────────────────────────────────────────────
function Counter({ target, suffix, visible }: { target:number; suffix:string; visible:boolean }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!visible) return
    let cur=0; const step=Math.max(1,Math.floor(target/80))
    const t=setInterval(()=>{ cur=Math.min(cur+step,target); setVal(cur); if(cur>=target)clearInterval(t) },14)
    return ()=>clearInterval(t)
  },[visible,target])
  return <>{val.toLocaleString()}{suffix}</>
}

// ─────────────────────────────────────────────────────────────────────────────
// HUD CORNERS
// ─────────────────────────────────────────────────────────────────────────────
function HudCorners({ color='#FFD700', size=10 }: { color?:string; size?:number }) {
  const s: React.CSSProperties = { position:'absolute', width:size, height:size, borderColor:color, borderStyle:'solid', opacity:.55 }
  return (
    <>
      <div style={{ ...s, top:5, left:5,  borderWidth:'1px 0 0 1px' }} />
      <div style={{ ...s, top:5, right:5, borderWidth:'1px 1px 0 0' }} />
      <div style={{ ...s, bottom:5, left:5,  borderWidth:'0 0 1px 1px' }} />
      <div style={{ ...s, bottom:5, right:5, borderWidth:'0 1px 1px 0' }} />
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// REVIEW CARD
// ─────────────────────────────────────────────────────────────────────────────
const REVIEWS = [
  { name:'María González',  country:'México',    flag:'🇲🇽', avatar:'MG', color:'#00FF88', role:'Emprendedora digital',   text:'¡Esta plataforma transformó mi negocio! Los bots de WhatsApp venden mientras duermo. Llevo 4 meses y ya recuperé mi inversión.' },
  { name:'Carlos Mendoza',  country:'Colombia',  flag:'🇨🇴', avatar:'CM', color:'#FFD700', role:'Marketing Digital',       text:'Las campañas de Meta Ads con IA me ahorran horas de trabajo. Mi negocio creció un 300% en solo 3 meses. Increíble herramienta.' },
  { name:'Ana Paula Silva', country:'Brasil',    flag:'🇧🇷', avatar:'AP', color:'#B45309', role:'Empresária',              text:'A melhor plataforma que já usei! Os bots funcionam perfeitamente e o suporte é incrível. Recomendo para todos os empreendedores!' },
  { name:'James Rivera',    country:'USA',       flag:'🇺🇸', avatar:'JR', color:'#FFD700', role:'Online Business Owner',   text:'Absolutely game-changing! The AI-powered bots handle my customers 24/7. My sales doubled in the first month alone.' },
  { name:'Luisa Fernández', country:'Venezuela', flag:'🇻🇪', avatar:'LF', color:'#00FF88', role:'Vendedora online',        text:'Tengo mi propia tienda virtual y mis bots trabajan por mí. La mejor decisión de mi vida fue unirme a Nexor.' },
  { name:'Diego Sánchez',   country:'Argentina', flag:'🇦🇷', avatar:'DS', color:'#B45309', role:'Empresario',              text:'Los bots de WhatsApp son una locura. Automaticé mis ventas y ahora me dedico a escalar. El sistema de comisiones paga muy bien.' },
  { name:'Sofía Lagos',     country:'Chile',     flag:'🇨🇱', avatar:'SL', color:'#FFD700', role:'Emprendedora',            text:'Comencé hace 3 meses sin experiencia y ya tengo ingresos constantes. La plataforma es intuitiva y el soporte siempre responde rápido.' },
  { name:'Roberto Castillo',country:'Perú',      flag:'🇵🇪', avatar:'RC', color:'#00FF88', role:'Networker',               text:'El sistema de comisiones es muy transparente. Mis referidos crecen mes a mes y los retiros llegan puntual siempre. Muy satisfecho.' },
  { name:'Valentina Moreno',country:'Ecuador',   flag:'🇪🇨', avatar:'VM', color:'#B45309', role:'Coach de negocios',       text:'La atención al cliente es excepcional y las herramientas de IA son de otro nivel. Mi landing page convierte el doble que antes.' },
  { name:'Felipe Aguirre',  country:'España',    flag:'🇪🇸', avatar:'FA', color:'#FFD700', role:'Consultor digital',       text:'Desde España me parece increíble el alcance en LATAM. Los bots y campañas de Google Ads funcionan de maravilla.' },
  { name:'Isabella Costa',  country:'Brasil',    flag:'🇧🇷', avatar:'IC', color:'#00FF88', role:'Influencer de negócios',  text:'Que plataforma incrível! Automatizei todo meu negócio com bots e landing pages. Já indiquei para mais de 20 pessoas!' },
  { name:'Andrés Torres',   country:'Bolivia',   flag:'🇧🇴', avatar:'AT', color:'#B45309', role:'Comerciante',             text:'Nunca pensé que tendría mi propio sistema automatizado. Los bots de WhatsApp son lo mejor que le pasó a mi negocio.' },
]
const ROW1 = REVIEWS.slice(0,6), ROW2 = REVIEWS.slice(6,12)

function ReviewCard({ r }: { r: typeof REVIEWS[0] }) {
  return (
    <div className="review-card-anim" style={{ '--cg': r.color + '45' } as React.CSSProperties & Record<string,string>}>
      <div style={{ flexShrink:0, width:296, background:`linear-gradient(135deg, ${r.color}09, rgba(255,255,255,0.012))`, border:`1px solid ${r.color}20`, borderRadius:20, padding:'20px 22px', position:'relative', overflow:'hidden', marginRight:14, cursor:'default', transition:'transform .25s, border-color .25s' }}>
        <div style={{ position:'absolute', top:0, left:20, right:20, height:1, background:`linear-gradient(90deg, transparent, ${r.color}60, transparent)` }} />
        <HudCorners color={r.color} size={8} />
        <div style={{ position:'absolute', top:12, right:14, opacity:.07 }}><Quote size={28} style={{ color:r.color }} /></div>
        <div style={{ display:'flex', gap:3, marginBottom:12 }}>
          {[0,1,2,3,4].map(i => <Star key={i} size={12} style={{ color:'#FFD700', fill:'#FFD700' }} />)}
        </div>
        <p style={{ fontSize:11.5, lineHeight:1.75, color:'rgba(255,255,255,0.58)', marginBottom:16, minHeight:76 }}>"{r.text}"</p>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:'50%', background:`linear-gradient(135deg, ${r.color}28, ${r.color}10)`, border:`1px solid ${r.color}40`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <span style={{ fontSize:10, fontWeight:800, color:r.color }}>{r.avatar}</span>
          </div>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ fontSize:12, fontWeight:700, color:'#fff' }}>{r.name}</span>
              <span style={{ fontSize:13 }}>{r.flag}</span>
            </div>
            <span style={{ fontSize:10, color:'rgba(255,255,255,0.33)' }}>{r.role} · {r.country}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon:Bot,           title:'Bots de WhatsApp con IA',  desc:'Atiende, asesora y cierra ventas automáticamente 24/7. Tus clientes siempre tendrán respuesta, incluso mientras duermes.',               color:'#00FF88', glow:'rgba(0,255,136,0.18)' },
  { icon:Megaphone,     title:'Publicidad Digital con IA', desc:'Crea y lanza campañas en Meta, Google y TikTok Ads en minutos. La IA optimiza tu presupuesto y maximiza tu ROI.',                        color:'#FFD700', glow:'rgba(255,215,0,0.18)' },
  { icon:Store,         title:'Tu Tienda Virtual',         desc:'Vende tus productos con tu propia tienda online personalizada. Pasarela de pago integrada, lista en minutos.',                             color:'#B45309', glow:'rgba(155,0,255,0.18)' },
  { icon:Layers,        title:'Landing Pages con IA',      desc:'Genera páginas de ventas profesionales en segundos. Capta leads y convierte visitas en clientes reales con IA.',                          color:'#00FF88', glow:'rgba(0,255,136,0.18)' },
  { icon:GraduationCap, title:'Cursos en Línea',           desc:'Accede a cursos exclusivos de marketing, ventas y negocios digitales. Aprende a tu ritmo y aplica desde el primer día.',                  color:'#FFD700', glow:'rgba(255,215,0,0.18)' },
  { icon:Share2,        title:'Publicador Social',          desc:'Programa y publica contenido en múltiples redes sociales desde un solo panel. Ahorra horas con automatización inteligente.',             color:'#B45309', glow:'rgba(155,0,255,0.18)' },
  { icon:Package,       title:'Tienda de Productos',       desc:'Compra productos físicos directamente en la plataforma. Seguimiento de pedido, entrega a domicilio y pago en USDT o comprobante.',       color:'#00FF88', glow:'rgba(0,255,136,0.18)' },
  { icon:TrendingUp,    title:'Panel de Comisiones',       desc:'Visualiza tus ganancias en tiempo real, solicita retiros y gestiona tu billetera digital. Transparente y al instante.',                   color:'#FFD700', glow:'rgba(255,215,0,0.18)' },
  { icon:Globe,         title:'Red Internacional',          desc:'Construye tu equipo en toda Latinoamérica. Gana comisiones por cada referido activo y genera ingresos pasivos sostenidos.',              color:'#B45309', glow:'rgba(155,0,255,0.18)' },
]
const STATS = [
  { icon:Users,        value:5000, suffix:'+',   label:'Miembros activos' },
  { icon:Bot,          value:24,   suffix:'/7',  label:'Automatización' },
  { icon:BarChart3,    value:3,    suffix:' Ads', label:'Plataformas' },
  { icon:CheckCircle2, value:2,    suffix:' min', label:'Para empezar' },
]
const HOW = [
  { step:'01', title:'Regístrate en 2 minutos', desc:'Crea tu cuenta con el código de un miembro activo. Sin tarjeta de crédito, sin complicaciones. Solo tus datos básicos y listo.', color:'#FFD700', tag:'Gratis' },
  { step:'02', title:'Elige tu plan',           desc:'Selecciona el pack que mejor se ajuste a tu objetivo — Básico, Pro o Elite. Cada plan desbloquea más herramientas y mayor potencial de ganancias.', color:'#00FF88', tag:'Desde $49 USDT' },
  { step:'03', title:'Configura tus herramientas', desc:'Activa tu bot de WhatsApp, crea tu landing page, sube tus productos. Cada herramienta tiene su guía paso a paso. Sin conocimientos técnicos.', color:'#B45309', tag:'Guiado' },
  { step:'04', title:'Genera ingresos y escala', desc:'Invita a tu red, automatiza tus ventas y cobra comisiones en tiempo real. Cuanto más activo seas, más crece tu ecosistema digital.', color:'#00FF88', tag:'Ingreso pasivo' },
]

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const mouseRef  = useRef({ x:-9999, y:-9999 })
  const heroRef   = useRef<HTMLElement>(null)
  const statsRef  = useRef<HTMLElement>(null)
  const featRef   = useRef<HTMLElement>(null)
  const [statsVisible, setStatsVisible] = useState(false)
  const [featVisible,  setFeatVisible]  = useState(false)

  useEffect(() => {
    const hero = heroRef.current; if (!hero) return
    const h = (e: MouseEvent) => { const r=hero.getBoundingClientRect(); mouseRef.current={x:e.clientX-r.left,y:e.clientY-r.top} }
    hero.addEventListener('mousemove',h)
    hero.addEventListener('mouseleave',()=>{ mouseRef.current={x:-9999,y:-9999} })
    return ()=>hero.removeEventListener('mousemove',h)
  },[])

  useEffect(() => {
    const ob=new IntersectionObserver(([e])=>{ if(e.isIntersecting){setStatsVisible(true);ob.disconnect()} },{threshold:.3})
    if(statsRef.current) ob.observe(statsRef.current)
    return ()=>ob.disconnect()
  },[])

  useEffect(() => {
    const ob=new IntersectionObserver(([e])=>{ if(e.isIntersecting){setFeatVisible(true);ob.disconnect()} },{threshold:.08})
    if(featRef.current) ob.observe(featRef.current)
    return ()=>ob.disconnect()
  },[])

  return (
    <div style={{ background:'#060710', fontFamily:"'Inter', system-ui, sans-serif", color:'#fff', minHeight:'100vh', overflowX:'hidden' }}>

      <style>{`
        /* ── BUTTON ANIMATIONS ─────────────────────────────────── */
        @keyframes btn-grad {
          0%,100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        .btn-primary {
          background: linear-gradient(135deg, #FFD700, #00FF88, #B45309, #FFD700) !important;
          background-size: 300% 300% !important;
          animation: btn-grad 4s ease infinite !important;
          transition: transform .18s, opacity .18s !important;
          color: #000 !important;
          font-weight: 700 !important;
          min-width: 180px !important;
          justify-content: center !important;
          box-sizing: border-box !important;
        }
        .btn-primary:hover { transform: translateY(-2px) !important; opacity: .9 !important; }
        .btn-primary::after {
          content: none;
        }
        .btn-secondary {
          transition: all .2s !important;
          min-width: 180px !important;
          justify-content: center !important;
          box-sizing: border-box !important;
        }
        .btn-secondary:hover {
          background: rgba(255,255,255,0.08) !important;
          border-color: rgba(255,255,255,0.3) !important;
          color: #fff !important;
          transform: translateY(-2px) !important;
        }

        /* ── CARD DISPLACEMENT ANIMATIONS ─────────────────────── */
        @keyframes cd-up    { 0%,100%{transform:translateY(0)}        50%{transform:translateY(-10px)} }
        @keyframes cd-down  { 0%,100%{transform:translateY(0)}        50%{transform:translateY(8px)} }
        @keyframes cd-left  { 0%,100%{transform:translateX(0)}        50%{transform:translateX(-8px)} }
        @keyframes cd-right { 0%,100%{transform:translateX(0)}        50%{transform:translateX(8px)} }
        @keyframes cd-diag  { 0%,100%{transform:translate(0,0)}       50%{transform:translate(6px,-8px)} }
        @keyframes cd-diag2 { 0%,100%{transform:translate(0,0)}       50%{transform:translate(-6px,8px)} }
        .cd-up    { animation: cd-up    5s ease-in-out infinite; }
        .cd-down  { animation: cd-down  6s ease-in-out infinite; }
        .cd-left  { animation: cd-left  7s ease-in-out infinite; }
        .cd-right { animation: cd-right 5.5s ease-in-out infinite; }
        .cd-diag  { animation: cd-diag  6.5s ease-in-out infinite; }
        .cd-diag2 { animation: cd-diag2 7.5s ease-in-out infinite; }

        /* ── MISC ──────────────────────────────────────────────── */
        @keyframes float-b  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes float-a  { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-18px) scale(1.04)} }
        @keyframes shimmer-star { 0%,100%{filter:drop-shadow(0 0 2px #FFD700)} 50%{filter:drop-shadow(0 0 10px #FFD700) drop-shadow(0 0 20px rgba(255,165,0,.5))} }
        @keyframes slide-up { from{opacity:0;transform:translateY(36px)} to{opacity:1;transform:translateY(0)} }
        @keyframes reveal-card { from{opacity:0;transform:translateY(28px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        .feat-card { opacity:0; }
        .feat-card.visible { animation: reveal-card .55s cubic-bezier(.22,1,.36,1) both; }
        @keyframes mq-l { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes mq-r { 0%{transform:translateX(-50%)} 100%{transform:translateX(0)} }
        .mq-left  { display:flex; width:max-content; animation:mq-l 32s linear infinite; }
        .mq-right { display:flex; width:max-content; animation:mq-r 28s linear infinite; }
        .mq-left:hover,.mq-right:hover { animation-play-state:paused; }

        .review-card-anim { border-radius: 20px; }
      `}</style>

      {/* ═══════════════════════════════════════════════════════════
          HERO — LIMPIO Y ELEGANTE, SIN EXCESO DE ANIMACIONES
      ═══════════════════════════════════════════════════════════ */}
      <section ref={heroRef} style={{ position:'relative', minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'20px 20px 60px', textAlign:'center', overflow:'hidden' }}>

        {/* Orbs suaves en fondo */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:0 }}>
          <div style={{ position:'absolute', top:'-8%', left:'3%', width:520, height:520, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,215,0,0.055) 0%, transparent 70%)', filter:'blur(48px)' }} />
          <div style={{ position:'absolute', bottom:'8%', right:'4%', width:560, height:560, borderRadius:'50%', background:'radial-gradient(circle, rgba(155,0,255,0.055) 0%, transparent 70%)', filter:'blur(48px)' }} />
        </div>

        {/* Grid sutil */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,215,0,0.016) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.016) 1px, transparent 1px)', backgroundSize:'60px 60px', zIndex:0, pointerEvents:'none' }} />

        {/* Partículas */}
        <ParticleCanvas mouseRef={mouseRef} />

        {/* Contenido */}
        <div style={{ position:'relative', zIndex:2, maxWidth:680, display:'flex', flexDirection:'column', alignItems:'center', animation:'slide-up .8s cubic-bezier(.22,1,.36,1) both' }}>

          {/* Badge — estático, limpio */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 18px', borderRadius:9999, background:'rgba(255,215,0,0.055)', border:'1px solid rgba(255,215,0,0.2)', marginBottom:'clamp(20px,4vw,44px)', backdropFilter:'blur(10px)' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#FFD700', boxShadow:'0 0 6px #FFD700', display:'block' }} />
            <span style={{ fontSize:10, letterSpacing:'0.28em', textTransform:'uppercase', fontWeight:500, color:'rgba(255,215,0,0.85)' }}>
              Plataforma activa · LATAM 2026
            </span>
          </div>

          {/* Logo — solo flotando suavemente */}
          <div style={{ width:96, height:96, borderRadius:22, overflow:'hidden', marginBottom:'clamp(20px,4vw,44px)', border:'1px solid rgba(255,215,0,0.2)', boxShadow:'0 0 40px rgba(255,215,0,0.1)', background:'rgba(255,215,0,0.035)', display:'flex', alignItems:'center', justifyContent:'center', animation:'float-b 5.5s ease-in-out infinite' }}>
            <img src="/logo.png" alt="Nexor" style={{ width:'80%', height:'80%', objectFit:'contain' }} />
          </div>

          {/* Titular — limpio, sin glitch */}
          <h1 style={{ fontSize:'clamp(32px, 7vw, 64px)', fontWeight:900, lineHeight:1.05, letterSpacing:'-0.025em', marginBottom:20 }}>
            <span style={{ display:'block', color:'#fff' }}>El ecosistema digital</span>
            <span style={{ display:'block', background:'linear-gradient(90deg, #FFD700 0%, #00FF88 48%, #B45309 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              para crecer sin límites
            </span>
          </h1>

          <p style={{ fontSize:'clamp(13px, 2vw, 16px)', lineHeight:1.85, maxWidth:500, color:'rgba(255,255,255,0.48)', marginBottom:'clamp(28px,4vw,50px)' }}>
            No vendas horas de tu vida. Construye un activo que trabaje por ti.
          </p>

          {/* CTAs — aquí sí van las animaciones chulas */}
          <div style={{ display:'flex', gap:14, flexWrap:'wrap', justifyContent:'center', marginBottom:14 }}>
            <Link href="/register" className="btn-primary"
              style={{ display:'inline-flex', alignItems:'center', gap:9, padding:'15px 36px', borderRadius:14, fontSize:13, letterSpacing:'0.05em', textDecoration:'none' }}>
              Crear cuenta <ArrowRight size={15} />
            </Link>
            <Link href="/login" className="btn-secondary"
              style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'15px 36px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.14)', borderRadius:14, fontSize:13, fontWeight:600, letterSpacing:'0.04em', color:'rgba(255,255,255,0.78)', textDecoration:'none', backdropFilter:'blur(8px)' }}>
              Iniciar sesión
            </Link>
          </div>
          <p style={{ fontSize:10, letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(255,255,255,0.2)' }}>
            Sin tarjeta de crédito · Registro en 2 minutos
          </p>
        </div>

        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:130, background:'linear-gradient(transparent, #060710)', pointerEvents:'none', zIndex:1 }} />
      </section>

      {/* ═══════════════════════════════════════════════════════════
          STATS
      ═══════════════════════════════════════════════════════════ */}
      <section ref={statsRef} style={{ borderTop:'1px solid rgba(255,255,255,0.05)', borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'40px 20px' }}>
        <div style={{ maxWidth:860, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:12 }}>
          {STATS.map((s,i) => {
            const sc = ['cd-up','cd-right','cd-down','cd-left'][i]
            return (
            <div key={i} className={sc} style={{ animationDelay:`${i*1.2}s`, height:'100%' }}>
            <TiltCard
              glowColor="rgba(255,215,0,0.65)"
              shineOpacity={0.22}
              style={{ borderRadius:20, height:'100%', opacity:statsVisible?1:0, transition:`opacity .5s ${i*.12}s, transform .5s ${i*.12}s`, transform:statsVisible?'none':'translateY(18px)' } as React.CSSProperties}
              cardStyle={{ background:'linear-gradient(135deg, rgba(255,215,0,0.06), rgba(255,255,255,0.01))', border:'1px solid rgba(255,215,0,0.14)', borderRadius:20, padding:'16px 8px', height:'100%', boxSizing:'border-box' }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, textAlign:'center', height:'100%' }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'rgba(255,215,0,0.08)', border:'1px solid rgba(255,215,0,0.22)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <s.icon size={16} style={{ color:'#FFD700' }} />
                </div>
                <span style={{ fontSize:22, fontWeight:900, color:'#fff', letterSpacing:'-0.03em' }}>
                  <Counter target={s.value} suffix={s.suffix} visible={statsVisible} />
                </span>
                <span style={{ fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(255,255,255,0.35)', fontWeight:500 }}>{s.label}</span>
              </div>
            </TiltCard>
            </div>
            )
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FEATURES — cards con glow pulsante + icono animado
      ═══════════════════════════════════════════════════════════ */}
      <section ref={featRef} style={{ padding:'clamp(48px,8vw,110px) 20px', maxWidth:1060, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:'clamp(32px,5vw,64px)' }}>
          <span style={{ display:'inline-block', fontSize:10, letterSpacing:'0.28em', textTransform:'uppercase', fontWeight:600, color:'#FFD700', marginBottom:14, padding:'5px 16px', borderRadius:9999, background:'rgba(255,215,0,0.07)', border:'1px solid rgba(255,215,0,0.18)' }}>Todo en un solo lugar</span>
          <h2 style={{ fontSize:'clamp(22px, 4vw, 38px)', fontWeight:900, color:'#fff', marginBottom:14, letterSpacing:'-0.025em' }}>9 herramientas. Un solo ecosistema.</h2>
          <p style={{ fontSize:14, color:'rgba(255,255,255,0.38)', maxWidth:520, margin:'0 auto' }}>Desde bots de ventas hasta cursos, tienda y publicidad con IA. Todo integrado para que escales sin límites.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:18 }}>
          {FEATURES.map((f,i) => {
            const drifts = ['cd-up','cd-diag','cd-right','cd-diag2','cd-down','cd-left']
            const driftClass = drifts[i % drifts.length]
            const driftDelay = `${i * 0.7}s`
            return (
            <div key={i} className={driftClass} style={{ animationDelay: driftDelay }}>
            <TiltCard
              glowColor={f.glow.replace('0.18','0.7')}
              shineOpacity={0.3}
              className={`feat-card${featVisible?' visible':''}`}
              style={{ borderRadius:22, animationDelay:`${i*.07}s` } as React.CSSProperties}
              cardStyle={{
                background:`linear-gradient(135deg, ${f.glow.replace('0.18','0.08')}, rgba(255,255,255,0.01))`,
                border:`1px solid ${f.color}1A`,
                borderRadius:22,
              }}>
              <div style={{ padding:30, position:'relative' }}>
                <HudCorners color={f.color} size={9} />
                <div style={{ position:'absolute', top:0, left:28, right:28, height:1, background:`linear-gradient(90deg, transparent, ${f.color}70, transparent)` }} />
                <div style={{ width:48, height:48, borderRadius:14, background:`${f.color}10`, border:`1px solid ${f.color}28`, display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:20, boxShadow:`0 0 22px ${f.glow}` }}>
                  <f.icon size={22} style={{ color:f.color }} />
                </div>
                <h3 style={{ fontSize:13, fontWeight:700, color:'#fff', marginBottom:10 }}>{f.title}</h3>
                <p style={{ fontSize:12, lineHeight:1.75, color:'rgba(255,255,255,0.42)' }}>{f.desc}</p>
              </div>
            </TiltCard>
            </div>
            )
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ padding:'0 20px clamp(48px,8vw,110px)', maxWidth:720, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:'clamp(30px,5vw,60px)' }}>
          <span style={{ display:'inline-block', fontSize:10, letterSpacing:'0.28em', textTransform:'uppercase', fontWeight:600, color:'#00FF88', marginBottom:14, padding:'5px 16px', borderRadius:9999, background:'rgba(0,255,136,0.07)', border:'1px solid rgba(0,255,136,0.18)' }}>Sencillo y rápido</span>
          <h2 style={{ fontSize:'clamp(22px, 4vw, 38px)', fontWeight:900, color:'#fff', marginBottom:12, letterSpacing:'-0.025em' }}>¿Cómo empiezo?</h2>
          <p style={{ fontSize:14, color:'rgba(255,255,255,0.38)', maxWidth:420, margin:'0 auto' }}>4 pasos para tener tu negocio digital activo y generando ingresos.</p>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {HOW.map((h,i) => {
            const hc = ['cd-left','cd-up','cd-right','cd-down'][i]
            return (
            <div key={i} className={hc} style={{ animationDelay:`${i*1.5}s` }}>
            <TiltCard
              glowColor={h.color + 'aa'}
              shineOpacity={0.25}
              style={{ borderRadius:22 }}
              cardStyle={{ background:`linear-gradient(135deg, ${h.color}07, rgba(255,255,255,0.01))`, border:`1px solid ${h.color}18`, borderRadius:22 }}>
              <div style={{ display:'flex', gap:20, alignItems:'flex-start', padding:'22px 26px', position:'relative' }}>
                <HudCorners color={h.color} size={8} />
                <div style={{ position:'absolute', top:0, left:28, right:28, height:1, background:`linear-gradient(90deg, transparent, ${h.color}55, transparent)` }} />
                <span style={{ fontSize:38, fontWeight:900, color:`${h.color}22`, lineHeight:1, flexShrink:0, letterSpacing:'-0.05em', minWidth:52 }}>{h.step}</span>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                    <h3 style={{ fontSize:14, fontWeight:700, color:'#fff', margin:0 }}>{h.title}</h3>
                    <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', color:h.color, background:`${h.color}14`, border:`1px solid ${h.color}30`, borderRadius:99, padding:'2px 9px', flexShrink:0 }}>{h.tag}</span>
                  </div>
                  <p style={{ fontSize:12, lineHeight:1.8, color:'rgba(255,255,255,0.43)', margin:0 }}>{h.desc}</p>
                </div>
              </div>
            </TiltCard>
            </div>
            )
          })}
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          REVIEWS
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ padding:'0 0 clamp(48px,8vw,110px)', overflow:'hidden', position:'relative' }}>
        <div style={{ textAlign:'center', marginBottom:'clamp(30px,5vw,60px)', padding:'0 20px' }}>
          <span style={{ display:'inline-block', fontSize:10, letterSpacing:'0.28em', textTransform:'uppercase', fontWeight:600, color:'#FFD700', marginBottom:14, padding:'5px 16px', borderRadius:9999, background:'rgba(255,215,0,0.07)', border:'1px solid rgba(255,215,0,0.22)' }}>Comunidad global</span>
          <h2 style={{ fontSize:'clamp(22px, 4vw, 38px)', fontWeight:900, color:'#fff', marginBottom:14, letterSpacing:'-0.025em' }}>Ellos ya están creciendo</h2>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom:14 }}>
            {[0,1,2,3,4].map(i => <Star key={i} size={20} style={{ color:'#FFD700', fill:'#FFD700', animation:`shimmer-star 2.5s ease-in-out ${i*.18}s infinite` }} />)}
            <span style={{ fontSize:15, fontWeight:900, color:'#fff', marginLeft:8 }}>5.0</span>
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.38)', marginLeft:4 }}>· +1,200 reseñas verificadas</span>
          </div>
          <div style={{ display:'flex', justifyContent:'center', gap:20, flexWrap:'wrap' }}>
            {[
              { label:'🌎 12 países', sub:'presencia activa' },
              { label:'🤖 +8K bots', sub:'mensajes por día' },
              { label:'💰 $2M+', sub:'en comisiones pagadas' },
            ].map((s,i) => (
              <div key={i} style={{ textAlign:'center' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{s.label}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', letterSpacing:'0.1em' }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position:'absolute', top:0, left:0, width:130, height:'100%', background:'linear-gradient(90deg, #060710, transparent)', zIndex:2, pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:0, right:0, width:130, height:'100%', background:'linear-gradient(270deg, #060710, transparent)', zIndex:2, pointerEvents:'none' }} />
        <div style={{ overflow:'hidden', marginBottom:14 }}>
          <div className="mq-left">{[...ROW1,...ROW1].map((r,i)=><ReviewCard key={i} r={r}/>)}</div>
        </div>
        <div style={{ overflow:'hidden' }}>
          <div className="mq-right">{[...ROW2,...ROW2].map((r,i)=><ReviewCard key={i} r={r}/>)}</div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          CTA FINAL
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ padding:'0 20px clamp(48px,8vw,110px)' }}>
        <div style={{ maxWidth:700, margin:'0 auto' }}>
          <TiltCard
            glowColor="rgba(255,215,0,0.7)"
            shineOpacity={0.4}
            style={{ borderRadius:36 }}
            cardStyle={{ background:'linear-gradient(135deg, rgba(255,215,0,0.055), rgba(155,0,255,0.06))', border:'1px solid rgba(255,215,0,0.14)', borderRadius:36 }}>
            <div style={{ padding:'clamp(44px, 6vw, 80px) clamp(30px, 5vw, 64px)', textAlign:'center', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:-80, right:-80, width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,215,0,0.08) 0%, transparent 70%)', pointerEvents:'none', animation:'float-a 9s ease-in-out infinite' }} />
              <div style={{ position:'absolute', bottom:-80, left:-80, width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(155,0,255,0.08) 0%, transparent 70%)', pointerEvents:'none', animation:'float-a 11s ease-in-out infinite reverse' }} />
              <div style={{ position:'absolute', top:0, left:28, right:28, height:1, background:'linear-gradient(90deg, transparent, rgba(255,215,0,0.65), transparent)' }} />
              <HudCorners color="#FFD700" size={14} />
              <div style={{ position:'relative' }}>
                <div style={{ width:68, height:68, borderRadius:20, overflow:'hidden', margin:'0 auto 30px', border:'1px solid rgba(255,215,0,0.25)', boxShadow:'0 0 36px rgba(255,215,0,0.14)', background:'rgba(255,215,0,0.04)', display:'flex', alignItems:'center', justifyContent:'center', animation:'float-b 5s ease-in-out infinite' }}>
                  <img src="/logo.png" alt="Nexor" style={{ width:'80%', height:'80%', objectFit:'contain' }} />
                </div>
                <h2 style={{ fontSize:'clamp(26px, 4vw, 44px)', fontWeight:900, color:'#fff', marginBottom:14, letterSpacing:'-0.025em' }}>Empieza hoy mismo</h2>
                <p style={{ fontSize:14, lineHeight:1.85, color:'rgba(255,255,255,0.43)', maxWidth:440, margin:'0 auto 40px' }}>
                  Únete a emprendedores en toda Latinoamérica que ya están construyendo su negocio digital con Nexor.
                </p>
                <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
                  <Link href="/register" className="btn-primary"
                    style={{ display:'inline-flex', alignItems:'center', gap:9, padding:'15px 36px', borderRadius:14, fontSize:13, letterSpacing:'0.05em', textDecoration:'none' }}>
                    Crear mi cuenta gratis <ArrowRight size={15} />
                  </Link>
                  <Link href="/login" className="btn-secondary"
                    style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'15px 30px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.13)', borderRadius:14, fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.75)', textDecoration:'none' }}>
                    Iniciar sesión
                  </Link>
                </div>
              </div>
            </div>
          </TiltCard>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════ */}
      <footer style={{ borderTop:'1px solid rgba(255,255,255,0.05)', padding:'52px 20px 40px' }}>
        <div style={{ maxWidth:860, margin:'0 auto', display:'flex', flexDirection:'column', alignItems:'center', gap:26 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:34, height:34, borderRadius:10, overflow:'hidden', border:'1px solid rgba(255,215,0,0.2)' }}>
              <img src="/logo.png" alt="Nexor" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
            </div>
            <div>
              <span style={{ fontSize:13, fontWeight:900, letterSpacing:'0.12em', color:'#fff' }}>JD</span>
              <span style={{ fontSize:10, letterSpacing:'0.2em', color:'rgba(255,255,255,0.42)', marginLeft:5 }}>INTERNACIONAL</span>
            </div>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:6 }}>
            {[{href:'/login',label:'Iniciar sesión'},{href:'/register',label:'Registro'},{href:'/privacy',label:'Privacidad'},{href:'/terms',label:'Términos'}].map(l=>(
              <Link key={l.href} href={l.href} style={{ fontSize:11, letterSpacing:'0.1em', fontWeight:500, color:'rgba(255,255,255,0.28)', textDecoration:'none', padding:'5px 14px', borderRadius:99, border:'1px solid transparent', transition:'all .2s' }}
                onMouseEnter={e=>{ e.currentTarget.style.color='#FFD700'; e.currentTarget.style.borderColor='rgba(255,215,0,0.22)'; e.currentTarget.style.background='rgba(255,215,0,0.06)' }}
                onMouseLeave={e=>{ e.currentTarget.style.color='rgba(255,255,255,0.28)'; e.currentTarget.style.borderColor='transparent'; e.currentTarget.style.background='transparent' }}>
                {l.label}
              </Link>
            ))}
          </div>
          <div style={{ width:'100%', height:1, background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />
          <span style={{ fontSize:10, letterSpacing:'0.16em', textTransform:'uppercase', color:'rgba(255,255,255,0.18)' }}>© 2026 Nexor</span>
          <p style={{ fontSize:10, lineHeight:1.9, textAlign:'center', maxWidth:700, color:'rgba(255,255,255,0.18)' }}>
            <strong style={{ fontWeight:600, color:'rgba(255,255,255,0.32)' }}>Política de Privacidad:</strong>{' '}
            Nexor recopila datos personales únicamente para la prestación de sus servicios. Tu información no es vendida ni compartida con terceros sin tu consentimiento explícito. Al registrarte, aceptas nuestros{' '}
            <Link href="/terms" style={{ color:'rgba(255,215,0,0.45)', textDecoration:'underline' }}>Términos de Uso</Link> y{' '}
            <Link href="/privacy" style={{ color:'rgba(255,215,0,0.45)', textDecoration:'underline' }}>Política de Privacidad</Link>.
          </p>
        </div>
      </footer>

    </div>
  )
}
