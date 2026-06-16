import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const T = {
  bg:'linear-gradient(160deg,#050510 0%,#080818 50%,#050510 100%)',
  text:'#F0EFFF', muted:'#8884A8', sub:'#4A4870',
  border:'rgba(255,255,255,0.07)',
  green:'#10B981', greenL:'#34D399',
  lime:'#22C55E', rose:'#F43F5E',
  blue:'#3B82F6', amber:'#F59E0B',
  cyan:'#06B6D4', orange:'#E8860A',
  violet:'#8B5CF6',
}

const MODULES = [
  {icon:'📅', label:'Tareas',    desc:'Gestión de tareas y pendientes', path:'/tareas',   color:'#F43F5E'},
  {icon:'📝', label:'Notas',     desc:'Notas internas y apuntes',       path:'/notas',    color:'#94A3B8'},
  {icon:'🗓', label:'Agenda',    desc:'Calendario y visitas',           path:'/agenda',   color:'#10B981'},
  {icon:'📊', label:'Reportes',  desc:'Reportes y exportaciones',       path:'/reportes', color:'#3B82F6'},
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
        transform:hov?'scale(1.15) rotate(-5deg)':'none',
        transition:'transform 0.3s cubic-bezier(0.34,1.4,0.64,1)',
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

export default function SectorGestion() {
  const navigate = useNavigate()
  const [kpis, setKpis] = useState({tareasPendientes:0,tareasTotal:0,tareasHoy:0})
  const [loading, setLoading] = useState(true)
  const [tareas, setTareas] = useState([])

  useEffect(()=>{
    const load = async () => {
      setLoading(true)
      const hoy = new Date().toISOString().split('T')[0]
      const {data} = await supabase.from('tasks').select('*').order('due_date',{ascending:true}).limit(20)
      const all = data||[]
      const pendientes = all.filter(t=>t.status==='Pendiente'||t.status==='PENDIENTE')
      const hoyTasks = pendientes.filter(t=>t.due_date===hoy)
      setKpis({tareasPendientes:pendientes.length,tareasTotal:all.length,tareasHoy:hoyTasks.length})
      setTareas(pendientes.slice(0,6))
      setLoading(false)
    }
    load()
  },[])

  return (
    <div style={{minHeight:'100vh',background:T.bg,fontFamily:"'Nunito Sans',system-ui,sans-serif",color:T.text}}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{padding:'32px 40px 24px',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:-60,left:-60,width:300,height:300,borderRadius:'50%',
          background:'radial-gradient(circle,rgba(16,185,129,0.08),transparent 70%)',pointerEvents:'none'}}/>
        <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:28}}>
          <button onClick={()=>navigate('/')}
            style={{padding:'8px 14px',borderRadius:10,border:'1px solid rgba(255,255,255,0.1)',
              background:'rgba(255,255,255,0.04)',color:T.muted,cursor:'pointer',fontSize:12,
              display:'flex',alignItems:'center',gap:6,transition:'all 0.2s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(16,185,129,0.4)';e.currentTarget.style.color=T.greenL}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.1)';e.currentTarget.style.color=T.muted}}>
            ← Home
          </button>
          <div style={{width:1,height:20,background:'rgba(255,255,255,0.1)'}}/>
          <div style={{fontSize:10,color:T.muted,textTransform:'uppercase',letterSpacing:'0.1em'}}>STEPS Command Center</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:8}}>
          <div style={{width:52,height:52,borderRadius:16,
            background:'linear-gradient(135deg,rgba(16,185,129,0.3),rgba(16,185,129,0.15))',
            border:'1.5px solid rgba(16,185,129,0.5)',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,
            boxShadow:'0 8px 24px rgba(16,185,129,0.2)'}}>📋</div>
          <div>
            <h1 style={{margin:0,fontSize:28,fontWeight:900,fontFamily:"'Syne',sans-serif",
              background:'linear-gradient(135deg,#10B981,#34D399,#06B6D4)',
              WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
              Gestión STEPS
            </h1>
            <div style={{fontSize:12,color:T.muted,marginTop:3}}>Tareas · Agenda · Notas · Reportes</div>
          </div>
        </div>
      </div>

      <div style={{padding:'0 40px 40px',display:'flex',flexDirection:'column',gap:24}}>
        {/* KPIs */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,
          animation:'fadeUp 0.4s ease both'}}>
          {[
            {icon:'📅',l:'Tareas pendientes',v:kpis.tareasPendientes,c:T.rose},
            {icon:'🔥',l:'Vencen hoy',       v:kpis.tareasHoy,        c:T.amber},
            {icon:'📊',l:'Total tareas',      v:kpis.tareasTotal,      c:T.green},
          ].map((k,i)=>(
            <div key={i} style={{padding:'18px 20px',borderRadius:14,
              background:`${k.c}10`,border:`1px solid ${k.c}25`,borderTop:`1px solid ${k.c}44`}}>
              <div style={{fontSize:22,marginBottom:8}}>{k.icon}</div>
              <div style={{fontSize:24,fontWeight:900,color:k.c,fontFamily:"'Space Mono',monospace",lineHeight:1}}>
                {loading?'...':k.v}
              </div>
              <div style={{fontSize:11,color:T.muted,marginTop:5,fontWeight:600}}>{k.l}</div>
            </div>
          ))}
        </div>

        {/* Modules */}
        <div>
          <div style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:'uppercase',
            letterSpacing:'0.1em',marginBottom:14}}>Módulos de Gestión</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
            {MODULES.map((mod,i)=>(
              <div key={mod.path} style={{animation:`fadeUp 0.4s ${i*0.07}s ease both`,opacity:0,animationFillMode:'both'}}>
                <ModuleCard mod={mod} onClick={()=>navigate(mod.path)}/>
              </div>
            ))}
          </div>
        </div>

        {/* Tareas pendientes */}
        {tareas.length>0&&(
          <div style={{padding:'18px 20px',borderRadius:16,
            background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',
            borderTop:'1px solid rgba(255,255,255,0.12)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <div style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:'uppercase',letterSpacing:'0.1em'}}>
                📌 Tareas pendientes
              </div>
              <button onClick={()=>navigate('/tareas')}
                style={{fontSize:11,color:T.green,background:'none',border:'none',cursor:'pointer',fontWeight:700}}>
                Ver todas →
              </button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {tareas.map((t,i)=>{
                const ov = t.due_date&&new Date(t.due_date)<new Date()
                return (
                  <div key={i} style={{display:'flex',alignItems:'center',gap:10,
                    padding:'8px 12px',borderRadius:8,
                    background:ov?'rgba(244,63,94,0.06)':'rgba(255,255,255,0.03)',
                    border:`1px solid ${ov?'rgba(244,63,94,0.2)':T.border}`}}>
                    <span style={{fontSize:12}}>{ov?'⚠️':'📌'}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:11,fontWeight:700,color:T.text,
                        overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title||t.name}</div>
                    </div>
                    {t.due_date&&(
                      <div style={{fontSize:10,color:ov?T.rose:T.sub,flexShrink:0,fontWeight:700}}>
                        {new Date(t.due_date+'T12:00:00').toLocaleDateString('es-AR',{day:'2-digit',month:'short'})}
                      </div>
                    )}
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
