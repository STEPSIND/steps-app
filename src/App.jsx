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

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
  }

  if (loading) return (
    <div style={{minHeight:'100vh',background:c.bg,display:'flex',alignItems:'center',justifyContent:'center',color:c.cyan,fontFamily:'system-ui'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:8}}>⚡</div>
        <div>Cargando...</div>
      </div>
    </div>
  )

  if (!session) return <Auth />

  return (
    <BrowserRouter>
      <div style={{display:'flex',minHeight:'100vh',background:c.bg,color:c.text,fontFamily:'system-ui,-apple-system,sans-serif'}}>

        {/* SIDEBAR */}
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
            <div style={{fontSize:10,color:c.muted,marginBottom:8}}>
              {session.user.email}
            </div>
            <button onClick={logout} style={{width:'100%',padding:'7px',borderRadius:7,
              border:`1px solid ${c.border}`,background:'transparent',color:c.sub,
              cursor:'pointer',fontSize:11,transition:'all .2s'}}
              onMouseEnter={e=>{e.target.style.borderColor='#f43f5e';e.target.style.color='#f43f5e'}}
              onMouseLeave={e=>{e.target.style.borderColor=c.border;e.target.style.color=c.sub}}>
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* CONTENIDO */}
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
