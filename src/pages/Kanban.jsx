import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../supabase'

// ── THEME ─────────────────────────────────────────────────────────────────────
const d = {
  bg:       'linear-gradient(160deg,#050510 0%,#080818 50%,#050510 100%)',
  glass:    'rgba(255,255,255,0.04)',
  glassMid: 'rgba(255,255,255,0.07)',
  border:   'rgba(255,255,255,0.07)',
  border2:  'rgba(255,255,255,0.13)',
  text:     '#F0EFFF',
  text2:    '#C8C6E0',
  muted:    '#8884A8',
  sub:      '#4A4870',
  orange:   '#E8860A',
  orangeL:  '#F5A623',
  lime:     '#22C55E',
  rose:     '#F43F5E',
  blue:     '#3B82F6',
  violet:   '#8B5CF6',
  amber:    '#F59E0B',
  cyan:     '#06B6D4',
  shadow:   '0 4px 24px rgba(0,0,0,0.5)',
}

// ── COLUMNAS DEL PIPELINE ──────────────────────────────────────────────────────
const COLUMNS = [
  { key:'NUEVO',          label:'Nuevo contacto',    color:'#8884A8', icon:'💬', desc:'Primer contacto recibido' },
  { key:'PRESUPUESTANDO', label:'Presupuestando',    color:'#3B82F6', icon:'📝', desc:'Preparando propuesta' },
  { key:'ENVIADO',        label:'Enviado',           color:'#06B6D4', icon:'📤', desc:'Esperando respuesta' },
  { key:'NEGOCIACION',    label:'En negociación',    color:'#F59E0B', icon:'🤝', desc:'Ajustando condiciones' },
  { key:'OC_RECIBIDA',    label:'OC Recibida',       color:'#8B5CF6', icon:'📄', desc:'Orden de compra en mano' },
  { key:'FACTURADO',      label:'Facturado',         color:'#E8860A', icon:'🧾', desc:'Factura emitida' },
  { key:'COBRADO',        label:'Cobrado',           color:'#22C55E', icon:'💰', desc:'Pago recibido' },
  { key:'EN_ENTREGA',     label:'En entrega',        color:'#F5A623', icon:'🚚', desc:'Producto en camino' },
  { key:'CERRADO',        label:'Cerrado ✓',         color:'#4A4870', icon:'✅', desc:'Operación finalizada' },
]

// ── TAMAÑO EMPRESA ─────────────────────────────────────────────────────────────
const COMPANY_SIZE = [
  { key:'PEQUEÑA', label:'Pequeña', range:'5–15 emp.', color:'#3B82F6', icon:'🔵' },
  { key:'MEDIANA',  label:'Mediana',  range:'20–50 emp.', color:'#F59E0B', icon:'🟡' },
  { key:'GRANDE',   label:'Grande',   range:'+50 emp.',   color:'#F43F5E', icon:'🔴' },
]

const TIERS = [
  { key:'BASE',         color:'#9ca3af', gradient:'linear-gradient(135deg,#6b7280,#d1d5db)' },
  { key:'PREFERENCIAL', color:'#3b82f6', gradient:'linear-gradient(135deg,#1d4ed8,#06b6d4)' },
  { key:'SELECTIVO',    color:'#6d28d9', gradient:'linear-gradient(135deg,#4c1d95,#7c3aed)' },
  { key:'PREMIUM',      color:'#d97706', gradient:'linear-gradient(135deg,#92400e,#FF7A00,#f59e0b)' },
]

const fmtShort = n => { const v=parseFloat(n)||0; return v>=1e6?`$${(v/1e6).toFixed(1)}M`:v>=1e3?`$${(v/1e3).toFixed(0)}k`:`$${Math.round(v)}` }
const fmtDate  = d => { if(!d) return '—'; return new Date(d+'T12:00:00').toLocaleDateString('es-AR',{day:'2-digit',month:'short'}) }
const daysIn   = d => { if(!d) return 0; return Math.floor((Date.now()-new Date(d))/86400000) }
const getSize  = emp => { if(!emp) return null; const n=parseInt(emp); if(n>=50)return COMPANY_SIZE[2]; if(n>=20)return COMPANY_SIZE[1]; if(n>=5)return COMPANY_SIZE[0]; return null }
const getTier  = key => TIERS.find(t=>t.key===key)||TIERS[0]

const glassCard = (extra={}) => ({
  background: 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(20px) saturate(150%)',
  WebkitBackdropFilter: 'blur(20px) saturate(150%)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderTop: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 14,
  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
  ...extra,
})

// ── MODAL NUEVA OPORTUNIDAD ───────────────────────────────────────────────────
function OpportunityModal({ initial, clients, onClose, onSaved }) {
  const isEdit = !!initial?.id
  const [form, setForm] = useState(initial ? {...initial} : {
    name: '', client_id: null, client_name: '', status: 'NUEVO',
    total_venta: 0, date: new Date().toISOString().split('T')[0],
    notes: '', next_action: '', next_action_date: '',
    products_involved: '', company_size: '',
  })
  const [saving, setSaving] = useState(false)
  const [clientQ, setClientQ] = useState(initial?.client_name||'')
  const [clientResults, setClientResults] = useState([])

  useEffect(()=>{
    const fn=e=>{if(e.key==='Escape')onClose()}
    window.addEventListener('keydown',fn); return()=>window.removeEventListener('keydown',fn)
  },[onClose])

  useEffect(()=>{
    const t=setTimeout(async()=>{
      if(!clientQ.trim()){setClientResults([]);return}
      const{data}=await supabase.from('clients').select('id,name,employees_range,category').ilike('name',`%${clientQ}%`).limit(6)
      setClientResults(data||[])
    },200)
    return()=>clearTimeout(t)
  },[clientQ])

  const set=(k,v)=>setForm(f=>({...f,[k]:v}))

  const save=async()=>{
    if(!form.client_name?.trim())return
    setSaving(true)
    try{
      const payload={...form,updated_at:new Date()}
      ;['total_venta'].forEach(k=>{payload[k]=Number(payload[k])||0})
      ;['next_action_date'].forEach(k=>{if(!payload[k])payload[k]=null})
      if(!payload.client_id)payload.client_id=null
      if(isEdit)await supabase.from('operations').update(payload).eq('id',initial.id)
      else await supabase.from('operations').insert(payload)
      await onSaved(); onClose()
    }catch(e){console.error(e)}
    setSaving(false)
  }

  const inp=(key,ph,type='text')=>(
    <input value={form[key]||''} onChange={e=>set(key,e.target.value)} type={type} placeholder={ph}
      style={{width:'100%',padding:'9px 13px',borderRadius:10,border:'1px solid rgba(255,255,255,0.1)',
        background:'rgba(255,255,255,0.05)',color:d.text,fontSize:13,outline:'none',boxSizing:'border-box'}}/>
  )
  const lbl=t=><div style={{fontSize:10,fontWeight:700,color:d.muted,marginBottom:5,textTransform:'uppercase',letterSpacing:'0.08em'}}>{t}</div>

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(12px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:560,maxHeight:'88vh',display:'flex',flexDirection:'column',...glassCard({background:'rgba(8,8,24,0.97)',borderRadius:20,boxShadow:'0 40px 100px rgba(0,0,0,0.8)'})}}>
        <div style={{padding:'20px 24px 16px',borderBottom:'1px solid rgba(255,255,255,0.07)',flexShrink:0}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <h3 style={{margin:0,fontSize:16,fontWeight:800,color:d.text,fontFamily:"'Syne',sans-serif"}}>
              {isEdit?'Editar oportunidad':'Nueva oportunidad'}
            </h3>
            <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',fontSize:22,color:d.muted}}>×</button>
          </div>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'20px 24px',display:'flex',flexDirection:'column',gap:14}}>

          {/* Cliente */}
          <div style={{position:'relative'}}>
            {lbl('Cliente *')}
            <input value={clientQ} onChange={e=>{setClientQ(e.target.value);set('client_name',e.target.value);set('client_id',null)}}
              placeholder="Buscar cliente..."
              style={{width:'100%',padding:'9px 13px',borderRadius:10,border:`1px solid ${form.client_id?d.orange+'55':'rgba(255,255,255,0.1)'}`,background:'rgba(255,255,255,0.05)',color:d.text,fontSize:13,outline:'none',boxSizing:'border-box'}}/>
            {clientResults.length>0&&(
              <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:10,marginTop:4,background:'rgba(8,8,24,0.98)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,overflow:'hidden',boxShadow:d.shadow}}>
                {clientResults.map(cl=>(
                  <div key={cl.id} onMouseDown={()=>{set('client_id',cl.id);set('client_name',cl.name);const s=getSize(cl.employees_range?.split('-')[0]);if(s)set('company_size',s.key);setClientQ(cl.name);setClientResults([])}}
                    style={{padding:'10px 14px',cursor:'pointer',display:'flex',justifyContent:'space-between',borderBottom:'1px solid rgba(255,255,255,0.05)'}}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.06)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <span style={{fontSize:13,color:d.text}}>{cl.name}</span>
                    <span style={{fontSize:10,color:d.muted}}>{cl.employees_range||''} {cl.category||''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Nombre de la oportunidad */}
          <div>
            {lbl('Nombre / descripción')}
            {inp('name','Ej: Mamelucos ignífugos x10 — Lote Mayo')}
          </div>

          {/* Estado */}
          <div>
            {lbl('Etapa actual')}
            <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
              {COLUMNS.map(col=>(
                <button key={col.key} onClick={()=>set('status',col.key)}
                  style={{padding:'5px 10px',borderRadius:20,fontSize:10,fontWeight:700,cursor:'pointer',
                    border:`1px solid ${col.color}${form.status===col.key?'88':'22'}`,
                    background:form.status===col.key?`${col.color}25`:'transparent',
                    color:form.status===col.key?col.color:d.sub,transition:'all 0.2s',whiteSpace:'nowrap'}}>
                  {col.icon} {col.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              {lbl('Monto estimado')}
              <input type="number" value={form.total_venta||''} onChange={e=>set('total_venta',e.target.value)} placeholder="0"
                style={{width:'100%',padding:'9px 13px',borderRadius:10,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.05)',color:d.orangeL,fontSize:15,fontWeight:900,outline:'none',boxSizing:'border-box',fontFamily:"'Space Mono',monospace",textAlign:'right'}}/>
            </div>
            <div>
              {lbl('Fecha inicio')}
              {inp('date','','date')}
            </div>
          </div>

          {/* Tamaño empresa */}
          <div>
            {lbl('Tamaño de la empresa')}
            <div style={{display:'flex',gap:8}}>
              {COMPANY_SIZE.map(s=>(
                <button key={s.key} onClick={()=>set('company_size',s.key)}
                  style={{flex:1,padding:'8px 6px',borderRadius:10,cursor:'pointer',textAlign:'center',
                    border:`1px solid ${s.color}${form.company_size===s.key?'66':'22'}`,
                    background:form.company_size===s.key?`${s.color}20`:'transparent',
                    transition:'all 0.2s'}}>
                  <div style={{fontSize:16}}>{s.icon}</div>
                  <div style={{fontSize:10,fontWeight:700,color:form.company_size===s.key?s.color:d.muted,marginTop:3}}>{s.label}</div>
                  <div style={{fontSize:9,color:d.sub}}>{s.range}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Productos */}
          <div>
            {lbl('Productos / marcas involucradas')}
            <textarea value={form.products_involved||''} onChange={e=>set('products_involved',e.target.value)}
              placeholder="Mameluco ignífugo Dupont, Botines Pampero talle 42, Casco MSA..." rows={2}
              style={{width:'100%',padding:'9px 13px',borderRadius:10,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.05)',color:d.text,fontSize:13,outline:'none',resize:'none',boxSizing:'border-box'}}/>
          </div>

          {/* Próxima acción */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              {lbl('Próxima acción')}
              {inp('next_action','Ej: Llamar para confirmar OC')}
            </div>
            <div>
              {lbl('Fecha límite')}
              {inp('next_action_date','','date')}
            </div>
          </div>

          <div>
            {lbl('Notas')}
            <textarea value={form.notes||''} onChange={e=>set('notes',e.target.value)}
              placeholder="Observaciones, condiciones especiales..." rows={3}
              style={{width:'100%',padding:'9px 13px',borderRadius:10,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.05)',color:d.text,fontSize:13,outline:'none',resize:'vertical',boxSizing:'border-box'}}/>
          </div>
        </div>

        <div style={{padding:'16px 24px',borderTop:'1px solid rgba(255,255,255,0.07)',display:'flex',justifyContent:'flex-end',gap:10,flexShrink:0}}>
          <button onClick={onClose} style={{padding:'10px 20px',borderRadius:12,border:'1px solid rgba(255,255,255,0.1)',background:'transparent',color:d.muted,fontSize:13,cursor:'pointer',fontWeight:600}}>Cancelar</button>
          <button onClick={save} disabled={saving||!form.client_name}
            style={{padding:'10px 26px',borderRadius:12,border:'none',background:`linear-gradient(135deg,${d.orangeL},${d.orange})`,color:'#000',fontSize:13,fontWeight:800,cursor:saving?'not-allowed':'pointer',opacity:saving||!form.client_name?0.5:1,boxShadow:`0 4px 20px rgba(232,134,10,0.4)`}}>
            {saving?'Guardando...':isEdit?'Guardar cambios':'Crear oportunidad'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── KANBAN CARD ───────────────────────────────────────────────────────────────
function KanbanCard({ op, clientStats, onClick, onDragStart }) {
  const [hov, setHov] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const col = COLUMNS.find(c=>c.key===op.status)||COLUMNS[0]
  const size = COMPANY_SIZE.find(s=>s.key===op.company_size)
  const tier = getTier(op.client_category)
  const days = daysIn(op.date)
  const daysUrgent = days > 7
  const hasAction = op.next_action && op.next_action_date
  const actionOverdue = hasAction && new Date(op.next_action_date) < new Date()
  const stats = clientStats || {}

  return (
    <div
      draggable
      onDragStart={e=>onDragStart(e,op.id)}
      onClick={onClick}
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>{setHov(false)}}
      style={{
        ...glassCard({padding:0,overflow:'hidden',borderRadius:12}),
        border:`1px solid ${hov?col.color+'44':'rgba(255,255,255,0.07)'}`,
        borderTop:`1px solid ${hov?col.color+'66':'rgba(255,255,255,0.13)'}`,
        borderLeft:`3px solid ${hov?col.color:col.color+'44'}`,
        cursor:'grab',
        transform:hov?'translateY(-2px)':'none',
        boxShadow:hov?`0 8px 28px ${col.color}18,0 2px 8px rgba(0,0,0,0.4)`:'0 2px 8px rgba(0,0,0,0.4)',
        transition:'all 0.2s cubic-bezier(0.34,1.2,0.64,1)',
        marginBottom:8,
      }}>

      {/* Shimmer line */}
      <div style={{height:1,background:`linear-gradient(90deg,transparent,${hov?col.color+'55':'rgba(255,255,255,0.06)'},transparent)`}}/>

      <div style={{padding:'12px 14px'}}>

        {/* Row 1: Cliente + tamaño + días */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:800,color:d.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              {op.client_name}
            </div>
            {op.name&&<div style={{fontSize:10,color:d.muted,marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{op.name}</div>}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:5,flexShrink:0,marginLeft:8}}>
            {size&&<span style={{fontSize:12}}>{size.icon}</span>}
            <span style={{fontSize:9,padding:'2px 6px',borderRadius:8,
              background:daysUrgent?'rgba(244,63,94,0.15)':'rgba(255,255,255,0.06)',
              color:daysUrgent?d.rose:d.sub,fontWeight:700,fontFamily:"'Space Mono',monospace"}}>
              {days}d
            </span>
          </div>
        </div>

        {/* Tier bar */}
        <div style={{marginBottom:8}}>
          <div style={{height:3,borderRadius:3,background:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
            <div style={{height:'100%',width:`${Math.min(100,((op.score||0)))}%`,
              background:tier.gradient,borderRadius:3,transition:'width 0.6s ease'}}/>
          </div>
        </div>

        {/* Row 2: Monto */}
        {op.total_venta>0&&(
          <div style={{fontSize:18,fontWeight:900,color:d.orangeL,fontFamily:"'Space Mono',monospace",marginBottom:8,letterSpacing:'-0.5px'}}>
            {fmtShort(op.total_venta)}
          </div>
        )}

        {/* Row 3: Métricas compactas */}
        <div style={{display:'flex',gap:8,marginBottom:8,flexWrap:'wrap'}}>
          {[
            {icon:'📋',val:stats.total_quotes||0,label:'pptos',color:d.blue},
            {icon:'✅',val:stats.quotes_approved||0,label:'aprob.',color:d.lime},
            {icon:'❌',val:stats.quotes_rejected||0,label:'rech.',color:d.rose},
            {icon:'🧾',val:stats.total_invoices||0,label:'fact.',color:d.amber},
          ].map(m=>(
            <div key={m.label} style={{display:'flex',alignItems:'center',gap:3,
              padding:'3px 7px',borderRadius:8,
              background:`${m.color}10`,border:`1px solid ${m.color}20`}}>
              <span style={{fontSize:10}}>{m.icon}</span>
              <span style={{fontSize:11,fontWeight:800,color:m.color,fontFamily:"'Space Mono',monospace"}}>{m.val}</span>
              <span style={{fontSize:8,color:d.sub}}>{m.label}</span>
            </div>
          ))}
        </div>

        {/* Row 4: Próxima acción */}
        {op.next_action&&(
          <div style={{padding:'6px 9px',borderRadius:8,
            background:actionOverdue?'rgba(244,63,94,0.1)':'rgba(255,255,255,0.04)',
            border:`1px solid ${actionOverdue?d.rose+'33':'rgba(255,255,255,0.06)'}`,
            display:'flex',gap:6,alignItems:'flex-start'}}>
            <span style={{fontSize:10,flexShrink:0}}>{actionOverdue?'⚠️':'📌'}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:10,color:actionOverdue?d.rose:d.text2,fontWeight:600,
                overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {op.next_action}
              </div>
              {op.next_action_date&&<div style={{fontSize:9,color:actionOverdue?d.rose:d.muted,marginTop:1}}>{fmtDate(op.next_action_date)}</div>}
            </div>
          </div>
        )}

        {/* Expandible: productos */}
        {op.products_involved&&(
          <div style={{marginTop:8}}>
            <button onClick={e=>{e.stopPropagation();setExpanded(x=>!x)}}
              style={{background:'none',border:'none',cursor:'pointer',fontSize:9,color:d.muted,padding:0,display:'flex',alignItems:'center',gap:4}}>
              {expanded?'▼':'▶'} {expanded?'Ocultar':'Ver'} productos
            </button>
            {expanded&&(
              <div style={{marginTop:6,padding:'7px 9px',borderRadius:8,
                background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)'}}>
                <div style={{fontSize:10,color:d.muted,lineHeight:1.5}}>{op.products_involved}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── COLUMNA KANBAN ────────────────────────────────────────────────────────────
function KanbanColumn({ col, ops, clientStatsMap, onCardClick, onDragStart, onDrop }) {
  const [dragOver, setDragOver] = useState(false)
  const total = ops.reduce((s,o)=>s+(o.total_venta||0),0)

  return (
    <div
      onDragOver={e=>{e.preventDefault();setDragOver(true)}}
      onDragLeave={()=>setDragOver(false)}
      onDrop={e=>{e.preventDefault();setDragOver(false);onDrop(e,col.key)}}
      style={{
        minWidth:240, width:240, flexShrink:0,
        display:'flex', flexDirection:'column',
        background:dragOver?`${col.color}08`:'rgba(255,255,255,0.02)',
        border:`1px solid ${dragOver?col.color+'44':'rgba(255,255,255,0.05)'}`,
        borderRadius:16,
        transition:'all 0.2s',
      }}>

      {/* Column header */}
      <div style={{padding:'12px 14px',borderBottom:'1px solid rgba(255,255,255,0.06)',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
          <span style={{fontSize:16}}>{col.icon}</span>
          <span style={{fontSize:12,fontWeight:800,color:col.color}}>{col.label}</span>
          <span style={{marginLeft:'auto',fontSize:11,fontWeight:900,
            background:`${col.color}20`,color:col.color,
            padding:'2px 8px',borderRadius:20,fontFamily:"'Space Mono',monospace"}}>
            {ops.length}
          </span>
        </div>
        {total>0&&(
          <div style={{fontSize:11,fontWeight:700,color:d.muted,fontFamily:"'Space Mono',monospace"}}>
            {fmtShort(total)}
          </div>
        )}
      </div>

      {/* Cards */}
      <div style={{flex:1,overflowY:'auto',padding:'10px 10px 6px',
        scrollbarWidth:'thin',scrollbarColor:'rgba(255,255,255,0.1) transparent'}}>
        {ops.length===0?(
          <div style={{padding:'24px 12px',textAlign:'center',color:d.sub,fontSize:11,
            border:'1px dashed rgba(255,255,255,0.06)',borderRadius:10,margin:'4px 0'}}>
            Sin oportunidades
          </div>
        ):(
          ops.map(op=>(
            <KanbanCard key={op.id} op={op}
              clientStats={clientStatsMap[op.client_id]}
              onClick={()=>onCardClick(op)}
              onDragStart={onDragStart}/>
          ))
        )}
      </div>
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function Kanban() {
  const [ops,         setOps]         = useState([])
  const [clientStats, setClientStats] = useState({})
  const [loading,     setLoading]     = useState(true)
  const [showModal,   setShowModal]   = useState(false)
  const [selected,    setSelected]    = useState(null)
  const [search,      setSearch]      = useState('')
  const [clients,     setClients]     = useState([])
  const draggingId = useRef(null)

  const load = async () => {
    setLoading(true)
    const [oRes, csRes, cRes] = await Promise.all([
      supabase.from('operations').select('*').order('date',{ascending:false}),
      supabase.from('client_stats').select('*'),
      supabase.from('clients').select('id,name,employees_range,category').order('name'),
    ])

    // Enrich operations with quote stats per client
    const ops = oRes.data||[]
    const statsMap = {}
    ;(csRes.data||[]).forEach(s=>{ statsMap[s.id]=s })

    // Get quote counts per client (approved/rejected)
    const clientIds = [...new Set(ops.map(o=>o.client_id).filter(Boolean))]
    if(clientIds.length>0){
      const {data:qData} = await supabase.from('quotes')
        .select('client_id,status')
        .in('client_id',clientIds)
      ;(qData||[]).forEach(q=>{
        if(!statsMap[q.client_id]) statsMap[q.client_id]={}
        if(!statsMap[q.client_id].quotes_approved) statsMap[q.client_id].quotes_approved=0
        if(!statsMap[q.client_id].quotes_rejected) statsMap[q.client_id].quotes_rejected=0
        if(q.status==='APROBADO') statsMap[q.client_id].quotes_approved++
        if(q.status==='RECHAZADO') statsMap[q.client_id].quotes_rejected++
      })
    }

    // Attach client category to ops
    const clientMap = {}
    ;(cRes.data||[]).forEach(c=>{ clientMap[c.id]=c })
    const enriched = ops.map(o=>({
      ...o,
      client_category: clientMap[o.client_id]?.category||'BASE',
      company_size: o.company_size || (()=>{
        const emp = clientMap[o.client_id]?.employees_range
        if(!emp) return null
        const n = parseInt(emp)
        if(n>=50) return 'GRANDE'
        if(n>=20) return 'MEDIANA'
        if(n>=5)  return 'PEQUEÑA'
        return null
      })(),
    }))

    setOps(enriched)
    setClientStats(statsMap)
    setClients(cRes.data||[])
    setLoading(false)
  }

  useEffect(()=>{ load() },[])

  const filtered = useMemo(()=>{
    if(!search.trim()) return ops
    const q=search.toLowerCase()
    return ops.filter(o=>o.client_name?.toLowerCase().includes(q)||o.name?.toLowerCase().includes(q)||o.products_involved?.toLowerCase().includes(q))
  },[ops,search])

  const byColumn = useMemo(()=>{
    const map = {}
    COLUMNS.forEach(c=>{ map[c.key]=[] })
    filtered.forEach(o=>{ if(map[o.status]) map[o.status].push(o) })
    return map
  },[filtered])

  // KPIs globales
  const kpis = useMemo(()=>{
    const active = ops.filter(o=>!['CERRADO'].includes(o.status))
    const totalPipeline = active.reduce((s,o)=>s+(o.total_venta||0),0)
    const cerradas = ops.filter(o=>o.status==='CERRADO').length
    const conAccion = ops.filter(o=>o.next_action&&new Date(o.next_action_date)<new Date()).length
    return { total:ops.length, active:active.length, totalPipeline, cerradas, conAccion }
  },[ops])

  // Drag & drop
  const onDragStart = (e, id) => { draggingId.current=id; e.dataTransfer.effectAllowed='move' }
  const onDrop = async (e, newStatus) => {
    const id = draggingId.current
    if(!id) return
    const op = ops.find(o=>o.id===id)
    if(!op||op.status===newStatus) return
    setOps(prev=>prev.map(o=>o.id===id?{...o,status:newStatus}:o))
    await supabase.from('operations').update({status:newStatus,updated_at:new Date()}).eq('id',id)
    draggingId.current=null
  }

  if(loading) return (
    <div style={{minHeight:'100vh',background:d.bg,display:'flex',alignItems:'center',justifyContent:'center',color:d.muted,fontFamily:"'Nunito Sans',sans-serif"}}>
      <div style={{textAlign:'center'}}><div style={{fontSize:40,marginBottom:8,opacity:0.4}}>⚡</div><div>Cargando pipeline...</div></div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:d.bg,fontFamily:"'Nunito Sans',sans-serif",color:d.text,display:'flex',flexDirection:'column'}}>

      {/* Header */}
      <div style={{padding:'20px 24px 12px',flexShrink:0}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16,flexWrap:'wrap',gap:12}}>
          <div>
            <h1 style={{margin:0,fontSize:24,fontWeight:900,fontFamily:"'Syne',sans-serif",
              background:`linear-gradient(135deg,${d.orangeL},#FFD700)`,
              WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
              Pipeline de ventas
            </h1>
            <p style={{margin:'3px 0 0',fontSize:11,color:d.muted,fontStyle:'italic'}}>
              {kpis.active} oportunidades activas · {fmtShort(kpis.totalPipeline)} en pipeline
            </p>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Buscar oportunidad..."
              style={{padding:'9px 14px',borderRadius:10,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.04)',color:d.text,fontSize:12,outline:'none',width:200}}/>
            <button onClick={()=>{setSelected(null);setShowModal(true)}}
              style={{padding:'10px 20px',borderRadius:12,border:'none',cursor:'pointer',
                background:`linear-gradient(135deg,${d.orangeL},${d.orange})`,
                color:'#000',fontSize:13,fontWeight:700,
                boxShadow:`0 4px 16px rgba(232,134,10,0.4)`,
                transition:'all 0.2s'}}
              onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
              onMouseLeave={e=>e.currentTarget.style.transform='none'}>
              + Nueva oportunidad
            </button>
          </div>
        </div>

        {/* KPI strip */}
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {[
            {label:'Total',      val:kpis.total,        color:d.muted},
            {label:'Activas',    val:kpis.active,       color:d.orange},
            {label:'Pipeline',   val:fmtShort(kpis.totalPipeline), color:d.orangeL},
            {label:'Cerradas',   val:kpis.cerradas,     color:d.lime},
            {label:'⚠ Vencidas', val:kpis.conAccion,   color:d.rose},
          ].map(k=>(
            <div key={k.label} style={{padding:'6px 14px',borderRadius:20,
              background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',
              display:'flex',gap:6,alignItems:'center'}}>
              <span style={{fontSize:13,fontWeight:900,color:k.color,fontFamily:"'Space Mono',monospace"}}>{k.val}</span>
              <span style={{fontSize:10,color:d.muted}}>{k.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban board */}
      <div style={{flex:1,overflowX:'auto',padding:'0 24px 24px',
        scrollbarWidth:'thin',scrollbarColor:'rgba(255,255,255,0.1) transparent'}}>
        <div style={{display:'flex',gap:12,minWidth:'max-content',alignItems:'flex-start',paddingBottom:8}}>
          {COLUMNS.map(col=>(
            <KanbanColumn
              key={col.key}
              col={col}
              ops={byColumn[col.key]||[]}
              clientStatsMap={clientStats}
              onCardClick={op=>{setSelected(op);setShowModal(true)}}
              onDragStart={onDragStart}
              onDrop={onDrop}
            />
          ))}
        </div>
      </div>

      {showModal&&(
        <OpportunityModal
          initial={selected}
          clients={clients}
          onClose={()=>{setShowModal(false);setSelected(null)}}
          onSaved={load}
        />
      )}
    </div>
  )
}
