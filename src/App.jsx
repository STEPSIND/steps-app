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

// ── BLACK HOLE TRANSITION ──
function BlackHole({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1800)
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
          0%   { opacity:0.08; transform:scale(1); }
          100% { opacity:0; transform:scale(4) perspective(600px) rotateX(25deg); }
        }
        @keyframes suckParticle {
          0%   { opacity:0.8; transform:scale(1); }
          100% { opacity:0; transform:scale(0) translate(50vw, 50vh); }
        }
        @keyframes pulseCore {
          0%,100% { box-shadow: 0 0 40px 10px rgba(245,160,0,0.6), 0 0 80px 20px rgba(245,160,0,0.3); }
          50%      { box-shadow: 0 0 80px 20px rgba(245,160,0,0.9), 0 0 160px 40px rgba(245,160,0,0.5); }
        }
      `}</style>

      {/* Grid warp */}
      <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',animation:'warpOut 1.6s ease-in forwards'}}>
        {Array.from({length:24}).map((_,i)=>(
          <line key={`h${i}`} x1="0" y1={`${i*4.2}%`} x2="100%" y2={`${i*4.2}%`} stroke="#f5a000" strokeWidth="0.4"/>
        ))}
        {Array.from({length:24}).map((_,i)=>(
          <line key={`v${i}`} x1={`${i*4.2}%`} y1="0" x2={`${i*4.2}%`} y2="100%" stroke="#f5a000" strokeWidth="0.4"/>
        ))}
      </svg>

      {/* Partículas succionadas */}
      {[{x:'15%',y:'20%'},{x:'85%',y:'15%'},{x:'10%',y:'70%'},{x:'90%',y:'65%'},{x:'50%',y:'8%'},{x:'75%',y:'80%'},{x:'30%',y:'90%'},{x:'60%',y:'5%'}].map((p,i)=>(
        <div key={i} style={{
          position:'absolute', left:p.x, top:p.y,
          width:4, height:4, borderRadius:'50%',
          background:'#f5a000', boxShadow:'0 0 8px #f5a000',
          animation:`suckParticle ${0.8+i*0.1}s ease-in ${i*0.05}s forwards`,
        }}/>
      ))}

      {/* Corona exterior giratoria */}
      <div style={{
        position:'absolute', left:'50%', top:'50%',
        width:400, height:400, borderRadius:'50%',
        background:'conic-gradient(from 0deg, transparent 50%, rgba(245,160,0,0.5) 70%, rgba(255,140,0,0.8) 85%, transparent 100%)',
        animation:'coronaSpin 0.6s linear infinite',
        filter:'blur(6px)',
      }}/>

      {/* Corona interior */}
      <div style={{
        position:'absolute', left:'50%', top:'50%',
        width:260, height:260, borderRadius:'50%',
        background:'conic-gradient(from 180deg, transparent 40%, rgba(6,182,212,0.6) 65%, rgba(245,160,0,0.7) 80%, transparent 100%)',
        animation:'coronaSpinRev 0.9s linear infinite',
        filter:'blur(4px)',
      }}/>

      {/* Anillo de distorsión 1 */}
      <div style={{
        position:'absolute', left:'50%', top:'50%',
        width:180, height:180, borderRadius:'50%',
        border:'4px solid rgba(245,160,0,0.9)',
        boxShadow:'0 0 30px 8px rgba(245,160,0,0.6), inset 0 0 30px rgba(245,160,0,0.4)',
        animation:'bhRing1 1.4s ease-out forwards',
      }}/>

      {/* Anillo de distorsión 2 */}
      <div style={{
        position:'absolute', left:'50%', top:'50%',
        width:100, height:100, borderRadius:'50%',
        border:'2px solid rgba(6,182,212,0.7)',
        boxShadow:'0 0 20px 4px rgba(6,182,212,0.5)',
        animation:'bhRing2 1.2s ease-out 0.1s forwards',
      }}/>

      {/* Núcleo — agujero negro que se expande */}
      <div style={{
        position:'absolute', left:'50%', top:'50%',
        width:100, height:100, borderRadius:'50%',
        background:'radial-gradient(circle, #000000 50%, #020b18 100%)',
        animation:'bhExpand 1.7s cubic-bezier(0.15,0,0.6,1) forwards, pulseCore 0.3s ease infinite',
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
      if (session) {
        setSession(session)
        setShowApp(true)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && !showApp) {
        // Login recién exitoso — mostrar agujero negro primero
        setSession(session)
        setShowBlackHole(true)
      } else if (!session) {
        setShowApp(false)
        setShowBlackHole(false)
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

  // Agujero negro en progreso
  if (showBlackHole && !showApp) {
    return <BlackHole onDone={() => { setShowBlackHole(false); setShowApp(true) }} />
  }

  // Sin sesión → login
  if (!session || !showApp) return <Auth />

  return (
    <BrowserRouter>
      <div style={{display:'flex',minHeight:'100vh',background:c.bg,color:c.text,fontFamily:'system-ui,-apple-system,sans-serif'}}>

        <div style={{width:196,flexShrink:0,borderRight:`1px solid ${c.border}`,background:'rgba(255,255,255,0.015)',display:'flex',flexDirection:'column',position:'sticky',top:0,height:'100vh',overflowY:'auto'}}>
          <div style={{padding:'20px 16px 16px',borderBottom:`1px solid ${c.border}`,flexShrink:0}}>
            <div style={{fontSize:22,fontWeight:900,letterSpacing:'-1px',background:`linear-gradient(135deg,${c.cyan},${c.violet})`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
              STEPS
            </div>
            <div style={{fontSize:9,color:c.muted,marginTop:2,textTransform:'uppercase',letterSpacing:'0.15em'}}>Command Center</div>
          </div>

          <nav style={{padding:'10px 8px',flex:1}}>
            {nav.map(n=>(
              <NavLink key={n.to} to={n.to} end={n.to==='/'} style={({isActive})=>({
                display:'flex',alignItems:'center',gap:9,padding:'8px 10px',
                borderRadius:8,marginBottom:2,fontSize:12,fontWeight:isActive?600:400,
                textDecoration:'none',transition:'all .15s',
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
            <button onClick={logout} style={{width:'100%',padding:'7px',borderRadius:7,border:`1px solid ${c.border}`,background:'transparent',color:c.sub,cursor:'pointer',fontSize:11,transition:'all .2s'}}
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
