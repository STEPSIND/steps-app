import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const T = {
  bg:     'linear-gradient(160deg,#050510 0%,#080818 50%,#050510 100%)',
  text:   '#F0EFFF', muted: '#8884A8', sub: '#4A4870',
  border: 'rgba(255,255,255,0.07)',
  orange: '#E8860A', orangeL: '#F5A623',
  lime:   '#22C55E', rose:    '#F43F5E',
  blue:   '#3B82F6', violet:  '#8B5CF6',
  amber:  '#F59E0B', cyan:    '#06B6D4',
  green:  '#10B981',
}

const fmtM = n => {
  const v = parseFloat(n)||0
  if(v>=1e6) return `$${(v/1e6).toFixed(2)}M`
  if(v>=1e3) return `$${(v/1e3).toFixed(0)}k`
  return `$${Math.round(v).toLocaleString('es-AR')}`
}

const getGreeting = () => {
  const h = new Date().getHours()
  if(h>=6&&h<12) return 'Buenos días'
  if(h>=12&&h<20) return 'Buenas tardes'
  return 'Buenas noches'
}

// ── SECTOR CARD ───────────────────────────────────────────────────────────────
function SectorCard({ sector, onClick }) {
  const [hov, setHov] = useState(false)
  const ref = useRef()
  const onMove = e => {
    const r = ref.current?.getBoundingClientRect(); if(!r) return
    ref.current.style.setProperty('--sx', `${((e.clientX-r.left)/r.width)*100}%`)
    ref.current.style.setProperty('--sy', `${((e.clientY-r.top)/r.height)*100}%`)
  }

  return (
    <div ref={ref} onClick={onClick}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onMouseMove={onMove}
      style={{
        position:'relative', overflow:'hidden', cursor:'pointer',
        borderRadius:24, padding:'28px 26px',
        background:`linear-gradient(135deg,${sector.color}12,${sector.color}06)`,
        border:`1px solid ${hov?sector.color+'55':sector.color+'22'}`,
        borderTop:`1px solid ${hov?sector.color+'88':sector.color+'44'}`,
        boxShadow: hov
          ? `0 24px 64px ${sector.color}20, 0 0 0 1px ${sector.color}22, inset 0 1px 0 rgba(255,255,255,0.1)`
          : `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)`,
        transform: hov ? 'translateY(-8px) scale(1.02)' : 'none',
        transition: 'all 0.4s cubic-bezier(0.34,1.2,0.64,1)',
        backdropFilter: 'blur(24px)',
      }}>

      {/* Spotlight */}
      <div style={{position:'absolute',inset:0,pointerEvents:'none',
        background:`radial-gradient(circle 160px at var(--sx,50%) var(--sy,50%),${sector.color}15,transparent 70%)`}}/>

      {/* Glow orb */}
      <div style={{position:'absolute',top:-40,right:-40,width:160,height:160,borderRadius:'50%',
        background:`radial-gradient(circle,${sector.color}18,transparent 70%)`,
        pointerEvents:'none',transition:'opacity 0.3s',opacity:hov?1:0.5}}/>

      {/* Top border shine */}
      <div style={{position:'absolute',top:0,left:'10%',right:'10%',height:1,
        background:`linear-gradient(90deg,transparent,${hov?sector.color+'88':'rgba(255,255,255,0.08)'},transparent)`}}/>

      {/* Icon */}
      <div style={{
        width:56,height:56,borderRadius:18,marginBottom:20,
        background:`linear-gradient(135deg,${sector.color}30,${sector.color}15)`,
        border:`1.5px solid ${sector.color}44`,
        display:'flex',alignItems:'center',justifyContent:'center',
        fontSize:26,
        boxShadow:`0 8px 24px ${sector.color}20, inset 0 1px 0 rgba(255,255,255,0.15)`,
        transform: hov ? 'scale(1.1) rotate(-4deg)' : 'none',
        transition:'transform 0.3s cubic-bezier(0.34,1.4,0.64,1)',
      }}>
        {sector.icon}
      </div>

      {/* Title */}
      <div style={{fontSize:20,fontWeight:900,color:T.text,
        fontFamily:"'Syne',sans-serif",marginBottom:6,letterSpacing:'-0.3px'}}>
        {sector.name}
      </div>
      <div style={{fontSize:12,color:T.muted,marginBottom:20,lineHeight:1.5}}>
        {sector.desc}
      </div>

      {/* KPIs */}
      <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap'}}>
        {sector.kpis.map((k,i)=>(
          <div key={i} style={{
            padding:'8px 12px',borderRadius:12,
            background:'rgba(255,255,255,0.05)',
            border:`1px solid ${sector.color}22`,
            flex:'1 1 0',minWidth:80,
          }}>
            <div style={{fontSize:16,fontWeight:900,color:sector.color,
              fontFamily:"'Space Mono',monospace",lineHeight:1}}>{k.v}</div>
            <div style={{fontSize:9,color:T.muted,marginTop:3,fontWeight:600,
              textTransform:'uppercase',letterSpacing:'0.06em'}}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* Modules preview */}
      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
        {sector.modules.map((m,i)=>(
          <span key={i} style={{
            fontSize:10,padding:'4px 10px',borderRadius:20,
            background:`${sector.color}12`,
            border:`1px solid ${sector.color}25`,
            color:sector.color,fontWeight:600,
          }}>{m}</span>
        ))}
      </div>

      {/* Arrow */}
      <div style={{
        position:'absolute',bottom:24,right:24,
        width:36,height:36,borderRadius:12,
        background:`${sector.color}20`,
        border:`1px solid ${sector.color}33`,
        display:'flex',alignItems:'center',justifyContent:'center',
        fontSize:16,color:sector.color,
        transform: hov ? 'translateX(4px)' : 'none',
        transition:'transform 0.3s ease',
      }}>→</div>
    </div>
  )
}

// ── GLOBAL KPI ────────────────────────────────────────────────────────────────
function GlobalKpi({ icon, label, value, color, sub }) {
  const [hov, setHov] = useState(false)
  const ref = useRef()
  const onMove = e => {
    const r = ref.current?.getBoundingClientRect(); if(!r) return
    ref.current.style.setProperty('--sx', `${((e.clientX-r.left)/r.width)*100}%`)
    ref.current.style.setProperty('--sy', `${((e.clientY-r.top)/r.height)*100}%`)
  }
  return (
    <div ref={ref} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onMouseMove={onMove}
      style={{
        flex:'1 1 0', minWidth:120, padding:'16px 18px', borderRadius:16, cursor:'default',
        background:'rgba(255,255,255,0.04)',
        backdropFilter:'blur(24px)',
        border:`1px solid ${hov?color+'44':T.border}`,
        borderTop:`1px solid ${hov?color+'77':'rgba(255,255,255,0.12)'}`,
        boxShadow:hov?`0 16px 48px ${color}18`:'0 4px 20px rgba(0,0,0,0.3)',
        transform:hov?'translateY(-4px)':'none',
        transition:'all 0.3s cubic-bezier(0.34,1.4,0.64,1)',
        position:'relative',overflow:'hidden',
      }}>
      <div style={{position:'absolute',inset:0,pointerEvents:'none',
        background:`radial-gradient(circle 80px at var(--sx,50%) var(--sy,50%),${color}15,transparent 70%)`}}/>
      <div style={{position:'absolute',top:0,left:'10%',right:'10%',height:1,
        background:`linear-gradient(90deg,transparent,${hov?color+'66':'rgba(255,255,255,0.07)'},transparent)`}}/>
      <div style={{fontSize:20,marginBottom:8,opacity:hov?1:0.6,transition:'opacity 0.2s',
        filter:hov?`drop-shadow(0 0 6px ${color}88)`:'none'}}>{icon}</div>
      <div style={{fontSize:22,fontWeight:900,color,fontFamily:"'Space Mono',monospace",
        letterSpacing:'-0.5px',lineHeight:1,
        textShadow:hov?`0 0 20px ${color}66`:'none',transition:'text-shadow 0.3s'}}>
        {value}
      </div>
      <div style={{fontSize:11,color:T.muted,marginTop:5,fontWeight:600}}>{label}</div>
      {sub&&<div style={{fontSize:10,color:T.sub,marginTop:2}}>{sub}</div>}
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate()
  const [kpis, setKpis] = useState({
    facturadoMes:0, cobradoMes:0, pendienteCobro:0,
    resultado:0, rentPct:0, pipelineTotal:0,
    clientesActivos:0, clientesTotal:0, operacionesActivas:0,
    pptosTotal:0, pptosAprobados:0, convRate:0,
    proveedores:0, productos:0, egresosMes:0,
    tareasPendientes:0,
  })
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState(new Date())

  useEffect(()=>{
    const t = setInterval(()=>setTime(new Date()),1000)
    return()=>clearInterval(t)
  },[])

  useEffect(()=>{
    const load = async () => {
      setLoading(true)
      const now = new Date()
      const mesI = new Date(now.getFullYear(),now.getMonth(),1).toISOString().split('T')[0]

      const [invMes, compMes, cls, ops, qMes, prov, prods, tareas] = await Promise.all([
        supabase.from('invoices').select('total,status').gte('date',mesI),
        supabase.from('purchases').select('total').gte('date',mesI),
        supabase.from('clients').select('status'),
        supabase.from('operations').select('status,total_venta'),
        supabase.from('quotes').select('status,total').gte('date',mesI),
        supabase.from('suppliers').select('id',{count:'exact',head:true}),
        supabase.from('products').select('id',{count:'exact',head:true}),
        supabase.from('tasks').select('id,status'),
      ])

      const invData = invMes.data||[]
      const facturadoMes = invData.reduce((s,i)=>s+(i.total||0),0)
      const cobradoMes = invData.filter(i=>['COBRADA','Cobrada'].includes(i.status)).reduce((s,i)=>s+(i.total||0),0)
      const pendienteCobro = invData.filter(i=>['PENDIENTE','Pendiente','EMITIDA','Emitida'].includes(i.status)).reduce((s,i)=>s+(i.total||0),0)
      const egresosMes = (compMes.data||[]).reduce((s,p)=>s+(p.total||0),0)
      const resultado = facturadoMes - egresosMes
      const rentPct = facturadoMes>0?(resultado/facturadoMes*100).toFixed(1):0

      const clsData = cls.data||[]
      const clientesActivos = clsData.filter(c=>c.status==='ACTIVO').length

      const opsData = ops.data||[]
      const operacionesActivas = opsData.filter(o=>o.status!=='CERRADO').length
      const pipelineTotal = opsData.filter(o=>o.status!=='CERRADO').reduce((s,o)=>s+(o.total_venta||0),0)

      const qData = qMes.data||[]
      const pptosAprobados = qData.filter(q=>q.status==='APROBADO').length
      const convRate = qData.length>0?(pptosAprobados/qData.length*100).toFixed(0):0

      const tareasData = tareas.data||[]
      const tareasPendientes = tareasData.filter(t=>t.status==='Pendiente'||t.status==='PENDIENTE').length

      setKpis({
        facturadoMes, cobradoMes, pendienteCobro,
        resultado, rentPct, pipelineTotal,
        clientesActivos, clientesTotal:clsData.length,
        operacionesActivas,
        pptosTotal:qData.length, pptosAprobados, convRate,
        proveedores:prov.count||0, productos:prods.count||0,
        egresosMes, tareasPendientes,
      })
      setLoading(false)
    }
    load()
  },[])

  const SECTORS = [
    {
      id: 'crm',
      icon: '🎯',
      name: 'CRM STEPS',
      desc: 'Gestión comercial, clientes y pipeline de ventas',
      color: T.violet,
      path: '/crm',
      modules: ['Clientes','Pipeline','Operaciones','Presupuestos'],
      kpis: [
        {l:'Clientes activos', v:kpis.clientesActivos},
        {l:'Pipeline',         v:fmtM(kpis.pipelineTotal)},
        {l:'Conversión',       v:`${kpis.convRate}%`},
      ],
    },
    {
      id: 'erp',
      icon: '🏗️',
      name: 'ERP STEPS',
      desc: 'Facturación, finanzas, inventario y proveedores',
      color: T.blue,
      path: '/erp',
      modules: ['Facturación','Compras','Balance','Stock','Proveedores','Catálogo','Productos','Remitos'],
      kpis: [
        {l:'Facturado mes', v:fmtM(kpis.facturadoMes)},
        {l:'Resultado',     v:fmtM(kpis.resultado)},
        {l:'Rentabilidad',  v:`${kpis.rentPct}%`},
      ],
    },
    {
      id: 'gestion',
      icon: '📋',
      name: 'Gestión STEPS',
      desc: 'Tareas, agenda, notas y reportes operativos',
      color: T.green,
      path: '/gestion',
      modules: ['Tareas','Notas','Agenda','Reportes'],
      kpis: [
        {l:'Tareas pendientes', v:kpis.tareasPendientes},
        {l:'Proveedores',       v:kpis.proveedores},
        {l:'Productos',         v:kpis.productos},
      ],
    },
    {
      id: 'stepi',
      icon: '⚡',
      name: 'Stepi IA',
      desc: 'Tu consultor de negocios con IA. Analizá, consultá y tomá decisiones.',
      color: T.orange,
      path: '/jarvis',
      modules: ['Análisis financiero','Estrategia','Alertas','Consultoría'],
      kpis: [
        {l:'Ops. activas',   v:kpis.operacionesActivas},
        {l:'Por cobrar',     v:fmtM(kpis.pendienteCobro)},
        {l:'Clientes total', v:kpis.clientesTotal},
      ],
    },
  ]

  return (
    <div style={{minHeight:'100vh',background:T.bg,fontFamily:"'Nunito Sans',system-ui,sans-serif",
      color:T.text,display:'flex',flexDirection:'column'}}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:0.6}50%{opacity:1}}
        @keyframes spinSlow{to{transform:rotate(360deg)}}
      `}</style>

      {/* ── HERO HEADER ── */}
      <div style={{padding:'48px 48px 32px',position:'relative',overflow:'hidden'}}>
        {/* BG decorations */}
        <div style={{position:'absolute',top:-100,left:-100,width:400,height:400,borderRadius:'50%',
          background:'radial-gradient(circle,rgba(232,134,10,0.06),transparent 70%)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',top:-80,right:-80,width:300,height:300,borderRadius:'50%',
          background:'radial-gradient(circle,rgba(139,92,246,0.06),transparent 70%)',pointerEvents:'none'}}/>

        {/* Top bar */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',
          marginBottom:40,animation:'fadeUp 0.5s ease both'}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:T.lime,
                boxShadow:`0 0 8px ${T.lime}`,animation:'pulse 2s ease infinite'}}/>
              <span style={{fontSize:10,fontWeight:700,color:T.lime,textTransform:'uppercase',
                letterSpacing:'0.15em'}}>Sistema activo</span>
            </div>
            <h1 style={{margin:0,fontSize:36,fontWeight:900,letterSpacing:'-0.5px',
              fontFamily:"'Syne',sans-serif",lineHeight:1.1}}>
              {getGreeting()}, <span style={{
                background:`linear-gradient(135deg,${T.orange},${T.orangeL},#FFD700)`,
                WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
                Santiago
              </span> 🧉
            </h1>
            <div style={{fontSize:13,color:T.muted,marginTop:8}}>
              {new Date().toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).replace(/^\w/,c=>c.toUpperCase())}
            </div>
          </div>

          {/* Live clock */}
          <div style={{textAlign:'right',padding:'16px 20px',borderRadius:16,
            background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',
            backdropFilter:'blur(20px)'}}>
            <div style={{fontSize:32,fontWeight:900,color:T.orange,
              fontFamily:"'Space Mono',monospace",letterSpacing:'-1px',lineHeight:1}}>
              {time.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
            </div>
            <div style={{fontSize:10,color:T.muted,marginTop:4,fontWeight:600,
              textTransform:'uppercase',letterSpacing:'0.1em'}}>STEPS Command Center</div>
          </div>
        </div>

        {/* ── GLOBAL KPIs ── */}
        <div style={{animation:'fadeUp 0.5s 0.1s ease both',opacity:0,animationFillMode:'both'}}>
          <div style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:'uppercase',
            letterSpacing:'0.1em',marginBottom:12}}>
            KPIs globales del negocio
          </div>
          <div style={{display:'flex',gap:10,flexWrap:'nowrap',overflowX:'auto',paddingBottom:4}}>
            <GlobalKpi icon="💰" label="Facturado este mes" value={loading?'..':fmtM(kpis.facturadoMes)} color={T.lime}/>
            <GlobalKpi icon="✅" label="Cobrado" value={loading?'..':fmtM(kpis.cobradoMes)} color={T.cyan} sub={`de ${fmtM(kpis.facturadoMes)}`}/>
            <GlobalKpi icon="⏳" label="Por cobrar" value={loading?'..':fmtM(kpis.pendienteCobro)} color={T.amber}/>
            <GlobalKpi icon="💸" label="Egresos mes" value={loading?'..':fmtM(kpis.egresosMes)} color={T.rose}/>
            <GlobalKpi icon="📈" label="Resultado" value={loading?'..':fmtM(kpis.resultado)} color={kpis.resultado>=0?T.lime:T.rose} sub={`${kpis.rentPct}% rent.`}/>
            <GlobalKpi icon="🗂" label="Pipeline activo" value={loading?'..':fmtM(kpis.pipelineTotal)} color={T.orange}/>
            <GlobalKpi icon="👥" label="Clientes activos" value={loading?'..':kpis.clientesActivos} color={T.violet}/>
            <GlobalKpi icon="🎯" label="Conversión mes" value={loading?'..`':`${kpis.convRate}%`} color={parseFloat(kpis.convRate)>=30?T.lime:T.amber}/>
          </div>
        </div>
      </div>

      {/* ── SECTORS GRID ── */}
      <div style={{flex:1,padding:'0 48px 48px'}}>
        <div style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:'uppercase',
          letterSpacing:'0.1em',marginBottom:16}}>
          Sectores — seleccioná dónde querés trabajar
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:16}}>
          {SECTORS.map((sector,i)=>(
            <div key={sector.id} style={{animation:`fadeUp 0.5s ${0.15+i*0.08}s ease both`,opacity:0,animationFillMode:'both'}}>
              <SectorCard sector={sector} onClick={()=>navigate(sector.path)}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
