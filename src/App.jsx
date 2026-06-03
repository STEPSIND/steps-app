import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Catalogo from './pages/Catalogo'
import Proveedores from './pages/Proveedores'
import Clientes from './pages/Clientes'
import Propuestas from './pages/Propuestas'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div style={{display:'flex',minHeight:'100vh',background:'#07070f',color:'#f1f5f9',fontFamily:'system-ui'}}>
        
        {/* SIDEBAR */}
        <div style={{width:200,flexShrink:0,borderRight:'1px solid rgba(255,255,255,0.07)',background:'rgba(255,255,255,0.02)',display:'flex',flexDirection:'column'}}>
          <div style={{padding:'20px 16px',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
            <div style={{fontSize:22,fontWeight:900,background:'linear-gradient(135deg,#06b6d4,#7c3aed)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>STEPS</div>
            <div style={{fontSize:9,color:'#475569',marginTop:2,textTransform:'uppercase',letterSpacing:'0.15em'}}>Command Center</div>
          </div>
          <nav style={{padding:'12px 10px',flex:1}}>
            {[
              {to:'/',icon:'🏠',label:'Dashboard'},
              {to:'/catalogo',icon:'📦',label:'Catálogo'},
              {to:'/proveedores',icon:'🏭',label:'Proveedores'},
              {to:'/clientes',icon:'👥',label:'Clientes'},
              {to:'/propuestas',icon:'✨',label:'Propuestas'},
            ].map(n=>(
              <NavLink key={n.to} to={n.to} end={n.to==='/'} style={({isActive})=>({
                display:'flex',alignItems:'center',gap:10,padding:'9px 10px',
                borderRadius:8,marginBottom:2,fontSize:13,fontWeight:isActive?600:400,
                textDecoration:'none',transition:'all .15s',
                background:isActive?'rgba(6,182,212,0.15)':'transparent',
                color:isActive?'#06b6d4':'#94a3b8',
                borderLeft:isActive?'2px solid #06b6d4':'2px solid transparent',
              })}>
                <span style={{fontSize:16}}>{n.icon}</span>{n.label}
              </NavLink>
            ))}
          </nav>
          <div style={{padding:'12px 16px',borderTop:'1px solid rgba(255,255,255,0.07)',fontSize:10,color:'#475569'}}>
            STEPS — seguridad y construcción
          </div>
        </div>

        {/* CONTENIDO */}
        <div style={{flex:1,overflowY:'auto',padding:28}}>
          <Routes>
            <Route path="/" element={<Dashboard/>}/>
            <Route path="/catalogo" element={<Catalogo/>}/>
            <Route path="/proveedores" element={<Proveedores/>}/>
            <Route path="/clientes" element={<Clientes/>}/>
            <Route path="/propuestas" element={<Propuestas/>}/>
          </Routes>
        </div>

      </div>
    </BrowserRouter>
  )
}

export default App