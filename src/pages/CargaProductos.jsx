import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'

const c = {
  bg:'#07070f', border:'rgba(255,255,255,0.07)', panel:'rgba(255,255,255,0.035)',
  cyan:'#06b6d4', violet:'#7c3aed', lime:'#84cc16', amber:'#f59e0b', rose:'#f43f5e',
  text:'#f1f5f9', muted:'#475569', sub:'#94a3b8'
}

const CATEGORIES = {
  '🦺 EPP — Protección personal': ['Protección craneana','Protección ocular','Protección auditiva','Protección respiratoria','Protección de manos','Protección facial','Calzado de seguridad','Protección corporal','Detección de gases'],
  '👕 Indumentaria laboral': ['Ropa de trabajo','Ignífuga / retardante','Alta visibilidad','Térmica','Antiácida','Aluminizada','Descartable','Cuero','Accesorios textiles'],
  '🧗 Trabajo en altura': ['Arneses','Líneas de vida','Cabos de amarre','Retráctiles','Anclajes','Espacio confinado','Eslingas','Accesorios altura'],
  '🚧 Seguridad vial y señalización': ['Conos y balizas','Carteles y señales','Vallas y barreras','Cintas de peligro','Ropa vial alta vis.','Bloqueo / Lockout','Etiquetado de seguridad'],
  '🔥 Contra incendios': ['Matafuegos','Mangueras','Detectores / alarmas','Rociadores','Gabinetes CI','Trajes ignífugos','Señalización CI','Accesorios CI'],
  '🏗️ Construcción y materiales': ['Placas y paneles','Adhesivos y selladores','Fijaciones','Pintura y revestimientos','Hormigón / cemento','Steel framing','Aislaciones','Impermeabilizantes'],
  '🔧 Herramientas y equipamiento': ['Herramientas manuales','Herramientas eléctricas','Medición y calibración','Equipos de corte','Equipos de izaje','Accesorios herramientas'],
  '🌱 Protección ambiental': ['Absorbentes','Kit derrame','Contenedores residuos','Control ambiental','Paños industriales','Gestión de inflamables'],
  '🩹 Primeros auxilios': ['Botiquines','Camillas','DEA / desfibriladores','Inmovilizadores','Suministros médicos'],
  '💡 Tecnología e iluminación': ['Iluminación industrial','Iluminación de emergencia','Cámaras y seguridad','Comunicación','Equipos eléctricos','Innovación / IoT'],
  '🏠 Flipping house / Remodelación': ['Pisos y revestimientos','Sanitarios','Carpintería','Instalaciones eléctricas','Instalaciones sanitarias','Diseño de interiores'],
  '📦 Abastecimiento integral': ['Insumos de oficina','Limpieza industrial','Papelería y consumibles','Cafetería / hygiene','Uniformes corporativos','Artículos promocionales'],
}

const UNITS = ['Unidad','Par','Caja','Bolsa','Metro','Metro²','Litro','Kg','Rollo','Juego','Pack','Docena']
const CURRENCIES = ['Pesos','Dólares','Euros']
const MARGINS_QUICK = [10,15,20,25,30,35,40,50]

const EMPTY = {
  name:'', code:'', brand:'', model:'', category:'', subcategory:'',
  supplier_id:'', supplier_name:'', cost_price:'', sale_price:'', margin:'',
  currency:'Pesos', unit:'Unidad', norm:'', description:'', short_desc:'',
  image_url:'', status:'Activo', stock:'', notes:'', available:true, min_order:1
}

const iStyle = {
  background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.07)',
  borderRadius:8, padding:'8px 10px', color:'#f1f5f9', fontSize:13,
  outline:'none', width:'100%', boxSizing:'border-box'
}

// ── HELPERS ──
const fmtARS = v => v ? `$${(+v).toLocaleString('es-AR')}` : '—'

const calcSale = (cost, margin) => Math.round(+cost * (1 + +margin/100))
const calcMargin = (cost, sale) => {
  if (!cost || !sale || +cost === 0) return ''
  return (((+sale - +cost) / +cost) * 100).toFixed(1)
}

async function callClaude(userMsg, system, maxTokens=3000) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({
      model:'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system,
      messages:[{role:'user', content: userMsg}],
    })
  })
  const data = await res.json()
  return data.content?.[0]?.text || ''
}

async function extractImageFromUrl(url) {
  try {
    if (/\.(jpg|jpeg|png|webp|gif|svg)/i.test(url)) return url
    const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
    const r = await fetch(proxy)
    const html = await r.text()
    const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
    if (og?.[1]) return og[1]
    const tw = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
    if (tw?.[1]) return tw[1]
    const img = html.match(/<img[^>]+src=["'](https?:\/\/[^"']+\.(jpg|jpeg|png|webp))/i)
    if (img?.[1]) return img[1]
  } catch {}
  return null
}

// ── FIELD COMPONENT ──
function Field({label, value, onChange, placeholder='', type='text', options, span, onKeyDown}) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:4,gridColumn:span?'1/-1':undefined}}>
      <label style={{fontSize:10,color:'#94a3b8',fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em'}}>{label}</label>
      {options
        ? <select value={value||''} onChange={e=>onChange(e.target.value)} style={iStyle}>
            {options.map(o=><option key={o} value={o} style={{background:'#12121f'}}>{o}</option>)}
          </select>
        : <input type={type} value={value||''} onChange={e=>onChange(e.target.value)}
            placeholder={placeholder} style={iStyle} onKeyDown={onKeyDown}/>
      }
    </div>
  )
}

// ── PRICE EDITOR INLINE ──
function PriceEditor({product, onSave}) {
  const [cost, setCost] = useState(product.cost_price||'')
  const [margin, setMargin] = useState(product.margin||30)
  const sale = cost ? calcSale(cost, margin) : 0

  const save = async () => {
    await supabase.from('products').update({
      cost_price: +cost,
      sale_price: sale,
      margin: +margin,
      updated_at: new Date()
    }).eq('id', product.id)
    onSave()
  }

  return (
    <div style={{padding:'10px 12px',background:'rgba(0,0,0,0.6)',borderRadius:10,border:`1px solid ${c.amber}30`}}>
      <div style={{fontSize:10,color:c.amber,marginBottom:8,fontWeight:600,textTransform:'uppercase'}}>Editar precios rápido</div>
      <div style={{display:'flex',gap:8,alignItems:'flex-end',flexWrap:'wrap'}}>
        <div style={{flex:1,minWidth:90}}>
          <div style={{fontSize:9,color:c.muted,marginBottom:3}}>Costo $</div>
          <input type="number" value={cost} onChange={e=>setCost(e.target.value)}
            style={{...iStyle,padding:'6px 8px',fontSize:13}}/>
        </div>
        <div>
          <div style={{fontSize:9,color:c.muted,marginBottom:3}}>Margen %</div>
          <select value={margin} onChange={e=>setMargin(e.target.value)} style={{...iStyle,padding:'6px 8px',fontSize:13,width:70}}>
            {MARGINS_QUICK.map(m=><option key={m} value={m} style={{background:'#12121f'}}>{m}%</option>)}
          </select>
        </div>
        <div style={{textAlign:'center',minWidth:70}}>
          <div style={{fontSize:9,color:c.muted,marginBottom:3}}>Venta</div>
          <div style={{fontSize:14,fontWeight:800,color:c.lime}}>{fmtARS(sale)}</div>
        </div>
        <button onClick={save} style={{padding:'6px 14px',borderRadius:7,border:'none',background:c.lime,color:'#000',cursor:'pointer',fontSize:12,fontWeight:700}}>✓</button>
      </div>
    </div>
  )
}

// ── MODAL FORMULARIO (crear / editar / duplicar) ──
function ModalForm({suppliers, initial, mode, onClose, onSaved}) {
  // mode: 'new' | 'edit' | 'duplicate'
  const isEdit = mode === 'edit'
  const base = initial ? {...initial} : EMPTY
  if (mode === 'duplicate') { delete base.id; base.name = base.name + ' (copia)'; base.code = '' }

  const [form, setForm] = useState(base)
  const [saving, setSaving] = useState(false)
  const [imgUrl, setImgUrl] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [searching, setSearching] = useState(false)
  const [imgResults, setImgResults] = useState([])
  const nameRef = useRef()

  useEffect(() => { nameRef.current?.focus() }, [])

  const setF = (k,v) => setForm(p=>({...p,[k]:v}))

  const handleCost = v => setForm(p => {
    const sale = p.margin ? calcSale(v, p.margin) : p.sale_price
    return {...p, cost_price:v, sale_price:sale}
  })
  const handleSale = v => setForm(p => ({...p, sale_price:v, margin: calcMargin(p.cost_price, v)}))
  const handleMarginBtn = m => setForm(p => ({...p, margin:m, sale_price: p.cost_price ? calcSale(p.cost_price, m) : p.sale_price}))

  const handleExtractImg = async () => {
    if (!imgUrl) return
    setExtracting(true)
    const url = await extractImageFromUrl(imgUrl)
    if (url) setF('image_url', url)
    else if (/\.(jpg|jpeg|png|webp)/i.test(imgUrl)) setF('image_url', imgUrl)
    setExtracting(false)
  }

  const handleSearchImg = async () => {
    if (!form.name) return
    setSearching(true)
    try {
      const q = `${form.brand||''} ${form.name} ${form.model||''}`.trim()
      const text = await callClaude(
        `Producto industrial: "${q}". Devolvé SOLO JSON array con 6 URLs directas a imágenes JPG/PNG HD de este producto en sitios de fabricantes o distribuidores industriales reales. Sin texto ni markdown:\n[{"url":"...","source":"..."}]`,
        'Sos experto en productos de seguridad industrial. Devolvés SOLO JSON válido.',
        800
      )
      const parsed = JSON.parse(text.replace(/```json|```/g,'').trim())
      setImgResults(parsed)
    } catch { setImgResults([]) }
    setSearching(false)
  }

  const save = async () => {
    if (!form.name?.trim()) return
    setSaving(true)
    const {id, ...payload} = form
    payload.updated_at = new Date()
    if (isEdit && initial?.id) {
      await supabase.from('products').update(payload).eq('id', initial.id)
    } else {
      await supabase.from('products').insert(payload)
    }
    await onSaved()
    onClose()
    setSaving(false)
  }

  const subcats = CATEGORIES[form.category] || []

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.9)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:12}}>
      <div style={{background:'#0a0a18',border:`1px solid ${c.border}`,borderRadius:16,padding:22,width:'100%',maxWidth:780,maxHeight:'95vh',overflowY:'auto'}}>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <div style={{fontSize:15,fontWeight:700}}>
            {mode==='edit'?'✏️ Editar producto':mode==='duplicate'?'📋 Duplicar producto':'➕ Nuevo producto'}
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',color:c.sub,cursor:'pointer',fontSize:22,lineHeight:1}}>×</button>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>

          {/* Identificación */}
          <div style={{gridColumn:'1/-1',fontSize:10,color:c.cyan,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',paddingBottom:3,borderBottom:`1px solid ${c.border}`}}>Identificación</div>

          <div style={{gridColumn:'1/-1',display:'flex',flexDirection:'column',gap:4}}>
            <label style={{fontSize:10,color:c.sub,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em'}}>Nombre del producto *</label>
            <input ref={nameRef} value={form.name||''} onChange={e=>setF('name',e.target.value)}
              placeholder="Ej: Casco de seguridad Milenium clase A" style={iStyle}/>
          </div>
          <Field label="Código / SKU" value={form.code} onChange={v=>setF('code',v)} placeholder="SKU interno"/>
          <Field label="Marca" value={form.brand} onChange={v=>setF('brand',v)} placeholder="3M, MSA, Libus..."/>
          <Field label="Modelo" value={form.model} onChange={v=>setF('model',v)} placeholder="Número de modelo"/>
          <div style={{gridColumn:'1/-1'}}>
            <Field label="Descripción corta (para propuestas)" value={form.short_desc} onChange={v=>setF('short_desc',v)} placeholder="Una línea que va a ver el cliente"/>
          </div>

          {/* Clasificación */}
          <div style={{gridColumn:'1/-1',fontSize:10,color:c.cyan,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',paddingBottom:3,borderBottom:`1px solid ${c.border}`,marginTop:6}}>Clasificación</div>

          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <label style={{fontSize:10,color:c.sub,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em'}}>Categoría</label>
            <select value={form.category||''} onChange={e=>{setF('category',e.target.value);setF('subcategory','')}} style={iStyle}>
              <option value="" style={{background:'#12121f'}}>Seleccionar...</option>
              {Object.keys(CATEGORIES).map(cat=><option key={cat} value={cat} style={{background:'#12121f'}}>{cat}</option>)}
            </select>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <label style={{fontSize:10,color:c.sub,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em'}}>Subcategoría</label>
            <select value={form.subcategory||''} onChange={e=>setF('subcategory',e.target.value)} style={iStyle} disabled={!subcats.length}>
              <option value="" style={{background:'#12121f'}}>Seleccionar...</option>
              {subcats.map(s=><option key={s} value={s} style={{background:'#12121f'}}>{s}</option>)}
            </select>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <label style={{fontSize:10,color:c.sub,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em'}}>Proveedor</label>
            <select value={form.supplier_id||''} onChange={e=>{
              const s=suppliers.find(x=>x.id===e.target.value)
              setF('supplier_id',e.target.value); setF('supplier_name',s?.name||'')
            }} style={iStyle}>
              <option value="" style={{background:'#12121f'}}>Sin proveedor</option>
              {suppliers.map(s=><option key={s.id} value={s.id} style={{background:'#12121f'}}>{s.name}</option>)}
            </select>
          </div>
          <Field label="Norma / Certificación" value={form.norm} onChange={v=>setF('norm',v)} placeholder="IRAM 3620, EN 397..."/>

          {/* Precios */}
          <div style={{gridColumn:'1/-1',fontSize:10,color:c.cyan,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',paddingBottom:3,borderBottom:`1px solid ${c.border}`,marginTop:6}}>Precios</div>

          <Field label="Precio costo ($)" value={form.cost_price} onChange={handleCost} type="number" placeholder="0"/>
          <Field label="Precio venta ($)" value={form.sale_price} onChange={handleSale} type="number" placeholder="0"/>

          {/* Botones de margen rápido */}
          <div style={{gridColumn:'1/-1'}}>
            <div style={{fontSize:9,color:c.muted,marginBottom:5,textTransform:'uppercase'}}>Margen rápido — clic para aplicar</div>
            <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
              {MARGINS_QUICK.map(m=>(
                <button key={m} onClick={()=>handleMarginBtn(m)}
                  style={{padding:'4px 10px',borderRadius:6,border:`1px solid ${+form.margin===m?c.lime:c.border}`,
                  background:+form.margin===m?`${c.lime}15`:'transparent',
                  color:+form.margin===m?c.lime:c.sub,cursor:'pointer',fontSize:11,fontWeight:+form.margin===m?700:400}}>
                  {m}%
                </button>
              ))}
              <div style={{display:'flex',alignItems:'center',gap:8,marginLeft:8,padding:'4px 12px',borderRadius:6,background:'rgba(255,255,255,0.04)',border:`1px solid ${c.border}`}}>
                <span style={{fontSize:10,color:c.muted}}>Margen:</span>
                <span style={{fontSize:13,fontWeight:800,color:+form.margin>0?c.lime:c.rose}}>{form.margin?`${form.margin}%`:'—'}</span>
                <span style={{fontSize:10,color:c.muted}}>→ Venta:</span>
                <span style={{fontSize:13,fontWeight:800,color:c.amber}}>{fmtARS(form.sale_price)}</span>
              </div>
            </div>
          </div>

          <Field label="Moneda" value={form.currency} onChange={v=>setF('currency',v)} options={CURRENCIES}/>
          <Field label="Unidad" value={form.unit} onChange={v=>setF('unit',v)} options={UNITS}/>
          <Field label="Stock" value={form.stock} onChange={v=>setF('stock',v)} type="number" placeholder="0"/>
          <Field label="Pedido mínimo" value={form.min_order} onChange={v=>setF('min_order',v)} type="number" placeholder="1"/>

          {/* Imagen */}
          <div style={{gridColumn:'1/-1',fontSize:10,color:c.cyan,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',paddingBottom:3,borderBottom:`1px solid ${c.border}`,marginTop:6}}>Imagen</div>

          {/* Preview */}
          {form.image_url && (
            <div style={{gridColumn:'1/-1',display:'flex',gap:12,alignItems:'center',padding:10,borderRadius:10,background:'rgba(255,255,255,0.03)',border:`1px solid ${c.lime}25`}}>
              <img src={form.image_url} alt="preview" style={{width:72,height:72,objectFit:'contain',borderRadius:8,background:'rgba(255,255,255,0.05)'}} onError={e=>e.target.style.display='none'}/>
              <div style={{flex:1}}>
                <div style={{fontSize:11,color:c.lime,marginBottom:4}}>✅ Imagen cargada</div>
                <div style={{fontSize:10,color:c.muted,wordBreak:'break-all'}}>{form.image_url.substring(0,70)}...</div>
              </div>
              <button onClick={()=>{setF('image_url','');setImgResults([])}} style={{background:'none',border:`1px solid ${c.rose}40`,borderRadius:6,color:c.rose,cursor:'pointer',fontSize:11,padding:'4px 8px'}}>✕</button>
            </div>
          )}

          {/* Opción A: URL de página o imagen */}
          <div style={{gridColumn:'1/-1'}}>
            <div style={{fontSize:9,color:c.sub,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:5}}>A — Pegá la URL de la página del producto o de la imagen directa</div>
            <div style={{display:'flex',gap:6}}>
              <input value={imgUrl} onChange={e=>setImgUrl(e.target.value)}
                placeholder="https://proveedor.com/producto  o  https://cdn.img/foto.jpg"
                style={{...iStyle,flex:1}}/>
              <button onClick={handleExtractImg} disabled={!imgUrl||extracting}
                style={{padding:'8px 14px',borderRadius:8,border:'none',background:c.amber,color:'#000',cursor:'pointer',fontSize:12,fontWeight:700,whiteSpace:'nowrap',opacity:(!imgUrl||extracting)?0.5:1}}>
                {extracting?'⏳':'🔗 Extraer'}
              </button>
            </div>
          </div>

          {/* Opción B: Buscar con IA */}
          <div style={{gridColumn:'1/-1'}}>
            <div style={{fontSize:9,color:c.sub,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:5}}>B — Buscar imagen automáticamente con IA</div>
            <button onClick={handleSearchImg} disabled={!form.name||searching}
              style={{padding:'8px 16px',borderRadius:8,border:`1px solid ${c.violet}`,background:'rgba(124,58,237,0.1)',
              color:c.violet,cursor:'pointer',fontSize:12,fontWeight:600,opacity:(!form.name||searching)?0.5:1}}>
              {searching?'🔍 Buscando...':'🤖 Buscar imagen con IA'}
            </button>
          </div>

          {/* Resultados búsqueda */}
          {imgResults.length>0 && (
            <div style={{gridColumn:'1/-1'}}>
              <div style={{fontSize:9,color:c.sub,textTransform:'uppercase',marginBottom:6}}>Seleccioná la mejor imagen</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:6}}>
                {imgResults.map((img,i)=>(
                  <div key={i} onClick={()=>setF('image_url',img.url)}
                    style={{cursor:'pointer',borderRadius:8,border:`2px solid ${form.image_url===img.url?c.cyan:c.border}`,
                    padding:6,background:'rgba(255,255,255,0.03)',transition:'all .2s'}}>
                    <img src={img.url} alt={img.source} style={{width:'100%',height:56,objectFit:'contain'}}
                      onError={e=>e.target.parentElement.style.opacity='0.3'}/>
                    <div style={{fontSize:8,color:c.muted,marginTop:3,textAlign:'center',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{img.source}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Opción C: URL directa */}
          <div style={{gridColumn:'1/-1'}}>
            <div style={{fontSize:9,color:c.sub,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:5}}>C — O pegá la URL directa de la imagen</div>
            <input value={form.image_url||''} onChange={e=>setF('image_url',e.target.value)}
              placeholder="https://ejemplo.com/imagen.jpg" style={iStyle}/>
          </div>

          {/* Descripción */}
          <div style={{gridColumn:'1/-1',fontSize:10,color:c.cyan,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',paddingBottom:3,borderBottom:`1px solid ${c.border}`,marginTop:6}}>Detalles adicionales</div>
          <div style={{gridColumn:'1/-1',display:'flex',flexDirection:'column',gap:4}}>
            <label style={{fontSize:10,color:c.sub,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em'}}>Descripción completa / Especificaciones técnicas</label>
            <textarea value={form.description||''} onChange={e=>setF('description',e.target.value)} rows={3}
              placeholder="Materiales, características, aplicaciones, talles disponibles..."
              style={{...iStyle,resize:'vertical'}}/>
          </div>
          <div style={{gridColumn:'1/-1',display:'flex',flexDirection:'column',gap:4}}>
            <label style={{fontSize:10,color:c.sub,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em'}}>Notas internas</label>
            <textarea value={form.notes||''} onChange={e=>setF('notes',e.target.value)} rows={2}
              placeholder="Observaciones privadas, condiciones especiales..." style={{...iStyle,resize:'vertical'}}/>
          </div>
        </div>

        <div style={{display:'flex',justifyContent:'space-between',marginTop:18,paddingTop:14,borderTop:`1px solid ${c.border}`}}>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:12,color:c.sub}}>
              <input type="checkbox" checked={form.available!==false} onChange={e=>setF('available',e.target.checked)}/>
              Disponible para propuestas
            </label>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={onClose} style={{padding:'9px 18px',borderRadius:8,border:`1px solid ${c.border}`,background:'transparent',color:c.sub,cursor:'pointer',fontSize:13}}>Cancelar</button>
            <button onClick={save} disabled={saving||!form.name?.trim()}
              style={{padding:'9px 20px',borderRadius:8,border:'none',background:c.cyan,color:'#000',cursor:'pointer',fontSize:13,fontWeight:700,opacity:saving?0.6:1}}>
              {saving?'Guardando...':isEdit?'💾 Guardar cambios':'💾 Agregar producto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MODAL CARGA MASIVA IA ──
function ModalIA({suppliers, onClose, onSaved}) {
  const [tab, setTab] = useState('pdf')
  const [input, setInput] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [extracted, setExtracted] = useState([])
  const [selected, setSelected] = useState([])
  const [saving, setSaving] = useState(false)
  const [editIdx, setEditIdx] = useState(null)

  const SYSTEM = 'Sos un extractor experto de catálogos industriales y de seguridad. Devolvés SOLO JSON válido sin markdown ni texto adicional.'

  const extract = async () => {
    if (!input && !file) return
    setLoading(true); setExtracted([]); setSelected([])
    try {
      let text = input

      if (file) {
        setProgress('Leyendo archivo...')
        text = await new Promise((res,rej) => {
          const r = new FileReader()
          r.onload = e => res(e.target.result)
          r.onerror = rej
          r.readAsText(file)
        })
      }

      if (tab==='sheets' && input.includes('docs.google.com')) {
        setProgress('Descargando Google Sheet...')
        const id = input.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1]
        if (id) {
          try {
            const r = await fetch(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv`)
            text = await r.text()
          } catch {}
        }
      }

      if (tab==='url' && input.startsWith('http')) {
        setProgress('Leyendo página del proveedor...')
        try {
          const r = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(input)}`)
          const html = await r.text()
          const tmp = document.createElement('div')
          tmp.innerHTML = html
          text = tmp.innerText.substring(0, 14000)
        } catch { text = `URL: ${input}` }
      }

      setProgress('Extrayendo productos con IA...')
      const result = await callClaude(
        `Analizá este contenido y extraé TODOS los productos que puedas identificar.

CONTENIDO:
${text.substring(0,13000)}

Devolvé SOLO JSON array. Extraé la mayor cantidad posible de productos:
[{
  "name": "nombre completo del producto",
  "code": "código o SKU si existe",
  "brand": "marca",
  "model": "modelo si existe",
  "short_desc": "descripción en una línea",
  "cost_price": número (0 si no hay precio),
  "unit": "Unidad/Par/Caja/etc",
  "norm": "norma técnica si existe",
  "category": "una de: EPP, Indumentaria laboral, Trabajo en altura, Seguridad vial y señalización, Contra incendios, Construcción y materiales, Herramientas y equipamiento, Protección ambiental, Primeros auxilios, Tecnología e iluminación, Abastecimiento integral",
  "image_url": "URL imagen si aparece en el contenido, sino vacío"
}]`,
        SYSTEM, 4000
      )

      const clean = result.replace(/```json|```/g,'').trim()
      const products = JSON.parse(clean)
      const enriched = products.map((p,i) => ({
        ...p,
        _id: i,
        currency:'Pesos',
        status:'Activo',
        available: true,
        sale_price: p.cost_price ? calcSale(p.cost_price, 30) : 0,
        margin: p.cost_price ? 30 : '',
      }))
      setExtracted(enriched)
      setSelected(enriched.map((_,i)=>i))
      setProgress('')
    } catch(e) {
      setProgress(`❌ Error: ${e.message}`)
    }
    setLoading(false)
  }

  const saveAll = async () => {
    const toSave = extracted.filter((_,i)=>selected.includes(i))
    if (!toSave.length) return
    setSaving(true)
    for (const p of toSave) {
      const {_id,...payload} = p
      payload.updated_at = new Date()
      await supabase.from('products').insert(payload)
    }
    await onSaved()
    onClose()
    setSaving(false)
  }

  const updateExtracted = (i, field, val) => {
    setExtracted(prev => prev.map((p,idx) => idx===i ? {...p,[field]:val} : p))
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.9)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:12}}>
      <div style={{background:'#0a0a18',border:`1px solid ${c.border}`,borderRadius:16,padding:22,width:'100%',maxWidth:960,maxHeight:'95vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <div style={{fontSize:15,fontWeight:700}}>🤖 Carga masiva con IA</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:c.sub,cursor:'pointer',fontSize:22}}>×</button>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:6,marginBottom:16,background:'rgba(255,255,255,0.03)',borderRadius:10,padding:4,border:`1px solid ${c.border}`}}>
          {[
            {key:'pdf', label:'📄 PDF / CSV / Texto'},
            {key:'sheets', label:'📊 Google Sheets'},
            {key:'url', label:'🌐 Sitio web / Tienda'},
          ].map(t=>(
            <button key={t.key} onClick={()=>{setTab(t.key);setInput('');setFile(null);setExtracted([])}}
              style={{flex:1,padding:'8px',borderRadius:7,border:'none',cursor:'pointer',fontSize:12,fontWeight:tab===t.key?700:400,
              background:tab===t.key?c.cyan:'transparent',color:tab===t.key?'#000':c.sub,transition:'all .2s'}}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Input */}
        {tab==='pdf' ? (
          <div style={{marginBottom:14}}>
            <div
              style={{border:`2px dashed ${file?c.lime:c.border}`,borderRadius:12,padding:20,textAlign:'center',marginBottom:10,cursor:'pointer'}}
              onClick={()=>document.getElementById('ia-upload').click()}
              onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor=c.cyan}}
              onDragLeave={e=>e.currentTarget.style.borderColor=file?c.lime:c.border}
              onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f){setFile(f);setInput('')}}}>
              <div style={{fontSize:28,marginBottom:6}}>{file?'✅':'📄'}</div>
              <div style={{fontSize:13,color:c.sub}}>{file?file.name:'Arrastrá o hacé clic — PDF, CSV, TXT, Excel'}</div>
              <div style={{fontSize:11,color:c.muted,marginTop:3}}>Lista de precios, catálogo del proveedor, planilla</div>
              <input id="ia-upload" type="file" accept=".pdf,.csv,.txt,.xlsx,.xls" onChange={e=>{setFile(e.target.files[0]);setInput('')}} style={{display:'none'}}/>
            </div>
            <div style={{fontSize:11,color:c.muted,textAlign:'center',marginBottom:6}}>— o pegá el texto copiado del PDF / catálogo —</div>
            <textarea value={input} onChange={e=>setInput(e.target.value)} rows={5}
              placeholder="Pegá aquí el texto del catálogo, lista de precios o cualquier listado de productos..."
              style={{...iStyle,resize:'vertical'}}/>
          </div>
        ) : (
          <div style={{marginBottom:14}}>
            <input value={input} onChange={e=>setInput(e.target.value)}
              placeholder={tab==='sheets'
                ? 'https://docs.google.com/spreadsheets/d/ID/...'
                : 'https://proveedor.com.ar/catalogo'}
              style={{...iStyle,marginBottom:6}}/>
            <div style={{fontSize:11,color:c.muted}}>
              {tab==='sheets'
                ? '💡 El Sheet debe ser público. Columnas ideales: Nombre, Código, Marca, Precio costo.'
                : '💡 Funciona mejor en sitios con texto visible. Algunos pueden bloquear el acceso.'}
            </div>
          </div>
        )}

        <button onClick={extract} disabled={loading||(!input&&!file)}
          style={{width:'100%',padding:'12px',borderRadius:10,border:'none',
          background:loading?'rgba(255,255,255,0.1)':`linear-gradient(135deg,${c.cyan},${c.violet})`,
          color:'#fff',cursor:'pointer',fontSize:14,fontWeight:700,marginBottom:16,
          opacity:(!input&&!file)?0.5:1}}>
          {loading?`⏳ ${progress||'Procesando...'}`:'🚀 Extraer productos con IA'}
        </button>

        {/* Resultados */}
        {extracted.length>0 && (
          <>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12,flexWrap:'wrap',gap:8}}>
              <div>
                <span style={{fontSize:14,fontWeight:700,color:c.lime}}>✅ {extracted.length} productos detectados</span>
                <span style={{fontSize:12,color:c.sub,marginLeft:8}}>{selected.length} seleccionados para guardar</span>
              </div>
              <div style={{display:'flex',gap:6}}>
                <button onClick={()=>setSelected(extracted.map((_,i)=>i))}
                  style={{padding:'5px 10px',borderRadius:6,border:`1px solid ${c.lime}`,background:'transparent',color:c.lime,cursor:'pointer',fontSize:11}}>Todos</button>
                <button onClick={()=>setSelected([])}
                  style={{padding:'5px 10px',borderRadius:6,border:`1px solid ${c.border}`,background:'transparent',color:c.sub,cursor:'pointer',fontSize:11}}>Ninguno</button>
              </div>
            </div>

            {/* Tabla editable */}
            <div style={{overflowX:'auto',marginBottom:16,borderRadius:10,border:`1px solid ${c.border}`}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead>
                  <tr style={{borderBottom:`1px solid ${c.border}`,background:'rgba(255,255,255,0.03)'}}>
                    <th style={{padding:'8px 10px',textAlign:'left',width:30}}/>
                    <th style={{padding:'8px 10px',textAlign:'left',color:c.sub,fontWeight:600,fontSize:10,textTransform:'uppercase'}}>Nombre</th>
                    <th style={{padding:'8px 10px',textAlign:'left',color:c.sub,fontWeight:600,fontSize:10,textTransform:'uppercase'}}>Marca</th>
                    <th style={{padding:'8px 10px',textAlign:'left',color:c.sub,fontWeight:600,fontSize:10,textTransform:'uppercase'}}>Categoría</th>
                    <th style={{padding:'8px 10px',textAlign:'right',color:c.sub,fontWeight:600,fontSize:10,textTransform:'uppercase'}}>Costo</th>
                    <th style={{padding:'8px 10px',textAlign:'right',color:c.sub,fontWeight:600,fontSize:10,textTransform:'uppercase'}}>Margen</th>
                    <th style={{padding:'8px 10px',textAlign:'right',color:c.sub,fontWeight:600,fontSize:10,textTransform:'uppercase'}}>Venta</th>
                    <th style={{padding:'8px 10px',width:40}}/>
                  </tr>
                </thead>
                <tbody>
                  {extracted.map((p,i)=>(
                    <>
                      <tr key={i} style={{borderBottom:`1px solid ${c.border}`,background:selected.includes(i)?'rgba(6,182,212,0.04)':'transparent',
                        opacity:selected.includes(i)?1:0.4,transition:'all .15s'}}>
                        <td style={{padding:'8px 10px',textAlign:'center'}}>
                          <input type="checkbox" checked={selected.includes(i)}
                            onChange={()=>setSelected(prev=>prev.includes(i)?prev.filter(x=>x!==i):[...prev,i])}/>
                        </td>
                        <td style={{padding:'8px 10px',fontWeight:500,color:c.text,maxWidth:200}}>
                          {editIdx===i
                            ? <input value={p.name} onChange={e=>updateExtracted(i,'name',e.target.value)}
                                style={{...iStyle,padding:'4px 6px',fontSize:12}}/>
                            : <span style={{display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</span>
                          }
                        </td>
                        <td style={{padding:'8px 10px',color:c.sub}}>{p.brand||'—'}</td>
                        <td style={{padding:'8px 10px'}}>
                          <span style={{fontSize:10,padding:'2px 7px',borderRadius:20,background:'rgba(6,182,212,0.1)',color:c.cyan}}>
                            {p.category||'—'}
                          </span>
                        </td>
                        <td style={{padding:'8px 10px',textAlign:'right'}}>
                          {editIdx===i
                            ? <input type="number" value={p.cost_price||''} onChange={e=>{
                                const cost=+e.target.value
                                updateExtracted(i,'cost_price',cost)
                                updateExtracted(i,'sale_price',calcSale(cost,p.margin||30))
                              }} style={{...iStyle,padding:'4px 6px',fontSize:12,width:80,textAlign:'right'}}/>
                            : <span style={{color:c.amber,fontWeight:600}}>{fmtARS(p.cost_price)}</span>
                          }
                        </td>
                        <td style={{padding:'8px 10px',textAlign:'right'}}>
                          {editIdx===i
                            ? <select value={p.margin||30} onChange={e=>{
                                const m=+e.target.value
                                updateExtracted(i,'margin',m)
                                updateExtracted(i,'sale_price',calcSale(p.cost_price,m))
                              }} style={{...iStyle,padding:'4px 6px',fontSize:12,width:70}}>
                                {MARGINS_QUICK.map(m=><option key={m} value={m} style={{background:'#12121f'}}>{m}%</option>)}
                              </select>
                            : <span style={{color:c.lime}}>{p.margin?`${p.margin}%`:'30%'}</span>
                          }
                        </td>
                        <td style={{padding:'8px 10px',textAlign:'right',fontWeight:700,color:c.amber}}>{fmtARS(p.sale_price)}</td>
                        <td style={{padding:'8px 10px',textAlign:'center'}}>
                          <button onClick={()=>setEditIdx(editIdx===i?null:i)}
                            style={{background:'none',border:`1px solid ${c.border}`,borderRadius:5,color:c.muted,cursor:'pointer',fontSize:10,padding:'2px 6px'}}>
                            {editIdx===i?'✓':'✏️'}
                          </button>
                        </td>
                      </tr>
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{display:'flex',gap:8,justifyContent:'space-between',alignItems:'center',paddingTop:14,borderTop:`1px solid ${c.border}`}}>
              <div style={{fontSize:12,color:c.sub}}>
                Podés editar nombre, precio y margen antes de guardar haciendo clic en ✏️
              </div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={onClose} style={{padding:'9px 18px',borderRadius:8,border:`1px solid ${c.border}`,background:'transparent',color:c.sub,cursor:'pointer',fontSize:13}}>Cancelar</button>
                <button onClick={saveAll} disabled={saving||!selected.length}
                  style={{padding:'9px 20px',borderRadius:8,border:'none',background:c.lime,color:'#000',cursor:'pointer',fontSize:13,fontWeight:700,opacity:(!selected.length||saving)?0.5:1}}>
                  {saving?'Guardando...':`💾 Guardar ${selected.length} productos`}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── MÓDULO PRINCIPAL ──
export default function CargaProductos() {
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // 'form' | 'ia' | 'detail'
  const [formMode, setFormMode] = useState('new') // 'new' | 'edit' | 'duplicate'
  const [activeProduct, setActiveProduct] = useState(null)
  const [priceEdit, setPriceEdit] = useState(null)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterSupplier, setFilterSupplier] = useState('')
  const [filterAvail, setFilterAvail] = useState(false)
  const [view, setView] = useState('grid') // 'grid' | 'table'
  const [sortBy, setSortBy] = useState('recent')

  useEffect(()=>{loadAll()},[])

  const loadAll = async () => {
    setLoading(true)
    const [{data:prods},{data:supps}] = await Promise.all([
      supabase.from('products').select('*').order('created_at',{ascending:false}),
      supabase.from('suppliers').select('id,name').order('name')
    ])
    setProducts(prods||[])
    setSuppliers(supps||[])
    setLoading(false)
  }

  const openForm = (mode, product=null) => {
    setFormMode(mode)
    setActiveProduct(product)
    setModal('form')
  }

  const deleteProduct = async id => {
    if (!confirm('¿Eliminar este producto?')) return
    await supabase.from('products').delete().eq('id',id)
    setModal(null)
    setActiveProduct(null)
    loadAll()
  }

  // Filtros y orden
  let filtered = products.filter(p => {
    const q = search.toLowerCase()
    const mSearch = !q || p.name?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q) || p.supplier_name?.toLowerCase().includes(q)
    const mCat = !filterCat || p.category === filterCat
    const mSupp = !filterSupplier || p.supplier_name === filterSupplier
    const mAvail = !filterAvail || p.available !== false
    return mSearch && mCat && mSupp && mAvail
  })

  if (sortBy==='name') filtered = [...filtered].sort((a,b)=>a.name?.localeCompare(b.name))
  else if (sortBy==='price_asc') filtered = [...filtered].sort((a,b)=>(+a.cost_price||0)-(+b.cost_price||0))
  else if (sortBy==='price_desc') filtered = [...filtered].sort((a,b)=>(+b.cost_price||0)-(+a.cost_price||0))
  else if (sortBy==='margin') filtered = [...filtered].sort((a,b)=>(+b.margin||0)-(+a.margin||0))

  const noPrice = products.filter(p=>!p.cost_price||+p.cost_price===0).length
  const noImage = products.filter(p=>!p.image_url).length

  return (
    <div>
      {/* HEADER */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10}}>
        <div>
          <h2 style={{margin:0,fontSize:20,fontWeight:800}}>⬆️ Carga de Productos</h2>
          <p style={{margin:'3px 0 0',color:c.sub,fontSize:12}}>
            {products.length} productos · {filtered.length} mostrando
            {noPrice>0&&<span style={{color:c.amber,marginLeft:8}}>· ⚠️ {noPrice} sin precio</span>}
            {noImage>0&&<span style={{color:c.muted,marginLeft:8}}>· 📷 {noImage} sin imagen</span>}
          </p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>setModal('ia')}
            style={{padding:'8px 16px',borderRadius:8,border:`1px solid ${c.violet}`,background:'rgba(124,58,237,0.1)',color:c.violet,cursor:'pointer',fontSize:13,fontWeight:600}}>
            🤖 Carga masiva IA
          </button>
          <button onClick={()=>openForm('new')}
            style={{padding:'8px 16px',borderRadius:8,border:'none',background:c.cyan,color:'#000',cursor:'pointer',fontSize:13,fontWeight:700}}>
            ➕ Agregar producto
          </button>
        </div>
      </div>

      {/* MÉTODOS si no hay productos */}
      {products.length===0 && !loading && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
          {[
            {icon:'➕',title:'Carga manual',desc:'Uno por uno con formulario completo, búsqueda de imagen por IA y cálculo automático de margen.',color:c.cyan,action:()=>openForm('new')},
            {icon:'📄',title:'PDF / CSV / Texto',desc:'Subí el catálogo o pegá el texto. La IA detecta todos los productos, precios y categorías.',color:c.violet,action:()=>setModal('ia')},
            {icon:'📊',title:'Google Sheets / Web',desc:'Pegá la URL del sheet o del sitio del proveedor y la IA extrae todo automáticamente.',color:c.amber,action:()=>setModal('ia')},
          ].map((m,i)=>(
            <div key={i} onClick={m.action}
              style={{padding:20,borderRadius:14,border:`1px solid ${m.color}25`,background:`${m.color}06`,cursor:'pointer',transition:'all .2s'}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=m.color}
              onMouseLeave={e=>e.currentTarget.style.borderColor=`${m.color}25`}>
              <div style={{fontSize:28,marginBottom:10}}>{m.icon}</div>
              <div style={{fontSize:14,fontWeight:700,marginBottom:6}}>{m.title}</div>
              <div style={{fontSize:12,color:c.sub,lineHeight:1.5}}>{m.desc}</div>
              <div style={{marginTop:12,fontSize:12,color:m.color,fontWeight:600}}>Usar este método →</div>
            </div>
          ))}
        </div>
      )}

      {/* FILTROS */}
      {products.length>0 && (
        <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="🔍 Nombre, marca, código, proveedor..."
            style={{...iStyle,flex:1,minWidth:180}}/>
          <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{...iStyle,width:'auto'}}>
            <option value="" style={{background:'#12121f'}}>Todas las categorías</option>
            {Object.keys(CATEGORIES).map(cat=><option key={cat} value={cat} style={{background:'#12121f'}}>{cat}</option>)}
          </select>
          <select value={filterSupplier} onChange={e=>setFilterSupplier(e.target.value)} style={{...iStyle,width:'auto'}}>
            <option value="" style={{background:'#12121f'}}>Todos los proveedores</option>
            {suppliers.map(s=><option key={s.id} value={s.name} style={{background:'#12121f'}}>{s.name}</option>)}
          </select>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{...iStyle,width:'auto'}}>
            <option value="recent" style={{background:'#12121f'}}>Más recientes</option>
            <option value="name" style={{background:'#12121f'}}>A → Z</option>
            <option value="price_asc" style={{background:'#12121f'}}>Precio ↑</option>
            <option value="price_desc" style={{background:'#12121f'}}>Precio ↓</option>
            <option value="margin" style={{background:'#12121f'}}>Mayor margen</option>
          </select>
          <label style={{display:'flex',alignItems:'center',gap:5,cursor:'pointer',fontSize:12,color:filterAvail?c.lime:c.sub,whiteSpace:'nowrap'}}>
            <input type="checkbox" checked={filterAvail} onChange={e=>setFilterAvail(e.target.checked)}/>
            Solo disponibles
          </label>
          {/* Vista grid/tabla */}
          <div style={{display:'flex',gap:2,background:'rgba(255,255,255,0.04)',borderRadius:7,padding:2,border:`1px solid ${c.border}`}}>
            {[{v:'grid',i:'⊞'},{v:'table',i:'☰'}].map(b=>(
              <button key={b.v} onClick={()=>setView(b.v)}
                style={{padding:'5px 10px',borderRadius:5,border:'none',cursor:'pointer',fontSize:13,
                background:view===b.v?c.cyan:'transparent',color:view===b.v?'#000':c.sub}}>
                {b.i}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div style={{textAlign:'center',padding:'60px 0',color:c.cyan}}>
          <div style={{fontSize:32,marginBottom:8}}>⚡</div><div>Cargando productos...</div>
        </div>
      )}

      {/* GRID VIEW */}
      {!loading && view==='grid' && filtered.length>0 && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(185px,1fr))',gap:10}}>
          {filtered.map(p=>(
            <div key={p.id}
              style={{background:c.panel,border:`1px solid ${p.available===false?c.rose+'30':c.border}`,borderRadius:13,overflow:'hidden',transition:'all .2s',position:'relative'}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=c.cyan}
              onMouseLeave={e=>e.currentTarget.style.borderColor=p.available===false?c.rose+'30':c.border}>

              {/* Imagen */}
              <div style={{height:110,background:'rgba(255,255,255,0.03)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',cursor:'pointer',position:'relative'}}
                onClick={()=>{setActiveProduct(p);setModal('detail')}}>
                {p.image_url
                  ?<img src={p.image_url} alt={p.name} style={{width:'100%',height:'100%',objectFit:'contain'}} onError={e=>e.target.style.display='none'}/>
                  :<div style={{fontSize:28,opacity:0.15}}>📦</div>
                }
                {!p.image_url&&<div style={{position:'absolute',bottom:4,right:4,fontSize:9,color:c.muted,background:'rgba(0,0,0,0.6)',padding:'2px 5px',borderRadius:4}}>Sin imagen</div>}
              </div>

              {/* Info */}
              <div style={{padding:10,cursor:'pointer'}} onClick={()=>{setActiveProduct(p);setModal('detail')}}>
                <div style={{fontSize:11,fontWeight:700,lineHeight:1.3,marginBottom:3,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{p.name}</div>
                {p.brand&&<div style={{fontSize:9,color:c.cyan,marginBottom:2}}>🏷️ {p.brand}</div>}
                {p.supplier_name&&<div style={{fontSize:9,color:c.sub,marginBottom:5}}>🏭 {p.supplier_name}</div>}

                {/* Precio + margen */}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  {p.cost_price>0
                    ?<div>
                      <div style={{fontSize:9,color:c.muted}}>Costo</div>
                      <div style={{fontSize:12,fontWeight:800,color:c.amber}}>{fmtARS(p.cost_price)}</div>
                    </div>
                    :<div style={{fontSize:9,color:c.rose}}>⚠️ Sin precio</div>
                  }
                  {p.margin>0&&(
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:9,color:c.muted}}>Venta</div>
                      <div style={{fontSize:11,fontWeight:700,color:c.lime}}>{fmtARS(p.sale_price)}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Acciones hover */}
              <div style={{display:'flex',borderTop:`1px solid ${c.border}`}}>
                <button onClick={()=>openForm('edit',p)}
                  style={{flex:1,padding:'6px',background:'none',border:'none',color:c.sub,cursor:'pointer',fontSize:11,borderRight:`1px solid ${c.border}`}}>✏️ Editar</button>
                <button onClick={()=>openForm('duplicate',p)}
                  style={{flex:1,padding:'6px',background:'none',border:'none',color:c.sub,cursor:'pointer',fontSize:11,borderRight:`1px solid ${c.border}`}}>📋 Duplicar</button>
                <button onClick={()=>setPriceEdit(priceEdit===p.id?null:p.id)}
                  style={{flex:1,padding:'6px',background:'none',border:'none',color:c.amber,cursor:'pointer',fontSize:11}}>💲 Precio</button>
              </div>

              {/* Editor de precio inline */}
              {priceEdit===p.id&&(
                <div style={{padding:8,borderTop:`1px solid ${c.border}`}}>
                  <PriceEditor product={p} onSave={()=>{setPriceEdit(null);loadAll()}}/>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TABLE VIEW */}
      {!loading && view==='table' && filtered.length>0 && (
        <div style={{overflowX:'auto',borderRadius:12,border:`1px solid ${c.border}`}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{borderBottom:`1px solid ${c.border}`,background:'rgba(255,255,255,0.03)'}}>
                {['Producto','Marca','Categoría','Proveedor','Costo','Margen','Venta','Stock',''].map(h=>(
                  <th key={h} style={{padding:'10px 12px',textAlign:'left',fontSize:10,color:c.sub,fontWeight:600,textTransform:'uppercase'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p=>(
                <tr key={p.id} style={{borderBottom:`1px solid ${c.border}`,transition:'background .15s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{padding:'10px 12px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      {p.image_url
                        ?<img src={p.image_url} alt="" style={{width:32,height:32,objectFit:'contain',borderRadius:4,background:'rgba(255,255,255,0.04)'}} onError={e=>e.target.style.display='none'}/>
                        :<div style={{width:32,height:32,borderRadius:4,background:'rgba(255,255,255,0.04)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,opacity:0.3}}>📦</div>
                      }
                      <div>
                        <div style={{fontWeight:600,color:c.text}}>{p.name}</div>
                        {p.code&&<div style={{fontSize:10,color:c.muted}}>{p.code}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{padding:'10px 12px',color:c.sub}}>{p.brand||'—'}</td>
                  <td style={{padding:'10px 12px'}}>
                    {p.category&&<span style={{fontSize:10,padding:'2px 7px',borderRadius:20,background:'rgba(6,182,212,0.1)',color:c.cyan}}>{p.category.split(' ').slice(1).join(' ')}</span>}
                  </td>
                  <td style={{padding:'10px 12px',color:c.sub,fontSize:11}}>{p.supplier_name||'—'}</td>
                  <td style={{padding:'10px 12px',fontWeight:700,color:p.cost_price?c.amber:c.rose}}>{p.cost_price?fmtARS(p.cost_price):'⚠️'}</td>
                  <td style={{padding:'10px 12px',color:c.lime,fontWeight:600}}>{p.margin?`${p.margin}%`:'—'}</td>
                  <td style={{padding:'10px 12px',fontWeight:700,color:c.lime}}>{p.sale_price?fmtARS(p.sale_price):'—'}</td>
                  <td style={{padding:'10px 12px',color:c.sub}}>{p.stock||0}</td>
                  <td style={{padding:'10px 12px'}}>
                    <div style={{display:'flex',gap:4}}>
                      <button onClick={()=>openForm('edit',p)} style={{background:'none',border:`1px solid ${c.border}`,borderRadius:5,color:c.sub,cursor:'pointer',fontSize:10,padding:'3px 7px'}}>✏️</button>
                      <button onClick={()=>openForm('duplicate',p)} style={{background:'none',border:`1px solid ${c.border}`,borderRadius:5,color:c.sub,cursor:'pointer',fontSize:10,padding:'3px 7px'}}>📋</button>
                      <button onClick={()=>deleteProduct(p.id)} style={{background:'none',border:`1px solid ${c.rose}30`,borderRadius:5,color:c.rose,cursor:'pointer',fontSize:10,padding:'3px 7px'}}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filtered.length===0 && products.length>0 && (
        <div style={{textAlign:'center',padding:'40px 0',color:c.muted}}>Sin resultados. Probá cambiando los filtros.</div>
      )}

      {/* MODAL DETALLE */}
      {modal==='detail' && activeProduct && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.9)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:12}}>
          <div style={{background:'#0a0a18',border:`1px solid ${c.border}`,borderRadius:16,padding:22,width:'100%',maxWidth:560,maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:14}}>
              <div style={{fontSize:15,fontWeight:700}}>{activeProduct.name}</div>
              <button onClick={()=>{setModal(null);setActiveProduct(null)}} style={{background:'none',border:'none',color:c.sub,cursor:'pointer',fontSize:22}}>×</button>
            </div>
            {activeProduct.image_url&&(
              <img src={activeProduct.image_url} alt={activeProduct.name}
                style={{width:'100%',height:160,objectFit:'contain',borderRadius:10,background:'rgba(255,255,255,0.04)',marginBottom:14}}
                onError={e=>e.target.style.display='none'}/>
            )}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
              {[
                {l:'Código',v:activeProduct.code},{l:'Marca',v:activeProduct.brand},
                {l:'Modelo',v:activeProduct.model},{l:'Categoría',v:activeProduct.category},
                {l:'Subcategoría',v:activeProduct.subcategory},{l:'Proveedor',v:activeProduct.supplier_name},
                {l:'Precio costo',v:activeProduct.cost_price?fmtARS(activeProduct.cost_price):null},
                {l:'Precio venta',v:activeProduct.sale_price?fmtARS(activeProduct.sale_price):null},
                {l:'Margen',v:activeProduct.margin?`${activeProduct.margin}%`:null},
                {l:'Unidad',v:activeProduct.unit},{l:'Stock',v:activeProduct.stock},{l:'Norma',v:activeProduct.norm},
              ].filter(f=>f.v).map((f,i)=>(
                <div key={i} style={{padding:'8px 10px',borderRadius:8,background:'rgba(255,255,255,0.03)',border:`1px solid ${c.border}`}}>
                  <div style={{fontSize:9,color:c.muted,textTransform:'uppercase',marginBottom:2}}>{f.l}</div>
                  <div style={{fontSize:13,fontWeight:500}}>{f.v}</div>
                </div>
              ))}
            </div>
            {activeProduct.description&&(
              <div style={{padding:12,borderRadius:8,background:'rgba(255,255,255,0.03)',border:`1px solid ${c.border}`,marginBottom:14}}>
                <div style={{fontSize:9,color:c.muted,textTransform:'uppercase',marginBottom:4}}>Descripción</div>
                <div style={{fontSize:12,color:c.sub,lineHeight:1.6}}>{activeProduct.description}</div>
              </div>
            )}
            <div style={{display:'flex',gap:8,justifyContent:'space-between'}}>
              <button onClick={()=>deleteProduct(activeProduct.id)}
                style={{padding:'8px 12px',borderRadius:8,border:`1px solid ${c.rose}`,background:'transparent',color:c.rose,cursor:'pointer',fontSize:12}}>🗑️ Eliminar</button>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>{setModal(null);openForm('duplicate',activeProduct)}}
                  style={{padding:'8px 14px',borderRadius:8,border:`1px solid ${c.border}`,background:'transparent',color:c.sub,cursor:'pointer',fontSize:12}}>📋 Duplicar</button>
                <button onClick={()=>{setModal(null);openForm('edit',activeProduct)}}
                  style={{padding:'9px 18px',borderRadius:8,border:'none',background:c.cyan,color:'#000',cursor:'pointer',fontSize:13,fontWeight:700}}>✏️ Editar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modal==='form' && (
        <ModalForm suppliers={suppliers} initial={activeProduct} mode={formMode}
          onClose={()=>{setModal(null);setActiveProduct(null)}} onSaved={loadAll}/>
      )}
      {modal==='ia' && (
        <ModalIA suppliers={suppliers} onClose={()=>setModal(null)} onSaved={loadAll}/>
      )}
    </div>
  )
}
