import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'

// ── THEME ─────────────────────────────────────────────────────────────────────
const T = {
  orange: '#E8860A', orangeL: '#F5A623',
  lime:   '#22C55E', rose:    '#F43F5E',
  blue:   '#3B82F6', violet:  '#8B5CF6',
  amber:  '#F59E0B', cyan:    '#06B6D4',
  text:   '#F0EFFF', muted:   '#8884A8', sub: '#4A4870',
  border: 'rgba(255,255,255,0.07)',
}

const fmtM = n => {
  const v = parseFloat(n)||0
  if(v>=1e6) return `$${(v/1e6).toFixed(2)}M`
  if(v>=1e3) return `$${(v/1e3).toFixed(0)}k`
  return `$${Math.round(v).toLocaleString('es-AR')}`
}
const fmtDate = d => {
  if(!d) return '—'
  return new Date(d+'T12:00:00').toLocaleDateString('es-AR',{day:'2-digit',month:'short'})
}
const getGreeting = () => {
  const h = new Date().getHours()
  if(h>=6&&h<12) return 'Buenos días'
  if(h>=12&&h<20) return 'Buenas tardes'
  if(h>=20) return 'Buenas noches'
  return 'Buena madrugada'
}
const getDayLabel = () => new Date().toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'})

// ── QUOTES ────────────────────────────────────────────────────────────────────
const QUOTES = [
  {text:"Conoce a tu enemigo y conócete a ti mismo; en cien batallas, nunca saldrás derrotado.",author:"Sun Tzu",era:"China, 544–496 a.C."},
  {text:"La fortuna favorece a los audaces.",author:"Virgilio",era:"Imperio Romano, 70–19 a.C."},
  {text:"No es que tengamos poco tiempo, sino que perdemos mucho.",author:"Séneca",era:"Imperio Romano, 4 a.C.–65 d.C."},
  {text:"El éxito es la suma de pequeños esfuerzos repetidos día tras día.",author:"Robert Collier",era:"Estados Unidos, 1885–1950"},
  {text:"La creatividad es la inteligencia divirtiéndose.",author:"Albert Einstein",era:"Alemania, 1879–1955"},
  {text:"Veni, vidi, vici.",author:"Julio César",era:"Imperio Romano, 100–44 a.C."},
  {text:"El genio es uno por ciento de inspiración y noventa y nueve por ciento de transpiración.",author:"Thomas Edison",era:"Estados Unidos, 1847–1931"},
  {text:"La única forma de hacer un gran trabajo es amar lo que haces.",author:"Steve Jobs",era:"Estados Unidos, 1955–2011"},
  {text:"Cuando el viento sopla, algunos construyen muros y otros molinos.",author:"Proverbio chino",era:"China, origen ancestral"},
  {text:"El laberinto es obra del hombre para que pueda perderse; sólo un animal puede encontrar el centro.",author:"Jorge Luis Borges",era:"Buenos Aires, 1899–1986"},
  {text:"Divide et impera.",author:"Julio César",era:"Imperio Romano, 100–44 a.C."},
  {text:"No hay nada permanente excepto el cambio.",author:"Heráclito",era:"Grecia, 535–475 a.C."},
  {text:"El precio de la grandeza es la responsabilidad.",author:"Winston Churchill",era:"Inglaterra, 1874–1965"},
  {text:"Un río llega lejos porque sabe rodear obstáculos.",author:"Lao Tse",era:"China, siglo VI a.C."},
  {text:"Lo que sabemos es una gota de agua; lo que ignoramos es el océano.",author:"Isaac Newton",era:"Inglaterra, 1643–1727"},
  {text:"Nunca desperdicies una buena crisis.",author:"Winston Churchill",era:"Inglaterra, 1874–1965"},
  {text:"La imaginación es más importante que el conocimiento.",author:"Albert Einstein",era:"Alemania, 1879–1955"},
  {text:"No cuentes los días, haz que los días cuenten.",author:"Muhammad Ali",era:"Estados Unidos, 1942–2016"},
  {text:"Mientras vivimos, aprendamos a vivir.",author:"Séneca",era:"Imperio Romano, 4 a.C.–65 d.C."},
  {text:"El que no arriesga, no cruza el mar.",author:"Cristóbal Colón",era:"Génova, 1451–1506"},
]
const getDailyQuote = () => {
  const now = new Date()
  const seed = now.getFullYear()*10000+(now.getMonth()+1)*100+now.getDate()
  return QUOTES[seed % QUOTES.length]
}

// ── ANIMATED NUMBER ───────────────────────────────────────────────────────────
function AnimNum({ value, fmt }) {
  const [display, setDisplay] = useState(0)
  const prev = useRef(0), raf = useRef(null)
  useEffect(()=>{
    const target = parseFloat(value)||0
    if(target===prev.current) return
    const from=prev.current; prev.current=target
    const start=performance.now(), dur=900
    const tick=now=>{
      const p=Math.min((now-start)/dur,1)
      const e=1-Math.pow(1-p,3)
      setDisplay(from+(target-from)*e)
      if(p<1) raf.current=requestAnimationFrame(tick)
    }
    raf.current=requestAnimationFrame(tick)
    return()=>cancelAnimationFrame(raf.current)
  },[value])
  return <>{fmt?fmt(display):Math.round(display).toLocaleString('es-AR')}</>
}

// ── SPARKLINE ─────────────────────────────────────────────────────────────────
function Spark({ data, color, w=80, h=28 }) {
  if(!data||data.length<2) return null
  const max=Math.max(...data,1),min=Math.min(...data,0),range=max-min||1
  const pts=data.map((v,i)=>`${(i/(data.length-1))*w},${h-((v-min)/range)*(h-4)-2}`).join(' ')
  const area=`0,${h} ${pts} ${w},${h}`
  const gid=`sg_${color.replace('#','')}`
  return (
    <svg width={w} height={h} style={{overflow:'visible'}}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gid})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ── GLASS CARD BASE ───────────────────────────────────────────────────────────
const glass = (extra={}) => ({
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(24px) saturate(160%)',
  WebkitBackdropFilter: 'blur(24px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderTop: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 16,
  boxShadow: '0 4px 24px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.07)',
  ...extra,
})

// ── PENSAMIENTO DEL DÍA ───────────────────────────────────────────────────────
function PensamientoCard({ quote }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button onClick={()=>setOpen(o=>!o)} style={{
        width:'100%',cursor:'pointer',outline:'none',display:'flex',
        alignItems:'center',justifyContent:'space-between',
        padding:'10px 18px',
        borderRadius:open?'12px 12px 0 0':12,
        background:open?'rgba(4,4,20,0.9)':'rgba(255,255,255,0.06)',
        backdropFilter:'blur(40px)',WebkitBackdropFilter:'blur(40px)',
        border:'1px solid rgba(255,255,255,0.1)',
        borderBottom:open?'1px solid rgba(0,0,0,0.5)':'1px solid rgba(0,0,0,0.1)',
        boxShadow:open?'inset 0 4px 24px rgba(0,0,0,0.8)':'0 2px 16px rgba(0,0,0,0.2)',
        transition:'all 0.35s cubic-bezier(0.34,1.1,0.64,1)',
      }}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:11,opacity:0.4,color:T.cyan}}>❝</span>
          <span style={{fontSize:10,fontWeight:700,color:T.cyan,textTransform:'uppercase',letterSpacing:'0.12em'}}>
            Pensamiento del día
          </span>
          {!open&&<span style={{fontSize:10,color:'rgba(148,163,184,0.35)',fontStyle:'italic'}}>— {quote.author}</span>}
        </div>
        <span style={{fontSize:8,color:'rgba(148,163,184,0.3)',transform:open?'rotate(180deg)':'none',transition:'transform 0.3s',display:'inline-block'}}>▼</span>
      </button>
      {open&&(
        <div style={{
          borderRadius:'0 0 12px 12px',
          background:'rgba(2,2,14,0.9)',
          backdropFilter:'blur(60px)',WebkitBackdropFilter:'blur(60px)',
          border:'1px solid rgba(255,255,255,0.06)',borderTop:'none',
          boxShadow:'inset 0 8px 60px rgba(0,0,0,0.9),0 16px 48px rgba(0,0,0,0.6)',
          padding:'22px 24px 20px',position:'relative',overflow:'hidden',
          animation:'holeOpen 0.35s ease both',
        }}>
          <div style={{position:'absolute',top:0,left:'10%',width:'80%',height:1,
            background:'linear-gradient(90deg,transparent,rgba(6,182,212,0.4),transparent)',
            animation:'glowPulse 3s ease infinite',pointerEvents:'none'}}/>
          <blockquote style={{margin:0,fontSize:16,lineHeight:1.85,color:'rgba(241,245,249,0.92)',
            fontStyle:'italic',fontWeight:300,letterSpacing:'0.015em'}}>
            {quote.text}
          </blockquote>
          <div style={{marginTop:16,display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:20,height:1,background:'linear-gradient(90deg,rgba(6,182,212,0.8),transparent)',flexShrink:0}}/>
            <div>
              <div style={{fontSize:11,fontWeight:600,color:'rgba(6,182,212,0.85)'}}>{quote.author}</div>
              <div style={{fontSize:9,color:'rgba(148,163,184,0.3)',fontStyle:'italic',marginTop:2}}>{quote.era}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── KPI CARD — expandible ─────────────────────────────────────────────────────
function KpiCard({ icon, label, value, color, sub, trend, spark, fmt, detail }) {
  const [hov,setHov]=useState(false), [exp,setExp]=useState(false)
  const ref=useRef()
  const onMove=e=>{
    const r=ref.current?.getBoundingClientRect(); if(!r) return
    ref.current.style.setProperty('--sx',`${((e.clientX-r.left)/r.width)*100}%`)
    ref.current.style.setProperty('--sy',`${((e.clientY-r.top)/r.height)*100}%`)
  }
  return (
    <div ref={ref} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onMouseMove={onMove}
      style={{
        ...glass({padding:0,overflow:'hidden'}),
        border:`1px solid ${hov?color+'44':T.border}`,
        borderTop:`1px solid ${hov?color+'88':'rgba(255,255,255,0.14)'}`,
        boxShadow:hov?`0 16px 48px ${color}18,inset 0 1px 0 rgba(255,255,255,0.1)`:'0 4px 20px rgba(0,0,0,0.4)',
        transform:hov?'translateY(-4px) scale(1.02)':'none',
        transition:'all 0.3s cubic-bezier(0.34,1.4,0.64,1)',
        cursor: detail?'pointer':'default',
      }}
      onClick={()=>detail&&setExp(x=>!x)}>
      {/* Spotlight */}
      <div style={{position:'absolute',inset:0,pointerEvents:'none',borderRadius:16,
        background:`radial-gradient(circle 90px at var(--sx,50%) var(--sy,50%),${color}15,transparent 70%)`}}/>
      {/* Top shimmer */}
      <div style={{height:1,background:`linear-gradient(90deg,transparent,${hov?color+'66':'rgba(255,255,255,0.07)'},transparent)`}}/>
      {/* Spark bg */}
      {spark&&(
        <div style={{position:'absolute',bottom:10,right:12,opacity:hov?0.6:0.2,transition:'opacity 0.3s',pointerEvents:'none'}}>
          <Spark data={spark} color={color}/>
        </div>
      )}
      <div style={{padding:'16px 18px',position:'relative'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
          <span style={{fontSize:20,opacity:hov?1:0.55,transition:'opacity 0.2s',
            filter:hov?`drop-shadow(0 0 6px ${color}99)`:'none'}}>{icon}</span>
          {trend!==undefined&&(
            <span style={{fontSize:10,fontWeight:800,padding:'3px 8px',borderRadius:20,
              background:trend>=0?'rgba(34,197,94,0.12)':'rgba(244,63,94,0.12)',
              color:trend>=0?T.lime:T.rose}}>
              {trend>=0?'↑':'↓'}{Math.abs(trend).toFixed(0)}%
            </span>
          )}
          {detail&&<span style={{fontSize:9,color:T.muted,opacity:hov?1:0.4,transition:'opacity 0.2s'}}>{exp?'▲':'▼'}</span>}
        </div>
        <div style={{fontSize:26,fontWeight:900,color,fontFamily:"'Space Mono',monospace",
          letterSpacing:'-1px',lineHeight:1,
          textShadow:hov?`0 0 20px ${color}55`:'none',transition:'text-shadow 0.3s'}}>
          <AnimNum value={typeof value==='number'?value:parseFloat(value)||0} fmt={fmt}/>
        </div>
        <div style={{fontSize:11,color:T.muted,marginTop:5,fontWeight:600}}>{label}</div>
        {sub&&<div style={{fontSize:10,color:T.sub,marginTop:2}}>{sub}</div>}
      </div>
      {/* Expanded detail */}
      {exp&&detail&&(
        <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',padding:'12px 18px',
          display:'flex',flexDirection:'column',gap:6,
          animation:'expandDown 0.25s ease both'}}>
          {detail.map((d,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',
              padding:'6px 10px',borderRadius:8,
              background:d.hi?`${color}10`:'rgba(255,255,255,0.03)',
              border:`1px solid ${d.hi?color+'22':T.border}`}}>
              <span style={{fontSize:10,color:T.muted}}>{d.l}</span>
              <span style={{fontSize:12,fontWeight:800,color:d.c||color,fontFamily:"'Space Mono',monospace"}}>{d.v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── ORGAN CARD — expandible, spinning border ──────────────────────────────────
function OrganCard({ icon, label, color, status, items, extraItems }) {
  const [exp, setExp] = useState(false)
  const statusColor = status==='ok'?T.lime:status==='warn'?T.amber:T.rose
  return (
    <div className="organ-card" onClick={()=>setExp(x=>!x)} style={{cursor:'pointer'}}>
      <div className="organ-inner">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:17}}>{icon}</span>
            <span style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:'0.07em'}}>{label}</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{position:'relative',width:8,height:8}}>
              {status==='ok'&&<div style={{position:'absolute',inset:0,borderRadius:'50%',background:statusColor,opacity:0.4,animation:'pingDot 1.5s ease-out infinite'}}/>}
              <div style={{width:8,height:8,borderRadius:'50%',background:statusColor,boxShadow:`0 0 6px ${statusColor}`}}/>
            </div>
            <span style={{fontSize:8,color:T.muted,opacity:0.5}}>{exp?'▲':'▼'}</span>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
          {items.map((item,i)=>(
            <div key={i} style={{padding:'8px 10px',borderRadius:8,
              background:item.hi?`${item.c||color}10`:'rgba(255,255,255,0.03)',
              border:`1px solid ${item.hi?`${item.c||color}22`:T.border}`}}>
              <div style={{fontSize:8,color:T.muted,marginBottom:2,fontWeight:600}}>{item.l}</div>
              <div style={{fontSize:14,fontWeight:900,color:item.c||color,fontFamily:"'Space Mono',monospace"}}>{item.v}</div>
            </div>
          ))}
        </div>
        {exp&&extraItems&&(
          <div style={{marginTop:10,display:'flex',flexDirection:'column',gap:5,
            animation:'expandDown 0.25s ease both',borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:10}}>
            {extraItems.map((item,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 10px',
                borderRadius:8,background:'rgba(255,255,255,0.03)',border:`1px solid ${T.border}`}}>
                <span style={{fontSize:10,color:T.muted}}>{item.l}</span>
                <span style={{fontSize:11,fontWeight:800,color:item.c||T.text,fontFamily:"'Space Mono',monospace"}}>{item.v}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [d, setD] = useState({
    facturadoMes:0, facturadoMesPrev:0, facturadoAnio:0,
    cobradoMes:0, pendienteCobro:0, egresosMes:0, resultado:0, rentPct:0,
    clientesTotal:0, clientesActivos:0, clientesLeads:0,
    proveedores:0, productos:0,
    pptosTotal:0, pptosAprobados:0, pptosRechazados:0, convRate:0,
    pptosAprobadosTotal:0, pptosRechazadosTotal:0,
    operacionesActivas:0, operacionesCerradas:0, pipelineTotal:0,
    ultimasFacturas:[], ultimosPptos:[], proximasAcciones:[],
    chartMeses:[],
  })
  const [loading, setLoading] = useState(true)
  const [quote] = useState(getDailyQuote)

  useEffect(()=>{ load() },[])

  const load = async () => {
    setLoading(true)
    const now = new Date()
    const mesI  = new Date(now.getFullYear(),now.getMonth(),1).toISOString().split('T')[0]
    const mesPI = new Date(now.getFullYear(),now.getMonth()-1,1).toISOString().split('T')[0]
    const mesPF = new Date(now.getFullYear(),now.getMonth(),0).toISOString().split('T')[0]
    const anioI = `${now.getFullYear()}-01-01`

    const [iMes,iMesP,iAnio,compMes,cls,prov,prods,qMes,qAll,ops,invRec,qRec] = await Promise.all([
      supabase.from('invoices').select('total,status,number,tipo,client_name,date').gte('date',mesI),
      supabase.from('invoices').select('total').gte('date',mesPI).lte('date',mesPF),
      supabase.from('invoices').select('total').gte('date',anioI),
      supabase.from('purchases').select('total').gte('date',mesI),
      supabase.from('clients').select('status,last_contact'),
      supabase.from('suppliers').select('id',{count:'exact',head:true}),
      supabase.from('products').select('id',{count:'exact',head:true}),
      supabase.from('quotes').select('status,total,number,client_name,date,expires_at').gte('date',mesI),
      supabase.from('quotes').select('status,total'),
      supabase.from('operations').select('status,total_venta,client_name,next_action,next_action_date,name').order('date',{ascending:false}),
      supabase.from('invoices').select('number,tipo,client_name,total,status,date').order('date',{ascending:false}).limit(5),
      supabase.from('quotes').select('number,client_name,total,status,date,expires_at').order('date',{ascending:false}).limit(5),
    ])

    const invMes = iMes.data||[]
    const facturadoMes   = invMes.reduce((s,i)=>s+(i.total||0),0)
    const cobradoMes     = invMes.filter(i=>['COBRADA','Cobrada'].includes(i.status)).reduce((s,i)=>s+(i.total||0),0)
    const pendienteCobro = invMes.filter(i=>['PENDIENTE','Pendiente','EMITIDA','Emitida'].includes(i.status)).reduce((s,i)=>s+(i.total||0),0)
    const facturadoMesPrev = (iMesP.data||[]).reduce((s,i)=>s+(i.total||0),0)
    const facturadoAnio    = (iAnio.data||[]).reduce((s,i)=>s+(i.total||0),0)
    const egresosMes       = (compMes.data||[]).reduce((s,p)=>s+(p.total||0),0)
    const resultado = facturadoMes - egresosMes
    const rentPct   = facturadoMes>0?(resultado/facturadoMes*100).toFixed(1):0

    const trend = facturadoMesPrev>0 ? ((facturadoMes-facturadoMesPrev)/facturadoMesPrev*100) : undefined

    const clsData = cls.data||[]
    const clientesActivos = clsData.filter(c=>c.status==='ACTIVO').length
    const clientesLeads   = clsData.filter(c=>['LEAD','EN_CONTACTO','PROSPECTO'].includes(c.status)).length

    const qMesData = qMes.data||[]
    const qAllData = qAll.data||[]
    const pptosAprobados = qMesData.filter(q=>q.status==='APROBADO').length
    const pptosRechazados = qMesData.filter(q=>q.status==='RECHAZADO').length
    const convRate = qMesData.length>0?(pptosAprobados/qMesData.length*100).toFixed(0):0
    const pptosAprobadosTotal = qAllData.filter(q=>q.status==='APROBADO').length
    const pptosRechazadosTotal = qAllData.filter(q=>q.status==='RECHAZADO').length

    const opsData = ops.data||[]
    const operacionesActivas  = opsData.filter(o=>o.status!=='CERRADO').length
    const operacionesCerradas = opsData.filter(o=>o.status==='CERRADO').length
    const pipelineTotal = opsData.filter(o=>o.status!=='CERRADO').reduce((s,o)=>s+(o.total_venta||0),0)

    const proximasAcciones = opsData
      .filter(o=>o.next_action&&o.next_action_date)
      .sort((a,b)=>new Date(a.next_action_date)-new Date(b.next_action_date))
      .slice(0,4)

    // Chart — últimos 6 meses
    const chartMeses = await Promise.all(
      Array.from({length:6},(_,i)=>{
        const dd=new Date(now.getFullYear(),now.getMonth()-5+i,1)
        const desde=dd.toISOString().split('T')[0]
        const hasta=new Date(dd.getFullYear(),dd.getMonth()+1,0).toISOString().split('T')[0]
        return Promise.all([
          supabase.from('invoices').select('total').gte('date',desde).lte('date',hasta),
          supabase.from('purchases').select('total').gte('date',desde).lte('date',hasta),
        ]).then(([inv,pur])=>({
          mes:dd.toLocaleDateString('es-AR',{month:'short'}),
          ingresos:(inv.data||[]).reduce((s,i)=>s+(i.total||0),0),
          egresos:(pur.data||[]).reduce((s,p)=>s+(p.total||0),0),
        }))
      })
    )

    setD({
      facturadoMes,facturadoMesPrev,facturadoAnio,
      cobradoMes,pendienteCobro,egresosMes,resultado,rentPct,
      trend,
      clientesTotal:clsData.length,clientesActivos,clientesLeads,
      proveedores:prov.count||0, productos:prods.count||0,
      pptosTotal:qMesData.length,pptosAprobados,pptosRechazados,convRate,
      pptosAprobadosTotal,pptosRechazadosTotal,
      operacionesActivas,operacionesCerradas,pipelineTotal,
      ultimasFacturas:invRec.data||[],
      ultimosPptos:qRec.data||[],
      proximasAcciones,
      chartMeses,
    })
    setLoading(false)
  }

  const chartMax = Math.max(...(d.chartMeses||[]).map(m=>Math.max(m.ingresos,m.egresos)),1)
  const invSt = {EMITIDA:{l:'Emitida',c:T.blue},COBRADA:{l:'Cobrada',c:T.lime},PENDIENTE:{l:'Pendiente',c:T.amber},VENCIDA:{l:'Vencida',c:T.rose},Cobrada:{l:'Cobrada',c:T.lime},Pendiente:{l:'Pendiente',c:T.amber},Emitida:{l:'Emitida',c:T.blue}}
  const qSt   = {BORRADOR:{l:'Borrador',c:T.muted},ENVIADO:{l:'Enviado',c:T.blue},EN_REVISION:{l:'Revisión',c:T.amber},APROBADO:{l:'Aprobado',c:T.lime},RECHAZADO:{l:'Rechazado',c:T.rose}}

  if(loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',color:T.orange,fontFamily:'system-ui'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:8,opacity:0.6}}>⚡</div>
        <div style={{fontSize:13,color:T.muted}}>Cargando Command Center...</div>
      </div>
    </div>
  )

  const nivel = [d.productos>=10,d.proveedores>=5,d.clientesActivos>=5,parseFloat(d.convRate)>=30,d.pipelineTotal>=1000000,parseFloat(d.rentPct)>=15].filter(Boolean).length+1

  return (
    <div style={{fontFamily:"'Nunito Sans',system-ui,sans-serif",color:T.text,paddingBottom:40}}>
      <style>{`
        @property --ba{syntax:'<angle>';inherits:false;initial-value:0deg}
        @keyframes spinBorder{to{--ba:360deg}}
        @keyframes pingDot{0%{transform:scale(1);opacity:0.6}100%{transform:scale(2.6);opacity:0}}
        @keyframes holeOpen{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glowPulse{0%,100%{opacity:0.4}50%{opacity:0.9}}
        @keyframes expandDown{from{opacity:0;transform:scaleY(0.92);transform-origin:top}to{opacity:1;transform:scaleY(1)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .organ-card{position:relative;border-radius:16px;background:rgba(255,255,255,0.04);padding:1px;transition:all 0.25s;animation:fadeUp 0.4s ease both}
        .organ-card::before{content:'';position:absolute;inset:0;border-radius:16px;padding:1px;background:conic-gradient(from var(--ba),${T.orange},${T.violet},${T.cyan},${T.lime},${T.orange});-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:destination-out;mask-composite:exclude;animation:spinBorder 6s linear infinite;opacity:0.4;pointer-events:none}
        .organ-card:hover::before{opacity:1}
        .organ-card:hover{transform:translateY(-3px)}
        .organ-inner{border-radius:15px;background:rgba(8,8,24,0.93);padding:16px;height:100%}
      `}</style>

      {/* ── HERO HEADER ── */}
      <div style={{
        marginBottom:20,padding:'20px 24px',
        borderRadius:20,position:'relative',overflow:'hidden',
        background:'linear-gradient(135deg,rgba(232,134,10,0.07),rgba(139,92,246,0.05),rgba(6,182,212,0.04))',
        border:'1px solid rgba(255,255,255,0.08)',
        borderTop:'1px solid rgba(255,255,255,0.16)',
        boxShadow:'0 8px 40px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.1)',
        animation:'fadeUp 0.4s ease both',
      }}>
        {/* Decoración */}
        <div style={{position:'absolute',top:-80,right:-80,width:280,height:280,borderRadius:'50%',background:'radial-gradient(circle,rgba(232,134,10,0.08),transparent 70%)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',bottom:-60,left:-60,width:200,height:200,borderRadius:'50%',background:'radial-gradient(circle,rgba(139,92,246,0.06),transparent 70%)',pointerEvents:'none'}}/>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12,marginBottom:16,position:'relative'}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
              <div style={{position:'relative',width:7,height:7}}>
                <div style={{position:'absolute',inset:0,borderRadius:'50%',background:T.lime,opacity:0.5,animation:'pingDot 1.5s ease-out infinite'}}/>
                <div style={{width:7,height:7,borderRadius:'50%',background:T.lime,boxShadow:`0 0 6px ${T.lime}`}}/>
              </div>
              <span style={{fontSize:9,fontWeight:700,color:T.lime,textTransform:'uppercase',letterSpacing:'0.15em'}}>Sistema activo</span>
            </div>
            <h1 style={{margin:0,fontSize:24,fontWeight:900,letterSpacing:'-0.3px',lineHeight:1.15}}>
              {getGreeting()}, <span style={{background:`linear-gradient(135deg,${T.orange},${T.orangeL})`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Santiago</span> 🧉
            </h1>
            <div style={{fontSize:11,color:T.muted,marginTop:4}}>
              {getDayLabel().charAt(0).toUpperCase()+getDayLabel().slice(1)}
            </div>
          </div>

          {/* Quick stats header */}
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {[
              {l:'Pipeline',v:fmtM(d.pipelineTotal),c:T.orange},
              {l:'Por cobrar',v:fmtM(d.pendienteCobro),c:T.amber},
              {l:'Ops activas',v:d.operacionesActivas,c:T.violet},
              {l:'Nivel',v:`${nivel}`,c:T.orangeL},
            ].map(k=>(
              <div key={k.l} style={{padding:'8px 14px',borderRadius:12,
                background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',
                textAlign:'center',minWidth:76}}>
                <div style={{fontSize:17,fontWeight:900,color:k.c,fontFamily:"'Space Mono',monospace",lineHeight:1}}>{k.v}</div>
                <div style={{fontSize:9,color:T.muted,marginTop:3,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em'}}>{k.l}</div>
              </div>
            ))}
          </div>
        </div>

        <PensamientoCard quote={quote}/>
      </div>

      {/* ── KPIs FINANCIEROS — fila 1 ── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:12}}>
        <KpiCard icon="💰" label="Facturado este mes" value={d.facturadoMes} fmt={fmtM} color={T.lime}
          trend={d.trend} spark={d.chartMeses?.map(m=>m.ingresos)}
          detail={[
            {l:'Facturado año',v:fmtM(d.facturadoAnio),c:T.lime},
            {l:'Mes anterior',v:fmtM(d.facturadoMesPrev),c:T.muted},
            {l:'Diferencia',v:d.trend!==undefined?`${d.trend>=0?'+':''}${d.trend?.toFixed(0)}%`:'—',c:d.trend>=0?T.lime:T.rose},
            {l:'Cobrado',v:fmtM(d.cobradoMes),c:T.cyan,hi:true},
          ]}/>
        <KpiCard icon="✅" label="Cobrado" value={d.cobradoMes} fmt={fmtM} color={T.cyan}
          sub={`de ${fmtM(d.facturadoMes)} facturado`}
          detail={[
            {l:'Cobrado',v:fmtM(d.cobradoMes),c:T.cyan,hi:true},
            {l:'Por cobrar',v:fmtM(d.pendienteCobro),c:T.amber},
          ]}/>
        <KpiCard icon="⏳" label="Por cobrar" value={d.pendienteCobro} fmt={fmtM} color={T.amber}
          sub="pendiente de pago"
          detail={[
            {l:'Monto pendiente',v:fmtM(d.pendienteCobro),c:T.amber,hi:true},
            {l:'% del facturado',v:d.facturadoMes>0?`${(d.pendienteCobro/d.facturadoMes*100).toFixed(0)}%`:'—',c:T.muted},
          ]}/>
        <KpiCard icon="💸" label="Egresos mes" value={d.egresosMes} fmt={fmtM} color={T.rose}
          spark={d.chartMeses?.map(m=>m.egresos)}
          detail={[
            {l:'Egresos mes',v:fmtM(d.egresosMes),c:T.rose,hi:true},
            {l:'vs ingresos',v:d.facturadoMes>0?`${(d.egresosMes/d.facturadoMes*100).toFixed(0)}%`:'—',c:T.muted},
          ]}/>
        <KpiCard icon="📈" label="Resultado" value={d.resultado} fmt={fmtM}
          color={d.resultado>=0?T.lime:T.rose}
          sub={`${d.rentPct}% rentabilidad`}
          detail={[
            {l:'Ingresos',v:fmtM(d.facturadoMes),c:T.lime},
            {l:'Egresos',v:fmtM(d.egresosMes),c:T.rose},
            {l:'Ganancia',v:fmtM(d.resultado),c:d.resultado>=0?T.lime:T.rose,hi:true},
            {l:'Rentabilidad',v:`${d.rentPct}%`,c:parseFloat(d.rentPct)>=15?T.lime:parseFloat(d.rentPct)>0?T.amber:T.rose},
          ]}/>
      </div>

      {/* ── KPIs CRM — fila 2 ── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
        <KpiCard icon="👥" label="Clientes activos" value={d.clientesActivos} color={T.violet}
          sub={`${d.clientesLeads} leads · ${d.clientesTotal} total`}
          detail={[
            {l:'Total clientes',v:d.clientesTotal,c:T.violet,hi:true},
            {l:'Activos',v:d.clientesActivos,c:T.lime},
            {l:'Leads/Prospectos',v:d.clientesLeads,c:T.cyan},
            {l:'Inactivos',v:Math.max(0,d.clientesTotal-d.clientesActivos-d.clientesLeads),c:T.muted},
          ]}/>
        <KpiCard icon="🗂" label="Pipeline activo" value={d.pipelineTotal} fmt={fmtM} color={T.orange}
          sub={`${d.operacionesActivas} ops abiertas`}
          detail={[
            {l:'Pipeline total',v:fmtM(d.pipelineTotal),c:T.orange,hi:true},
            {l:'Ops abiertas',v:d.operacionesActivas,c:T.violet},
            {l:'Ops cerradas',v:d.operacionesCerradas,c:T.lime},
          ]}/>
        <KpiCard icon="📋" label="Pptos este mes" value={d.pptosTotal} color={T.blue}
          sub={`${d.pptosAprobados} aprobados`}
          detail={[
            {l:'Emitidos mes',v:d.pptosTotal,c:T.blue,hi:true},
            {l:'Aprobados',v:d.pptosAprobados,c:T.lime},
            {l:'Rechazados',v:d.pptosRechazados,c:T.rose},
            {l:'Total aprobados',v:d.pptosAprobadosTotal,c:T.muted},
          ]}/>
        <KpiCard icon="🎯" label="Conversión mes" value={parseFloat(d.convRate)||0}
          fmt={n=>`${Math.round(n)}%`}
          color={parseFloat(d.convRate)>=30?T.lime:parseFloat(d.convRate)>0?T.amber:T.rose}
          sub={`${d.pptosAprobados}/${d.pptosTotal} pptos`}
          detail={[
            {l:'Conversión mes',v:`${d.convRate}%`,c:T.cyan,hi:true},
            {l:'Total aprobados',v:d.pptosAprobadosTotal,c:T.lime},
            {l:'Total rechazados',v:d.pptosRechazadosTotal,c:T.rose},
          ]}/>
      </div>

      {/* ── GRÁFICO MENSUAL ── */}
      <div style={{...glass({padding:'18px 20px'}),marginBottom:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <span style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:'uppercase',letterSpacing:'0.1em'}}>
            Ingresos vs Egresos — últimos 6 meses
          </span>
          <div style={{display:'flex',gap:12,fontSize:10}}>
            {[{c:T.lime,l:'Ingresos'},{c:T.rose,l:'Egresos'}].map(x=>(
              <span key={x.l} style={{display:'flex',alignItems:'center',gap:4,color:T.muted}}>
                <span style={{width:8,height:8,borderRadius:2,background:x.c,display:'inline-block'}}/>
                {x.l}
              </span>
            ))}
          </div>
        </div>
        <div style={{display:'flex',gap:6,alignItems:'flex-end',height:80}}>
          {(d.chartMeses||[]).map((m,i)=>{
            const iH=Math.max(((m.ingresos/chartMax)*72),2)
            const eH=Math.max(((m.egresos/chartMax)*72),2)
            const pos=m.ingresos>=m.egresos
            return (
              <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                <div style={{width:'100%',display:'flex',gap:2,alignItems:'flex-end',height:72}}>
                  <div style={{flex:1,height:iH,borderRadius:'3px 3px 0 0',
                    background:pos?`linear-gradient(180deg,${T.lime}cc,${T.lime}66)`:`linear-gradient(180deg,${T.amber}cc,${T.amber}66)`,
                    transition:'height 0.6s ease',position:'relative',overflow:'hidden'}}>
                    <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'rgba(255,255,255,0.3)'}}/>
                  </div>
                  <div style={{flex:1,height:eH,borderRadius:'3px 3px 0 0',
                    background:`linear-gradient(180deg,${T.rose}cc,${T.rose}66)`,
                    transition:'height 0.6s ease',position:'relative',overflow:'hidden'}}>
                    <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'rgba(255,255,255,0.3)'}}/>
                  </div>
                </div>
                <div style={{fontSize:8,color:T.muted,textTransform:'capitalize'}}>{m.mes}</div>
              </div>
            )
          })}
        </div>
        <div style={{display:'flex',gap:24,marginTop:12,paddingTop:12,borderTop:'1px solid rgba(255,255,255,0.05)'}}>
          {[
            {l:'Total año',v:fmtM(d.facturadoAnio),c:T.lime},
            {l:'Mes actual',v:fmtM(d.facturadoMes),c:T.cyan},
            {l:'Egresos mes',v:fmtM(d.egresosMes),c:T.rose},
            {l:'Resultado',v:fmtM(d.resultado),c:d.resultado>=0?T.lime:T.rose},
          ].map(k=>(
            <div key={k.l}>
              <div style={{fontSize:9,color:T.muted,fontWeight:700,textTransform:'uppercase',marginBottom:2}}>{k.l}</div>
              <div style={{fontSize:13,fontWeight:900,color:k.c,fontFamily:"'Space Mono',monospace"}}>{k.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ORGANS — SALUD DEL NEGOCIO ── */}
      <div style={{marginBottom:16}}>
        <div style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:10}}>
          Salud del negocio — clic para expandir
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
          <OrganCard icon="❤️" label="INGRESOS" color={T.lime}
            status={d.facturadoMes>0?'ok':d.cobradoMes>0?'warn':'err'}
            items={[
              {l:'Facturado mes',v:fmtM(d.facturadoMes),c:T.lime,hi:true},
              {l:'Cobrado',v:fmtM(d.cobradoMes),c:T.cyan},
              {l:'Por cobrar',v:fmtM(d.pendienteCobro),c:T.amber},
              {l:'vs anterior',v:d.trend!==undefined?`${d.trend>=0?'+':''}${d.trend?.toFixed(0)}%`:'—',c:d.trend>=0?T.lime:T.rose},
            ]}
            extraItems={[
              {l:'Facturado año',v:fmtM(d.facturadoAnio),c:T.lime},
              {l:'Rentabilidad',v:`${d.rentPct}%`,c:parseFloat(d.rentPct)>=15?T.lime:T.amber},
              {l:'Resultado mes',v:fmtM(d.resultado),c:d.resultado>=0?T.lime:T.rose},
            ]}/>
          <OrganCard icon="🧠" label="PRESUPUESTOS" color={T.blue}
            status={parseFloat(d.convRate)>=30?'ok':d.pptosTotal>0?'warn':'err'}
            items={[
              {l:'Emitidos mes',v:d.pptosTotal,c:T.blue,hi:true},
              {l:'Aprobados',v:d.pptosAprobados,c:T.lime},
              {l:'Rechazados',v:d.pptosRechazados,c:T.rose},
              {l:'Conversión',v:`${d.convRate}%`,c:parseFloat(d.convRate)>=30?T.lime:T.amber},
            ]}
            extraItems={[
              {l:'Total aprobados',v:d.pptosAprobadosTotal,c:T.lime},
              {l:'Total rechazados',v:d.pptosRechazadosTotal,c:T.rose},
              {l:'Conv. histórica',v:d.pptosAprobadosTotal+d.pptosRechazadosTotal>0?`${(d.pptosAprobadosTotal/(d.pptosAprobadosTotal+d.pptosRechazadosTotal)*100).toFixed(0)}%`:'—',c:T.cyan},
            ]}/>
          <OrganCard icon="💼" label="OPERACIONES" color={T.orange}
            status={d.operacionesActivas>0?'ok':d.operacionesCerradas>0?'warn':'err'}
            items={[
              {l:'Pipeline',v:fmtM(d.pipelineTotal),c:T.orange,hi:true},
              {l:'Ops abiertas',v:d.operacionesActivas,c:T.violet},
              {l:'Cerradas',v:d.operacionesCerradas,c:T.lime},
              {l:'Clientes activos',v:d.clientesActivos,c:T.cyan},
            ]}
            extraItems={[
              {l:'Total clientes',v:d.clientesTotal,c:T.violet},
              {l:'Leads',v:d.clientesLeads,c:T.cyan},
            ]}/>
          <OrganCard icon="🏭" label="PROVEEDORES" color={T.cyan}
            status={d.proveedores>=5?'ok':d.proveedores>0?'warn':'err'}
            items={[
              {l:'Proveedores',v:d.proveedores,c:T.cyan,hi:true},
              {l:'Productos',v:d.productos,c:T.blue},
              {l:'Egresos mes',v:fmtM(d.egresosMes),c:T.rose},
              {l:'Resultado',v:fmtM(d.resultado),c:d.resultado>=0?T.lime:T.rose},
            ]}
            extraItems={[
              {l:'Costo/Ingreso',v:d.facturadoMes>0?`${(d.egresosMes/d.facturadoMes*100).toFixed(0)}%`:'—',c:T.muted},
              {l:'Margen bruto',v:`${d.rentPct}%`,c:parseFloat(d.rentPct)>=15?T.lime:T.amber},
            ]}/>
          <OrganCard icon="👥" label="CLIENTES" color={T.violet}
            status={d.clientesActivos>=5?'ok':d.clientesActivos>0?'warn':'err'}
            items={[
              {l:'Total',v:d.clientesTotal,c:T.violet,hi:true},
              {l:'Activos',v:d.clientesActivos,c:T.lime},
              {l:'Leads',v:d.clientesLeads,c:T.cyan},
              {l:'Conv. total',v:d.pptosAprobadosTotal+d.pptosRechazadosTotal>0?`${(d.pptosAprobadosTotal/(d.pptosAprobadosTotal+d.pptosRechazadosTotal)*100).toFixed(0)}%`:'—',c:T.amber},
            ]}
            extraItems={[
              {l:'Inactivos',v:Math.max(0,d.clientesTotal-d.clientesActivos-d.clientesLeads),c:T.muted},
              {l:'Pipeline/cliente',v:d.clientesActivos>0?fmtM(d.pipelineTotal/Math.max(d.clientesActivos,1)):'—',c:T.orange},
            ]}/>
          <OrganCard icon="📊" label="RENTABILIDAD" color={parseFloat(d.rentPct)>=15?T.lime:parseFloat(d.rentPct)>0?T.amber:T.rose}
            status={parseFloat(d.rentPct)>=15?'ok':parseFloat(d.rentPct)>0?'warn':'err'}
            items={[
              {l:'Rentabilidad',v:`${d.rentPct}%`,c:parseFloat(d.rentPct)>=15?T.lime:T.amber,hi:true},
              {l:'Ingresos',v:fmtM(d.facturadoMes),c:T.lime},
              {l:'Egresos',v:fmtM(d.egresosMes),c:T.rose},
              {l:'Ganancia',v:fmtM(d.resultado),c:d.resultado>=0?T.lime:T.rose},
            ]}
            extraItems={[
              {l:'Objetivo rent.',v:'15%',c:T.muted},
              {l:'Estado',v:parseFloat(d.rentPct)>=15?'✅ Excelente':parseFloat(d.rentPct)>=5?'⚠️ Aceptable':'❌ Bajo objetivo',c:parseFloat(d.rentPct)>=15?T.lime:parseFloat(d.rentPct)>=5?T.amber:T.rose},
            ]}/>
        </div>
      </div>

      {/* ── PRÓXIMAS ACCIONES ── */}
      {d.proximasAcciones?.length>0&&(
        <div style={{...glass({padding:'16px 18px'}),marginBottom:16}}>
          <div style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>
            📌 Próximas acciones
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {d.proximasAcciones.map((op,i)=>{
              const ov=op.next_action_date&&new Date(op.next_action_date)<new Date()
              return (
                <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',
                  borderRadius:10,
                  background:ov?'rgba(244,63,94,0.06)':'rgba(255,255,255,0.03)',
                  border:`1px solid ${ov?T.rose+'33':T.border}`}}>
                  <span style={{fontSize:14,flexShrink:0}}>{ov?'⚠️':'📌'}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:700,color:T.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {op.client_name}{op.name?` — ${op.name}`:''}
                    </div>
                    <div style={{fontSize:11,color:ov?T.rose:T.muted,marginTop:2}}>{op.next_action}</div>
                  </div>
                  <div style={{fontSize:10,fontWeight:700,color:ov?T.rose:T.sub,flexShrink:0}}>{fmtDate(op.next_action_date)}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── ÚLTIMAS FACTURAS + PPTOS ── */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
        <div style={{...glass({padding:'16px 18px'})}}>
          <div style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>🧾 Últimas facturas</div>
          {d.ultimasFacturas.length===0?(
            <div style={{textAlign:'center',padding:'24px 0',color:T.muted,fontSize:12}}>
              <div style={{fontSize:28,marginBottom:6,opacity:0.3}}>🧾</div>Sin facturas registradas
            </div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {d.ultimasFacturas.map((inv,i)=>{
                const sm=invSt[inv.status]||{l:inv.status,c:T.muted}
                return (
                  <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',
                    borderRadius:8,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.05)'}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:11,fontWeight:700,color:T.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{inv.client_name}</div>
                      <div style={{fontSize:9,color:T.muted,marginTop:1}}>F{inv.tipo||'A'} {String(inv.number||0).padStart(6,'0')} · {fmtDate(inv.date)}</div>
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

        <div style={{...glass({padding:'16px 18px'})}}>
          <div style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>📋 Últimos presupuestos</div>
          {d.ultimosPptos.length===0?(
            <div style={{textAlign:'center',padding:'24px 0',color:T.muted,fontSize:12}}>
              <div style={{fontSize:28,marginBottom:6,opacity:0.3}}>📋</div>Sin presupuestos registrados
            </div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {d.ultimosPptos.map((q,i)=>{
                const sm=qSt[q.status]||{l:q.status,c:T.muted}
                const vencido=q.expires_at&&new Date(q.expires_at)<new Date()&&!['APROBADO','RECHAZADO'].includes(q.status)
                return (
                  <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',
                    borderRadius:8,background:'rgba(255,255,255,0.03)',
                    border:`1px solid ${vencido?T.rose+'22':'rgba(255,255,255,0.05)'}`}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:11,fontWeight:700,color:T.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{q.client_name}</div>
                      <div style={{fontSize:9,color:T.muted,marginTop:1}}>P-{String(q.number||0).padStart(4,'0')} · {fmtDate(q.date)}</div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontSize:12,fontWeight:900,color:T.orange,fontFamily:"'Space Mono',monospace"}}>{fmtM(q.total)}</div>
                      <span style={{fontSize:8,padding:'1px 6px',borderRadius:8,fontWeight:700,background:`${sm.c}18`,color:sm.c}}>{vencido?'Vencido':sm.l}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── NIVEL STEPS ── */}
      <div style={{...glass({padding:'20px 22px'}),
        background:'linear-gradient(135deg,rgba(232,134,10,0.06),rgba(139,92,246,0.04))',
        border:'1px solid rgba(232,134,10,0.18)',
        borderTop:'1px solid rgba(232,134,10,0.3)'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
          <span style={{fontSize:28}}>👑</span>
          <div>
            <div style={{fontSize:18,fontWeight:900,
              background:`linear-gradient(135deg,${T.orange},${T.orangeL})`,
              WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
              STEPS — Nivel {nivel}
            </div>
            <div style={{fontSize:10,color:T.muted,marginTop:2}}>
              {nivel-1} de 6 logros desbloqueados
            </div>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6}}>
          {[
            {l:'10+ productos en catálogo', met:d.productos>=10},
            {l:'5+ proveedores activos',     met:d.proveedores>=5},
            {l:'5+ clientes activos',        met:d.clientesActivos>=5},
            {l:'Conversión ≥ 30%',           met:parseFloat(d.convRate)>=30},
            {l:'Pipeline > $1M activo',      met:d.pipelineTotal>=1000000},
            {l:'Rentabilidad ≥ 15%',         met:parseFloat(d.rentPct)>=15},
          ].map((ch,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:7,padding:'8px 12px',
              borderRadius:10,
              background:ch.met?'rgba(232,134,10,0.08)':'rgba(255,255,255,0.02)',
              border:`1px solid ${ch.met?'rgba(232,134,10,0.22)':T.border}`}}>
              <span style={{fontSize:12}}>{ch.met?'✅':'⬜'}</span>
              <span style={{fontSize:10,color:ch.met?T.text:T.muted,fontWeight:ch.met?600:400}}>{ch.l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
