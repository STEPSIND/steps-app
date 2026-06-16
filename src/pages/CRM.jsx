import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const T = {
  bg:'linear-gradient(160deg,#050510 0%,#080818 50%,#050510 100%)',
  text:'#F0EFFF', muted:'#8884A8', sub:'#4A4870',
  border:'rgba(255,255,255,0.07)',
  violet:'#8B5CF6', violetL:'#A78BFA',
  lime:'#22C55E', rose:'#F43F5E',
  blue:'#3B82F6', amber:'#F59E0B',
  cyan:'#06B6D4', orange:'#E8860A',
}

const fmtM = n => {
  const v=parseFloat(n)||0
  if(v>=1e6) return `$${(v/1e6).toFixed(2)}M`
  if(v>=1e3) return `$${(v/1e3).toFixed(0)}k`
  return `$${Math.round(v).toLocaleString('es-AR')}`
}

const MODULES = [
  {icon:'👥', label:'Clientes', desc:'Base de clientes y leads', path:'/clientes', color:'#7C3AED'},
  {icon:'🗂', label:'Pipeline', desc:'Kanban de oportunidades', path:'/kanban', color:'#8B5CF6'},
  {icon:'💼', label:'Operaciones', desc:'Expedientes de venta', path:'/ventas', color:'#F59E0B'},
  {icon:'📋', label:'Presupuestos', desc:'Cotizaciones y propuestas', path:'/presupuestos', color:'#3B82F6'},
]

function ModuleCard({ mod, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        padding:'24px', borderRadius:20, cursor:'pointer',
        background:`linear-gradient(135deg,${mod.color}15,${mod.color}08)`,
        border:`1px solid ${hov?mod.color+'55':mod.color+'22'}`,
        borderTop:`1px solid ${hov?mod.color+'88':mod.color+'44'}`,
        boxShadow:hov?`0 16px 48px ${mod.color}20`:'0 4px 20px rgba(0,0,0,0.3)',
        transform:hov?'translateY(-6px) scale(1.02)':'none',
        transition:'all 0.3s cubic-bezier(0.34,1.4,0.64,1)',
        position:'relative', overflow:'hidden',
      }}>
      <div style={{position:'absolute',top:0,left:'10%',right:'10%',height:1,
        background:`linear-gradient(90deg,transparent,${hov?mod.color+'77':'rgba(255,255,255,0.06)'},transparent)`}}/>
      <div style={{fontSize:32,marginBottom:14,
        filter:hov?`drop-shadow(0 0 10px ${mod.color}88)`:'none',
        transform:hov?'scale(1.15) rotate(-5deg)':'none',
        transition:'all 0.3s cubic-bezier(0.34,1.4,0.64,1)',
        display:'inline-block'}}>{mod.icon}</div>
      <div style={{fontSize:16,fontWeight:800,color:T.text,marginBottom:6,
        fontFamily:"'Syne',sans-serif"}}>{mod.label}</div>
      <div style={{fontSize:12,color:T.muted,lineHeight:1.5}}>{mod.desc}</div>
      <div style={{position:'absolute',bottom:16,right:16,fontSize:16,
        color:mod.color,opacity:hov?1:0.4,transition:'all 0.2s',
        transform:hov?'translateX(3px)':'none'}}>→</div>
    </div>
  )
}

export default function SectorCRM() {
  const navigate = useNavigate()
  const [kpis, setKpis] = useState({
    clientesActivos:0, clientesTotal:0, clientesLeads:0,
    pipelineTotal:0, operacionesActivas:0, operacionesCerradas:0,
    pptosTotal:0, pptosAprobados:0, pptosRechazados:0, convRate:0,
    facturadoClientes:0,
  })
  const [loading, setLoading] = useState(true)
  const [proximasAcciones, setProximasAcciones] = useState([])

  useEffect(()=>{
    const load = async () => {
      setLoading(true)
      const mesI = new Date(new Date().getFullYear(),new Date().getMonth(),1).toISOString().split('T')[0]
      const [cls, ops, qMes, qAll, invAnio] = await Promise.all([
        supabase.from('clients').select('status,last_contact,next_action,next_action_date,name'),
        supabase.from('operations').select('status,total_venta,client_name,next_action,next_action_date,name'),
        supabase.from('quotes').select('status,total').gte('date',mesI),
        supabase.from('quotes').select('status'),
        supabase.from('invoices').select('total,client_name').gte('date',`${new Date().getFullYear()}-01-01`),
      ])
      const clsData = cls.data||[]
      const opsData = ops.data||[]
      const qMesData = qMes.data||[]
      const pptosAprobados = qMesData.filter(q=>q.status==='APROBADO').length
      const convRate = qMesData.length>0?(pptosAprobados/qMesData.length*100).toFixed(0):0
      const facturadoClientes = (invAnio.data||[]).reduce((s,i)=>s+(i.total||0),0)
      const acciones = opsData.filter(o=>o.next_action&&o.next_action_date&&o.status!=='CERRADO')
        .sort((a,b)=>new Date(a.next_action_date)-new Date(b.next_action_date)).slice(0,5)
      setProximasAcciones(acciones)
      setKpis({
        clientesActivos:clsData.filter(c=>c.status==='ACTIVO').length,
        clientesTotal:clsData.length,
        clientesLeads:clsData.filter(c=>['LEAD','EN_CONTACTO','PROSPECTO'].includes(c.status)).length,
        pipelineTotal:opsData.filter(o=>o.status!=='CERRADO').reduce((s,o)=>s+(o.total_venta||0),0),
        operacionesActivas:opsData.filter(o=>o.status!=='CERRADO').length,
        operacionesCerradas:opsData.filter(o=>o.status==='CERRADO').length,
        pptosTotal:qMesData.length, pptosAprobados,
        pptosRechazados:qMesData.filter(q=>q.status==='RECHAZADO').length,
        convRate, facturadoClientes,
      })
      setLoading(false)
    }
    load()
  },[])

  const kpiItems = [
    {icon:'👥',l:'Clientes activos',v:kpis.clientesActivos,c:T.violet,sub:`${kpis.clientesLeads} leads`},
    {icon:'🗂',l:'Pipeline',v:fmtM(kpis.pipelineTotal),c:T.orange,sub:`${kpis.operacionesActivas} ops abiertas`},
    {icon:'📋',l:'Pptos mes',v:kpis.pptosTotal,c:T.blue,sub:`${kpis.pptosAprobados} aprobados`},
    {icon:'🎯',l:'Conversión',v:`${kpis.convRate}%`,c:parseFloat(kpis.convRate)>=30?T.lime:T.amber,sub:`${kpis.pptosRechazados} rechazados`},
    {icon:'💼',l:'Ops cerradas',v:kpis.operacionesCerradas,c:T.lime,sub:'total histórico'},
    {icon:'💰',l:'Facturado año',v:fmtM(kpis.facturadoClientes),c:T.cyan,sub:'todos los clientes'},
  ]

  return (
    <div style={{minHeight:'100vh',background:T.bg,fontFamily:"'Nunito Sans',system-ui,sans-serif",color:T.text}}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{padding:'32px 40px 24px',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:-60,left:-60,width:300,height:300,borderRadius:'50%',
          background:'radial-gradient(circle,rgba(139,92,246,0.08),transparent 70%)',pointerEvents:'none'}}/>
        <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:28}}>
          <button onClick={()=>navigate('/')}
            style={{padding:'8px 14px',borderRadius:10,border:'1px solid rgba(255,255,255,0.1)',
              background:'rgba(255,255,255,0.04)',color:T.muted,cursor:'pointer',fontSize:12,
              display:'flex',alignItems:'center',gap:6,transition:'all 0.2s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(139,92,246,0.4)';e.currentTarget.style.color=T.violetL}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.1)';e.currentTarget.style.color=T.muted}}>
            ← Home
          </button>
          <div style={{width:1,height:20,background:'rgba(255,255,255,0.1)'}}/>
          <div style={{fontSize:10,color:T.muted,textTransform:'uppercase',letterSpacing:'0.1em'}}>STEPS Command Center</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:8}}>
          <div style={{width:52,height:52,borderRadius:16,
            background:'linear-gradient(135deg,rgba(139,92,246,0.3),rgba(139,92,246,0.15))',
            border:'1.5px solid rgba(139,92,246,0.5)',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,
            boxShadow:'0 8px 24px rgba(139,92,246,0.2)'}}>🎯</div>
          <div>
            <h1 style={{margin:0,fontSize:28,fontWeight:900,fontFamily:"'Syne',sans-serif",
              background:'linear-gradient(135deg,#8B5CF6,#A78BFA,#06B6D4)',
              WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
              CRM STEPS
            </h1>
            <div style={{fontSize:12,color:T.muted,marginTop:3}}>Gestión comercial · Clientes · Pipeline · Ventas</div>
          </div>
        </div>
      </div>

      <div style={{padding:'0 40px 40px',display:'flex',flexDirection:'column',gap:24}}>
        {/* KPIs */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:10,
          animation:'fadeUp 0.4s ease both'}}>
          {kpiItems.map((k,i)=>(
            <div key={i} style={{padding:'14px 16px',borderRadius:14,
              background:`${k.c}10`,border:`1px solid ${k.c}25`,
              borderTop:`1px solid ${k.c}44`}}>
              <div style={{fontSize:18,marginBottom:6}}>{k.icon}</div>
              <div style={{fontSize:18,fontWeight:900,color:k.c,fontFamily:"'Space Mono',monospace",lineHeight:1}}>
                {loading?'...':k.v}
              </div>
              <div style={{fontSize:10,color:T.muted,marginTop:4,fontWeight:600}}>{k.l}</div>
              {k.sub&&<div style={{fontSize:9,color:T.sub,marginTop:2}}>{k.sub}</div>}
            </div>
          ))}
        </div>

        {/* Modules */}
        <div>
          <div style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:'uppercase',
            letterSpacing:'0.1em',marginBottom:14}}>Módulos CRM</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
            {MODULES.map((mod,i)=>(
              <div key={mod.path} style={{animation:`fadeUp 0.4s ${i*0.07}s ease both`,opacity:0,animationFillMode:'both'}}>
                <ModuleCard mod={mod} onClick={()=>navigate(mod.path)}/>
              </div>
            ))}
          </div>
        </div>

        {/* Próximas acciones */}
        {proximasAcciones.length>0&&(
          <div style={{padding:'20px 22px',borderRadius:16,
            background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',
            borderTop:'1px solid rgba(255,255,255,0.12)'}}>
            <div style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:'uppercase',
              letterSpacing:'0.1em',marginBottom:14}}>📌 Próximas acciones CRM</div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {proximasAcciones.map((op,i)=>{
                const ov = op.next_action_date&&new Date(op.next_action_date)<new Date()
                return (
                  <div key={i} style={{display:'flex',alignItems:'center',gap:12,
                    padding:'10px 14px',borderRadius:10,
                    background:ov?'rgba(244,63,94,0.06)':'rgba(255,255,255,0.03)',
                    border:`1px solid ${ov?'rgba(244,63,94,0.25)':T.border}`}}>
                    <span style={{fontSize:14}}>{ov?'⚠️':'📌'}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:700,color:T.text,
                        overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {op.client_name}{op.name?` — ${op.name}`:''}
                      </div>
                      <div style={{fontSize:11,color:ov?T.rose:T.muted,marginTop:1}}>{op.next_action}</div>
                    </div>
                    <div style={{fontSize:10,fontWeight:700,color:ov?T.rose:T.sub,flexShrink:0}}>
                      {op.next_action_date?new Date(op.next_action_date+'T12:00:00').toLocaleDateString('es-AR',{day:'2-digit',month:'short'}):'—'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
