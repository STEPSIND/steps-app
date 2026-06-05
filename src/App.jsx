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
  {to:'/carga-productos', icon:'⬆️', label:'Carga Productos'},
  {to:'/stock', icon:'📊', label:'Stock'},
  {to:'/caja', icon:'🏦', label:'Caja y Cheques'},
  {to:'/tareas', icon:'📅', label:'Tareas'},
  {to:'/notas', icon:'📝', label:'Notas'},
]

const c = {
  bg:'#07070f', border:'rgba(255,255,255,0.07)',
  cyan:'#06b6d4', violet:'#7c3aed', text:'#f1f5f9', muted:'#475569', sub:'#94a3b8'
}

// ── CURSOR CON PARTÍCULAS ──
function CustomCursor() {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: -100, y: -100 })
  const particlesRef = useRef([])
  const frameRef = useRef(null)
  const trailRef = useRef(Array.from({ length: 12 }, () => ({ x: -100, y: -100 })))

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
      const speed = Math.hypot(e.clientX - prev.x, e.clientY - prev.y)
      if (speed > 1.5) {
        const count = Math.min(3, Math.floor(speed / 4))
        for (let i = 0; i < count; i++) {
          const hue = 180 + Math.random() * 60
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

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const trail = trailRef.current
      trail.unshift({ x: mouseRef.current.x, y: mouseRef.current.y })
      trail.pop()

      for (let i = 1; i < trail.length; i++) {
        trail[i].x += (trail[i - 1].x - trail[i].x) * 0.4
        trail[i].y += (trail[i - 1].y - trail[i].y) * 0.4
        const opacity = (1 - i / trail.length) * 0.45
        const size = (1 - i / trail.length) * 5
        ctx.save()
        ctx.globalAlpha = opacity
        ctx.fillStyle = '#06b6d4'
        ctx.beginPath()
        ctx.arc(trail[i].x, trail[i].y, size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      particlesRef.current = particlesRef.current.filter(p => p.life > 0)
      for (const p of particlesRef.current) {
        p.x += p.vx
        p.y += p.vy
        p.vy -= 0.03
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

  return <canvas ref={canvasRef} style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:9998}}/>
}

// ── SONIDO AMBIENTAL ──
function SoundButton() {
  const ctxRef = useRef(null)
  const nodesRef = useRef([])
  const [soundOn, setSoundOn] = useState(false)

  const start = () => {
    if (ctxRef.current) return
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
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
      filter.frequency.setValueAtTime(400, ctx.currentTime)
      gainNode.gain.setValueAtTime(0, ctx.currentTime)
      gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + 4)
      osc.connect(filter); filter.connect(gainNode); gainNode.connect(ctx.destination)
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
      osc1.type = 'triangle'; osc2.type = 'sine'
      osc1.frequency.setValueAtTime(freq, ctx.currentTime)
      osc2.frequency.setValueAtTime(freq * 1.005, ctx.currentTime)
      lfo.frequency.setValueAtTime(0.08, ctx.currentTime)
      lfoGain.gain.setValueAtTime(15, ctx.currentTime)
      lfo.connect(lfoGain); lfoGain.connect(filter.frequency)
      filter.type = 'bandpass'; filter.frequency.setValueAtTime(800, ctx.currentTime)
      filter.Q.setValueAtTime(2, ctx.currentTime)
      gainNode.gain.setValueAtTime(0, ctx.currentTime)
      gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + 6)
      osc1.connect(filter); osc2.connect(filter); filter.connect(gainNode); gainNode.connect(ctx.destination)
      osc1.start(); osc2.start(); lfo.start()
      nodes.push({ gainNode })
    }

    createDrone(55, 0.04); createDrone(110, 0.03, 3); createDrone(165, 0.02, -2)
    createPad(220, 0.025); createPad(330, 0.015)
    nodesRef.current = nodes
  }

  const stop = () => {
    if (!ctxRef.current) return
    nodesRef.current.forEach(({ gainNode }) => {
      gainNode.gain.linearRampToValueAtTime(0, ctxRef.current.currentTime + 2)
    })
    setTimeout(() => { ctxRef.current?.close(); ctxRef.current = null }, 2500)
  }

  const toggle = () => {
    if (soundOn) { stop(); setSoundOn(false) }
    else { start(); setSoundOn(true) }
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

// ── AGUJERO NEGRO CSS (versión original mejorada) ──
function BlackHole({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9999,
      background:'linear-gradient(160deg,#020b18 0%,#041428 40%,#061a2e 70%,#030d1a 100%)',
      display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden',
    }}>
      <style>{`
        @keyframes bhExpand {
          0%   { transform:translate(-50%,-50%) scale(0); opacity:1; }
          60%  { transform:translate(-50%,-50%) scale(1.2); opacity:1; }
          100% { transform:translate(-50%,-50%) scale(60); opacity:1; }
        }
        @keyframes bhRing1 {
          0%   { transform:translate(-50%,-50%) scale(0.2) rotate(0deg); opacity:1; }
          100% { transform:translate(-50%,-50%) scale(3) rotate(540deg); opacity:0; }
        }
        @keyframes bhRing2 {
          0%   { transform:translate(-50%,-50%) scale(0.1) rotate(0deg); opacity:0.8; }
          100% { transform:translate(-50%,-50%) scale(4) rotate(-360deg); opacity:0; }
        }
        @keyframes coronaSpin {
          from { transform:translate(-50%,-50%) rotate(0deg); }
          to   { transform:translate(-50%,-50%) rotate(360deg); }
        }
        @keyframes coronaSpinRev {
          from { transform:translate(-50%,-50%) rotate(0deg); }
          to   { transform:translate(-50%,-50%) rotate(-360deg); }
        }
        @keyframes warpOut {
          0%   { opacity:0.06; transform:scale(1); }
          100% { opacity:0; transform:scale(4) perspective(600px) rotateX(25deg); }
        }
        @keyframes suckParticle {
          0%   { opacity:0.9; transform:translate(0,0) scale(1); }
          100% { opacity:0; transform:translate(var(--tx),var(--ty)) scale(0); }
        }
        @keyframes pulseCore {
          0%,100% { box-shadow:0 0 40px 10px rgba(245,160,0,0.6),0 0 80px 20px rgba(245,160,0,0.3),0 0 0 0 rgba(0,0,0,1); }
          50%      { box-shadow:0 0 80px 20px rgba(245,160,0,0.9),0 0 160px 40px rgba(245,160,0,0.5),0 0 0 0 rgba(0,0,0,1); }
        }
        @keyframes starField {
          0%   { opacity:0.6; }
          100% { opacity:0; transform:scale(0.1) translate(var(--sx),var(--sy)); }
        }
        @keyframes diskRotate {
          from { transform:translate(-50%,-50%) rotate(0deg) scaleY(0.22); }
          to   { transform:translate(-50%,-50%) rotate(360deg) scaleY(0.22); }
        }
        @keyframes diskRotateRev {
          from { transform:translate(-50%,-50%) rotate(0deg) scaleY(0.18); }
          to   { transform:translate(-50%,-50%) rotate(-360deg) scaleY(0.18); }
        }
        @keyframes photonPulse {
          0%,100% { opacity:0.6; transform:translate(-50%,-50%) scale(1); }
          50%      { opacity:1; transform:translate(-50%,-50%) scale(1.04); }
        }
        @keyframes emergeApp {
          0%   { opacity:0; transform:scale(0.95); }
          100% { opacity:1; transform:scale(1); }
        }
      `}</style>

      {/* Campo estelar succionado */}
      {Array.from({length:40}).map((_,i) => {
        const x = Math.random() * 100
        const y = Math.random() * 100
        const tx = `${(50 - x) * 0.8}vw`
        const ty = `${(50 - y) * 0.8}vh`
        return (
          <div key={i} style={{
            position:'absolute',
            left:`${x}%`, top:`${y}%`,
            width: 1 + Math.random() * 2,
            height: 1 + Math.random() * 2,
            borderRadius:'50%',
            background:'white',
            '--sx': tx, '--sy': ty,
            animation:`starField ${0.8 + Math.random() * 1.2}s ease-in ${Math.random() * 0.3}s forwards`,
          }}/>
        )
      })}

      {/* Grid warp */}
      <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',animation:'warpOut 1.8s ease-in forwards'}}>
        {Array.from({length:20}).map((_,i)=>(
          <line key={`h${i}`} x1="0" y1={`${i*5}%`} x2="100%" y2={`${i*5}%`} stroke="#f5a000" strokeWidth="0.4" opacity="0.6"/>
        ))}
        {Array.from({length:20}).map((_,i)=>(
          <line key={`v${i}`} x1={`${i*5}%`} y1="0" x2={`${i*5}%`} y2="100%" stroke="#f5a000" strokeWidth="0.4" opacity="0.6"/>
        ))}
      </svg>

      {/* Disco de acreción exterior — lento */}
      <div style={{
        position:'absolute', left:'50%', top:'50%',
        width:500, height:500, borderRadius:'50%',
        background:'conic-gradient(from 0deg,transparent 0%,rgba(245,120,0,0.0) 30%,rgba(245,160,0,0.55) 45%,rgba(255,200,80,0.7) 50%,rgba(245,160,0,0.55) 55%,rgba(245,120,0,0.0) 70%,transparent 100%)',
        animation:'diskRotate 3s linear infinite',
        filter:'blur(8px)',
      }}/>

      {/* Disco de acreción interior — rápido */}
      <div style={{
        position:'absolute', left:'50%', top:'50%',
        width:320, height:320, borderRadius:'50%',
        background:'conic-gradient(from 90deg,transparent 0%,rgba(200,80,0,0.0) 25%,rgba(255,140,0,0.8) 40%,rgba(255,220,100,0.95) 50%,rgba(255,140,0,0.8) 60%,rgba(200,80,0,0.0) 75%,transparent 100%)',
        animation:'diskRotateRev 1.8s linear infinite',
        filter:'blur(5px)',
      }}/>

      {/* Photon sphere — anillo tenue */}
      <div style={{
        position:'absolute', left:'50%', top:'50%',
        width:148, height:148, borderRadius:'50%',
        border:'2px solid rgba(255,220,150,0.5)',
        boxShadow:'0 0 20px 6px rgba(255,200,80,0.25), inset 0 0 20px rgba(255,200,80,0.1)',
        animation:'photonPulse 1.5s ease-in-out infinite',
      }}/>

      {/* Anillo de distorsión 1 — naranja */}
      <div style={{
        position:'absolute', left:'50%', top:'50%',
        width:180, height:180, borderRadius:'50%',
        border:'3px solid rgba(245,160,0,0.85)',
        boxShadow:'0 0 30px 8px rgba(245,160,0,0.5),inset 0 0 30px rgba(245,160,0,0.3)',
        animation:'bhRing1 1.8s ease-out forwards',
      }}/>

      {/* Anillo de distorsión 2 — cyan */}
      <div style={{
        position:'absolute', left:'50%', top:'50%',
        width:110, height:110, borderRadius:'50%',
        border:'2px solid rgba(6,182,212,0.7)',
        boxShadow:'0 0 20px 4px rgba(6,182,212,0.4)',
        animation:'bhRing2 1.5s ease-out 0.15s forwards',
      }}/>

      {/* Partículas succionadas hacia el centro */}
      {Array.from({length:16}).map((_,i) => {
        const angle = (i / 16) * 360
        const dist = 35 + Math.random() * 40
        const tx = `${Math.cos(angle * Math.PI/180) * -dist}vw`
        const ty = `${Math.sin(angle * Math.PI/180) * -dist}vh`
        const colors2 = ['#f5a000','#06b6d4','#ffffff','#f59e0b','#84cc16']
        return (
          <div key={i} style={{
            position:'absolute',
            left:`${50 + Math.cos(angle*Math.PI/180)*38}%`,
            top:`${50 + Math.sin(angle*Math.PI/180)*38}%`,
            width: 3 + Math.random() * 4,
            height: 3 + Math.random() * 4,
            borderRadius:'50%',
            background: colors2[i % colors2.length],
            boxShadow:`0 0 8px ${colors2[i % colors2.length]}`,
            '--tx': tx, '--ty': ty,
            animation:`suckParticle ${0.6 + Math.random() * 0.8}s cubic-bezier(0.4,0,1,1) ${i * 0.04}s forwards`,
          }}/>
        )
      })}

      {/* Núcleo — agujero negro que se expande y traga todo */}
      <div style={{
        position:'absolute', left:'50%', top:'50%',
        width:110, height:110, borderRadius:'50%',
        background:'radial-gradient(circle,#000 55%,#010508 80%,#020b18 100%)',
        animation:'bhExpand 2s cubic-bezier(0.12,0,0.5,1) 0.2s forwards, pulseCore 0.4s ease-in-out infinite',
      }}/>
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
        <div>Cargando...</div>
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
        display:'flex', minHeight:'100vh', background:c.bg, color:c.text,
        fontFamily:'system-ui,-apple-system,sans-serif', cursor:'none',
      }}>
        <div style={{width:196,flexShrink:0,borderRight:`1px solid ${c.border}`,background:'rgba(255,255,255,0.015)',display:'flex',flexDirection:'column',position:'sticky',top:0,height:'100vh',overflowY:'auto'}}>
          <div style={{padding:'20px 16px 16px',borderBottom:`1px solid ${c.border}`,flexShrink:0}}>
            <div style={{fontSize:22,fontWeight:900,letterSpacing:'-1px',
              background:`linear-gradient(135deg,${c.cyan},${c.violet})`,
              WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
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

        <div style={{flex:1,overflowY:'auto',padding:24}}>
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

        {/* Experience — cursor, sonido, toasts */}
        <CustomCursor />
        <SoundButton />
        <ToastContainer />
      </div>
    </BrowserRouter>
  )
}

export default App
