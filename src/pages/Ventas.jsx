import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../supabase'

// ── DARK COSMOS THEME ─────────────────────────────────────────────────────────
const d = {
  bg:        'linear-gradient(160deg,#050510 0%,#080818 40%,#050510 100%)',
  glass:     'rgba(255,255,255,0.04)',
  glassMid:  'rgba(255,255,255,0.07)',
  glassHov:  'rgba(255,255,255,0.10)',
  border:    'rgba(255,255,255,0.07)',
  border2:   'rgba(255,255,255,0.12)',
  text:      '#F0EFFF',
  text2:     '#C8C6E0',
  muted:     '#8884A8',
  sub:       '#4A4870',
  orange:    '#E8860A',
  orangeL:   '#F5A623',
  orangeDim: 'rgba(232,134,10,0.12)',
  lime:      '#22C55E',
  rose:      '#F43F5E',
  blue:      '#3B82F6',
  violet:    '#8B5CF6',
  amber:     '#F59E0B',
  cyan:      '#06B6D4',
  shadow:    '0 4px 24px rgba(0,0,0,0.5)',
  shadowLg:  '0 16px 64px rgba(0,0,0,0.7)',
}

const STATUSES = [
  { key:'CONSULTA',       label:'Consulta',       color:'#8884A8', icon:'💬', next:'PRESUPUESTADO' },
  { key:'PRESUPUESTADO',  label:'Presupuestado',  color:'#3B82F6', icon:'📋', next:'OC_RECIBIDA'   },
  { key:'OC_RECIBIDA',    label:'OC Recibida',    color:'#8B5CF6', icon:'📄', next:'FACTURADO'     },
  { key:'FACTURADO',      label:'Facturado',      color:'#F59E0B', icon:'🧾', next:'COBRADO'       },
  { key:'COBRADO',        label:'Cobrado',        color:'#06B6D4', icon:'💰', next:'EN_ENTREGA'    },
  { key:'EN_ENTREGA',     label:'En entrega',     color:'#E8860A', icon:'🚚', next:'CERRADO'       },
  { key:'CERRADO',        label:'Cerrado',        color:'#22C55E', icon:'✅', next:null             },
]

const SATISFACTION = [
  { key:'CONFLICTO',  label:'Conflicto',  icon:'😤', color:'#F43F5E' },
  { key:'NEUTRO',     label:'Neutro',     icon:'😐', color:'#8884A8' },
  { key:'CONFORME',   label:'Conforme',   icon:'🙂', color:'#3B82F6' },
  { key:'SATISFECHO', label:'Satisfecho', icon:'😊', color:'#22C55E' },
  { key:'EXCELENTE',  label:'Excelente',  icon:'🌟', color:'#F59E0B' },
]

const fmtARS   = n => `$${(parseFloat(n)||0).toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2})}`
const fmtShort = n => { const v=parseFloat(n)||0; return v>=1e6?`$${(v/1e6).toFixed(1)}M`:v>=1e3?`$${(v/1e3).toFixed(0)}k`:fmtARS(v) }
const fmtDate  = d => { if(!d) return '—'; return new Date(d+'T12:00:00').toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'2-digit'}) }
const today    = () => new Date().toISOString().split('T')[0]
const getSt    = key => STATUSES.find(s=>s.key===key)||STATUSES[0]
const getSat   = key => SATISFACTION.find(s=>s.key===key)

const glassCard = (extra={}) => ({
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(24px) saturate(160%)',
  WebkitBackdropFilter: 'blur(24px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderTop: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 18,
  boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
  ...extra,
})

// ── KPI CARD ──────────────────────────────────────────────────────────────────
function KpiCard({ value, label, color, icon, sub, onClick }) {
  const [hov, setHov] = useState(false)
  const ref = useRef()
  const onMove = e => {
    const rc = ref.current?.getBoundingClientRect()
    if(!rc) return
    ref.current.style.setProperty('--sx',`${((e.clientX-rc.left)/rc.width)*100}%`)
    ref.current.style.setProperty('--sy',`${((e.clientY-rc.top)/rc.height)*100}%`)
  }
  return (
    <div ref={ref} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      onMouseMove={onMove} onClick={onClick}
      style={{
        ...glassCard({padding:'18px 20px'}), flex:'1 1 0', minWidth:120,
        cursor: onClick?'pointer':'default',
        border: hov?`1px solid ${color}44`:'1px solid rgba(255,255,255,0.07)',
        borderTop: hov?`1px solid ${color}77`:'1px solid rgba(255,255,255,0.14)',
        boxShadow: hov?`0 12px 40px ${color}22, inset 0 1px 0 rgba(255,255,255,0.12)`:d.shadow,
        transform: hov?'translateY(-5px) scale(1.03)':'none',
        transition:'all 0.3s cubic-bezier(0.34,1.4,0.64,1)',
        position:'relative', overflow:'hidden',
      }}>
      <div style={{position:'absolute',inset:0,borderRadius:18,pointerEvents:'none',
        background:`radial-gradient(circle 90px at var(--sx,50%) var(--sy,50%),${color}18,transparent 70%)`}}/>
      <div style={{position:'absolute',top:0,left:'10%',right:'10%',height:1,
        background:`linear-gradient(90deg,transparent,${hov?color+'77':'rgba(255,255,255,0.1)'},transparent)`}}/>
      <div style={{fontSize:18,marginBottom:6,opacity:hov?1:0.5,transition:'opacity 0.2s'}}>{icon}</div>
      <div style={{fontSize:24,fontWeight:900,color,fontFamily:"'Space Mono',monospace",
        textShadow:hov?`0 0 24px ${color}66`:'none',transition:'text-shadow 0.3s',letterSpacing:'-0.5px'}}>
        {value}
      </div>
      <div style={{fontSize:11,color:d.muted,marginTop:4,fontWeight:600}}>{label}</div>
      {sub&&<div style={{fontSize:10,color:d.sub,marginTop:2}}>{sub}</div>}
    </div>
  )
}

// ── PIPELINE VISUAL ───────────────────────────────────────────────────────────
function Pipeline({ operations }) {
  return (
    <div style={{...glassCard({padding:'16px 20px'}),marginBottom:16}}>
      <div style={{fontSize:10,fontWeight:700,color:d.muted,textTransform:'uppercase',
        letterSpacing:'0.08em',marginBottom:12}}>Pipeline de ventas</div>
      <div style={{display:'flex',gap:4,alignItems:'stretch'}}>
        {STATUSES.map((st,i) => {
          const count = operations.filter(o=>o.status===st.key).length
          const total = operations.filter(o=>o.status===st.key).reduce((s,o)=>s+(o.total_venta||0),0)
          return (
            <div key={st.key} style={{flex:1,textAlign:'center',position:'relative'}}>
              {/* Connector line */}
              {i < STATUSES.length-1 && (
                <div style={{position:'absolute',right:0,top:'50%',transform:'translateY(-50%)',
                  width:4,height:1,background:'rgba(255,255,255,0.1)',zIndex:1}}/>
              )}
              <div style={{
                padding:'10px 4px',borderRadius:10,
                background: count>0 ? `${st.color}18` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${count>0 ? st.color+'33' : 'rgba(255,255,255,0.05)'}`,
                transition:'all 0.2s',
              }}>
                <div style={{fontSize:16,marginBottom:4}}>{st.icon}</div>
                <div style={{fontSize:18,fontWeight:900,color:count>0?st.color:d.sub,
                  fontFamily:"'Space Mono',monospace"}}>{count}</div>
                <div style={{fontSize:8,color:d.muted,marginTop:2,lineHeight:1.2}}>{st.label}</div>
                {total>0&&<div style={{fontSize:8,color:st.color,marginTop:3,fontWeight:700}}>{fmtShort(total)}</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── OPERATION CARD ────────────────────────────────────────────────────────────
function OperationCard({ op, onClick }) {
  const [hov, setHov] = useState(false)
  const st  = getSt(op.status)
  const sat = getSat(op.satisfaction)
  const rent = op.total_venta>0 ? ((op.ganancia||0)/op.total_venta*100).toFixed(1) : null
  const rentColor = rent>=15 ? d.lime : rent>=5 ? d.amber : d.rose

  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        ...glassCard({padding:0,overflow:'hidden'}),
        cursor:'pointer',
        border: hov ? `1px solid ${st.color}44` : '1px solid rgba(255,255,255,0.07)',
        borderTop: hov ? `1px solid ${st.color}66` : '1px solid rgba(255,255,255,0.14)',
        borderLeft: `3px solid ${hov ? st.color : 'transparent'}`,
        transform: hov ? 'translateX(4px)' : 'none',
        boxShadow: hov ? `0 8px 32px ${st.color}18, inset 0 1px 0 rgba(255,255,255,0.1)` : d.shadow,
        transition: 'all 0.2s cubic-bezier(0.34,1.2,0.64,1)',
      }}>
      {/* Top shimmer */}
      <div style={{height:1,background:`linear-gradient(90deg,transparent,${hov?st.color+'55':'rgba(255,255,255,0.06)'},transparent)`}}/>

      <div style={{padding:'14px 18px',display:'flex',alignItems:'center',gap:16}}>
        {/* Number + Status */}
        <div style={{flexShrink:0,textAlign:'center',width:52}}>
          <div style={{fontSize:11,color:d.sub,fontWeight:700,fontFamily:"'Space Mono',monospace"}}>
            OP-{String(op.number).padStart(3,'0')}
          </div>
          <div style={{marginTop:6,fontSize:20}}>{st.icon}</div>
          <div style={{fontSize:8,color:st.color,fontWeight:700,marginTop:2,
            textTransform:'uppercase',letterSpacing:'0.05em'}}>{st.label}</div>
        </div>

        {/* Divider */}
        <div style={{width:1,height:60,background:'rgba(255,255,255,0.06)',flexShrink:0}}/>

        {/* Main info */}
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
            <div style={{fontSize:14,fontWeight:800,color:d.text,overflow:'hidden',
              textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              {op.name || op.client_name}
            </div>
            {sat && <span style={{fontSize:16,flexShrink:0}}>{sat.icon}</span>}
          </div>
          <div style={{fontSize:11,color:d.muted}}>{op.client_name}</div>
          <div style={{display:'flex',gap:10,marginTop:6,flexWrap:'wrap'}}>
            {op.quote_number && (
              <span style={{fontSize:9,padding:'2px 7px',borderRadius:8,
                background:'rgba(59,130,246,0.12)',color:'#3B82F6',fontWeight:700}}>
                P-{String(op.quote_number).padStart(4,'0')}
              </span>
            )}
            {op.invoice_number && (
              <span style={{fontSize:9,padding:'2px 7px',borderRadius:8,
                background:'rgba(232,134,10,0.12)',color:d.orange,fontWeight:700}}>
                F-{String(op.invoice_number).padStart(6,'0')}
              </span>
            )}
            <span style={{fontSize:9,color:d.sub}}>{fmtDate(op.date)}</span>
          </div>
        </div>

        {/* Financials */}
        <div style={{flexShrink:0,textAlign:'right',display:'flex',flexDirection:'column',gap:4}}>
          <div style={{fontSize:16,fontWeight:900,color:d.orangeL,
            fontFamily:"'Space Mono',monospace"}}>{fmtShort(op.total_venta)}</div>
          {op.total_costos>0 && (
            <div style={{fontSize:11,color:d.muted}}>
              costo {fmtShort(op.total_costos)}
            </div>
          )}
          {rent!==null && (
            <div style={{fontSize:12,fontWeight:800,color:rentColor,
              fontFamily:"'Space Mono',monospace"}}>{rent}% rent.</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── MODAL OPERACION ────────────────────────────────────────────────────────────
function OperationModal({ initial, quotes, invoices, purchases, clients, onClose, onSaved }) {
  const isEdit = !!initial?.id
  const [form, setForm] = useState(initial ? {...initial} : {
    name:'', client_id:null, client_name:'', client_cuit:'',
    quote_id:null, quote_number:null, invoice_id:null, invoice_number:null,
    status:'CONSULTA', date:today(), satisfaction:null, notes:'',
    oc_url:'', oc_number:'', total_venta:0, total_costos:0, ganancia:0, rentabilidad:0,
  })
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('expediente')
  const [clientQ, setClientQ] = useState(initial?.client_name||'')
  const [clientResults, setClientResults] = useState([])

  // Compras vinculadas a esta operación
  const linkedPurchases = useMemo(()=>
    purchases.filter(p=>p.operation_id===initial?.id)
  ,[purchases, initial?.id])

  const totalCostos = useMemo(()=>
    linkedPurchases.reduce((s,p)=>s+(p.total||0),0)
  ,[linkedPurchases])

  const ganancia = useMemo(()=>
    (parseFloat(form.total_venta)||0) - totalCostos
  ,[form.total_venta, totalCostos])

  const rentabilidad = useMemo(()=>
    form.total_venta>0 ? (ganancia/(parseFloat(form.total_venta)||1)*100).toFixed(2) : 0
  ,[ganancia, form.total_venta])

  useEffect(()=>{
    const fn=e=>{if(e.key==='Escape')onClose()}
    window.addEventListener('keydown',fn)
    return()=>window.removeEventListener('keydown',fn)
  },[onClose])

  // Client search
  useEffect(()=>{
    const t=setTimeout(async()=>{
      if(!clientQ.trim()){setClientResults([]);return}
      const{data}=await supabase.from('clients').select('id,name,cuit').ilike('name',`%${clientQ}%`).limit(6)
      setClientResults(data||[])
    },200)
    return()=>clearTimeout(t)
  },[clientQ])

  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  // Auto-fill from quote
  const selectQuote = (q) => {
    set('quote_id', q.id)
    set('quote_number', q.number)
    set('total_venta', q.total||0)
    if(q.client_name && !form.client_name) set('client_name', q.client_name)
    if(q.client_id && !form.client_id) set('client_id', q.client_id)
  }

  // Auto-fill from invoice
  const selectInvoice = (inv) => {
    set('invoice_id', inv.id)
    set('invoice_number', inv.number)
    set('total_venta', inv.total||form.total_venta)
  }

  const save = async () => {
    if(!form.client_name?.trim()) return
    setSaving(true)
    const payload = {
      ...form,
      total_costos: totalCostos,
      ganancia,
      rentabilidad: parseFloat(rentabilidad),
      updated_at: new Date(),
    }
    ;['total_venta','total_costos','ganancia','rentabilidad'].forEach(k=>{payload[k]=Number(payload[k])||0})
    ;['client_id','quote_id','invoice_id'].forEach(k=>{if(!payload[k])payload[k]=null})
    try {
      if(isEdit) {
        await supabase.from('operations').update(payload).eq('id',initial.id)
        // Update linked quote
        if(form.quote_id) await supabase.from('quotes').update({operation_id:initial.id}).eq('id',form.quote_id)
        // Update linked invoice
        if(form.invoice_id) await supabase.from('invoices').update({operation_id:initial.id}).eq('id',form.invoice_id)
      } else {
        const{data}=await supabase.from('operations').insert(payload).select()
        const newId=data?.[0]?.id
        if(newId){
          if(form.quote_id) await supabase.from('quotes').update({operation_id:newId}).eq('id',form.quote_id)
          if(form.invoice_id) await supabase.from('invoices').update({operation_id:newId}).eq('id',form.invoice_id)
        }
      }
      await onSaved()
      onClose()
    } catch(e){console.error(e)}
    setSaving(false)
  }

  const st = getSt(form.status)
  const TABS = [
    {key:'expediente', label:'📁 Expediente'},
    {key:'documentos',  label:'📎 Documentos'},
    {key:'costos',      label:'💸 Costos'},
    {key:'resultado',   label:'📊 Resultado'},
  ]

  const inp = (key,ph,type='text') => (
    <input value={form[key]||''} onChange={e=>set(key,e.target.value)} type={type} placeholder={ph}
      style={{width:'100%',padding:'9px 13px',borderRadius:10,border:'1px solid rgba(255,255,255,0.1)',
        background:'rgba(255,255,255,0.05)',color:d.text,fontSize:13,outline:'none',boxSizing:'border-box'}}/>
  )

  const lbl = t => <div style={{fontSize:10,fontWeight:700,color:d.muted,marginBottom:5,
    textTransform:'uppercase',letterSpacing:'0.08em'}}>{t}</div>

  const rentColor = parseFloat(rentabilidad)>=15?d.lime:parseFloat(rentabilidad)>=5?d.amber:d.rose

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:1000,
      background:'rgba(0,0,0,0.75)',backdropFilter:'blur(16px)',
      display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:'100%',maxWidth:760,maxHeight:'92vh',display:'flex',flexDirection:'column',
        background:'rgba(8,8,24,0.97)',backdropFilter:'blur(40px)',
        border:'1px solid rgba(255,255,255,0.1)',borderTop:'1px solid rgba(255,255,255,0.2)',
        borderRadius:24,boxShadow:'0 40px 120px rgba(0,0,0,0.8)',overflow:'hidden',
      }}>
        {/* Header */}
        <div style={{padding:'20px 24px 0',flexShrink:0,
          background:`linear-gradient(180deg,${st.color}08,transparent)`}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:44,height:44,borderRadius:14,
                background:`linear-gradient(135deg,${st.color}33,${st.color}11)`,
                border:`1px solid ${st.color}44`,
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>
                {st.icon}
              </div>
              <div>
                <h3 style={{margin:0,fontSize:17,fontWeight:900,color:d.text,
                  fontFamily:"'Syne',sans-serif"}}>
                  {isEdit ? `OP-${String(form.number).padStart(3,'0')} — ${form.client_name}` : 'Nueva operación'}
                </h3>
                <div style={{fontSize:11,color:d.muted,marginTop:2}}>
                  {isEdit ? fmtDate(form.date) : 'Expediente de venta completo'}
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',
              fontSize:22,color:d.muted,lineHeight:1}}>×</button>
          </div>

          {/* Status pipeline */}
          <div style={{display:'flex',gap:4,marginBottom:14,overflowX:'auto'}}>
            {STATUSES.map(s=>(
              <button key={s.key} onClick={()=>set('status',s.key)}
                style={{flex:'1 1 0',minWidth:60,padding:'7px 4px',borderRadius:10,cursor:'pointer',
                  border:`1px solid ${s.color}${form.status===s.key?'66':'22'}`,
                  background:form.status===s.key?`${s.color}22`:`${s.color}08`,
                  color:form.status===s.key?s.color:d.sub,
                  fontWeight:form.status===s.key?700:400,
                  fontSize:9,textAlign:'center',transition:'all 0.2s',
                  textTransform:'uppercase',letterSpacing:'0.04em'}}>
                <div style={{fontSize:14,marginBottom:2}}>{s.icon}</div>
                {s.label}
              </button>
            ))}
          </div>

          {/* Tabs */}
          <div style={{display:'flex',gap:2,borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
            {TABS.map(t=>(
              <button key={t.key} onClick={()=>setTab(t.key)}
                style={{padding:'8px 14px',fontSize:12,fontWeight:600,cursor:'pointer',
                  border:'none',background:'none',whiteSpace:'nowrap',
                  color:tab===t.key?d.orangeL:d.muted,
                  borderBottom:`2px solid ${tab===t.key?d.orangeL:'transparent'}`,
                  transition:'all 0.2s',marginBottom:-1}}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{flex:1,overflowY:'auto',padding:'20px 24px',display:'flex',flexDirection:'column',gap:14}}>

          {/* ── EXPEDIENTE ── */}
          {tab==='expediente' && (
            <>
              <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:12}}>
                <div>
                  {lbl('Nombre de la operación')}
                  {inp('name','Ej: Mameluco ignífugo YPFB — Junio 2026')}
                </div>
                <div>
                  {lbl('Fecha')}
                  {inp('date','','date')}
                </div>
              </div>

              {/* Cliente */}
              <div style={{position:'relative'}}>
                {lbl('Cliente *')}
                <input value={clientQ} onChange={e=>{setClientQ(e.target.value);set('client_name',e.target.value)}}
                  placeholder="Buscar cliente..."
                  style={{width:'100%',padding:'9px 13px',borderRadius:10,
                    border:`1px solid ${form.client_id?d.orangeL+'66':'rgba(255,255,255,0.1)'}`,
                    background:'rgba(255,255,255,0.05)',color:d.text,fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                {clientResults.length>0 && (
                  <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:10,
                    background:'rgba(8,8,24,0.98)',border:'1px solid rgba(255,255,255,0.1)',
                    borderRadius:10,overflow:'hidden',boxShadow:d.shadowLg,marginTop:4}}>
                    {clientResults.map(cl=>(
                      <div key={cl.id} onMouseDown={()=>{
                        set('client_id',cl.id);set('client_name',cl.name);set('client_cuit',cl.cuit||'')
                        setClientQ(cl.name);setClientResults([])}}
                        style={{padding:'10px 14px',cursor:'pointer',borderBottom:'1px solid rgba(255,255,255,0.05)',
                          display:'flex',justifyContent:'space-between'}}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.06)'}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <span style={{fontSize:13,color:d.text}}>{cl.name}</span>
                        <span style={{fontSize:11,color:d.muted}}>{cl.cuit}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Vincular presupuesto */}
              <div>
                {lbl('Presupuesto STEPS vinculado')}
                <select value={form.quote_id||''} onChange={e=>{
                  const q=quotes.find(x=>x.id===e.target.value)
                  if(q) selectQuote(q); else{set('quote_id',null);set('quote_number',null)}}}
                  style={{width:'100%',padding:'9px 13px',borderRadius:10,
                    border:`1px solid ${form.quote_id?d.blue+'55':'rgba(255,255,255,0.1)'}`,
                    background:'rgba(8,8,24,0.9)',color:d.text,fontSize:13,outline:'none'}}>
                  <option value="">— Sin vincular —</option>
                  {quotes.filter(q=>q.status==='APROBADO'||q.id===form.quote_id).map(q=>(
                    <option key={q.id} value={q.id}>
                      P-{String(q.number).padStart(4,'0')} · {q.client_name} · {fmtShort(q.total)}
                    </option>
                  ))}
                </select>
                {form.quote_id && <div style={{fontSize:10,color:d.blue,marginTop:4}}>✓ Total de venta tomado del presupuesto</div>}
              </div>

              {/* Vincular factura */}
              <div>
                {lbl('Factura STEPS vinculada')}
                <select value={form.invoice_id||''} onChange={e=>{
                  const inv=invoices.find(x=>x.id===e.target.value)
                  if(inv) selectInvoice(inv); else{set('invoice_id',null);set('invoice_number',null)}}}
                  style={{width:'100%',padding:'9px 13px',borderRadius:10,
                    border:`1px solid ${form.invoice_id?d.orange+'55':'rgba(255,255,255,0.1)'}`,
                    background:'rgba(8,8,24,0.9)',color:d.text,fontSize:13,outline:'none'}}>
                  <option value="">— Sin vincular —</option>
                  {invoices.map(inv=>(
                    <option key={inv.id} value={inv.id}>
                      F{inv.tipo||'A'} {String(inv.number||0).padStart(6,'0')} · {inv.client_name} · {fmtShort(inv.total)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Total venta manual si no hay presupuesto */}
              {!form.quote_id && (
                <div>
                  {lbl('Total de venta (manual)')}
                  <input type="number" value={form.total_venta||''} onChange={e=>set('total_venta',e.target.value)}
                    placeholder="0"
                    style={{width:'100%',padding:'9px 13px',borderRadius:10,
                      border:'1px solid rgba(255,255,255,0.1)',
                      background:'rgba(255,255,255,0.05)',color:d.orangeL,fontSize:16,
                      fontWeight:900,outline:'none',boxSizing:'border-box',
                      fontFamily:"'Space Mono',monospace",textAlign:'right'}}/>
                </div>
              )}

              {/* Satisfaction */}
              {form.status==='CERRADO' && (
                <div>
                  {lbl('Satisfacción del cliente')}
                  <div style={{display:'flex',gap:8}}>
                    {SATISFACTION.map(s=>(
                      <button key={s.key} onClick={()=>set('satisfaction',s.key)}
                        style={{flex:1,padding:'10px 4px',borderRadius:12,cursor:'pointer',
                          border:`1px solid ${form.satisfaction===s.key?s.color+'66':'rgba(255,255,255,0.1)'}`,
                          background:form.satisfaction===s.key?`${s.color}22`:'transparent',
                          transition:'all 0.2s',textAlign:'center'}}>
                        <div style={{fontSize:22}}>{s.icon}</div>
                        <div style={{fontSize:9,color:form.satisfaction===s.key?s.color:d.muted,
                          marginTop:4,fontWeight:700}}>{s.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                {lbl('Notas internas')}
                <textarea value={form.notes||''} onChange={e=>set('notes',e.target.value)}
                  placeholder="Observaciones de la operación..." rows={3}
                  style={{width:'100%',padding:'9px 13px',borderRadius:10,
                    border:'1px solid rgba(255,255,255,0.1)',
                    background:'rgba(255,255,255,0.05)',color:d.text,fontSize:13,
                    outline:'none',resize:'vertical',boxSizing:'border-box'}}/>
              </div>
            </>
          )}

          {/* ── DOCUMENTOS ── */}
          {tab==='documentos' && (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {[
                {title:'Del cliente',items:[
                  {icon:'📋',label:'Presupuesto STEPS',value:form.quote_number?`P-${String(form.quote_number).padStart(4,'0')}`:'No vinculado',color:d.blue},
                  {icon:'📄',label:'Orden de Compra N°',key:'oc_number',ph:'Nro. de OC'},
                  {icon:'🔗',label:'Link OC / Drive',key:'oc_url',ph:'https://...'},
                  {icon:'🧾',label:'Factura STEPS',value:form.invoice_number?`F-${String(form.invoice_number).padStart(6,'0')}`:'No vinculada',color:d.orange},
                  {icon:'📋',label:'Remito al cliente',key:'remito_cliente',ph:'Link o referencia'},
                ]},
                {title:'De proveedores',items:[
                  {icon:'🧾',label:'Factura proveedor',value:`${linkedPurchases.filter(p=>p.type==='FACTURA').length} registrada/s`,color:d.lime},
                  {icon:'📋',label:'Remito proveedor',key:'remito_proveedor',ph:'Link o referencia'},
                  {icon:'💳',label:'Comprobante de pago',key:'comprobante_pago',ph:'Link o referencia'},
                ]},
              ].map(section=>(
                <div key={section.title} style={{...glassCard({padding:'16px 18px'})}}>
                  <div style={{fontSize:10,fontWeight:700,color:d.muted,textTransform:'uppercase',
                    letterSpacing:'0.08em',marginBottom:12}}>{section.title}</div>
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {section.items.map(item=>(
                      <div key={item.label} style={{display:'flex',alignItems:'center',gap:10}}>
                        <span style={{fontSize:16,flexShrink:0}}>{item.icon}</span>
                        <span style={{fontSize:12,color:d.muted,width:160,flexShrink:0}}>{item.label}</span>
                        {item.key ? (
                          <input value={form[item.key]||''} onChange={e=>set(item.key,e.target.value)}
                            placeholder={item.ph}
                            style={{flex:1,padding:'6px 10px',borderRadius:8,
                              border:'1px solid rgba(255,255,255,0.08)',
                              background:'rgba(255,255,255,0.04)',color:d.text,fontSize:12,outline:'none'}}/>
                        ) : (
                          <span style={{fontSize:12,color:item.color||d.text2,fontWeight:700}}>{item.value}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── COSTOS ── */}
          {tab==='costos' && (
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <div style={{fontSize:11,color:d.muted,fontStyle:'italic',marginBottom:4}}>
                Los costos se calculan desde las compras vinculadas a esta operación en el módulo Compras.
              </div>
              {linkedPurchases.length===0 ? (
                <div style={{textAlign:'center',padding:'40px 0',color:d.muted}}>
                  <div style={{fontSize:32,marginBottom:8,opacity:0.3}}>💸</div>
                  <div>No hay compras vinculadas a esta operación</div>
                  <div style={{fontSize:11,marginTop:4,color:d.sub}}>
                    Andá a Compras → registrá la factura del proveedor → vinculala a esta operación
                  </div>
                </div>
              ) : (
                <>
                  {linkedPurchases.map(p=>(
                    <div key={p.id} style={{...glassCard({padding:'12px 16px'}),
                      display:'flex',alignItems:'center',gap:12,borderLeft:`3px solid ${p.category==='TRANSPORTE'?d.amber:d.rose}`}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:700,color:d.text}}>{p.supplier_name}</div>
                        <div style={{fontSize:10,color:d.muted,marginTop:2}}>{p.category} · {p.type}</div>
                      </div>
                      <div style={{fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:900,color:d.rose}}>
                        {fmtARS(p.total)}
                      </div>
                    </div>
                  ))}
                  <div style={{...glassCard({padding:'12px 16px'}),
                    display:'flex',justifyContent:'space-between',alignItems:'center',
                    background:'rgba(244,63,94,0.06)',border:'1px solid rgba(244,63,94,0.2)'}}>
                    <span style={{fontSize:13,fontWeight:700,color:d.text}}>Total costos</span>
                    <span style={{fontFamily:"'Space Mono',monospace",fontSize:16,fontWeight:900,color:d.rose}}>
                      {fmtARS(totalCostos)}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── RESULTADO ── */}
          {tab==='resultado' && (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {[
                {label:'Total de venta',value:fmtARS(form.total_venta||0),color:d.orangeL,big:false},
                {label:'Total costos',value:fmtARS(totalCostos),color:d.rose,big:false},
              ].map(row=>(
                <div key={row.label} style={{...glassCard({padding:'14px 18px'}),
                  display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:13,color:d.muted}}>{row.label}</span>
                  <span style={{fontFamily:"'Space Mono',monospace",fontSize:row.big?20:15,
                    fontWeight:900,color:row.color}}>{row.value}</span>
                </div>
              ))}

              <div style={{height:1,background:'rgba(255,255,255,0.06)'}}/>

              {/* Ganancia */}
              <div style={{...glassCard({padding:'20px 22px'}),
                background: ganancia>=0?'rgba(34,197,94,0.06)':'rgba(244,63,94,0.06)',
                border:`1px solid ${ganancia>=0?d.lime+'33':d.rose+'33'}`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:16}}>
                  <div>
                    <div style={{fontSize:11,color:d.muted,textTransform:'uppercase',fontWeight:700,marginBottom:4}}>
                      Ganancia bruta real
                    </div>
                    <div style={{fontSize:28,fontWeight:900,color:ganancia>=0?d.lime:d.rose,
                      fontFamily:"'Space Mono',monospace"}}>{fmtARS(ganancia)}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:11,color:d.muted,textTransform:'uppercase',fontWeight:700,marginBottom:4}}>
                      Rentabilidad
                    </div>
                    <div style={{fontSize:40,fontWeight:900,color:rentColor,
                      fontFamily:"'Space Mono',monospace",lineHeight:1}}>{rentabilidad}%</div>
                  </div>
                </div>
                {/* Barra */}
                <div style={{height:8,borderRadius:8,background:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
                  <div style={{height:'100%',
                    width:`${Math.min(Math.max(parseFloat(rentabilidad),0),100)}%`,
                    background:`linear-gradient(90deg,${rentColor}88,${rentColor})`,
                    borderRadius:8,transition:'width 0.6s ease'}}/>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',marginTop:6}}>
                  <span style={{fontSize:9,color:d.sub}}>0%</span>
                  <span style={{fontSize:9,color:d.sub}}>15% objetivo</span>
                  <span style={{fontSize:9,color:d.sub}}>30%+</span>
                </div>
              </div>

              {/* Semáforo */}
              <div style={{...glassCard({padding:'14px 18px'}),
                display:'flex',alignItems:'center',gap:12}}>
                <span style={{fontSize:28}}>
                  {parseFloat(rentabilidad)>=15?'✅':parseFloat(rentabilidad)>=5?'⚠️':'❌'}
                </span>
                <div>
                  <div style={{fontSize:13,fontWeight:800,color:rentColor}}>
                    {parseFloat(rentabilidad)>=15?'Operación rentable':parseFloat(rentabilidad)>=5?'Margen bajo':'Pérdida'}
                  </div>
                  <div style={{fontSize:11,color:d.muted,marginTop:2}}>
                    {linkedPurchases.length===0?'Cargá las facturas de proveedores en Compras para ver la rentabilidad real':'Basado en compras vinculadas'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{padding:'16px 24px',borderTop:'1px solid rgba(255,255,255,0.06)',
          display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
          <div style={{display:'flex',gap:16,alignItems:'center'}}>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:9,color:d.muted,textTransform:'uppercase',fontWeight:700}}>Venta</div>
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:14,fontWeight:900,color:d.orangeL}}>
                {fmtShort(form.total_venta||0)}
              </div>
            </div>
            {totalCostos>0&&(
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:9,color:d.muted,textTransform:'uppercase',fontWeight:700}}>Costo</div>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:14,fontWeight:900,color:d.rose}}>
                  {fmtShort(totalCostos)}
                </div>
              </div>
            )}
            {totalCostos>0&&(
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:9,color:d.muted,textTransform:'uppercase',fontWeight:700}}>Rent.</div>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:14,fontWeight:900,color:rentColor}}>
                  {rentabilidad}%
                </div>
              </div>
            )}
          </div>
          <div style={{display:'flex',gap:10}}>
            <button onClick={onClose}
              style={{padding:'10px 20px',borderRadius:12,border:'1px solid rgba(255,255,255,0.1)',
                background:'transparent',color:d.muted,fontSize:13,cursor:'pointer',fontWeight:600}}>
              Cancelar
            </button>
            <button onClick={save} disabled={saving||!form.client_name}
              style={{padding:'10px 26px',borderRadius:12,border:'none',
                background:`linear-gradient(135deg,${d.orangeL},${d.orange})`,
                color:'#000',fontSize:13,fontWeight:800,cursor:saving?'not-allowed':'pointer',
                boxShadow:`0 4px 20px rgba(232,134,10,0.4)`,opacity:saving||!form.client_name?0.5:1,
                transition:'all 0.2s'}}>
              {saving?'Guardando...':isEdit?'Guardar cambios':'Crear operación'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function Ventas() {
  const [operations, setOperations] = useState([])
  const [quotes,     setQuotes]     = useState([])
  const [invoices,   setInvoices]   = useState([])
  const [purchases,  setPurchases]  = useState([])
  const [clients,    setClients]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [selected,   setSelected]   = useState(null)
  const [showModal,  setShowModal]  = useState(false)
  const [search,     setSearch]     = useState('')
  const [filterSt,   setFilterSt]   = useState('TODOS')

  const load = async () => {
    setLoading(true)
    const [oRes,qRes,iRes,pRes,cRes] = await Promise.all([
      supabase.from('operations').select('*').order('number',{ascending:false}),
      supabase.from('quotes').select('id,number,client_name,client_id,total,status,operation_id').order('number',{ascending:false}),
      supabase.from('invoices').select('id,number,tipo,client_name,total,operation_id').order('date',{ascending:false}),
      supabase.from('purchases').select('*').order('date',{ascending:false}),
      supabase.from('clients').select('id,name,cuit').order('name'),
    ])
    setOperations(oRes.data||[])
    setQuotes(qRes.data||[])
    setInvoices(iRes.data||[])
    setPurchases(pRes.data||[])
    setClients(cRes.data||[])
    setLoading(false)
  }

  useEffect(()=>{ load() },[])

  const filtered = useMemo(()=>operations.filter(o=>{
    const q=search.toLowerCase()
    return (!q||o.client_name?.toLowerCase().includes(q)||o.name?.toLowerCase().includes(q))
      &&(filterSt==='TODOS'||o.status===filterSt)
  }),[operations,search,filterSt])

  const kpis = useMemo(()=>{
    const totalVenta   = operations.reduce((s,o)=>s+(o.total_venta||0),0)
    const totalCostos  = operations.reduce((s,o)=>s+(o.total_costos||0),0)
    const ganancia     = totalVenta - totalCostos
    const enCurso      = operations.filter(o=>!['CERRADO'].includes(o.status)).length
    const cobradas     = operations.filter(o=>['COBRADO','EN_ENTREGA','CERRADO'].includes(o.status)).reduce((s,o)=>s+(o.total_venta||0),0)
    const rentPromedio = totalVenta>0 ? (ganancia/totalVenta*100).toFixed(1) : 0
    return { totalVenta, totalCostos, ganancia, enCurso, cobradas, rentPromedio }
  },[operations])

  // Presupuestos aprobados sin operación = candidatos a crear operación
  const quotesWithoutOp = useMemo(()=>
    quotes.filter(q=>q.status==='APROBADO'&&!q.operation_id)
  ,[quotes])

  const btnSt = (active,color=d.orangeL) => ({
    padding:'6px 13px',borderRadius:20,fontSize:11,fontWeight:700,cursor:'pointer',
    border:`1px solid ${active?color+'44':d.border}`,
    background:active?`${color}18`:'transparent',
    color:active?color:d.muted,transition:'all 0.2s',
  })

  return (
    <div style={{minHeight:'100vh',padding:'24px 28px',background:d.bg,
      fontFamily:"'Nunito Sans',sans-serif",color:d.text}}>

      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24}}>
        <div>
          <h1 style={{margin:0,fontSize:28,fontWeight:900,fontFamily:"'Syne',sans-serif",
            background:`linear-gradient(135deg,${d.orangeL},#FFD700)`,
            WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
            Operaciones
          </h1>
          <p style={{margin:'4px 0 0',fontSize:12,color:d.muted,fontStyle:'italic'}}>
            expedientes completos de venta — presupuesto → factura → cobro → entrega
          </p>
        </div>
        <button onClick={()=>{setSelected(null);setShowModal(true)}}
          style={{padding:'11px 22px',borderRadius:14,border:'none',
            background:`linear-gradient(135deg,${d.orangeL},${d.orange})`,
            color:'#000',fontSize:13,fontWeight:700,cursor:'pointer',
            boxShadow:`0 4px 20px rgba(232,134,10,0.4)`,transition:'all 0.2s'}}
          onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px) scale(1.03)'}
          onMouseLeave={e=>e.currentTarget.style.transform='none'}>
          + Nueva operación
        </button>
      </div>

      {/* Alerta: presupuestos aprobados sin operación */}
      {quotesWithoutOp.length>0 && (
        <div style={{...glassCard({padding:'14px 18px'}),marginBottom:16,
          background:'rgba(59,130,246,0.06)',border:'1px solid rgba(59,130,246,0.2)'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:20}}>💡</span>
            <div style={{flex:1}}>
              <span style={{fontSize:13,fontWeight:700,color:d.blue}}>
                {quotesWithoutOp.length} presupuesto{quotesWithoutOp.length!==1?'s':''} aprobado{quotesWithoutOp.length!==1?'s':''} sin operación
              </span>
              <div style={{fontSize:11,color:d.muted,marginTop:2}}>
                {quotesWithoutOp.slice(0,3).map(q=>`P-${String(q.number).padStart(4,'0')} (${q.client_name})`).join(' · ')}
              </div>
            </div>
            <button onClick={()=>{
              const q=quotesWithoutOp[0]
              setSelected({
                client_name:q.client_name,client_id:q.client_id,
                quote_id:q.id,quote_number:q.number,
                total_venta:q.total,status:'PRESUPUESTADO',date:today(),
              })
              setShowModal(true)
            }} style={{padding:'7px 14px',borderRadius:10,border:'none',
              background:'rgba(59,130,246,0.2)',color:d.blue,
              fontSize:12,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}}>
              Crear operación →
            </button>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'nowrap',overflowX:'auto',paddingBottom:8}}>
        <KpiCard value={fmtShort(kpis.totalVenta)} label="Total facturado" color={d.orangeL} icon="💰"/>
        <KpiCard value={fmtShort(kpis.totalCostos)} label="Total costos" color={d.rose} icon="💸"/>
        <KpiCard value={fmtShort(kpis.ganancia)} label="Ganancia total" color={d.lime} icon="📈"
          sub={kpis.ganancia>0?'rentabilidad real':undefined}/>
        <KpiCard value={`${kpis.rentPromedio}%`} label="Rent. promedio" color={parseFloat(kpis.rentPromedio)>=15?d.lime:parseFloat(kpis.rentPromedio)>=5?d.amber:d.rose} icon="🎯"/>
        <KpiCard value={kpis.enCurso} label="En curso" color={d.blue} icon="⚡"/>
        <KpiCard value={operations.length} label="Total ops." color={d.violet} icon="📁"/>
      </div>

      {/* Pipeline */}
      {operations.length>0 && <Pipeline operations={operations}/>}

      {/* Filters */}
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Buscar por cliente o nombre..."
          style={{flex:'1 1 200px',padding:'10px 16px',borderRadius:12,
            border:'1px solid rgba(255,255,255,0.1)',
            background:'rgba(255,255,255,0.04)',color:d.text,fontSize:13,outline:'none'}}/>
        <button onClick={()=>setFilterSt('TODOS')} style={btnSt(filterSt==='TODOS')}>Todas</button>
        {STATUSES.map(s=>(
          <button key={s.key} onClick={()=>setFilterSt(s.key)}
            style={btnSt(filterSt===s.key,s.color)}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{textAlign:'center',padding:60,color:d.muted}}>
          <div style={{fontSize:32,marginBottom:8}}>⚡</div>Cargando...
        </div>
      ) : filtered.length===0 ? (
        <div style={{textAlign:'center',padding:60,color:d.muted}}>
          <div style={{fontSize:48,marginBottom:12,opacity:0.3}}>📁</div>
          <div style={{fontSize:15}}>No hay operaciones</div>
          <div style={{fontSize:12,marginTop:4,color:d.sub}}>
            Creá la primera con el botón + o desde un presupuesto aprobado
          </div>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {filtered.map(op=>(
            <OperationCard key={op.id} op={op}
              onClick={()=>{setSelected(op);setShowModal(true)}}/>
          ))}
        </div>
      )}

      {showModal && (
        <OperationModal
          initial={selected}
          quotes={quotes}
          invoices={invoices}
          purchases={purchases}
          clients={clients}
          onClose={()=>{setShowModal(false);setSelected(null)}}
          onSaved={load}
        />
      )}
    </div>
  )
}
