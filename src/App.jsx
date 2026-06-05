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
    const cx = W / 2
    const cy = H / 2

    // Estrellas de fondo — campo estelar distante
    const stars = Array.from({ length: 1800 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.2,
      brightness: 0.3 + Math.random() * 0.7,
      twinkle: Math.random() * Math.PI * 2,
    }))

    // Partículas del disco de acreción
    // El disco de Gargantua en Interstellar es un anillo brillante
    // con gas y polvo orbitando en un plano ecuatorial
    const diskParticles = []
    for (let i = 0; i < 2400; i++) {
      const angle = Math.random() * Math.PI * 2
      // Distribución realista: más denso cerca del horizonte
      const minR = 90, maxR = 340
      const r = minR + Math.pow(Math.random(), 0.5) * (maxR - minR)
      // Elipse aplastada = disco visto de costado ligeramente inclinado
      const inclination = 0.22  // inclinación del disco (Interstellar ~15-20°)
      const x = cx + Math.cos(angle) * r
      const y = cy + Math.sin(angle) * r * inclination
      // Color físico: más caliente cerca del centro (azul-blanco), más frío afuera (rojo-naranja)
      const temp = 1 - (r - minR) / (maxR - minR)  // 1=caliente, 0=frío
      const hue = temp > 0.7 ? 200 - temp * 160 : 35 - temp * 20
      const sat = 80 + temp * 20
      const light = 45 + temp * 40
      diskParticles.push({
        angle,
        r,
        x, y,
        baseX: x, baseY: y,
        size: 0.8 + Math.random() * 2.5,
        color: `hsl(${hue},${sat}%,${light}%)`,
        speed: 0.0008 + (1 / r) * 0.08,  // velocidad orbital kepleriana
        opacity: 0.4 + Math.random() * 0.6,
        inclination,
      })
    }

    // Jet relativista — chorro de plasma polar
    const jetParticles = []
    for (let i = 0; i < 120; i++) {
      const side = i < 60 ? 1 : -1
      jetParticles.push({
        progress: Math.random(),
        speed: 0.003 + Math.random() * 0.004,
        spread: Math.random() * 18,
        side,
        opacity: Math.random() * 0.6,
        size: 1 + Math.random() * 2,
      })
    }

    let start = null
    const DURATION = 4000  // 4 segundos — cinematográfico

    const draw = (ts) => {
      if (!start) start = ts
      const elapsed = ts - start
      const t = Math.min(elapsed / DURATION, 1)

      // Fondo — espacio profundo, negro absoluto
      ctx.fillStyle = '#000005'
      ctx.fillRect(0, 0, W, H)

      // === CAMPO ESTELAR ===
      // Las estrellas se curvan hacia el agujero negro por lensing gravitacional
      const lensStrength = t < 0.6 ? t * 0.6 : 0.36 + (t - 0.6) * 0.4
      for (const s of stars) {
        const dx = s.x - cx, dy = s.y - cy
        const dist = Math.sqrt(dx * dx + dy * dy)
        const schwR = 85  // radio de Schwarzschild visual

        if (dist < schwR * 0.9) continue  // detrás del horizonte

        // Deflexión gravitacional — las estrellas se curvan alrededor del núcleo
        const deflection = lensStrength * 18000 / (dist * dist + 1)
        const angle = Math.atan2(dy, dx)
        const lensedX = s.x - Math.cos(angle) * deflection * (1 - dist / (W * 0.8))
        const lensedY = s.y - Math.sin(angle) * deflection * (1 - dist / (H * 0.8))

        const twinkle = 0.7 + 0.3 * Math.sin(s.twinkle + elapsed * 0.002)
        ctx.save()
        ctx.globalAlpha = s.brightness * twinkle * Math.min(1, dist / schwR)
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(lensedX, lensedY, s.r, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // === SHADOW — sombra del agujero negro ===
      // El interior es negro absoluto — nada escapa
      const shadowR = 82
      const shadowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, shadowR * 2.5)
      shadowGrad.addColorStop(0, 'rgba(0,0,0,1)')
      shadowGrad.addColorStop(0.65, 'rgba(0,0,0,1)')
      shadowGrad.addColorStop(0.8, 'rgba(0,0,5,0.95)')
      shadowGrad.addColorStop(1, 'rgba(0,0,10,0)')
      ctx.beginPath()
      ctx.arc(cx, cy, shadowR * 2.5, 0, Math.PI * 2)
      ctx.fillStyle = shadowGrad
      ctx.fill()

      // === DISCO DE ACRECIÓN ===
      // Rotación orbital kepleriana — las partículas internas van más rápido
      for (const p of diskParticles) {
        p.angle += p.speed
        p.x = cx + Math.cos(p.angle) * p.r
        p.y = cy + Math.sin(p.angle) * p.r * p.inclination

        const distToCenter = Math.sqrt(
          (p.x - cx) * (p.x - cx) + (p.y - cy) * (p.y - cy)
        )

        // Ocultamiento relativista: parte trasera del disco se ve más tenue
        // y parte delantera inferior se dobla hacia arriba (efecto Interstellar)
        const behindFactor = p.angle % (Math.PI * 2) > Math.PI
          ? 0.4 + 0.6 * Math.abs(Math.sin(p.angle))
          : 1

        // Efecto Doppler: lado que se acerca es más brillante/azul
        const dopplerShift = Math.cos(p.angle) * 0.4

        if (distToCenter < shadowR * 0.85) continue

        ctx.save()
        ctx.globalAlpha = p.opacity * behindFactor * Math.min(1, (distToCenter - shadowR * 0.7) / 30)

        // Elongación de partículas = streaks de gas orbitando
        ctx.translate(p.x, p.y)
        ctx.rotate(p.angle + Math.PI / 2)
        ctx.scale(3.5 + dopplerShift, 1)

        // Glow de cada partícula
        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 3)
        glow.addColorStop(0, p.color)
        glow.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(0, 0, p.size * 3, 0, Math.PI * 2)
        ctx.fillStyle = glow
        ctx.fill()

        ctx.restore()
      }

      // === PHOTON SPHERE — anillo de fotones ===
      // En la película, el anillo brillante más cercano al centro
      const photonR = shadowR * 1.18
      for (let layer = 0; layer < 3; layer++) {
        const layerR = photonR - layer * 4
        const photonGrad = ctx.createRadialGradient(cx, cy, layerR * 0.85, cx, cy, layerR * 1.15)
        photonGrad.addColorStop(0, `rgba(255,220,150,${0.08 - layer * 0.02})`)
        photonGrad.addColorStop(0.5, `rgba(255,200,100,${0.25 - layer * 0.06})`)
        photonGrad.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(cx, cy, layerR * 1.15, 0, Math.PI * 2)
        ctx.fillStyle = photonGrad
        ctx.fill()
      }

      // Arco superior del disco — el "fantasma" que aparece por lensing
      // En Interstellar se ve una franja brillante sobre el agujero negro
      ctx.save()
      ctx.translate(cx, cy)
      for (let i = 0; i < 180; i++) {
        const a = (i / 180) * Math.PI  // solo arco superior
        const ghostR = shadowR * 1.08 + Math.sin(a) * 12
        const gx = Math.cos(a - Math.PI / 2) * ghostR
        const gy = Math.sin(a - Math.PI / 2) * ghostR * 0.15  // muy aplanado arriba
        const brightness = 0.3 + 0.7 * Math.sin(a)
        ctx.beginPath()
        ctx.arc(gx, gy - shadowR * 0.12, 3, 0, Math.PI * 2)
        const ghostGrad = ctx.createRadialGradient(gx, gy - shadowR * 0.12, 0, gx, gy - shadowR * 0.12, 8)
        ghostGrad.addColorStop(0, `rgba(255,230,160,${brightness * 0.7})`)
        ghostGrad.addColorStop(1, 'transparent')
        ctx.fillStyle = ghostGrad
        ctx.fill()
      }
      ctx.restore()

      // === SHADOW DEFINITIVO — tapa el interior ===
      const finalShadow = ctx.createRadialGradient(cx, cy, 0, cx, cy, shadowR)
      finalShadow.addColorStop(0, 'rgba(0,0,0,1)')
      finalShadow.addColorStop(0.92, 'rgba(0,0,0,1)')
      finalShadow.addColorStop(1, 'rgba(0,0,0,0.9)')
      ctx.beginPath()
      ctx.arc(cx, cy, shadowR, 0, Math.PI * 2)
      ctx.fillStyle = finalShadow
      ctx.fill()

      // === JETS RELATIVISTAS ===
      // Chorros de plasma polar — característica de agujeros negros activos
      for (const j of jetParticles) {
        j.progress += j.speed
        if (j.progress > 1) j.progress = 0

        const dist = j.progress * 220
        const jx = cx + (Math.random() - 0.5) * j.spread * (1 + j.progress * 2)
        const jy = cy + j.side * (shadowR * 0.9 + dist)

        const jetOpacity = j.opacity * (1 - j.progress * 0.8) * 0.5
        if (jetOpacity <= 0) continue

        ctx.save()
        ctx.globalAlpha = jetOpacity
        const jGrad = ctx.createRadialGradient(jx, jy, 0, jx, jy, j.size * 2)
        jGrad.addColorStop(0, 'rgba(180,220,255,1)')
        jGrad.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(jx, jy, j.size * 2, 0, Math.PI * 2)
        ctx.fillStyle = jGrad
        ctx.fill()
        ctx.restore()
      }

      // === FASE ABSORCIÓN (t > 0.55) ===
      // El agujero negro "crece" y absorbe la escena — transición a la app
      if (t > 0.55) {
        const absorbT = (t - 0.55) / 0.45
        const absorbR = absorbT * Math.max(W, H) * 1.5

        // Colapso — círculo negro que crece desde el centro
        ctx.save()
        ctx.beginPath()
        ctx.arc(cx, cy, absorbR, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0,0,0,${Math.min(1, absorbT * 1.4)})`
        ctx.fill()
        ctx.restore()

        // Onda de energía en el borde de absorción — Hawking radiation visual
        if (absorbT < 0.9) {
          const waveGrad = ctx.createRadialGradient(cx, cy, absorbR * 0.88, cx, cy, absorbR)
          waveGrad.addColorStop(0, 'transparent')
          waveGrad.addColorStop(0.6, `rgba(245,160,0,${0.25 * (1 - absorbT)})`)
          waveGrad.addColorStop(0.85, `rgba(6,182,212,${0.15 * (1 - absorbT)})`)
          waveGrad.addColorStop(1, 'transparent')
          ctx.beginPath()
          ctx.arc(cx, cy, absorbR, 0, Math.PI * 2)
          ctx.fillStyle = waveGrad
          ctx.fill()
        }

        // Reconstrucción — el fondo de la app emerge
        if (absorbT > 0.75) {
          const emergeT = (absorbT - 0.75) / 0.25
          ctx.save()
          ctx.globalAlpha = emergeT
          ctx.fillStyle = '#07070f'
          ctx.fillRect(0, 0, W, H)
          ctx.restore()
        }
      }

      if (t < 1) {
        requestAnimationFrame(draw)
      } else {
        setTimeout(onDone, 80)
      }
    }

    requestAnimationFrame(draw)
  }, [])

  return (
    <div style={{position:'fixed',inset:0,zIndex:9999,background:'#000005'}}>
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
