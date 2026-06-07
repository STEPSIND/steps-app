import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'
import Auth from './Auth'
import Dashboard from './pages/Dashboard'
import Ventas from './pages/Ventas'
import Facturacion from './pages/Facturacion'
import Presupuestos from './pages/Presupuestos'
import Clientes from './pages/Clientes'
import Proveedores from './pages/Proveedores'
import Catalogo from './pages/Catalogo'
import CargaProductos from './pages/CargaProductos'
import Caja from './pages/Caja'
import Tareas from './pages/Tareas'
import Notas from './pages/Notas'
import Stock from './pages/Stock'
import './App.css'

const nav = [
  {to:'/', icon:'🏠', label:'Dashboard'},
  {to:'/ventas', icon:'💼', label:'Ventas'},
  {to:'/facturacion', icon:'🧾', label:'Facturación'},
  {to:'/presupuestos', icon:'📋', label:'Presupuestos'},
  {to:'/clientes', icon:'👥', label:'Clientes'},
  {to:'/proveedores', icon:'🏭', label:'Proveedores'},
  {to:'/catalogo', icon:'📦', label:'Catálogo'},
  {to:'/carga-productos', icon:'✨', label:'Productos'},
  {to:'/stock', icon:'📊', label:'Stock'},
  {to:'/caja', icon:'🏦', label:'Caja y Cheques'},
  {to:'/tareas', icon:'📅', label:'Tareas'},
  {to:'/notas', icon:'📝', label:'Notas'},
]

const c = {
  bg:'#07070f', border:'rgba(255,255,255,0.07)',
  cyan:'#06b6d4', violet:'#7c3aed', text:'#f1f5f9', muted:'#475569', sub:'#94a3b8'
}

// Colores chakra
const CHAKRA = ['#FF1744','#FF6D00','#FFD600','#00E676','#00B0FF','#651FFF','#D500F9']

// ── CURSOR — trail chakra sin destellos ──
function CustomCursor() {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: -100, y: -100 })
  const frameRef = useRef(null)
  const trailRef = useRef(Array.from({ length: 22 }, () => ({ x: -100, y: -100 })))
  const timeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const onMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', onMove)

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      timeRef.current += 0.012

      const trail = trailRef.current
      trail.unshift({ x: mouseRef.current.x, y: mouseRef.current.y })
      trail.pop()

      // Suavizado del trail con spring physics
      for (let i = 1; i < trail.length; i++) {
        trail[i].x += (trail[i - 1].x - trail[i].x) * 0.38
        trail[i].y += (trail[i - 1].y - trail[i].y) * 0.38
      }

      // Trail con colores chakra ciclando
      for (let i = 1; i < trail.length; i++) {
        const t = i / trail.length
        // Índice chakra basado en tiempo + posición en el trail
        const chakraIdx = Math.floor((timeRef.current * 1.2 + t * 3.5)) % CHAKRA.length
        const color = CHAKRA[chakraIdx]
        const opacity = Math.pow(1 - t, 1.4) * 0.75
        const size = (1 - t) * 4.8

        ctx.save()
        ctx.globalAlpha = opacity

        // Glow sutil del trail
        const grad = ctx.createRadialGradient(
          trail[i].x, trail[i].y, 0,
          trail[i].x, trail[i].y, size * 2.5
        )
        grad.addColorStop(0, color)
        grad.addColorStop(0.5, color + '88')
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(trail[i].x, trail[i].y, size * 2.5, 0, Math.PI * 2)
        ctx.fill()

        ctx.restore()
      }

      // Núcleo blanco del cursor
      const { x, y } = mouseRef.current
      if (x > 0) {
        ctx.save()
        ctx.fillStyle = '#ffffff'
        ctx.shadowColor = 'rgba(255,255,255,0.8)'
        ctx.shadowBlur = 4
        ctx.beginPath()
        ctx.arc(x, y, 2.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      frameRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(frameRef.current)
    }
  }, [])

  return <canvas ref={canvasRef} style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:9998 }}/>
}

// ── SONIDO AMBIENTAL — fix volumen + contexto ──
function SoundButton() {
  const ctxRef = useRef(null)
  const nodesRef = useRef([])
  const [soundOn, setSoundOn] = useState(false)

  const start = async () => {
    if (ctxRef.current) return
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    // Fix: reanudar el contexto si el browser lo suspendió
    if (ctx.state === 'suspended') await ctx.resume()
    ctxRef.current = ctx
    const nodes = []

    const createDrone = (freq, gain, detune = 0) => {
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()
      const filter = ctx.createBiquadFilter()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      osc.detune.setValueAtTime(detune, ctx.currentTime)
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(600, ctx.currentTime)
      gainNode.gain.setValueAtTime(0, ctx.currentTime)
      gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + 3)
      osc.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(ctx.destination)
      osc.start()
      nodes.push({ gainNode })
    }

    const createPad = (freq, gain) => {
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gainNode = ctx.createGain()
      const filter = ctx.createBiquadFilter()
      const lfo = ctx.createOscillator()
      const lfoGain = ctx.createGain()
      osc1.type = 'triangle'
      osc2.type = 'sine'
      osc1.frequency.setValueAtTime(freq, ctx.currentTime)
      osc2.frequency.setValueAtTime(freq * 1.004, ctx.currentTime)
      lfo.frequency.setValueAtTime(0.09, ctx.currentTime)
      lfoGain.gain.setValueAtTime(18, ctx.currentTime)
      lfo.connect(lfoGain)
      lfoGain.connect(filter.frequency)
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(700, ctx.currentTime)
      filter.Q.setValueAtTime(1.5, ctx.currentTime)
      gainNode.gain.setValueAtTime(0, ctx.currentTime)
      gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + 5)
      osc1.connect(filter)
      osc2.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(ctx.destination)
      osc1.start()
      osc2.start()
      lfo.start()
      nodes.push({ gainNode })
    }

    // Volumen aumentado x4
    createDrone(55, 0.18)
    createDrone(110, 0.14, 3)
    createDrone(165, 0.09, -2)
    createPad(220, 0.11)
    createPad(330, 0.07)
    nodesRef.current = nodes
  }

  const stop = () => {
    if (!ctxRef.current) return
    nodesRef.current.forEach(({ gainNode }) => {
      gainNode.gain.linearRampToValueAtTime(0, ctxRef.current.currentTime + 2)
    })
    setTimeout(() => { ctxRef.current?.close(); ctxRef.current = null }, 2500)
  }

  const toggle = async () => {
    if (soundOn) { stop(); setSoundOn(false) }
    else { await start(); setSoundOn(true) }
  }

  return (
    <button onClick={toggle} title={soundOn ? 'Silenciar' : 'Sonido ambiental'}
      style={{
        position:'fixed', bottom:24, left:24, zIndex:9997,
        width:38, height:38, borderRadius:'50%',
        border:`1px solid ${soundOn ? c.cyan : 'rgba(255,255,255,0.1)'}`,
        background: soundOn ? 'rgba(6,182,212,0.15)' : 'rgba(7,7,15,0.8)',
        color: soundOn ? c.cyan : c.muted,
        cursor:'none', fontSize:16,
        display:'flex', alignItems:'center', justifyContent:'center',
        backdropFilter:'blur(8px)',
        boxShadow: soundOn ? `0 0 16px rgba(6,182,212,0.3)` : 'none',
        transition:'all 0.3s',
      }}>
      {soundOn ? '🔊' : '🔇'}
    </button>
  )
}

// ── TOASTS ──
let _toastListeners = []
export const toast = (msg, type = 'info', duration = 3500) => {
  const id = Date.now() + Math.random()
  _toastListeners.forEach(fn => fn({ id, msg, type, duration }))
}

function ToastContainer() {
  const [toasts, setToasts] = useState([])
  useEffect(() => {
    const handler = (t) => {
      setToasts(prev => [...prev, t])
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), t.duration)
    }
    _toastListeners.push(handler)
    return () => { _toastListeners = _toastListeners.filter(fn => fn !== handler) }
  }, [])

  const colors = {
    info:    { border:'#06b6d4', icon:'ℹ️', glow:'rgba(6,182,212,0.15)' },
    success: { border:'#84cc16', icon:'✅', glow:'rgba(132,204,22,0.15)' },
    warning: { border:'#f59e0b', icon:'⚠️', glow:'rgba(245,158,11,0.15)' },
    error:   { border:'#f43f5e', icon:'❌', glow:'rgba(244,63,94,0.15)'  },
  }

  return (
    <>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(60px) scale(0.9)}to{opacity:1;transform:translateX(0) scale(1)}}`}</style>
      <div style={{position:'fixed',bottom:24,right:24,zIndex:9997,display:'flex',flexDirection:'column',gap:10,pointerEvents:'none'}}>
        {toasts.map(t => {
          const col = colors[t.type] || colors.info
          return (
            <div key={t.id} style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'12px 18px',
              background:'rgba(7,7,15,0.95)',
              border:`1px solid ${col.border}`,
              borderLeft:`3px solid ${col.border}`,
              borderRadius:12,
              boxShadow:`0 0 24px ${col.glow}, 0 4px 20px rgba(0,0,0,0.5)`,
              backdropFilter:'blur(12px)',
              minWidth:240, maxWidth:360,
              animation:'toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards',
              fontFamily:'system-ui',
            }}>
              <span style={{fontSize:16}}>{col.icon}</span>
              <span style={{fontSize:13,color:'#f1f5f9',fontWeight:500,lineHeight:1.4}}>{t.msg}</span>
            </div>
          )
        })}
      </div>
    </>
  )
}

// ── AGUJERO NEGRO — canvas 3D con física orbital real ──
function BlackHole({ onDone }) {
  const canvasRef = useRef(null)
  const frameRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const W = canvas.width
    const H = canvas.height
    const cx = W / 2
    const cy = H / 2
    const start = performance.now()
    const DURATION = 3200

    // Disco inclinado — 0=visto de frente, 1=de canto
    const TILT = 0.28

    // Estrellas de fondo que spiralizan
    const stars = Array.from({ length: 200 }, () => ({
      angle: Math.random() * Math.PI * 2,
      r: 80 + Math.random() * Math.max(W, H) * 0.6,
      speed: 0.0008 + Math.random() * 0.002,
      size: 0.4 + Math.random() * 1.8,
      brightness: 0.2 + Math.random() * 0.8,
      color: Math.random() > 0.8 ? '#aad4ff' : '#ffffff',
    }))

    // Partículas del disco en órbita
    const diskP = Array.from({ length: 280 }, () => {
      const r = 58 + Math.random() * 200
      return {
        angle: Math.random() * Math.PI * 2,
        r,
        speed: 0.025 + Math.random() * 0.04,
        size: 0.8 + Math.random() * 2.2,
        temp: 0.4 + Math.random() * 0.6, // 0=frío/rojo, 1=caliente/blanco
      }
    })

    // Filamentos de gas cayendo (spaghettification)
    const filaments = Array.from({ length: 12 }, (_, i) => ({
      angle: (i / 12) * Math.PI * 2 + Math.random() * 0.5,
      r: 180 + Math.random() * 300,
      speed: 0.003 + Math.random() * 0.005,
      length: 40 + Math.random() * 80,
      opacity: 0.2 + Math.random() * 0.5,
    }))

    const draw = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / DURATION, 1)

      // Limpiar con trail sutil para motion blur
      ctx.fillStyle = 'rgba(2,2,12,0.88)'
      ctx.fillRect(0, 0, W, H)

      // ── ESTRELLAS ──
      for (const s of stars) {
        s.angle += s.speed * (1 + progress * 6)
        s.r = Math.max(0, s.r - s.r * 0.0012 * (1 + progress * 10))
        if (s.r < 8) continue

        const sx = cx + Math.cos(s.angle) * s.r
        const sy = cy + Math.sin(s.angle) * s.r * 0.55 // perspectiva

        const fade = s.r < 60 ? s.r / 60 : 1
        ctx.save()
        ctx.globalAlpha = s.brightness * fade
        ctx.fillStyle = s.color
        ctx.shadowColor = s.color
        ctx.shadowBlur = s.size > 1.2 ? 4 : 0
        ctx.beginPath()
        ctx.arc(sx, sy, s.size * Math.min(fade + 0.2, 1), 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // ── LENTE GRAVITACIONAL ──
      for (let ring = 3; ring >= 0; ring--) {
        const ringR = 62 + ring * 55
        const ringAlpha = [0.06, 0.1, 0.14, 0.07][ring]
        const ringColor = ring < 2 ? 'rgba(255,210,100,' : 'rgba(245,140,0,'
        const lensGrad = ctx.createRadialGradient(cx, cy, ringR * 0.7, cx, cy, ringR * 1.3)
        lensGrad.addColorStop(0, ringColor + '0)')
        lensGrad.addColorStop(0.4, ringColor + ringAlpha + ')')
        lensGrad.addColorStop(0.65, ringColor + (ringAlpha * 2.5) + ')')
        lensGrad.addColorStop(0.85, ringColor + ringAlpha + ')')
        lensGrad.addColorStop(1, ringColor + '0)')
        ctx.fillStyle = lensGrad
        ctx.beginPath()
        ctx.arc(cx, cy, ringR * 1.3, 0, Math.PI * 2)
        ctx.fill()
      }

      // ── DISCO TRASERO (se renderiza detrás del horizonte) ──
      ctx.save()
      ctx.translate(cx, cy)

      const drawDiskHalf = (startAngle, endAngle, alpha, blur) => {
        ctx.save()
        ctx.filter = `blur(${blur}px)`
        ctx.globalAlpha = alpha

        // Gradiente del disco: caliente adentro, frío afuera
        const diskGrad = ctx.createRadialGradient(0, 0, 52, 0, 0, 240)
        diskGrad.addColorStop(0, 'rgba(255,240,180,0.95)')
        diskGrad.addColorStop(0.15, 'rgba(255,180,60,0.85)')
        diskGrad.addColorStop(0.35, 'rgba(220,80,0,0.6)')
        diskGrad.addColorStop(0.6, 'rgba(140,30,0,0.3)')
        diskGrad.addColorStop(0.85, 'rgba(60,10,0,0.1)')
        diskGrad.addColorStop(1, 'rgba(0,0,0,0)')

        // El truco 3D: escalamos Y para simular la perspectiva del disco
        ctx.scale(1, TILT)
        ctx.beginPath()
        ctx.ellipse(0, 0, 240, 240, 0, startAngle, endAngle)
        ctx.lineTo(0, 0)
        ctx.fillStyle = diskGrad
        ctx.fill()
        ctx.restore()
      }

      // Mitad trasera (parte de arriba en pantalla = atrás en 3D)
      drawDiskHalf(Math.PI, Math.PI * 2, 0.7, 6)

      ctx.restore()

      // ── HORIZONTE DE EVENTOS ──
      const bhR = 56

      // Sombra profunda alrededor
      const shadowGrad = ctx.createRadialGradient(cx, cy, bhR * 0.5, cx, cy, bhR * 2.8)
      shadowGrad.addColorStop(0, 'rgba(0,0,0,1)')
      shadowGrad.addColorStop(0.38, 'rgba(0,0,0,1)')
      shadowGrad.addColorStop(0.65, 'rgba(0,0,8,0.92)')
      shadowGrad.addColorStop(0.85, 'rgba(0,0,12,0.6)')
      shadowGrad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = shadowGrad
      ctx.beginPath()
      ctx.arc(cx, cy, bhR * 2.8, 0, Math.PI * 2)
      ctx.fill()

      // Núcleo — con ilusión de profundidad 3D
      // La luz viene de arriba-derecha, el núcleo se hunde
      const coreGrad = ctx.createRadialGradient(
        cx + bhR * 0.28, cy - bhR * 0.28, 2,
        cx, cy, bhR
      )
      coreGrad.addColorStop(0, '#06080f')
      coreGrad.addColorStop(0.5, '#030408')
      coreGrad.addColorStop(1, '#000000')
      ctx.fillStyle = coreGrad
      ctx.beginPath()
      ctx.arc(cx, cy, bhR, 0, Math.PI * 2)
      ctx.fill()

      // Anillos internos del vórtice (efecto profundidad)
      for (let v = 0; v < 6; v++) {
        const vr = bhR * (0.88 - v * 0.13)
        if (vr <= 2) continue
        ctx.save()
        ctx.globalAlpha = 0.04 + v * 0.01
        ctx.strokeStyle = `rgba(80,100,180,0.6)`
        ctx.lineWidth = 0.5
        ctx.beginPath()
        ctx.ellipse(cx, cy, vr, vr * 0.65, 0, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      }

      // ── DISCO FRONTAL (frente del horizonte, más brillante) ──
      ctx.save()
      ctx.translate(cx, cy)
      drawDiskHalf(0, Math.PI, 1.0, 4)

      // Aro interior caliente solo en la mitad frontal
      const innerGrad = ctx.createRadialGradient(0, 0, 50, 0, 0, 95)
      innerGrad.addColorStop(0, 'rgba(255,255,220,0)')
      innerGrad.addColorStop(0.3, 'rgba(255,230,150,0.9)')
      innerGrad.addColorStop(0.6, 'rgba(255,150,30,0.5)')
      innerGrad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.save()
      ctx.scale(1, TILT)
      ctx.beginPath()
      ctx.ellipse(0, 0, 95, 95, 0, 0, Math.PI)
      ctx.lineTo(0, 0)
      ctx.fillStyle = innerGrad
      ctx.globalAlpha = 1.1
      ctx.fill()
      ctx.restore()

      ctx.restore()

      // ── PARTÍCULAS ORBITANDO ──
      for (const p of diskP) {
        // Conservación del momento angular: más rápido al acercarse
        p.angle += p.speed * (65 / Math.max(p.r, 8))
        p.r = Math.max(0, p.r - 0.06 * (1 + progress * 3))
        if (p.r < 8) continue

        // Proyección 3D del plano del disco
        const x3d = Math.cos(p.angle) * p.r
        const z3d = Math.sin(p.angle) * p.r
        const px = cx + x3d
        const py = cy + z3d * TILT

        const distCenter = Math.hypot(px - cx, py - cy)
        if (distCenter < bhR * 0.92) continue

        // Fade al acercarse al horizonte
        const edgeFade = Math.min(1, (distCenter - bhR) / 28)
        // Frente = más brillante, atrás = más opaco
        const isFront = z3d > 0
        const depthAlpha = isFront ? 0.95 : 0.35

        // Color por temperatura: interno=blanco-amarillo, externo=rojo
        const t = p.temp
        const r = Math.min(255, 180 + Math.floor(t * 75))
        const g = Math.floor(60 + t * 170)
        const b = Math.floor(t * 60)

        ctx.save()
        ctx.globalAlpha = edgeFade * depthAlpha
        ctx.fillStyle = `rgb(${r},${g},${b})`
        if (isFront) {
          ctx.shadowColor = `rgb(${r},${g},${b})`
          ctx.shadowBlur = 4
        }
        ctx.beginPath()
        ctx.arc(px, py, p.size * (isFront ? 1 : 0.55), 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // ── FILAMENTOS DE GAS ──
      for (const f of filaments) {
        f.angle += f.speed * (1 + progress * 4)
        f.r = Math.max(0, f.r - f.r * 0.002 * (1 + progress * 5))
        if (f.r < 20) continue

        const fx = cx + Math.cos(f.angle) * f.r
        const fy = cy + Math.sin(f.angle) * f.r * 0.5
        const fx2 = cx + Math.cos(f.angle + 0.08) * (f.r - f.length)
        const fy2 = cy + Math.sin(f.angle + 0.08) * (f.r - f.length) * 0.5

        const fade = Math.min(1, f.r / 80)
        ctx.save()
        ctx.globalAlpha = f.opacity * fade
        ctx.strokeStyle = 'rgba(245,160,80,0.6)'
        ctx.lineWidth = 0.8
        ctx.beginPath()
        ctx.moveTo(fx, fy)
        ctx.lineTo(fx2, fy2)
        ctx.stroke()
        ctx.restore()
      }

      // ── JETS RELATIVISTAS ──
      const jetAlpha = Math.min(progress * 1.5, 0.55)
      if (jetAlpha > 0.05) {
        const jetH = 340
        // Jet superior
        const jg1 = ctx.createLinearGradient(cx, cy - bhR, cx, cy - bhR - jetH)
        jg1.addColorStop(0, `rgba(120,160,255,${jetAlpha})`)
        jg1.addColorStop(0.3, `rgba(90,120,230,${jetAlpha * 0.7})`)
        jg1.addColorStop(0.7, `rgba(70,90,200,${jetAlpha * 0.3})`)
        jg1.addColorStop(1, 'rgba(60,80,200,0)')
        ctx.save()
        ctx.fillStyle = jg1
        ctx.shadowColor = 'rgba(120,160,255,0.4)'
        ctx.shadowBlur = 12
        ctx.beginPath()
        ctx.moveTo(cx - 5, cy - bhR)
        ctx.lineTo(cx + 5, cy - bhR)
        ctx.lineTo(cx + 1.5, cy - bhR - jetH)
        ctx.lineTo(cx - 1.5, cy - bhR - jetH)
        ctx.fill()
        ctx.restore()

        // Jet inferior
        const jg2 = ctx.createLinearGradient(cx, cy + bhR, cx, cy + bhR + jetH)
        jg2.addColorStop(0, `rgba(120,160,255,${jetAlpha})`)
        jg2.addColorStop(0.3, `rgba(90,120,230,${jetAlpha * 0.7})`)
        jg2.addColorStop(1, 'rgba(60,80,200,0)')
        ctx.save()
        ctx.fillStyle = jg2
        ctx.shadowColor = 'rgba(120,160,255,0.3)'
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.moveTo(cx - 5, cy + bhR)
        ctx.lineTo(cx + 5, cy + bhR)
        ctx.lineTo(cx + 1.5, cy + bhR + jetH)
        ctx.lineTo(cx - 1.5, cy + bhR + jetH)
        ctx.fill()
        ctx.restore()
      }

      // ── EXPANSIÓN FINAL — el agujero traga todo ──
      if (progress > 0.72) {
        const ep = (progress - 0.72) / 0.28
        const expandR = bhR + Math.pow(ep, 1.8) * Math.max(W, H) * 2.2

        // La expansión tiene un borde luminoso antes de la oscuridad
        if (ep < 0.6) {
          const edgeGrad = ctx.createRadialGradient(cx, cy, expandR * 0.94, cx, cy, expandR)
          edgeGrad.addColorStop(0, 'rgba(0,0,0,0)')
          edgeGrad.addColorStop(0.5, `rgba(245,160,0,${ep * 0.4})`)
          edgeGrad.addColorStop(1, 'rgba(0,0,0,0)')
          ctx.fillStyle = edgeGrad
          ctx.beginPath()
          ctx.arc(cx, cy, expandR, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.fillStyle = '#000000'
        ctx.globalAlpha = Math.pow(ep, 1.4)
        ctx.beginPath()
        ctx.arc(cx, cy, expandR * 0.96, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      }

      if (elapsed < DURATION) {
        frameRef.current = requestAnimationFrame(draw)
      } else {
        onDone()
      }
    }

    frameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameRef.current)
  }, [onDone])

  return (
    <canvas ref={canvasRef} style={{
      position:'fixed', inset:0, zIndex:9999, background:'#02020c',
    }}/>
  )
}


// ── FONDO VIVO — grid de puntos con ondas radar ──
function LivingBackground() {
  const canvasRef = useRef(null)
  const frameRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const SPACING = 34
    let time = 0

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      time += 0.007

      const cols = Math.ceil(canvas.width / SPACING) + 1
      const rows = Math.ceil(canvas.height / SPACING) + 1
      const cx = canvas.width / 2
      const cy = canvas.height / 2

      for (let r = 0; r < rows; r++) {
        for (let col = 0; col < cols; col++) {
          const x = col * SPACING
          const y = r * SPACING
          const dx = x - cx
          const dy = y - cy
          const dist = Math.hypot(dx, dy)

          // Onda que parte del centro y se propaga hacia afuera
          const wave = Math.sin(dist * 0.016 - time * 1.8) * 0.5 + 0.5
          // Segunda onda más lenta para complejidad
          const wave2 = Math.sin(dist * 0.008 - time * 0.9 + Math.PI) * 0.3 + 0.3

          const alpha = (wave * 0.065 + wave2 * 0.025)

          // Color: mezcla sutil entre cyan y violet según posición
          const hue = 190 + (dx / canvas.width) * 80
          
          ctx.save()
          ctx.globalAlpha = alpha
          ctx.fillStyle = `hsl(${hue}, 80%, 65%)`
          ctx.beginPath()
          ctx.arc(x, y, 1.1, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }
      }

      frameRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(frameRef.current)
    }
  }, [])

  return (
    <canvas ref={canvasRef} style={{
      position:'fixed', inset:0, zIndex:0,
      pointerEvents:'none', opacity:0.55,
    }}/>
  )
}


// ── WIDGET DÓLAR FLOTANTE ──
function DollarWidget() {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [rates, setRates] = useState({ oficial: null, blue: null })
  const [prevRates, setPrevRates] = useState({})
  const [lp, setLp] = useState('')
  const [lpSaved, setLpSaved] = useState('')
  const [applying, setApplying] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [coinAngle, setCoinAngle] = useState(0)

  useEffect(() => {
    // Cargar LP guardado
    const saved = localStorage.getItem('steps_lp_usd')
    if (saved) { setLp(saved); setLpSaved(saved) }
    fetchRates()
    // Slow coin spin animation
    let angle = 0
    const spin = setInterval(() => {
      angle = (angle + 0.4) % 360
      setCoinAngle(angle)
    }, 32)
    return () => clearInterval(spin)
  }, [])

  const fetchRates = async () => {
    setRefreshing(true)
    try {
      const [ofRes, blRes] = await Promise.all([
        fetch('https://dolarapi.com/v1/dolares/oficial'),
        fetch('https://dolarapi.com/v1/dolares/blue'),
      ])
      const [oficial, blue] = await Promise.all([ofRes.json(), blRes.json()])
      setRates(prev => {
        setPrevRates({ oficial: prev.oficial?.venta, blue: prev.blue?.venta })
        return { oficial, blue }
      })
    } catch(e) { console.error('DolarAPI:', e) }
    setRefreshing(false)
  }

  const saveLp = () => {
    if (!lp) return
    localStorage.setItem('steps_lp_usd', lp)
    setLpSaved(lp)
  }

  const applyToProducts = async () => {
    if (!lpSaved || applying) return
    setApplying(true)
    const { data } = await supabase
      .from('products')
      .select('id, price_usd, margin')
      .not('price_usd', 'is', null)
      .gt('price_usd', 0)
    for (const p of data || []) {
      const cost = Math.round(+p.price_usd * +lpSaved)
      const sale = p.margin ? Math.round(cost * (1 + +p.margin / 100)) : null
      await supabase.from('products').update({
        cost_price: cost,
        ...(sale ? { sale_price: sale } : {}),
        cotizacion: +lpSaved,
        updated_at: new Date(),
      }).eq('id', p.id)
    }
    setApplying(false)
  }

  const arrow = (current, prev) => {
    if (!prev || !current) return { sym: '—', col: 'rgba(148,163,184,0.4)' }
    if (+current > +prev) return { sym: '↑', col: '#84cc16' }
    if (+current < +prev) return { sym: '↓', col: '#f43f5e' }
    return { sym: '→', col: 'rgba(148,163,184,0.5)' }
  }

  const fmt = n => n ? `$${(+n).toLocaleString('es-AR')}` : '…'

  // Shine position based on angle
  const shineX = 50 + Math.cos(coinAngle * Math.PI / 180) * 25
  const shineY = 50 + Math.sin(coinAngle * Math.PI / 180) * 20

  return (
    <div style={{ position:'fixed', bottom:24, right:24, zIndex:9996 }}>

      {/* ── PANEL EXPANDIDO ── */}
      {open && (
        <div style={{
          position:'absolute', bottom:58, right:0, width:272,
          background:'rgba(3,3,14,0.94)',
          backdropFilter:'blur(48px) saturate(200%)',
          WebkitBackdropFilter:'blur(48px) saturate(200%)',
          border:'1px solid rgba(255,255,255,0.09)',
          borderTop:'1px solid rgba(255,255,255,0.2)',
          borderRadius:18,
          padding:'16px 16px 14px',
          boxShadow:[
            '0 0 0 1px rgba(245,160,0,0.08)',
            '0 0 40px rgba(245,160,0,0.08)',
            '0 32px 80px rgba(0,0,0,0.7)',
            'inset 0 1px 0 rgba(255,255,255,0.1)',
          ].join(','),
          animation:'dollarPop 0.32s cubic-bezier(0.34,1.3,0.64,1)',
        }}>
          <style>{`
            @keyframes dollarPop {
              from { opacity:0; transform:scale(0.88) translateY(12px); transform-origin:bottom right; }
              to   { opacity:1; transform:scale(1) translateY(0); }
            }
          `}</style>

          {/* Header */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
            <span style={{fontSize:11,fontWeight:700,color:'rgba(245,180,0,0.85)',textTransform:'uppercase',letterSpacing:'0.12em'}}>
              Tipos de cambio
            </span>
            <button onClick={fetchRates} disabled={refreshing}
              style={{background:'none',border:'none',color:'rgba(148,163,184,0.45)',cursor:'pointer',fontSize:14,
                transform:refreshing?'rotate(180deg)':'rotate(0)',transition:'transform 0.5s',padding:'2px 6px'}}>
              ↻
            </button>
          </div>

          {/* Oficial + Blue */}
          {[
            { label:'Oficial', key:'oficial', data:rates.oficial },
            { label:'Blue',    key:'blue',    data:rates.blue },
          ].map(({ label, key, data }) => {
            const arr = arrow(data?.venta, prevRates[key])
            return (
              <div key={key} style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'9px 12px', borderRadius:10, marginBottom:7,
                background:'rgba(255,255,255,0.035)',
                border:'1px solid rgba(255,255,255,0.06)',
                borderTop:'1px solid rgba(255,255,255,0.1)',
              }}>
                <span style={{fontSize:12,color:'rgba(148,163,184,0.65)',fontWeight:500,minWidth:50}}>{label}</span>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:10,color:'rgba(148,163,184,0.35)'}}>C {fmt(data?.compra)}</span>
                  <span style={{fontSize:15,fontWeight:800,color:'#f1f5f9',letterSpacing:'-0.02em'}}>
                    {fmt(data?.venta)}
                  </span>
                  <span style={{fontSize:18,fontWeight:900,color:arr.col,lineHeight:1}}>{arr.sym}</span>
                </div>
              </div>
            )
          })}

          {/* LP editable */}
          <div style={{
            padding:'10px 12px', borderRadius:10, marginBottom:10,
            background:'rgba(245,160,0,0.05)',
            border:'1px solid rgba(245,160,0,0.18)',
            borderTop:'1px solid rgba(245,160,0,0.3)',
          }}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:7}}>
              <span style={{fontSize:11,color:'rgba(245,160,0,0.85)',fontWeight:700}}>LP — lista de precios</span>
              {lpSaved && <span style={{fontSize:9,color:'rgba(132,204,22,0.7)',letterSpacing:'0.05em'}}>✓ ACTIVO</span>}
            </div>
            <div style={{display:'flex',gap:6,alignItems:'center'}}>
              <span style={{fontSize:13,color:'rgba(148,163,184,0.5)',flexShrink:0}}>$</span>
              <input type="number" value={lp} onChange={e=>setLp(e.target.value)}
                placeholder="Ej: 1290"
                onKeyDown={e=>e.key==='Enter'&&saveLp()}
                style={{
                  flex:1, background:'rgba(255,255,255,0.06)',
                  border:'1px solid rgba(255,255,255,0.09)', borderRadius:8,
                  padding:'6px 8px', color:'#f1f5f9', fontSize:16,
                  fontWeight:800, outline:'none', letterSpacing:'-0.02em',
                }}/>
              <button onClick={saveLp} disabled={!lp||lp===lpSaved}
                style={{
                  padding:'6px 12px', borderRadius:8, border:'none', cursor:'pointer',
                  background:'rgba(245,160,0,0.18)', color:'rgba(245,160,0,0.9)',
                  fontSize:12, fontWeight:700, flexShrink:0,
                  opacity:(!lp||lp===lpSaved)?0.35:1, transition:'opacity 0.2s',
                }}>✓</button>
            </div>
          </div>

          {/* Aplicar a productos */}
          <button onClick={applyToProducts} disabled={!lpSaved||applying}
            style={{
              width:'100%', padding:'10px', borderRadius:10, border:'none',
              background: applying
                ? 'rgba(255,255,255,0.05)'
                : lpSaved
                  ? 'linear-gradient(135deg,rgba(245,160,0,0.85),rgba(220,100,0,0.75))'
                  : 'rgba(255,255,255,0.04)',
              color: applying ? 'rgba(148,163,184,0.5)' : lpSaved ? '#000' : 'rgba(148,163,184,0.3)',
              cursor: !lpSaved||applying ? 'default' : 'pointer',
              fontSize:12, fontWeight:800,
              boxShadow: lpSaved && !applying ? '0 0 24px rgba(245,160,0,0.2)' : 'none',
              transition:'all 0.2s',
              letterSpacing:'0.01em',
            }}>
            {applying ? '⏳ Actualizando...' : lpSaved ? `⚡ Aplicar $${lpSaved} a productos` : 'Definí el LP primero'}
          </button>
        </div>
      )}

      {/* ── MONEDA 3D ── */}
      <button
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width:48, height:48, borderRadius:'50%', border:'none', cursor:'none',
          position:'relative', overflow:'hidden',
          // Gradiente metálico que rota con el ángulo
          background:`conic-gradient(from ${coinAngle}deg,
            #C8941A 0%, #F5D060 15%, #FFE87C 22%, #D4A520 30%,
            #8B6510 40%, #C8941A 50%, #F5D060 65%, #FFE87C 72%,
            #D4A520 80%, #8B6510 90%, #C8941A 100%)`,
          transform: hovered || open
            ? 'perspective(180px) rotateX(8deg) rotateY(-5deg) translateY(-4px) scale(1.12)'
            : 'perspective(180px) rotateX(14deg) rotateY(0deg)',
          boxShadow: hovered || open ? [
            '0 8px 0 rgba(0,0,0,0.45)',
            '0 12px 28px rgba(0,0,0,0.5)',
            `0 0 0 1px rgba(245,200,80,0.5)`,
            `0 0 35px rgba(245,180,0,0.55)`,
            'inset 0 2px 0 rgba(255,255,255,0.55)',
            'inset 0 -2px 0 rgba(0,0,0,0.3)',
          ].join(',') : [
            '0 4px 0 rgba(0,0,0,0.4)',
            '0 6px 16px rgba(0,0,0,0.45)',
            'inset 0 1px 0 rgba(255,255,255,0.35)',
            'inset 0 -1px 0 rgba(0,0,0,0.25)',
          ].join(','),
          transition:'transform 0.28s cubic-bezier(0.34,1.3,0.64,1), box-shadow 0.28s ease',
        }}
      >
        {/* Brillo de lente rotando */}
        <div style={{
          position:'absolute',
          width:24, height:24, borderRadius:'50%',
          background:`radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 70%)`,
          left:`${shineX - 12}%`, top:`${shineY - 12}%`,
          transform:'scale(0.85)',
          pointerEvents:'none', mixBlendMode:'screen',
          transition:'left 0.1s, top 0.1s',
        }}/>

        {/* Relieve del borde de la moneda */}
        <div style={{
          position:'absolute', inset:2, borderRadius:'50%',
          border:'1px solid rgba(255,255,255,0.15)',
          pointerEvents:'none',
        }}/>

        {/* Símbolo $ */}
        <span style={{
          position:'relative', zIndex:1,
          fontSize:22, fontWeight:900, lineHeight:1,
          color: hovered || open ? '#3D2200' : '#5C3800',
          textShadow:'0 1px 0 rgba(255,255,255,0.45), 0 -1px 0 rgba(0,0,0,0.35)',
          display:'flex', alignItems:'center', justifyContent:'center',
          width:'100%', height:'100%',
          letterSpacing:'-1px',
          transition:'color 0.2s',
          userSelect:'none',
        }}>$</span>
      </button>
    </div>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showBlackHole, setShowBlackHole] = useState(false)
  const [showApp, setShowApp] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) { setSession(session); setShowApp(true) }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && !showApp) { setSession(session); setShowBlackHole(true) }
      else if (!session) { setShowApp(false); setShowBlackHole(false); setSession(null) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    setShowApp(false); setShowBlackHole(false); setSession(null)
  }

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#07070f',display:'flex',alignItems:'center',justifyContent:'center',color:'#06b6d4',fontFamily:'system-ui'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:8}}>⚡</div>
        <div style={{fontSize:12,color:'#475569'}}>Iniciando sistema...</div>
      </div>
    </div>
  )

  if (showBlackHole && !showApp) {
    return <BlackHole onDone={() => { setShowBlackHole(false); setShowApp(true) }} />
  }

  if (!session || !showApp) return <Auth />

  return (
    <BrowserRouter>
      <div style={{
        display:'flex', minHeight:'100vh', background:c.bg, color:c.text, position:'relative',
        fontFamily:'system-ui,-apple-system,sans-serif', cursor:'none',
      }}>
        {/* SIDEBAR */}
        <div style={{
          width:196, flexShrink:0, zIndex:1,
          borderRight:`1px solid ${c.border}`,
          background:'rgba(255,255,255,0.015)',
          display:'flex', flexDirection:'column',
          position:'sticky', top:0, height:'100vh', overflowY:'auto',
        }}>
          <div style={{padding:'20px 16px 16px',borderBottom:`1px solid ${c.border}`,flexShrink:0}}>
            <div style={{
              fontSize:22, fontWeight:900, letterSpacing:'-1px',
              background:`linear-gradient(135deg,${c.cyan},${c.violet})`,
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            }}>
              STEPS
            </div>
            <div style={{fontSize:9,color:c.muted,marginTop:2,textTransform:'uppercase',letterSpacing:'0.15em'}}>
              Command Center
            </div>
          </div>

          <nav style={{padding:'10px 8px',flex:1}}>
            {nav.map(n => (
              <NavLink key={n.to} to={n.to} end={n.to==='/'} style={({isActive}) => ({
                display:'flex', alignItems:'center', gap:9, padding:'8px 10px',
                borderRadius:8, marginBottom:2, fontSize:12, fontWeight:isActive?600:400,
                textDecoration:'none', transition:'all .15s',
                background:isActive?`rgba(6,182,212,0.12)`:'transparent',
                color:isActive?c.cyan:c.sub,
                borderLeft:isActive?`2px solid ${c.cyan}`:'2px solid transparent',
              })}>
                <span style={{fontSize:15,flexShrink:0}}>{n.icon}</span>
                <span>{n.label}</span>
              </NavLink>
            ))}
          </nav>

          <div style={{padding:'12px 16px',borderTop:`1px solid ${c.border}`,flexShrink:0}}>
            <div style={{fontSize:10,color:c.muted,marginBottom:8}}>{session.user.email}</div>
            <button onClick={logout}
              style={{width:'100%',padding:'7px',borderRadius:7,border:`1px solid ${c.border}`,background:'transparent',color:c.sub,cursor:'none',fontSize:11,transition:'all .2s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='#f43f5e';e.currentTarget.style.color='#f43f5e'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=c.border;e.currentTarget.style.color=c.sub}}>
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* CONTENIDO */}
        <div style={{flex:1,overflowY:'auto',padding:24,zIndex:1,position:'relative'}}>
          <Routes>
            <Route path="/" element={<Dashboard/>}/>
            <Route path="/ventas" element={<Ventas/>}/>
            <Route path="/facturacion" element={<Facturacion/>}/>
            <Route path="/presupuestos" element={<Presupuestos/>}/>
            <Route path="/clientes" element={<Clientes/>}/>
            <Route path="/proveedores" element={<Proveedores/>}/>
            <Route path="/catalogo" element={<Catalogo/>}/>
            <Route path="/carga-productos" element={<CargaProductos/>}/>
            <Route path="/stock" element={<Stock/>}/>
            <Route path="/caja" element={<Caja/>}/>
            <Route path="/tareas" element={<Tareas/>}/>
            <Route path="/notas" element={<Notas/>}/>
          </Routes>
        </div>

        <LivingBackground />
        <CustomCursor />
        <SoundButton />
        <ToastContainer />
        <DollarWidget />
      </div>
    </BrowserRouter>
  )
}

export default App
