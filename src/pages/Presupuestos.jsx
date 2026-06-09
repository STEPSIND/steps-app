import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../supabase'

// ── WHITE MODE — iOS 18 SUPERGLASS ──────────────────────────────────────────
const w = {
  bg:          'rgba(242,242,247,0.55)',
  surface:     'rgba(255,255,255,0.78)',
  glass:       'rgba(255,255,255,0.68)',
  border:      'rgba(0,0,0,0.07)',
  border2:     'rgba(0,0,0,0.13)',
  text:        '#1C1C1E',
  text2:       '#3A3A3C',
  muted:       '#8E8E93',
  orange:      '#E8860A',
  orangeL:     '#F5A623',
  orangeDim:   'rgba(232,134,10,0.1)',
  orangeGlow:  'rgba(232,134,10,0.22)',
  lime:        '#28CD41',
  rose:        '#FF3B30',
  blue:        '#0A84FF',
  amber:       '#FF9F0A',
  violet:      '#BF5AF2',
  shadow:      '0 2px 14px rgba(0,0,0,0.07)',
  shadowMd:    '0 6px 28px rgba(0,0,0,0.1)',
  shadowLg:    '0 12px 48px rgba(0,0,0,0.14)',
  shadowOrange:'0 4px 20px rgba(232,134,10,0.25)',
}

const STATUSES = {
  BORRADOR:    { label:'Borrador',     color:'#8E8E93',  next:['ENVIADO'] },
  ENVIADO:     { label:'Enviado',      color:'#0A84FF',  next:['APROBADO','RECHAZADO','EN_REVISION'] },
  EN_REVISION: { label:'En revisión',  color:'#FF9F0A',  next:['APROBADO','RECHAZADO'] },
  APROBADO:    { label:'Aprobado',     color:'#28CD41',  next:[] },
  RECHAZADO:   { label:'Rechazado',    color:'#FF3B30',  next:['BORRADOR'] },
  VENCIDO:     { label:'Vencido',      color:'#BF5AF2',  next:['BORRADOR'] },
}

const PAYMENT_OPTIONS  = ['ANTICIPADO','CONTADO','30 DÍAS','60 DÍAS','30/60 DÍAS','E-CHEQUE','CHEQUE','NEGOCIABLE']
const SHIPPING_OPTIONS = ['INCLUYE ENVÍO','RETIRA EN STEPS','RETIRA EN PROVEEDOR','A DEFINIR']
const DELIVERY_OPTIONS = ['24-48 HS','5-10 DÍAS','15 DÍAS','A CONFIRMAR']

// ── HELPERS ─────────────────────────────────────────────────────────────────
const fmtARS = n => `$${(parseFloat(n)||0).toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2})}`
const fmtShort = n => { const v=parseFloat(n)||0; return v>=1e6?`$${(v/1e6).toFixed(2)}M`:v>=1e3?`$${(v/1e3).toFixed(0)}K`:fmtARS(v) }
const today    = () => new Date().toISOString().split('T')[0]
const addDays  = (d,n) => { const dt=new Date(d); dt.setDate(dt.getDate()+n); return dt.toISOString().split('T')[0] }

const EMPTY_ITEM = () => ({
  _key: Math.random().toString(36).slice(2),
  product_id:null, description:'', image_url:'', size:'',
  quantity:1, unit_price_usd:0, cost_price_ars:0,
  margin_pct:18, unit_sale_price:0, subtotal:0,
  iva_pct:21, discount_pct:0, supplier_name:'',
})

const calcItem = (item, cot) => {
  const usd  = parseFloat(item.unit_price_usd)||0
  const cost = usd>0 ? Math.round(usd*parseFloat(cot)) : (parseFloat(item.cost_price_ars)||0)
  const sale = Math.round(cost*(1+(parseFloat(item.margin_pct)||0)/100))
  const qty  = parseFloat(item.quantity)||0
  const disc = parseFloat(item.discount_pct)||0
  const sub  = Math.round(qty*sale*(1-disc/100))
  return {...item, cost_price_ars:cost, unit_sale_price:sale, subtotal:sub}
}

// ── SHARED INPUT STYLE ───────────────────────────────────────────────────────
const wi = (extra={}) => ({
  background:'rgba(0,0,0,0.04)', border:'1px solid rgba(0,0,0,0.09)',
  borderRadius:10, padding:'8px 11px', color:'#1C1C1E', fontSize:13,
  outline:'none', width:'100%', boxSizing:'border-box',
  fontFamily:'var(--font-body,system-ui)', ...extra,
})

const wiNum = (extra={}) => wi({
  textAlign:'right', fontFamily:'var(--font-mono,monospace)',
  fontWeight:700, color:'#1C1C1E', ...extra,
})

// ── GLASS CARD ───────────────────────────────────────────────────────────────
const glassStyle = (extra={}) => ({
  background: w.glass,
  backdropFilter:'blur(24px) saturate(180%)',
  WebkitBackdropFilter:'blur(24px) saturate(180%)',
  border:`1px solid ${w.border2}`,
  borderTop:`1px solid rgba(255,255,255,0.95)`,
  boxShadow: w.shadow,
  borderRadius:18,
  ...extra,
})

// ── CLIENT AUTOCOMPLETE ───────────────────────────────────────────────────────
function ClientSearch({ name, cuit, solicita, iva, category, onSelect, onChange }) {
  const [q, setQ] = useState(name||'')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)

  useEffect(() => { setQ(name||'') }, [name])

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q.trim() || q === name) { setResults([]); return }
      const {data} = await supabase.from('clients').select('id,name,cuit,contact_name,iva_condition,category').ilike('name',`%${q}%`).limit(6)
      setResults(data||[])
    }, 200)
    return () => clearTimeout(t)
  }, [q])

  const select = (cl) => {
    onSelect({ name:cl.name, cuit:cl.cuit||'', solicita:cl.contact_name||'', iva:cl.iva_condition||'Responsable Inscripto', category:cl.category||'NUEVO' })
    setResults([]); setOpen(false)
  }

  return (
    <div style={{position:'relative',flex:1}}>
      <input value={q}
        onChange={e=>{setQ(e.target.value);onChange('client_name',e.target.value);setOpen(true)}}
        onFocus={()=>setOpen(true)}
        onBlur={()=>setTimeout(()=>setOpen(false),200)}
        placeholder="Nombre del cliente o empresa..."
        style={wi({fontSize:15,fontWeight:700,padding:'11px 14px',border:q?`1.5px solid ${w.orange}`:undefined})} />
      {open && results.length>0 && (
        <div style={{position:'absolute',top:'105%',left:0,right:0,zIndex:400,background:'rgba(255,255,255,0.97)',border:`1px solid ${w.border2}`,borderRadius:14,overflow:'hidden',boxShadow:w.shadowLg}}>
          {results.map(cl=>(
            <div key={cl.id} onMouseDown={()=>select(cl)} style={{padding:'11px 16px',cursor:'pointer',borderBottom:`1px solid ${w.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}
              onMouseEnter={e=>e.currentTarget.style.background='#F5F5F7'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:w.text}}>{cl.name}</div>
                <div style={{fontSize:11,color:w.muted}}>{cl.cuit} · {cl.contact_name||''}</div>
              </div>
              <span style={{fontSize:10,padding:'3px 8px',borderRadius:12,background:w.orangeDim,color:w.orange,fontWeight:700}}>{cl.category||'NUEVO'}</span>
            </div>
          ))}
          <div style={{padding:'6px 16px 8px',fontSize:10,color:w.muted,textAlign:'center'}}>Seleccioná para autocompletar</div>
        </div>
      )}
    </div>
  )
}

// ── CONDITION PILL PICKER ─────────────────────────────────────────────────────
function PillPicker({ label, options, value, onChange, color=w.orange }) {
  return (
    <div>
      <div style={{fontSize:9,color:w.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8,fontWeight:600}}>{label}</div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
        {options.map(opt=>{
          const active = value===opt
          return (
            <button key={opt} onClick={()=>onChange(opt)} style={{
              padding:'6px 14px', borderRadius:20,
              border:`1.5px solid ${active?color:'rgba(0,0,0,0.1)'}`,
              background: active?color:'transparent',
              color: active?'#fff':w.text2,
              fontSize:11, fontWeight:active?700:500, cursor:'pointer',
              transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
              boxShadow: active?`0 2px 12px ${color}35`:'none',
            }}>{opt}</button>
          )
        })}
      </div>
    </div>
  )
}

// ── PRODUCT SEARCH ───────────────────────────────────────────────────────────
function ProductSearch({ onAdd, cotizacion, globalMargin }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)

  useEffect(()=>{
    const t=setTimeout(async()=>{
      if(!q.trim()){setResults([]);return}
      const {data}=await supabase.from('products')
        .select('id,name,brand,price_usd,cost_price,product_type,size_range,supplier_name,image_url')
        .or(`name.ilike.%${q}%,brand.ilike.%${q}%,product_type.ilike.%${q}%`).limit(7)
      setResults(data||[])
    },220)
    return ()=>clearTimeout(t)
  },[q])

  const select = (p)=>{
    const cost = p.price_usd>0 ? Math.round(p.price_usd*parseFloat(cotizacion)) : (p.cost_price||0)
    const sale = Math.round(cost*(1+globalMargin/100))
    onAdd({...EMPTY_ITEM(), product_id:p.id, description:p.name, image_url:p.image_url||'',
      unit_price_usd:p.price_usd||0, cost_price_ars:cost, margin_pct:globalMargin,
      unit_sale_price:sale, subtotal:sale, supplier_name:p.supplier_name||'',
    })
    setQ('');setResults([]);setOpen(false)
  }

  return (
    <div style={{position:'relative'}}>
      <div style={{display:'flex',alignItems:'center',gap:10,...glassStyle({padding:'10px 16px',borderRadius:14})}}>
        <span style={{fontSize:16,color:w.muted,flexShrink:0}}>🔍</span>
        <input value={q} onChange={e=>{setQ(e.target.value);setOpen(true)}}
          onFocus={()=>setOpen(true)} onBlur={()=>setTimeout(()=>setOpen(false),200)}
          placeholder="Buscar en el catálogo por nombre, marca o tipo..."
          style={{background:'transparent',border:'none',outline:'none',fontSize:14,color:w.text,width:'100%',fontFamily:'var(--font-body,system-ui)'}} />
      </div>
      {open && results.length>0 && (
        <div style={{position:'absolute',top:'105%',left:0,right:0,zIndex:400,background:'rgba(255,255,255,0.97)',border:`1px solid ${w.border2}`,borderRadius:16,overflow:'hidden',boxShadow:w.shadowLg}}>
          {results.map(p=>{
            const cost=p.price_usd>0?Math.round(p.price_usd*parseFloat(cotizacion)):(p.cost_price||0)
            const sale=Math.round(cost*(1+globalMargin/100))
            return (
              <div key={p.id} onMouseDown={()=>select(p)} style={{display:'flex',gap:12,padding:'10px 14px',cursor:'pointer',borderBottom:`1px solid ${w.border}`,alignItems:'center'}}
                onMouseEnter={e=>e.currentTarget.style.background='#F5F5F7'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                {p.image_url
                  ?<img src={p.image_url} style={{width:44,height:44,objectFit:'cover',borderRadius:8,flexShrink:0}} />
                  :<div style={{width:44,height:44,borderRadius:8,background:'#F2F2F7',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>📦</div>
                }
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:700,color:w.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
                  <div style={{fontSize:10,color:w.muted}}>{p.brand||''}{p.brand&&p.supplier_name?' · ':''}{p.supplier_name||''}</div>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  {p.price_usd>0&&<div style={{fontSize:11,color:w.amber,fontWeight:700}}>U$S {p.price_usd}</div>}
                  {sale>0&&<div style={{fontSize:12,color:w.orange,fontWeight:800,fontFamily:'var(--font-mono,monospace)'}}>{fmtARS(sale)}</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── PRODUCT CARD ─────────────────────────────────────────────────────────────
function ProductCard({ item, idx, cotizacion, onChange, onDelete }) {
  const [hov, setHov] = useState(false)
  const upd = (field, val) => onChange(calcItem({ ...item, [field]: val }, cotizacion))

  const saleWithIva  = Math.round((item.unit_sale_price || 0) * 1.21)
  const subWithIva   = Math.round((item.subtotal || 0) * 1.21)
  const ganPct       = item.cost_price_ars > 0 ? (((item.unit_sale_price - item.cost_price_ars) / item.cost_price_ars) * 100).toFixed(1) : 0
  const costTotal    = (parseFloat(item.cost_price_ars) || 0) * (parseFloat(item.quantity) || 0)
  const ganColor     = parseFloat(ganPct) >= 15 ? w.lime : parseFloat(ganPct) > 0 ? w.amber : w.rose

  // Input numérico inline
  const ni = (val, field, color = w.text, width = 72) => (
    <input type="number" value={val} onChange={e => upd(field, e.target.value)}
      style={{
        width, textAlign: 'center', fontFamily: 'var(--font-mono,monospace)',
        fontWeight: 800, fontSize: 13, color,
        background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.09)',
        borderRadius: 8, padding: '5px 4px', outline: 'none',
        boxSizing: 'border-box',
      }} />
  )

  // Celda de dato calculado (solo lectura)
  const dc = (label, value, color = w.text2, highlight = false) => (
    <div style={{ textAlign: 'center', flexShrink: 0 }}>
      <div style={{ fontSize: 8, color: w.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3, fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: highlight ? 900 : 700, color, fontFamily: 'var(--font-mono,monospace)', whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  )

  return (
    <div style={{
      ...glassStyle({ padding: 0, overflow: 'hidden', borderRadius: 14 }),
      transform: hov ? 'translateY(-2px)' : 'none',
      boxShadow: hov ? w.shadowMd : w.shadow,
      transition: 'transform 0.18s, box-shadow 0.18s',
    }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="spotlight-card spotlight-card-light">

      {/* FILA PRINCIPAL */}
      <div style={{ display: 'flex', alignItems: 'stretch' }}>

        {/* Imagen */}
        <div style={{ width: 90, flexShrink: 0, position: 'relative', background: '#F0F0F5' }}>
          {item.image_url
            ? <img src={item.image_url} alt={item.description}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: 90 }} />
            : <div style={{ width: '100%', minHeight: 90, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <span style={{ fontSize: 24, opacity: 0.12 }}>📦</span>
                <span style={{ fontSize: 7, color: w.muted }}>Sin imagen</span>
              </div>
          }
          {/* Badge número */}
          <div style={{ position: 'absolute', top: 7, left: 7, width: 22, height: 22, borderRadius: '50%', background: w.orange, color: '#fff', fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(232,134,10,0.4)' }}>
            {idx + 1}
          </div>
          {/* Badge rentabilidad */}
          {parseFloat(ganPct) !== 0 && (
            <div style={{ position: 'absolute', bottom: 6, left: 6, padding: '2px 6px', borderRadius: 7, background: ganColor, color: '#fff', fontSize: 8, fontWeight: 900 }}>
              {parseFloat(ganPct) > 0 ? '+' : ''}{ganPct}%
            </div>
          )}
        </div>

        {/* Contenido */}
        <div style={{ flex: 1, padding: '10px 12px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Fila 1: Descripción + Proveedor + Talle + Eliminar */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <textarea value={item.description} onChange={e => onChange({ ...item, description: e.target.value })}
              rows={2}
              style={{
                flex: 1, minWidth: 0, background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.09)',
                borderRadius: 9, padding: '6px 10px', color: w.text, fontSize: 12, fontWeight: 700,
                resize: 'none', outline: 'none', lineHeight: 1.45, boxSizing: 'border-box',
                fontFamily: 'var(--font-body,system-ui)',
              }} />
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 8, color: w.muted, textTransform: 'uppercase', fontWeight: 600, marginBottom: 3 }}>Proveedor</div>
                <input value={item.supplier_name} onChange={e => onChange({ ...item, supplier_name: e.target.value })}
                  placeholder="Proveedor"
                  style={{ width: 110, background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 8, padding: '5px 8px', color: w.text, fontSize: 11, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={{ fontSize: 8, color: w.muted, textTransform: 'uppercase', fontWeight: 600, marginBottom: 3 }}>Talle</div>
                <input value={item.size} onChange={e => onChange({ ...item, size: e.target.value })}
                  placeholder="L / XL"
                  style={{ width: 58, background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 8, padding: '5px 6px', color: w.text, fontSize: 11, textAlign: 'center', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <button onClick={onDelete}
              style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(0,0,0,0.1)', background: 'transparent', color: w.muted, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s', marginTop: 2 }}
              onMouseEnter={e => { e.currentTarget.style.background = w.rose; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = w.rose }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = w.muted; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)' }}>
              ×
            </button>
          </div>

          {/* Fila 2: Datos numéricos — dos grupos separados por divisor */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 8, borderTop: '1px solid rgba(0,0,0,0.06)', flexWrap: 'wrap' }}>

            {/* GRUPO A: inputs editables */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 8, color: w.muted, textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Cant.</div>
                {ni(item.quantity, 'quantity', w.text, 58)}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 8, color: w.amber, textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>U$S</div>
                {ni(item.unit_price_usd, 'unit_price_usd', w.amber, 68)}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 8, color: w.muted, textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Margen</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {ni(item.margin_pct, 'margin_pct', w.text, 52)}
                  <span style={{ fontSize: 11, color: w.muted, fontWeight: 700 }}>%</span>
                </div>
              </div>
            </div>

            {/* Divisor */}
            <div style={{ width: 1, height: 36, background: 'rgba(0,0,0,0.08)', flexShrink: 0 }} />

            {/* GRUPO B: valores calculados */}
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              {dc('Costo unit.',     fmtARS(item.cost_price_ars),  w.muted)}
              {dc('$ Unit. s/IVA',   fmtARS(item.unit_sale_price), w.orange, true)}
              {dc('$ Unit. c/IVA',   fmtARS(saleWithIva),          w.text)}
              {dc('Sub. s/IVA',      fmtARS(item.subtotal),        w.orange)}
              {dc('Total c/IVA',     fmtARS(subWithIva),           w.text,   true)}
              {dc('Costo proveedor', fmtARS(costTotal),             w.muted)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── RESUMEN POR PROVEEDOR ─────────────────────────────────────────────────────
function SupplierSummary({ items }) {
  const grouped = useMemo(()=>{
    const map = {}
    items.filter(i=>i.description).forEach(i=>{
      const sup = i.supplier_name||'Sin proveedor'
      if(!map[sup]) map[sup]={items:[],costSub:0}
      const costUnit = parseFloat(i.cost_price_ars)||0
      const qty = parseFloat(i.quantity)||0
      map[sup].items.push(i)
      map[sup].costSub += costUnit*qty
    })
    return Object.entries(map)
  },[items])

  if(!grouped.length) return null

  return (
    <div style={{...glassStyle({padding:20})}}>
      <div style={{fontSize:11,fontWeight:700,color:w.text,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:14}}>
        📦 Resumen por proveedor — qué comprarle a quién
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {grouped.map(([sup,data])=>{
          const iva = Math.round(data.costSub*0.21)
          const total = data.costSub+iva
          return (
            <div key={sup} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',borderRadius:12,background:w.bg,border:`1px solid ${w.border}`,position:'relative',overflow:'hidden',transition:'transform 0.25s cubic-bezier(0.34,1.4,0.64,1), box-shadow 0.2s',cursor:'default'}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:w.text}}>{sup}</div>
                <div style={{fontSize:11,color:w.muted,marginTop:2}}>{data.items.length} artículo{data.items.length!==1?'s':''}: {data.items.map(i=>`${i.description.slice(0,20)}${i.description.length>20?'...':''} x${i.quantity}`).join(' · ')}</div>
              </div>
              <div style={{display:'flex',gap:20,alignItems:'center'}}>
                {[
                  {label:'Subtotal',val:fmtARS(data.costSub),color:w.text2},
                  {label:'IVA 21%',val:fmtARS(iva),color:w.muted},
                  {label:'Total a pagar',val:fmtARS(total),color:w.orange,bold:true},
                ].map(f=>(
                  <div key={f.label} style={{textAlign:'right'}}>
                    <div style={{fontSize:8,color:w.muted,textTransform:'uppercase',marginBottom:2}}>{f.label}</div>
                    <div style={{fontSize:f.bold?14:12,fontWeight:f.bold?900:600,color:f.color,fontFamily:'var(--font-mono,monospace)'}}>{f.val}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── PDF PRINT VIEW ────────────────────────────────────────────────────────────
function PrintView({ quote, items, conditions, onClose }) {
  const filledItems = items.filter(i=>i.description)
  const neto   = filledItems.reduce((s,i)=>s+(parseFloat(i.subtotal)||0),0)
  const ivaAmt = Math.round(neto*0.21)
  const total  = neto+ivaAmt
  const fmt2   = n=>`$${(parseFloat(n)||0).toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2})}`

  const emptyRows = Math.max(0, Math.min(10, 16-filledItems.length))

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',zIndex:600,display:'flex',flexDirection:'column',alignItems:'center',padding:'20px 20px 40px',overflowY:'auto'}}>
      <style>{`
        @media print {
          html,body{margin:0;padding:0;}
          body>*{display:none!important;}
          #steps-pq{display:block!important;position:fixed!important;top:0;left:0;width:100%;z-index:99999;}
        }
        @page{size:A4;margin:0;}
      `}</style>

      {/* Toolbar */}
      <div style={{display:'flex',gap:10,marginBottom:18,flexWrap:'wrap',justifyContent:'center'}}>
        <button onClick={()=>window.print()} style={{padding:'10px 24px',borderRadius:9,border:'none',cursor:'pointer',background:`linear-gradient(135deg,${w.orangeL},${w.orange})`,color:'#000',fontWeight:800,fontSize:13}}>
          🖨️ Imprimir / Guardar PDF
        </button>
        <a href={`https://wa.me/?text=${encodeURIComponent(
          `✅ *PRESUPUESTO N° ${quote.number} — STEPS*\n━━━━━━━━━━━━━━\n*${quote.client_name}*\n\n`+
          filledItems.map((i,idx)=>`${String(idx+1).padStart(3,'0')}. ${i.description}${i.size?` T:${i.size}`:''}\n     ${i.quantity}u × ${fmt2(i.unit_sale_price)} = *${fmt2(i.subtotal)}*`).join('\n')+
          `\n\n━━━━━━━━━━━━━━\nNeto: ${fmt2(neto)}\nIVA: ${fmt2(ivaAmt)}\n*TOTAL: ${fmt2(total)}*\n\n📋 Válido hasta ${quote.expires_at}\n📍 STEPS — Catriel, Río Negro`
        )}`} target="_blank" rel="noreferrer"
          style={{padding:'10px 24px',borderRadius:9,background:'#25D366',color:'#fff',fontWeight:800,fontSize:13,textDecoration:'none',display:'inline-flex',alignItems:'center',gap:6}}>
          📲 WhatsApp
        </a>
        <button onClick={onClose} style={{padding:'10px 18px',borderRadius:9,border:'1px solid rgba(255,255,255,0.2)',background:'transparent',color:'rgba(255,255,255,0.7)',cursor:'pointer',fontSize:13}}>✕ Cerrar</button>
      </div>

      {/* HOJA A4 */}
      <div id="steps-pq" style={{width:794,background:'#fff',color:'#111',fontFamily:'Arial,Helvetica,sans-serif',boxShadow:'0 0 60px rgba(0,0,0,0.5)',padding:'26px 32px 30px'}}>
        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',paddingBottom:14,marginBottom:14,borderBottom:'3px solid #E8860A'}}>
          <div>
            <img src="/logo.png" alt="STEPS" style={{height:42,width:'auto'}} onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='block'}} />
            <div style={{display:'none',fontSize:26,fontWeight:900,color:'#E8860A',letterSpacing:-1}}>STEPS</div>
            <div style={{fontSize:8,color:'#999',marginTop:5,letterSpacing:2,textTransform:'uppercase'}}>CATRIEL · RIO NEGRO · ARGENTINA</div>
          </div>
          <div style={{display:'flex',gap:18,alignItems:'flex-start'}}>
            <div style={{border:'1.5px solid #ddd',padding:'5px 9px',fontSize:7,color:'#999',textAlign:'center',lineHeight:1.5,borderRadius:3}}>
              Documento no válido<br/>como factura
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:12,fontWeight:900,color:'#222',textTransform:'uppercase',letterSpacing:1}}>PRESUPUESTO N°</div>
              <div style={{fontSize:36,fontWeight:900,color:'#E8860A',fontStyle:'italic',lineHeight:1.1}}>{quote.number}</div>
            </div>
          </div>
        </div>

        {/* Cliente */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',border:'1px solid #e0e0e0',marginBottom:14,borderRadius:4,overflow:'hidden'}}>
          <div style={{padding:'10px 14px',borderRight:'1px solid #e0e0e0'}}>
            <div style={{fontSize:8,color:'#999',textTransform:'uppercase',marginBottom:3}}>Cliente</div>
            <div style={{fontSize:15,fontWeight:900,color:'#E8860A',fontStyle:'italic'}}>{quote.client_name}</div>
            <div style={{fontSize:9,color:'#555',marginTop:2}}>ID: {quote.client_cuit}</div>
            <div style={{fontSize:9,color:'#555'}}>Categoría: <strong>{quote.client_category}</strong></div>
          </div>
          <div style={{padding:'10px 14px'}}>
            <table style={{width:'100%',fontSize:9,borderCollapse:'collapse'}}>
              <tbody>
                {[['Fecha:',quote.date],['Solicita:',quote.solicita],['IVA:',quote.client_iva],['Pago:',conditions.payment],['Envío:',conditions.shipping],['Entrega:',conditions.delivery]].filter(r=>r[1]).map(([k,v])=>(
                  <tr key={k}><td style={{color:'#999',paddingRight:8,paddingBottom:2}}>{k}</td><td style={{fontWeight:700,color:'#222'}}>{v}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabla items */}
        <table style={{width:'100%',borderCollapse:'collapse',marginBottom:14,fontSize:9}}>
          <thead>
            <tr style={{background:'#1a1a1a',color:'#fff'}}>
              {[{h:'N°',w:28,a:'center'},{h:'IMG',w:40,a:'center'},{h:'DESCRIPCIÓN',w:null,a:'left'},{h:'Q',w:24,a:'center'},{h:'UNITARIO s/IVA',w:100,a:'right'},{h:'UNITARIO c/IVA',w:100,a:'right'},{h:'%%%',w:36,a:'center'},{h:'SUBTOTAL',w:100,a:'right'}].map(col=>(
                <th key={col.h} style={{padding:'7px 8px',width:col.w,textAlign:col.a,fontSize:8,fontWeight:700,letterSpacing:0.5}}>{col.h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filledItems.map((item,idx)=>(
              <tr key={item._key||idx} style={{borderBottom:'1px solid #eee',background:idx%2===0?'#fff':'#fafafa'}}>
                <td style={{padding:'7px 8px',textAlign:'center',fontWeight:700,color:'#E8860A'}}>{String(idx+1).padStart(3,'0')}</td>
                <td style={{padding:'4px 6px',textAlign:'center'}}>
                  {item.image_url?<img src={item.image_url} style={{width:30,height:30,objectFit:'cover',borderRadius:4}} />:<span style={{color:'#ddd',fontSize:14}}>—</span>}
                </td>
                <td style={{padding:'7px 8px'}}>{item.description}{item.size?` — T: ${item.size}`:''}</td>
                <td style={{padding:'7px 8px',textAlign:'center',fontWeight:600}}>{item.quantity}</td>
                <td style={{padding:'7px 8px',textAlign:'right'}}>{fmt2(item.unit_sale_price)}</td>
                <td style={{padding:'7px 8px',textAlign:'right',fontWeight:700}}>{fmt2(Math.round((item.unit_sale_price||0)*1.21))}</td>
                <td style={{padding:'7px 8px',textAlign:'center'}}>{item.discount_pct>0?`${item.discount_pct}%`:'0%'}</td>
                <td style={{padding:'7px 8px',textAlign:'right',fontWeight:900,color:'#1a1a1a'}}>{fmt2(item.subtotal)}</td>
              </tr>
            ))}
            {Array.from({length:emptyRows},(_,i)=>(
              <tr key={`e${i}`} style={{borderBottom:'1px solid #f0f0f0',height:28}}>
                <td style={{padding:'4px 8px',textAlign:'center',color:'#ddd',fontSize:8}}>{String(filledItems.length+i+1).padStart(3,'0')}</td>
                <td/><td style={{padding:'4px 8px',color:'#ddd',fontSize:9}}>—</td>
                <td style={{padding:'4px 8px',textAlign:'center',color:'#ddd',fontSize:9}}>0</td>
                <td style={{padding:'4px 8px',textAlign:'right',color:'#ddd',fontSize:9}}>$  —</td>
                <td style={{padding:'4px 8px',textAlign:'right',color:'#ddd',fontSize:9}}>$  —</td>
                <td style={{padding:'4px 8px',textAlign:'center',color:'#ddd',fontSize:9}}>0%</td>
                <td style={{padding:'4px 8px',textAlign:'right',color:'#ddd',fontSize:9}}>$  —</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Vencimiento + totales */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:18}}>
          <div style={{fontSize:9,color:'#555'}}>
            <span style={{color:'#999'}}>Vencimiento del presupuesto: </span>
            <strong>{quote.expires_at}</strong>
          </div>
          <div style={{background:'#1a1a1a',padding:'12px 24px',borderRadius:4,display:'flex',gap:28}}>
            {[{l:'NETO GRAVADO',v:neto},{l:'IVA',v:ivaAmt},{l:'TOTAL',v:total,big:true}].map(row=>(
              <div key={row.l} style={{textAlign:'center'}}>
                <div style={{fontSize:7,color:'#999',fontStyle:'italic',fontWeight:700,textTransform:'uppercase',marginBottom:3}}>{row.l}</div>
                <div style={{fontSize:row.big?16:12,fontWeight:900,color:'#E8860A',fontStyle:'italic'}}>{fmt2(row.v)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{borderTop:'1px solid #eee',paddingTop:10,display:'flex',justifyContent:'space-around',color:'#bbb',fontSize:8}}>
          {['📸 stepsindustrial','✉️ gestionsteps@gmail.com','🌐 walk safe','📘 STEPS.INDUSTRIAL','🖥️ stepsindustrial.com'].map(s=><span key={s}>{s}</span>)}
        </div>
      </div>
    </div>
  )
}



// ── PANEL DE ANÁLISIS FINANCIERO ─────────────────────────────────────────────
function AnalysisPanel({ neto, ivaAmount, total, costoProds, costoExtras, costoIIBB, costoTotal, gananciaBruta, rentPct, extras, items }) {
  const [open, setOpen] = useState(false)
  const [hov,  setHov]  = useState(false)

  const ganColor  = parseFloat(rentPct) >= 15 ? w.lime : parseFloat(rentPct) > 5 ? w.amber : w.rose
  const ganIcon   = parseFloat(rentPct) >= 15 ? '✅' : parseFloat(rentPct) > 0 ? '⚠️' : '❌'
  const ganLabel  = parseFloat(rentPct) >= 15 ? 'Rentable' : parseFloat(rentPct) > 0 ? 'Margen bajo' : 'Pérdida'

  // Agrupado por proveedor para la sección de compras
  const bySupplier = useMemo(() => {
    const map = {}
    items.filter(i => i.description).forEach(i => {
      const s = i.supplier_name || 'Sin proveedor'
      if (!map[s]) map[s] = 0
      map[s] += (parseFloat(i.cost_price_ars) || 0) * (parseFloat(i.quantity) || 0)
    })
    return Object.entries(map)
  }, [items])

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: w.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${w.border}` }}>{title}</div>
      {children}
    </div>
  )

  const Row = ({ label, value, color = w.text2, bold = false, big = false, indent = false }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8, paddingLeft: indent ? 12 : 0 }}>
      <span style={{ fontSize: big ? 12 : 11, color: bold ? w.text : w.muted }}>{label}</span>
      <span style={{ fontSize: big ? 16 : 12, fontWeight: bold ? 900 : 600, color, fontFamily: 'var(--font-mono,monospace)' }}>{value}</span>
    </div>
  )

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 400,
          width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: open
            ? `linear-gradient(135deg,${w.orangeL},${w.orange})`
            : `rgba(255,255,255,${hov ? '0.95' : '0.85'})`,
          backdropFilter: 'blur(20px)',
          boxShadow: open
            ? `0 4px 24px rgba(232,134,10,0.5), 0 0 0 4px rgba(232,134,10,0.15)`
            : hov ? w.shadowMd : w.shadow,
          transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          transform: hov && !open ? 'scale(1.08)' : 'scale(1)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
          color: open ? '#fff' : w.orange,
        }}>
        <span style={{ fontSize: 20 }}>📊</span>
        {neto > 0 && !open && (
          <span style={{ fontSize: 7, fontWeight: 800, color: ganColor, lineHeight: 1 }}>
            {rentPct}%
          </span>
        )}
      </button>

      {/* Panel expandible */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 90, right: 24, zIndex: 399,
          width: 340,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          border: `1px solid ${w.border2}`,
          borderTop: '1px solid rgba(255,255,255,0.98)',
          borderRadius: 20,
          boxShadow: w.shadowLg,
          overflow: 'hidden',
          animation: 'analysisPop 0.32s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <style>{`
            @keyframes analysisPop {
              from { opacity:0; transform:scale(0.88) translateY(12px); transform-origin: bottom right; }
              to   { opacity:1; transform:scale(1) translateY(0); }
            }
          `}</style>

          {/* Header */}
          <div style={{ padding: '14px 18px 12px', borderBottom: `1px solid ${w.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: w.text }}>Análisis de la operación</div>
              <div style={{ fontSize: 10, color: w.muted, marginTop: 1 }}>{items.filter(i=>i.description).length} producto{items.filter(i=>i.description).length!==1?'s':''} · Pre-envío</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10 }}>{ganIcon}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: ganColor }}>{ganLabel}</span>
            </div>
          </div>

          <div style={{ padding: '16px 18px', maxHeight: '70vh', overflowY: 'auto' }}>

            {/* VENTA */}
            <Section title="Venta al cliente">
              <Row label="Neto gravado s/IVA" value={fmtARS(neto)} color={w.text2} />
              <Row label="IVA 21%" value={fmtARS(ivaAmount)} color={w.muted} />
              <div style={{ height: 1, background: w.border, margin: '8px 0' }} />
              <Row label="Total c/IVA" value={fmtARS(total)} color={w.orange} bold big />
            </Section>

            {/* COMPRA */}
            <Section title="Compra a proveedores">
              {bySupplier.map(([sup, costSub]) => {
                const ivaS = Math.round(costSub * 0.21)
                return (
                  <div key={sup} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: w.text, marginBottom: 4 }}>{sup}</div>
                    <Row label="Subtotal s/IVA" value={fmtARS(costSub)} indent />
                    <Row label="IVA 21%" value={fmtARS(ivaS)} color={w.muted} indent />
                    <Row label="Total a pagar" value={fmtARS(costSub + ivaS)} color={w.blue} bold indent />
                  </div>
                )
              })}
            </Section>

            {/* COSTOS EXTRAS */}
            {(costoExtras > 0 || costoIIBB > 0) && (
              <Section title="Costos adicionales">
                {parseFloat(extras.transporte) > 0 && <Row label="Flete / Transporte" value={fmtARS(extras.transporte)} />}
                {parseFloat(extras.diseno) > 0 && <Row label="Diseño / Bordado" value={fmtARS(extras.diseno)} />}
                {parseFloat(extras.iibb_pct) > 0 && <Row label={`Ing. Brutos ${extras.iibb_pct}%`} value={fmtARS(costoIIBB)} color={w.amber} />}
                {parseFloat(extras.otros) > 0 && <Row label="Otros" value={fmtARS(extras.otros)} />}
                <div style={{ height: 1, background: w.border, margin: '8px 0' }} />
                <Row label="Total adicionales" value={fmtARS(costoExtras + costoIIBB)} color={w.text2} bold />
              </Section>
            )}

            {/* RESULTADO */}
            <Section title="Resultado">
              <Row label="Total costos" value={fmtARS(costoTotal)} color={w.muted} />
              <div style={{ height: 1, background: w.border, margin: '8px 0' }} />
              <Row label="Ganancia bruta" value={fmtARS(gananciaBruta)} color={ganColor} bold />

              {/* Barra de rentabilidad */}
              <div style={{ marginTop: 12, padding: '14px 16px', borderRadius: 14, background: `${ganColor}10`, border: `1px solid ${ganColor}25` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
                  <span style={{ fontSize: 10, color: w.muted, textTransform: 'uppercase', fontWeight: 700 }}>Rentabilidad</span>
                  <span style={{ fontSize: 28, fontWeight: 900, color: ganColor, fontFamily: 'var(--font-mono,monospace)', lineHeight: 1 }}>{rentPct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 6, background: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(Math.max(parseFloat(rentPct), 0), 100)}%`, background: `linear-gradient(90deg,${ganColor}88,${ganColor})`, borderRadius: 6, transition: 'width 0.6s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                  <span style={{ fontSize: 8, color: w.muted }}>0%</span>
                  <span style={{ fontSize: 8, color: w.muted }}>Objetivo 15%</span>
                  <span style={{ fontSize: 8, color: w.muted }}>30%+</span>
                </div>
              </div>

              {/* Semáforo de decisión */}
              <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 12, background: w.bg, border: `1px solid ${w.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>{ganIcon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: ganColor }}>{ganLabel}</div>
                  <div style={{ fontSize: 10, color: w.muted, marginTop: 1 }}>
                    {parseFloat(rentPct) >= 15
                      ? 'Podés enviar este presupuesto con confianza.'
                      : parseFloat(rentPct) > 0
                        ? 'Considerá ajustar el margen antes de enviar.'
                        : 'Revisá los costos — operación en negativo.'}
                  </div>
                </div>
              </div>
            </Section>
          </div>
        </div>
      )}
    </>
  )
}

// ── KPI CARD (necesita su propio estado de hover) ────────────────────────────
function KpiCard({ k }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="spotlight-card spotlight-card-light"
      style={{
        ...glassStyle({padding:'18px 20px'}),
        transform: hov ? 'translateY(-5px) scale(1.03)' : 'none',
        boxShadow: hov ? `0 10px 36px ${k.color}28, ${w.shadowMd}` : w.shadow,
        transition: 'all 0.28s cubic-bezier(0.34,1.56,0.64,1)',
        borderTop: `2px solid ${hov ? k.color : 'rgba(0,0,0,0.06)'}`,
        cursor: 'default',
        willChange: 'transform',
      }}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div>
          <div style={{fontSize:32,fontWeight:900,color:k.color,fontFamily:'var(--font-mono,monospace)',letterSpacing:'-1px'}}>{k.val}</div>
          <div style={{fontSize:12,fontWeight:600,color:w.text,marginTop:2}}>{k.label}</div>
          <div style={{fontSize:11,color:k.color,marginTop:1,fontWeight:hov?700:400,transition:'font-weight 0.2s'}}>{k.sub}</div>
        </div>
        <span style={{fontSize:22,opacity:hov?1:0.35,transition:'opacity 0.2s'}}>{k.icon}</span>
      </div>
    </div>
  )
}

// ── MÓDULO PRINCIPAL ──────────────────────────────────────────────────────────
export default function Presupuestos() {
  const [view,        setView]        = useState('list')
  const [quotes,      setQuotes]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [showPrint,   setShowPrint]   = useState(false)
  const [editId,      setEditId]      = useState(null)

  // Form
  const [number,       setNumber]      = useState(325)
  const [date,         setDate]        = useState(today())
  const [expiresAt,    setExpiresAt]   = useState(addDays(today(),5))
  const [status,       setStatus]      = useState('BORRADOR')
  const [clientName,   setClientName]  = useState('')
  const [clientCuit,   setClientCuit]  = useState('')
  const [clientCat,    setClientCat]   = useState('NUEVO')
  const [clientIva,    setClientIva]   = useState('Responsable Inscripto')
  const [solicita,     setSolicita]    = useState('')
  const [cotizacion,   setCotizacion]  = useState(()=>parseFloat(localStorage.getItem('steps_lp_usd'))||1458)
  const [globalMargin, setGlobalMargin]= useState(18)
  const [notes,        setNotes]       = useState('')
  const [items,        setItems]       = useState([EMPTY_ITEM()])
  const [extras,       setExtras]      = useState({transporte:0,diseno:0,iibb_pct:0,otros:0})
  const [conditions,   setConditions]  = useState({payment:'ANTICIPADO',shipping:'INCLUYE ENVÍO',delivery:'A CONFIRMAR'})

  // Cálculos
  const neto          = useMemo(()=>items.reduce((s,i)=>s+(parseFloat(i.subtotal)||0),0),[items])
  const ivaAmount     = useMemo(()=>Math.round(neto*0.21),[neto])
  const total         = useMemo(()=>neto+ivaAmount,[neto,ivaAmount])
  const costoProds    = useMemo(()=>items.reduce((s,i)=>s+(parseFloat(i.cost_price_ars)||0)*(parseFloat(i.quantity)||0),0),[items])
  const costoExtras   = useMemo(()=>[extras.transporte,extras.diseno,extras.otros].reduce((s,v)=>s+(parseFloat(v)||0),0),[extras])
  const costoIIBB     = useMemo(()=>neto*((parseFloat(extras.iibb_pct)||0)/100),[neto,extras.iibb_pct])
  const costoTotal    = useMemo(()=>costoProds+costoExtras+costoIIBB,[costoProds,costoExtras,costoIIBB])
  const gananciaBruta = useMemo(()=>neto-costoTotal,[neto,costoTotal])
  const rentPct       = useMemo(()=>neto>0?((gananciaBruta/neto)*100).toFixed(2):0,[gananciaBruta,neto])

  useEffect(()=>{ loadQuotes() },[])

  const loadQuotes = async () => {
    setLoading(true)
    const {data} = await supabase.from('quotes').select('*').order('number',{ascending:false})
    setQuotes(data||[])
    setLoading(false)
  }

  const newQuote = async () => {
    const {data} = await supabase.from('quotes').select('number').order('number',{ascending:false}).limit(1)
    const next = data?.[0]?.number ? data[0].number+1 : 325
    resetForm(next)
    setEditId(null)
    setView('form')
  }

  const openQuote = async (q) => {
    setEditId(q.id)
    setNumber(q.number); setDate(q.date||today()); setExpiresAt(q.expires_at||addDays(today(),5))
    setStatus(q.status||'BORRADOR'); setClientName(q.client_name||''); setClientCuit(q.client_cuit||'')
    setClientCat(q.client_category||'NUEVO'); setClientIva(q.client_iva||'Responsable Inscripto')
    setSolicita(q.solicita||''); setCotizacion(q.cotizacion||parseFloat(localStorage.getItem('steps_lp_usd'))||1458)
    setGlobalMargin(q.global_margin||18); setNotes(q.notes||'')
    setExtras({transporte:q.costo_transporte||0,diseno:q.costo_diseno||0,iibb_pct:q.costo_iibb_pct||0,otros:q.costo_otros||0})
    setConditions({payment:q.payment_conditions||'ANTICIPADO',shipping:q.shipping_condition||'INCLUYE ENVÍO',delivery:q.delivery_condition||'A CONFIRMAR'})
    const {data:itemsData} = await supabase.from('quote_items').select('*').eq('quote_id',q.id).order('position')
    setItems(itemsData?.length ? itemsData.map(i=>({...i,_key:i.id})) : [EMPTY_ITEM()])
    setView('form')
  }

  const resetForm = (num) => {
    setNumber(num); setDate(today()); setExpiresAt(addDays(today(),5)); setStatus('BORRADOR')
    setClientName(''); setClientCuit(''); setClientCat('NUEVO'); setClientIva('Responsable Inscripto')
    setSolicita(''); setCotizacion(parseFloat(localStorage.getItem('steps_lp_usd'))||1458)
    setGlobalMargin(18); setNotes(''); setItems([EMPTY_ITEM()])
    setExtras({transporte:0,diseno:0,iibb_pct:0,otros:0})
    setConditions({payment:'ANTICIPADO',shipping:'INCLUYE ENVÍO',delivery:'A CONFIRMAR'})
  }

  const addItem    = (item) => setItems(prev=>[...prev,{...item,_key:Math.random().toString(36).slice(2)}])
  const updateItem = (idx,item) => setItems(prev=>prev.map((x,j)=>j===idx?item:x))
  const deleteItem = (idx) => setItems(prev=>prev.filter((_,j)=>j!==idx))
  const addEmpty   = () => setItems(prev=>[...prev,EMPTY_ITEM()])

  const applyMargin = () => setItems(prev=>prev.map(i=>calcItem({...i,margin_pct:globalMargin},cotizacion)))
  const changeDolar = (val) => { setCotizacion(val); setItems(prev=>prev.map(i=>i.unit_price_usd>0?calcItem(i,val):i)) }

  const save = async () => {
    if(!clientName.trim()) return
    setSaving(true)
    const payload = {
      number:+number, date, expires_at:expiresAt, status, client_name:clientName,
      client_cuit:clientCuit, client_category:clientCat, client_iva:clientIva,
      solicita, cotizacion:+cotizacion, global_margin:+globalMargin, notes,
      neto, iva_amount:ivaAmount, total,
      payment_conditions:conditions.payment, shipping_condition:conditions.shipping, delivery_condition:conditions.delivery,
      costo_transporte:+extras.transporte, costo_diseno:+extras.diseno,
      costo_iibb_pct:+extras.iibb_pct, costo_otros:+extras.otros,
      updated_at:new Date(),
    }
    let quoteId = editId
    if(editId) {
      await supabase.from('quotes').update(payload).eq('id',editId)
    } else {
      const {data} = await supabase.from('quotes').insert(payload).select()
      quoteId = data?.[0]?.id
      if(quoteId) setEditId(quoteId)
    }
    if(quoteId) {
      await supabase.from('quote_items').delete().eq('quote_id',quoteId)
      const toInsert = items.filter(i=>i.description?.trim()).map((i,idx)=>({
        quote_id:quoteId, position:idx+1, product_id:i.product_id||null,
        description:i.description, size:i.size||null, quantity:+i.quantity,
        unit_price_usd:+i.unit_price_usd, cost_price_ars:+i.cost_price_ars,
        margin_pct:+i.margin_pct, unit_sale_price:+i.unit_sale_price,
        subtotal:+i.subtotal, iva_pct:21, discount_pct:+i.discount_pct,
        supplier_name:i.supplier_name||null, image_url:i.image_url||null,
      }))
      if(toInsert.length) await supabase.from('quote_items').insert(toInsert)
    }
    await loadQuotes()
    setSaving(false)
  }

  const quoteData = {number,date,expires_at:expiresAt,client_name:clientName,client_cuit:clientCuit,client_category:clientCat,client_iva:clientIva,solicita}
  const sc = STATUSES[status]||STATUSES.BORRADOR

  // ─── LIST VIEW ───
  if(view==='list') {
    const byS  = s=>quotes.filter(q=>q.status===s).length
    const totS = s=>quotes.filter(q=>q.status===s).reduce((a,q)=>a+(q.total||0),0)

    const kpis = [
      {label:'Enviados',    val:byS('ENVIADO'),     sub:fmtShort(totS('ENVIADO')),   color:w.blue,   icon:'📤'},
      {label:'En revisión', val:byS('EN_REVISION'), sub:'Esperando resp.',           color:w.amber,  icon:'🔄'},
      {label:'Aprobados',   val:byS('APROBADO'),    sub:fmtShort(totS('APROBADO')), color:w.lime,   icon:'✅'},
      {label:'Rechazados',  val:byS('RECHAZADO'),   sub:'Este mes',                  color:w.rose,   icon:'❌'},
      {label:'Borradores',  val:byS('BORRADOR'),    sub:'Sin enviar',                color:w.muted,  icon:'📝'},
    ]

    return (
      <div style={{margin:'-24px',padding:'24px',minHeight:'100vh',background:w.bg,overflowX:'hidden'}}>
        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
          <div>
            <h2 style={{margin:0,fontSize:22,fontWeight:800,color:w.text,fontFamily:'var(--font-display)'}}>Presupuestos</h2>
            <p style={{margin:'3px 0 0',color:w.muted,fontSize:13}}>{quotes.length} en total · Pipeline comercial</p>
          </div>
          <button onClick={newQuote} style={{padding:'11px 26px',borderRadius:13,border:'none',cursor:'pointer',background:`linear-gradient(135deg,${w.orangeL},${w.orange})`,color:'#fff',fontWeight:800,fontSize:14,boxShadow:w.shadowOrange,letterSpacing:'0.01em'}}>
            + Nuevo presupuesto
          </button>
        </div>

        {/* KPI Cards */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:24}}>
          {kpis.map(k=><KpiCard key={k.label} k={k} />)}
        </div>

        {/* Lista */}
        {loading ? (
          <div style={{textAlign:'center',padding:'60px 0',color:w.orange,fontSize:32}}>⚡</div>
        ) : quotes.length===0 ? (
          <div style={{...glassStyle({padding:'80px 0'}),textAlign:'center'}}>
            <div style={{fontSize:64,opacity:0.15,marginBottom:16}}>📋</div>
            <div style={{fontSize:16,color:w.muted,marginBottom:24}}>No hay presupuestos todavía</div>
            <button onClick={newQuote} style={{padding:'12px 28px',borderRadius:12,border:'none',cursor:'pointer',background:`linear-gradient(135deg,${w.orangeL},${w.orange})`,color:'#fff',fontWeight:800,fontSize:14}}>
              Crear el primero
            </button>
          </div>
        ) : (
          <div style={{...glassStyle({padding:0,overflow:'hidden'})}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{borderBottom:`1px solid ${w.border2}`}}>
                  {['N°','Cliente','Solicita','Fecha','Vence','Neto','Total','Rent.','Estado',''].map(h=>(
                    <th key={h} style={{padding:'12px 16px',textAlign:'left',fontSize:10,color:w.muted,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {quotes.map(q=>{
                  const sc2 = STATUSES[q.status]||STATUSES.BORRADOR
                  const venc = q.expires_at&&new Date(q.expires_at)<new Date()&&!['APROBADO','RECHAZADO'].includes(q.status)
                  const rent = q.neto>0?(((q.neto-(q.costo_transporte||0)-(q.costo_diseno||0)-(q.costo_otros||0))/q.neto)*100).toFixed(1):null
                  return (
                    <tr key={q.id} style={{borderBottom:`1px solid ${w.border}`,cursor:'pointer',transition:'background .1s'}}
                      onMouseEnter={e=>e.currentTarget.style.background='#F5F5F7'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                      onClick={()=>openQuote(q)}>
                      <td style={{padding:'13px 16px',fontWeight:900,color:w.orange,fontFamily:'var(--font-mono,monospace)'}}># {q.number}</td>
                      <td style={{padding:'13px 16px',fontWeight:700,color:w.text}}>{q.client_name}</td>
                      <td style={{padding:'13px 16px',color:w.muted,fontSize:12}}>{q.solicita||'—'}</td>
                      <td style={{padding:'13px 16px',color:w.muted,fontSize:12}}>{q.date}</td>
                      <td style={{padding:'13px 16px',color:venc?w.rose:w.muted,fontSize:12,fontWeight:venc?700:400}}>{q.expires_at}</td>
                      <td style={{padding:'13px 16px',color:w.text2,fontFamily:'var(--font-mono,monospace)',fontSize:12}}>{fmtShort(q.neto)}</td>
                      <td style={{padding:'13px 16px',fontWeight:800,color:w.orange,fontFamily:'var(--font-mono,monospace)'}}>{fmtShort(q.total)}</td>
                      <td style={{padding:'13px 16px',fontSize:12,fontWeight:700,color:rent>15?w.lime:rent>5?w.amber:w.rose}}>{rent?`${rent}%`:'—'}</td>
                      <td style={{padding:'13px 16px'}}>
                        <span style={{fontSize:10,padding:'4px 10px',borderRadius:20,fontWeight:700,background:`${sc2.color}15`,color:sc2.color,border:`1px solid ${sc2.color}30`}}>
                          {venc?'Vencido':sc2.label}
                        </span>
                      </td>
                      <td style={{padding:'13px 16px'}}>
                        <button onClick={e=>{e.stopPropagation();openQuote(q)}} style={{background:'none',border:`1px solid ${w.border2}`,borderRadius:7,color:w.muted,cursor:'pointer',padding:'4px 10px',fontSize:11,transition:'all .15s'}}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor=w.orange;e.currentTarget.style.color=w.orange}}
                          onMouseLeave={e=>{e.currentTarget.style.borderColor=w.border2;e.currentTarget.style.color=w.muted}}>
                          ✏️
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  // ─── FORM VIEW ───
  return (
    <div style={{margin:'-24px',padding:'0 0 32px',minHeight:'100vh',background:w.bg,overflowX:'hidden'}}>

      {/* TOP BAR fija */}
      <div style={{
        position:'sticky',top:0,zIndex:200,
        background:'rgba(242,242,247,0.75)',backdropFilter:'blur(28px)',
        WebkitBackdropFilter:'blur(20px)',
        borderBottom:`1px solid ${w.border2}`,
        padding:'12px 28px',
        display:'flex',alignItems:'center',gap:14,
      }}>
        <button onClick={()=>{loadQuotes();setView('list')}} style={{background:'none',border:`1px solid ${w.border2}`,borderRadius:9,color:w.muted,cursor:'pointer',padding:'7px 14px',fontSize:12,display:'flex',alignItems:'center',gap:5,transition:'all .15s'}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=w.orange;e.currentTarget.style.color=w.orange}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=w.border2;e.currentTarget.style.color=w.muted}}>
          ← Lista
        </button>

        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:10,color:w.muted,textTransform:'uppercase',fontWeight:600}}>Pres. N°</span>
          <input type="number" value={number} onChange={e=>setNumber(e.target.value)}
            style={{width:70,fontSize:18,fontWeight:900,color:w.orange,textAlign:'center',background:w.orangeDim,border:`1.5px solid ${w.orange}50`,borderRadius:9,padding:'4px 8px',outline:'none',fontFamily:'var(--font-mono,monospace)'}} />
        </div>

        <select value={status} onChange={e=>setStatus(e.target.value)}
          style={{background:`${sc.color}12`,border:`1.5px solid ${sc.color}50`,borderRadius:9,padding:'6px 12px',color:sc.color,fontSize:12,fontWeight:700,outline:'none',cursor:'pointer'}}>
          {Object.entries(STATUSES).map(([k,v])=>(
            <option key={k} value={k} style={{background:w.surface,color:w.text}}>{v.label}</option>
          ))}
        </select>

        {sc.next.map(ns=>{
          const n=STATUSES[ns]
          return <button key={ns} onClick={()=>setStatus(ns)} style={{padding:'6px 12px',borderRadius:9,border:`1.5px solid ${n.color}50`,background:`${n.color}10`,color:n.color,fontSize:11,fontWeight:700,cursor:'pointer',transition:'all .15s'}}
            onMouseEnter={e=>e.currentTarget.style.background=`${n.color}20`}
            onMouseLeave={e=>e.currentTarget.style.background=`${n.color}10`}>
            → {n.label}
          </button>
        })}

        <div style={{flex:1}}/>

        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          <span style={{fontSize:11,color:w.muted}}>LP $</span>
          <input type="number" value={cotizacion} onChange={e=>changeDolar(e.target.value)}
            style={{width:78,fontSize:13,fontWeight:800,color:w.orange,textAlign:'center',background:w.orangeDim,border:`1px solid ${w.orange}40`,borderRadius:8,padding:'5px 6px',outline:'none',fontFamily:'var(--font-mono,monospace)'}} />
        </div>

        <button onClick={()=>setShowPrint(true)} style={{padding:'8px 16px',borderRadius:9,border:`1px solid ${w.border2}`,background:w.surface,color:w.text2,cursor:'pointer',fontSize:12,fontWeight:600}}>
          👁️ Vista PDF
        </button>
        <button onClick={save} disabled={saving||!clientName.trim()} style={{padding:'9px 24px',borderRadius:10,border:'none',cursor:saving||!clientName.trim()?'not-allowed':'pointer',background:`linear-gradient(135deg,${w.orangeL},${w.orange})`,color:'#fff',fontWeight:800,fontSize:13,opacity:!clientName.trim()||saving?0.5:1,boxShadow:clientName?w.shadowOrange:'none'}}>
          {saving?'Guardando...':'💾 Guardar'}
        </button>
      </div>

      <div style={{padding:'20px 24px 0'}}>

        {/* ── SECCIÓN 1: CLIENTE ── */}
        <div style={{...glassStyle({padding:22}),marginBottom:16}}>
          <div style={{fontSize:11,color:w.muted,textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:700,marginBottom:14}}>

            01 · Datos del cliente
          </div>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr',gap:12,alignItems:'end'}}>
            <div>
              <div style={{fontSize:9,color:w.muted,textTransform:'uppercase',fontWeight:600,marginBottom:5}}>Razón social *</div>
              <ClientSearch
                name={clientName} cuit={clientCuit} solicita={solicita} iva={clientIva} category={clientCat}
                onSelect={cl=>{setClientName(cl.name);setClientCuit(cl.cuit);setSolicita(cl.solicita);setClientIva(cl.iva);setClientCat(cl.category)}}
                onChange={(field,val)=>{if(field==='client_name')setClientName(val)}}
              />
            </div>
            {[
              {label:'CUIT',val:clientCuit,set:setClientCuit,ph:'30-12345678-9'},
              {label:'Solicita',val:solicita,set:setSolicita,ph:'Contacto'},
            ].map(f=>(
              <div key={f.label}>
                <div style={{fontSize:9,color:w.muted,textTransform:'uppercase',fontWeight:600,marginBottom:5}}>{f.label}</div>
                <input value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph} style={wi({color:w.text})} />
              </div>
            ))}
            <div>
              <div style={{fontSize:9,color:w.muted,textTransform:'uppercase',fontWeight:600,marginBottom:5}}>IVA</div>
              <select value={clientIva} onChange={e=>setClientIva(e.target.value)} style={wi({color:w.text})}>
                {['Responsable Inscripto','Monotributista','Exento','Consumidor Final'].map(o=><option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:9,color:w.muted,textTransform:'uppercase',fontWeight:600,marginBottom:5}}>Categoría</div>
              <select value={clientCat} onChange={e=>setClientCat(e.target.value)} style={wi({color:w.text})}>
                {['NUEVO','BRONCE','PLATA','ORO'].map(o=><option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── SECCIÓN 2: PRODUCTOS ── */}
        <div style={{...glassStyle({padding:22}),marginBottom:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div style={{fontSize:11,color:w.muted,textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:700}}>
              02 · Productos
            </div>
            <div style={{display:'flex',gap:10,alignItems:'center'}}>
              <span style={{fontSize:11,color:w.muted}}>Margen global:</span>
              <input type="number" value={globalMargin} onChange={e=>setGlobalMargin(e.target.value)}
                style={{...wi({width:60,padding:'5px 8px',fontSize:13,fontWeight:800,color:w.orange,textAlign:'center'}),fontFamily:'var(--font-mono,monospace)'}} />
              <span style={{fontSize:12,color:w.muted,fontWeight:700}}>%</span>
              <button onClick={applyMargin} style={{padding:'6px 14px',borderRadius:8,border:`1.5px solid ${w.orange}50`,background:w.orangeDim,color:w.orange,fontSize:11,fontWeight:700,cursor:'pointer'}}>
                Aplicar a todos
              </button>
              <button onClick={addEmpty} style={{padding:'6px 14px',borderRadius:8,border:`1px solid ${w.border2}`,background:'transparent',color:w.text2,fontSize:11,cursor:'pointer'}}>
                + Fila manual
              </button>
            </div>
          </div>

          <ProductSearch onAdd={addItem} cotizacion={cotizacion} globalMargin={globalMargin} />

          <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:14}}>
            {items.map((item,idx)=>(
              <ProductCard key={item._key} item={item} idx={idx} cotizacion={cotizacion}
                onChange={updated=>updateItem(idx,updated)}
                onDelete={()=>deleteItem(idx)} />
            ))}
          </div>

          {items.length===0&&(
            <div style={{textAlign:'center',padding:'40px 0',color:w.muted,fontSize:13}}>
              Buscá un producto arriba o agregá una fila manual
            </div>
          )}
        </div>

        {/* ── SECCIÓN 3: CONDICIONES ── */}
        <div style={{...glassStyle({padding:22}),marginBottom:16}}>
          <div style={{fontSize:11,color:w.muted,textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:700,marginBottom:16}}>
            03 · Condiciones de la venta
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:24}}>
            <PillPicker label="Forma de pago" options={PAYMENT_OPTIONS} value={conditions.payment} onChange={v=>setConditions(p=>({...p,payment:v}))} color={w.orange} />
            <PillPicker label="Envío" options={SHIPPING_OPTIONS} value={conditions.shipping} onChange={v=>setConditions(p=>({...p,shipping:v}))} color={w.blue} />
            <PillPicker label="Tiempo de entrega" options={DELIVERY_OPTIONS} value={conditions.delivery} onChange={v=>setConditions(p=>({...p,delivery:v}))} color={w.lime} />
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginTop:20,paddingTop:16,borderTop:`1px solid ${w.border}`}}>
            <div>
              <div style={{fontSize:9,color:w.muted,textTransform:'uppercase',fontWeight:600,marginBottom:5}}>Fecha presupuesto</div>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={wi({color:w.text})} />
            </div>
            <div>
              <div style={{fontSize:9,color:w.muted,textTransform:'uppercase',fontWeight:600,marginBottom:5}}>Válido hasta</div>
              <input type="date" value={expiresAt} onChange={e=>setExpiresAt(e.target.value)} style={wi({color:w.text})} />
            </div>
            <div>
              <div style={{fontSize:9,color:w.muted,textTransform:'uppercase',fontWeight:600,marginBottom:5}}>Validez rápida</div>
              <div style={{display:'flex',gap:6}}>
                {[3,5,7,10].map(d=><button key={d} onClick={()=>setExpiresAt(addDays(date,d))} style={{flex:1,padding:'7px 0',borderRadius:8,border:`1px solid ${w.border2}`,background:'transparent',color:w.text2,cursor:'pointer',fontSize:11,fontWeight:600,transition:'all .15s'}}
                  onMouseEnter={e=>{e.currentTarget.style.background=w.orange;e.currentTarget.style.color='#fff';e.currentTarget.style.borderColor=w.orange}}
                  onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=w.text2;e.currentTarget.style.borderColor=w.border2}}>
                  {d}d
                </button>)}
              </div>
            </div>
            <div style={{gridColumn:'span 2'}}>
              <div style={{fontSize:9,color:w.muted,textTransform:'uppercase',fontWeight:600,marginBottom:5}}>Notas internas</div>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} placeholder="Observaciones (no aparecen en el PDF)"
                style={wi({resize:'vertical',color:w.text,lineHeight:1.5})} />
            </div>
          </div>
        </div>

        {/* ── SECCIÓN 4: COSTOS EXTRAS ── */}
        <div style={{...glassStyle({padding:20}),marginBottom:16}}>
          <div style={{fontSize:11,color:w.muted,textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:700,marginBottom:14}}>
            04 · Costos adicionales <span style={{fontSize:10,textTransform:'none',fontStyle:'italic',letterSpacing:0}}>— solo para el cálculo interno de rentabilidad</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
            {[{key:'transporte',label:'Flete / Transporte',prefix:'$'},{key:'diseno',label:'Diseño / Bordado',prefix:'$'},{key:'iibb_pct',label:'Ing. Brutos',prefix:'%'},{key:'otros',label:'Otros',prefix:'$'}].map(f=>(
              <div key={f.key}>
                <div style={{fontSize:9,color:w.muted,textTransform:'uppercase',fontWeight:600,marginBottom:5}}>{f.label}</div>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{fontSize:12,color:w.muted,flexShrink:0}}>{f.prefix}</span>
                  <input type="number" value={extras[f.key]} onChange={e=>setExtras(p=>({...p,[f.key]:e.target.value}))}
                    style={{...wi({color:w.text,fontFamily:'var(--font-mono,monospace)',fontWeight:700,textAlign:'right'})}} />
                </div>
                {f.key==='iibb_pct'&&extras.iibb_pct>0&&<div style={{fontSize:9,color:w.amber,marginTop:3}}>= {fmtARS(costoIIBB)}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* ── SECCIÓN 5: RESUMEN POR PROVEEDOR ── */}
        <SupplierSummary items={items} />

      </div>

      {/* ── BARRA INFERIOR FIJA — TOTALES ── */}
      <div style={{
        position:'fixed',bottom:0,left:0,right:0,zIndex:200,overflowX:'hidden',
        background:'rgba(255,255,255,0.78)',backdropFilter:'blur(28px)',
        WebkitBackdropFilter:'blur(24px)',
        borderTop:`1px solid ${w.border2}`,
        padding:'14px 32px',
        display:'flex',alignItems:'center',gap:24,
      }}>
        {/* Desglose costos */}
        <div style={{display:'flex',gap:20,alignItems:'center',paddingRight:24,borderRight:`1px solid ${w.border}`}}>
          {[
            {l:'Costo productos',v:costoProds,c:w.muted},
            ...(costoExtras>0?[{l:'Costos extras',v:costoExtras,c:w.muted}]:[]),
            ...(costoIIBB>0?[{l:`IIBB ${extras.iibb_pct}%`,v:costoIIBB,c:w.amber}]:[]),
          ].map(f=>(
            <div key={f.l} style={{textAlign:'center'}}>
              <div style={{fontSize:8,color:w.muted,textTransform:'uppercase',fontWeight:600,marginBottom:2}}>{f.l}</div>
              <div style={{fontSize:12,fontWeight:700,color:f.c,fontFamily:'var(--font-mono,monospace)'}}>{fmtShort(f.v)}</div>
            </div>
          ))}
        </div>

        {/* Totales */}
        <div style={{display:'flex',gap:24,alignItems:'center'}}>
          {[
            {l:'NETO s/IVA',v:neto,c:w.text2,s:14},
            {l:'IVA 21%',v:ivaAmount,c:w.muted,s:13},
            {l:'TOTAL c/IVA',v:total,c:w.orange,s:20},
          ].map(f=>(
            <div key={f.l} style={{textAlign:'center'}}>
              <div style={{fontSize:8,color:w.muted,textTransform:'uppercase',fontWeight:700,marginBottom:2}}>{f.l}</div>
              <div style={{fontSize:f.s,fontWeight:900,color:f.c,fontFamily:'var(--font-mono,monospace)'}}>{fmtARS(f.v)}</div>
            </div>
          ))}
        </div>

        <div style={{flex:1}}/>

        {/* Rentabilidad */}
        {neto>0&&(
          <div style={{textAlign:'center',padding:'8px 16px',borderRadius:10,background:parseFloat(rentPct)>=15?`${w.lime}15`:parseFloat(rentPct)>0?w.orangeDim:`${w.rose}12`}}>
            <div style={{fontSize:8,color:w.muted,textTransform:'uppercase',fontWeight:600}}>Rentabilidad real</div>
            <div style={{fontSize:16,fontWeight:900,color:parseFloat(rentPct)>=15?w.lime:parseFloat(rentPct)>0?w.orange:w.rose,fontFamily:'var(--font-mono,monospace)'}}>{rentPct}%</div>
          </div>
        )}

        <button onClick={()=>setShowPrint(true)} style={{padding:'11px 22px',borderRadius:12,border:`1.5px solid ${w.orange}`,background:w.surface,color:w.orange,fontWeight:800,fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
          🖨️ PDF
        </button>
        <button onClick={save} disabled={saving||!clientName.trim()} style={{padding:'11px 28px',borderRadius:12,border:'none',cursor:saving||!clientName.trim()?'not-allowed':'pointer',background:`linear-gradient(135deg,${w.orangeL},${w.orange})`,color:'#fff',fontWeight:800,fontSize:13,opacity:!clientName.trim()||saving?0.5:1,boxShadow:w.shadowOrange}}>
          {saving?'Guardando...':'💾 Guardar presupuesto'}
        </button>
      </div>

      {showPrint&&<PrintView quote={quoteData} items={items} conditions={conditions} onClose={()=>setShowPrint(false)} />}
    </div>
  )
}
