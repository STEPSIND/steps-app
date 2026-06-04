import { useState } from 'react'
import { supabase } from './supabase'

const c = {
  bg:'#07070f', border:'rgba(255,255,255,0.07)',
  cyan:'#06b6d4', violet:'#7c3aed', text:'#f1f5f9', muted:'#475569', sub:'#94a3b8'
}

export default function Auth({ onLogin }) {
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
    <div style={{minHeight:'100vh',background:c.bg,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}>
      <div style={{width:'100%',maxWidth:400,padding:24}}>

        {/* LOGO */}
        <div style={{textAlign:'center',marginBottom:40}}>
          <div style={{fontSize:48,fontWeight:900,letterSpacing:'-2px',
            background:`linear-gradient(135deg,${c.cyan},${c.violet})`,
            WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',marginBottom:8}}>
            STEPS
          </div>
          <div style={{fontSize:12,color:c.muted,textTransform:'uppercase',letterSpacing:'0.15em'}}>
            Command Center
          </div>
          <div style={{fontSize:13,color:c.sub,marginTop:8}}>
            seguridad y construcción
          </div>
        </div>

        {/* FORM */}
        <div style={{background:'rgba(255,255,255,0.04)',border:`1px solid ${c.border}`,borderRadius:16,padding:28}}>
          <div style={{fontSize:16,fontWeight:700,marginBottom:24,color:c.text}}>Iniciar sesión</div>

          <div style={{marginBottom:14}}>
            <label style={{fontSize:11,color:c.sub,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em',display:'block',marginBottom:5}}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
              placeholder="tu@email.com"
              onKeyDown={e=>e.key==='Enter'&&login()}
              style={{width:'100%',background:'rgba(255,255,255,0.06)',border:`1px solid ${c.border}`,
              borderRadius:8,padding:'10px 12px',color:c.text,fontSize:14,outline:'none',boxSizing:'border-box'}}/>
          </div>

          <div style={{marginBottom:20}}>
            <label style={{fontSize:11,color:c.sub,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em',display:'block',marginBottom:5}}>Contraseña</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e=>e.key==='Enter'&&login()}
              style={{width:'100%',background:'rgba(255,255,255,0.06)',border:`1px solid ${c.border}`,
              borderRadius:8,padding:'10px 12px',color:c.text,fontSize:14,outline:'none',boxSizing:'border-box'}}/>
          </div>

          {error&&(
            <div style={{padding:'10px 12px',borderRadius:8,background:'rgba(244,63,94,0.1)',border:'1px solid rgba(244,63,94,0.3)',color:'#f43f5e',fontSize:13,marginBottom:16}}>
              {error}
            </div>
          )}

          <button onClick={login} disabled={loading||!email||!password} style={{
            width:'100%',padding:'12px',borderRadius:8,border:'none',
            background:loading?c.muted:`linear-gradient(135deg,${c.cyan},${c.violet})`,
            color:'#fff',fontSize:14,fontWeight:700,cursor:loading?'not-allowed':'pointer',
            opacity:(!email||!password)?0.5:1,transition:'all .2s'
          }}>
            {loading?'Ingresando...':'Ingresar →'}
          </button>
        </div>

        <div style={{textAlign:'center',marginTop:20,fontSize:11,color:c.muted}}>
          STEPS — Acceso privado · Solo usuarios autorizados
        </div>
      </div>
    </div>
  )
}
