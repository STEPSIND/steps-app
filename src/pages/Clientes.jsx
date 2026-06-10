import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../supabase'

const w = {
  bg: 'rgba(242,242,247,0.55)',
  card: 'rgba(255,255,255,0.72)',
  cardHover: 'rgba(255,255,255,0.88)',
  border: 'rgba(0,0,0,0.07)',
  borderHover: 'rgba(255,122,0,0.3)',
  text: '#1a1a2e',
  muted: '#6b7280',
  sub: '#9ca3af',
  orange: '#FF7A00',
  orangeLight: 'rgba(255,122,0,0.12)',
  orangeGlow: 'rgba(255,122,0,0.25)',
  amber: '#f59e0b',
  lime: '#84cc16',
  cyan: '#06b6d4',
  rose: '#f43f5e',
  violet: '#7c3aed',
  glass: 'rgba(255,255,255,0.82)',
  blur: 'blur(24px) saturate(180%)',
}

const INDUSTRIES = ['Oil & Gas','Construcción','Geotécnica','Transporte','Ingeniería','Minería','Agro','Energía','Manufactura','Otro']
const SECTORS = ['Perforación','Mantenimiento','Logística','Producción','Construcción de pozo','Completación','Servicios','Seguridad industrial','Otro']
const EMPLOYEE_RANGES = ['1-10','11-50','51-200','201-500','500+']
const ZONES = ['Neuquén','Río Negro','Mendoza','La Pampa','Chubut','Santa Cruz','Offshore','Nacional','Internacional']
const IVA_CONDITIONS = ['Responsable Inscripto','Monotributista','Exento','Consumidor Final']
const PAYMENT_CONDITIONS = ['ANTICIPADO','TRANSFERENCIA ENTREGA','CHEQUE','CUENTA CORRIENTE','30 DÍAS','60 DÍAS']
const DELIVERY_CONDITIONS = ['ENVÍO A OBRA','RETIRA EN DEPÓSITO','ENVÍO A OFICINA','A DEFINIR']
const CONTACT_PREFS = ['WhatsApp','Mail','Llamada','Reunión presencial']
const FREQUENCIES = ['Semanal','Mensual','Trimestral','Semestral','Por proyecto','Esporádico']
const VIAS = ['WhatsApp','Mail','Llamada','Referido','LinkedIn','Visita','Instagram','Otro']
const STATUSES = [
  { key: 'LEAD', label: 'Lead', color: w.cyan },
  { key: 'CONTACTAR', label: 'A contactar', color: w.amber },
  { key: 'EN_CONTACTO', label: 'En contacto', color: w.orange },
  { key: 'PROSPECTO', label: 'Prospecto', color: w.violet },
  { key: 'ACTIVO', label: 'Activo', color: w.lime },
  { key: 'INACTIVO', label: 'Inactivo', color: w.muted },
]
const CATEGORIES = [
  { key: 'BRONCE', label: 'Bronce', color: '#cd7f32', min: 0 },
  { key: 'PLATA', label: 'Plata', color: '#9ca3af', min: 1000000 },
  { key: 'ORO', label: 'Oro', color: '#f59e0b', min: 5000000 },
]

function getStatusMeta(key) { return STATUSES.find(s => s.key === key) || STATUSES[0] }
function getCategoryMeta(rev) {
  if (rev >= 5000000) return CATEGORIES[2]
  if (rev >= 1000000) return CATEGORIES[1]
  return CATEGORIES[0]
}
function getFavicon(website) {
  if (!website) return null
  try {
    const url = website.startsWith('http') ? website : `https://${website}`
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  } catch { return null }
}
function daysAgo(dateStr) {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000)
}
function fmtMoney(n) {
  if (!n) return '$0'
  if (n >= 1000000) return `$${(n/1000000).toFixed(1)}M`
  if (n >= 1000) return `$${(n/1000).toFixed(0)}k`
  return `$${n}`
}

const EMPTY_CLIENT = {
  status: 'LEAD', name: '', cuit: '', industry: '', sector: '',
  employees_range: '', operation_zone: '', current_supplier: '',
  iva_condition: 'Responsable Inscripto', website: '', logo_url: '',
  contact_name: '', contact_role: '', phone: '', phone_corporate: '',
  email: '', whatsapp: '', login_email: '',
  contact_preference: 'WhatsApp', best_contact_time: '',
  decision_maker: '', buyer_contact: '',
  city: '', province: 'Neuquén', address: '',
  payment_condition: 'ANTICIPADO', delivery_condition: 'ENVÍO A OBRA',
  discount_pct: 0, credit_days: 0, credit_limit: 0,
  uses_purchase_order: false,
  regular_products: '', purchase_frequency: 'Mensual',
  next_estimated_purchase: '', renewal_date: '',
  services: '', via: '', next_action: '', next_action_date: '', notes: '',
}

// ── KPI CARD ──────────────────────────────────────────────────────────────────
function KpiCard({ value, label, color, sub }) {
  const [hov, setHov] = useState(false)
  const ref = useRef()
  const onMove = e => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    ref.current.style.setProperty('--sx', `${((e.clientX-r.left)/r.width)*100}%`)
    ref.current.style.setProperty('--sy', `${((e.clientY-r.top)/r.height)*100}%`)
  }
  return (
    <div ref={ref} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onMouseMove={onMove}
      style={{
        flex:'1 1 0', minWidth:100, padding:'14px 18px', borderRadius:16,
        background: hov ? w.cardHover : w.card,
        backdropFilter: w.blur, WebkitBackdropFilter: w.blur,
        border:`1px solid ${hov ? color+'44' : w.border}`,
        boxShadow: hov ? `0 8px 32px ${color}22` : '0 2px 12px rgba(0,0,0,0.06)',
        transition:'all 0.3s cubic-bezier(0.34,1.4,0.64,1)',
        transform: hov ? 'translateY(-3px) scale(1.02)' : 'none',
        cursor:'default', position:'relative', overflow:'hidden',
      }}>
      <div style={{position:'absolute',inset:0,borderRadius:16,pointerEvents:'none',
        background:`radial-gradient(circle 80px at var(--sx,50%) var(--sy,50%), ${color}18, transparent 70%)`}}/>
      <div style={{fontSize:22,fontWeight:800,color,fontFamily:"'Space Mono',monospace"}}>{value}</div>
      <div style={{fontSize:11,color:w.muted,marginTop:3,fontWeight:600}}>{label}</div>
      {sub && <div style={{fontSize:10,color:w.sub,marginTop:2}}>{sub}</div>}
    </div>
  )
}

// ── CLIENT CARD ───────────────────────────────────────────────────────────────
function ClientCard({ client, stats, onClick }) {
  const [hov, setHov] = useState(false)
  const ref = useRef()
  const status = getStatusMeta(client.status)
  const revenue = stats?.total_revenue || client.total_revenue || 0
  const cat = getCategoryMeta(revenue)
  const totalQuotes = stats?.total_quotes || client.total_quotes || 0
  const approvedQuotes = stats?.approved_quotes || 0
  const favicon = getFavicon(client.website)
  const days = daysAgo(client.last_contact)
  const isInactive = days !== null && days > 60

  const onMove = e => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    ref.current.style.setProperty('--sx', `${((e.clientX-r.left)/r.width)*100}%`)
    ref.current.style.setProperty('--sy', `${((e.clientY-r.top)/r.height)*100}%`)
  }

  return (
    <div ref={ref} onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onMouseMove={onMove}
      style={{
        background: hov ? w.cardHover : w.card,
        backdropFilter: w.blur, WebkitBackdropFilter: w.blur,
        border:`1px solid ${hov ? w.borderHover : w.border}`,
        borderRadius:18,
        boxShadow: hov ? '0 12px 40px rgba(255,122,0,0.12), inset 0 1px 0 rgba(255,255,255,0.9)' : '0 2px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
        padding:'18px 20px', cursor:'pointer', position:'relative', overflow:'hidden',
        transform: hov ? 'translateY(-4px) scale(1.01)' : 'none',
        transition:'all 0.3s cubic-bezier(0.34,1.4,0.64,1)',
      }}>
      <div style={{position:'absolute',inset:0,borderRadius:18,pointerEvents:'none',
        background:`radial-gradient(circle 100px at var(--sx,50%) var(--sy,50%), rgba(255,122,0,0.08), transparent 70%)`}}/>
      <div style={{position:'absolute',top:0,left:'10%',right:'10%',height:1,
        background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.9),transparent)'}}/>

      <div style={{display:'flex',gap:14,alignItems:'flex-start'}}>
        {/* Logo */}
        <div style={{
          width:44,height:44,borderRadius:12,flexShrink:0,
          background:`linear-gradient(135deg,${status.color}22,${status.color}44)`,
          border:`1.5px solid ${status.color}33`,
          display:'flex',alignItems:'center',justifyContent:'center',
          overflow:'hidden',fontSize:18,fontWeight:800,color:status.color,
          boxShadow:`0 4px 12px ${status.color}22`,
        }}>
          {favicon
            ? <img src={favicon} alt="" style={{width:28,height:28,objectFit:'contain'}}
                onError={e=>{e.target.style.display='none'}}/>
            : client.name?.charAt(0)?.toUpperCase()||'?'}
        </div>

        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            <span style={{fontSize:14,fontWeight:700,color:w.text,fontFamily:"'Syne',sans-serif"}}>
              {client.name}
            </span>
            <span style={{
              fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:20,
              background:status.color+'18',color:status.color,
              border:`1px solid ${status.color}33`,textTransform:'uppercase',letterSpacing:'0.08em'
            }}>{status.label}</span>
            <span style={{fontSize:9,fontWeight:700,color:cat.color}}>
              {cat.key==='ORO'?'★':cat.key==='PLATA'?'◆':'●'} {cat.label}
            </span>
          </div>

          <div style={{display:'flex',gap:10,marginTop:4,flexWrap:'wrap'}}>
            {client.industry && <span style={{fontSize:11,color:w.muted}}>{client.industry}</span>}
            {client.sector && <span style={{fontSize:11,color:w.sub}}>· {client.sector}</span>}
            {client.city && <span style={{fontSize:11,color:w.sub}}>📍 {client.city}</span>}
            {client.cuit && <span style={{fontSize:11,color:w.sub,fontFamily:"'Space Mono',monospace"}}>{client.cuit}</span>}
          </div>

          {client.contact_name && (
            <div style={{fontSize:11,color:w.muted,marginTop:3}}>
              {client.contact_name}{client.contact_role ? ` · ${client.contact_role}` : ''}
            </div>
          )}

          {/* Counters */}
          <div style={{display:'flex',gap:12,marginTop:8,flexWrap:'wrap'}}>
            <span style={{fontSize:10,color:w.muted}}>
              📋 <strong style={{color:w.text}}>{totalQuotes}</strong> pptos
            </span>
            {approvedQuotes > 0 && (
              <span style={{fontSize:10,color:w.lime}}>
                ✓ <strong>{approvedQuotes}</strong> aprobados
              </span>
            )}
            {client.purchase_frequency && (
              <span style={{fontSize:10,color:w.sub}}>🔄 {client.purchase_frequency}</span>
            )}
            {client.uses_purchase_order && (
              <span style={{fontSize:10,color:w.violet}}>📄 Usa OC</span>
            )}
          </div>
        </div>

        {/* Right */}
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4,flexShrink:0}}>
          {revenue > 0 && (
            <span style={{fontSize:13,fontWeight:800,color:w.orange,fontFamily:"'Space Mono',monospace"}}>
              {fmtMoney(revenue)}
            </span>
          )}
          {days !== null && (
            <span style={{fontSize:10,color:isInactive?w.rose:w.sub}}>
              {isInactive?'⚠ ':''}{days===0?'Hoy':days===1?'Ayer':`${days}d`}
            </span>
          )}
          {client.next_estimated_purchase && (
            <span style={{fontSize:10,color:w.cyan}}>
              🎯 {new Date(client.next_estimated_purchase).toLocaleDateString('es-AR',{day:'numeric',month:'short'})}
            </span>
          )}
          {client.whatsapp && (
            <a href={`https://wa.me/${client.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
              onClick={e=>e.stopPropagation()}
              style={{fontSize:16,textDecoration:'none',opacity:hov?1:0.4,transition:'opacity 0.2s'}}>
              💬
            </a>
          )}
        </div>
      </div>

      {/* Category progress bar */}
      {revenue > 0 && (
        <div style={{marginTop:12,height:3,borderRadius:2,background:'rgba(0,0,0,0.06)'}}>
          <div style={{
            height:'100%',borderRadius:2,
            width:`${Math.min(100,(revenue/5000000)*100)}%`,
            background:`linear-gradient(90deg,${cat.color},${w.orange})`,
            transition:'width 0.6s ease',
          }}/>
        </div>
      )}
    </div>
  )
}

// ── TABLE ROW ─────────────────────────────────────────────────────────────────
function ClientRow({ client, stats, onClick }) {
  const [hov, setHov] = useState(false)
  const status = getStatusMeta(client.status)
  const revenue = stats?.total_revenue || client.total_revenue || 0
  const cat = getCategoryMeta(revenue)
  const totalQuotes = stats?.total_quotes || client.total_quotes || 0
  const favicon = getFavicon(client.website)
  const days = daysAgo(client.last_contact)
  return (
    <tr onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{cursor:'pointer',background:hov?'rgba(255,122,0,0.04)':'transparent',transition:'background 0.15s'}}>
      <td style={{padding:'12px 16px'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{
            width:32,height:32,borderRadius:8,flexShrink:0,overflow:'hidden',
            background:`linear-gradient(135deg,${status.color}22,${status.color}44)`,
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:14,fontWeight:800,color:status.color,
          }}>
            {favicon
              ? <img src={favicon} alt="" style={{width:20,height:20,objectFit:'contain'}}
                  onError={e=>{e.target.style.display='none'}}/>
              : client.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:w.text}}>{client.name}</div>
            {client.cuit && <div style={{fontSize:10,color:w.sub,fontFamily:"'Space Mono',monospace"}}>{client.cuit}</div>}
          </div>
        </div>
      </td>
      <td style={{padding:'12px 8px'}}>
        <span style={{
          fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:20,
          background:status.color+'18',color:status.color,border:`1px solid ${status.color}33`,
          textTransform:'uppercase',letterSpacing:'0.07em',whiteSpace:'nowrap'
        }}>{status.label}</span>
      </td>
      <td style={{padding:'12px 8px',fontSize:12,color:w.muted}}>{client.industry||'—'}</td>
      <td style={{padding:'12px 8px',fontSize:12,color:w.muted}}>{client.contact_name||'—'}</td>
      <td style={{padding:'12px 8px',fontSize:12,color:w.sub}}>{client.city||'—'}</td>
      <td style={{padding:'12px 8px',fontSize:12,color:w.orange,fontFamily:"'Space Mono',monospace",fontWeight:700}}>
        {revenue > 0 ? fmtMoney(revenue) : '—'}
      </td>
      <td style={{padding:'12px 8px',fontSize:11,fontFamily:"'Space Mono',monospace",color:w.text,fontWeight:700}}>
        {totalQuotes}
      </td>
      <td style={{padding:'12px 8px',fontSize:11,color:days!==null&&days>60?w.rose:w.sub}}>
        {days!==null?(days===0?'Hoy':days===1?'Ayer':`${days}d`):'—'}
      </td>
      <td style={{padding:'12px 8px'}}>
        <span style={{fontSize:11,color:cat.color,fontWeight:700}}>
          {cat.key==='ORO'?'★':cat.key==='PLATA'?'◆':'●'} {cat.label}
        </span>
      </td>
      <td style={{padding:'12px 8px'}}>
        {client.whatsapp && (
          <a href={`https://wa.me/${client.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
            onClick={e=>e.stopPropagation()} style={{fontSize:16,textDecoration:'none'}}>💬</a>
        )}
      </td>
    </tr>
  )
}

// ── CONTACT ITEM ──────────────────────────────────────────────────────────────
function ContactItem({ contact, onRemove }) {
  return (
    <div style={{
      display:'flex',gap:10,alignItems:'center',padding:'10px 14px',
      borderRadius:12,background:'rgba(255,255,255,0.6)',border:`1px solid ${w.border}`,flexWrap:'wrap',
    }}>
      <div style={{flex:1,minWidth:120}}>
        <div style={{fontSize:13,fontWeight:700,color:w.text}}>{contact.name}</div>
        {contact.role && <div style={{fontSize:11,color:w.muted}}>{contact.role}</div>}
      </div>
      {contact.phone && <span style={{fontSize:11,color:w.muted}}>📞 {contact.phone}</span>}
      {contact.email && <span style={{fontSize:11,color:w.muted}}>✉ {contact.email}</span>}
      {contact.whatsapp && (
        <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
          style={{fontSize:14,textDecoration:'none'}}>💬</a>
      )}
      {contact.is_primary && (
        <span style={{fontSize:9,fontWeight:700,color:w.orange,background:w.orangeLight,
          padding:'2px 6px',borderRadius:8}}>PRINCIPAL</span>
      )}
      <button onClick={onRemove} style={{background:'none',border:'none',cursor:'pointer',
        color:w.rose,fontSize:16,padding:'0 2px',lineHeight:1}}>×</button>
    </div>
  )
}

// ── MODAL FORM ────────────────────────────────────────────────────────────────
function ClientModal({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial ? {...initial} : {...EMPTY_CLIENT})
  const [contacts, setContacts] = useState([])
  const [newContact, setNewContact] = useState({name:'',role:'',phone:'',email:'',whatsapp:'',is_primary:false})
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('info')
  const isEdit = !!initial?.id

  useEffect(() => {
    if (isEdit) {
      supabase.from('client_contacts').select('*').eq('client_id', initial.id)
        .then(({data}) => setContacts(data||[]))
    }
  }, [isEdit, initial?.id])

  useEffect(() => {
    const fn = e => { if (e.key==='Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  const set = (k, v) => setForm(f => ({...f, [k]: v}))

  const addContact = () => {
    if (!newContact.name.trim()) return
    setContacts(c => [...c, {...newContact, id:'tmp_'+Date.now()}])
    setNewContact({name:'',role:'',phone:'',email:'',whatsapp:'',is_primary:false})
  }

  const save = async () => {
    if (!form.name?.trim()) return
    setSaving(true)
    const {id, ...payload} = form
    payload.updated_at = new Date()
    // clean numeric fields
    ;['discount_pct','credit_days','credit_limit','total_quotes','total_purchases','total_revenue'].forEach(k => {
      if (!payload[k]) payload[k] = 0
    })
    // clean date fields
    ;['next_action_date','next_estimated_purchase','renewal_date','last_contact','last_purchase'].forEach(k => {
      if (!payload[k]) payload[k] = null
    })
    try {
      let clientId = initial?.id
      if (isEdit) {
        await supabase.from('clients').update(payload).eq('id', initial.id)
      } else {
        const {data} = await supabase.from('clients').insert(payload).select().single()
        clientId = data?.id
      }
      const newContacts = contacts.filter(c => String(c.id).startsWith('tmp_'))
      for (const c of newContacts) {
        const {id:_, ...cp} = c
        await supabase.from('client_contacts').insert({...cp, client_id: clientId})
      }
      await onSaved()
      onClose()
    } catch(e) { console.error(e) }
    setSaving(false)
  }

  const inp = (key, placeholder, type='text') => (
    <input value={form[key]||''} onChange={e=>set(key,e.target.value)}
      type={type} placeholder={placeholder}
      style={{width:'100%',padding:'10px 14px',borderRadius:10,border:`1px solid ${w.border}`,
        background:'rgba(255,255,255,0.7)',color:w.text,fontSize:13,outline:'none',boxSizing:'border-box'}}/>
  )

  const sel = (key, opts, includeEmpty=false) => (
    <select value={form[key]||''} onChange={e=>set(key,e.target.value)}
      style={{width:'100%',padding:'10px 14px',borderRadius:10,border:`1px solid ${w.border}`,
        background:'rgba(255,255,255,0.7)',color:w.text,fontSize:13,outline:'none'}}>
      {includeEmpty && <option value="">—</option>}
      {opts.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  )

  const pill = (key, opts) => (
    <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
      {opts.map(o=>(
        <button key={o} onClick={()=>set(key,o)}
          style={{
            fontSize:11,padding:'5px 12px',borderRadius:20,cursor:'pointer',
            border:`1px solid ${form[key]===o?w.orange+'44':w.border}`,
            background:form[key]===o?w.orangeLight:'rgba(255,255,255,0.6)',
            color:form[key]===o?w.orange:w.muted,fontWeight:600,transition:'all 0.2s',
          }}>{o}</button>
      ))}
    </div>
  )

  const label = (txt) => <div style={{fontSize:11,fontWeight:700,color:w.sub,marginBottom:4,textTransform:'uppercase',letterSpacing:'0.06em'}}>{txt}</div>

  const TABS = [
    {key:'info',label:'Empresa'},
    {key:'contacts',label:'Contactos'},
    {key:'commercial',label:'Comercial'},
    {key:'intel',label:'Inteligencia'},
    {key:'notes',label:'Notas'},
  ]

  return (
    <div onClick={onClose} style={{
      position:'fixed',inset:0,zIndex:1000,
      background:'rgba(0,0,0,0.3)',backdropFilter:'blur(8px)',
      display:'flex',alignItems:'center',justifyContent:'center',padding:20,
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:'100%',maxWidth:700,maxHeight:'90vh',display:'flex',flexDirection:'column',
        background:'rgba(255,255,255,0.93)',backdropFilter:'blur(32px)',
        border:`1px solid ${w.border}`,borderRadius:24,
        boxShadow:'0 32px 80px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.9)',
      }}>
        {/* Header */}
        <div style={{padding:'20px 24px 0',flexShrink:0}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div>
              <h2 style={{margin:0,fontSize:18,fontWeight:800,color:w.text,fontFamily:"'Syne',sans-serif"}}>
                {isEdit ? form.name : 'Nuevo cliente'}
              </h2>
              {isEdit && (
                <div style={{display:'flex',gap:6,marginTop:6,flexWrap:'wrap'}}>
                  {STATUSES.map(s=>(
                    <button key={s.key} onClick={()=>set('status',s.key)}
                      style={{
                        fontSize:10,padding:'3px 10px',borderRadius:20,cursor:'pointer',
                        border:`1px solid ${s.color}44`,
                        background:form.status===s.key?s.color:s.color+'18',
                        color:form.status===s.key?'#fff':s.color,
                        fontWeight:700,transition:'all 0.2s',
                      }}>{s.label}</button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',
              fontSize:22,color:w.muted,lineHeight:1}}>×</button>
          </div>
          {/* Status pills for new */}
          {!isEdit && (
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
              {STATUSES.map(s=>(
                <button key={s.key} onClick={()=>set('status',s.key)}
                  style={{
                    fontSize:10,padding:'4px 12px',borderRadius:20,cursor:'pointer',
                    border:`1px solid ${s.color}44`,
                    background:form.status===s.key?s.color:s.color+'18',
                    color:form.status===s.key?'#fff':s.color,
                    fontWeight:700,transition:'all 0.2s',
                  }}>{s.label}</button>
              ))}
            </div>
          )}
          {/* Tabs */}
          <div style={{display:'flex',gap:2,borderBottom:`1px solid ${w.border}`}}>
            {TABS.map(t=>(
              <button key={t.key} onClick={()=>setTab(t.key)}
                style={{
                  padding:'8px 16px',fontSize:12,fontWeight:600,cursor:'pointer',
                  border:'none',background:'none',
                  color:tab===t.key?w.orange:w.muted,
                  borderBottom:`2px solid ${tab===t.key?w.orange:'transparent'}`,
                  transition:'all 0.2s',marginBottom:-1,
                }}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{flex:1,overflowY:'auto',padding:'20px 24px',display:'flex',flexDirection:'column',gap:14}}>

          {tab==='info' && (
            <>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div style={{gridColumn:'1/-1'}}>
                  {label('Nombre de la empresa')}
                  {inp('name','Nombre *')}
                </div>
                <div>
                  {label('CUIT')}
                  {inp('cuit','XX-XXXXXXXX-X')}
                </div>
                <div>
                  {label('Condición IVA')}
                  {sel('iva_condition',IVA_CONDITIONS)}
                </div>
                <div>
                  {label('Industria')}
                  {sel('industry',['',...INDUSTRIES],true)}
                </div>
                <div>
                  {label('Sector específico')}
                  {sel('sector',['',...SECTORS],true)}
                </div>
                <div>
                  {label('Zona de operación')}
                  {sel('operation_zone',['',...ZONES],true)}
                </div>
                <div>
                  {label('Tamaño')}
                  {sel('employees_range',['',...EMPLOYEE_RANGES],true)}
                </div>
                <div>
                  {label('Sitio web')}
                  {inp('website','empresa.com')}
                </div>
                <div>
                  {label('Ciudad')}
                  {inp('city','Ciudad')}
                </div>
                <div>
                  {label('Provincia')}
                  {inp('province','Provincia')}
                </div>
                <div style={{gridColumn:'1/-1'}}>
                  {label('Dirección')}
                  {inp('address','Dirección completa')}
                </div>
              </div>
              <div>
                {label('Cómo llegó')}
                {pill('via',VIAS)}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  {label('Próxima acción')}
                  {inp('next_action','Descripción de la acción')}
                </div>
                <div>
                  {label('Fecha')}
                  {inp('next_action_date','',  'date')}
                </div>
              </div>
            </>
          )}

          {tab==='contacts' && (
            <>
              {contacts.map((c,i)=>(
                <ContactItem key={c.id} contact={c}
                  onRemove={()=>setContacts(cs=>cs.filter((_,j)=>j!==i))}/>
              ))}
              <div style={{padding:14,borderRadius:14,background:w.orangeLight,border:`1px dashed ${w.orange}44`}}>
                <div style={{fontSize:11,fontWeight:700,color:w.orange,marginBottom:10}}>+ Agregar contacto</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  {[
                    {k:'name',p:'Nombre *'},
                    {k:'role',p:'Cargo'},
                    {k:'phone',p:'Teléfono'},
                    {k:'email',p:'Email'},
                    {k:'whatsapp',p:'WhatsApp'},
                  ].map(({k,p})=>(
                    <input key={k} value={newContact[k]} onChange={e=>setNewContact(c=>({...c,[k]:e.target.value}))}
                      placeholder={p}
                      style={{padding:'9px 12px',borderRadius:8,border:`1px solid ${w.border}`,
                        background:'rgba(255,255,255,0.8)',color:w.text,fontSize:12,outline:'none'}}/>
                  ))}
                  <label style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:w.muted,cursor:'pointer'}}>
                    <input type="checkbox" checked={newContact.is_primary}
                      onChange={e=>setNewContact(c=>({...c,is_primary:e.target.checked}))}/>
                    Contacto principal
                  </label>
                </div>
                <button onClick={addContact}
                  style={{marginTop:10,padding:'8px 18px',borderRadius:10,border:'none',
                    background:w.orange,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>
                  Agregar
                </button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  {label('Quién decide la compra')}
                  {inp('decision_maker','Nombre / cargo')}
                </div>
                <div>
                  {label('Quién pide los productos')}
                  {inp('buyer_contact','Nombre / cargo')}
                </div>
                <div>
                  {label('Preferencia de contacto')}
                  {sel('contact_preference',CONTACT_PREFS)}
                </div>
                <div>
                  {label('Mejor horario')}
                  {inp('best_contact_time','Ej: Mañanas, 9-11hs')}
                </div>
                <div style={{gridColumn:'1/-1'}}>
                  {label('Email para acceso a portal (futuro)')}
                  {inp('login_email','email@empresa.com','email')}
                </div>
              </div>
            </>
          )}

          {tab==='commercial' && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div>
                {label('Condición de pago')}
                {sel('payment_condition',PAYMENT_CONDITIONS)}
              </div>
              <div>
                {label('Condición de entrega')}
                {sel('delivery_condition',DELIVERY_CONDITIONS)}
              </div>
              <div>
                {label('Descuento habitual %')}
                <input type="number" value={form.discount_pct||''} onChange={e=>set('discount_pct',e.target.value)}
                  placeholder="0"
                  style={{width:'100%',padding:'10px 14px',borderRadius:10,border:`1px solid ${w.border}`,
                    background:'rgba(255,255,255,0.7)',color:w.text,fontSize:13,outline:'none',boxSizing:'border-box'}}/>
              </div>
              <div>
                {label('Días de crédito')}
                <input type="number" value={form.credit_days||''} onChange={e=>set('credit_days',e.target.value)}
                  placeholder="0"
                  style={{width:'100%',padding:'10px 14px',borderRadius:10,border:`1px solid ${w.border}`,
                    background:'rgba(255,255,255,0.7)',color:w.text,fontSize:13,outline:'none',boxSizing:'border-box'}}/>
              </div>
              <div>
                {label('Límite de crédito $')}
                <input type="number" value={form.credit_limit||''} onChange={e=>set('credit_limit',e.target.value)}
                  placeholder="0"
                  style={{width:'100%',padding:'10px 14px',borderRadius:10,border:`1px solid ${w.border}`,
                    background:'rgba(255,255,255,0.7)',color:w.text,fontSize:13,outline:'none',boxSizing:'border-box'}}/>
              </div>
              <div>
                {label('Frecuencia de compra')}
                {sel('purchase_frequency',FREQUENCIES)}
              </div>
              <div>
                {label('Próxima compra estimada')}
                {inp('next_estimated_purchase','','date')}
              </div>
              <div>
                {label('Renovación de contrato')}
                {inp('renewal_date','','date')}
              </div>
              <div style={{gridColumn:'1/-1',display:'flex',alignItems:'center',gap:10}}>
                <input type="checkbox" id="oc" checked={form.uses_purchase_order||false}
                  onChange={e=>set('uses_purchase_order',e.target.checked)}
                  style={{width:16,height:16,cursor:'pointer'}}/>
                <label htmlFor="oc" style={{fontSize:13,color:w.text,cursor:'pointer'}}>
                  Requiere Orden de Compra (OC) para comprar
                </label>
              </div>
              <div style={{gridColumn:'1/-1'}}>
                {label('Proveedor de EPP actual (competencia)')}
                {inp('current_supplier','¿A quién le compra hoy?')}
              </div>
              <div style={{gridColumn:'1/-1'}}>
                {label('Productos que consume regularmente')}
                <textarea value={form.regular_products||''} onChange={e=>set('regular_products',e.target.value)}
                  placeholder="Ej: Botines de seguridad talle 42, Casco clase E, Guantes de cuero..."
                  rows={3}
                  style={{width:'100%',padding:'10px 14px',borderRadius:10,border:`1px solid ${w.border}`,
                    background:'rgba(255,255,255,0.7)',color:w.text,fontSize:13,outline:'none',
                    resize:'vertical',boxSizing:'border-box'}}/>
              </div>
              <div style={{gridColumn:'1/-1'}}>
                {label('Servicios / intereses comerciales')}
                <textarea value={form.services||''} onChange={e=>set('services',e.target.value)}
                  placeholder="¿Qué líneas de producto le interesan? ¿Qué oportunidades hay?"
                  rows={3}
                  style={{width:'100%',padding:'10px 14px',borderRadius:10,border:`1px solid ${w.border}`,
                    background:'rgba(255,255,255,0.7)',color:w.text,fontSize:13,outline:'none',
                    resize:'vertical',boxSizing:'border-box'}}/>
              </div>
            </div>
          )}

          {tab==='intel' && (
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div style={{
                padding:'16px 20px',borderRadius:14,
                background:'rgba(255,122,0,0.06)',border:`1px solid ${w.orange}22`,
              }}>
                <div style={{fontSize:11,fontWeight:700,color:w.orange,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.06em'}}>
                  Métricas automáticas
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
                  {[
                    {label:'Presupuestos emitidos',value:initial?.total_quotes||0,color:w.cyan},
                    {label:'Aprobados',value:initial?.approved_quotes||0,color:w.lime},
                    {label:'Revenue total',value:fmtMoney(initial?.total_revenue||0),color:w.orange},
                  ].map(m=>(
                    <div key={m.label} style={{textAlign:'center'}}>
                      <div style={{fontSize:22,fontWeight:800,color:m.color,fontFamily:"'Space Mono',monospace"}}>{m.value}</div>
                      <div style={{fontSize:10,color:w.muted,marginTop:2}}>{m.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{marginTop:8,fontSize:11,color:w.sub,fontStyle:'italic'}}>
                  Se actualiza automáticamente desde los presupuestos cargados
                </div>
              </div>
            </div>
          )}

          {tab==='notes' && (
            <textarea value={form.notes||''} onChange={e=>set('notes',e.target.value)}
              placeholder="Notas internas sobre el cliente, historial de conversaciones, detalles importantes..."
              rows={12}
              style={{width:'100%',padding:'12px 16px',borderRadius:12,border:`1px solid ${w.border}`,
                background:'rgba(255,255,255,0.7)',color:w.text,fontSize:13,outline:'none',
                resize:'vertical',boxSizing:'border-box'}}/>
          )}
        </div>

        {/* Footer */}
        <div style={{padding:'16px 24px',borderTop:`1px solid ${w.border}`,
          display:'flex',justifyContent:'flex-end',gap:10,flexShrink:0}}>
          <button onClick={onClose}
            style={{padding:'10px 20px',borderRadius:12,border:`1px solid ${w.border}`,
              background:'transparent',color:w.muted,fontSize:13,cursor:'pointer',fontWeight:600}}>
            Cancelar
          </button>
          <button onClick={save} disabled={saving}
            style={{
              padding:'10px 24px',borderRadius:12,border:'none',
              background:`linear-gradient(135deg,${w.orange},#ff9f40)`,
              color:'#fff',fontSize:13,fontWeight:700,cursor:saving?'not-allowed':'pointer',
              boxShadow:`0 4px 16px ${w.orangeGlow}`,opacity:saving?0.7:1,transition:'all 0.2s',
            }}>
            {saving?'Guardando...':isEdit?'Guardar cambios':'Crear cliente'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function Clientes() {
  const [clients, setClients] = useState([])
  const [statsMap, setStatsMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('TODOS')
  const [filterIndustry, setFilterIndustry] = useState('TODAS')
  const [viewMode, setViewMode] = useState('cards')
  const [selected, setSelected] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const load = async () => {
    setLoading(true)
    const [{data: clientsData}, {data: statsData}] = await Promise.all([
      supabase.from('clients').select('*').order('updated_at', {ascending: false}),
      supabase.from('client_stats').select('*'),
    ])
    setClients(clientsData || [])
    const map = {}
    ;(statsData||[]).forEach(s => { map[s.id] = s })
    setStatsMap(map)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    return clients.filter(c => {
      const q = search.toLowerCase()
      const matchSearch = !q
        || c.name?.toLowerCase().includes(q)
        || c.cuit?.includes(q)
        || c.contact_name?.toLowerCase().includes(q)
        || c.city?.toLowerCase().includes(q)
        || c.industry?.toLowerCase().includes(q)
      const matchStatus = filterStatus==='TODOS' || c.status===filterStatus
      const matchIndustry = filterIndustry==='TODAS' || c.industry===filterIndustry
      return matchSearch && matchStatus && matchIndustry
    })
  }, [clients, search, filterStatus, filterIndustry])

  const kpis = useMemo(() => {
    const total = clients.length
    const activos = clients.filter(c=>c.status==='ACTIVO').length
    const leads = clients.filter(c=>c.status==='LEAD').length
    const inactivos = clients.filter(c=>daysAgo(c.last_contact)>60).length
    const revenue = Object.values(statsMap).reduce((s,m)=>s+(m.total_revenue||0),0)
    const totalQuotes = Object.values(statsMap).reduce((s,m)=>s+(m.total_quotes||0),0)
    return {total, activos, leads, inactivos, revenue, totalQuotes}
  }, [clients, statsMap])

  const industries = useMemo(() =>
    ['TODAS', ...new Set(clients.map(c=>c.industry).filter(Boolean))], [clients])

  const btnStyle = active => ({
    padding:'8px 14px',borderRadius:20,fontSize:11,fontWeight:700,cursor:'pointer',
    border:`1px solid ${active?w.orange+'44':w.border}`,
    background:active?w.orangeLight:'rgba(255,255,255,0.6)',
    color:active?w.orange:w.muted,transition:'all 0.2s',
  })

  return (
    <div style={{minHeight:'100vh',padding:'24px 28px',background:w.bg,
      backdropFilter:w.blur,fontFamily:"'Nunito Sans',sans-serif"}}>

      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24}}>
        <div>
          <h1 style={{margin:0,fontSize:28,fontWeight:900,fontFamily:"'Syne',sans-serif",
            background:`linear-gradient(135deg,${w.orange},#ff9f40)`,
            WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
            Órbita
          </h1>
          <p style={{margin:'4px 0 0',fontSize:12,color:w.muted,fontStyle:'italic'}}>
            red de clientes y leads
          </p>
        </div>
        <button onClick={()=>{setSelected(null);setShowModal(true)}}
          style={{
            padding:'11px 22px',borderRadius:14,border:'none',
            background:`linear-gradient(135deg,${w.orange},#ff9f40)`,
            color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',
            boxShadow:`0 4px 20px ${w.orangeGlow}`,transition:'all 0.2s cubic-bezier(0.34,1.4,0.64,1)',
          }}
          onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px) scale(1.03)'}
          onMouseLeave={e=>e.currentTarget.style.transform='none'}>
          + Nuevo
        </button>
      </div>

      {/* KPIs */}
      <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap'}}>
        <KpiCard value={kpis.total} label="Total" color={w.orange}/>
        <KpiCard value={kpis.activos} label="Activos" color={w.lime}/>
        <KpiCard value={kpis.leads} label="Leads" color={w.cyan}/>
        <KpiCard value={kpis.inactivos} label="Inactivos" color={w.rose} sub="+60 días"/>
        <KpiCard value={fmtMoney(kpis.revenue)} label="Revenue" color={w.amber}/>
        <KpiCard value={kpis.totalQuotes} label="Presupuestos" color={w.violet}/>
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Buscar cliente, CUIT, contacto..."
          style={{
            flex:'1 1 200px',padding:'10px 16px',borderRadius:12,
            border:`1px solid ${w.border}`,background:'rgba(255,255,255,0.7)',
            color:w.text,fontSize:13,outline:'none',
          }}/>
        <select value={filterIndustry} onChange={e=>setFilterIndustry(e.target.value)}
          style={{padding:'10px 14px',borderRadius:12,border:`1px solid ${w.border}`,
            background:'rgba(255,255,255,0.7)',color:w.text,fontSize:12,outline:'none'}}>
          {industries.map(i=><option key={i} value={i}>{i}</option>)}
        </select>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          <button onClick={()=>setFilterStatus('TODOS')} style={btnStyle(filterStatus==='TODOS')}>Todos</button>
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
        <div style={{display:'flex',gap:4,background:'rgba(255,255,255,0.6)',
          border:`1px solid ${w.border}`,borderRadius:10,padding:3}}>
          {[{v:'cards',i:'⊞'},{v:'table',i:'☰'}].map(({v,i})=>(
            <button key={v} onClick={()=>setViewMode(v)}
              style={{padding:'6px 12px',borderRadius:8,border:'none',cursor:'pointer',
                background:viewMode===v?w.orange:'transparent',
                color:viewMode===v?'#fff':w.muted,fontSize:13,transition:'all 0.2s'}}>
              {i}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{textAlign:'center',padding:60,color:w.muted,fontSize:14}}>Cargando...</div>
      ) : filtered.length===0 ? (
        <div style={{textAlign:'center',padding:60,color:w.muted}}>
          <div style={{fontSize:40,marginBottom:12}}>🌌</div>
          <div style={{fontSize:14}}>No hay clientes todavía</div>
          <div style={{fontSize:12,marginTop:4,color:w.sub}}>Creá el primero con el botón + Nuevo</div>
        </div>
      ) : viewMode==='cards' ? (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:14}}>
          {filtered.map(c=>(
            <ClientCard key={c.id} client={c} stats={statsMap[c.id]}
              onClick={()=>{setSelected(c);setShowModal(true)}}/>
          ))}
        </div>
      ) : (
        <div style={{background:w.card,backdropFilter:w.blur,borderRadius:18,
          border:`1px solid ${w.border}`,overflow:'hidden',boxShadow:'0 4px 24px rgba(0,0,0,0.06)'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{borderBottom:`1px solid ${w.border}`}}>
                {['Empresa','Estado','Rubro','Contacto','Ciudad','Revenue','Pptos','Último contacto','Categoría',''].map(h=>(
                  <th key={h} style={{padding:'12px 16px',textAlign:'left',fontSize:11,
                    fontWeight:700,color:w.sub,textTransform:'uppercase',letterSpacing:'0.06em'}}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c=>(
                <ClientRow key={c.id} client={c} stats={statsMap[c.id]}
                  onClick={()=>{setSelected(c);setShowModal(true)}}/>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <ClientModal
          initial={selected}
          onClose={()=>{setShowModal(false);setSelected(null)}}
          onSaved={load}
        />
      )}
    </div>
  )
}
