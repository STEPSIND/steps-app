import { useEffect, useRef, useState } from 'react'

// ── SONIDO AMBIENTAL ──
function useAmbientSound() {
  const ctxRef = useRef(null)
  const nodesRef = useRef([])

  const start = () => {
    if (ctxRef.current) return
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    ctxRef.current = ctx
    const nodes = []

    // Capa 1 — drone espacial profundo
    const createDrone = (freq, gain, detune = 0) => {
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()
      const filter = ctx.createBiquadFilter()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      osc.detune.setValueAtTime(detune, ctx.currentTime)
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(400, ctx.currentTime)
      gainNode.gain.setValueAtTime(0, ctx.currentTime)
      gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + 4)
      osc.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(ctx.destination)
      osc.start()
      nodes.push({ osc, gainNode })
      return { osc, gainNode }
    }

    // Capa 2 — pad atmosférico con LFO
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
      osc2.frequency.setValueAtTime(freq * 1.005, ctx.currentTime)

      lfo.frequency.setValueAtTime(0.08, ctx.currentTime)
      lfoGain.gain.setValueAtTime(15, ctx.currentTime)
      lfo.connect(lfoGain)
      lfoGain.connect(filter.frequency)

      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(800, ctx.currentTime)
      filter.Q.setValueAtTime(2, ctx.currentTime)

      gainNode.gain.setValueAtTime(0, ctx.currentTime)
      gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + 6)

      osc1.connect(filter)
      osc2.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(ctx.destination)
      osc1.start(); osc2.start(); lfo.start()
      nodes.push({ osc: osc1, gainNode }, { osc: osc2, gainNode })
    }

    // Capa 3 — shimmer de altas frecuencias
    const createShimmer = () => {
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()
      const filter = ctx.createBiquadFilter()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(2800, ctx.currentTime)
      filter.type = 'highpass'
      filter.frequency.setValueAtTime(2000, ctx.currentTime)
      gainNode.gain.setValueAtTime(0, ctx.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.012, ctx.currentTime + 8)
      osc.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(ctx.destination)
      osc.start()
      nodes.push({ osc, gainNode })
    }

    createDrone(55, 0.04)       // sub bajo
    createDrone(110, 0.03, 3)   // fundamental
    createDrone(165, 0.02, -2)  // quinta
    createPad(220, 0.025)       // pad medio
    createPad(330, 0.015)       // pad agudo
    createShimmer()              // brillo

    nodesRef.current = nodes
  }

  const stop = () => {
    if (!ctxRef.current) return
    nodesRef.current.forEach(({ gainNode }) => {
      gainNode.gain.linearRampToValueAtTime(0, ctxRef.current.currentTime + 2)
    })
    setTimeout(() => {
      ctxRef.current?.close()
      ctxRef.current = null
    }, 2500)
  }

  return { start, stop }
}

// ── CURSOR CON PARTÍCULAS ──
function CustomCursor() {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: -100, y: -100 })
  const particlesRef = useRef([])
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

    const onMove = (e) => {
      const prev = { ...mouseRef.current }
      mouseRef.current = { x: e.clientX, y: e.clientY }

      // Partícula por movimiento
      const speed = Math.hypot(e.clientX - prev.x, e.clientY - prev.y)
      if (speed > 1.5) {
        const count = Math.min(3, Math.floor(speed / 4))
        for (let i = 0; i < count; i++) {
          const hue = 180 + Math.random() * 60  // cyan-violet
          particlesRef.current.push({
            x: e.clientX + (Math.random() - 0.5) * 6,
            y: e.clientY + (Math.random() - 0.5) * 6,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5 - 0.5,
            life: 1,
            decay: 0.03 + Math.random() * 0.04,
            size: 1.5 + Math.random() * 2.5,
            color: `hsl(${hue},80%,65%)`,
          })
        }
      }
    }

    window.addEventListener('mousemove', onMove)

    // Trail del cursor
    const trail = Array.from({ length: 12 }, (_, i) => ({
      x: -100, y: -100, size: (12 - i) / 12,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Trail suave
      trail.unshift({ x: mouseRef.current.x, y: mouseRef.current.y, size: 1 })
      trail.pop()

      for (let i = 1; i < trail.length; i++) {
        trail[i].x += (trail[i - 1].x - trail[i].x) * 0.4
        trail[i].y += (trail[i - 1].y - trail[i].y) * 0.4

        const opacity = (1 - i / trail.length) * 0.5
        const size = (1 - i / trail.length) * 5
        ctx.save()
        ctx.globalAlpha = opacity
        ctx.fillStyle = '#06b6d4'
        ctx.beginPath()
        ctx.arc(trail[i].x, trail[i].y, size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // Partículas
      particlesRef.current = particlesRef.current.filter(p => p.life > 0)
      for (const p of particlesRef.current) {
        p.x += p.vx
        p.y += p.vy
        p.vy -= 0.03  // gravedad invertida leve
        p.life -= p.decay

        ctx.save()
        ctx.globalAlpha = p.life * 0.8
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2)
        grad.addColorStop(0, p.color)
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // Cursor principal — punto cyan con glow
      const { x, y } = mouseRef.current
      if (x > 0) {
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 10)
        glow.addColorStop(0, 'rgba(6,182,212,0.9)')
        glow.addColorStop(0.3, 'rgba(6,182,212,0.4)')
        glow.addColorStop(1, 'transparent')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(x, y, 10, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(x, y, 2.5, 0, Math.PI * 2)
        ctx.fill()
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

  return (
    <canvas ref={canvasRef} style={{
      position:'fixed', inset:0, pointerEvents:'none', zIndex:9998,
    }}/>
  )
}

// ── TOAST SYSTEM ──
let toastListeners = []
export const toast = (msg, type = 'info', duration = 3500) => {
  const id = Date.now() + Math.random()
  toastListeners.forEach(fn => fn({ id, msg, type, duration }))
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const handler = (t) => {
      setToasts(prev => [...prev, t])
      setTimeout(() => {
        setToasts(prev => prev.filter(x => x.id !== t.id))
      }, t.duration)
    }
    toastListeners.push(handler)
    return () => { toastListeners = toastListeners.filter(fn => fn !== handler) }
  }, [])

  const colors = {
    info:    { border:'#06b6d4', icon:'ℹ️', glow:'rgba(6,182,212,0.15)' },
    success: { border:'#84cc16', icon:'✅', glow:'rgba(132,204,22,0.15)' },
    warning: { border:'#f59e0b', icon:'⚠️', glow:'rgba(245,158,11,0.15)' },
    error:   { border:'#f43f5e', icon:'❌', glow:'rgba(244,63,94,0.15)'  },
  }

  return (
    <div style={{
      position:'fixed', bottom:24, right:24, zIndex:9997,
      display:'flex', flexDirection:'column', gap:10,
      pointerEvents:'none',
    }}>
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
            <span style={{fontSize:13, color:'#f1f5f9', fontWeight:500, lineHeight:1.4}}>{t.msg}</span>
          </div>
        )
      })}
      <style>{`
        @keyframes toastIn {
          from { opacity:0; transform:translateX(60px) scale(0.9); }
          to   { opacity:1; transform:translateX(0) scale(1); }
        }
      `}</style>
    </div>
  )
}

// ── COMPONENTE PRINCIPAL ──
export default function Experience() {
  const { start, stop } = useAmbientSound()
  const [soundOn, setSoundOn] = useState(false)

  const toggleSound = () => {
    if (soundOn) { stop(); setSoundOn(false) }
    else { start(); setSoundOn(true) }
  }

  return (
    <>
      <CustomCursor />
      <ToastContainer />

      {/* Botón de sonido ambiental — esquina inferior izquierda */}
      <button
        onClick={toggleSound}
        title={soundOn ? 'Silenciar ambiente' : 'Activar sonido ambiental'}
        style={{
          position:'fixed', bottom:24, left:24, zIndex:9997,
          width:38, height:38, borderRadius:'50%',
          border:`1px solid ${soundOn ? '#06b6d4' : 'rgba(255,255,255,0.1)'}`,
          background: soundOn ? 'rgba(6,182,212,0.15)' : 'rgba(7,7,15,0.8)',
          color: soundOn ? '#06b6d4' : '#475569',
          cursor:'pointer', fontSize:16,
          display:'flex', alignItems:'center', justifyContent:'center',
          backdropFilter:'blur(8px)',
          boxShadow: soundOn ? '0 0 16px rgba(6,182,212,0.3)' : 'none',
          transition:'all 0.3s',
        }}
      >
        {soundOn ? '🔊' : '🔇'}
      </button>
    </>
  )
}
