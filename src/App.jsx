import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'
import Auth from './Auth'

// Pages
import Home from './pages/Home'
import Stepi from './pages/Stepi'
import Dashboard from './pages/Dashboard'

// CRM
import SectorCRM from './pages/CRM'
import Clientes from './pages/Clientes'
import Kanban from './pages/Kanban'
import Ventas from './pages/Ventas'
import Presupuestos from './pages/Presupuestos'

// ERP
import SectorERP from './pages/ERP'
import Facturacion from './pages/Facturacion'
import Compras from './pages/Compras'
import Balance from './pages/Balance'
import Stock from './pages/Stock'
import Proveedores from './pages/Proveedores'
import Catalogo from './pages/Catalogo'
import CargaProductos from './pages/CargaProductos'
import Remitos from './pages/Remitos'

// Gestión
import SectorGestion from './pages/GESTION'
import Tareas from './pages/Tareas'
import Notas from './pages/Notas'
import Agenda from './pages/Agenda'
import Reportes from './pages/Reportes'

import './App.css'

// ── NAV STRUCTURE ─────────────────────────────────────────────────────────────
const NAV_SECTORS = [
  { path:'/',       icon:'🏠', label:'Inicio',  color:'#E8860A' },
  { path:'/jarvis', icon:'⚡', label:'Stepi',   color:'#E8860A' },
  { path:'/crm',    icon:'🎯', label:'CRM',     color:'#8B5CF6',
    children:[
      {path:'/clientes',    icon:'👥', label:'Clientes',     color:'#7C3AED'},
      {path:'/kanban',      icon:'🗂', label:'Pipeline',     color:'#8B5CF6'},
      {path:'/ventas',      icon:'💼', label:'Operaciones',  color:'#F59E0B'},
      {path:'/presupuestos',icon:'📋', label:'Presupuestos', color:'#3B82F6'},
    ]
  },
  { path:'/erp',    icon:'🏗️', label:'ERP',     color:'#3B82F6',
    children:[
      {path:'/facturacion',     icon:'🧾', label:'Facturación',  color:'#E8860A'},
      {path:'/compras',         icon:'💸', label:'Compras',      color:'#C0392B'},
      {path:'/balance',         icon:'⚖️', label:'Balance',      color:'#22C55E'},
      {path:'/stock',           icon:'📦', label:'Stock',        color:'#84CC16'},
      {path:'/proveedores',     icon:'🏭', label:'Proveedores',  color:'#06B6D4'},
      {path:'/catalogo',        icon:'🗂', label:'Catálogo',     color:'#14B8A6'},
      {path:'/carga-productos', icon:'✨', label:'Productos',    color:'#F5A623'},
      {path:'/remitos',         icon:'📋', label:'Remitos',      color:'#8B5CF6'},
    ]
  },
  { path:'/gestion',icon:'📋', label:'Gestión', color:'#10B981',
    children:[
      {path:'/tareas',   icon:'📅', label:'Tareas',   color:'#F43F5E'},
      {path:'/notas',    icon:'📝', label:'Notas',    color:'#94A3B8'},
      {path:'/agenda',   icon:'🗓', label:'Agenda',   color:'#10B981'},
      {path:'/reportes', icon:'📊', label:'Reportes', color:'#3B82F6'},
    ]
  },
]

// ── TOASTS ────────────────────────────────────────────────────────────────────
let _toastListeners = []
export const toast = (msg, type='info', duration=3500) => {
  const id = Date.now()+Math.random()
  _toastListeners.forEach(fn=>fn({id,msg,type,duration}))
}

function ToastContainer() {
  const [toasts,setToasts]=useState([])
  useEffect(()=>{
    const handler=t=>{
      setToasts(prev=>[...prev,t])
      setTimeout(()=>setToasts(prev=>prev.filter(x=>x.id!==t.id)),t.duration)
    }
    _toastListeners.push(handler)
    return()=>{_toastListeners=_toastListeners.filter(fn=>fn!==handler)}
  },[])
  const colors={
    info:   {border:'#06b6d4',icon:'ℹ️',glow:'rgba(6,182,212,0.15)'},
    success:{border:'#22c55e',icon:'✅',glow:'rgba(34,197,94,0.15)'},
    warning:{border:'#f59e0b',icon:'⚠️',glow:'rgba(245,158,11,0.15)'},
    error:  {border:'#f43f5e',icon:'❌',glow:'rgba(244,63,94,0.15)'},
  }
  return (
    <>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(60px) scale(0.9)}to{opacity:1;transform:translateX(0) scale(1)}}`}</style>
      <div style={{position:'fixed',bottom:24,right:24,zIndex:9997,display:'flex',flexDirection:'column',gap:10,pointerEvents:'none'}}>
        {toasts.map(t=>{
          const col=colors[t.type]||colors.info
          return (
            <div key={t.id} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 18px',
              background:'rgba(7,7,15,0.95)',border:`1px solid ${col.border}`,
              borderLeft:`3px solid ${col.border}`,borderRadius:12,
              boxShadow:`0 0 24px ${col.glow},0 4px 20px rgba(0,0,0,0.5)`,
              backdropFilter:'blur(12px)',minWidth:240,maxWidth:360,
              animation:'toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards'}}>
              <span style={{fontSize:16}}>{col.icon}</span>
              <span style={{fontSize:13,color:'#f1f5f9',fontWeight:500,lineHeight:1.4}}>{t.msg}</span>
            </div>
          )
        })}
      </div>
    </>
  )
}

// ── BLACK HOLE ────────────────────────────────────────────────────────────────
function BlackHole({onDone}) {
  const canvasRef=useRef(null),frameRef=useRef(null)
  useEffect(()=>{
    const canvas=canvasRef.current,ctx=canvas.getContext('2d')
    canvas.width=window.innerWidth;canvas.height=window.innerHeight
    const W=canvas.width,H=canvas.height,cx=W/2,cy=H/2
    const start=performance.now(),DURATION=3200,TILT=0.28
    const stars=Array.from({length:200},()=>({angle:Math.random()*Math.PI*2,r:80+Math.random()*Math.max(W,H)*0.6,speed:0.0008+Math.random()*0.002,size:0.4+Math.random()*1.8,brightness:0.2+Math.random()*0.8,color:Math.random()>0.8?'#aad4ff':'#ffffff'}))
    const diskP=Array.from({length:280},()=>({angle:Math.random()*Math.PI*2,r:58+Math.random()*200,speed:0.025+Math.random()*0.04,size:0.8+Math.random()*2.2,temp:0.4+Math.random()*0.6}))
    const drawDisk=(sa,ea,alpha,blur)=>{ctx.save();ctx.filter=`blur(${blur}px)`;ctx.globalAlpha=alpha;const dg=ctx.createRadialGradient(0,0,52,0,0,240);dg.addColorStop(0,'rgba(255,240,180,0.95)');dg.addColorStop(0.15,'rgba(255,180,60,0.85)');dg.addColorStop(0.35,'rgba(220,80,0,0.6)');dg.addColorStop(0.6,'rgba(140,30,0,0.3)');dg.addColorStop(1,'rgba(0,0,0,0)');ctx.scale(1,TILT);ctx.beginPath();ctx.ellipse(0,0,240,240,0,sa,ea);ctx.lineTo(0,0);ctx.fillStyle=dg;ctx.fill();ctx.restore()}
    const draw=now=>{
      const elapsed=now-start,progress=Math.min(elapsed/DURATION,1)
      ctx.fillStyle='rgba(2,2,12,0.88)';ctx.fillRect(0,0,W,H)
      for(const s of stars){s.angle+=s.speed*(1+progress*6);s.r=Math.max(0,s.r-s.r*0.0012*(1+progress*10));if(s.r<8)continue;const sx=cx+Math.cos(s.angle)*s.r,sy=cy+Math.sin(s.angle)*s.r*0.55,fade=s.r<60?s.r/60:1;ctx.save();ctx.globalAlpha=s.brightness*fade;ctx.fillStyle=s.color;ctx.shadowColor=s.color;ctx.shadowBlur=s.size>1.2?4:0;ctx.beginPath();ctx.arc(sx,sy,s.size*Math.min(fade+0.2,1),0,Math.PI*2);ctx.fill();ctx.restore()}
      for(let ring=3;ring>=0;ring--){const rR=62+ring*55,rA=[0.06,0.1,0.14,0.07][ring],rC=ring<2?'rgba(255,210,100,':'rgba(245,140,0,',lg=ctx.createRadialGradient(cx,cy,rR*0.7,cx,cy,rR*1.3);lg.addColorStop(0,rC+'0)');lg.addColorStop(0.4,rC+rA+')');lg.addColorStop(0.65,rC+(rA*2.5)+')');lg.addColorStop(0.85,rC+rA+')');lg.addColorStop(1,rC+'0)');ctx.fillStyle=lg;ctx.beginPath();ctx.arc(cx,cy,rR*1.3,0,Math.PI*2);ctx.fill()}
      ctx.save();ctx.translate(cx,cy);drawDisk(Math.PI,Math.PI*2,0.7,6);ctx.restore()
      const bhR=56,sg=ctx.createRadialGradient(cx,cy,bhR*0.5,cx,cy,bhR*2.8);sg.addColorStop(0,'rgba(0,0,0,1)');sg.addColorStop(0.38,'rgba(0,0,0,1)');sg.addColorStop(0.65,'rgba(0,0,8,0.92)');sg.addColorStop(0.85,'rgba(0,0,12,0.6)');sg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=sg;ctx.beginPath();ctx.arc(cx,cy,bhR*2.8,0,Math.PI*2);ctx.fill()
      const cg=ctx.createRadialGradient(cx+bhR*0.28,cy-bhR*0.28,2,cx,cy,bhR);cg.addColorStop(0,'#06080f');cg.addColorStop(0.5,'#030408');cg.addColorStop(1,'#000');ctx.fillStyle=cg;ctx.beginPath();ctx.arc(cx,cy,bhR,0,Math.PI*2);ctx.fill()
      ctx.save();ctx.translate(cx,cy);drawDisk(0,Math.PI,1.0,4);ctx.restore()
      for(const p of diskP){p.angle+=p.speed*(65/Math.max(p.r,8));p.r=Math.max(0,p.r-0.06*(1+progress*3));if(p.r<8)continue;const x3=Math.cos(p.angle)*p.r,z3=Math.sin(p.angle)*p.r,px=cx+x3,py=cy+z3*TILT,dc=Math.hypot(px-cx,py-cy);if(dc<bhR*0.92)continue;const ef=Math.min(1,(dc-bhR)/28),front=z3>0,da=front?0.95:0.35,t=p.temp,r=Math.min(255,180+Math.floor(t*75)),g=Math.floor(60+t*170),b=Math.floor(t*60);ctx.save();ctx.globalAlpha=ef*da;ctx.fillStyle=`rgb(${r},${g},${b})`;if(front){ctx.shadowColor=`rgb(${r},${g},${b})`;ctx.shadowBlur=4}ctx.beginPath();ctx.arc(px,py,p.size*(front?1:0.55),0,Math.PI*2);ctx.fill();ctx.restore()}
      if(elapsed<DURATION)frameRef.current=requestAnimationFrame(draw);else onDone()
    }
    frameRef.current=requestAnimationFrame(draw)
    return()=>cancelAnimationFrame(frameRef.current)
  },[onDone])
  return <canvas ref={canvasRef} style={{position:'fixed',inset:0,zIndex:9999,background:'#02020c'}}/>
}

// ── LIVING BACKGROUND ─────────────────────────────────────────────────────────
function LivingBackground() {
  const canvasRef=useRef(null),frameRef=useRef(null),mouseRef=useRef({x:-1000,y:-1000})
  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return
    const ctx=canvas.getContext('2d')
    const resize=()=>{canvas.width=window.innerWidth;canvas.height=window.innerHeight}
    resize();window.addEventListener('resize',resize)
    const onMove=e=>{mouseRef.current={x:e.clientX,y:e.clientY}}
    window.addEventListener('mousemove',onMove)
    const nodes=Array.from({length:80},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,vx:(Math.random()-0.5)*0.4,vy:(Math.random()-0.5)*0.4,r:1.2+Math.random()*1.8,pulse:Math.random()*Math.PI*2}))
    const draw=()=>{
      ctx.clearRect(0,0,canvas.width,canvas.height)
      const mx=mouseRef.current.x,my=mouseRef.current.y
      for(const n of nodes){const dx=n.x-mx,dy=n.y-my,dist=Math.hypot(dx,dy);if(dist<130&&dist>0){const f=(1-dist/130)*1.1;n.vx+=(dx/dist)*f;n.vy+=(dy/dist)*f}const s=Math.hypot(n.vx,n.vy);if(s>2.5){n.vx=n.vx/s*2.5;n.vy=n.vy/s*2.5}n.vx*=0.94;n.vy*=0.94;n.x+=n.vx;n.y+=n.vy;n.pulse+=0.025;if(n.x<0||n.x>canvas.width)n.vx*=-1;if(n.y<0||n.y>canvas.height)n.vy*=-1}
      for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const a=nodes[i],b=nodes[j],dist=Math.hypot(a.x-b.x,a.y-b.y);if(dist>140)continue;ctx.save();ctx.globalAlpha=(1-dist/140)*0.18;const g=ctx.createLinearGradient(a.x,a.y,b.x,b.y);g.addColorStop(0,'#E8860A');g.addColorStop(0.5,'#F5A623');g.addColorStop(1,'#7C3AED');ctx.strokeStyle=g;ctx.lineWidth=0.6;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.restore()}
      for(const n of nodes){const p=Math.sin(n.pulse)*0.4+0.6;ctx.save();ctx.globalAlpha=p*0.7;const g=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,n.r*3);g.addColorStop(0,'#F5A623');g.addColorStop(0.5,'rgba(232,134,10,0.3)');g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.beginPath();ctx.arc(n.x,n.y,n.r*3,0,Math.PI*2);ctx.fill();ctx.globalAlpha=p;ctx.fillStyle='#F5A623';ctx.beginPath();ctx.arc(n.x,n.y,n.r,0,Math.PI*2);ctx.fill();ctx.restore()}
      frameRef.current=requestAnimationFrame(draw)
    }
    draw()
    return()=>{window.removeEventListener('resize',resize);window.removeEventListener('mousemove',onMove);cancelAnimationFrame(frameRef.current)}
  },[])
  return <canvas ref={canvasRef} style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',opacity:0.55}}/>
}

// ── DOLLAR WIDGET ─────────────────────────────────────────────────────────────
function DollarWidget() {
  const [open,setOpen]=useState(false),[hov,setHov]=useState(false)
  const [rates,setRates]=useState({oficial:null,blue:null}),[prevRates,setPrevRates]=useState({})
  const [lp,setLp]=useState(''),[lpSaved,setLpSaved]=useState('')
  const [applying,setApplying]=useState(false),[refreshing,setRefreshing]=useState(false)
  const [coinAngle,setCoinAngle]=useState(0)
  useEffect(()=>{
    const saved=localStorage.getItem('steps_lp_usd');if(saved){setLp(saved);setLpSaved(saved)}
    fetchRates()
    let a=0;const spin=setInterval(()=>{a=(a+0.4)%360;setCoinAngle(a)},32);return()=>clearInterval(spin)
  },[])
  const fetchRates=async()=>{
    setRefreshing(true)
    try{const[r1,r2]=await Promise.all([fetch('https://dolarapi.com/v1/dolares/oficial'),fetch('https://dolarapi.com/v1/dolares/blue')]);const[oficial,blue]=await Promise.all([r1.json(),r2.json()]);setRates(prev=>{setPrevRates({oficial:prev.oficial?.venta,blue:prev.blue?.venta});return{oficial,blue}})}catch(e){}
    setRefreshing(false)
  }
  const saveLp=()=>{if(!lp)return;localStorage.setItem('steps_lp_usd',lp);setLpSaved(lp)}
  const applyToProducts=async()=>{
    if(!lpSaved||applying)return;setApplying(true)
    const{data}=await supabase.from('products').select('id,price_usd,margin').not('price_usd','is',null).gt('price_usd',0)
    for(const p of data||[]){const cost=Math.round(p.price_usd*parseFloat(lpSaved));const sale=p.margin?Math.round(cost*(1+p.margin/100)):null;await supabase.from('products').update({cost_price:cost,...(sale?{sale_price:sale}:{}),cotizacion:parseFloat(lpSaved),updated_at:new Date()}).eq('id',p.id)}
    setApplying(false)
  }
  const arrow=(cur,prev)=>{if(!prev||!cur)return{sym:'—',col:'rgba(148,163,184,0.4)'};if(+cur>+prev)return{sym:'↑',col:'#22c55e'};if(+cur<+prev)return{sym:'↓',col:'#f43f5e'};return{sym:'→',col:'rgba(148,163,184,0.5)'}}
  const fmt=n=>n?`$${(+n).toLocaleString('es-AR')}`:'…'
  const shineX=50+Math.cos(coinAngle*Math.PI/180)*25,shineY=50+Math.sin(coinAngle*Math.PI/180)*20
  return (
    <div style={{position:'fixed',bottom:24,right:24,zIndex:9996}}>
      {open&&(
        <div style={{position:'absolute',bottom:58,right:0,width:272,background:'rgba(3,3,14,0.94)',backdropFilter:'blur(48px)',border:'1px solid rgba(255,255,255,0.09)',borderTop:'1px solid rgba(255,255,255,0.2)',borderRadius:18,padding:'16px 16px 14px',boxShadow:'0 0 40px rgba(245,160,0,0.08),0 32px 80px rgba(0,0,0,0.7)',animation:'dollarPop 0.32s cubic-bezier(0.34,1.3,0.64,1)'}}>
          <style>{`@keyframes dollarPop{from{opacity:0;transform:scale(0.88) translateY(12px);transform-origin:bottom right}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
            <span style={{fontSize:11,fontWeight:700,color:'rgba(245,180,0,0.85)',textTransform:'uppercase',letterSpacing:'0.12em'}}>Tipos de cambio</span>
            <button onClick={fetchRates} disabled={refreshing} style={{background:'none',border:'none',color:'rgba(148,163,184,0.45)',cursor:'pointer',fontSize:14,transform:refreshing?'rotate(180deg)':'none',transition:'transform 0.5s',padding:'2px 6px'}}>↻</button>
          </div>
          {[{label:'Oficial',key:'oficial',data:rates.oficial},{label:'Blue',key:'blue',data:rates.blue}].map(({label,key,data})=>{
            const arr=arrow(data?.venta,prevRates[key])
            return(
              <div key={key} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 12px',borderRadius:10,marginBottom:7,background:'rgba(255,255,255,0.035)',border:'1px solid rgba(255,255,255,0.06)'}}>
                <span style={{fontSize:12,color:'rgba(148,163,184,0.65)',fontWeight:500,minWidth:50}}>{label}</span>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:10,color:'rgba(148,163,184,0.35)'}}>C {fmt(data?.compra)}</span>
                  <span style={{fontSize:15,fontWeight:800,color:'#f1f5f9'}}>{fmt(data?.venta)}</span>
                  <span style={{fontSize:18,fontWeight:900,color:arr.col,lineHeight:1}}>{arr.sym}</span>
                </div>
              </div>
            )
          })}
          <div style={{padding:'10px 12px',borderRadius:10,marginBottom:10,background:'rgba(245,160,0,0.05)',border:'1px solid rgba(245,160,0,0.18)'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:7}}>
              <span style={{fontSize:11,color:'rgba(245,160,0,0.85)',fontWeight:700}}>LP — lista de precios</span>
              {lpSaved&&<span style={{fontSize:9,color:'rgba(34,197,94,0.7)'}}>✓ ACTIVO</span>}
            </div>
            <div style={{display:'flex',gap:6,alignItems:'center'}}>
              <span style={{fontSize:13,color:'rgba(148,163,184,0.5)',flexShrink:0}}>$</span>
              <input type="number" value={lp} onChange={e=>setLp(e.target.value)} placeholder="Ej: 1290" onKeyDown={e=>e.key==='Enter'&&saveLp()} style={{flex:1,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:8,padding:'6px 8px',color:'#f1f5f9',fontSize:16,fontWeight:800,outline:'none'}}/>
              <button onClick={saveLp} disabled={!lp||lp===lpSaved} style={{padding:'6px 12px',borderRadius:8,border:'none',cursor:'pointer',background:'rgba(245,160,0,0.18)',color:'rgba(245,160,0,0.9)',fontSize:12,fontWeight:700,opacity:(!lp||lp===lpSaved)?0.35:1}}>✓</button>
            </div>
          </div>
          <button onClick={applyToProducts} disabled={!lpSaved||applying} style={{width:'100%',padding:'10px',borderRadius:10,border:'none',background:applying?'rgba(255,255,255,0.05)':lpSaved?'linear-gradient(135deg,rgba(245,160,0,0.85),rgba(220,100,0,0.75))':'rgba(255,255,255,0.04)',color:applying?'rgba(148,163,184,0.5)':lpSaved?'#000':'rgba(148,163,184,0.3)',cursor:!lpSaved||applying?'default':'pointer',fontSize:12,fontWeight:800}}>
            {applying?'⏳ Actualizando...':lpSaved?`⚡ Aplicar $${lpSaved} a productos`:'Definí el LP primero'}
          </button>
        </div>
      )}
      <button onClick={()=>setOpen(o=>!o)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
        style={{width:48,height:48,borderRadius:'50%',border:'none',cursor:'pointer',position:'relative',overflow:'hidden',background:`conic-gradient(from ${coinAngle}deg,#C8941A 0%,#F5D060 15%,#FFE87C 22%,#D4A520 30%,#8B6510 40%,#C8941A 50%,#F5D060 65%,#FFE87C 72%,#D4A520 80%,#8B6510 90%,#C8941A 100%)`,transform:hov||open?'perspective(180px) rotateX(8deg) rotateY(-5deg) translateY(-4px) scale(1.12)':'perspective(180px) rotateX(14deg)',boxShadow:hov||open?'0 8px 0 rgba(0,0,0,0.45),0 0 35px rgba(245,180,0,0.55)':'0 4px 0 rgba(0,0,0,0.4),0 6px 16px rgba(0,0,0,0.45)',transition:'transform 0.28s cubic-bezier(0.34,1.3,0.64,1),box-shadow 0.28s ease'}}>
        <div style={{position:'absolute',width:24,height:24,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,255,255,0.7) 0%,transparent 70%)',left:`${shineX-12}%`,top:`${shineY-12}%`,pointerEvents:'none',mixBlendMode:'screen'}}/>
        <span style={{position:'relative',zIndex:1,fontSize:22,fontWeight:900,color:hov||open?'#3D2200':'#5C3800',display:'flex',alignItems:'center',justifyContent:'center',width:'100%',height:'100%',userSelect:'none'}}>$</span>
      </button>
    </div>
  )
}

// ── SIDEBAR ───────────────────────────────────────────────────────────────────
function Sidebar({ collapsed, toggle, session, logout }) {
  const location = useLocation()
  const [expandedSector, setExpandedSector] = useState(null)

  // Auto-expand current sector
  useEffect(()=>{
    const current = NAV_SECTORS.find(s=>s.children?.some(c=>location.pathname===c.path))
    if(current) setExpandedSector(current.path)
  },[location.pathname])

  return (
    <div style={{
      width:collapsed?60:220,flexShrink:0,
      display:'flex',flexDirection:'column',
      position:'sticky',top:0,height:'100vh',
      overflowY:'auto',overflowX:'hidden',
      background:'linear-gradient(180deg,rgba(8,4,20,0.99),rgba(6,3,16,0.98))',
      borderRight:'1px solid rgba(255,255,255,0.05)',
      zIndex:100,
      transition:'width 0.3s cubic-bezier(0.4,0,0.2,1)',
    }}>

      {/* Logo */}
      <div style={{padding:collapsed?'16px 0':'16px 16px 12px',
        borderBottom:'1px solid rgba(255,255,255,0.05)',flexShrink:0,
        display:'flex',alignItems:'center',justifyContent:collapsed?'center':'flex-start',
        gap:10,overflow:'hidden',position:'relative'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:80,
          background:'radial-gradient(ellipse 200% 120% at 50% -10%,rgba(232,134,10,0.12),transparent 70%)',
          pointerEvents:'none'}}/>
        <img src="/logo.png" alt="STEPS"
          style={{height:collapsed?20:24,width:'auto',flexShrink:0,
            filter:'brightness(1.1) drop-shadow(0 0 10px rgba(232,134,10,0.5))',
            transition:'all 0.3s'}}
          onError={e=>e.target.style.display='none'}/>
        {!collapsed&&(
          <div style={{fontSize:7,color:'rgba(148,163,184,0.4)',textTransform:'uppercase',
            letterSpacing:'0.18em',whiteSpace:'nowrap'}}>Command Center</div>
        )}
      </div>

      {/* Nav */}
      <nav style={{padding:collapsed?'8px 6px':'8px',flex:1}}>
        {NAV_SECTORS.map(sector=>{
          const isActive = location.pathname===sector.path
          const hasChildren = !!sector.children
          const isExpanded = expandedSector===sector.path
          const childActive = sector.children?.some(c=>location.pathname===c.path)

          return (
            <div key={sector.path}>
              <NavLink to={sector.path} end={sector.path=='/'}
                onClick={e=>{
                  if(hasChildren&&!collapsed){
                    e.preventDefault()
                    setExpandedSector(isExpanded?null:sector.path)
                  }
                }}
                style={{
                  display:'flex',alignItems:'center',
                  gap:collapsed?0:8,
                  padding:collapsed?'7px':'7px 8px',
                  justifyContent:collapsed?'center':'flex-start',
                  borderRadius:10,marginBottom:2,textDecoration:'none',
                  background:isActive||childActive?`${sector.color}15`:'transparent',
                  border:`1px solid ${isActive||childActive?sector.color+'33':'transparent'}`,
                  transition:'all 0.2s',
                }}>
                <div style={{
                  width:30,height:30,borderRadius:8,flexShrink:0,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:15,
                  background:isActive||childActive?`${sector.color}22`:'rgba(255,255,255,0.03)',
                  border:`1px solid ${isActive||childActive?sector.color+'44':'rgba(255,255,255,0.07)'}`,
                  boxShadow:isActive||childActive?`0 0 12px ${sector.color}22`:'none',
                }}>
                  {sector.icon}
                </div>
                {!collapsed&&(
                  <>
                    <span style={{flex:1,fontSize:12,fontWeight:isActive||childActive?700:400,
                      color:isActive||childActive?sector.color:'#64748B',
                      whiteSpace:'nowrap',transition:'color 0.15s'}}>
                      {sector.label}
                    </span>
                    {hasChildren&&(
                      <span style={{fontSize:9,color:sector.color,opacity:0.6,
                        transform:isExpanded?'rotate(180deg)':'none',
                        transition:'transform 0.2s'}}>▼</span>
                    )}
                  </>
                )}
              </NavLink>

              {/* Children */}
              {hasChildren&&!collapsed&&isExpanded&&(
                <div style={{marginLeft:12,marginBottom:4,
                  borderLeft:`1px solid ${sector.color}22`,paddingLeft:8}}>
                  {sector.children.map(child=>(
                    <NavLink key={child.path} to={child.path}
                      style={{
                        display:'flex',alignItems:'center',gap:7,
                        padding:'5px 8px',borderRadius:8,marginBottom:1,
                        textDecoration:'none',transition:'all 0.15s',
                      }}>
                      {({isActive})=>(
                        <>
                          <span style={{fontSize:12,opacity:isActive?1:0.5}}>{child.icon}</span>
                          <span style={{fontSize:11,fontWeight:isActive?600:400,
                            color:isActive?child.color:'#64748B',
                            whiteSpace:'nowrap'}}>
                            {child.label}
                          </span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {/* Toggle button */}
        <button onClick={toggle}
          style={{display:'flex',alignItems:'center',justifyContent:'center',
            width:'100%',marginTop:8,padding:'7px',borderRadius:10,
            border:'1px solid rgba(255,255,255,0.07)',background:'transparent',
            cursor:'pointer',color:'rgba(148,163,184,0.35)',transition:'all 0.2s',fontSize:13}}
          onMouseEnter={e=>{e.currentTarget.style.color='rgba(232,134,10,0.7)';e.currentTarget.style.borderColor='rgba(232,134,10,0.3)'}}
          onMouseLeave={e=>{e.currentTarget.style.color='rgba(148,163,184,0.35)';e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'}}>
          {collapsed?'›':'‹'}
        </button>
      </nav>

      {/* Footer */}
      {!collapsed&&(
        <div style={{padding:'10px 12px',borderTop:'1px solid rgba(255,255,255,0.05)',flexShrink:0}}>
          <div style={{fontSize:9,color:'#334155',marginBottom:7,
            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
            {session?.user?.email}
          </div>
          <button onClick={logout}
            style={{width:'100%',padding:'6px',borderRadius:7,
              border:'1px solid rgba(255,255,255,0.07)',background:'transparent',
              color:'#475569',cursor:'pointer',fontSize:11,transition:'all .2s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(244,63,94,0.4)';e.currentTarget.style.color='#f43f5e'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.07)';e.currentTarget.style.color='#475569'}}>
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}

// ── APP ───────────────────────────────────────────────────────────────────────
function AppInner({ session, logout }) {
  const [collapsed,setCollapsed]=useState(()=>localStorage.getItem('steps_sidebar_collapsed')==='true')
  const toggle=()=>setCollapsed(v=>{const next=!v;localStorage.setItem('steps_sidebar_collapsed',''+next);return next})

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#07070f',color:'#f1f5f9',
      position:'relative',fontFamily:'system-ui,-apple-system,sans-serif'}}>
      <Sidebar collapsed={collapsed} toggle={toggle} session={session} logout={logout}/>
      <div style={{flex:1,overflowY:'auto',zIndex:1,position:'relative'}}>
        <Routes>
          {/* Home */}
          <Route path="/" element={<Home/>}/>
          <Route path="/jarvis" element={<Stepi/>}/>
          <Route path="/dashboard" element={<Dashboard/>}/>

          {/* CRM */}
          <Route path="/crm" element={<SectorCRM/>}/>
          <Route path="/clientes" element={<Clientes/>}/>
          <Route path="/kanban" element={<Kanban/>}/>
          <Route path="/ventas" element={<Ventas/>}/>
          <Route path="/presupuestos" element={<Presupuestos/>}/>

          {/* ERP */}
          <Route path="/erp" element={<SectorERP/>}/>
          <Route path="/facturacion" element={<Facturacion/>}/>
          <Route path="/compras" element={<Compras/>}/>
          <Route path="/balance" element={<Balance/>}/>
          <Route path="/stock" element={<Stock/>}/>
          <Route path="/proveedores" element={<Proveedores/>}/>
          <Route path="/catalogo" element={<Catalogo/>}/>
          <Route path="/carga-productos" element={<CargaProductos/>}/>
          <Route path="/remitos" element={<Remitos/>}/>

          {/* Gestión */}
          <Route path="/gestion" element={<SectorGestion/>}/>
          <Route path="/tareas" element={<Tareas/>}/>
          <Route path="/notas" element={<Notas/>}/>
          <Route path="/agenda" element={<Agenda/>}/>
          <Route path="/reportes" element={<Reportes/>}/>
        </Routes>
      </div>
      <LivingBackground/>
      <ToastContainer/>
      <DollarWidget/>
    </div>
  )
}

export default function App() {
  const [session,setSession]=useState(null)
  const [loading,setLoading]=useState(true)
  const [showBlackHole,setShowBlackHole]=useState(false)
  const [showApp,setShowApp]=useState(false)

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      if(session){setSession(session);setShowApp(true)}
      setLoading(false)
    })
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{
      if(session&&!showApp){setSession(session);setShowBlackHole(true)}
      else if(!session){setShowApp(false);setShowBlackHole(false);setSession(null)}
    })
    return()=>subscription.unsubscribe()
  },[])

  const logout=async()=>{await supabase.auth.signOut();setShowApp(false);setShowBlackHole(false);setSession(null)}

  if(loading) return (
    <div style={{minHeight:'100vh',background:'#07070f',display:'flex',alignItems:'center',
      justifyContent:'center',color:'#E8860A',fontFamily:'system-ui'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:8,opacity:0.6}}>⚡</div>
        <div style={{fontSize:12,color:'#475569'}}>Iniciando STEPS...</div>
      </div>
    </div>
  )

  if(showBlackHole&&!showApp) return <BlackHole onDone={()=>{setShowBlackHole(false);setShowApp(true)}}/>
  if(!session||!showApp) return <Auth/>

  return (
    <BrowserRouter>
      <AppInner session={session} logout={logout}/>
    </BrowserRouter>
  )
}


