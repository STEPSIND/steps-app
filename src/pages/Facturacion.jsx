import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../supabase'
import { DatePicker } from '../components/DatePicker'
import { PdfExtractor } from '../components/PdfExtractor'

const w = {
  bg: 'rgba(242,242,247,0.55)',
  card: 'rgba(255,255,255,0.72)',
  cardHover: 'rgba(255,255,255,0.90)',
  border: 'rgba(0,0,0,0.07)',
  text: '#1a1a2e',
  muted: '#6b7280',
  sub: '#9ca3af',
  orange: '#FF7A00',
  orangeLight: 'rgba(255,122,0,0.10)',
  orangeGlow: 'rgba(255,122,0,0.28)',
  lime: '#84cc16',
  cyan: '#06b6d4',
  rose: '#f43f5e',
  violet: '#7c3aed',
  amber: '#f59e0b',
  blur: 'blur(24px) saturate(180%)',
}

const TIPOS = ['A','B','C']
const PAYMENT_METHODS = ['Contado','Transferencia','E-Cheque','50% Anticipado / 50% Entrega','Cuenta Corriente','A confirmar']
const STATUSES = [
  { key: 'EMITIDA',   label: 'Emitida',   color: w.cyan },
  { key: 'COBRADA',   label: 'Cobrada',   color: w.lime },
  { key: 'PENDIENTE', label: 'Pendiente', color: w.amber },
  { key: 'VENCIDA',   label: 'Vencida',   color: w.rose },
  { key: 'ANULADA',   label: 'Anulada',   color: w.muted },
]

function getStatus(key) { return STATUSES.find(s => s.key === key) || STATUSES[0] }
function fmtMoney(n, short = false) {
  if (!n) return '$0'
  if (short && n >= 1000000) return `$${(n/1000000).toFixed(1)}M`
  if (short && n >= 1000) return `$${(n/1000).toFixed(0)}k`
  return `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}
function daysAgo(d) {
  if (!d) return null
  return Math.floor((Date.now() - new Date(d)) / 86400000)
}
const round = n => Math.round(n * 100) / 100

const EMPTY_INVOICE = {
  number: '', punto_venta: '00002', tipo: 'A', cae: '', cae_vto: '',
  date: new Date().toISOString().slice(0,10),
  client_id: null, client_name: '', client_cuit: '',
  client_iva: 'Responsable Inscripto', client_address: '',
  quote_id: null, quote_number: '',
  payment_condition: 'Contado', status: 'EMITIDA',
  neto: 0, iva_21: 0, iva_105: 0, otros_tributos: 0, total: 0, notes: '',
}
const EMPTY_ITEM = { code: '', description: '', quantity: 1, unit: 'unidades', unit_price: 0, discount_pct: 0, iva_pct: 21 }

// ── KPI CARD ──────────────────────────────────────────────────────────────────
function KpiCard({ value, label, color, sub, icon }) {
  const [hov, setHov] = useState(false)
  const ref = useRef()
  const onMove = e => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    ref.current.style.setProperty('--sx', `${((e.clientX-r.left)/r.width)*100}%`)
    ref.current.style.setProperty('--sy', `${((e.clientY-r.top)/r.height)*100}%`)
  }
  return (
    <div ref={ref} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onMouseMove={onMove}
      style={{
        flex:'1 1 0', minWidth:110, padding:'16px 18px', borderRadius:18,
        background: hov ? w.cardHover : w.card,
        backdropFilter: w.blur, WebkitBackdropFilter: w.blur,
        border:`1px solid ${hov ? color+'55' : w.border}`,
        boxShadow: hov ? `0 12px 40px ${color}28, inset 0 1px 0 rgba(255,255,255,0.9)` : '0 2px 12px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)',
        transition:'all 0.35s cubic-bezier(0.34,1.4,0.64,1)',
        transform: hov ? 'translateY(-5px) scale(1.03)' : 'none',
        cursor:'default', position:'relative', overflow:'hidden',
      }}>
      <div style={{position:'absolute',inset:0,borderRadius:18,pointerEvents:'none',
        background:`radial-gradient(circle 90px at var(--sx,50%) var(--sy,50%), ${color}20, transparent 70%)`}}/>
      <div style={{position:'absolute',top:0,left:'15%',right:'15%',height:1,
        background:`linear-gradient(90deg,transparent,${color}66,transparent)`}}/>
      {icon && <div style={{fontSize:18,marginBottom:6,opacity:0.6}}>{icon}</div>}
      <div style={{fontSize:22,fontWeight:900,color,fontFamily:"'Space Mono',monospace",
        textShadow: hov ? `0 0 20px ${color}55` : 'none',transition:'text-shadow 0.3s'}}>
        {value}
      </div>
      <div style={{fontSize:11,color:w.muted,marginTop:4,fontWeight:600}}>{label}</div>
      {sub && <div style={{fontSize:10,color:w.sub,marginTop:2}}>{sub}</div>}
    </div>
  )
}

// ── INVOICE ROW ───────────────────────────────────────────────────────────────
function InvoiceRow({ inv, onClick }) {
  const [hov, setHov] = useState(false)
  const st = getStatus(inv.status)
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        display:'grid', gridTemplateColumns:'90px 1fr 140px 120px 120px 100px 90px',
        alignItems:'center', gap:12, padding:'14px 20px',
        background: hov ? w.cardHover : w.card,
        backdropFilter: w.blur, WebkitBackdropFilter: w.blur,
        border:`1px solid ${hov ? st.color+'33' : w.border}`,
        borderRadius:14, cursor:'pointer', position:'relative', overflow:'hidden',
        transform: hov ? 'translateX(4px)' : 'none',
        transition:'all 0.25s cubic-bezier(0.34,1.4,0.64,1)',
        boxShadow: hov ? `0 6px 24px ${st.color}18` : '0 1px 8px rgba(0,0,0,0.04)',
      }}>
      {hov && <div style={{position:'absolute',left:0,top:0,bottom:0,width:3,
        background:st.color,borderRadius:'3px 0 0 3px'}}/>}
      <div style={{fontFamily:"'Space Mono',monospace",fontSize:12,fontWeight:700,color:w.orange}}>
        F{inv.tipo} {String(inv.number||0).padStart(6,'0')}
      </div>
      <div>
        <div style={{fontSize:13,fontWeight:700,color:w.text,whiteSpace:'nowrap',
          overflow:'hidden',textOverflow:'ellipsis'}}>{inv.client_name}</div>
        {inv.client_cuit && <div style={{fontSize:10,color:w.sub,fontFamily:"'Space Mono',monospace"}}>{inv.client_cuit}</div>}
      </div>
      <div style={{fontSize:12,color:w.muted}}>{fmtDate(inv.date)}</div>
      <div style={{fontSize:12,color:w.muted,fontFamily:"'Space Mono',monospace",textAlign:'right'}}>
        {fmtMoney(inv.neto,true)}
      </div>
      <div style={{fontSize:14,fontWeight:800,color:w.orange,fontFamily:"'Space Mono',monospace",textAlign:'right'}}>
        {fmtMoney(inv.total,true)}
      </div>
      <div style={{fontSize:10,color:w.muted,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
        {inv.payment_condition}
      </div>
      <div style={{display:'flex',justifyContent:'flex-end'}}>
        <span style={{fontSize:10,fontWeight:700,padding:'4px 10px',borderRadius:20,
          background:st.color+'18',color:st.color,border:`1px solid ${st.color}33`,
          textTransform:'uppercase',letterSpacing:'0.07em',whiteSpace:'nowrap'}}>
          {st.label}
        </span>
      </div>
    </div>
  )
}

// ── INVOICE MODAL ─────────────────────────────────────────────────────────────
function InvoiceModal({ initial, clients, quotes, onClose, onSaved }) {
  const [form, setForm] = useState(initial ? {...initial} : {...EMPTY_INVOICE})
  const [items, setItems] = useState([])
  const [payments, setPayments] = useState([])
  const [newItem, setNewItem] = useState({...EMPTY_ITEM})
  const [newPay, setNewPay] = useState({method:'Contado',amount:'',due_date:'',status:'PENDIENTE',notes:''})
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('pdf')
  const [clientSearch, setClientSearch] = useState(initial?.client_name || '')
  const [showClientDrop, setShowClientDrop] = useState(false)
  const [quoteSearch, setQuoteSearch] = useState(initial?.quote_number ? `P-${initial.quote_number}` : '')
  const [showQuoteDrop, setShowQuoteDrop] = useState(false)
  const isEdit = !!initial?.id

  useEffect(() => {
    if (isEdit) {
      setTab('datos')
      Promise.all([
        supabase.from('invoice_items').select('*').eq('invoice_id', initial.id).order('position'),
        supabase.from('invoice_payments').select('*').eq('invoice_id', initial.id),
      ]).then(([{data:it},{data:py}]) => {
        setItems(it||[])
        setPayments(py||[])
      })
    } else {
      supabase.from('invoices').select('number').order('number',{ascending:false}).limit(1)
        .then(({data}) => {
          const next = data?.[0]?.number ? data[0].number + 1 : 157
          setForm(f => ({...f, number: next}))
        })
    }
  }, [isEdit, initial?.id])

  useEffect(() => {
    const fn = e => { if (e.key==='Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  const set = (k, v) => setForm(f => ({...f, [k]: v}))

  // Auto-recalc totals from items
  useEffect(() => {
    if (items.length === 0) return
    const neto = items.reduce((s,it) => s + (it.subtotal || 0), 0)
    const iva21 = items.filter(it=>Number(it.iva_pct)===21).reduce((s,it)=>s+(it.subtotal||0)*0.21,0)
    const iva105 = items.filter(it=>Number(it.iva_pct)===10.5).reduce((s,it)=>s+(it.subtotal||0)*0.105,0)
    const total = neto + iva21 + iva105 + (Number(form.otros_tributos)||0)
    setForm(f => ({...f, neto:round(neto), iva_21:round(iva21), iva_105:round(iva105), total:round(total)}))
  }, [items, form.otros_tributos])

  const calcItem = it => {
    const sub = round((it.quantity||0) * (it.unit_price||0) * (1 - (it.discount_pct||0)/100))
    return { ...it, subtotal: sub, subtotal_with_iva: round(sub * (1 + Number(it.iva_pct||21)/100)) }
  }

  const addItem = () => {
    if (!newItem.description.trim()) return
    setItems(its => [...its, { ...calcItem(newItem), id:'tmp_'+Date.now(), position: its.length+1 }])
    setNewItem({...EMPTY_ITEM})
  }

  const updateItem = (idx, key, val) => {
    setItems(its => its.map((it,i) => i===idx
      ? calcItem({...it,[key]:['quantity','unit_price','discount_pct','iva_pct'].includes(key)?Number(val):val})
      : it))
  }

  const addPayment = () => {
    if (!newPay.amount) return
    setPayments(ps => [...ps, {...newPay, id:'tmp_'+Date.now()}])
    setNewPay({method:'Contado',amount:'',due_date:'',status:'PENDIENTE',notes:''})
  }

  // ── PDF extraction handler ─────────────────────────────────────────────────
  const handleExtracted = (data) => {
    setForm(f => ({
      ...f,
      tipo: data.tipo || f.tipo,
      number: data.number || f.number,
      punto_venta: data.punto_venta || f.punto_venta,
      date: data.date || f.date,
      cae: data.cae || f.cae,
      cae_vto: data.cae_vto || f.cae_vto,
      client_name: data.client_name || f.client_name,
      client_cuit: data.client_cuit || f.client_cuit,
      client_iva: data.client_iva || f.client_iva,
      client_address: data.client_address || f.client_address,
      payment_condition: data.payment_condition || f.payment_condition,
      neto: data.neto || f.neto,
      iva_21: data.iva_21 || f.iva_21,
      iva_105: data.iva_105 || f.iva_105,
      otros_tributos: data.otros_tributos || f.otros_tributos,
      total: data.total || f.total,
    }))
    if (data.client_name) setClientSearch(data.client_name)
    if (data.items?.length > 0) {
      setItems(data.items.map((it,i) => ({
        ...it, id:'tmp_'+Date.now()+i, position:i+1,
        subtotal: it.subtotal || round((it.quantity||1)*(it.unit_price||0)),
        subtotal_with_iva: it.subtotal_with_iva || round((it.subtotal||0)*(1+(Number(it.iva_pct||21)/100))),
      })))
    }
    setTab('datos')
  }

  const selectClient = c => {
    setForm(f => ({...f, client_id:c.id, client_name:c.name, client_cuit:c.cuit||'',
      client_iva:c.iva_condition||'Responsable Inscripto', client_address:c.address||''}))
    setClientSearch(c.name)
    setShowClientDrop(false)
  }

  const selectQuote = q => {
    setForm(f => ({...f, quote_id:q.id, quote_number:q.number,
      client_name:q.client_name||f.client_name, client_cuit:q.client_cuit||f.client_cuit}))
    setQuoteSearch(`P-${q.number}`)
    setShowQuoteDrop(false)
  }

  const filteredClients = useMemo(() =>
    clients.filter(c => c.name?.toLowerCase().includes(clientSearch.toLowerCase())).slice(0,8),
    [clients, clientSearch])

  const filteredQuotes = useMemo(() =>
    quotes.filter(q => String(q.number).includes(quoteSearch.replace('P-','')) ||
      q.client_name?.toLowerCase().includes(quoteSearch.toLowerCase())).slice(0,8),
    [quotes, quoteSearch])

  const save = async () => {
    if (!form.client_name?.trim()) return
    setSaving(true)
    const {id, ...payload} = form
    payload.updated_at = new Date()
    ;['neto','iva_21','iva_105','otros_tributos','total','number'].forEach(k => { payload[k] = Number(payload[k])||0 })
    ;['cae_vto'].forEach(k => { if (!payload[k]) payload[k] = null })
    payload.quote_id = payload.quote_id || null
    payload.client_id = payload.client_id || null
    try {
      let invId = initial?.id
      if (isEdit) {
        await supabase.from('invoices').update(payload).eq('id', initial.id)
      } else {
        const {data} = await supabase.from('invoices').insert(payload).select().single()
        invId = data?.id
      }
      if (!isEdit && items.length > 0) {
        for (let i=0; i<items.length; i++) {
          const {id:_, ...ip} = items[i]
          await supabase.from('invoice_items').insert({...ip, invoice_id:invId, position:i+1})
        }
      }
      const newPays = payments.filter(p => String(p.id).startsWith('tmp_'))
      for (const p of newPays) {
        const {id:_, ...pp} = p
        await supabase.from('invoice_payments').insert({...pp, invoice_id:invId, amount:Number(pp.amount)||0})
      }
      await onSaved()
      onClose()
    } catch(e) { console.error(e) }
    setSaving(false)
  }

  const lbl = txt => (
    <div style={{fontSize:11,fontWeight:700,color:w.sub,marginBottom:4,
      textTransform:'uppercase',letterSpacing:'0.06em'}}>{txt}</div>
  )

  const inp = (key, placeholder, extra={}) => (
    <input value={form[key]||''} onChange={e=>set(key,e.target.value)}
      placeholder={placeholder}
      style={{width:'100%',padding:'10px 14px',borderRadius:10,border:`1px solid ${w.border}`,
        background:'rgba(255,255,255,0.7)',color:w.text,fontSize:13,outline:'none',
        boxSizing:'border-box',...extra}}/>
  )

  const sel = (key, opts) => (
    <select value={form[key]||''} onChange={e=>set(key,e.target.value)}
      style={{width:'100%',padding:'10px 14px',borderRadius:10,border:`1px solid ${w.border}`,
        background:'rgba(255,255,255,0.7)',color:w.text,fontSize:13,outline:'none'}}>
      {opts.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  )

  const TABS = [
    {key:'pdf',   label:'📄 PDF'},
    {key:'datos', label:'Encabezado'},
    {key:'items', label:'Productos'},
    {key:'pagos', label:'Pagos'},
    {key:'totales',label:'Totales'},
  ]

  const totalPagos = payments.reduce((s,p)=>s+Number(p.amount||0),0)
  const diff = round((form.total||0) - totalPagos)

  const iStyle = {
    padding:'7px 10px',borderRadius:8,border:`1px solid ${w.border}`,
    background:'rgba(255,255,255,0.8)',color:w.text,fontSize:12,outline:'none',
    width:'100%',boxSizing:'border-box',
  }
  const aStyle = {
    padding:'9px 12px',borderRadius:9,border:`1px solid ${w.border}`,
    background:'rgba(255,255,255,0.8)',color:w.text,fontSize:12,outline:'none',
    width:'100%',boxSizing:'border-box',
  }

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:1000,
      background:'rgba(0,0,0,0.35)',backdropFilter:'blur(10px)',
      display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:'100%',maxWidth:800,maxHeight:'92vh',display:'flex',flexDirection:'column',
        background:'rgba(255,255,255,0.95)',backdropFilter:'blur(40px)',
        border:`1px solid ${w.border}`,borderRadius:26,
        boxShadow:'0 40px 100px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.95)',
      }}>
        {/* Header */}
        <div style={{padding:'22px 26px 0',flexShrink:0}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <span style={{fontSize:11,fontWeight:700,padding:'4px 12px',borderRadius:8,
                  background:`linear-gradient(135deg,${w.orange},#ff9f40)`,color:'#fff',
                  letterSpacing:'0.05em'}}>FACTURA {form.tipo}</span>
                <span style={{fontFamily:"'Space Mono',monospace",fontSize:18,fontWeight:900,color:w.orange}}>
                  {form.number ? String(form.number).padStart(6,'0') : '______'}
                </span>
              </div>
              <div style={{display:'flex',gap:6,marginTop:10,flexWrap:'wrap'}}>
                {STATUSES.map(s=>(
                  <button key={s.key} onClick={()=>set('status',s.key)}
                    style={{fontSize:10,padding:'3px 10px',borderRadius:20,cursor:'pointer',
                      border:`1px solid ${s.color}44`,
                      background:form.status===s.key?s.color:s.color+'18',
                      color:form.status===s.key?'#fff':s.color,
                      fontWeight:700,transition:'all 0.2s'}}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',
              fontSize:22,color:w.muted,lineHeight:1}}>×</button>
          </div>
          <div style={{display:'flex',gap:2,borderBottom:`1px solid ${w.border}`}}>
            {TABS.filter(t => !isEdit || t.key !== 'pdf').map(t=>(
              <button key={t.key} onClick={()=>setTab(t.key)}
                style={{padding:'8px 16px',fontSize:12,fontWeight:600,cursor:'pointer',
                  border:'none',background:'none',
                  color:tab===t.key?w.orange:w.muted,
                  borderBottom:`2px solid ${tab===t.key?w.orange:'transparent'}`,
                  transition:'all 0.2s',marginBottom:-1}}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{flex:1,overflowY:'auto',padding:'20px 26px',display:'flex',flexDirection:'column',gap:14}}>

          {tab==='pdf' && (
            <div>
              <div style={{fontSize:13,color:w.muted,marginBottom:16,lineHeight:1.6}}>
                Subí el PDF de la factura y la IA va a extraer automáticamente todos los datos.
                Después podés revisar y corregir lo que sea necesario en las otras pestañas.
              </div>
              <PdfExtractor onExtracted={handleExtracted} type="factura" />
              <div style={{marginTop:16,padding:'12px 16px',borderRadius:12,
                background:'rgba(0,0,0,0.03)',border:`1px solid ${w.border}`}}>
                <div style={{fontSize:11,color:w.sub,fontWeight:600,marginBottom:4}}>O cargá manualmente</div>
                <div style={{fontSize:12,color:w.muted}}>
                  Hacé clic en <strong>Encabezado</strong> para completar los datos sin subir PDF.
                </div>
              </div>
            </div>
          )}

          {tab==='datos' && (
            <>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
                <div>
                  {lbl('Tipo')}
                  <div style={{display:'flex',gap:6}}>
                    {TIPOS.map(t=>(
                      <button key={t} onClick={()=>set('tipo',t)}
                        style={{flex:1,padding:'10px 0',borderRadius:10,cursor:'pointer',border:'none',
                          background:form.tipo===t?w.orange:'rgba(0,0,0,0.06)',
                          color:form.tipo===t?'#fff':w.muted,fontWeight:800,fontSize:14,
                          transition:'all 0.2s'}}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  {lbl('Número')}
                  {inp('number','000001')}
                </div>
                <div>
                  {lbl('Punto de venta')}
                  {inp('punto_venta','00002')}
                </div>
                <div>
                  {lbl('Fecha')}
                  <DatePicker value={form.date} onChange={v=>set('date',v)} placeholder="Fecha factura"/>
                </div>
              </div>

              {/* Cliente autocomplete */}
              <div style={{position:'relative'}}>
                {lbl('Cliente')}
                <input value={clientSearch}
                  onChange={e=>{setClientSearch(e.target.value);set('client_name',e.target.value);setShowClientDrop(true)}}
                  onFocus={()=>setShowClientDrop(true)} onBlur={()=>setTimeout(()=>setShowClientDrop(false),150)}
                  placeholder="Buscar cliente..."
                  style={{width:'100%',padding:'10px 14px',borderRadius:10,border:`1px solid ${w.border}`,
                    background:'rgba(255,255,255,0.7)',color:w.text,fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                {showClientDrop && filteredClients.length>0 && (
                  <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:200,marginTop:4,
                    background:'rgba(255,255,255,0.98)',border:`1px solid ${w.border}`,borderRadius:12,
                    boxShadow:'0 8px 32px rgba(0,0,0,0.12)',maxHeight:200,overflowY:'auto'}}>
                    {filteredClients.map(c=>(
                      <div key={c.id} onClick={()=>selectClient(c)}
                        style={{padding:'10px 16px',cursor:'pointer',transition:'background 0.15s'}}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(255,122,0,0.08)'}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <div style={{fontSize:13,fontWeight:700,color:w.text}}>{c.name}</div>
                        {c.cuit && <div style={{fontSize:11,color:w.sub}}>{c.cuit}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>{lbl('CUIT cliente')}{inp('client_cuit','XX-XXXXXXXX-X')}</div>
                <div>{lbl('IVA cliente')}{sel('client_iva',['Responsable Inscripto','Monotributista','Exento','Consumidor Final'])}</div>
                <div style={{gridColumn:'1/-1'}}>{lbl('Domicilio cliente')}{inp('client_address','Dirección comercial')}</div>
              </div>

              {/* Presupuesto vinculado */}
              <div style={{position:'relative'}}>
                {lbl('Presupuesto vinculado (opcional)')}
                <input value={quoteSearch}
                  onChange={e=>{setQuoteSearch(e.target.value);setShowQuoteDrop(true)}}
                  onFocus={()=>setShowQuoteDrop(true)} onBlur={()=>setTimeout(()=>setShowQuoteDrop(false),150)}
                  placeholder="Buscar presupuesto..."
                  style={{width:'100%',padding:'10px 14px',borderRadius:10,border:`1px solid ${w.border}`,
                    background:'rgba(255,255,255,0.7)',color:w.text,fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                {showQuoteDrop && filteredQuotes.length>0 && (
                  <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:200,marginTop:4,
                    background:'rgba(255,255,255,0.98)',border:`1px solid ${w.border}`,borderRadius:12,
                    boxShadow:'0 8px 32px rgba(0,0,0,0.12)',maxHeight:180,overflowY:'auto'}}>
                    {filteredQuotes.map(q=>(
                      <div key={q.id} onClick={()=>selectQuote(q)}
                        style={{padding:'10px 16px',cursor:'pointer',transition:'background 0.15s'}}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(255,122,0,0.08)'}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <div style={{fontSize:13,fontWeight:700,color:w.text}}>P-{String(q.number).padStart(4,'0')} — {q.client_name}</div>
                        <div style={{fontSize:11,color:w.sub}}>{fmtMoney(q.total,true)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>{lbl('Condición de venta')}{sel('payment_condition',PAYMENT_METHODS)}</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  <div>{lbl('CAE N°')}{inp('cae','86238...')}</div>
                  <div>
                    {lbl('Vto. CAE')}
                    <DatePicker value={form.cae_vto} onChange={v=>set('cae_vto',v)} placeholder="Vto. CAE"/>
                  </div>
                </div>
              </div>
              <div>
                {lbl('Notas')}
                <textarea value={form.notes||''} onChange={e=>set('notes',e.target.value)}
                  placeholder="Observaciones..." rows={2}
                  style={{width:'100%',padding:'10px 14px',borderRadius:10,border:`1px solid ${w.border}`,
                    background:'rgba(255,255,255,0.7)',color:w.text,fontSize:13,outline:'none',
                    resize:'none',boxSizing:'border-box'}}/>
              </div>
            </>
          )}

          {tab==='items' && (
            <>
              {items.length > 0 && (
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  <div style={{display:'grid',gridTemplateColumns:'50px 1fr 65px 90px 65px 65px 90px 28px',
                    gap:8,padding:'4px 14px'}}>
                    {['Cód','Descripción','Cant.','P.Unit','Bonif%','IVA','Subtotal',''].map(h=>(
                      <div key={h} style={{fontSize:9,color:w.sub,fontWeight:700,
                        textTransform:'uppercase',letterSpacing:'0.05em'}}>{h}</div>
                    ))}
                  </div>
                  {items.map((it,i)=>(
                    <div key={it.id} style={{display:'grid',gridTemplateColumns:'50px 1fr 65px 90px 65px 65px 90px 28px',
                      gap:8,alignItems:'center',padding:'10px 14px',borderRadius:12,
                      background:'rgba(255,255,255,0.65)',border:`1px solid ${w.border}`}}>
                      <input value={it.code||''} onChange={e=>updateItem(i,'code',e.target.value)}
                        placeholder="001" style={{...iStyle,fontSize:11,textAlign:'center'}}/>
                      <input value={it.description} onChange={e=>updateItem(i,'description',e.target.value)}
                        style={{...iStyle,fontSize:12}}/>
                      <input type="number" value={it.quantity} onChange={e=>updateItem(i,'quantity',e.target.value)}
                        style={{...iStyle,textAlign:'center'}}/>
                      <input type="number" value={it.unit_price} onChange={e=>updateItem(i,'unit_price',e.target.value)}
                        style={{...iStyle,textAlign:'right'}}/>
                      <input type="number" value={it.discount_pct||0} onChange={e=>updateItem(i,'discount_pct',e.target.value)}
                        style={{...iStyle,textAlign:'center'}}/>
                      <select value={it.iva_pct} onChange={e=>updateItem(i,'iva_pct',e.target.value)} style={iStyle}>
                        {['0','10.5','21','27'].map(v=><option key={v} value={v}>{v}%</option>)}
                      </select>
                      <div style={{fontFamily:"'Space Mono',monospace",fontSize:12,fontWeight:700,
                        color:w.orange,textAlign:'right'}}>{fmtMoney(it.subtotal,true)}</div>
                      <button onClick={()=>setItems(its=>its.filter((_,j)=>j!==i))}
                        style={{background:'none',border:'none',cursor:'pointer',color:w.rose,fontSize:16}}>×</button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{padding:16,borderRadius:14,background:w.orangeLight,
                border:`1px dashed ${w.orange}44`}}>
                <div style={{fontSize:11,fontWeight:700,color:w.orange,marginBottom:10}}>+ Agregar ítem</div>
                <div style={{display:'grid',gridTemplateColumns:'60px 1fr 65px 100px 65px 65px',gap:8,marginBottom:8}}>
                  <input value={newItem.code} onChange={e=>setNewItem(n=>({...n,code:e.target.value}))}
                    placeholder="Cód." style={aStyle}/>
                  <input value={newItem.description} onChange={e=>setNewItem(n=>({...n,description:e.target.value}))}
                    placeholder="Descripción *" style={aStyle}/>
                  <input type="number" value={newItem.quantity} onChange={e=>setNewItem(n=>({...n,quantity:Number(e.target.value)}))}
                    placeholder="Cant." style={{...aStyle,textAlign:'center'}}/>
                  <input type="number" value={newItem.unit_price} onChange={e=>setNewItem(n=>({...n,unit_price:Number(e.target.value)}))}
                    placeholder="Precio" style={{...aStyle,textAlign:'right'}}/>
                  <input type="number" value={newItem.discount_pct} onChange={e=>setNewItem(n=>({...n,discount_pct:Number(e.target.value)}))}
                    placeholder="%" style={{...aStyle,textAlign:'center'}}/>
                  <select value={newItem.iva_pct} onChange={e=>setNewItem(n=>({...n,iva_pct:Number(e.target.value)}))} style={aStyle}>
                    {['0','10.5','21','27'].map(v=><option key={v} value={v}>IVA {v}%</option>)}
                  </select>
                </div>
                <button onClick={addItem}
                  style={{padding:'8px 20px',borderRadius:10,border:'none',
                    background:w.orange,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>
                  Agregar
                </button>
              </div>
            </>
          )}

          {tab==='pagos' && (
            <>
              {payments.map((p,i)=>(
                <div key={p.id} style={{display:'flex',gap:10,alignItems:'center',padding:'10px 14px',
                  borderRadius:12,background:'rgba(255,255,255,0.65)',border:`1px solid ${w.border}`,flexWrap:'wrap'}}>
                  <div style={{flex:1,minWidth:120}}>
                    <div style={{fontSize:13,fontWeight:700,color:w.text}}>{p.method}</div>
                    {p.due_date && <div style={{fontSize:11,color:w.muted}}>Vence: {fmtDate(p.due_date)}</div>}
                    {p.notes && <div style={{fontSize:11,color:w.sub,fontStyle:'italic'}}>{p.notes}</div>}
                  </div>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:800,color:w.orange}}>
                    {fmtMoney(p.amount)}
                  </div>
                  <span style={{fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:20,
                    background:p.status==='COBRADO'?w.lime+'18':w.amber+'18',
                    color:p.status==='COBRADO'?w.lime:w.amber,
                    border:`1px solid ${p.status==='COBRADO'?w.lime:w.amber}33`}}>{p.status}</span>
                  <button onClick={()=>setPayments(ps=>ps.filter((_,j)=>j!==i))}
                    style={{background:'none',border:'none',cursor:'pointer',color:w.rose,fontSize:16}}>×</button>
                </div>
              ))}
              <div style={{padding:14,borderRadius:14,background:w.orangeLight,border:`1px dashed ${w.orange}44`}}>
                <div style={{fontSize:11,fontWeight:700,color:w.orange,marginBottom:10}}>+ Agregar pago</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 110px',gap:8,marginBottom:8}}>
                  <select value={newPay.method} onChange={e=>setNewPay(p=>({...p,method:e.target.value}))} style={aStyle}>
                    {PAYMENT_METHODS.map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                  <input type="number" value={newPay.amount} onChange={e=>setNewPay(p=>({...p,amount:e.target.value}))}
                    placeholder="Monto $" style={{...aStyle,textAlign:'right'}}/>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                  <DatePicker value={newPay.due_date} onChange={v=>setNewPay(p=>({...p,due_date:v}))} placeholder="Fecha vencimiento"/>
                  <select value={newPay.status} onChange={e=>setNewPay(p=>({...p,status:e.target.value}))} style={aStyle}>
                    {['PENDIENTE','COBRADO','VENCIDO'].map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <input value={newPay.notes} onChange={e=>setNewPay(p=>({...p,notes:e.target.value}))}
                  placeholder="Notas (N° cheque, banco...)" style={{...aStyle,marginBottom:8}}/>
                <button onClick={addPayment}
                  style={{padding:'8px 20px',borderRadius:10,border:'none',
                    background:w.orange,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>
                  Agregar
                </button>
              </div>
              {payments.length > 0 && (
                <div style={{padding:'14px 18px',borderRadius:14,
                  background:diff===0?'rgba(132,204,22,0.08)':diff>0?'rgba(245,158,11,0.08)':'rgba(244,63,94,0.08)',
                  border:`1px solid ${diff===0?w.lime:diff>0?w.amber:w.rose}33`}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                    <span style={{fontSize:13,color:w.muted}}>Total factura</span>
                    <span style={{fontSize:13,fontWeight:700,color:w.orange,fontFamily:"'Space Mono',monospace"}}>{fmtMoney(form.total)}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                    <span style={{fontSize:13,color:w.muted}}>Total pagos</span>
                    <span style={{fontSize:13,fontWeight:700,color:w.lime,fontFamily:"'Space Mono',monospace"}}>{fmtMoney(totalPagos)}</span>
                  </div>
                  <div style={{height:1,background:w.border,marginBottom:8}}/>
                  <div style={{display:'flex',justifyContent:'space-between'}}>
                    <span style={{fontSize:13,fontWeight:700,color:w.text}}>
                      {diff===0?'✓ Cuadra':diff>0?'Por cobrar':'Excede el total'}
                    </span>
                    <span style={{fontSize:14,fontWeight:800,fontFamily:"'Space Mono',monospace",
                      color:diff===0?w.lime:diff>0?w.amber:w.rose}}>{fmtMoney(Math.abs(diff))}</span>
                  </div>
                </div>
              )}
            </>
          )}

          {tab==='totales' && (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{padding:'20px 24px',borderRadius:18,
                background:'linear-gradient(135deg,rgba(255,122,0,0.06),rgba(255,122,0,0.02))',
                border:`1px solid ${w.orange}22`}}>
                {[
                  {label:'Importe Neto Gravado',key:'neto'},
                  {label:'IVA 21%',key:'iva_21'},
                  {label:'IVA 10.5%',key:'iva_105'},
                ].map(r=>(
                  <div key={r.key} style={{display:'flex',justifyContent:'space-between',
                    padding:'8px 0',borderBottom:`1px solid ${w.border}`}}>
                    <span style={{fontSize:13,color:w.muted}}>{r.label}</span>
                    <input type="number" value={form[r.key]||''} onChange={e=>set(r.key,Number(e.target.value))}
                      style={{background:'transparent',border:'none',outline:'none',
                        fontFamily:"'Space Mono',monospace",fontSize:13,color:w.text,
                        textAlign:'right',width:160}}/>
                  </div>
                ))}
                <div style={{display:'flex',justifyContent:'space-between',
                  padding:'8px 0',borderBottom:`1px solid ${w.border}`}}>
                  <span style={{fontSize:13,color:w.muted}}>Otros tributos</span>
                  <input type="number" value={form.otros_tributos||''} onChange={e=>set('otros_tributos',e.target.value)}
                    placeholder="0,00"
                    style={{background:'transparent',border:'none',outline:'none',
                      fontFamily:"'Space Mono',monospace",fontSize:13,color:w.text,textAlign:'right',width:160}}/>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',padding:'16px 0 0'}}>
                  <span style={{fontSize:16,fontWeight:800,color:w.text}}>Importe Total</span>
                  <input type="number" value={form.total||''} onChange={e=>set('total',Number(e.target.value))}
                    style={{background:'transparent',border:'none',outline:'none',
                      fontFamily:"'Space Mono',monospace",fontSize:22,fontWeight:900,color:w.orange,
                      textAlign:'right',width:200}}/>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{padding:'16px 26px',borderTop:`1px solid ${w.border}`,
          display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:800,color:w.orange}}>
            Total: {fmtMoney(form.total)}
          </div>
          <div style={{display:'flex',gap:10}}>
            <button onClick={onClose}
              style={{padding:'10px 20px',borderRadius:12,border:`1px solid ${w.border}`,
                background:'transparent',color:w.muted,fontSize:13,cursor:'pointer',fontWeight:600}}>
              Cancelar
            </button>
            <button onClick={save} disabled={saving}
              style={{padding:'10px 26px',borderRadius:12,border:'none',
                background:`linear-gradient(135deg,${w.orange},#ff9f40)`,
                color:'#fff',fontSize:13,fontWeight:700,cursor:saving?'not-allowed':'pointer',
                boxShadow:`0 4px 16px ${w.orangeGlow}`,opacity:saving?0.7:1,transition:'all 0.2s'}}>
              {saving?'Guardando...':isEdit?'Guardar':'Registrar factura'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function Facturacion() {
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('TODOS')
  const [selected, setSelected] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const load = async () => {
    setLoading(true)
    const [invRes, clientRes, quoteRes] = await Promise.all([
      supabase.from('invoices').select('*').order('date',{ascending:false}),
      supabase.from('clients').select('id,name,cuit,iva_condition,address').order('name'),
      supabase.from('quotes').select('id,number,client_name,client_cuit,total,status').order('number',{ascending:false}),
    ])
    setInvoices(invRes.data||[])
    setClients(clientRes.data||[])
    setQuotes(quoteRes.data||[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => invoices.filter(inv => {
    const q = search.toLowerCase()
    return (!q || inv.client_name?.toLowerCase().includes(q)
      || String(inv.number).includes(q) || inv.client_cuit?.includes(q))
      && (filterStatus==='TODOS' || inv.status===filterStatus)
  }), [invoices, search, filterStatus])

  const kpis = useMemo(() => ({
    emitidas: invoices.length,
    cobradas: invoices.filter(i=>i.status==='COBRADA').length,
    pendientes: invoices.filter(i=>i.status==='PENDIENTE'||i.status==='EMITIDA').length,
    totalNeto: invoices.reduce((s,i)=>s+(i.neto||0),0),
    totalIva: invoices.reduce((s,i)=>s+(i.iva_21||0)+(i.iva_105||0),0),
    totalFact: invoices.reduce((s,i)=>s+(i.total||0),0),
    montoPend: invoices.filter(i=>i.status==='PENDIENTE'||i.status==='EMITIDA').reduce((s,i)=>s+(i.total||0),0),
  }), [invoices])

  const btnStyle = active => ({
    padding:'7px 14px',borderRadius:20,fontSize:11,fontWeight:700,cursor:'pointer',
    border:`1px solid ${active?w.orange+'44':w.border}`,
    background:active?w.orangeLight:'rgba(255,255,255,0.6)',
    color:active?w.orange:w.muted,transition:'all 0.2s',
  })

  return (
    <div style={{minHeight:'100vh',padding:'24px 28px',background:w.bg,
      backdropFilter:w.blur,fontFamily:"'Nunito Sans',sans-serif"}}>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24}}>
        <div>
          <h1 style={{margin:0,fontSize:28,fontWeight:900,fontFamily:"'Syne',sans-serif",
            background:`linear-gradient(135deg,${w.orange},#ff9f40)`,
            WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
            Facturación
          </h1>
          <p style={{margin:'4px 0 0',fontSize:12,color:w.muted,fontStyle:'italic'}}>comprobantes emitidos</p>
        </div>
        <button onClick={()=>{setSelected(null);setShowModal(true)}}
          style={{padding:'11px 22px',borderRadius:14,border:'none',
            background:`linear-gradient(135deg,${w.orange},#ff9f40)`,
            color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',
            boxShadow:`0 4px 20px ${w.orangeGlow}`,transition:'all 0.2s cubic-bezier(0.34,1.4,0.64,1)'}}
          onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px) scale(1.03)'}
          onMouseLeave={e=>e.currentTarget.style.transform='none'}>
          + Nueva factura
        </button>
      </div>

      <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap'}}>
        <KpiCard value={kpis.emitidas} label="Emitidas" color={w.orange} icon="🧾"/>
        <KpiCard value={kpis.cobradas} label="Cobradas" color={w.lime} icon="✓"/>
        <KpiCard value={kpis.pendientes} label="Pendientes" color={w.amber} icon="⏳"/>
        <KpiCard value={fmtMoney(kpis.totalNeto,true)} label="Neto total" color={w.cyan} icon="📊"/>
        <KpiCard value={fmtMoney(kpis.totalIva,true)} label="IVA total" color={w.violet} icon="🏛"/>
        <KpiCard value={fmtMoney(kpis.totalFact,true)} label="Facturado" color={w.orange} icon="💰"/>
        <KpiCard value={fmtMoney(kpis.montoPend,true)} label="Por cobrar" color={w.rose} icon="⚠" sub="emitidas + pend."/>
      </div>

      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Buscar por cliente, N° factura, CUIT..."
          style={{flex:'1 1 200px',padding:'10px 16px',borderRadius:12,
            border:`1px solid ${w.border}`,background:'rgba(255,255,255,0.7)',
            color:w.text,fontSize:13,outline:'none'}}/>
        <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
          <button onClick={()=>setFilterStatus('TODOS')} style={btnStyle(filterStatus==='TODOS')}>Todas</button>
          {STATUSES.map(s=>(
            <button key={s.key} onClick={()=>setFilterStatus(s.key)}
              style={{...btnStyle(filterStatus===s.key),
                borderColor:filterStatus===s.key?s.color+'44':w.border,
                background:filterStatus===s.key?s.color+'18':'rgba(255,255,255,0.6)',
                color:filterStatus===s.key?s.color:w.muted}}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 0 && (
        <div style={{display:'grid',gridTemplateColumns:'90px 1fr 140px 120px 120px 100px 90px',
          gap:12,padding:'6px 20px',marginBottom:6}}>
          {['N° Factura','Cliente','Fecha','Neto','Total','Pago','Estado'].map(h=>(
            <div key={h} style={{fontSize:10,fontWeight:700,color:w.sub,
              textTransform:'uppercase',letterSpacing:'0.06em',
              textAlign:['Neto','Total'].includes(h)?'right':'left'}}>{h}</div>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{textAlign:'center',padding:60,color:w.muted}}>Cargando...</div>
      ) : filtered.length===0 ? (
        <div style={{textAlign:'center',padding:60,color:w.muted}}>
          <div style={{fontSize:40,marginBottom:12}}>🧾</div>
          <div style={{fontSize:14}}>No hay facturas registradas</div>
          <div style={{fontSize:12,marginTop:4,color:w.sub}}>Registrá la primera con + Nueva factura</div>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {filtered.map(inv=>(
            <InvoiceRow key={inv.id} inv={inv} onClick={()=>{setSelected(inv);setShowModal(true)}}/>
          ))}
        </div>
      )}

      {showModal && (
        <InvoiceModal
          initial={selected}
          clients={clients}
          quotes={quotes}
          onClose={()=>{setShowModal(false);setSelected(null)}}
          onSaved={load}
        />
      )}
    </div>
  )
}
