import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../supabase'

const r = {
  bg:          'rgba(20,8,8,0.92)',
  surface:     'rgba(40,15,15,0.85)',
  glass:       'rgba(255,255,255,0.04)',
  glassMid:    'rgba(255,255,255,0.07)',
  glassHov:    'rgba(255,255,255,0.10)',
  border:      'rgba(255,255,255,0.07)',
  border2:     'rgba(255,255,255,0.12)',
  borderHot:   'rgba(180,30,30,0.5)',
  text:        '#F5F0F0',
  text2:       '#D4C8C8',
  muted:       '#9A8080',
  sub:         '#6B5555',
  red:         '#C0392B',
  redL:        '#E74C3C',
  redDim:      'rgba(192,57,43,0.15)',
  redGlow:     'rgba(192,57,43,0.35)',
  lime:        '#27AE60',
  amber:       '#E67E22',
  blue:        '#2980B9',
  violet:      '#8E44AD',
  rose:        '#C0392B',
  shadow:      '0 4px 24px rgba(0,0,0,0.4)',
  shadowMd:    '0 8px 40px rgba(0,0,0,0.5)',
  shadowLg:    '0 16px 64px rgba(0,0,0,0.6)',
}

const CATEGORIES = [
  { key:'PROVEEDOR',    label:'Proveedor EPP',      icon:'📦', color:'#E74C3C' },
  { key:'TRANSPORTE',   label:'Transporte/Flete',   icon:'🚚', color:'#E67E22' },
  { key:'COMBUSTIBLE',  label:'Combustible',         icon:'⛽', color:'#F39C12' },
  { key:'IMPUESTO',     label:'Impuestos/ARCA',      icon:'🏛', color:'#8E44AD' },
  { key:'IIBB',         label:'Ingresos Brutos',     icon:'📊', color:'#2980B9' },
  { key:'GANANCIAS',    label:'Ganancias',           icon:'💼', color:'#16A085' },
  { key:'CONVENIO',     label:'Conv. Multilateral',  icon:'🤝', color:'#27AE60' },
  { key:'CONTADOR',     label:'Contador/Estudio',    icon:'📋', color:'#2C3E50' },
  { key:'ALQUILER',     label:'Alquiler',            icon:'🏠', color:'#7F8C8D' },
  { key:'SERVICIO',     label:'Servicios',           icon:'⚡', color:'#1ABC9C' },
  { key:'SEGURO',       label:'Seguro',              icon:'🛡', color:'#3498DB' },
  { key:'SUELDO',       label:'Sueldos/RRHH',        icon:'👥', color:'#9B59B6' },
  { key:'OTRO',         label:'Otro',                icon:'📎', color:'#95A5A6' },
]

const TYPES    = ['FACTURA','TICKET','RECIBO','NOTA DE CRÉDITO','PRESUPUESTO PROVEEDOR','OTRO']
const STATUSES = [
  { key:'PENDIENTE', label:'Pendiente', color:'#E67E22' },
  { key:'PAGADO',    label:'Pagado',    color:'#27AE60' },
  { key:'VENCIDO',   label:'Vencido',   color:'#C0392B' },
  { key:'ANULADO',   label:'Anulado',   color:'#7F8C8D' },
]
const PAY_METHODS = ['Transferencia','E-Cheque','Efectivo','Cheque','Débito automático','Cuenta corriente']

const fmtARS   = n => `$${(parseFloat(n)||0).toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2})}`
const fmtShort = n => { const v=parseFloat(n)||0; return v>=1e6?`$${(v/1e6).toFixed(1)}M`:v>=1e3?`$${(v/1e3).toFixed(0)}k`:`$${v}` }
const fmtDate  = d => { if(!d) return '—'; return new Date(d+'T12:00:00').toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'numeric'}) }
const today    = () => new Date().toISOString().split('T')[0]
const getCat   = key => CATEGORIES.find(c=>c.key===key)||CATEGORIES[CATEGORIES.length-1]
const getSt    = key => STATUSES.find(s=>s.key===key)||STATUSES[0]

const EMPTY_PURCHASE = {
  number:'', type:'FACTURA', category:'PROVEEDOR', date:today(), due_date:'',
  supplier_name:'', supplier_cuit:'', description:'',
  neto:0, iva_21:0, iva_105:0, otros_tributos:0, total:0,
  status:'PENDIENTE', payment_method:'', paid_date:'', notes:'',
  operation_id:null, quote_id:null, invoice_id:null,
}

const glassCard = (extra={}) => ({
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(24px) saturate(150%)',
  WebkitBackdropFilter: 'blur(24px) saturate(150%)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderTop: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 16,
  ...extra,
})

// ── KPI CARD ──────────────────────────────────────────────────────────────────
function KpiCard({ value, label, color, icon, sub }) {
  const [hov, setHov] = useState(false)
  const ref = useRef()
  const onMove = e => {
    const rc = ref.current?.getBoundingClientRect()
    if (!rc) return
    ref.current.style.setProperty('--sx', `${((e.clientX-rc.left)/rc.width)*100}%`)
    ref.current.style.setProperty('--sy', `${((e.clientY-rc.top)/rc.height)*100}%`)
  }
  return (
    <div ref={ref} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onMouseMove={onMove}
      style={{
        ...glassCard({padding:'16px 18px'}),
        flex:'1 1 0', minWidth:110,
        border: hov ? `1px solid ${color}55` : '1px solid rgba(255,255,255,0.07)',
        borderTop: hov ? `1px solid ${color}88` : '1px solid rgba(255,255,255,0.12)',
        boxShadow: hov ? `0 12px 40px ${color}22` : r.shadow,
        transform: hov ? 'translateY(-5px) scale(1.03)' : 'none',
        transition: 'all 0.35s cubic-bezier(0.34,1.4,0.64,1)',
        cursor: 'default', position: 'relative', overflow: 'hidden',
      }}>
      <div style={{position:'absolute',inset:0,borderRadius:16,pointerEvents:'none',
        background:`radial-gradient(circle 80px at var(--sx,50%) var(--sy,50%), ${color}18, transparent 70%)`}}/>
      <div style={{position:'absolute',top:0,left:'15%',right:'15%',height:1,
        background:`linear-gradient(90deg,transparent,${hov?color+'88':'rgba(255,255,255,0.1)'},transparent)`}}/>
      {icon && <div style={{fontSize:18,marginBottom:6,opacity:hov?0.9:0.5,transition:'opacity 0.2s'}}>{icon}</div>}
      <div style={{fontSize:22,fontWeight:900,color,fontFamily:"'Space Mono',monospace",
        textShadow:hov?`0 0 20px ${color}66`:'none',transition:'text-shadow 0.3s'}}>
        {value}
      </div>
      <div style={{fontSize:11,color:r.muted,marginTop:4,fontWeight:600}}>{label}</div>
      {sub && <div style={{fontSize:10,color:r.sub,marginTop:2}}>{sub}</div>}
    </div>
  )
}

// ── PURCHASE ROW ──────────────────────────────────────────────────────────────
function PurchaseRow({ p, onClick }) {
  const [hov, setHov] = useState(false)
  const cat = getCat(p.category)
  const st  = getSt(p.status)
  const daysLeft = p.due_date ? Math.ceil((new Date(p.due_date) - new Date()) / 86400000) : null
  const isOverdue = daysLeft !== null && daysLeft < 0 && p.status === 'PENDIENTE'
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        display:'grid', gridTemplateColumns:'36px 1fr 130px 100px 120px 110px 90px',
        alignItems:'center', gap:12, padding:'13px 18px',
        ...glassCard(),
        border: hov ? `1px solid ${cat.color}33` : '1px solid rgba(255,255,255,0.06)',
        borderLeft: `3px solid ${hov ? cat.color : 'transparent'}`,
        cursor:'pointer',
        transform: hov ? 'translateX(3px)' : 'none',
        transition:'all 0.2s cubic-bezier(0.34,1.4,0.64,1)',
        boxShadow: hov ? `0 4px 20px rgba(0,0,0,0.4)` : 'none',
      }}>
      <div style={{fontSize:18,textAlign:'center',opacity:0.8}}>{cat.icon}</div>
      <div>
        <div style={{fontSize:13,fontWeight:700,color:r.text,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
          {p.supplier_name}
        </div>
        <div style={{fontSize:10,color:r.muted,marginTop:2}}>{cat.label} · {p.type}</div>
        {p.description && <div style={{fontSize:10,color:r.sub,marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.description}</div>}
      </div>
      <div style={{fontSize:11,color:r.muted}}>{fmtDate(p.date)}</div>
      <div style={{fontSize:11,color:isOverdue?r.redL:r.muted}}>
        {p.due_date ? fmtDate(p.due_date) : '—'}
        {isOverdue && <div style={{fontSize:9,color:r.redL,fontWeight:700}}>VENCIDA</div>}
      </div>
      <div style={{fontSize:13,fontWeight:800,color:r.redL,fontFamily:"'Space Mono',monospace",textAlign:'right'}}>
        {fmtShort(p.total)}
      </div>
      <div style={{fontSize:10,color:r.muted,textAlign:'center'}}>
        {p.payment_method||'—'}
      </div>
      <div style={{display:'flex',justifyContent:'flex-end'}}>
        <span style={{fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:20,
          background:`${st.color}18`,color:st.color,border:`1px solid ${st.color}33`,
          textTransform:'uppercase',letterSpacing:'0.06em',whiteSpace:'nowrap'}}>
          {st.label}
        </span>
      </div>
    </div>
  )
}

// ── MODAL ──────────────────────────────────────────────────────────────────────
function PurchaseModal({ initial, quotes, invoices, onClose, onSaved }) {
  const [form, setForm] = useState(initial ? {...initial} : {...EMPTY_PURCHASE})
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('datos')
  const isEdit = !!initial?.id

  useEffect(() => {
    const fn = e => { if(e.key==='Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  // Auto-calc total
  useEffect(() => {
    const neto = parseFloat(form.neto)||0
    const i21  = parseFloat(form.iva_21)||0
    const i105 = parseFloat(form.iva_105)||0
    const otros= parseFloat(form.otros_tributos)||0
    set('total', Math.round((neto+i21+i105+otros)*100)/100)
  }, [form.neto, form.iva_21, form.iva_105, form.otros_tributos])

  const save = async () => {
    if(!form.supplier_name?.trim()) return
    setSaving(true)
    const {id, ...payload} = form
    payload.updated_at = new Date()
    ;['neto','iva_21','iva_105','otros_tributos','total'].forEach(k=>{ payload[k]=Number(payload[k])||0 })
    ;['due_date','paid_date'].forEach(k=>{ if(!payload[k]) payload[k]=null })
    payload.operation_id = payload.operation_id||null
    payload.quote_id     = payload.quote_id||null
    payload.invoice_id   = payload.invoice_id||null
    try {
      if(isEdit) await supabase.from('purchases').update(payload).eq('id',initial.id)
      else await supabase.from('purchases').insert(payload)
      await onSaved()
      onClose()
    } catch(e) { console.error(e) }
    setSaving(false)
  }

  const inp = (key, placeholder, type='text') => (
    <input value={form[key]||''} onChange={e=>set(key,e.target.value)}
      type={type} placeholder={placeholder}
      style={{width:'100%',padding:'10px 14px',borderRadius:10,
        border:'1px solid rgba(255,255,255,0.1)',
        background:'rgba(255,255,255,0.06)',color:r.text,fontSize:13,outline:'none',
        boxSizing:'border-box'}}/>
  )

  const numInp = (key, placeholder) => (
    <input type="number" value={form[key]||''} onChange={e=>set(key,e.target.value)}
      placeholder={placeholder}
      style={{width:'100%',padding:'10px 14px',borderRadius:10,
        border:'1px solid rgba(255,255,255,0.1)',
        background:'rgba(255,255,255,0.06)',color:r.text,fontSize:13,outline:'none',
        boxSizing:'border-box',fontFamily:"'Space Mono',monospace",textAlign:'right'}}/>
  )

  const sel = (key, opts) => (
    <select value={form[key]||''} onChange={e=>set(key,e.target.value)}
      style={{width:'100%',padding:'10px 14px',borderRadius:10,
        border:'1px solid rgba(255,255,255,0.1)',
        background:'rgba(20,8,8,0.9)',color:r.text,fontSize:13,outline:'none'}}>
      {opts.map(o=>typeof o==='string'
        ? <option key={o} value={o}>{o}</option>
        : <option key={o.key} value={o.key}>{o.label}</option>)}
    </select>
  )

  const lbl = txt => (
    <div style={{fontSize:10,fontWeight:700,color:r.muted,marginBottom:4,
      textTransform:'uppercase',letterSpacing:'0.08em'}}>{txt}</div>
  )

  const TABS = [
    {key:'datos',   label:'Datos'},
    {key:'montos',  label:'Montos'},
    {key:'pago',    label:'Pago'},
    {key:'vinculos',label:'Vínculos'},
  ]

  const cat = getCat(form.category)

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:1000,
      background:'rgba(0,0,0,0.7)',backdropFilter:'blur(12px)',
      display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:'100%',maxWidth:680,maxHeight:'90vh',display:'flex',flexDirection:'column',
        background:'rgba(20,8,8,0.95)',backdropFilter:'blur(40px)',
        border:'1px solid rgba(255,255,255,0.1)',
        borderTop:'1px solid rgba(255,255,255,0.18)',
        borderRadius:24,
        boxShadow:'0 40px 100px rgba(0,0,0,0.7)',
      }}>
        {/* Header */}
        <div style={{padding:'20px 24px 0',flexShrink:0}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:40,height:40,borderRadius:12,
                background:`linear-gradient(135deg,${cat.color}33,${cat.color}11)`,
                border:`1px solid ${cat.color}44`,
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>
                {cat.icon}
              </div>
              <div>
                <h3 style={{margin:0,fontSize:16,fontWeight:800,color:r.text,fontFamily:"'Syne',sans-serif"}}>
                  {isEdit ? form.supplier_name : 'Nuevo gasto'}
                </h3>
                <div style={{fontSize:11,color:r.muted,marginTop:2}}>{cat.label}</div>
              </div>
            </div>
            <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',
              fontSize:22,color:r.muted,lineHeight:1}}>×</button>
          </div>

          {/* Status pills */}
          <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
            {STATUSES.map(s=>(
              <button key={s.key} onClick={()=>set('status',s.key)}
                style={{fontSize:10,padding:'4px 12px',borderRadius:20,cursor:'pointer',
                  border:`1px solid ${s.color}44`,
                  background:form.status===s.key?s.color:s.color+'18',
                  color:form.status===s.key?'#fff':s.color,
                  fontWeight:700,transition:'all 0.2s'}}>
                {s.label}
              </button>
            ))}
          </div>

          <div style={{display:'flex',gap:2,borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
            {TABS.map(t=>(
              <button key={t.key} onClick={()=>setTab(t.key)}
                style={{padding:'8px 16px',fontSize:12,fontWeight:600,cursor:'pointer',
                  border:'none',background:'none',
                  color:tab===t.key?r.redL:r.muted,
                  borderBottom:`2px solid ${tab===t.key?r.redL:'transparent'}`,
                  transition:'all 0.2s',marginBottom:-1}}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{flex:1,overflowY:'auto',padding:'20px 24px',display:'flex',flexDirection:'column',gap:14}}>

          {tab==='datos' && (
            <>
              {/* Categoría pills */}
              <div>
                {lbl('Categoría')}
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  {CATEGORIES.map(c=>(
                    <button key={c.key} onClick={()=>set('category',c.key)}
                      style={{padding:'6px 12px',borderRadius:20,cursor:'pointer',fontSize:11,
                        border:`1px solid ${form.category===c.key?c.color:r.border}`,
                        background:form.category===c.key?`${c.color}22`:'transparent',
                        color:form.category===c.key?c.color:r.muted,
                        fontWeight:form.category===c.key?700:400,transition:'all 0.2s'}}>
                      {c.icon} {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div style={{gridColumn:'1/-1'}}>
                  {lbl('Proveedor / Empresa *')}
                  {inp('supplier_name','Nombre del proveedor')}
                </div>
                <div>
                  {lbl('CUIT')}
                  {inp('supplier_cuit','XX-XXXXXXXX-X')}
                </div>
                <div>
                  {lbl('Tipo de comprobante')}
                  {sel('type', TYPES)}
                </div>
                <div>
                  {lbl('N° Comprobante')}
                  {inp('number','0001-00000001')}
                </div>
                <div>
                  {lbl('Fecha')}
                  {inp('date','','date')}
                </div>
                <div>
                  {lbl('Vencimiento')}
                  {inp('due_date','','date')}
                </div>
                <div style={{gridColumn:'1/-1'}}>
                  {lbl('Descripción')}
                  <textarea value={form.description||''} onChange={e=>set('description',e.target.value)}
                    placeholder="Detalle de la compra o gasto..." rows={2}
                    style={{width:'100%',padding:'10px 14px',borderRadius:10,
                      border:'1px solid rgba(255,255,255,0.1)',
                      background:'rgba(255,255,255,0.06)',color:r.text,fontSize:13,
                      outline:'none',resize:'none',boxSizing:'border-box'}}/>
                </div>
              </div>
            </>
          )}

          {tab==='montos' && (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{padding:'20px 24px',borderRadius:16,
                background:'rgba(192,57,43,0.06)',border:'1px solid rgba(192,57,43,0.15)'}}>
                {[
                  {key:'neto',label:'Neto gravado'},
                  {key:'iva_21',label:'IVA 21%'},
                  {key:'iva_105',label:'IVA 10.5%'},
                  {key:'otros_tributos',label:'Otros tributos'},
                ].map(row=>(
                  <div key={row.key} style={{display:'flex',justifyContent:'space-between',
                    alignItems:'center',padding:'10px 0',
                    borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                    <span style={{fontSize:13,color:r.muted}}>{row.label}</span>
                    <div style={{width:180}}>{numInp(row.key,'0,00')}</div>
                  </div>
                ))}
                <div style={{display:'flex',justifyContent:'space-between',
                  alignItems:'center',padding:'14px 0 0'}}>
                  <span style={{fontSize:16,fontWeight:800,color:r.text}}>Total</span>
                  <span style={{fontSize:22,fontWeight:900,color:r.redL,
                    fontFamily:"'Space Mono',monospace"}}>
                    {fmtARS(form.total)}
                  </span>
                </div>
              </div>
              <div style={{fontSize:11,color:r.sub,fontStyle:'italic'}}>
                El total se calcula automáticamente. También podés editar el total directamente:
              </div>
              <div>
                {lbl('Total (edición directa)')}
                {numInp('total','0,00')}
              </div>
            </div>
          )}

          {tab==='pago' && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div style={{gridColumn:'1/-1'}}>
                {lbl('Método de pago')}
                {sel('payment_method',['', ...PAY_METHODS])}
              </div>
              <div>
                {lbl('Fecha de pago')}
                {inp('paid_date','','date')}
              </div>
              <div style={{gridColumn:'1/-1'}}>
                {lbl('Notas')}
                <textarea value={form.notes||''} onChange={e=>set('notes',e.target.value)}
                  placeholder="Observaciones del pago..." rows={4}
                  style={{width:'100%',padding:'10px 14px',borderRadius:10,
                    border:'1px solid rgba(255,255,255,0.1)',
                    background:'rgba(255,255,255,0.06)',color:r.text,fontSize:13,
                    outline:'none',resize:'vertical',boxSizing:'border-box'}}/>
              </div>
            </div>
          )}

          {tab==='vinculos' && (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{padding:'14px 16px',borderRadius:12,
                background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>
                <div style={{fontSize:12,fontWeight:700,color:r.text,marginBottom:4}}>
                  Vincular a presupuesto
                </div>
                <div style={{fontSize:11,color:r.muted,marginBottom:10}}>
                  Asociá este gasto a una venta específica para calcular la rentabilidad real.
                </div>
                <select value={form.quote_id||''} onChange={e=>set('quote_id',e.target.value||null)}
                  style={{width:'100%',padding:'10px 14px',borderRadius:10,
                    border:'1px solid rgba(255,255,255,0.1)',
                    background:'rgba(20,8,8,0.9)',color:r.text,fontSize:13,outline:'none'}}>
                  <option value="">— Sin vincular —</option>
                  {quotes.map(q=>(
                    <option key={q.id} value={q.id}>
                      P-{String(q.number).padStart(4,'0')} · {q.client_name} · {fmtShort(q.total)}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{padding:'14px 16px',borderRadius:12,
                background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>
                <div style={{fontSize:12,fontWeight:700,color:r.text,marginBottom:4}}>
                  Vincular a factura emitida
                </div>
                <select value={form.invoice_id||''} onChange={e=>set('invoice_id',e.target.value||null)}
                  style={{width:'100%',padding:'10px 14px',borderRadius:10,
                    border:'1px solid rgba(255,255,255,0.1)',
                    background:'rgba(20,8,8,0.9)',color:r.text,fontSize:13,outline:'none'}}>
                  <option value="">— Sin vincular —</option>
                  {invoices.map(inv=>(
                    <option key={inv.id} value={inv.id}>
                      F{inv.tipo} {String(inv.number||0).padStart(6,'0')} · {inv.client_name} · {fmtShort(inv.total)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{padding:'16px 24px',borderTop:'1px solid rgba(255,255,255,0.06)',
          display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:14,fontWeight:900,color:r.redL}}>
            {fmtARS(form.total)}
          </div>
          <div style={{display:'flex',gap:10}}>
            <button onClick={onClose}
              style={{padding:'10px 20px',borderRadius:12,
                border:'1px solid rgba(255,255,255,0.1)',
                background:'transparent',color:r.muted,fontSize:13,cursor:'pointer',fontWeight:600}}>
              Cancelar
            </button>
            <button onClick={save} disabled={saving}
              style={{padding:'10px 26px',borderRadius:12,border:'none',
                background:`linear-gradient(135deg,${r.redL},${r.red})`,
                color:'#fff',fontSize:13,fontWeight:700,
                cursor:saving?'not-allowed':'pointer',
                boxShadow:`0 4px 16px ${r.redGlow}`,
                opacity:saving?0.7:1,transition:'all 0.2s'}}>
              {saving?'Guardando...':isEdit?'Guardar cambios':'Registrar gasto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function Compras() {
  const [purchases,  setPurchases]  = useState([])
  const [quotes,     setQuotes]     = useState([])
  const [invoices,   setInvoices]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [filterCat,  setFilterCat]  = useState('TODOS')
  const [filterSt,   setFilterSt]   = useState('TODOS')
  const [selected,   setSelected]   = useState(null)
  const [showModal,  setShowModal]  = useState(false)

  const load = async () => {
    setLoading(true)
    const [pRes, qRes, iRes] = await Promise.all([
      supabase.from('purchases').select('*').order('date',{ascending:false}),
      supabase.from('quotes').select('id,number,client_name,total,status').order('number',{ascending:false}),
      supabase.from('invoices').select('id,number,tipo,client_name,total').order('date',{ascending:false}),
    ])
    setPurchases(pRes.data||[])
    setQuotes(qRes.data||[])
    setInvoices(iRes.data||[])
    setLoading(false)
  }

  useEffect(()=>{ load() },[])

  const filtered = useMemo(()=>purchases.filter(p=>{
    const q = search.toLowerCase()
    return (!q || p.supplier_name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
      && (filterCat==='TODOS' || p.category===filterCat)
      && (filterSt==='TODOS'  || p.status===filterSt)
  }),[purchases,search,filterCat,filterSt])

  const kpis = useMemo(()=>{
    const total     = purchases.reduce((s,p)=>s+(p.total||0),0)
    const pendiente = purchases.filter(p=>p.status==='PENDIENTE').reduce((s,p)=>s+(p.total||0),0)
    const pagado    = purchases.filter(p=>p.status==='PAGADO').reduce((s,p)=>s+(p.total||0),0)
    const vencido   = purchases.filter(p=>p.status==='VENCIDO').length
    const porCat    = CATEGORIES.map(c=>({
      ...c, total:purchases.filter(p=>p.category===c.key).reduce((s,p)=>s+(p.total||0),0)
    })).filter(c=>c.total>0).sort((a,b)=>b.total-a.total)[0]
    return { total, pendiente, pagado, vencido, topCat:porCat }
  },[purchases])

  const btnStyle = (active, color=r.redL) => ({
    padding:'6px 13px',borderRadius:20,fontSize:11,fontWeight:700,cursor:'pointer',
    border:`1px solid ${active?color+'44':r.border}`,
    background:active?`${color}18`:'transparent',
    color:active?color:r.muted,transition:'all 0.2s',
  })

  return (
    <div style={{minHeight:'100vh',padding:'24px 28px',
      background:'linear-gradient(160deg,#0d0404 0%,#150606 40%,#0a0303 100%)',
      fontFamily:"'Nunito Sans',sans-serif",color:r.text}}>

      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24}}>
        <div>
          <h1 style={{margin:0,fontSize:28,fontWeight:900,fontFamily:"'Syne',sans-serif",
            background:`linear-gradient(135deg,${r.redL},#FF6B6B)`,
            WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
            Compras
          </h1>
          <p style={{margin:'4px 0 0',fontSize:12,color:r.muted,fontStyle:'italic'}}>
            gastos, facturas recibidas y costos operativos
          </p>
        </div>
        <button onClick={()=>{setSelected(null);setShowModal(true)}}
          style={{padding:'11px 22px',borderRadius:14,border:'none',
            background:`linear-gradient(135deg,${r.redL},${r.red})`,
            color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',
            boxShadow:`0 4px 20px ${r.redGlow}`,transition:'all 0.2s cubic-bezier(0.34,1.4,0.64,1)'}}
          onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px) scale(1.03)'}
          onMouseLeave={e=>e.currentTarget.style.transform='none'}>
          + Nuevo gasto
        </button>
      </div>

      {/* KPIs */}
      <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'nowrap',overflowX:'auto',paddingBottom:8}}>
        <KpiCard value={fmtShort(kpis.total)} label="Total gastos" color={r.redL} icon="💸"/>
        <KpiCard value={fmtShort(kpis.pendiente)} label="Por pagar" color={r.amber} icon="⏳" sub="pendiente"/>
        <KpiCard value={fmtShort(kpis.pagado)} label="Pagado" color={r.lime} icon="✓"/>
        <KpiCard value={kpis.vencido} label="Vencidas" color={r.red} icon="⚠" sub="sin pagar"/>
        <KpiCard value={purchases.length} label="Registros" color='#8E44AD' icon="📋"/>
        {kpis.topCat && (
          <KpiCard value={kpis.topCat.icon} label={kpis.topCat.label} color={kpis.topCat.color}
            sub={fmtShort(kpis.topCat.total)}/>
        )}
      </div>

      {/* Resumen por categoría */}
      {purchases.length > 0 && (
        <div style={{...glassCard({padding:'16px 20px'}),marginBottom:16}}>
          <div style={{fontSize:10,fontWeight:700,color:r.muted,textTransform:'uppercase',
            letterSpacing:'0.08em',marginBottom:12}}>Distribución por categoría</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {CATEGORIES.map(c=>{
              const total = purchases.filter(p=>p.category===c.key).reduce((s,p)=>s+(p.total||0),0)
              if(!total) return null
              const pct = kpis.total > 0 ? ((total/kpis.total)*100).toFixed(0) : 0
              return (
                <div key={c.key} onClick={()=>setFilterCat(filterCat===c.key?'TODOS':c.key)}
                  style={{display:'flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:12,cursor:'pointer',
                    background:filterCat===c.key?`${c.color}22`:'rgba(255,255,255,0.04)',
                    border:`1px solid ${filterCat===c.key?c.color+'44':r.border}`,transition:'all 0.2s'}}>
                  <span style={{fontSize:14}}>{c.icon}</span>
                  <div>
                    <div style={{fontSize:10,fontWeight:700,color:c.color}}>{pct}%</div>
                    <div style={{fontSize:9,color:r.muted}}>{fmtShort(total)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Buscar proveedor, descripción..."
          style={{flex:'1 1 200px',padding:'10px 16px',borderRadius:12,
            border:'1px solid rgba(255,255,255,0.1)',
            background:'rgba(255,255,255,0.05)',color:r.text,fontSize:13,outline:'none'}}/>
        <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
          <button onClick={()=>setFilterSt('TODOS')} style={btnStyle(filterSt==='TODOS')}>Todos</button>
          {STATUSES.map(s=>(
            <button key={s.key} onClick={()=>setFilterSt(s.key)}
              style={btnStyle(filterSt===s.key, s.color)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Column headers */}
      {filtered.length > 0 && (
        <div style={{display:'grid',gridTemplateColumns:'36px 1fr 130px 100px 120px 110px 90px',
          gap:12,padding:'6px 18px',marginBottom:6}}>
          {['','Proveedor','Fecha','Vencimiento','Total','Pago','Estado'].map(h=>(
            <div key={h} style={{fontSize:10,fontWeight:700,color:r.sub,
              textTransform:'uppercase',letterSpacing:'0.06em'}}>{h}</div>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{textAlign:'center',padding:60,color:r.muted}}>Cargando...</div>
      ) : filtered.length===0 ? (
        <div style={{textAlign:'center',padding:60,color:r.muted}}>
          <div style={{fontSize:40,marginBottom:12,opacity:0.3}}>💸</div>
          <div style={{fontSize:14}}>No hay gastos registrados</div>
          <div style={{fontSize:12,marginTop:4,color:r.sub}}>Registrá el primero con + Nuevo gasto</div>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          {filtered.map(p=>(
            <PurchaseRow key={p.id} p={p}
              onClick={()=>{setSelected(p);setShowModal(true)}}/>
          ))}
        </div>
      )}

      {showModal && (
        <PurchaseModal
          initial={selected}
          quotes={quotes}
          invoices={invoices}
          onClose={()=>{setShowModal(false);setSelected(null)}}
          onSaved={load}
        />
      )}
    </div>
  )
}
