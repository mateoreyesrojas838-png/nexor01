'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { Loader2, Upload, Plus, Trash2, Play, Shuffle, RotateCcw, Volume2, VolumeX, Maximize2, Download, Gift, X, Trophy } from 'lucide-react'

interface P { id: number; name: string; extra?: string }
interface Result { prize: string; name: string; extra?: string }

const COLORS = ['#F59E0B', '#6366F1', '#22C55E', '#EF4444', '#06B6D4', '#E879F9', '#F97316', '#14B8A6', '#A855F7', '#3B82F6', '#EAB308', '#EC4899']
const TWO_PI = Math.PI * 2
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

export default function RuletaPage() {
  const [participants, setParticipants] = useState<P[]>([])
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [prizes, setPrizes] = useState<string[]>([])
  const [prizeIdx, setPrizeIdx] = useState(0)
  const [results, setResults] = useState<Result[]>([])
  const [elimination, setElimination] = useState(true)
  const [soundOn, setSoundOn] = useState(true)
  const [spinning, setSpinning] = useState(false)
  const [winner, setWinner] = useState<{ p: P; prize: string } | null>(null)
  const [manualName, setManualName] = useState('')
  const [newPrize, setNewPrize] = useState('')
  const [error, setError] = useState('')

  const idRef = useRef(1)
  const rotationRef = useRef(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const confettiRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  // ─── Dibujo de la rueda ───
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const size = canvas.width
    const cx = size / 2, cy = size / 2, r = size / 2 - 4
    ctx.clearRect(0, 0, size, size)
    const n = participants.length
    if (n === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TWO_PI); ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText('Agregá participantes', cx, cy)
      return
    }
    const seg = TWO_PI / n
    for (let i = 0; i < n; i++) {
      const a0 = i * seg + rotationRef.current
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a0, a0 + seg); ctx.closePath()
      ctx.fillStyle = COLORS[i % COLORS.length]; ctx.fill()
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; ctx.stroke()
      // texto
      ctx.save()
      ctx.translate(cx, cy); ctx.rotate(a0 + seg / 2)
      ctx.textAlign = 'right'; ctx.fillStyle = '#111'; ctx.font = `bold ${Math.max(9, Math.min(15, 220 / n))}px sans-serif`
      const label = participants[i].name.length > 18 ? participants[i].name.slice(0, 17) + '…' : participants[i].name
      ctx.fillText(label, r - 12, 5)
      ctx.restore()
    }
    // centro
    ctx.beginPath(); ctx.arc(cx, cy, 22, 0, TWO_PI); ctx.fillStyle = '#0d0d15'; ctx.fill()
    ctx.strokeStyle = '#F59E0B'; ctx.lineWidth = 3; ctx.stroke()
  }, [participants])

  useEffect(() => { draw() }, [draw])

  // ─── Confeti ───
  function confetti() {
    const canvas = confettiRef.current
    if (!canvas) return
    canvas.width = window.innerWidth; canvas.height = window.innerHeight
    const ctx = canvas.getContext('2d')!
    const parts = Array.from({ length: 140 }, () => ({
      x: Math.random() * canvas.width, y: -20 - Math.random() * canvas.height * 0.5,
      vx: (Math.random() - 0.5) * 4, vy: 3 + Math.random() * 5, s: 5 + Math.random() * 7,
      c: COLORS[Math.floor(Math.random() * COLORS.length)], rot: Math.random() * TWO_PI, vr: (Math.random() - 0.5) * 0.3,
    }))
    let frames = 0
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      parts.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.rot += p.vr
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c
        ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s); ctx.restore()
      })
      frames++
      if (frames < 160) requestAnimationFrame(tick)
      else ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    tick()
  }

  function beep(freq: number, dur: number) {
    if (!soundOn) return
    try {
      const AC = (window.AudioContext || (window as any).webkitAudioContext); const ac = new AC()
      const o = ac.createOscillator(); const g = ac.createGain()
      o.frequency.value = freq; o.connect(g); g.connect(ac.destination)
      g.gain.setValueAtTime(0.08, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur)
      o.start(); o.stop(ac.currentTime + dur)
    } catch { /* */ }
  }

  // ─── Girar ───
  function spin() {
    if (spinning || participants.length === 0) return
    setError('')
    // ganador: primer marcado (en orden de lista) o aleatorio
    let wIdx = participants.findIndex(p => checked.has(p.id))
    if (wIdx < 0) wIdx = Math.floor(Math.random() * participants.length)

    const n = participants.length
    const seg = TWO_PI / n
    const segCenter = wIdx * seg + seg / 2
    let target = (TWO_PI * 0.75) - segCenter // puntero arriba (270°)
    const current = rotationRef.current
    // normalizar target por encima del actual + vueltas
    target += Math.ceil((current - target) / TWO_PI) * TWO_PI
    target += TWO_PI * (6 + Math.random())

    setSpinning(true)
    const start = current; const delta = target - start; const dur = 4600; const t0 = performance.now()
    const tickAudio = { last: 0 }
    const anim = (now: number) => {
      const t = Math.min(1, (now - t0) / dur)
      rotationRef.current = start + delta * easeOut(t)
      // tic tic al pasar segmentos
      const segPassed = Math.floor((rotationRef.current % TWO_PI) / seg)
      if (segPassed !== tickAudio.last) { tickAudio.last = segPassed; beep(420, 0.03) }
      draw()
      if (t < 1) requestAnimationFrame(anim)
      else finishSpin(wIdx)
    }
    requestAnimationFrame(anim)
  }

  function finishSpin(wIdx: number) {
    const p = participants[wIdx]
    const prize = prizes[prizeIdx] ?? '—'
    setSpinning(false)
    setWinner({ p, prize })
    confetti(); beep(880, 0.5); setTimeout(() => beep(1180, 0.4), 150)
    setResults(r => [...r, { prize, name: p.name, extra: p.extra }])
    if (prizes.length) setPrizeIdx(i => Math.min(i + 1, prizes.length))
    if (elimination) {
      setParticipants(ps => ps.filter(x => x.id !== p.id))
      setChecked(c => { const s = new Set(c); s.delete(p.id); return s })
    }
  }

  // ─── Participantes ───
  function addManual() {
    const names = manualName.split(/[\n,]/).map(s => s.trim()).filter(Boolean)
    if (!names.length) return
    setParticipants(ps => [...ps, ...names.map(name => ({ id: idRef.current++, name }))])
    setManualName('')
  }

  function onExcel(file: File) {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const rows: any[][] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 })
        const added: P[] = []
        for (const row of rows) {
          const name = String(row?.[0] ?? '').trim()
          if (!name || /nombre|name/i.test(name)) continue // saltar encabezado
          added.push({ id: idRef.current++, name, extra: row?.[1] != null ? String(row[1]).trim() : undefined })
        }
        if (!added.length) { setError('No se encontraron nombres en la 1ª columna del Excel.'); return }
        setParticipants(ps => [...ps, ...added])
      } catch { setError('No se pudo leer el Excel. Probá con .xlsx o .csv.') }
    }
    reader.readAsArrayBuffer(file)
  }

  function toggleCheck(id: number) {
    setChecked(c => { const s = new Set(c); s.has(id) ? s.delete(id) : s.add(id); return s })
  }
  function removeP(id: number) {
    setParticipants(ps => ps.filter(p => p.id !== id))
    setChecked(c => { const s = new Set(c); s.delete(id); return s })
  }
  function shuffle() {
    setParticipants(ps => [...ps].sort(() => Math.random() - 0.5))
  }
  function resetAll() {
    if (!confirm('¿Reiniciar todo? Se borran participantes, premios y resultados.')) return
    setParticipants([]); setChecked(new Set()); setPrizes([]); setPrizeIdx(0); setResults([]); rotationRef.current = 0; draw()
  }

  function exportResults() {
    if (!results.length) return
    const ws = XLSX.utils.json_to_sheet(results.map((r, i) => ({ '#': i + 1, Premio: r.prize, Ganador: r.name, 'Dato extra': r.extra ?? '' })))
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Sorteo')
    XLSX.writeFile(wb, 'sorteo-nexor.xlsx')
  }

  function goFullscreen() {
    const el = wrapRef.current; if (!el) return
    if (document.fullscreenElement) document.exitFullscreen(); else el.requestFullscreen?.()
  }

  const checkedCount = participants.filter(p => checked.has(p.id)).length

  return (
    <div ref={wrapRef} className="bg-[#0a0a0f] min-h-full">
      <canvas ref={confettiRef} className="fixed inset-0 pointer-events-none z-[60]" style={{ width: '100vw', height: '100vh' }} />

      <div className="mb-5">
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Trophy size={20} className="text-amber-400" /> Ruleta de Sorteos</h1>
        <p className="text-xs text-white/30 mt-0.5">Sorteá premios entre los participantes. Marcá casillas para elegir ganadores, o dejá todo al azar.</p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex gap-2"><X size={16} /><p className="flex-1">{error}</p><button onClick={() => setError('')}>✕</button></div>}

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Rueda */}
        <div className="flex flex-col items-center">
          {prizes.length > 0 && (
            <div className="mb-3 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-center">
              <p className="text-[10px] uppercase tracking-widest text-white/40">Próximo premio</p>
              <p className="text-lg font-black text-amber-400">{prizes[prizeIdx] ?? '— sorteo terminado —'}</p>
            </div>
          )}
          <div className="relative">
            {/* puntero */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-1 z-10" style={{ width: 0, height: 0, borderLeft: '14px solid transparent', borderRight: '14px solid transparent', borderTop: '24px solid #F59E0B' }} />
            <canvas ref={canvasRef} width={400} height={400} onClick={spin} className="cursor-pointer max-w-full" style={{ touchAction: 'none' }} />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            <button onClick={spin} disabled={spinning || participants.length === 0} className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black text-black disabled:opacity-40" style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}>
              {spinning ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />} Girar
            </button>
            <button onClick={shuffle} disabled={spinning} className="p-3 rounded-2xl bg-white/5 text-white/60 hover:bg-white/10" title="Mezclar"><Shuffle size={16} /></button>
            <button onClick={() => setSoundOn(s => !s)} className="p-3 rounded-2xl bg-white/5 text-white/60 hover:bg-white/10" title="Sonido">{soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}</button>
            <button onClick={goFullscreen} className="p-3 rounded-2xl bg-white/5 text-white/60 hover:bg-white/10" title="Pantalla completa"><Maximize2 size={16} /></button>
            <button onClick={resetAll} className="p-3 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500/20" title="Reiniciar todo"><RotateCcw size={16} /></button>
          </div>
          <label className="flex items-center gap-2 text-xs text-white/50 mt-3 cursor-pointer">
            <input type="checkbox" checked={elimination} onChange={e => setElimination(e.target.checked)} className="accent-amber-500" />
            Modo eliminación (el ganador sale de la rueda)
          </label>
          {checkedCount > 0 && <p className="text-[11px] text-amber-400/80 mt-1">🎯 {checkedCount} ganador(es) elegido(s) — saldrán en orden</p>}
        </div>

        {/* Panel lateral */}
        <div className="space-y-5">
          {/* Premios */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-2 flex items-center gap-1.5"><Gift size={13} className="text-amber-400" /> Premios ({prizes.length})</p>
            <div className="flex gap-2 mb-2">
              <input value={newPrize} onChange={e => setNewPrize(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newPrize.trim()) { setPrizes(p => [...p, newPrize.trim()]); setNewPrize('') } }} placeholder="Ej. 100 Bs" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-amber-500/50" />
              <button onClick={() => { if (newPrize.trim()) { setPrizes(p => [...p, newPrize.trim()]); setNewPrize('') } }} className="px-3 rounded-lg bg-amber-500/15 text-amber-400"><Plus size={15} /></button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {prizes.map((p, i) => (
                <span key={i} className={`text-[11px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 ${i < prizeIdx ? 'bg-white/5 text-white/30 line-through' : 'bg-amber-500/15 text-amber-300'}`}>
                  {p} <button onClick={() => setPrizes(ps => ps.filter((_, x) => x !== i))} className="text-white/30 hover:text-red-400"><X size={11} /></button>
                </span>
              ))}
            </div>
          </div>

          {/* Participantes */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-black uppercase tracking-widest text-white/40">Participantes ({participants.length})</p>
              <label className="flex items-center gap-1.5 text-[11px] text-amber-400 cursor-pointer hover:text-amber-300">
                <Upload size={13} /> Subir Excel
                <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onExcel(f); e.target.value = '' }} />
              </label>
            </div>
            <div className="flex gap-2 mb-3">
              <input value={manualName} onChange={e => setManualName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addManual() }} placeholder="Agregar nombre (o pegar varios)" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-amber-500/50" />
              <button onClick={addManual} className="px-3 rounded-lg bg-amber-500/15 text-amber-400"><Plus size={15} /></button>
            </div>
            <div className="max-h-72 overflow-y-auto space-y-1">
              {participants.length === 0 ? (
                <p className="text-[11px] text-white/25 text-center py-4">Subí un Excel o agregá nombres. Podés combinar ambos.</p>
              ) : participants.map(p => (
                <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 group">
                  <input type="checkbox" checked={checked.has(p.id)} onChange={() => toggleCheck(p.id)} className="accent-amber-500" title="Marcar como ganador" />
                  <span className="flex-1 text-sm text-white/80 truncate">{p.name}{p.extra && <span className="text-white/30 text-xs"> · {p.extra}</span>}</span>
                  <button onClick={() => removeP(p.id)} className="text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Resultados */}
          {results.length > 0 && (
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-black uppercase tracking-widest text-white/40">Resultados ({results.length})</p>
                <button onClick={exportResults} className="flex items-center gap-1.5 text-[11px] text-green-400 hover:text-green-300"><Download size={13} /> Excel</button>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {results.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-white/[0.03]">
                    <span className="text-amber-400 font-bold">{r.prize}</span>
                    <span className="text-white/70 truncate ml-2">{r.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal ganador */}
      {winner && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setWinner(null)}>
          <div className="w-full max-w-sm rounded-3xl border border-amber-500/30 bg-[#0d0d15] p-8 text-center" onClick={e => e.stopPropagation()} style={{ boxShadow: '0 0 60px rgba(245,158,11,0.25)' }}>
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
              <Trophy size={30} className="text-amber-400" />
            </div>
            <p className="text-[10px] uppercase tracking-widest text-white/40">Ganador</p>
            <p className="text-2xl font-black text-white mt-1">{winner.p.name}</p>
            {winner.p.extra && <p className="text-xs text-white/40 mt-0.5">{winner.p.extra}</p>}
            {winner.prize !== '—' && <p className="text-lg font-black mt-3" style={{ color: '#FFD700' }}>🎉 Ganó {winner.prize}</p>}
            <button onClick={() => setWinner(null)} className="mt-6 w-full py-3 rounded-2xl text-sm font-black text-black" style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}>Continuar</button>
          </div>
        </div>
      )}
    </div>
  )
}
