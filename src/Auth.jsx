import { useState } from 'react'
import { supabase } from './supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const login = async () => {
    if (!email || !password) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Email o contraseña incorrectos')
    setLoading(false)
  }

  return (
    <div onMouseMove={e=>{
      const el = document.getElementById('glow')
      if(el){ el.style.left=`${(e.clientX/window.innerWidth)*100-35}%`; el.style.top=`${(e.clientY/window.innerHeight)*100-30}%` }
    }} style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:'system-ui,-apple-system,sans-serif', position:'relative', overflow:'hidden',
      background:'linear-gradient(160deg,#020b18 0%,#041428 40%,#061a2e 70%,#030d1a 100%)',
    }}>

      <style>{`
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes pulseGlow{0%,100%{opacity:0.7;transform:scale(1)}50%{opacity:1;transform:scale(1.03)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        input::placeholder{color:rgba(148,163,184,0.4)}
        input:focus{border-color:rgba(245,160,0,0.5)!important;outline:none;box-shadow:0 0 0 3px rgba(245,160,0,0.1)!important}
      `}</style>

      {/* Fondo grid industrial */}
      <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.05}} xmlns="http://www.w3.org/2000/svg">
        {Array.from({length:20}).map((_,i)=>(
          <line key={`h${i}`} x1="0" y1={`${i*5}%`} x2="100%" y2={`${i*5}%`} stroke="#f5a000" strokeWidth="0.5"/>
        ))}
        {Array.from({length:20}).map((_,i)=>(
          <line key={`v${i}`} x1={`${i*5}%`} y1="0" x2={`${i*5}%`} y2="100%" stroke="#f5a000" strokeWidth="0.5"/>
        ))}
        <line x1="0" y1="100%" x2="40%" y2="0" stroke="#f5a000" strokeWidth="1" opacity="0.5"/>
        <line x1="100%" y1="100%" x2="60%" y2="0" stroke="#f5a000" strokeWidth="1" opacity="0.5"/>
        {Array.from({length:10}).map((_,i)=>Array.from({length:7}).map((_,j)=>(
          <circle key={`d${i}${j}`} cx={`${8+i*9}%`} cy={`${12+j*13}%`} r="1" fill="#f5a000" opacity="0.4"/>
        )))}
      </svg>

      {/* Glow que sigue el mouse */}
      <div id="glow" style={{
        position:'absolute',pointerEvents:'none',
        width:'70%',height:'60%',left:'15%',top:'10%',
        background:'radial-gradient(ellipse,rgba(245,160,0,0.1) 0%,rgba(6,182,212,0.07) 40%,transparent 70%)',
        transition:'left 2s ease,top 2s ease',filter:'blur(40px)',
      }}/>

      {/* Glow superior fijo */}
      <div style={{
        position:'absolute',top:'-10%',left:'50%',transform:'translateX(-50%)',
        width:'80%',height:'50%',pointerEvents:'none',
        background:'radial-gradient(ellipse at 50% 0%,rgba(6,182,212,0.12) 0%,rgba(245,160,0,0.05) 40%,transparent 70%)',
        filter:'blur(20px)',
      }}/>

      {/* Partículas */}
      {[{x:'15%',y:'20%',s:3},{x:'85%',y:'15%',s:2},{x:'10%',y:'70%',s:4},{x:'90%',y:'65%',s:2},{x:'50%',y:'8%',s:3},{x:'75%',y:'80%',s:2}].map((p,i)=>(
        <div key={i} style={{position:'absolute',left:p.x,top:p.y,width:p.s,height:p.s,borderRadius:'50%',
          background:'#f5a000',opacity:0.6,boxShadow:`0 0 ${p.s*3}px #f5a000`,
          animation:`float ${3+i*0.5}s ease-in-out infinite alternate`}}/>
      ))}

      {/* CONTENIDO */}
      <div style={{position:'relative',zIndex:10,width:'100%',maxWidth:420,padding:'0 24px',
        animation:'slideUp 0.8s ease forwards'}}>

        {/* LOGO */}
        <div style={{textAlign:'center',marginBottom:36}}>
          <div style={{animation:'pulseGlow 4s ease-in-out infinite',display:'inline-block'}}>
            <img
              src="/imagen_sin_fondo.png"
              alt="STEPS"
              style={{
                width:130, height:'auto',
                mixBlendMode:'screen',
                filter:'drop-shadow(0 0 24px rgba(245,160,0,0.7)) drop-shadow(0 0 48px rgba(245,160,0,0.3))',
              }}
            />
          </div>
        </div>

        {/* FORMULARIO */}
        <div style={{
          background:'rgba(4,20,40,0.85)',backdropFilter:'blur(20px)',
          border:'1px solid rgba(245,160,0,0.2)',borderRadius:20,padding:32,
          boxShadow:'0 0 60px rgba(6,182,212,0.08),0 0 120px rgba(245,160,0,0.04),inset 0 1px 0 rgba(255,255,255,0.05)',
        }}>
          <div style={{fontSize:13,color:'rgba(148,163,184,0.8)',marginBottom:24,textAlign:'center',letterSpacing:'0.05em'}}>
            Acceso al Command Center
          </div>

          <div style={{marginBottom:16}}>
            <label style={{fontSize:10,color:'rgba(245,160,0,0.8)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:6}}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
              placeholder="tu@email.com" onKeyDown={e=>e.key==='Enter'&&login()}
              style={{width:'100%',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:10,padding:'12px 14px',color:'#f1f5f9',fontSize:14,boxSizing:'border-box',transition:'all .2s'}}/>
          </div>

          <div style={{marginBottom:24}}>
            <label style={{fontSize:10,color:'rgba(245,160,0,0.8)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:6}}>Contraseña</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
              placeholder="••••••••" onKeyDown={e=>e.key==='Enter'&&login()}
              style={{width:'100%',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:10,padding:'12px 14px',color:'#f1f5f9',fontSize:14,boxSizing:'border-box',transition:'all .2s'}}/>
          </div>

          {error&&<div style={{padding:'10px 12px',borderRadius:8,background:'rgba(244,63,94,0.1)',
            border:'1px solid rgba(244,63,94,0.3)',color:'#f43f5e',fontSize:13,marginBottom:16}}>{error}</div>}

          <button onClick={login} disabled={loading||!email||!password} style={{
            width:'100%',padding:'14px',borderRadius:10,border:'none',cursor:'pointer',
            background:'linear-gradient(135deg,#f5a000,#c97000)',
            color:'#1a0a00',fontSize:14,fontWeight:800,letterSpacing:'0.05em',
            boxShadow:'0 0 24px rgba(245,160,0,0.35)',transition:'all .3s',
            opacity:(!email||!password)?0.5:1,
          }}
          onMouseEnter={e=>e.target.style.boxShadow='0 0 40px rgba(245,160,0,0.6)'}
          onMouseLeave={e=>e.target.style.boxShadow='0 0 24px rgba(245,160,0,0.35)'}>
            {loading?'Ingresando...':'INGRESAR →'}
          </button>

          <div style={{marginTop:20,paddingTop:16,borderTop:'1px solid rgba(255,255,255,0.05)',textAlign:'center'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:'#f5a000',boxShadow:'0 0 8px #f5a000',animation:'pulseGlow 2s ease infinite'}}/>
              <span style={{fontSize:10,color:'rgba(100,116,139,0.8)',letterSpacing:'0.1em',textTransform:'uppercase'}}>Sistema activo — Acceso privado</span>
            </div>
          </div>
        </div>

        <div style={{textAlign:'center',marginTop:20,fontSize:10,color:'rgba(71,85,105,0.6)',letterSpacing:'0.05em'}}>
          STEPS Command Center v2.0 · Solo usuarios autorizados
        </div>
      </div>
    </div>
  )
}
