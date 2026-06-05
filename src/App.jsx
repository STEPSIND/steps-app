import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
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

function BlackHole({ onDone }) {
  useEffect(() => {
    const canvas = document.getElementById('bh-canvas')
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width = window.innerWidth
    const H = canvas.height = window.innerHeight
    const cx = W / 2, cy = H / 2

    const COLS = 120, ROWS = 80
    const particles = []

    for (let i = 0; i < COLS; i++) {
      for (let j = 0; j < ROWS; j++) {
        const x = (i / COLS) * W
        const y = (j / ROWS) * H
        const dx = x - cx, dy = y - cy
        const dist = Math.sqrt(dx * dx + dy * dy)
        const hue = 200 + Math.random() * 40
        const sat = 30 + Math.random() * 40
        const light = 10 + Math.random() * 25
        particles.push({
          x, y, ox: x, oy: y,
          vx: 0, vy: 0,
          dist,
          angle: Math.atan2(dy, dx),
          size: 1.5 + Math.random() * 2,
          color: `hsl(${hue},${sat}%,${light}%)`,
          delay: dist * 0.8,
          speed: 0.015 + Math.random() * 0.01,
          spiralFactor: 0.3 + Math.random() * 0.4,
        })
      }
    }

    for (let i = 0; i < 300; i++) {
      const angle = Math.random() * Math.PI * 2
      const r = 80 + Math.random() * 250
      const x = cx + Math.cos(angle) * r
      const y = cy + Math.sin(angle) * r * 0.3
      const hue = 25 + Math.random() * 30
      particles.push({
        x, y, ox: x, oy: y,
        vx: 0, vy: 0,
        dist: r,
        angle,
        size: 1 + Math.random() * 3,
        color: `hsl(${hue},100%,${50 + Math.random() * 30}%)`,
        delay: 0,
        speed: 0.02 + Math.random() * 0.015,
        spiralFactor: 0.8 + Math.random() * 0.5,
        isAccretion: true,
      })
    }

    let start = null
    const DURATION = 3200

    const draw = (ts) => {
      if (!start) start = ts
      const elapsed = ts - start
      const t = Math.min(elapsed / DURATION, 1)

      ctx.fillStyle = 'rgba(2,11,24,0.18)'
      ctx.fillRect(0, 0, W, H)

      const eventRadius = 60 + t * 40

      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, eventRadius * 3)
      gradient.addColorStop(0, 'rgba(0,0,0,1)')
      gradient.addColorStop(0.3, 'rgba(0,0,0,0.95)')
      gradient.addColorStop(0.6, 'rgba(6,182,212,0.08)')
      gradient.addColorStop(1, 'transparent')
      ctx.beginPath()
      ctx.arc(cx, cy, eventRadius * 3, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()

      const diskOpacity = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3
      if (diskOpacity > 0) {
        const diskGrad = ctx.createRadialGradient(cx, cy, eventRadius * 0.8, cx, cy, eventRadius * 2.2)
        diskGrad.addColorStop(0, `rgba(245,160,0,${0.9 * diskOpacity})`)
        diskGrad.addColorStop(0.3, `rgba(255,100,0,${0.6 * diskOpacity})`)
        diskGrad.addColorStop(0.6, `rgba(200,50,0,${0.3 * diskOpacity})`)
        diskGrad.addColorStop(1, 'transparent')
        ctx.save()
        ctx.translate(cx, cy)
        ctx.scale(1, 0.28)
        ctx.translate(-cx, -cy)
        ctx.beginPath()
        ctx.arc(cx, cy, eventRadius * 2.2, 0, Math.PI * 2)
        ctx.fillStyle = diskGrad
        ctx.fill()
        ctx.restore()
      }

      for (const p of particles) {
        const pt = Math.max(0, (elapsed - p.delay) / (DURATION - p.delay))
        if (pt <= 0) continue

        const pull = Math.pow(pt, 1.6)
        const currentR = p.dist * (1 - pull)
        const spinRate = p.spiralFactor * (1 + pull * 8)
        const currentAngle = p.angle + spinRate * pt * Math.PI * 4

        p.x = cx + Math.cos(currentAngle) * currentR
        p.y = cy + Math.sin(currentAngle) * currentR * (p.isAccretion ? 0.28 : 1)

        const opacity = pt < 0.85 ? 1 : 1 - (pt - 0.85) / 0.15
        if (opacity <= 0) continue

        ctx.save()
        ctx.globalAlpha = opacity
        ctx.fillStyle = p.color
        const sz = p.size * (1 - pull * 0.7)
        ctx.beginPath()
        ctx.arc(p.x, p.y, Math.max(0.3, sz), 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, eventRadius)
      coreGrad.addColorStop(0, 'rgba(0,0,0,1)')
      coreGrad.addColorStop(0.7, 'rgba(0,0,0,0.98)')
      coreGrad.addColorStop(0.9, 'rgba(6,182,212,0.15)')
      coreGrad.addColorStop(1, 'transparent')
      ctx.beginPath()
      ctx.arc(cx, cy, eventRadius, 0, Math.PI * 2)
      ctx.fillStyle = coreGrad
      ctx.fill()

      if (t > 0.1 && t < 0.75) {
        for (let i = 0; i < 3; i++) {
          const fAngle = (t * 15 + i * 2.09) % (Math.PI * 2)
          const fR = eventRadius * 1.05
          const fx = cx + Math.cos(fAngle) * fR
          const fy = cy + Math.sin(fAngle) * fR
          const fGrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, 12)
          fGrad.addColorStop(0, 'rgba(255,255,255,0.9)')
          fGrad.addColorStop(0.4, 'rgba(245,160,0,0.4)')
          fGrad.addColorStop(1, 'transparent')
          ctx.beginPath()
          ctx.arc(fx, fy, 12, 0, Math.PI * 2)
          ctx.fillStyle = fGrad
          ctx.fill()
        }
      }

      if (t > 0.85) {
        const rebuildT = (t - 0.85) / 0.15
        const rebuildR = rebuildT * Math.max(W, H) * 0.8

        const waveGrad = ctx.createRadialGradient(cx, cy, rebuildR * 0.7, cx, cy, rebuildR)
        waveGrad.addColorStop(0, `rgba(6,182,212,${0.3 * (1 - rebuildT)})`)
        waveGrad.addColorStop(0.5, `rgba(124,58,237,${0.15 * (1 - rebuildT)})`)
        waveGrad.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(cx, cy, rebuildR, 0, Math.PI * 2)
        ctx.fillStyle = waveGrad
        ctx.fill()

        ctx.save()
        ctx.beginPath()
        ctx.arc(cx, cy, rebuildR * 0.95, 0, Math.PI * 2)
        ctx.clip()
        ctx.fillStyle = `rgba(7,7,15,${rebuildT})`
        ctx.fillRect(0, 0, W, H)
        ctx.restore()
      }

      if (t < 1) {
        requestAnimationFrame(draw)
      } else {
        setTimeout(onDone, 100)
      }
    }

    requestAnimationFrame(draw)
  }, [])

  return (
    <div style={{position:'fixed',inset:0,zIndex:9999,background:'#020b18'}}>
      <canvas id="bh-canvas" style={{position:'absolute',inset:0,width:'100%',height:'100%'}}/>
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
      if (session) {
        setSession(session)
        setShowApp(true)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && !showApp) {
        setSession(session)
        setShowBlackHole(true)
      } else if (!session) {
        setShowApp(false)
        setShowBlackHole(false)
        setSession(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    setShowApp(false)
    setShowBlackHole(false)
    setSession(null)
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
      <div style={{display:'flex',minHeight:'100vh',background:c.bg,color:c.text,fontFamily:'system-ui,-apple-system,sans-serif'}}>

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
              style={{width:'100%',padding:'7px',borderRadius:7,border:`1px solid ${c.border}`,background:'transparent',color:c.sub,cursor:'pointer',fontSize:11,transition:'all .2s'}}
              onMouseEnter={e=>{e.target.style.borderColor='#f43f5e';e.target.style.color='#f43f5e'}}
              onMouseLeave={e=>{e.target.style.borderColor=c.border;e.target.style.color=c.sub}}>
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

      </div>
    </BrowserRouter>
  )
}

export default App
