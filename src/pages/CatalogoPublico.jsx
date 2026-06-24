import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../supabase'

// ── TRON THEME ────────────────────────────────────────────────────────────────
const TR = {
  bg:      '#020408',
  bg2:     '#030609',
  cyan:    '#00F5FF',
  cyanD:   '#00B8CC',
  orange:  '#FF6B00',
  orangeL: '#FF8C00',
  white:   '#E8F4F8',
  grid:    'rgba(0,245,255,0.04)',
  gridB:   'rgba(0,245,255,0.08)',
  border:  'rgba(0,245,255,0.15)',
  borderB: 'rgba(0,245,255,0.35)',
  glass:   'rgba(0,245,255,0.04)',
  muted:   'rgba(0,245,255,0.4)',
  sub:     'rgba(0,245,255,0.2)',
  panel:   'rgba(0,20,30,0.8)',
}

const DESCUENTOS_DEFAULT = {
  'EPP': { avanzado: 8, lider: 15 },
  'Ropa de trabajo': { avanzado: 10, lider: 20 },
  'Calzado de seguridad': { avanzado: 8, lider: 16 },
  'Detectores de gas': { avanzado: 5, lider: 12 },
  'Señalización y tránsito': { avanzado: 10, lider: 18 },
  'Guantes': { avanzado: 10, lider: 20 },
  'Contra incendios': { avanzado: 6, lider: 12 },
  'Trabajo en alturas': { avanzado: 7, lider: 14 },
  'Equipamiento vehicular': { avanzado: 8, lider: 15 },
  'Cargas e izaje': { avanzado: 6, lider: 12 },
  'Orden y Limpieza': { avanzado: 12, lider: 22 },
  'Herramientas': { avanzado: 8, lider: 16 },
  'Materiales de construcción': { avanzado: 10, lider: 18 },
  'default': { avanzado: 8, lider: 15 },
}

const NIVELES = [
  { id:'base',     label:'BASE',     color:'#00F5FF', min:0,    max:800,  desc:'Hasta USD 800' },
  { id:'avanzado', label:'AVANZADO', color:'#FF6B00', min:800,  max:2000, desc:'USD 800 – 2.000' },
  { id:'lider',    label:'LÍDER',    color:'#FFD700', min:2000, max:null, desc:'Más de USD 4.000' },
]

const fmtARS = n => n ? `$${Math.round(+n).toLocaleString('es-AR')}` : '—'
const fmtUSD = n => n ? `U$S ${(+n).toFixed(2)}` : '—'

function getPrecio(product, nivel, dolarRate) {
  const base = product.sale_price || 0
  const cat = product.category || ''
  const desc = DESCUENTOS_DEFAULT[cat] || DESCUENTOS_DEFAULT['default']
  let precio = base
  if (nivel === 'avanzado') precio = base * (1 - desc.avanzado / 100)
  if (nivel === 'lider') precio = base * (1 - desc.lider / 100)
  return {
    ars: Math.round(precio),
    usd: dolarRate > 0 ? +(precio / dolarRate).toFixed(2) : null,
  }
}

function detectNivel(carritoUSD) {
  if (carritoUSD >= 4000) return 'lider'
  if (carritoUSD >= 800) return 'avanzado'
  return 'base'
}

// ── TRON GRID BACKGROUND ──────────────────────────────────────────────────────
function TronGrid() {
  const canvasRef = useRef(null)
  const frameRef  = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize(); window.addEventListener('resize', resize)
    let t = 0
    const draw = () => {
      t += 0.008
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const W = canvas.width, H = canvas.height

      // Grid lines
      const step = 60
      ctx.strokeStyle = 'rgba(0,245,255,0.04)'
      ctx.lineWidth = 0.5
      for (let x = 0; x < W; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
      }
      for (let y = 0; y < H; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
      }

      // Perspective grid floor
      const vanX = W / 2, vanY = H * 0.65
      ctx.strokeStyle = 'rgba(0,245,255,0.06)'
      ctx.lineWidth = 0.7
      for (let i = -12; i <= 12; i++) {
        const startX = vanX + i * 60
        ctx.beginPath(); ctx.moveTo(startX, vanY); ctx.lineTo(vanX + i * 300, H + 200); ctx.stroke()
      }
      for (let j = 0; j < 10; j++) {
        const progress = j / 10
        const y = vanY + (H - vanY + 200) * Math.pow(progress, 1.5)
        const spread = 12 + j * 40
        ctx.beginPath(); ctx.moveTo(vanX - spread * 16, y); ctx.lineTo(vanX + spread * 16, y); ctx.stroke()
      }

      // Animated scan lines
      const scanY = (Math.sin(t) * 0.5 + 0.5) * H
      const sgr = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40)
      sgr.addColorStop(0, 'transparent'); sgr.addColorStop(0.5, 'rgba(0,245,255,0.04)'); sgr.addColorStop(1, 'transparent')
      ctx.fillStyle = sgr; ctx.fillRect(0, scanY - 40, W, 80)

      // Corner decorations
      const corners = [[0,0],[W,0],[0,H],[W,H]]
      corners.forEach(([cx,cy]) => {
        const dx = cx === 0 ? 1 : -1, dy = cy === 0 ? 1 : -1
        ctx.strokeStyle = 'rgba(0,245,255,0.2)'; ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.moveTo(cx + dx*20, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + dy*20); ctx.stroke()
      })

      // Light nodes
      const nodes = [[W*0.2, H*0.3],[W*0.8, H*0.4],[W*0.5, H*0.6],[W*0.15, H*0.7],[W*0.85, H*0.2]]
      nodes.forEach(([nx,ny],i) => {
        const pulse = Math.sin(t * 2 + i) * 0.4 + 0.6
        const g = ctx.createRadialGradient(nx,ny,0,nx,ny,30)
        g.addColorStop(0, `rgba(0,245,255,${0.15*pulse})`); g.addColorStop(1, 'transparent')
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(nx,ny,30,0,Math.PI*2); ctx.fill()
      })

      frameRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(frameRef.current) }
  }, [])
  return <canvas ref={canvasRef} style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', opacity:0.8 }}/>
}

// ── LOGIN PANEL ───────────────────────────────────────────────────────────────
function TronLoginPanel({ onLogin, onGuest }) {
  const [empresa, setEmpresa] = useState('')
  const [cuit, setCuit] = useState('')
  const [email, setEmail] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!empresa.trim() || !cuit.trim() || !email.trim()) {
      setErr('Completá todos los campos para ver los precios')
      return
    }
    if (!/\S+@\S+\.\S+/.test(email)) { setErr('Email inválido'); return }
    setLoading(true)
    // Save lead to Supabase
    try {
      await supabase.from('catalog_leads').upsert({
        empresa: empresa.trim(),
        cuit: cuit.trim(),
        email: email.trim(),
        accessed_at: new Date(),
      }, { onConflict: 'email' })
    } catch(e) {}
    setLoading(false)
    onLogin({ empresa, cuit, email })
  }

  const inp = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(0,245,255,0.04)',
    border: '1px solid rgba(0,245,255,0.2)',
    borderRadius: 4, padding: '12px 16px',
    color: TR.white, fontSize: 14,
    outline: 'none', fontFamily: "'Space Mono', monospace",
    letterSpacing: '0.02em',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
      background: 'rgba(2,4,8,0.85)',
      backdropFilter: 'blur(12px)',
    }}>
      <style>{`
        @keyframes tronIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scanline{0%{top:-4px}100%{top:100%}}
        @keyframes glow{0%,100%{box-shadow:0 0 12px rgba(0,245,255,0.3)}50%{box-shadow:0 0 28px rgba(0,245,255,0.7)}}
        .tron-inp:focus{border-color:rgba(0,245,255,0.6)!important;box-shadow:0 0 16px rgba(0,245,255,0.15)!important;background:rgba(0,245,255,0.07)!important}
      `}</style>

      <div style={{
        width: '100%', maxWidth: 420, position: 'relative',
        background: 'rgba(2,8,14,0.95)',
        border: '1px solid rgba(0,245,255,0.3)',
        borderRadius: 2,
        boxShadow: '0 0 60px rgba(0,245,255,0.1), 0 0 120px rgba(0,245,255,0.05), inset 0 1px 0 rgba(0,245,255,0.15)',
        animation: 'tronIn 0.5s cubic-bezier(0.34,1.2,0.64,1) both',
        overflow: 'hidden',
      }}>
        {/* Top cyan bar */}
        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${TR.cyan}, transparent)`, position: 'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:0, left:'-100%', width:'60%', height:'100%', background:'rgba(255,255,255,0.6)', animation:'scanline 2s linear infinite', filter:'blur(4px)' }}/>
        </div>

        <div style={{ padding: '36px 36px 32px' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              display: 'inline-block',
              fontSize: 28, fontWeight: 900,
              fontFamily: "'Syne', sans-serif",
              letterSpacing: '-0.5px',
              color: TR.cyan,
              textShadow: `0 0 20px ${TR.cyan}, 0 0 40px ${TR.cyanD}`,
            }}>
              STEPS
            </div>
            <div style={{
              fontSize: 9, color: TR.muted, letterSpacing: '0.25em',
              textTransform: 'uppercase', marginTop: 4, fontFamily: "'Space Mono', monospace",
            }}>
              SISTEMA DE CATÁLOGO · v2026
            </div>
          </div>

          {/* Access options */}
          <div style={{
            display: 'flex', gap: 0, marginBottom: 28,
            border: '1px solid rgba(0,245,255,0.15)', borderRadius: 2, overflow: 'hidden',
          }}>
            <div style={{ flex:1, padding:'10px', textAlign:'center', background:'rgba(0,245,255,0.08)', borderRight:'1px solid rgba(0,245,255,0.15)', cursor:'default' }}>
              <div style={{ fontSize:10, color:TR.cyan, fontWeight:700, fontFamily:"'Space Mono',monospace" }}>ACCESO COMPLETO</div>
              <div style={{ fontSize:9, color:TR.sub, marginTop:2 }}>Con datos empresa</div>
            </div>
            <div onClick={onGuest}
              style={{ flex:1, padding:'10px', textAlign:'center', cursor:'pointer', transition:'background 0.2s' }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div style={{ fontSize:10, color:TR.muted, fontWeight:700, fontFamily:"'Space Mono',monospace" }}>VER CATÁLOGO</div>
              <div style={{ fontSize:9, color:'rgba(0,245,255,0.15)', marginTop:2 }}>Sin precios</div>
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <div style={{ fontSize:9, color:TR.muted, fontFamily:"'Space Mono',monospace", letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>Empresa / Razón social</div>
              <input value={empresa} onChange={e=>setEmpresa(e.target.value)} placeholder="PAMPETROL S.A.P.E.M." className="tron-inp" style={inp}/>
            </div>
            <div>
              <div style={{ fontSize:9, color:TR.muted, fontFamily:"'Space Mono',monospace", letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>CUIT</div>
              <input value={cuit} onChange={e=>setCuit(e.target.value)} placeholder="30-XXXXXXXX-X" className="tron-inp" style={inp}/>
            </div>
            <div>
              <div style={{ fontSize:9, color:TR.muted, fontFamily:"'Space Mono',monospace", letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>Email</div>
              <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="compras@empresa.com" type="email" className="tron-inp" style={inp}
                onKeyDown={e=>e.key==='Enter'&&handleLogin()}/>
            </div>
            {err && <div style={{ fontSize:11, color:'#FF4444', fontFamily:"'Space Mono',monospace", padding:'8px 12px', background:'rgba(255,68,68,0.08)', border:'1px solid rgba(255,68,68,0.2)', borderRadius:2 }}>⚠ {err}</div>}
            <button onClick={handleLogin} disabled={loading}
              style={{
                width:'100%', padding:'14px', borderRadius:2, border:'none',
                background: `linear-gradient(90deg, ${TR.cyan}, ${TR.cyanD})`,
                color:'#000', cursor:'pointer', fontSize:13, fontWeight:900,
                fontFamily:"'Space Mono',monospace", letterSpacing:'0.08em', textTransform:'uppercase',
                boxShadow:`0 0 24px rgba(0,245,255,0.3)`,
                animation:'glow 2s ease infinite',
                transition:'all 0.2s', opacity:loading?0.6:1,
              }}
              onMouseEnter={e=>e.currentTarget.style.boxShadow='0 0 40px rgba(0,245,255,0.6)'}
              onMouseLeave={e=>e.currentTarget.style.boxShadow='0 0 24px rgba(0,245,255,0.3)'}>
              {loading ? 'ACCEDIENDO...' : 'ACCEDER AL SISTEMA →'}
            </button>
          </div>

          <div style={{ textAlign:'center', marginTop:20, fontSize:9, color:TR.sub, fontFamily:"'Space Mono',monospace", lineHeight:1.6 }}>
            STEPS INDUSTRIAL · CATRIEL, PATAGONIA<br/>
            2993295575 · GESTIONSTEPS@GMAIL.COM
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ height:2, background:`linear-gradient(90deg, transparent, ${TR.orange}, transparent)` }}/>
      </div>
    </div>
  )
}

// ── CARRITO ───────────────────────────────────────────────────────────────────
function Carrito({ items, onRemove, onQtyChange, nivel, dolarRate, moneda, onEnviar, onClose }) {
  const total = items.reduce((sum, it) => {
    const p = getPrecio(it.product, nivel, dolarRate)
    return sum + (moneda === 'USD' ? (p.usd||0) : p.ars) * it.qty
  }, 0)

  const nextNivel = detectNivel(moneda === 'USD' ? total : total / dolarRate)

  return (
    <div style={{
      position: 'fixed', right: 0, top: 0, bottom: 0, width: 380,
      background: 'rgba(2,6,10,0.97)',
      border: '1px solid rgba(0,245,255,0.2)',
      borderRight: 'none',
      zIndex: 300,
      display: 'flex', flexDirection: 'column',
      backdropFilter: 'blur(24px)',
      animation: 'slideIn 0.3s cubic-bezier(0.34,1.2,0.64,1) both',
    }}>
      <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

      {/* Header */}
      <div style={{ padding:'20px 20px 16px', borderBottom:'1px solid rgba(0,245,255,0.1)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ fontSize:13, fontWeight:900, color:TR.cyan, fontFamily:"'Space Mono',monospace", letterSpacing:'0.1em' }}>
            CARRITO [{items.length}]
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:TR.muted, cursor:'pointer', fontSize:20 }}>×</button>
        </div>
        {/* Nivel actual */}
        <div style={{
          padding:'8px 12px', borderRadius:2,
          background: nivel==='lider' ? 'rgba(255,215,0,0.08)' : nivel==='avanzado' ? 'rgba(255,107,0,0.08)' : 'rgba(0,245,255,0.06)',
          border: `1px solid ${nivel==='lider'?'rgba(255,215,0,0.3)':nivel==='avanzado'?'rgba(255,107,0,0.3)':'rgba(0,245,255,0.2)'}`,
          display:'flex', alignItems:'center', gap:8,
        }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background: NIVELES.find(n=>n.id===nivel)?.color, boxShadow:`0 0 8px ${NIVELES.find(n=>n.id===nivel)?.color}` }}/>
          <span style={{ fontSize:11, fontWeight:700, color: NIVELES.find(n=>n.id===nivel)?.color, fontFamily:"'Space Mono',monospace" }}>
            NIVEL {NIVELES.find(n=>n.id===nivel)?.label}
          </span>
          <span style={{ fontSize:9, color:TR.sub, marginLeft:4 }}>
            {NIVELES.find(n=>n.id===nivel)?.desc}
          </span>
        </div>
      </div>

      {/* Items */}
      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px', display:'flex', flexDirection:'column', gap:8 }}>
        {items.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 0', color:TR.sub, fontFamily:"'Space Mono',monospace", fontSize:11 }}>
            CARRITO VACÍO<br/>
            <span style={{ fontSize:9, opacity:0.5 }}>Agregá productos del catálogo</span>
          </div>
        ) : items.map((it, i) => {
          const p = getPrecio(it.product, nivel, dolarRate)
          const total_it = moneda==='USD' ? (p.usd||0)*it.qty : p.ars*it.qty
          return (
            <div key={it.product.id} style={{
              padding:'10px 12px', borderRadius:2,
              background:'rgba(0,245,255,0.03)',
              border:'1px solid rgba(0,245,255,0.08)',
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                <div style={{ fontSize:11, fontWeight:600, color:TR.white, flex:1, paddingRight:8, lineHeight:1.3 }}>{it.product.name}</div>
                <button onClick={()=>onRemove(it.product.id)} style={{ background:'none', border:'none', color:'rgba(255,68,68,0.5)', cursor:'pointer', fontSize:14, flexShrink:0 }}>✕</button>
              </div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <button onClick={()=>onQtyChange(it.product.id, Math.max(1, it.qty-1))}
                    style={{ width:24, height:24, borderRadius:2, border:'1px solid rgba(0,245,255,0.2)', background:'rgba(0,245,255,0.05)', color:TR.cyan, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                  <span style={{ fontSize:13, fontWeight:900, color:TR.white, fontFamily:"'Space Mono',monospace", minWidth:24, textAlign:'center' }}>{it.qty}</span>
                  <button onClick={()=>onQtyChange(it.product.id, it.qty+1)}
                    style={{ width:24, height:24, borderRadius:2, border:'1px solid rgba(0,245,255,0.2)', background:'rgba(0,245,255,0.05)', color:TR.cyan, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:9, color:TR.sub, fontFamily:"'Space Mono',monospace" }}>
                    {moneda==='USD' ? fmtUSD(p.usd) : fmtARS(p.ars)} c/u
                  </div>
                  <div style={{ fontSize:13, fontWeight:900, color:TR.cyan, fontFamily:"'Space Mono',monospace" }}>
                    {moneda==='USD' ? fmtUSD(total_it) : fmtARS(total_it)}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Total + CTA */}
      <div style={{ padding:'16px 20px', borderTop:'1px solid rgba(0,245,255,0.1)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <span style={{ fontSize:11, color:TR.muted, fontFamily:"'Space Mono',monospace" }}>TOTAL ESTIMADO</span>
          <span style={{ fontSize:20, fontWeight:900, color:TR.cyan, fontFamily:"'Space Mono',monospace", textShadow:`0 0 16px ${TR.cyan}` }}>
            {moneda==='USD' ? fmtUSD(total) : fmtARS(total)}
          </span>
        </div>
        <button onClick={onEnviar} disabled={items.length===0}
          style={{
            width:'100%', padding:'14px', borderRadius:2, border:'none',
            background:`linear-gradient(90deg, ${TR.orange}, ${TR.orangeL})`,
            color:'#000', cursor:'pointer', fontSize:13, fontWeight:900,
            fontFamily:"'Space Mono',monospace", letterSpacing:'0.08em', textTransform:'uppercase',
            boxShadow:'0 0 24px rgba(255,107,0,0.4)',
            opacity:items.length===0?0.4:1,
            marginBottom:8,
          }}>
          ENVIAR SOLICITUD →
        </button>
        <div style={{ fontSize:9, color:TR.sub, textAlign:'center', fontFamily:"'Space Mono',monospace" }}>
          Vía WhatsApp · Email · Precios sujetos a confirmación
        </div>
      </div>
    </div>
  )
}

// ── PRODUCT CARD TRON ─────────────────────────────────────────────────────────
function TronProductCard({ p, nivel, dolarRate, moneda, onAdd, isInCart, guestMode }) {
  const [hov, setHov] = useState(false)
  const precios = getPrecio(p, nivel, dolarRate)
  const nv = NIVELES.find(n => n.id === nivel)

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative', borderRadius: 2, overflow: 'hidden',
        background: hov
          ? `linear-gradient(160deg, rgba(0,245,255,0.06), rgba(0,20,30,0.95))`
          : 'rgba(2,8,14,0.95)',
        border: `1px solid ${hov ? 'rgba(0,245,255,0.35)' : isInCart ? 'rgba(0,245,255,0.25)' : 'rgba(0,245,255,0.1)'}`,
        boxShadow: hov
          ? '0 0 30px rgba(0,245,255,0.12), inset 0 1px 0 rgba(0,245,255,0.2)'
          : isInCart
          ? '0 0 16px rgba(0,245,255,0.08)'
          : 'none',
        transform: hov ? 'translateY(-3px)' : 'none',
        transition: 'all 0.25s cubic-bezier(0.34,1.2,0.64,1)',
      }}
    >
      {/* Corner decorations */}
      {hov && <>
        <div style={{ position:'absolute', top:0, left:0, width:14, height:14, borderTop:`2px solid ${TR.cyan}`, borderLeft:`2px solid ${TR.cyan}`, pointerEvents:'none', zIndex:2 }}/>
        <div style={{ position:'absolute', top:0, right:0, width:14, height:14, borderTop:`2px solid ${TR.cyan}`, borderRight:`2px solid ${TR.cyan}`, pointerEvents:'none', zIndex:2 }}/>
        <div style={{ position:'absolute', bottom:0, left:0, width:14, height:14, borderBottom:`2px solid ${TR.cyan}`, borderLeft:`2px solid ${TR.cyan}`, pointerEvents:'none', zIndex:2 }}/>
        <div style={{ position:'absolute', bottom:0, right:0, width:14, height:14, borderBottom:`2px solid ${TR.cyan}`, borderRight:`2px solid ${TR.cyan}`, pointerEvents:'none', zIndex:2 }}/>
      </>}

      {/* In cart indicator */}
      {isInCart && (
        <div style={{
          position:'absolute', top:8, right:8, zIndex:3,
          width:20, height:20, borderRadius:'50%',
          background:`linear-gradient(135deg,${TR.cyan},${TR.cyanD})`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:10, color:'#000', fontWeight:900,
          boxShadow:`0 0 12px ${TR.cyan}`,
        }}>✓</div>
      )}

      {/* Image */}
      <div style={{ height: 140, overflow:'hidden', position:'relative', background:'rgba(0,20,30,0.8)' }}>
        {p.image_url
          ? <img src={p.image_url} alt={p.name}
              style={{ width:'100%', height:'100%', objectFit:'cover', filter:'saturate(0.8) contrast(1.1)', transition:'transform 0.4s ease' }}
              onMouseEnter={e=>e.target.style.transform='scale(1.08)'}
              onMouseLeave={e=>e.target.style.transform='scale(1)'}
              onError={e=>e.target.style.display='none'}/>
          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, opacity:0.15, color:TR.cyan }}>◈</div>
        }
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 40%, rgba(2,8,14,0.9) 100%)', pointerEvents:'none' }}/>
        {p.code && (
          <div style={{ position:'absolute', bottom:6, left:8, fontSize:8, color:TR.muted, fontFamily:"'Space Mono',monospace", letterSpacing:'0.1em' }}>
            #{p.code}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding:'10px 12px' }}>
        {p.brand && <div style={{ fontSize:8, color:TR.orange, fontWeight:700, fontFamily:"'Space Mono',monospace", letterSpacing:'0.1em', marginBottom:4, textTransform:'uppercase' }}>{p.brand}</div>}
        <div style={{ fontSize:11, fontWeight:700, color:TR.white, lineHeight:1.35, marginBottom:8, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{p.name}</div>

        {/* Prices or guest placeholder */}
        {guestMode ? (
          <div style={{ padding:'8px', background:'rgba(0,245,255,0.04)', border:'1px solid rgba(0,245,255,0.1)', borderRadius:2, textAlign:'center' }}>
            <div style={{ fontSize:9, color:TR.sub, fontFamily:"'Space Mono',monospace" }}>PRECIO DISPONIBLE</div>
            <div style={{ fontSize:9, color:'rgba(0,245,255,0.3)', marginTop:2 }}>Accedé para ver precios</div>
          </div>
        ) : (
          <div style={{ marginBottom:8 }}>
            <div style={{ fontSize:8, color:TR.sub, fontFamily:"'Space Mono',monospace", marginBottom:4 }}>
              PRECIO NIVEL {nv?.label}
            </div>
            <div style={{
              fontSize:15, fontWeight:900,
              color: nv?.color || TR.cyan,
              fontFamily:"'Space Mono',monospace",
              textShadow:`0 0 12px ${nv?.color || TR.cyan}55`,
            }}>
              {moneda==='USD' ? fmtUSD(precios.usd) : fmtARS(precios.ars)}
            </div>
            {moneda==='ARS' && precios.usd && (
              <div style={{ fontSize:9, color:TR.sub, fontFamily:"'Space Mono',monospace" }}>≈ {fmtUSD(precios.usd)}</div>
            )}
          </div>
        )}

        {!guestMode && (
          <button onClick={() => onAdd(p)}
            style={{
              width:'100%', padding:'8px', borderRadius:2,
              background: isInCart
                ? 'rgba(0,245,255,0.08)'
                : `linear-gradient(90deg, rgba(0,245,255,0.15), rgba(0,245,255,0.08))`,
              color: isInCart ? TR.cyan : TR.cyan,
              cursor:'pointer', fontSize:10, fontWeight:700,
              fontFamily:"'Space Mono',monospace", letterSpacing:'0.08em',
              border:`1px solid ${isInCart ? 'rgba(0,245,255,0.3)' : 'rgba(0,245,255,0.15)'}`,
              transition:'all 0.2s',
            }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(0,245,255,0.15)'}
            onMouseLeave={e=>e.currentTarget.style.background=isInCart?'rgba(0,245,255,0.08)':'linear-gradient(90deg,rgba(0,245,255,0.15),rgba(0,245,255,0.08))'}>
            {isInCart ? '✓ EN CARRITO' : '+ AGREGAR'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function CatalogoPublico() {
  const [mode, setMode] = useState('login') // login | guest | full
  const [cliente, setCliente] = useState(null)
  const [moneda, setMoneda] = useState('ARS')
  const [dolarRate, setDolarRate] = useState(0)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeUnitId, setActiveUnitId] = useState(null)
  const [activeCatName, setActiveCatName] = useState(null)
  const [catProducts, setCatProducts] = useState([])
  const [loadingCat, setLoadingCat] = useState(false)
  const [carrito, setCarrito] = useState([])
  const [showCarrito, setShowCarrito] = useState(false)
  const [search, setSearch] = useState('')

  const BUSINESS_UNITS = [
    {
      id:'abastecimiento', name:'ABASTECIMIENTO', icon:'◈', aura:TR.orange,
      categories:[
        {name:'Ropa de trabajo',emoji:'👔'},{name:'EPP',emoji:'⛑️'},{name:'Calzado de seguridad',emoji:'🥾'},
        {name:'Detectores de gas',emoji:'🔬'},{name:'Señalización y tránsito',emoji:'🚦'},{name:'Guantes',emoji:'🥊'},
        {name:'Contra incendios',emoji:'🔥'},{name:'Trabajo en alturas',emoji:'⛰️'},{name:'Equipamiento vehicular',emoji:'🚙'},
        {name:'Cargas e izaje',emoji:'🏗️'},{name:'Orden y Limpieza',emoji:'🫧'},{name:'Herramientas',emoji:'🛠️'},
        {name:'Materiales de construcción',emoji:'🧱'},
      ],
    },
    {
      id:'obras', name:'OBRAS & PROYECTOS', icon:'◉', aura:'#22c55e',
      categories:[
        {name:'Abastecimiento a proyectos',emoji:'🏢'},{name:'Productos Innovadores',emoji:'✨'},
        {name:'Flipping House & Business',emoji:'🔑'},{name:'Smart Home',emoji:'🏡'},{name:'Smart Office',emoji:'🖥️'},
      ],
    },
    {
      id:'tecnologia', name:'APPS & TECH', icon:'◆', aura:'#8b5cf6',
      categories:[
        {name:'App STEPS',emoji:'📱'},{name:'Apps y sitio web',emoji:'💻'},
        {name:'IA para empresas',emoji:'🧠'},{name:'Productos inteligentes',emoji:'🔮'},
      ],
    },
  ]

  // Fetch dolar rate
  useEffect(() => {
    fetch('https://dolarapi.com/v1/dolares/blue')
      .then(r => r.json())
      .then(d => setDolarRate(d?.venta || 0))
      .catch(() => {})
  }, [])

  // Load products for active category
  useEffect(() => {
    if (!activeCatName) { setCatProducts([]); return }
    const load = async () => {
      setLoadingCat(true)
      const { data } = await supabase.from('products').select('*').eq('category', activeCatName).order('name')
      setCatProducts(data || [])
      setLoadingCat(false)
    }
    load()
  }, [activeCatName])

  // Detect nivel from carrito
  const carritoTotalUSD = useMemo(() => {
    if (!dolarRate) return 0
    return carrito.reduce((sum, it) => {
      const p = getPrecio(it.product, 'base', dolarRate)
      return sum + (p.usd || 0) * it.qty
    }, 0)
  }, [carrito, dolarRate])

  const nivel = detectNivel(carritoTotalUSD)
  const guestMode = mode === 'guest'

  const addToCarrito = (product) => {
    setCarrito(prev => {
      const exists = prev.find(it => it.product.id === product.id)
      if (exists) return prev.map(it => it.product.id === product.id ? { ...it, qty: it.qty + 1 } : it)
      return [...prev, { product, qty: 1 }]
    })
    setShowCarrito(true)
  }

  const removeFromCarrito = (id) => setCarrito(prev => prev.filter(it => it.product.id !== id))
  const changeQty = (id, qty) => setCarrito(prev => prev.map(it => it.product.id === id ? { ...it, qty } : it))

  const enviarSolicitud = () => {
    const nv = NIVELES.find(n => n.id === nivel)
    const items = carrito.map(it => {
      const p = getPrecio(it.product, nivel, dolarRate)
      const precio = moneda === 'USD' ? fmtUSD(p.usd) : fmtARS(p.ars)
      return `• ${it.qty}x ${it.product.name} — ${precio} c/u`
    }).join('\n')
    const total = carrito.reduce((s, it) => {
      const p = getPrecio(it.product, nivel, dolarRate)
      return s + (moneda === 'USD' ? (p.usd||0) : p.ars) * it.qty
    }, 0)
    const msg = encodeURIComponent(
      `🏭 *SOLICITUD DE COTIZACIÓN STEPS*\n\n` +
      `Empresa: ${cliente?.empresa || 'Sin identificar'}\n` +
      `CUIT: ${cliente?.cuit || '—'}\n` +
      `Email: ${cliente?.email || '—'}\n` +
      `Nivel: ${nv?.label} (${nv?.desc})\n\n` +
      `*Productos solicitados:*\n${items}\n\n` +
      `*Total estimado: ${moneda==='USD' ? fmtUSD(total) : fmtARS(total)}*\n\n` +
      `Aguardo confirmación de precios y disponibilidad.`
    )
    window.open(`https://wa.me/542993295575?text=${msg}`, '_blank')
  }

  if (mode === 'login') {
    return (
      <div style={{ minHeight:'100vh', background:TR.bg, position:'relative', overflow:'hidden' }}>
        <TronGrid/>
        <TronLoginPanel
          onLogin={(data) => { setCliente(data); setMode('full') }}
          onGuest={() => setMode('guest')}
        />
      </div>
    )
  }

  const currentUnit = BUSINESS_UNITS.find(u => u.id === activeUnitId)

  return (
    <div style={{ minHeight:'100vh', background:TR.bg, position:'relative', fontFamily:"'Nunito Sans', system-ui, sans-serif", color:TR.white }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glow{0%,100%{opacity:0.6}50%{opacity:1}}
        @keyframes scanTop{0%{left:-60%}100%{left:110%}}
        .tron-cat:hover{background:rgba(0,245,255,0.07)!important;border-color:rgba(0,245,255,0.3)!important;}
      `}</style>

      <TronGrid/>

      {/* ── NAVBAR ── */}
      <div style={{
        position:'sticky', top:0, zIndex:200,
        background:'rgba(2,4,8,0.92)', backdropFilter:'blur(20px)',
        borderBottom:'1px solid rgba(0,245,255,0.12)',
        padding:'0 24px', height:56,
        display:'flex', alignItems:'center', gap:16,
      }}>
        {/* Logo */}
        <div style={{ fontSize:18, fontWeight:900, color:TR.cyan, fontFamily:"'Syne',sans-serif", letterSpacing:'-0.3px', textShadow:`0 0 16px ${TR.cyan}`, flexShrink:0 }}>
          STEPS
        </div>
        <div style={{ width:1, height:24, background:'rgba(0,245,255,0.15)' }}/>

        {/* Search */}
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="BUSCAR PRODUCTO..."
          style={{
            flex:1, background:'rgba(0,245,255,0.04)', border:'1px solid rgba(0,245,255,0.12)',
            borderRadius:2, padding:'8px 14px', color:TR.white, fontSize:12,
            outline:'none', fontFamily:"'Space Mono',monospace", letterSpacing:'0.03em',
          }}/>

        {/* Moneda toggle */}
        <div style={{ display:'flex', gap:0, border:'1px solid rgba(0,245,255,0.2)', borderRadius:2, overflow:'hidden', flexShrink:0 }}>
          {['ARS','USD'].map(m => (
            <button key={m} onClick={() => setMoneda(m)}
              style={{
                padding:'6px 14px', border:'none', cursor:'pointer', fontSize:10, fontWeight:700,
                fontFamily:"'Space Mono',monospace",
                background: moneda===m ? TR.cyan : 'transparent',
                color: moneda===m ? '#000' : TR.muted,
                transition:'all 0.15s',
              }}>{m}</button>
          ))}
        </div>

        {/* Nivel indicator — only for full mode */}
        {!guestMode && (
          <div style={{
            padding:'6px 12px', borderRadius:2, flexShrink:0,
            background: nivel==='lider'?'rgba(255,215,0,0.08)':nivel==='avanzado'?'rgba(255,107,0,0.08)':'rgba(0,245,255,0.06)',
            border:`1px solid ${NIVELES.find(n=>n.id===nivel)?.color}33`,
            display:'flex', alignItems:'center', gap:6,
          }}>
            <div style={{ width:5, height:5, borderRadius:'50%', background:NIVELES.find(n=>n.id===nivel)?.color, animation:'glow 2s ease infinite' }}/>
            <span style={{ fontSize:9, fontWeight:700, color:NIVELES.find(n=>n.id===nivel)?.color, fontFamily:"'Space Mono',monospace" }}>
              {NIVELES.find(n=>n.id===nivel)?.label}
            </span>
          </div>
        )}

        {/* Carrito button */}
        {!guestMode && (
          <button onClick={() => setShowCarrito(s => !s)}
            style={{
              position:'relative', padding:'8px 16px', borderRadius:2, border:`1px solid ${TR.orange}44`,
              background:'rgba(255,107,0,0.08)', color:TR.orange, cursor:'pointer', fontSize:12,
              fontWeight:700, fontFamily:"'Space Mono',monospace", flexShrink:0,
              transition:'all 0.2s',
            }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,107,0,0.15)'}
            onMouseLeave={e=>e.currentTarget.style.background='rgba(255,107,0,0.08)'}>
            CARRITO [{carrito.length}]
            {carrito.length > 0 && (
              <div style={{
                position:'absolute', top:-6, right:-6,
                width:16, height:16, borderRadius:'50%',
                background:TR.orange, color:'#000',
                fontSize:9, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center',
              }}>{carrito.length}</div>
            )}
          </button>
        )}

        {/* Client info */}
        {cliente && (
          <div style={{ fontSize:9, color:TR.sub, fontFamily:"'Space Mono',monospace", flexShrink:0, maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {cliente.empresa}
          </div>
        )}
      </div>

      <div style={{ padding:'24px', position:'relative', zIndex:1, paddingRight: showCarrito ? 404 : 24, transition:'padding 0.3s ease' }}>

        {/* Guest banner */}
        {guestMode && (
          <div style={{
            marginBottom:20, padding:'12px 16px',
            background:'rgba(0,245,255,0.04)',
            border:'1px solid rgba(0,245,255,0.15)',
            borderRadius:2, display:'flex', alignItems:'center', justifyContent:'space-between',
          }}>
            <div style={{ fontSize:11, color:TR.muted, fontFamily:"'Space Mono',monospace" }}>
              MODO VITRINA · Iniciá sesión para ver precios y hacer pedidos
            </div>
            <button onClick={() => setMode('login')}
              style={{ padding:'6px 14px', borderRadius:2, border:'none', background:TR.cyan, color:'#000', cursor:'pointer', fontSize:10, fontWeight:900, fontFamily:"'Space Mono',monospace" }}>
              ACCEDER →
            </button>
          </div>
        )}

        {/* Business Unit nav */}
        <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
          <button onClick={() => { setActiveUnitId(null); setActiveCatName(null) }}
            style={{
              padding:'8px 16px', borderRadius:2, border:`1px solid ${!activeUnitId?'rgba(0,245,255,0.4)':'rgba(0,245,255,0.12)'}`,
              background:!activeUnitId?'rgba(0,245,255,0.1)':'rgba(0,245,255,0.03)',
              color:!activeUnitId?TR.cyan:TR.muted, cursor:'pointer', fontSize:10, fontWeight:700,
              fontFamily:"'Space Mono',monospace", letterSpacing:'0.08em', transition:'all 0.15s',
            }}>
            ◈ TODOS
          </button>
          {BUSINESS_UNITS.map(unit => (
            <button key={unit.id}
              onClick={() => { setActiveUnitId(u => u===unit.id?null:unit.id); setActiveCatName(null) }}
              style={{
                padding:'8px 16px', borderRadius:2,
                border:`1px solid ${activeUnitId===unit.id?unit.aura+'66':'rgba(0,245,255,0.12)'}`,
                background:activeUnitId===unit.id?`${unit.aura}15`:'rgba(0,245,255,0.03)',
                color:activeUnitId===unit.id?unit.aura:TR.muted, cursor:'pointer', fontSize:10, fontWeight:700,
                fontFamily:"'Space Mono',monospace", letterSpacing:'0.08em', transition:'all 0.15s',
              }}>
              {unit.icon} {unit.name}
            </button>
          ))}
        </div>

        {/* Category chips */}
        {currentUnit && (
          <div style={{
            display:'flex', gap:8, flexWrap:'wrap', marginBottom:20, padding:'14px 16px',
            background:'rgba(0,245,255,0.02)', border:'1px solid rgba(0,245,255,0.08)', borderRadius:2,
            animation:'fadeUp 0.3s ease both',
          }}>
            {currentUnit.categories.map(cat => (
              <button key={cat.name}
                onClick={() => setActiveCatName(n => n===cat.name ? null : cat.name)}
                className="tron-cat"
                style={{
                  padding:'6px 12px', borderRadius:2, border:`1px solid ${activeCatName===cat.name?currentUnit.aura+'55':'rgba(0,245,255,0.1)'}`,
                  background:activeCatName===cat.name?`${currentUnit.aura}12`:'rgba(0,245,255,0.03)',
                  color:activeCatName===cat.name?currentUnit.aura:TR.muted, cursor:'pointer', fontSize:10, fontWeight:600,
                  fontFamily:"'Space Mono',monospace", transition:'all 0.15s',
                  display:'flex', alignItems:'center', gap:6,
                }}>
                {cat.emoji} {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Search results or category products */}
        {(activeCatName || search.trim()) && (
          <div style={{ marginBottom:32 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <div style={{ width:2, height:16, background:TR.cyan, boxShadow:`0 0 8px ${TR.cyan}` }}/>
              <span style={{ fontSize:11, fontWeight:700, color:TR.cyan, fontFamily:"'Space Mono',monospace", letterSpacing:'0.1em', textTransform:'uppercase' }}>
                {search.trim() ? `RESULTADOS: "${search}"` : activeCatName}
              </span>
              {catProducts.length > 0 && (
                <span style={{ fontSize:9, color:TR.sub, fontFamily:"'Space Mono',monospace" }}>
                  [{catProducts.length} productos]
                </span>
              )}
            </div>

            {loadingCat ? (
              <div style={{ textAlign:'center', padding:'40px', color:TR.muted, fontFamily:"'Space Mono',monospace", fontSize:11 }}>
                CARGANDO DATOS...
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:14 }}>
                {(search.trim()
                  ? catProducts.filter(p =>
                      p.name?.toLowerCase().includes(search.toLowerCase()) ||
                      p.brand?.toLowerCase().includes(search.toLowerCase()) ||
                      p.code?.toLowerCase().includes(search.toLowerCase())
                    )
                  : catProducts
                ).map((p, i) => (
                  <div key={p.id} style={{ animation:`fadeUp 0.4s ${i*0.03}s ease both`, opacity:0, animationFillMode:'both' }}>
                    <TronProductCard
                      p={p}
                      nivel={nivel}
                      dolarRate={dolarRate}
                      moneda={moneda}
                      onAdd={addToCarrito}
                      isInCart={carrito.some(it => it.product.id === p.id)}
                      guestMode={guestMode}
                    />
                  </div>
                ))}
              </div>
            )}

            {!loadingCat && catProducts.length === 0 && (
              <div style={{
                textAlign:'center', padding:'48px',
                background:'rgba(0,245,255,0.02)', border:'1px solid rgba(0,245,255,0.08)', borderRadius:2,
                color:TR.sub, fontFamily:"'Space Mono',monospace", fontSize:11,
              }}>
                SIN PRODUCTOS EN ESTA CATEGORÍA<br/>
                <span style={{ fontSize:9, opacity:0.5 }}>Consultanos directamente por WhatsApp</span>
              </div>
            )}
          </div>
        )}

        {/* Default: show all units */}
        {!activeUnitId && !activeCatName && !search.trim() && (
          <div>
            {BUSINESS_UNITS.map((unit, ui) => (
              <div key={unit.id} style={{ marginBottom:32 }}>
                <div style={{
                  display:'flex', alignItems:'center', gap:12, marginBottom:16,
                  padding:'10px 14px',
                  background:`${unit.aura}08`,
                  border:`1px solid ${unit.aura}22`,
                  borderLeft:`3px solid ${unit.aura}`,
                  borderRadius:2, cursor:'pointer',
                }}
                  onClick={() => setActiveUnitId(unit.id)}>
                  <span style={{ fontSize:16, color:unit.aura }}>{unit.icon}</span>
                  <span style={{ fontSize:12, fontWeight:900, color:unit.aura, fontFamily:"'Space Mono',monospace", letterSpacing:'0.1em' }}>
                    {unit.name}
                  </span>
                  <span style={{ fontSize:9, color:TR.sub, marginLeft:4 }}>
                    {unit.categories.length} CATEGORÍAS
                  </span>
                  <span style={{ marginLeft:'auto', fontSize:10, color:unit.aura, opacity:0.6 }}>EXPLORAR →</span>
                </div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {unit.categories.map(cat => (
                    <button key={cat.name}
                      onClick={() => { setActiveUnitId(unit.id); setActiveCatName(cat.name) }}
                      style={{
                        padding:'8px 14px', borderRadius:2, cursor:'pointer', fontSize:10,
                        border:'1px solid rgba(0,245,255,0.1)', background:'rgba(0,245,255,0.03)',
                        color:TR.muted, fontFamily:"'Space Mono',monospace", transition:'all 0.15s',
                        display:'flex', alignItems:'center', gap:6,
                      }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=unit.aura+'55';e.currentTarget.style.color=unit.aura;e.currentTarget.style.background=`${unit.aura}10`}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(0,245,255,0.1)';e.currentTarget.style.color=TR.muted;e.currentTarget.style.background='rgba(0,245,255,0.03)'}}>
                      {cat.emoji} {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{
          borderTop:'1px solid rgba(0,245,255,0.08)', marginTop:40, paddingTop:24,
          textAlign:'center',
        }}>
          <div style={{ fontSize:9, color:TR.sub, fontFamily:"'Space Mono',monospace", lineHeight:2, letterSpacing:'0.1em' }}>
            STEPS INDUSTRIAL · CATRIEL, NEUQUÉN, PATAGONIA ARGENTINA<br/>
            2993295575 · GESTIONSTEPS@GMAIL.COM · STEPSINDUSTRIAL.COM<br/>
            © 2026 — SEGURIDAD Y CONSTRUCCIÓN · WALK SAFE
          </div>
        </div>
      </div>

      {/* Carrito panel */}
      {showCarrito && !guestMode && (
        <Carrito
          items={carrito}
          onRemove={removeFromCarrito}
          onQtyChange={changeQty}
          nivel={nivel}
          dolarRate={dolarRate}
          moneda={moneda}
          onEnviar={enviarSolicitud}
          onClose={() => setShowCarrito(false)}
        />
      )}
    </div>
  )
}
