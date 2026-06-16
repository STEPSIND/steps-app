import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const T = {
  bg:'linear-gradient(160deg,#050510 0%,#080818 50%,#050510 100%)',
  text:'#F0EFFF', muted:'#8884A8', sub:'#4A4870',
  border:'rgba(255,255,255,0.07)',
  blue:'#3B82F6', blueL:'#60A5FA',
  lime:'#22C55E', rose:'#F43F5E',
  violet:'#8B5CF6', amber:'#F59E0B',
  cyan:'#06B6D4', orange:'#E8860A',
  green:'#10B981',
}

const fmtM = n => {
  const v=parseFloat(n)||0
  if(v>=1e6) return `$${(v/1e6).toFixed(2)}M`
  if(v>=1e3) return `$${(v/1e3).toFixed(0)}k`
  return `$${Math.round(v).toLocaleString('es-AR')}`
}

const MODULES = [
  {icon:'🧾', label:'Facturación',  desc:'Facturas emitidas y cobros',      path:'/facturacion',     color:'#E8860A'},
  {icon:'💸', label:'Compras',      desc:'Gastos y facturas de proveedores', path:'/compras',         color:'#C0392B'},
  {icon:'⚖️', label:'Balance',      desc:'Resultados y rentabilidad',        path:'/balance',         color:'#22C55E'},
  {icon:'📦', label:'Stock',        desc:'Inventario y movimientos',         path:'/stock',           color:'#84CC16'},
  {icon:'🏭', label:'Proveedores',  desc:'Gestión de proveedores',           path:'/proveedores',     color:'#06B6D4'},
  {icon:'🗂', label:'Catálogo',     desc:'Productos del catálogo',           path:'/catalogo',        color:'#14B8A6'},
  {icon:'✨', label:'Productos',    desc:'Carga y gestión de productos',     path:'/carga-productos', color:'#F5A623'},
  {icon:'📋', label:'Remitos',      desc:'Remitos de entrega',               path:'/remitos',         color:'#8B5CF6'},
]

function ModuleCard({ mod, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        padding:'20px', borderRadius:16, cursor:'pointer',
        background:`linear-gradient(135deg,${mod.color}15,${mod.color}08)`,
        border:`1px solid ${hov?mod.color+'55':mod.color+'22'}`,
        borderTop:`1px solid ${hov?mod.color+'88':mod.color+'44'}`,
        boxShadow:hov?`0 12px 36px ${mod.color}18`:'0 4px 16px rgba(0,0,0,0.3)',
        transform:hov?'translateY(-5px) scale(1.02)':'none',
        transition:'all 0.3s cubic-bezier(0.34,1.4,0.64,1)',
        position:'relative', overflow:'hidden',
      }}>
      <div style={{position:'absolute',top:0,left:'10%',right:'10%',height:1,
        background:`linear-gradient(90deg,transparent,${hov?mod.color+'66':'rgba(255,255,255,0.06)'},transparent)`}}/>
      <div style={{fontSize:28,marginBottom:10,
        transform:hov?'scale(1.1) rotate(-4deg)':'none',
        transition:'transform 0.3s cubic-bezier(0.34,1.4,0.64,1)',
        display:'inline-block'}}>{mod.icon}</div>
      <div style={{fontSize:14,fontWeight:800,color:T.text,marginBottom:4,
        fontFamily:"'Syne',sans-serif"}}>{mod.label}</div>
      <div style={{fontSize:11,color:T.muted,lineHeight:1.4}}>{mod.desc}</div>
      <div style={{position:'absolute',bottom:14,right:14,fontSize:14,
        color:mod.color,opacity:hov?1:0.3,transition:'all 0.2s',
        transform:hov?'translateX(3px)':'none'}}>→</div>
    </div>
  )
}

export default function SectorERP() {
  const navigate = useNavigate()
  const [kpis, setKpis] = useState({
    facturadoMes:0, cobradoMes:0, pendienteCobro:0,
    egresosMes:0, resultado:0, rentPct:0,
    facturadoAnio:0, proveedores:0, productos:0,
  })
  const [loading, setLoading] = useState(true)
  const [ultimasFacturas, setUltimasFacturas] = useState([])

  useEffect(()=>{
    const load = async () => {
      setLoading(true)
      const now = new Date()
      const mesI = new Date(now.getFullYear(),now.getMonth(),1).toISOString().split('T')[0]
      const anioI = `${now.getFullYear()}-01-01`
      const [invMes, invAnio, compMes, prov, prods, invRec] = await Promise.all([
        supabase.from('invoices').select('total,status').gte('date',mesI),
        supabase.from('invoices').select('total').gte('date',anioI),
        supabase.from('purchases').select('total').gte('date',mesI),
        supabase.from('suppliers').select('id',{count:'exact',head:true}),
        supabase.from('products').select('id',{count:'exact',head:true}),
        supabase.from('invoices').select('number,tipo,client_name,total,status,date').order('date',{ascending:false}).limit(5),
      ])
      const invData = invMes.data||[]
      const facturadoMes = invData.reduce((s,i)=>s+(i.total||0),0)
      const cobradoMes = invData.filter(i=>['COBRADA','Cobrada'].includes(i.status)).reduce((s,i)=>s+(i.total||0),0)
      const pendienteCobro = invData.filter(i=>['PENDIENTE','Pendiente','EMITIDA','Emitida'].includes(i.status)).reduce((s,i)=>s+(i.total||0),0)
      const egresosMes = (compMes.data||[]).reduce((s,p)=>s+(p.total||0),0)
      const resultado = facturadoMes - egresosMes
      const rentPct = facturadoMes>0?(resultado/facturadoMes*100).toFixed(1):0
      const facturadoAnio = (invAnio.data||[]).reduce((s,i)=>s+(i.total||0),0)
      setKpis({facturadoMes,cobradoMes,pendienteCobro,egresosMes,resultado,rentPct,facturadoAnio,proveedores:prov.count||0,productos:prods.count||0})
      setUltimasFacturas(invRec.data||[])
      setLoading(false)
    }
    load()
  },[])

  const kpiItems = [
    {icon:'💰',l:'Facturado mes',  v:fmtM(kpis.facturadoMes),  c:T.lime},
    {icon:'✅',l:'Cobrado',        v:fmtM(kpis.cobradoMes),    c:T.cyan},
    {icon:'⏳',l:'Por cobrar',     v:fmtM(kpis.pendienteCobro),c:T.amber},
    {icon:'💸',l:'Egresos mes',    v:fmtM(kpis.egresosMes),    c:T.rose},
    {icon:'📈',l:'Resultado',      v:fmtM(kpis.resultado),      c:kpis.resultado>=0?T.lime:T.rose},
    {icon:'🎯',l:'Rentabilidad',   v:`${kpis.rentPct}%`,        c:parseFloat(kpis.rentPct)>=15?T.lime:T.amber},
    {icon:'📅',l:'Facturado año',  v:fmtM(kpis.facturadoAnio), c:T.blue},
    {icon:'🏭',l:'Proveedores',    v:kpis.proveedores,           c:T.cyan},
  ]

  const invSt = {EMITIDA:{l:'Emitida',c:T.blue},COBRADA:{l:'Cobrada',c:T.lime},PENDIENTE:{l:'Pendiente',c:T.amber},Cobrada:{l:'Cobrada',c:T.lime},Pendiente:{l:'Pendiente',c:T.amber},Emitida:{l:'Emitida',c:T.blue}}

  return (
    <div style={{minHeight:'100vh',background:T.bg,fontFamily:"'Nunito Sans',system-ui,sans-serif",color:T.text}}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{padding:'32px 40px 24px',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:-60,right:-60,width:300,height:300,borderRadius:'50%',
          background:'radial-gradient(circle,rgba(59,130,246,0.08),transparent 70%)',pointerEvents:'none'}}/>
        <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:28}}>
          <button onClick={()=>navigate('/')}
            style={{padding:'8px 14px',borderRadius:10,border:'1px solid rgba(255,255,255,0.1)',
              background:'rgba(255,255,255,0.04)',color:T.muted,cursor:'pointer',fontSize:12,
              display:'flex',alignItems:'center',gap:6,transition:'all 0.2s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(59,130,246,0.4)';e.currentTarget.style.color=T.blueL}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.1)';e.currentTarget.style.color=T.muted}}>
            ← Home
          </button>
          <div style={{width:1,height:20,background:'rgba(255,255,255,0.1)'}}/>
          <div style={{fontSize:10,color:T.muted,textTransform:'uppercase',letterSpacing:'0.1em'}}>STEPS Command Center</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:8}}>
          <div style={{width:52,height:52,borderRadius:16,
            background:'linear-gradient(135deg,rgba(59,130,246,0.3),rgba(59,130,246,0.15))',
            border:'1.5px solid rgba(59,130,246,0.5)',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,
            boxShadow:'0 8px 24px rgba(59,130,246,0.2)'}}>🏗️</div>
          <div>
            <h1 style={{margin:0,fontSize:28,fontWeight:900,fontFamily:"'Syne',sans-serif",
              background:'linear-gradient(135deg,#3B82F6,#60A5FA,#06B6D4)',
              WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
              ERP STEPS
            </h1>
            <div style={{fontSize:12,color:T.muted,marginTop:3}}>Finanzas · Inventario · Proveedores · Facturación</div>
          </div>
        </div>
      </div>

      <div style={{padding:'0 40px 40px',display:'flex',flexDirection:'column',gap:24}}>
        {/* KPIs */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(8,1fr)',gap:8,animation:'fadeUp 0.4s ease both'}}>
          {kpiItems.map((k,i)=>(
            <div key={i} style={{padding:'12px 14px',borderRadius:12,
              background:`${k.c}10`,border:`1px solid ${k.c}25`,borderTop:`1px solid ${k.c}44`}}>
              <div style={{fontSize:16,marginBottom:5}}>{k.icon}</div>
              <div style={{fontSize:15,fontWeight:900,color:k.c,fontFamily:"'Space Mono',monospace",lineHeight:1}}>
                {loading?'...':k.v}
              </div>
              <div style={{fontSize:9,color:T.muted,marginTop:3,fontWeight:600}}>{k.l}</div>
            </div>
          ))}
        </div>

        {/* Modules */}
        <div>
          <div style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:'uppercase',
            letterSpacing:'0.1em',marginBottom:14}}>Módulos ERP</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
            {MODULES.map((mod,i)=>(
              <div key={mod.path} style={{animation:`fadeUp 0.4s ${i*0.06}s ease both`,opacity:0,animationFillMode:'both'}}>
                <ModuleCard mod={mod} onClick={()=>navigate(mod.path)}/>
              </div>
            ))}
          </div>
        </div>

        {/* Últimas facturas */}
        <div style={{padding:'18px 20px',borderRadius:16,
          background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',
          borderTop:'1px solid rgba(255,255,255,0.12)'}}>
          <div style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:'uppercase',
            letterSpacing:'0.1em',marginBottom:14}}>🧾 Últimas facturas</div>
          {ultimasFacturas.length===0?(
            <div style={{textAlign:'center',padding:'20px 0',color:T.muted,fontSize:12}}>Sin facturas registradas</div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {ultimasFacturas.map((inv,i)=>{
                const sm=invSt[inv.status]||{l:inv.status,c:T.muted}
                return (
                  <div key={i} style={{display:'flex',alignItems:'center',gap:10,
                    padding:'8px 12px',borderRadius:8,
                    background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.05)'}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:11,fontWeight:700,color:T.text,
                        overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{inv.client_name}</div>
                      <div style={{fontSize:9,color:T.muted}}>
                        F{inv.tipo||'A'} {String(inv.number||0).padStart(6,'0')} · {inv.date?new Date(inv.date+'T12:00:00').toLocaleDateString('es-AR',{day:'2-digit',month:'short'}):'—'}
                      </div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontSize:12,fontWeight:900,color:T.lime,fontFamily:"'Space Mono',monospace"}}>{fmtM(inv.total)}</div>
                      <span style={{fontSize:8,padding:'1px 6px',borderRadius:8,fontWeight:700,background:`${sm.c}18`,color:sm.c}}>{sm.l}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
