import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const c = {
  bg:'#07070f', border:'rgba(255,255,255,0.07)', panel:'rgba(255,255,255,0.035)',
  cyan:'#06b6d4', violet:'#7c3aed', lime:'#84cc16', amber:'#f59e0b', rose:'#f43f5e',
  text:'#f1f5f9', muted:'#475569', sub:'#94a3b8'
}

const TYPES = ['Mayorista','Fábrica','Importador','Distribuidor','Competencia']
const CATEGORIES = ['Indumentaria y Calzado','EPP','Herramientas','Anti-caídas','Seguridad Vial','Contra Incendio','Prot. Ambiental','Tecnología','Construcción','Trabajo Integral','Otro']
const CURRENCIES = ['Pesos','Dólares','Euros']
const STATUSES = ['Activo','Pausado','Inactivo']
const PROVINCES = ['Buenos Aires','CABA','Catamarca','Chaco','Chubut','Córdoba','Corrientes','Entre Ríos','Formosa','Jujuy','La Pampa','La Rioja','Mendoza','Misiones','Neuquén','Río Negro','Salta','San Juan','San Luis','Santa Cruz','Santa Fe','Santiago del Estero','Tierra del Fuego','Tucumán']
const EMPTY = {name:'',cuit:'',type:'Mayorista',status:'Activo',province:'Neuquén',address:'',pickup_address:'',contact_name:'',phone:'',email:'',web:'',instagram:'',linkedin:'',category:'',main_brand:'',payment_conditions:'',discount:'',payment_account:'',currency:'Pesos',min_order:'',delivery_days:'',notes:''}
const typeColor = {Mayorista:c.cyan,Fábrica:c.violet,Importador:c.amber,Distribuidor:c.lime,Competencia:c.rose}
const statusColor = {Activo:c.lime,Pausado:c.amber,Inactivo:c.rose}

const inputStyle = {background:'rgba(255,255,255,0.06)',border:`1px solid rgba(255,255,255,0.07)`,borderRadius:8,padding:'8px 10px',color:'#f1f5f9',fontSize:13,outline:'none',width:'100%',boxSizing:'border-box'}

function Field({label, value, onChange, placeholder='', type='text', options}) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:4}}>
      <label style={{fontSize:10,color:'#94a3b8',fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em'}}>{label}</label>
      {options
        ?<select value={value||''} onChange={e=>onChange(e.target.value)} style={inputStyle}>
          {options.map(o=><option key={o} value={o} style={{background:'#12121f'}}>{o}</option>)}
         </select>
        :<input type={type} value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={inputStyle}/>
      }
    </div>
  )
}

export default function Proveedores() {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('cards')
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('Todos')
  const [filterStatus, setFilterStatus] = useState('Todos')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadSuppliers() }, [])

  const loadSuppliers = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('suppliers').select('*').order('name')
    if (error) console.error(error)
    setSuppliers(data || [])
    setLoading(false)
  }

  const filtered = suppliers.filter(s => {
    const q = search.toLowerCase()
    const matchSearch = !q || s.name?.toLowerCase().includes(q) || s.contact_name?.toLowerCase().includes(q) || s.category?.toLowerCase().includes(q) || s.main_brand?.toLowerCase().includes(q)
    const matchType = filterType==='Todos' || s.type===filterType
    const matchStatus = filterStatus==='Todos' || s.status===filterStatus
    return matchSearch && matchType && matchStatus
  })

  const setF = (k, v) => setForm(p => ({...p, [k]: v}))
  const openNew = () => { setForm(EMPTY); setModal('form') }
  const openEdit = (s) => { setForm({...s}); setSelected(s); setModal('form') }
  const openDetail = (s) => { setSelected(s); setModal('detail') }

  const save = async () => {
    if (!form.name?.trim()) return
    setSaving(true)
    const payload = {...form}
    delete payload.id
    if (form.id) {
      const {error} = await supabase.from('suppliers').update(payload).eq('id', form.id)
      if (error) console.error('Update error:', error)
    } else {
      const {error} = await supabase.from('suppliers').insert(payload)
      if (error) console.error('Insert error:', error)
    }
    await loadSuppliers()
    setSaving(false)
    setModal(null)
  }

  const deleteSupplier = async (id) => {
    if (!confirm('¿Eliminar este proveedor?')) return
    await supabase.from('suppliers').delete().eq('id', id)
    await loadSuppliers()
    setModal(null)
  }

  return (
    <div>
      {/* HEADER */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
        <div>
          <h2 style={{margin:0,fontSize:20,fontWeight:800}}>🏭 Proveedores</h2>
          <p style={{margin:'4px 0 0',color:c.sub,fontSize:13}}>{suppliers.length} proveedores · {suppliers.filter(s=>s.status==='Activo').length} activos</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <div style={{display:'flex',gap:3,background:'rgba(255,255,255,0.04)',borderRadius:8,padding:3,border:`1px solid ${c.border}`}}>
            {['cards','table'].map(v=>(
              <button key={v} onClick={()=>setView(v)} style={{padding:'6px 12px',borderRadius:6,border:'none',cursor:'pointer',fontSize:11,fontWeight:600,
                background:view===v?c.cyan:'transparent',color:view===v?'#000':c.sub,transition:'all .2s'}}>
                {v==='cards'?'⊞ Tarjetas':'☰ Tabla'}
              </button>
            ))}
          </div>
          <button onClick={openNew} style={{padding:'9px 18px',borderRadius:8,border:'none',background:c.cyan,color:'#000',cursor:'pointer',fontSize:13,fontWeight:700}}>
            + Nuevo proveedor
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar por nombre, contacto, marca..."
          style={{...inputStyle,flex:1,minWidth:200}}/>
        <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{...inputStyle,width:'auto'}}>
          <option value="Todos" style={{background:'#12121f'}}>Todos los tipos</option>
          {TYPES.map(t=><option key={t} value={t} style={{background:'#12121f'}}>{t}</option>)}
        </select>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{...inputStyle,width:'auto'}}>
          <option value="Todos" style={{background:'#12121f'}}>Todos los estados</option>
          {STATUSES.map(s=><option key={s} value={s} style={{background:'#12121f'}}>{s}</option>)}
        </select>
      </div>

      {/* STATS */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8,marginBottom:16}}>
        {TYPES.map(t=>{
          const n=suppliers.filter(s=>s.type===t).length
          const col=typeColor[t]
          return (
            <div key={t} onClick={()=>setFilterType(filterType===t?'Todos':t)} style={{
              padding:'10px 12px',borderRadius:10,border:`1px solid ${filterType===t?col:c.border}`,
              background:filterType===t?`${col}10`:c.panel,cursor:'pointer',transition:'all .2s',textAlign:'center'}}>
              <div style={{fontSize:18,fontWeight:800,color:col}}>{n}</div>
              <div style={{fontSize:10,color:c.sub,marginTop:2}}>{t}</div>
            </div>
          )
        })}
      </div>

      {/* LIST */}
      {loading?(
        <div style={{textAlign:'center',padding:'60px 0',color:c.cyan}}><div style={{fontSize:32,marginBottom:8}}>⚡</div><div>Cargando...</div></div>
      ):filtered.length===0?(
        <div style={{textAlign:'center',padding:'60px 0',color:c.muted}}>
          <div style={{fontSize:48,marginBottom:12}}>🏭</div>
          <div style={{fontSize:16,fontWeight:600,color:c.sub,marginBottom:8}}>Sin proveedores</div>
          <button onClick={openNew} style={{padding:'10px 24px',borderRadius:8,border:'none',background:c.cyan,color:'#000',cursor:'pointer',fontSize:13,fontWeight:700}}>+ Agregar proveedor</button>
        </div>
      ):view==='cards'?(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
          {filtered.map(s=>{
            const tc=typeColor[s.type]||c.cyan
            const sc2=statusColor[s.status]||c.lime
            return (
              <div key={s.id} style={{background:c.panel,border:`1px solid ${c.border}`,borderRadius:14,padding:18,transition:'border-color .2s',cursor:'pointer'}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=tc}
                onMouseLeave={e=>e.currentTarget.style.borderColor=c.border}
                onClick={()=>openDetail(s)}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
                  <span style={{fontSize:10,padding:'3px 9px',borderRadius:20,fontWeight:600,background:`${tc}20`,color:tc}}>{s.type}</span>
                  <span style={{fontSize:10,padding:'3px 9px',borderRadius:20,fontWeight:600,background:`${sc2}15`,color:sc2}}>{s.status}</span>
                </div>
                <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>{s.name}</div>
                {s.main_brand&&<div style={{fontSize:11,color:tc,marginBottom:6}}>🏷️ {s.main_brand}</div>}
                {s.category&&<div style={{fontSize:11,color:c.sub,marginBottom:4}}>📦 {s.category}</div>}
                {s.contact_name&&<div style={{fontSize:11,color:c.sub,marginBottom:3}}>👤 {s.contact_name}</div>}
                {s.phone&&<div style={{fontSize:11,color:c.sub,marginBottom:3}}>📞 {s.phone}</div>}
                {s.province&&<div style={{fontSize:11,color:c.muted,marginBottom:8}}>📍 {s.province}</div>}
                <div style={{display:'flex',justifyContent:'space-between',paddingTop:10,borderTop:`1px solid ${c.border}`,fontSize:11}}>
                  {s.delivery_days?<span style={{color:c.muted}}>🚚 {s.delivery_days} días</span>:<span/>}
                  {s.currency&&<span style={{color:c.amber,fontWeight:600}}>{s.currency}</span>}
                </div>
              </div>
            )
          })}
        </div>
      ):(
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{borderBottom:`1px solid ${c.border}`}}>
                {['Proveedor','Tipo','Categoría','Contacto','Teléfono','Provincia','Estado',''].map(h=>(
                  <th key={h} style={{padding:'10px 12px',textAlign:'left',fontSize:10,color:c.sub,fontWeight:600,textTransform:'uppercase'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s=>{
                const tc=typeColor[s.type]||c.cyan
                const sc2=statusColor[s.status]||c.lime
                return (
                  <tr key={s.id} style={{borderBottom:`1px solid ${c.border}`,cursor:'pointer'}}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                    onClick={()=>openDetail(s)}>
                    <td style={{padding:'12px',fontWeight:600}}>{s.name}</td>
                    <td style={{padding:'12px'}}><span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:`${tc}20`,color:tc,fontWeight:600}}>{s.type}</span></td>
                    <td style={{padding:'12px',color:c.sub}}>{s.category||'—'}</td>
                    <td style={{padding:'12px',color:c.sub}}>{s.contact_name||'—'}</td>
                    <td style={{padding:'12px',color:c.sub}}>{s.phone||'—'}</td>
                    <td style={{padding:'12px',color:c.sub}}>{s.province||'—'}</td>
                    <td style={{padding:'12px'}}><span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:`${sc2}15`,color:sc2,fontWeight:600}}>{s.status}</span></td>
                    <td style={{padding:'12px'}}>
                      <button onClick={e=>{e.stopPropagation();openEdit(s)}} style={{background:'none',border:`1px solid ${c.border}`,borderRadius:6,color:c.muted,cursor:'pointer',fontSize:11,padding:'3px 8px'}}>✏️</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL FORM */}
      {modal==='form'&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:16}}>
          <div style={{background:'#0d0d1a',border:`1px solid ${c.border}`,borderRadius:16,padding:24,width:'100%',maxWidth:700,maxHeight:'92vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div style={{fontSize:16,fontWeight:700}}>{form.id?'Editar proveedor':'Nuevo proveedor'}</div>
              <button onClick={()=>setModal(null)} style={{background:'none',border:'none',color:c.sub,cursor:'pointer',fontSize:22}}>×</button>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              <div style={{gridColumn:'1/-1',fontSize:11,color:c.cyan,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',paddingBottom:4,borderBottom:`1px solid ${c.border}`}}>Datos básicos</div>
              <div style={{gridColumn:'1/-1'}}>
                <Field label="Nombre / Razón social *" value={form.name} onChange={v=>setF('name',v)} placeholder="Ej: Comercial Argentina S.R.L"/>
              </div>
              <Field label="CUIT" value={form.cuit} onChange={v=>setF('cuit',v)} placeholder="20-12345678-9"/>
              <Field label="Tipo" value={form.type} onChange={v=>setF('type',v)} options={TYPES}/>
              <Field label="Estado" value={form.status} onChange={v=>setF('status',v)} options={STATUSES}/>
              <Field label="Provincia" value={form.province} onChange={v=>setF('province',v)} options={PROVINCES}/>
              <Field label="Dirección" value={form.address} onChange={v=>setF('address',v)} placeholder="Calle y número"/>
              <div style={{gridColumn:'1/-1'}}>
                <Field label="Dirección de retiro de mercadería" value={form.pickup_address} onChange={v=>setF('pickup_address',v)} placeholder="Si es diferente a la dirección principal"/>
              </div>

              <div style={{gridColumn:'1/-1',fontSize:11,color:c.cyan,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',paddingBottom:4,borderBottom:`1px solid ${c.border}`,marginTop:8}}>Contacto</div>
              <Field label="Nombre del contacto" value={form.contact_name} onChange={v=>setF('contact_name',v)} placeholder="Nombre y apellido"/>
              <Field label="Teléfono" value={form.phone} onChange={v=>setF('phone',v)} placeholder="+54 299..."/>
              <Field label="Email" value={form.email} onChange={v=>setF('email',v)} placeholder="contacto@proveedor.com"/>
              <Field label="Sitio web" value={form.web} onChange={v=>setF('web',v)} placeholder="https://..."/>
              <Field label="Instagram" value={form.instagram} onChange={v=>setF('instagram',v)} placeholder="@usuario"/>
              <Field label="LinkedIn" value={form.linkedin} onChange={v=>setF('linkedin',v)} placeholder="linkedin.com/in/..."/>

              <div style={{gridColumn:'1/-1',fontSize:11,color:c.cyan,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',paddingBottom:4,borderBottom:`1px solid ${c.border}`,marginTop:8}}>Comercial</div>
              <Field label="Categoría principal" value={form.category} onChange={v=>setF('category',v)} options={['Seleccionar',...CATEGORIES]}/>
              <Field label="Marca principal" value={form.main_brand} onChange={v=>setF('main_brand',v)} placeholder="Ej: 3M, MSA, Durlock..."/>
              <Field label="Condiciones de pago" value={form.payment_conditions} onChange={v=>setF('payment_conditions',v)} placeholder="Ej: 30 días, contado..."/>
              <Field label="Descuento" value={form.discount} onChange={v=>setF('discount',v)} placeholder="Ej: 10% por volumen"/>
              <Field label="Cuenta de pago (CBU/Alias)" value={form.payment_account} onChange={v=>setF('payment_account',v)} placeholder="CBU o alias"/>
              <Field label="Moneda" value={form.currency} onChange={v=>setF('currency',v)} options={CURRENCIES}/>
              <Field label="Monto mínimo de compra ($)" value={form.min_order} onChange={v=>setF('min_order',v)} type="number" placeholder="0"/>
              <Field label="Días de entrega promedio" value={form.delivery_days} onChange={v=>setF('delivery_days',v)} type="number" placeholder="0"/>

              <div style={{gridColumn:'1/-1',fontSize:11,color:c.cyan,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',paddingBottom:4,borderBottom:`1px solid ${c.border}`,marginTop:8}}>Notas internas</div>
              <div style={{gridColumn:'1/-1'}}>
                <textarea value={form.notes||''} onChange={e=>setF('notes',e.target.value)} rows={3} placeholder="Observaciones privadas..."
                  style={{...inputStyle,resize:'vertical'}}/>
              </div>
            </div>

            <div style={{display:'flex',gap:8,justifyContent:'space-between'}}>
              <div>
                {form.id&&<button onClick={()=>deleteSupplier(form.id)} style={{padding:'9px 16px',borderRadius:8,border:`1px solid ${c.rose}`,background:'transparent',color:c.rose,cursor:'pointer',fontSize:13,fontWeight:600}}>🗑️ Eliminar</button>}
              </div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>setModal(null)} style={{padding:'9px 18px',borderRadius:8,border:`1px solid ${c.border}`,background:'transparent',color:c.sub,cursor:'pointer',fontSize:13}}>Cancelar</button>
                <button onClick={save} disabled={saving||!form.name?.trim()} style={{padding:'9px 18px',borderRadius:8,border:'none',background:saving?c.muted:c.cyan,color:'#000',cursor:'pointer',fontSize:13,fontWeight:700,opacity:saving?0.6:1}}>
                  {saving?'Guardando...':'💾 Guardar proveedor'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETAIL */}
      {modal==='detail'&&selected&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:16}}>
          <div style={{background:'#0d0d1a',border:`1px solid ${typeColor[selected.type]||c.border}`,borderRadius:16,padding:24,width:'100%',maxWidth:600,maxHeight:'92vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
              <div>
                <div style={{display:'flex',gap:8,marginBottom:8}}>
                  <span style={{fontSize:11,padding:'3px 10px',borderRadius:20,fontWeight:600,background:`${typeColor[selected.type]||c.cyan}20`,color:typeColor[selected.type]||c.cyan}}>{selected.type}</span>
                  <span style={{fontSize:11,padding:'3px 10px',borderRadius:20,fontWeight:600,background:`${statusColor[selected.status]||c.lime}15`,color:statusColor[selected.status]||c.lime}}>{selected.status}</span>
                </div>
                <div style={{fontSize:20,fontWeight:800}}>{selected.name}</div>
                {selected.main_brand&&<div style={{fontSize:13,color:c.cyan,marginTop:2}}>🏷️ {selected.main_brand}</div>}
              </div>
              <button onClick={()=>setModal(null)} style={{background:'none',border:'none',color:c.sub,cursor:'pointer',fontSize:22}}>×</button>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
              {[
                {l:'CUIT',v:selected.cuit},{l:'Categoría',v:selected.category},
                {l:'Contacto',v:selected.contact_name},{l:'Teléfono',v:selected.phone},
                {l:'Email',v:selected.email},{l:'Web',v:selected.web},
                {l:'Instagram',v:selected.instagram},{l:'Provincia',v:selected.province},
                {l:'Dirección',v:selected.address},{l:'Retiro',v:selected.pickup_address},
                {l:'Condiciones pago',v:selected.payment_conditions},{l:'Descuento',v:selected.discount},
                {l:'CBU/Alias',v:selected.payment_account},{l:'Moneda',v:selected.currency},
                {l:'Mínimo compra',v:selected.min_order?`$${(+selected.min_order).toLocaleString('es-AR')}`:null},
                {l:'Entrega',v:selected.delivery_days?`${selected.delivery_days} días`:null},
              ].filter(f=>f.v).map((f,i)=>(
                <div key={i} style={{padding:'8px 12px',borderRadius:8,background:'rgba(255,255,255,0.03)',border:`1px solid ${c.border}`}}>
                  <div style={{fontSize:9,color:c.muted,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:2}}>{f.l}</div>
                  <div style={{fontSize:13,color:c.text,fontWeight:500}}>{f.v}</div>
                </div>
              ))}
            </div>

            {selected.notes&&(
              <div style={{padding:'12px',borderRadius:8,background:'rgba(255,255,255,0.03)',border:`1px solid ${c.border}`,marginBottom:16}}>
                <div style={{fontSize:9,color:c.muted,textTransform:'uppercase',marginBottom:4}}>Notas internas</div>
                <div style={{fontSize:13,color:c.sub,lineHeight:1.6}}>{selected.notes}</div>
              </div>
            )}

            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button onClick={()=>setModal(null)} style={{padding:'9px 18px',borderRadius:8,border:`1px solid ${c.border}`,background:'transparent',color:c.sub,cursor:'pointer',fontSize:13}}>Cerrar</button>
              <button onClick={()=>openEdit(selected)} style={{padding:'9px 18px',borderRadius:8,border:'none',background:c.cyan,color:'#000',cursor:'pointer',fontSize:13,fontWeight:700}}>✏️ Editar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
