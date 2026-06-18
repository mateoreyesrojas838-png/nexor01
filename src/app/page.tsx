'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bot, ArrowRight, CheckCircle2, Users, BarChart3 } from 'lucide-react'
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
    type P = { x:number; y:number; vx:number; vy:number; r:number; alpha:number; hue:number }
    const pts: P[] = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random()-.5)*.3, vy: (Math.random()-.5)*.3,
      r: Math.random()*1.6+.3, alpha: Math.random()*.5+.1,
      hue: Math.random() > .5 ? 190 : 265,
    }))
    const frame = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height)
      const mx = mouseRef.current.x, my = mouseRef.current.y
      for (const p of pts) {
        const dx=p.x-mx, dy=p.y-my, d2=dx*dx+dy*dy
        if (d2<12000) { const d=Math.sqrt(d2),f=(110-d)/110; p.vx+=(dx/d)*f*.2; p.vy+=(dy/d)*f*.2 }
        p.vx*=.987; p.vy*=.987; p.x+=p.vx; p.y+=p.vy
        if(p.x<0)p.x=canvas.width; if(p.x>canvas.width)p.x=0
        if(p.y<0)p.y=canvas.height; if(p.y>canvas.height)p.y=0
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2)
        ctx.fillStyle=`hsla(${p.hue},100%,75%,${p.alpha})`; ctx.fill()
      }
      for (let i=0;i<pts.length;i++) for (let j=i+1;j<pts.length;j++) {
        const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y, d=Math.sqrt(dx*dx+dy*dy)
        if (d<120) { ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y); ctx.strokeStyle=`hsla(200,100%,70%,${(1-d/120)*.09})`; ctx.lineWidth=.5; ctx.stroke() }
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
// DATA
// ─────────────────────────────────────────────────────────────────────────────
const STATS = [
  { icon:Users,        value:5000, suffix:'+',   label:'Miembros activos' },
  { icon:Bot,          value:24,   suffix:'/7',  label:'Automatización' },
  { icon:BarChart3,    value:3,    suffix:' Ads', label:'Plataformas' },
  { icon:CheckCircle2, value:2,    suffix:' min', label:'Para empezar' },
]

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const mouseRef  = useRef({ x:-9999, y:-9999 })
  const heroRef   = useRef<HTMLElement>(null)
  const statsRef  = useRef<HTMLElement>(null)
  const [statsVisible, setStatsVisible] = useState(false)
  const [landing, setLanding] = useState<{ services: any[]; plans: any[] }>({ services: [], plans: [] })
  const [packs, setPacks] = useState<any[]>([]) // packs detallados (servicios incluidos + precios)

  useEffect(() => {
    fetch('/api/public/services').then(r => r.ok ? r.json() : null).then(d => { if (d) setLanding({ services: d.services || [], plans: d.plans || [] }) }).catch(() => {})
    fetch('/api/plans').then(r => r.ok ? r.json() : null).then(d => { if (d?.plans) setPacks(d.plans.filter((p: any) => (p.prices?.MONTHLY ?? 0) > 0)) }).catch(() => {})
  }, [])

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

  return (
    <div style={{ background:'#040615', fontFamily:"'Inter', system-ui, sans-serif", color:'#fff', minHeight:'100vh', overflowX:'hidden' }}>

      <style>{`
        /* ── BUTTON ANIMATIONS ─────────────────────────────────── */
        @keyframes btn-grad {
          0%,100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        .btn-primary {
          background: linear-gradient(135deg, #00E5FF, #7B2FFF, #00BFFF, #00E5FF) !important;
          background-size: 300% 300% !important;
          animation: btn-grad 4s ease infinite !important;
          transition: transform .18s, box-shadow .18s !important;
          color: #fff !important;
          font-weight: 700 !important;
          min-width: 180px !important;
          justify-content: center !important;
          box-sizing: border-box !important;
          box-shadow: 0 0 24px rgba(0,229,255,0.28) !important;
        }
        .btn-primary:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 0 40px rgba(0,229,255,0.5) !important;
        }
        .btn-primary::after { content: none; }
        .btn-secondary {
          transition: all .2s !important;
          min-width: 180px !important;
          justify-content: center !important;
          box-sizing: border-box !important;
        }
        .btn-secondary:hover {
          background: rgba(0,229,255,0.07) !important;
          border-color: rgba(0,229,255,0.35) !important;
          color: #00E5FF !important;
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
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(0,229,255,0.35); }
          70%  { box-shadow: 0 0 0 14px rgba(0,229,255,0); }
          100% { box-shadow: 0 0 0 0 rgba(0,229,255,0); }
        }
        @keyframes slide-up { from{opacity:0;transform:translateY(36px)} to{opacity:1;transform:translateY(0)} }
        @keyframes reveal-card { from{opacity:0;transform:translateY(28px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        .feat-card { opacity:0; }
        .feat-card.visible { animation: reveal-card .55s cubic-bezier(.22,1,.36,1) both; }
        @keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>

      {/* ═══════════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════════ */}
      <section ref={heroRef} style={{ position:'relative', minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'20px 20px 60px', textAlign:'center', overflow:'hidden' }}>

        {/* Orbs */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:0 }}>
          {/* Cyan orb top-left */}
          <div style={{ position:'absolute', top:'-10%', left:'-5%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,229,255,0.07) 0%, transparent 65%)', filter:'blur(60px)' }} />
          {/* Violet orb bottom-right */}
          <div style={{ position:'absolute', bottom:'5%', right:'-5%', width:640, height:640, borderRadius:'50%', background:'radial-gradient(circle, rgba(123,47,255,0.09) 0%, transparent 65%)', filter:'blur(60px)' }} />
          {/* Subtle warm center glow */}
          <div style={{ position:'absolute', top:'40%', left:'50%', transform:'translate(-50%,-50%)', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,191,255,0.04) 0%, transparent 70%)', filter:'blur(80px)' }} />
        </div>

        {/* Grid */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(0,229,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.018) 1px, transparent 1px)', backgroundSize:'64px 64px', zIndex:0, pointerEvents:'none' }} />

        {/* Particles */}
        <ParticleCanvas mouseRef={mouseRef} />

        {/* Content */}
        <div style={{ position:'relative', zIndex:2, maxWidth:700, display:'flex', flexDirection:'column', alignItems:'center', animation:'slide-up .8s cubic-bezier(.22,1,.36,1) both' }}>

          {/* Headline */}
          <h1 style={{ fontSize:'clamp(32px, 7vw, 66px)', fontWeight:900, lineHeight:1.05, letterSpacing:'-0.03em', marginBottom:22 }}>
            <span style={{ display:'block', color:'rgba(255,255,255,0.92)' }}>El ecosistema digital</span>
            <span style={{ display:'block', background:'linear-gradient(90deg, #00E5FF 0%, #7B2FFF 50%, #00BFFF 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              para crecer sin límites
            </span>
          </h1>

          <p style={{ fontSize:'clamp(13px, 2vw, 16px)', lineHeight:1.9, maxWidth:500, color:'rgba(200,220,255,0.45)', marginBottom:'clamp(28px,4vw,52px)' }}>
            No vendas horas de tu vida. Construye un activo que trabaje por ti.
          </p>

          {/* CTAs */}
          <div style={{ display:'flex', gap:14, flexWrap:'wrap', justifyContent:'center', marginBottom:14 }}>
            <Link href="/register" className="btn-primary"
              style={{ display:'inline-flex', alignItems:'center', gap:9, padding:'15px 36px', borderRadius:14, fontSize:13, letterSpacing:'0.05em', textDecoration:'none' }}>
              Crear cuenta <ArrowRight size={15} />
            </Link>
            <Link href="/login" className="btn-secondary"
              style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'15px 36px', background:'rgba(0,229,255,0.04)', border:'1px solid rgba(0,229,255,0.18)', borderRadius:14, fontSize:13, fontWeight:600, letterSpacing:'0.04em', color:'rgba(180,220,255,0.75)', textDecoration:'none', backdropFilter:'blur(8px)' }}>
              Iniciar sesión
            </Link>
          </div>
          <p style={{ fontSize:10, letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(180,220,255,0.2)' }}>
            Sin tarjeta de crédito · Registro en 2 minutos
          </p>
        </div>

        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:140, background:'linear-gradient(transparent, #040615)', pointerEvents:'none', zIndex:1 }} />
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SERVICIOS INDIVIDUALES (primero, debajo del hero)
      ═══════════════════════════════════════════════════════════ */}
      {landing.services.length > 0 && (
        <section style={{ padding:'60px 20px 30px' }}>
          <div style={{ maxWidth:1000, margin:'0 auto' }}>
            <p style={{ textAlign:'center', fontSize:11, letterSpacing:'0.28em', textTransform:'uppercase', color:'rgba(0,229,255,0.6)', marginBottom:10 }}>Servicios individuales</p>
            <h2 style={{ textAlign:'center', fontSize:'clamp(24px,4vw,38px)', fontWeight:900, letterSpacing:'-0.02em', marginBottom:40, color:'#fff' }}>Elegí lo que necesitás</h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:16 }}>
              {landing.services.map((s:any)=>(
                <Link key={s.key} href={`/servicios/${s.slug}`} style={{ textDecoration:'none', display:'flex', flexDirection:'column', borderRadius:20, overflow:'hidden', border:'1px solid rgba(0,229,255,0.12)', background:'linear-gradient(135deg, rgba(0,229,255,0.05), rgba(123,47,255,0.03))' }}>
                  <div style={{ height:140, background:'rgba(0,0,0,0.25)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                    {s.coverUrl ? <img src={s.coverUrl} alt={s.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <Bot size={34} style={{ color:'rgba(0,229,255,0.3)' }} />}
                  </div>
                  <div style={{ padding:'16px 18px', flex:1, display:'flex', flexDirection:'column' }}>
                    <p style={{ fontWeight:800, color:'#fff', fontSize:15 }}>{s.name}</p>
                    {s.description && <p style={{ fontSize:12, lineHeight:1.6, color:'rgba(200,220,255,0.45)', marginTop:6, flex:1 }}>{s.description.slice(0,90)}{s.description.length>90?'…':''}</p>}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:14 }}>
                      <span style={{ fontWeight:900, color:'#00E5FF', fontSize:16 }}>Desde ${s.minPrice}<span style={{ fontSize:10, color:'rgba(200,220,255,0.4)', fontWeight:500 }}> USDT</span></span>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:12, fontWeight:700, color:'#00E5FF' }}>Ver <ArrowRight size={13} /></span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          PACKS (todo en uno) — detallado con servicios y precios del admin
      ═══════════════════════════════════════════════════════════ */}
      {packs.length > 0 && (
        <section style={{ padding:'30px 20px 70px' }}>
          <div style={{ maxWidth:1050, margin:'0 auto' }}>
            <p style={{ textAlign:'center', fontSize:11, letterSpacing:'0.28em', textTransform:'uppercase', color:'rgba(255,215,0,0.6)', marginBottom:10 }}>Todo en uno</p>
            <h2 style={{ textAlign:'center', fontSize:'clamp(24px,4vw,38px)', fontWeight:900, letterSpacing:'-0.02em', marginBottom:8, color:'#fff' }}>Packs con varios servicios</h2>
            <p style={{ textAlign:'center', fontSize:13, color:'rgba(200,220,255,0.45)', marginBottom:36 }}>Combiná servicios en un solo pack y ahorrá.</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(290px, 1fr))', gap:18, alignItems:'start' }}>
              {packs.map((p:any, i:number)=>{
                const featured = i === 1
                return (
                  <div key={p.plan} style={{ display:'flex', flexDirection:'column', borderRadius:22, padding:'24px 22px', background: featured ? 'linear-gradient(160deg, rgba(255,215,0,0.08), rgba(11,11,18,0.6))' : 'rgba(255,255,255,0.02)', border: featured ? '1px solid rgba(255,215,0,0.4)' : '1px solid rgba(255,255,255,0.08)' }}>
                    <p style={{ fontSize:12, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.12em', color:'#FFD700' }}>{p.name}</p>
                    {p.tagline && <p style={{ fontSize:11, color:'rgba(200,220,255,0.4)', marginTop:2 }}>{p.tagline}</p>}
                    <div style={{ margin:'14px 0 16px' }}>
                      <span style={{ fontSize:38, fontWeight:900, color:'#fff', lineHeight:1 }}>${p.prices?.MONTHLY}</span>
                      <span style={{ fontSize:12, color:'rgba(200,220,255,0.4)', marginLeft:4 }}>USDT/mes</span>
                      {(p.prices?.QUARTERLY || p.prices?.ANNUAL) && (
                        <p style={{ fontSize:11, color:'rgba(200,220,255,0.4)', marginTop:4 }}>
                          {p.prices?.QUARTERLY ? `3 meses $${p.prices.QUARTERLY}` : ''}{p.prices?.QUARTERLY && p.prices?.ANNUAL ? ' · ' : ''}{p.prices?.ANNUAL ? `Anual $${p.prices.ANNUAL}` : ''}
                        </p>
                      )}
                    </div>
                    <div style={{ flex:1, display:'flex', flexDirection:'column', gap:9, marginBottom:20 }}>
                      {(p.includedServices || []).map((s:any)=>(
                        <div key={s.key} style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                          <CheckCircle2 size={14} style={{ color:'#FFD700', marginTop:2, flexShrink:0 }} />
                          <div>
                            <p style={{ fontSize:12, fontWeight:700, color:'#FBBF24', lineHeight:1.3 }}>{s.name}</p>
                            {s.detail && <p style={{ fontSize:11, color:'rgba(200,220,255,0.5)', lineHeight:1.4 }}>{s.detail}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Link href="/planes" style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8, padding:'13px 20px', borderRadius:14, fontSize:13, fontWeight:800, textDecoration:'none', color: featured ? '#000' : '#FFD700', background: featured ? 'linear-gradient(135deg,#D97706,#FFD700)' : 'rgba(255,215,0,0.1)', border: featured ? 'none' : '1px solid rgba(255,215,0,0.25)' }}>
                      Adquirir {p.name} <ArrowRight size={14} />
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          STATS
      ═══════════════════════════════════════════════════════════ */}
      <section ref={statsRef} style={{ borderTop:'1px solid rgba(0,229,255,0.07)', borderBottom:'1px solid rgba(0,229,255,0.07)', padding:'44px 20px' }}>
        <div style={{ maxWidth:880, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:14 }}>
          {STATS.map((s,i) => {
            const sc = ['cd-up','cd-right','cd-down','cd-left'][i]
            return (
            <div key={i} className={sc} style={{ animationDelay:`${i*1.2}s`, height:'100%' }}>
            <TiltCard
              glowColor="rgba(0,229,255,0.55)"
              shineOpacity={0.18}
              style={{ borderRadius:20, height:'100%', opacity:statsVisible?1:0, transition:`opacity .5s ${i*.12}s, transform .5s ${i*.12}s`, transform:statsVisible?'none':'translateY(18px)' } as React.CSSProperties}
              cardStyle={{ background:'linear-gradient(135deg, rgba(0,229,255,0.06), rgba(123,47,255,0.04))', border:'1px solid rgba(0,229,255,0.12)', borderRadius:20, padding:'18px 8px', height:'100%', boxSizing:'border-box' }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, textAlign:'center', height:'100%' }}>
                <div style={{ width:38, height:38, borderRadius:11, background:'rgba(0,229,255,0.08)', border:'1px solid rgba(0,229,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <s.icon size={16} style={{ color:'#00E5FF' }} />
                </div>
                <span style={{ fontSize:24, fontWeight:900, color:'#fff', letterSpacing:'-0.03em' }}>
                  <Counter target={s.value} suffix={s.suffix} visible={statsVisible} />
                </span>
                <span style={{ fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(180,220,255,0.38)', fontWeight:500 }}>{s.label}</span>
              </div>
            </TiltCard>
            </div>
            )
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════ */}
      <footer style={{ borderTop:'1px solid rgba(0,229,255,0.07)', padding:'52px 20px 40px' }}>
        <div style={{ maxWidth:860, margin:'0 auto', display:'flex', flexDirection:'column', alignItems:'center', gap:26 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:34, height:34, borderRadius:10, overflow:'hidden', border:'1px solid rgba(0,229,255,0.2)', boxShadow:'0 0 16px rgba(0,229,255,0.1)' }}>
              <img src="/logo.png" alt="Nexor" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
            </div>
            <span style={{ fontSize:14, fontWeight:900, letterSpacing:'0.18em', background:'linear-gradient(90deg,#00E5FF,#7B2FFF)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>NEXOR</span>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:6 }}>
            {[{href:'/login',label:'Iniciar sesión'},{href:'/register',label:'Registro'},{href:'/privacy',label:'Privacidad'},{href:'/terms',label:'Términos'}].map(l=>(
              <Link key={l.href} href={l.href} style={{ fontSize:11, letterSpacing:'0.1em', fontWeight:500, color:'rgba(180,220,255,0.3)', textDecoration:'none', padding:'5px 14px', borderRadius:99, border:'1px solid transparent', transition:'all .2s' }}
                onMouseEnter={e=>{ e.currentTarget.style.color='#00E5FF'; e.currentTarget.style.borderColor='rgba(0,229,255,0.22)'; e.currentTarget.style.background='rgba(0,229,255,0.06)' }}
                onMouseLeave={e=>{ e.currentTarget.style.color='rgba(180,220,255,0.3)'; e.currentTarget.style.borderColor='transparent'; e.currentTarget.style.background='transparent' }}>
                {l.label}
              </Link>
            ))}
          </div>
          <div style={{ width:'100%', height:1, background:'linear-gradient(90deg, transparent, rgba(0,229,255,0.1), transparent)' }} />
          <span style={{ fontSize:10, letterSpacing:'0.16em', textTransform:'uppercase', color:'rgba(180,220,255,0.2)' }}>© 2026 Nexor</span>
          <p style={{ fontSize:10, lineHeight:1.9, textAlign:'center', maxWidth:700, color:'rgba(180,220,255,0.2)' }}>
            <strong style={{ fontWeight:600, color:'rgba(180,220,255,0.34)' }}>Política de Privacidad:</strong>{' '}
            Nexor recopila datos personales únicamente para la prestación de sus servicios. Tu información no es vendida ni compartida con terceros sin tu consentimiento explícito. Al registrarte, aceptas nuestros{' '}
            <Link href="/terms" style={{ color:'rgba(0,229,255,0.45)', textDecoration:'underline' }}>Términos de Uso</Link> y{' '}
            <Link href="/privacy" style={{ color:'rgba(0,229,255,0.45)', textDecoration:'underline' }}>Política de Privacidad</Link>.
          </p>
        </div>
      </footer>

    </div>
  )
}
