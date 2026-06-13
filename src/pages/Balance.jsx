import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../supabase'

const d = {
  bg:       'linear-gradient(160deg,#050510 0%,#080818 50%,#050510 100%)',
  glass:    'rgba(255,255,255,0.04)',
  border:   'rgba(255,255,255,0.07)',
  border2:  'rgba(255,255,255,0.13)',
  text:     '#F0EFFF',
  text2:    '#C8C6E0',
  muted:    '#8884A8',
  sub:      '#4A4870',
  lime:     '#22C55E',
  rose:     '#F43F5E',
  orange:   '#E8860A',
  orangeL:  '#F5A623',
  blue:     '#3B82F6',
  violet:   '#8B5CF6',
  amber:    '#F59E0B',
  cyan:     '#06B6D4',
  shadow:   '0 4px 24px rgba(0,0,0,0.5)',
  shadowLg: '0 16px 64px rgba(0,0,0,0.7)',
}

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MONTHS_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const fmtARS   = n => `$${(parseFloat(n)||0).toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2})}`
const fmtShort = n => { const v=parseFloat(n)||0; return v>=1e6?`$${(v/1e6).toFixed(2)}M`:v>=1e3?`$${(v/1e3).toFixed(0)}k`:fmtARS(v) }

const glassCard = (extra={}) => ({
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(24px) saturate(160%)',
  WebkitBackdropFilter: 'blur(24px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderTop: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 18,
  boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)',
  ...extra,
})

// ── MINI SPARKLINE SVG ────────────────────────────────────────────────────────
function Sparkline({ data, color, height=40, width=120 }) {
  if(!data||data.length<2) return null
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const pts = data.map((v,i)=>{
    const x = (i/(data.length-1))*width
    const y = height - ((v-min)/range)*(height-6) - 3
    return `${x},${y}`
  }).join(' ')
  const area = `0,${height} ${pts} ${width},${height}`
  return (
    <svg width={width} height={height} style={{overflow:'visible'}}>
      <defs>
        <linearGradient id={`sg${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sg${color.replace('#','')})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Last point dot */}
      {data.length>0 && (() => {
        const lastPts = pts.split(' ')
        const last = lastPts[lastPts.length-1].split(',')
        return <circle cx={last[0]} cy={last[1]} r="3" fill={color} opacity="0.9"/>
      })()}
    </svg>
  )
}

// ── BAR CHART ─────────────────────────────────────────────────────────────────
function BarChart({ data, height=180 }) {
  const maxVal = Math.max(...data.map(d=>Math.max(d.ingresos||0,d.egresos||0)),1)
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap:6,height,padding:'0 4px'}}>
      {data.map((item,i)=>{
        const ingH = Math.max(((item.ingresos||0)/maxVal)*(height-24),2)
        const egH  = Math.max(((item.egresos||0)/maxVal)*(height-24),2)
        const ganancia = (item.ingresos||0)-(item.egresos||0)
        return (
          <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2,position:'relative'}}
            title={`${item.label}: Ing ${fmtShort(item.ingresos)} / Egr ${fmtShort(item.egresos)}`}>
            <div style={{width:'100%',display:'flex',gap:2,alignItems:'flex-end',height:height-24}}>
              {/* Ingresos */}
              <div style={{flex:1,height:ingH,borderRadius:'4px 4px 0 0',
                background:ganancia>=0
                  ?`linear-gradient(180deg,${d.lime}cc,${d.lime}88)`
                  :`linear-gradient(180deg,${d.amber}cc,${d.amber}88)`,
                transition:'height 0.6s cubic-bezier(0.34,1.2,0.64,1)',
                position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:0,left:0,right:0,height:1,
                  background:'rgba(255,255,255,0.3)'}}/>
              </div>
              {/* Egresos */}
              <div style={{flex:1,height:egH,borderRadius:'4px 4px 0 0',
                background:`linear-gradient(180deg,${d.rose}cc,${d.rose}88)`,
                transition:'height 0.6s cubic-bezier(0.34,1.2,0.64,1)',
                position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:0,left:0,right:0,height:1,
                  background:'rgba(255,255,255,0.3)'}}/>
              </div>
            </div>
            <div style={{fontSize:8,color:d.sub,textAlign:'center',lineHeight:1}}>{item.label}</div>
          </div>
        )
      })}
    </div>
  )
}

// ── DONUT CHART ───────────────────────────────────────────────────────────────
function DonutChart({ segments, size=140 }) {
  const total = segments.reduce((s,sg)=>s+sg.value,0)
  if(!total) return (
    <div style={{width:size,height:size,borderRadius:'50%',
      background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',
      display:'flex',alignItems:'center',justifyContent:'center'}}>
      <span style={{fontSize:11,color:d.sub}}>Sin datos</span>
    </div>
  )

  const cx=size/2, cy=size/2, r=size*0.38, inner=size*0.24
  let cumAngle = -Math.PI/2

  const paths = segments.filter(s=>s.value>0).map(sg=>{
    const angle = (sg.value/total)*Math.PI*2
    const x1 = cx+r*Math.cos(cumAngle)
    const y1 = cy+r*Math.sin(cumAngle)
    cumAngle += angle
    const x2 = cx+r*Math.cos(cumAngle)
    const y2 = cy+r*Math.sin(cumAngle)
    const large = angle>Math.PI?1:0
    const xi1 = cx+inner*Math.cos(cumAngle-angle)
    const yi1 = cy+inner*Math.sin(cumAngle-angle)
    const xi2 = cx+inner*Math.cos(cumAngle)
    const yi2 = cy+inner*Math.sin(cumAngle)
    return {
      path:`M${xi1},${yi1} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} L${xi2},${yi2} A${inner},${inner} 0 ${large},0 ${xi1},${yi1} Z`,
      color: sg.color, label: sg.label, value: sg.value, pct: ((sg.value/total)*100).toFixed(0)
    }
  })

  return (
    <svg width={size} height={size}>
      {paths.map((p,i)=>(
        <path key={i} d={p.path} fill={p.color} opacity="0.85" stroke="rgba(5,5,16,0.8)" strokeWidth="1.5"/>
      ))}
      {/* Center */}
      <circle cx={cx} cy={cy} r={inner-2} fill="rgba(5,5,16,0.6)"/>
    </svg>
  )
}

// ── KPI CARD ──────────────────────────────────────────────────────────────────
function KpiCard({ value, label, color, icon, sub, trend, sparkData }) {
  const [hov, setHov] = useState(false)
  const ref = useRef()
  const onMove = e => {
    const rc = ref.current?.getBoundingClientRect()
    if(!rc) return
    ref.current.style.setProperty('--sx',`${((e.clientX-rc.left)/rc.width)*100}%`)
    ref.current.style.setProperty('--sy',`${((e.clientY-rc.top)/rc.height)*100}%`)
  }
  return (
    <div ref={ref} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onMouseMove={onMove}
      style={{
        ...glassCard({padding:'20px 22px'}), flex:'1 1 0', minWidth:150,
        border: hov?`1px solid ${color}44`:'1px solid rgba(255,255,255,0.07)',
        borderTop: hov?`1px solid ${color}77`:'1px solid rgba(255,255,255,0.14)',
        boxShadow: hov?`0 16px 48px ${color}22, inset 0 1px 0 rgba(255,255,255,0.12)`:d.shadow,
        transform: hov?'translateY(-6px) scale(1.03)':'none',
        transition: 'all 0.35s cubic-bezier(0.34,1.4,0.64,1)',
        position:'relative', overflow:'hidden', cursor:'default',
      }}>
      <div style={{position:'absolute',inset:0,borderRadius:18,pointerEvents:'none',
        background:`radial-gradient(circle 100px at var(--sx,50%) var(--sy,50%),${color}18,transparent 70%)`}}/>
      <div style={{position:'absolute',top:0,left:'10%',right:'10%',height:1,
        background:`linear-gradient(90deg,transparent,${hov?color+'77':'rgba(255,255,255,0.08)'},transparent)`}}/>
      {/* Sparkline bg */}
      {sparkData && (
        <div style={{position:'absolute',bottom:12,right:12,opacity:hov?0.7:0.35,transition:'opacity 0.3s'}}>
          <Sparkline data={sparkData} color={color} width={80} height={32}/>
        </div>
      )}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12,position:'relative'}}>
        <span style={{fontSize:22,opacity:hov?1:0.6,transition:'opacity 0.2s'}}>{icon}</span>
        {trend!==undefined && (
          <span style={{fontSize:11,fontWeight:800,color:trend>=0?d.lime:d.rose,
            background:trend>=0?'rgba(34,197,94,0.12)':'rgba(244,63,94,0.12)',
            padding:'3px 8px',borderRadius:20}}>
            {trend>=0?'↑':'↓'} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      <div style={{fontSize:28,fontWeight:900,color,fontFamily:"'Space Mono',monospace",
        letterSpacing:'-1px',textShadow:hov?`0 0 28px ${color}66`:'none',
        transition:'text-shadow 0.3s',position:'relative'}}>
        {value}
      </div>
      <div style={{fontSize:12,color:d.muted,marginTop:5,fontWeight:600}}>{label}</div>
      {sub&&<div style={{fontSize:10,color:d.sub,marginTop:2}}>{sub}</div>}
    </div>
  )
}

// ── CATEGORY ROW ──────────────────────────────────────────────────────────────
function CategoryRow({ label, icon, color, amount, total, count }) {
  const pct = total>0 ? (amount/total*100) : 0
  return (
    <div style={{marginBottom:10}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:14}}>{icon}</span>
          <span style={{fontSize:12,color:d.text2,fontWeight:600}}>{label}</span>
          <span style={{fontSize:10,color:d.sub}}>{count} registro{count!==1?'s':''}</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:10,color:d.muted}}>{pct.toFixed(1)}%</span>
          <span style={{fontSize:13,fontWeight:800,color,fontFamily:"'Space Mono',monospace"}}>{fmtShort(amount)}</span>
        </div>
      </div>
      <div style={{height:4,borderRadius:4,background:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
        <div style={{height:'100%',width:`${pct}%`,
          background:`linear-gradient(90deg,${color}88,${color})`,
          borderRadius:4,transition:'width 0.8s cubic-bezier(0.34,1.2,0.64,1)'}}/>
      </div>
    </div>
  )
}

const CAT_META = {
  PROVEEDOR:   { label:'Proveedor EPP',     icon:'📦', color:'#E74C3C' },
  TRANSPORTE:  { label:'Transporte/Flete',  icon:'🚚', color:'#E67E22' },
  COMBUSTIBLE: { label:'Combustible',        icon:'⛽', color:'#F39C12' },
  IMPUESTO:    { label:'Impuestos/ARCA',     icon:'🏛', color:'#8E44AD' },
  IIBB:        { label:'Ingresos Brutos',    icon:'📊', color:'#2980B9' },
  GANANCIAS:   { label:'Ganancias',          icon:'💼', color:'#16A085' },
  CONVENIO:    { label:'Conv. Multilateral', icon:'🤝', color:'#27AE60' },
  CONTADOR:    { label:'Contador',           icon:'📋', color:'#2C3E50' },
  ALQUILER:    { label:'Alquiler',           icon:'🏠', color:'#7F8C8D' },
  SERVICIO:    { label:'Servicios',          icon:'⚡', color:'#1ABC9C' },
  SEGURO:      { label:'Seguro',             icon:'🛡', color:'#3498DB' },
  SUELDO:      { label:'Sueldos',            icon:'👥', color:'#9B59B6' },
  OTRO:        { label:'Otro',               icon:'📎', color:'#95A5A6' },
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function Balance() {
  const [invoices,  setInvoices]  = useState([])
  const [purchases, setPurchases] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [period,    setPeriod]    = useState('mes')   // mes | año | total
  const [selYear,   setSelYear]   = useState(new Date().getFullYear())
  const [selMonth,  setSelMonth]  = useState(new Date().getMonth())

  useEffect(()=>{
    const load = async () => {
      setLoading(true)
      const [iRes,pRes] = await Promise.all([
        supabase.from('invoices').select('id,date,total,neto,iva_21,client_name,status').order('date'),
        supabase.from('purchases').select('id,date,total,category,status,supplier_name').order('date'),
      ])
      setInvoices(iRes.data||[])
      setPurchases(pRes.data||[])
      setLoading(false)
    }
    load()
  },[])

  // ── Filtro por período ──────────────────────────────────────────────────────
  const { filtInv, filtPur } = useMemo(()=>{
    const filter = items => items.filter(item=>{
      if(!item.date) return false
      const dt = new Date(item.date+'T12:00:00')
      if(period==='mes')   return dt.getFullYear()===selYear && dt.getMonth()===selMonth
      if(period==='año')   return dt.getFullYear()===selYear
      return true
    })
    return { filtInv: filter(invoices), filtPur: filter(purchases) }
  },[invoices, purchases, period, selYear, selMonth])

  // ── KPIs del período ────────────────────────────────────────────────────────
  const kpis = useMemo(()=>{
    const ingresos  = filtInv.reduce((s,i)=>s+(i.total||0),0)
    const egresos   = filtPur.reduce((s,p)=>s+(p.total||0),0)
    const resultado = ingresos - egresos
    const rentPct   = ingresos>0 ? (resultado/ingresos*100) : 0
    const ivaCobrado= filtInv.reduce((s,i)=>s+(i.iva_21||0),0)
    const ivaFiscal = filtPur.filter(p=>p.category==='IMPUESTO'||p.category==='IIBB').reduce((s,p)=>s+(p.total||0),0)
    return { ingresos, egresos, resultado, rentPct, ivaCobrado, ivaFiscal }
  },[filtInv, filtPur])

  // ── Datos mensuales del año para el gráfico ─────────────────────────────────
  const monthlyData = useMemo(()=>{
    return MONTHS.map((label,m)=>{
      const ingresos = invoices.filter(i=>{
        const dt=new Date((i.date||'')+'T12:00:00')
        return dt.getFullYear()===selYear && dt.getMonth()===m
      }).reduce((s,i)=>s+(i.total||0),0)
      const egresos = purchases.filter(p=>{
        const dt=new Date((p.date||'')+'T12:00:00')
        return dt.getFullYear()===selYear && dt.getMonth()===m
      }).reduce((s,p)=>s+(p.total||0),0)
      return { label, ingresos, egresos, resultado:ingresos-egresos }
    })
  },[invoices, purchases, selYear])

  // ── Sparklines (últimos 6 meses) ────────────────────────────────────────────
  const sparkIngresos = useMemo(()=>monthlyData.slice(-6).map(m=>m.ingresos),[monthlyData])
  const sparkEgresos  = useMemo(()=>monthlyData.slice(-6).map(m=>m.egresos),[monthlyData])
  const sparkResult   = useMemo(()=>monthlyData.slice(-6).map(m=>m.resultado),[monthlyData])

  // ── Egresos por categoría ───────────────────────────────────────────────────
  const byCategory = useMemo(()=>{
    const map = {}
    filtPur.forEach(p=>{
      if(!map[p.category]) map[p.category]={total:0,count:0}
      map[p.category].total += p.total||0
      map[p.category].count += 1
    })
    return Object.entries(map).sort((a,b)=>b[1].total-a[1].total)
  },[filtPur])

  // ── Donut segments ──────────────────────────────────────────────────────────
  const donutSegments = useMemo(()=>
    byCategory.map(([key,val])=>({
      label: CAT_META[key]?.label||key,
      value: val.total,
      color: CAT_META[key]?.color||'#666',
    }))
  ,[byCategory])

  // ── Años disponibles ────────────────────────────────────────────────────────
  const years = useMemo(()=>{
    const all = [...invoices,...purchases].map(i=>new Date((i.date||'')+'T12:00:00').getFullYear()).filter(Boolean)
    return [...new Set(all)].sort((a,b)=>b-a)
  },[invoices,purchases])

  // ── Resultado del mes anterior para trend ───────────────────────────────────
  const prevMonthResult = useMemo(()=>{
    const pm = selMonth===0?11:selMonth-1
    const py = selMonth===0?selYear-1:selYear
    const inv = invoices.filter(i=>{const dt=new Date((i.date||'')+'T12:00:00');return dt.getFullYear()===py&&dt.getMonth()===pm}).reduce((s,i)=>s+(i.total||0),0)
    const pur = purchases.filter(p=>{const dt=new Date((p.date||'')+'T12:00:00');return dt.getFullYear()===py&&dt.getMonth()===pm}).reduce((s,p)=>s+(p.total||0),0)
    return inv-pur
  },[invoices,purchases,selMonth,selYear])

  const resultTrend = prevMonthResult!==0 ? ((kpis.resultado-prevMonthResult)/Math.abs(prevMonthResult)*100) : undefined
  const rentColor = kpis.rentPct>=15?d.lime:kpis.rentPct>=5?d.amber:d.rose

  const periodLabel = period==='mes'
    ? `${MONTHS_FULL[selMonth]} ${selYear}`
    : period==='año' ? `Año ${selYear}` : 'Histórico total'

  if(loading) return (
    <div style={{minHeight:'100vh',background:d.bg,display:'flex',alignItems:'center',
      justifyContent:'center',color:d.muted,fontFamily:"'Nunito Sans',sans-serif"}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:8,opacity:0.5}}>⚡</div>
        <div>Cargando balance...</div>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',padding:'24px 28px',background:d.bg,
      fontFamily:"'Nunito Sans',sans-serif",color:d.text}}>

      {/* ── HEADER ── */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24,flexWrap:'wrap',gap:12}}>
        <div>
          <h1 style={{margin:0,fontSize:28,fontWeight:900,fontFamily:"'Syne',sans-serif",
            background:`linear-gradient(135deg,${d.lime},${d.cyan})`,
            WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
            Balance
          </h1>
          <p style={{margin:'4px 0 0',fontSize:12,color:d.muted}}>{periodLabel}</p>
        </div>

        {/* Controles período */}
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          {/* Tipo período */}
          <div style={{display:'flex',gap:3,background:'rgba(255,255,255,0.04)',
            borderRadius:12,padding:3,border:'1px solid rgba(255,255,255,0.08)'}}>
            {[{k:'mes',l:'Mes'},{k:'año',l:'Año'},{k:'total',l:'Total'}].map(opt=>(
              <button key={opt.k} onClick={()=>setPeriod(opt.k)}
                style={{padding:'6px 14px',borderRadius:9,fontSize:12,fontWeight:700,
                  border:'none',cursor:'pointer',transition:'all 0.2s',
                  background:period===opt.k?`linear-gradient(135deg,${d.lime}33,${d.cyan}22)`:'transparent',
                  color:period===opt.k?d.lime:d.muted,
                  boxShadow:period===opt.k?`0 2px 12px ${d.lime}22`:'none'}}>
                {opt.l}
              </button>
            ))}
          </div>

          {/* Año */}
          <select value={selYear} onChange={e=>setSelYear(+e.target.value)}
            style={{padding:'7px 12px',borderRadius:10,border:'1px solid rgba(255,255,255,0.1)',
              background:'rgba(8,8,24,0.9)',color:d.text,fontSize:13,outline:'none'}}>
            {years.length?years.map(y=><option key={y} value={y}>{y}</option>):<option value={selYear}>{selYear}</option>}
          </select>

          {/* Mes */}
          {period==='mes' && (
            <select value={selMonth} onChange={e=>setSelMonth(+e.target.value)}
              style={{padding:'7px 12px',borderRadius:10,border:'1px solid rgba(255,255,255,0.1)',
                background:'rgba(8,8,24,0.9)',color:d.text,fontSize:13,outline:'none'}}>
              {MONTHS_FULL.map((m,i)=><option key={i} value={i}>{m}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* ── KPIs PRINCIPALES ── */}
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'nowrap',overflowX:'auto',paddingBottom:6}}>
        <KpiCard value={fmtShort(kpis.ingresos)} label="Ingresos" color={d.lime}
          icon="💰" sub={`${filtInv.length} factura${filtInv.length!==1?'s':''}`}
          sparkData={sparkIngresos}/>
        <KpiCard value={fmtShort(kpis.egresos)} label="Egresos" color={d.rose}
          icon="💸" sub={`${filtPur.length} compra${filtPur.length!==1?'s':''}`}
          sparkData={sparkEgresos}/>
        <KpiCard value={fmtShort(kpis.resultado)} label="Resultado" color={kpis.resultado>=0?d.lime:d.rose}
          icon={kpis.resultado>=0?'📈':'📉'} trend={resultTrend} sparkData={sparkResult}/>
        <KpiCard value={`${kpis.rentPct.toFixed(1)}%`} label="Rentabilidad" color={rentColor}
          icon="🎯" sub={kpis.rentPct>=15?'Excelente':kpis.rentPct>=5?'Aceptable':'Bajo objetivo'}/>
        <KpiCard value={fmtShort(kpis.ivaCobrado)} label="IVA cobrado" color={d.violet}
          icon="🏛" sub="en facturas emitidas"/>
      </div>

      {/* ── RESULTADO VISUAL GRANDE ── */}
      <div style={{...glassCard({padding:'24px 28px'}),marginBottom:16,
        background:kpis.resultado>=0?'rgba(34,197,94,0.05)':'rgba(244,63,94,0.05)',
        border:`1px solid ${kpis.resultado>=0?d.lime+'22':d.rose+'22'}`}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16}}>
          <div>
            <div style={{fontSize:11,color:d.muted,textTransform:'uppercase',fontWeight:700,
              letterSpacing:'0.1em',marginBottom:6}}>
              Resultado {periodLabel}
            </div>
            <div style={{fontSize:48,fontWeight:900,
              color:kpis.resultado>=0?d.lime:d.rose,
              fontFamily:"'Space Mono',monospace",letterSpacing:'-2px',lineHeight:1}}>
              {fmtARS(kpis.resultado)}
            </div>
            <div style={{fontSize:13,color:d.muted,marginTop:8}}>
              {kpis.resultado>=0
                ? `Superávit de ${fmtShort(kpis.resultado)} en el período`
                : `Déficit de ${fmtShort(Math.abs(kpis.resultado))} en el período`}
            </div>
          </div>

          {/* Barra proporcional */}
          <div style={{flex:1,maxWidth:320}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:6,fontSize:11,color:d.muted}}>
              <span>Egresos</span>
              <span>Ingresos</span>
            </div>
            <div style={{height:12,borderRadius:12,background:'rgba(244,63,94,0.2)',overflow:'hidden',
              position:'relative'}}>
              <div style={{position:'absolute',right:0,top:0,bottom:0,
                width:`${kpis.ingresos>0?Math.min((kpis.ingresos/Math.max(kpis.ingresos,kpis.egresos))*100,100):0}%`,
                background:`linear-gradient(90deg,${d.lime}88,${d.lime})`,
                borderRadius:12,transition:'width 0.8s ease'}}/>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontSize:11}}>
              <span style={{color:d.rose,fontWeight:700}}>{fmtShort(kpis.egresos)}</span>
              <span style={{color:d.lime,fontWeight:700}}>{fmtShort(kpis.ingresos)}</span>
            </div>
          </div>

          {/* Rentabilidad dial */}
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:11,color:d.muted,textTransform:'uppercase',fontWeight:700,marginBottom:8}}>Rentabilidad</div>
            <div style={{position:'relative',width:90,height:90,margin:'0 auto'}}>
              <svg width="90" height="90" viewBox="0 0 90 90">
                <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"/>
                <circle cx="45" cy="45" r="38" fill="none" stroke={rentColor} strokeWidth="8"
                  strokeDasharray={`${Math.min(Math.max(kpis.rentPct,0),100)*2.39} 239`}
                  strokeLinecap="round" strokeDashoffset="59.75"
                  style={{transition:'stroke-dasharray 1s ease'}}/>
              </svg>
              <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <span style={{fontSize:16,fontWeight:900,color:rentColor,
                  fontFamily:"'Space Mono',monospace"}}>{kpis.rentPct.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── GRÁFICO MENSUAL + DONUT ── */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:16,marginBottom:16}}>

        {/* Gráfico de barras mensual */}
        <div style={{...glassCard({padding:'20px 24px'})}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:700,color:d.muted,textTransform:'uppercase',letterSpacing:'0.08em'}}>
              Ingresos vs Egresos — {selYear}
            </div>
            <div style={{display:'flex',gap:12,fontSize:10}}>
              <span style={{display:'flex',alignItems:'center',gap:4,color:d.muted}}>
                <span style={{width:8,height:8,borderRadius:2,background:d.lime,display:'inline-block'}}/>Ingresos
              </span>
              <span style={{display:'flex',alignItems:'center',gap:4,color:d.muted}}>
                <span style={{width:8,height:8,borderRadius:2,background:d.rose,display:'inline-block'}}/>Egresos
              </span>
            </div>
          </div>
          <BarChart data={monthlyData} height={160}/>

          {/* Línea de resultado mes a mes */}
          <div style={{display:'flex',gap:4,marginTop:10}}>
            {monthlyData.map((m,i)=>{
              const isPos = m.resultado>=0
              const isEmpty = m.ingresos===0 && m.egresos===0
              return (
                <div key={i} style={{flex:1,textAlign:'center',
                  padding:'4px 2px',borderRadius:6,
                  background:isEmpty?'transparent':isPos?'rgba(34,197,94,0.08)':'rgba(244,63,94,0.08)'}}>
                  <div style={{fontSize:7,fontWeight:700,
                    color:isEmpty?d.sub:isPos?d.lime:d.rose,lineHeight:1}}>
                    {isEmpty?'·':isPos?'+':'-'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Donut egresos */}
        <div style={{...glassCard({padding:'20px 22px'})}}>
          <div style={{fontSize:11,fontWeight:700,color:d.muted,textTransform:'uppercase',
            letterSpacing:'0.08em',marginBottom:16}}>
            Egresos por categoría
          </div>
          <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:16}}>
            <DonutChart segments={donutSegments} size={110}/>
            <div style={{flex:1,display:'flex',flexDirection:'column',gap:6}}>
              {donutSegments.slice(0,4).map((s,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:6}}>
                  <div style={{display:'flex',alignItems:'center',gap:5}}>
                    <div style={{width:6,height:6,borderRadius:'50%',background:s.color,flexShrink:0}}/>
                    <span style={{fontSize:10,color:d.muted,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:80}}>{s.label}</span>
                  </div>
                  <span style={{fontSize:10,fontWeight:700,color:s.color,fontFamily:"'Space Mono',monospace",flexShrink:0}}>{fmtShort(s.value)}</span>
                </div>
              ))}
            </div>
          </div>
          {donutSegments.length===0 && (
            <div style={{textAlign:'center',padding:'20px 0',color:d.sub,fontSize:12}}>Sin egresos en el período</div>
          )}
        </div>
      </div>

      {/* ── DESGLOSE DETALLADO ── */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>

        {/* Ingresos detalle */}
        <div style={{...glassCard({padding:'20px 22px'})}}>
          <div style={{fontSize:11,fontWeight:700,color:d.muted,textTransform:'uppercase',
            letterSpacing:'0.08em',marginBottom:14}}>
            💰 Detalle de ingresos
          </div>
          {filtInv.length===0 ? (
            <div style={{textAlign:'center',padding:'24px 0',color:d.sub,fontSize:12}}>Sin facturas en el período</div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {filtInv.slice(0,8).map(inv=>(
                <div key={inv.id} style={{display:'flex',justifyContent:'space-between',
                  alignItems:'center',padding:'8px 10px',borderRadius:10,
                  background:'rgba(34,197,94,0.05)',border:'1px solid rgba(34,197,94,0.1)'}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:d.text2,
                      overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:160}}>
                      {inv.client_name}
                    </div>
                    <div style={{fontSize:10,color:d.sub}}>
                      {new Date((inv.date||'')+'T12:00:00').toLocaleDateString('es-AR',{day:'2-digit',month:'short'})}
                    </div>
                  </div>
                  <span style={{fontSize:13,fontWeight:800,color:d.lime,
                    fontFamily:"'Space Mono',monospace",flexShrink:0}}>{fmtShort(inv.total)}</span>
                </div>
              ))}
              {filtInv.length>8 && (
                <div style={{fontSize:11,color:d.sub,textAlign:'center',padding:'4px 0'}}>
                  +{filtInv.length-8} más...
                </div>
              )}
              <div style={{display:'flex',justifyContent:'space-between',
                padding:'10px 10px 4px',borderTop:'1px solid rgba(255,255,255,0.06)',marginTop:4}}>
                <span style={{fontSize:12,color:d.muted,fontWeight:700}}>Total</span>
                <span style={{fontSize:15,fontWeight:900,color:d.lime,
                  fontFamily:"'Space Mono',monospace"}}>{fmtARS(kpis.ingresos)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Egresos detalle por categoría */}
        <div style={{...glassCard({padding:'20px 22px'})}}>
          <div style={{fontSize:11,fontWeight:700,color:d.muted,textTransform:'uppercase',
            letterSpacing:'0.08em',marginBottom:14}}>
            💸 Egresos por categoría
          </div>
          {byCategory.length===0 ? (
            <div style={{textAlign:'center',padding:'24px 0',color:d.sub,fontSize:12}}>Sin compras en el período</div>
          ) : (
            <>
              {byCategory.map(([key,val])=>{
                const meta = CAT_META[key]||{label:key,icon:'📎',color:'#666'}
                return (
                  <CategoryRow key={key} label={meta.label} icon={meta.icon}
                    color={meta.color} amount={val.total} total={kpis.egresos} count={val.count}/>
                )
              })}
              <div style={{display:'flex',justifyContent:'space-between',
                padding:'10px 0 0',borderTop:'1px solid rgba(255,255,255,0.06)',marginTop:8}}>
                <span style={{fontSize:12,color:d.muted,fontWeight:700}}>Total egresos</span>
                <span style={{fontSize:15,fontWeight:900,color:d.rose,
                  fontFamily:"'Space Mono',monospace"}}>{fmtARS(kpis.egresos)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── TABLA MENSUAL RESUMEN ── */}
      <div style={{...glassCard({padding:'20px 22px'})}}>
        <div style={{fontSize:11,fontWeight:700,color:d.muted,textTransform:'uppercase',
          letterSpacing:'0.08em',marginBottom:14}}>
          Resumen mensual {selYear}
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
                {['Mes','Ingresos','Egresos','Resultado','Rentab.'].map(h=>(
                  <th key={h} style={{padding:'8px 12px',textAlign:h==='Mes'?'left':'right',
                    fontSize:10,fontWeight:700,color:d.sub,textTransform:'uppercase',
                    letterSpacing:'0.07em'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((m,i)=>{
                const isEmpty = m.ingresos===0 && m.egresos===0
                const rent = m.ingresos>0 ? (m.resultado/m.ingresos*100).toFixed(1) : null
                const isCurrentMonth = i===selMonth && period!=='total'
                return (
                  <tr key={i} style={{
                    borderBottom:'1px solid rgba(255,255,255,0.04)',
                    background:isCurrentMonth?'rgba(255,255,255,0.04)':isEmpty?'transparent':'transparent',
                    opacity:isEmpty?0.4:1,
                  }}>
                    <td style={{padding:'9px 12px',color:isCurrentMonth?d.lime:d.text2,
                      fontWeight:isCurrentMonth?800:400}}>{MONTHS_FULL[i]}</td>
                    <td style={{padding:'9px 12px',textAlign:'right',color:d.lime,
                      fontFamily:"'Space Mono',monospace",fontWeight:600}}>{isEmpty?'—':fmtShort(m.ingresos)}</td>
                    <td style={{padding:'9px 12px',textAlign:'right',color:d.rose,
                      fontFamily:"'Space Mono',monospace",fontWeight:600}}>{isEmpty?'—':fmtShort(m.egresos)}</td>
                    <td style={{padding:'9px 12px',textAlign:'right',
                      color:m.resultado>=0?d.lime:d.rose,
                      fontFamily:"'Space Mono',monospace",fontWeight:800}}>
                      {isEmpty?'—':(m.resultado>=0?'+':'')+fmtShort(m.resultado)}
                    </td>
                    <td style={{padding:'9px 12px',textAlign:'right',
                      color:!rent?d.sub:parseFloat(rent)>=15?d.lime:parseFloat(rent)>=5?d.amber:d.rose,
                      fontFamily:"'Space Mono',monospace",fontWeight:rent?700:400}}>
                      {rent?`${rent}%`:'—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{borderTop:'1px solid rgba(255,255,255,0.1)'}}>
                <td style={{padding:'10px 12px',fontWeight:800,color:d.text}}>Total {selYear}</td>
                <td style={{padding:'10px 12px',textAlign:'right',fontWeight:900,color:d.lime,
                  fontFamily:"'Space Mono',monospace"}}>{fmtShort(monthlyData.reduce((s,m)=>s+m.ingresos,0))}</td>
                <td style={{padding:'10px 12px',textAlign:'right',fontWeight:900,color:d.rose,
                  fontFamily:"'Space Mono',monospace"}}>{fmtShort(monthlyData.reduce((s,m)=>s+m.egresos,0))}</td>
                {(() => {
                  const totRes = monthlyData.reduce((s,m)=>s+m.resultado,0)
                  return <td style={{padding:'10px 12px',textAlign:'right',fontWeight:900,
                    color:totRes>=0?d.lime:d.rose,fontFamily:"'Space Mono',monospace"}}>
                    {(totRes>=0?'+':'')+fmtShort(totRes)}
                  </td>
                })()}
                {(() => {
                  const totIng = monthlyData.reduce((s,m)=>s+m.ingresos,0)
                  const totRes = monthlyData.reduce((s,m)=>s+m.resultado,0)
                  const rent = totIng>0?(totRes/totIng*100).toFixed(1):null
                  return <td style={{padding:'10px 12px',textAlign:'right',fontWeight:900,
                    color:!rent?d.sub:parseFloat(rent)>=15?d.lime:parseFloat(rent)>=5?d.amber:d.rose,
                    fontFamily:"'Space Mono',monospace"}}>
                    {rent?`${rent}%`:'—'}
                  </td>
                })()}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
