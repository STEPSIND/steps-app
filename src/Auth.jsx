import { useState } from 'react'
import { supabase } from './supabase'

// Email fijo — solo necesitás la palabra clave
const FIXED_EMAIL = 'santiago.g.steps@gmail.com'

function LockIcon({ unlocked }) {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{
      filter: unlocked
        ? 'drop-shadow(0 0 20px rgba(132,204,22,0.8)) drop-shadow(0 0 40px rgba(132,204,22,0.4))'
        : 'drop-shadow(0 0 12px rgba(245,160,0,0.5))',
      transition: 'filter 0.6s ease',
    }}>
      <defs>
        <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={unlocked ? '#84cc16' : '#f5a000'}/>
          <stop offset="100%" stopColor={unlocked ? '#4ade80' : '#c97000'}/>
        </linearGradient>
        <linearGradient id="lg2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.3)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0.05)"/>
        </linearGradient>
        <filter id="glow">
          <feDropShadow dx="0" dy="2" stdDeviation="4"
            floodColor={unlocked ? '#84cc16' : '#f5a000'} floodOpacity="0.6"/>
        </filter>
      </defs>

      {/* Cuerpo del candado */}
      <rect x="10" y="30" width="44" height="30" rx="6"
        fill="url(#lg1)" filter="url(#glow)"/>
      <rect x="10" y="30" width="44" height="30" rx="6"
        fill="url(#lg2)"/>
      {/* Brillo superior */}
      <rect x="12" y="32" width="40" height="6" rx="3"
        fill="rgba(255,255,255,0.15)"/>

      {/* Arco — se abre cuando unlocked */}
      <path
        d={unlocked
          ? 'M 20 30 L 20 18 Q 20 6 32 6 Q 44 6 44 18 L 44 24'
          : 'M 20 30 L 20 18 Q 20 6 32 6 Q 44 6 44 18 L 44 30'}
        stroke="url(#lg1)" strokeWidth="6" strokeLinecap="round"
        fill="none" filter="url(#glow)"
        style={{ transition: 'all 0.5s cubic-bezier(0.34,1.4,0.64,1)' }}
      />

      {/* Ojo del candado */}
      <circle cx="32" cy="46" r="5"
        fill="rgba(0,0,0,0.35)"
        stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
      {/* Línea del ojo */}
      {!unlocked && <line x1="32" y1="48" x2="32" y2="54"
        stroke="rgba(0,0,0,0.35)" strokeWidth="3" strokeLinecap="round"/>}
      {unlocked && (
        <polyline points="27,46 31,50 37,42"
          stroke="rgba(255,255,255,0.9)" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"/>
      )}
    </svg>
  )
}

export default function Auth() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [blackhole, setBlackhole] = useState(false)

  const login = async () => {
    if (!password.trim()) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({
      email: FIXED_EMAIL,
      password,
    })
    if (error) {
      setError('Palabra secreta incorrecta')
      setLoading(false)
      // Shake effect
      const input = document.getElementById('secret-input')
      if (input) {
        input.style.animation = 'shake 0.4s ease'
        setTimeout(() => { input.style.animation = '' }, 400)
      }
    } else {
      setUnlocked(true)
      setTimeout(() => setBlackhole(true), 700)
    }
  }

  return (
    <div
      onMouseMove={e => {
        const el = document.getElementById('glow')
        if (el) {
          el.style.left = `${(e.clientX / window.innerWidth) * 100 - 35}%`
          el.style.top = `${(e.clientY / window.innerHeight) * 100 - 30}%`
        }
      }}
      style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'system-ui,-apple-system,sans-serif', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(160deg,#020b18 0%,#041428 40%,#061a2e 70%,#030d1a 100%)',
      }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes pulseGlow { 0%,100%{opacity:0.7;transform:scale(1)} 50%{opacity:1;transform:scale(1.03)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}
          60%{transform:translateX(-5px)}
          80%{transform:translateX(5px)}
        }
        @keyframes unlockPop {
          0%{transform:scale(1)}
          40%{transform:scale(1.2)}
          70%{transform:scale(0.95)}
          100%{transform:scale(1)}
        }
        @keyframes bhExpand {
          0%   { transform:translate(-50%,-50%) scale(0); opacity:1; }
          60%  { transform:translate(-50%,-50%) scale(1.2); opacity:1; }
          100% { transform:translate(-50%,-50%) scale(40); opacity:1; }
        }
        @keyframes bhRing {
          0%   { transform:translate(-50%,-50%) scale(0) rotate(0deg); opacity:0.8; }
          100% { transform:translate(-50%,-50%) scale(2.5) rotate(720deg); opacity:0; }
        }
        @keyframes bhSuck {
          0%   { filter:blur(0px) brightness(1); transform:scale(1); opacity:1; }
          40%  { filter:blur(2px) brightness(1.4); transform:scale(0.97); opacity:1; }
          80%  { filter:blur(16px) brightness(2); transform:scale(0.85); opacity:0.4; }
          100% { filter:blur(40px) brightness(0); transform:scale(0.2); opacity:0; }
        }
        @keyframes warpGrid {
          0%   { opacity:0.05; transform:scale(1) perspective(800px) rotateX(0deg); }
          50%  { opacity:0.15; transform:scale(1.1) perspective(800px) rotateX(8deg); }
          100% { opacity:0; transform:scale(3) perspective(800px) rotateX(30deg); }
        }
        @keyframes coronaRotate {
          from { transform:translate(-50%,-50%) rotate(0deg); }
          to   { transform:translate(-50%,-50%) rotate(360deg); }
        }
        @keyframes greenPulse {
          0%,100%{box-shadow:0 0 20px rgba(132,204,22,0.4)}
          50%{box-shadow:0 0 40px rgba(132,204,22,0.8),0 0 80px rgba(132,204,22,0.3)}
        }
        input::placeholder { color:rgba(148,163,184,0.4); }
        input:focus { border-color:rgba(245,160,0,0.5)!important; outline:none; box-shadow:0 0 0 3px rgba(245,160,0,0.1)!important; }
      `}</style>

      {/* BLACK HOLE OVERLAY */}
      {blackhole && (
        <div style={{position:'fixed',inset:0,zIndex:999,pointerEvents:'none',
          display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{position:'absolute',inset:0,animation:'bhSuck 1.6s cubic-bezier(0.4,0,1,1) forwards',background:'transparent'}}/>
          <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',animation:'warpGrid 1.6s ease-in forwards'}}>
            {Array.from({length:20}).map((_,i)=>(
              <line key={`h${i}`} x1="0" y1={`${i*5}%`} x2="100%" y2={`${i*5}%`} stroke="#f5a000" strokeWidth="0.5"/>
            ))}
            {Array.from({length:20}).map((_,i)=>(
              <line key={`v${i}`} x1={`${i*5}%`} y1="0" x2={`${i*5}%`} y2="100%" stroke="#f5a000" strokeWidth="0.5"/>
            ))}
          </svg>
          <div style={{position:'absolute',left:'50%',top:'50%',width:320,height:320,borderRadius:'50%',
            border:'2px solid transparent',
            background:'conic-gradient(from 0deg, transparent 60%, rgba(245,160,0,0.6) 80%, transparent 100%)',
            animation:'coronaRotate 0.8s linear infinite',filter:'blur(4px)'}}/>
          <div style={{position:'absolute',left:'50%',top:'50%',width:280,height:280,borderRadius:'50%',
            background:'conic-gradient(from 0deg, #f5a000 0%, #ff6b00 15%, transparent 40%, #c97000 70%, transparent 100%)',
            animation:'coronaRotate 1.2s linear infinite reverse',filter:'blur(8px)',opacity:0.7}}/>
          <div style={{position:'absolute',left:'50%',top:'50%',width:160,height:160,borderRadius:'50%',
            border:'6px solid rgba(245,160,0,0.8)',
            boxShadow:'0 0 40px 10px rgba(245,160,0,0.5), inset 0 0 40px rgba(245,160,0,0.3)',
            animation:'bhRing 1.5s ease-out forwards'}}/>
          <div style={{position:'absolute',left:'50%',top:'50%',width:120,height:120,borderRadius:'50%',
            background:'radial-gradient(circle, #000 40%, rgba(6,182,212,0.3) 70%, transparent 100%)',
            boxShadow:'0 0 60px 20px rgba(0,0,0,0.9), 0 0 120px 40px rgba(0,0,0,0.7)',
            animation:'bhExpand 1.6s cubic-bezier(0.2,0,0.8,1) forwards'}}/>
        </div>
      )}

      {/* FONDO */}
      <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.05}}>
        {Array.from({length:20}).map((_,i)=>(
          <line key={`h${i}`} x1="0" y1={`${i*5}%`} x2="100%" y2={`${i*5}%`} stroke="#f5a000" strokeWidth="0.5"/>
        ))}
        {Array.from({length:20}).map((_,i)=>(
          <line key={`v${i}`} x1={`${i*5}%`} y1="0" x2={`${i*5}%`} y2="100%" stroke="#f5a000" strokeWidth="0.5"/>
        ))}
        <line x1="0" y1="100%" x2="40%" y2="0" stroke="#f5a000" strokeWidth="1" opacity="0.5"/>
        <line x1="100%" y1="100%" x2="60%" y2="0" stroke="#f5a000" strokeWidth="1" opacity="0.5"/>
      </svg>

      <div id="glow" style={{position:'absolute',pointerEvents:'none',
        width:'70%',height:'60%',left:'15%',top:'10%',
        background:'radial-gradient(ellipse,rgba(245,160,0,0.1) 0%,rgba(6,182,212,0.07) 40%,transparent 70%)',
        transition:'left 2s ease, top 2s ease',filter:'blur(40px)'}}/>

      <div style={{position:'absolute',top:'-10%',left:'50%',transform:'translateX(-50%)',
        width:'80%',height:'50%',pointerEvents:'none',
        background:'radial-gradient(ellipse at 50% 0%,rgba(6,182,212,0.12) 0%,rgba(245,160,0,0.05) 40%,transparent 70%)',
        filter:'blur(20px)'}}/>

      {[{x:'15%',y:'20%',s:3},{x:'85%',y:'15%',s:2},{x:'10%',y:'70%',s:4},{x:'90%',y:'65%',s:2},{x:'50%',y:'8%',s:3},{x:'75%',y:'80%',s:2}].map((p,i)=>(
        <div key={i} style={{position:'absolute',left:p.x,top:p.y,width:p.s,height:p.s,borderRadius:'50%',
          background:'#f5a000',opacity:0.6,boxShadow:`0 0 ${p.s*3}px #f5a000`,
          animation:`float ${3+i*0.5}s ease-in-out infinite alternate`}}/>
      ))}

      {/* CONTENIDO */}
      <div style={{
        position:'relative',zIndex:10,width:'100%',maxWidth:400,padding:'0 24px',
        animation: blackhole ? 'bhSuck 1.6s cubic-bezier(0.4,0,1,1) forwards' : 'slideUp 0.8s ease forwards',
      }}>
        {/* LOGO */}
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{animation:'pulseGlow 4s ease-in-out infinite',display:'inline-block'}}>
            <img src="/imagen_sin_fondo.png" alt="STEPS"
              style={{width:130,height:'auto',mixBlendMode:'screen',
                filter:'drop-shadow(0 0 24px rgba(245,160,0,0.7)) drop-shadow(0 0 48px rgba(245,160,0,0.3))'}}/>
          </div>
        </div>

        {/* CARD */}
        <div style={{
          background:'rgba(4,20,40,0.85)',backdropFilter:'blur(20px)',
          border:`1px solid ${unlocked ? 'rgba(132,204,22,0.4)' : 'rgba(245,160,0,0.2)'}`,
          borderRadius:20,padding:32,
          boxShadow: unlocked
            ? '0 0 60px rgba(132,204,22,0.15),0 0 120px rgba(132,204,22,0.06),inset 0 1px 0 rgba(255,255,255,0.05)'
            : '0 0 60px rgba(6,182,212,0.08),0 0 120px rgba(245,160,0,0.04),inset 0 1px 0 rgba(255,255,255,0.05)',
          transition:'all 0.5s ease',
          animation: unlocked ? 'greenPulse 1.5s ease infinite' : 'none',
        }}>
          {/* Ícono candado */}
          <div style={{textAlign:'center',marginBottom:20,
            animation: unlocked ? 'unlockPop 0.5s cubic-bezier(0.34,1.4,0.64,1)' : 'none'}}>
            <LockIcon unlocked={unlocked}/>
          </div>

          <div style={{fontSize:11,color:'rgba(148,163,184,0.6)',marginBottom:20,
            textAlign:'center',letterSpacing:'0.08em',textTransform:'uppercase'}}>
            {unlocked ? '✓ Acceso concedido' : 'Acceso al Command Center'}
          </div>

          {/* INPUT PALABRA SECRETA */}
          <div style={{marginBottom:24}}>
            <label style={{fontSize:10,color:unlocked?'rgba(132,204,22,0.8)':'rgba(245,160,0,0.8)',
              fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:8}}>
              Palabra secreta
            </label>
            <input
              id="secret-input"
              type="password"
              value={password}
              onChange={e=>setPassword(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&login()}
              placeholder="••••••••"
              disabled={unlocked}
              style={{
                width:'100%',
                background:'rgba(255,255,255,0.04)',
                border:`1px solid ${unlocked ? 'rgba(132,204,22,0.4)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius:10,padding:'12px 14px',
                color: unlocked ? '#84cc16' : '#f1f5f9',
                fontSize:14,boxSizing:'border-box',
                transition:'all 0.3s',
                textAlign:'center',letterSpacing:'0.15em',
              }}/>
          </div>

          {error && (
            <div style={{padding:'10px 12px',borderRadius:8,background:'rgba(244,63,94,0.1)',
              border:'1px solid rgba(244,63,94,0.3)',color:'#f43f5e',fontSize:13,
              marginBottom:16,textAlign:'center'}}>
              {error}
            </div>
          )}

          <button onClick={login} disabled={loading||!password||unlocked}
            style={{
              width:'100%',padding:'14px',borderRadius:10,border:'none',cursor:'pointer',
              background: unlocked
                ? 'linear-gradient(135deg,#84cc16,#4ade80)'
                : 'linear-gradient(135deg,#f5a000,#c97000)',
              color: unlocked ? '#1a2e00' : '#1a0a00',
              fontSize:14,fontWeight:800,letterSpacing:'0.05em',
              boxShadow: unlocked
                ? '0 0 24px rgba(132,204,22,0.4)'
                : '0 0 24px rgba(245,160,0,0.35)',
              transition:'all 0.3s',
              opacity:(!password||unlocked)?0.7:1,
            }}
            onMouseEnter={e=>{if(!unlocked)e.currentTarget.style.boxShadow='0 0 40px rgba(245,160,0,0.6)'}}
            onMouseLeave={e=>{if(!unlocked)e.currentTarget.style.boxShadow='0 0 24px rgba(245,160,0,0.35)'}}>
            {loading ? 'Verificando...' : unlocked ? '✓ DESBLOQUEADO' : 'INGRESAR →'}
          </button>

          <div style={{marginTop:20,paddingTop:16,borderTop:'1px solid rgba(255,255,255,0.05)',textAlign:'center'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
              <div style={{width:6,height:6,borderRadius:'50%',
                background: unlocked ? '#84cc16' : '#f5a000',
                boxShadow: unlocked ? '0 0 8px #84cc16' : '0 0 8px #f5a000',
                animation:'pulseGlow 2s ease infinite'}}/>
              <span style={{fontSize:10,color:'rgba(100,116,139,0.8)',letterSpacing:'0.1em',textTransform:'uppercase'}}>
                {unlocked ? 'Sistema desbloqueado' : 'Sistema activo — Acceso privado'}
              </span>
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
