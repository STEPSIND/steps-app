import { useState, useEffect } from 'react'
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

const EMPTY = {
  name:'', code:'', brand:'', model:'', category:'', subcategory:'',
  supplier_id:'', supplier_name:'', cost_price:'', sale_price:'', margin:'',
  currency:'Pesos', unit:'Unidad', norm:'', description:'', short_desc:'',
  image_url:'', status:'Activo', stock:'', notes:''
}

const inputStyle = {
  background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.07)',
  borderRadius:8, padding:'8px 10px', color:'#f1f5f9', fontSize:13,
  outline:'none', width:'100%', boxSizing:'border-box'
}

function Field({label, value, onChange, placeholder='', type='text', options, span}) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:4,gridColumn:span?'1/-1':undefined}}>
      <label style={{fontSize:10,color:'#94a3b8',fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em'}}>{label}</label>
      {options
        ? <select value={value||''} onChange={e=>onChange(e.target.value)} style={inputStyle}>
            {options.map(o=><option key={o} value={o} style={{background:'#12121f'}}>{o}</option>)}
          </select>
        : <input type={type} value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={inputStyle}/>
      }
    </div>
  )
}

// ── LLAMADA A CLAUDE API ──
async function callClaude(messages, system, maxTokens=2000) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({
      model:'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system,
      messages,
    })
  })
  const data = await res.json()
  return data.content?.[0]?.text || ''
}

// ── EXTRAER IMAGEN DESDE URL DE PRODUCTO ──
async function extractImageFromUrl(productUrl) {
  try {
    // Intentar via proxy para evitar CORS
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(productUrl)}`
    const r = await fetch(proxyUrl)
    const html = await r.text()

    // Buscar meta og:image primero (la más confiable)
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
    if (ogMatch?.[1]) return ogMatch[1]

    // Buscar twitter:image
    const twitterMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
    if (twitterMatch?.[1]) return twitterMatch[1]

    // Buscar imagen principal del producto (patrones comunes de e-commerce)
    const imgPatterns = [
      /class=["'][^"']*(?:product|main|primary|featured)[^"']*["'][^>]*src=["']([^"']+\.(jpg|jpeg|png|webp))/i,
      /<img[^>]+id=["'][^"']*(?:main|primary|product)[^"']*["'][^>]+src=["']([^"']+\.(jpg|jpeg|png|webp))/i,
      /<img[^>]+src=["'](https?:\/\/[^"']+\.(jpg|jpeg|png|webp)[^"']*)/i,
    ]
    for (const pattern of imgPatterns) {
      const match = html.match(pattern)
      if (match?.[1]) return match[1]
    }
    return null
  } catch { return null }
}

// ── BUSCAR IMÁGENES CON IA ──
async function searchImagesWithAI(productName, brand, model) {
  const query = `${brand||''} ${productName} ${model||''}`.trim()

  // Construir URLs de búsqueda directas a imágenes de fabricantes conocidos
  const text = await callClaude([{
    role:'user',
    content:`Producto industrial/seguridad: "${query}"

Devolvé SOLO un JSON array con 6 URLs directas a imágenes JPG/PNG/WEBP de alta resolución de este producto específico.
Buscá en sitios como: libus.com.ar, 3m.com, msa.com, honeywell.com, uvex.com, deltaplus.com, ansell.com, uvichem.com, proseind.com.ar, guantexindustrial.com.ar y distribuidores industriales.

Formato EXACTO (solo JSON, sin texto):
[
  {"url":"https://...imagen1.jpg","source":"Nombre del sitio"},
  {"url":"https://...imagen2.png","source":"Nombre del sitio"},
  {"url":"https://...imagen3.jpg","source":"Nombre del sitio"},
  {"url":"https://...imagen4.jpg","source":"Nombre del sitio"},
  {"url":"https://...imagen5.jpg","source":"Nombre del sitio"},
  {"url":"https://...imagen6.jpg","source":"Nombre del sitio"}
]`
  }],
  'Sos un experto en productos industriales y de seguridad. Conocés exactamente las URLs de imágenes en los sitios de fabricantes y distribuidores. Devolvés SOLO JSON válido.',
  1500)

  const clean = text.replace(/```json|```/g,'').trim()
  return JSON.parse(clean)
}

// ── MODAL FORMULARIO (crear y editar) ──
function ModalForm({ suppliers, initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial || EMPTY)
  const [saving, setSaving] = useState(false)
  const [searchingImg, setSearchingImg] = useState(false)
  const [imgResults, setImgResults] = useState([])
  const [imgUrlInput, setImgUrlInput] = useState('')
  const [extractingImg, setExtractingImg] = useState(false)

  const isEdit = !!initial?.id
  const setF = (k,v) => setForm(p=>({...p,[k]:v}))
  const subcats = form.category ? (CATEGORIES[form.category]||[]) : []

  const calcMargin = (cost,sale) => {
    if (!cost||!sale||+cost===0) return ''
    return (((+sale-+cost)/+cost)*100).toFixed(1)
  }
  const handleCostChange = v => setForm(p=>({...p,cost_price:v,margin:calcMargin(v,p.sale_price)}))
  const handleSaleChange = v => setForm(p=>({...p,sale_price:v,margin:calcMargin(p.cost_price,v)}))

  // Extraer imagen desde URL del producto
  const handleExtractFromUrl = async () => {
    if (!imgUrlInput.startsWith('http')) return
    setExtractingImg(true)
    const url = await extractImageFromUrl(imgUrlInput)
    if (url) {
      setF('image_url', url)
    } else {
      // Si no encontró, poner la URL directamente por si es imagen
      if (/\.(jpg|jpeg|png|webp|gif)/i.test(imgUrlInput)) {
        setF('image_url', imgUrlInput)
      } else {
        alert('No se pudo extraer la imagen automáticamente. Probá pegando la URL directa de la imagen.')
      }
    }
    setExtractingImg(false)
  }

  // Buscar imágenes con IA
  const handleSearchImages = async () => {
    if (!form.name) return
    setSearchingImg(true)
    setImgResults([])
    try {
      const results = await searchImagesWithAI(form.name, form.brand, form.model)
      setImgResults(results)
    } catch {
      setImgResults([{url:'', source:'Error al buscar — intentá con la URL directa'}])
    }
    setSearchingImg(false)
  }

  const save = async () => {
    if (!form.name?.trim()) return
    setSaving(true)
    if (isEdit) {
      const {id, ...payload} = form
      await supabase.from('products').update(payload).eq('id', id)
    } else {
      const {id, ...payload} = form
      await supabase.from('products').insert(payload)
    }
    await onSaved()
    onClose()
    setSaving(false)
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:16}}>
      <div style={{background:'#0d0d1a',border:`1px solid ${c.border}`,borderRadius:16,padding:24,width:'100%',maxWidth:760,maxHeight:'93vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div style={{fontSize:16,fontWeight:700}}>{isEdit ? '✏️ Editar producto' : '➕ Nuevo producto'}</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:c.sub,cursor:'pointer',fontSize:22}}>×</button>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>

          {/* Identificación */}
          <div style={{gridColumn:'1/-1',fontSize:11,color:c.cyan,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',paddingBottom:4,borderBottom:`1px solid ${c.border}`}}>Identificación</div>
          <div style={{gridColumn:'1/-1'}}><Field label="Nombre del producto *" value={form.name} onChange={v=>setF('name',v)} placeholder="Ej: Casco de seguridad clase A"/></div>
          <Field label="Código / SKU" value={form.code} onChange={v=>setF('code',v)} placeholder="Código interno"/>
          <Field label="Marca" value={form.brand} onChange={v=>setF('brand',v)} placeholder="Ej: 3M, MSA, Libus..."/>
          <Field label="Modelo" value={form.model} onChange={v=>setF('model',v)} placeholder="Número de modelo"/>
          <div style={{gridColumn:'1/-1'}}>
            <Field label="Descripción corta" value={form.short_desc} onChange={v=>setF('short_desc',v)} placeholder="Una línea descriptiva del producto"/>
          </div>

          {/* Clasificación */}
          <div style={{gridColumn:'1/-1',fontSize:11,color:c.cyan,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',paddingBottom:4,borderBottom:`1px solid ${c.border}`,marginTop:8}}>Clasificación</div>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <label style={{fontSize:10,color:c.sub,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em'}}>Categoría</label>
            <select value={form.category||''} onChange={e=>{setF('category',e.target.value);setF('subcategory','')}} style={inputStyle}>
              <option value="" style={{background:'#12121f'}}>Seleccionar categoría</option>
              {Object.keys(CATEGORIES).map(cat=><option key={cat} value={cat} style={{background:'#12121f'}}>{cat}</option>)}
            </select>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <label style={{fontSize:10,color:c.sub,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em'}}>Subcategoría</label>
            <select value={form.subcategory||''} onChange={e=>setF('subcategory',e.target.value)} style={inputStyle} disabled={!form.category}>
              <option value="" style={{background:'#12121f'}}>Seleccionar subcategoría</option>
              {subcats.map(s=><option key={s} value={s} style={{background:'#12121f'}}>{s}</option>)}
            </select>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <label style={{fontSize:10,color:c.sub,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em'}}>Proveedor</label>
            <select value={form.supplier_id||''} onChange={e=>{
              const s=suppliers.find(x=>x.id===e.target.value)
              setF('supplier_id',e.target.value)
              setF('supplier_name',s?.name||'')
            }} style={inputStyle}>
              <option value="" style={{background:'#12121f'}}>Sin proveedor</option>
              {suppliers.map(s=><option key={s.id} value={s.id} style={{background:'#12121f'}}>{s.name}</option>)}
            </select>
          </div>
          <Field label="Norma técnica / Certificación" value={form.norm} onChange={v=>setF('norm',v)} placeholder="Ej: IRAM 3620, EN 397..."/>

          {/* Precios */}
          <div style={{gridColumn:'1/-1',fontSize:11,color:c.cyan,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',paddingBottom:4,borderBottom:`1px solid ${c.border}`,marginTop:8}}>Precios</div>
          <Field label="Precio costo ($)" value={form.cost_price} onChange={handleCostChange} type="number" placeholder="0"/>
          <Field label="Precio venta ($)" value={form.sale_price} onChange={handleSaleChange} type="number" placeholder="0"/>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <label style={{fontSize:10,color:c.sub,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em'}}>Margen calculado</label>
            <div style={{...inputStyle,color:+form.margin>0?c.lime:c.rose,fontWeight:700,cursor:'default'}}>
              {form.margin?`${form.margin}%`:'—'}
            </div>
          </div>
          <Field label="Moneda" value={form.currency} onChange={v=>setF('currency',v)} options={CURRENCIES}/>
          <Field label="Unidad" value={form.unit} onChange={v=>setF('unit',v)} options={UNITS}/>
          <Field label="Stock inicial" value={form.stock} onChange={v=>setF('stock',v)} type="number" placeholder="0"/>

          {/* Imagen */}
          <div style={{gridColumn:'1/-1',fontSize:11,color:c.cyan,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',paddingBottom:4,borderBottom:`1px solid ${c.border}`,marginTop:8}}>Imagen del producto</div>

          {/* Opción 1: URL directa o de página del producto */}
          <div style={{gridColumn:'1/-1'}}>
            <div style={{fontSize:10,color:c.sub,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.05em'}}>Opción A — Pegá la URL de la página o imagen del producto</div>
            <div style={{display:'flex',gap:8,marginBottom:10}}>
              <input value={imgUrlInput} onChange={e=>setImgUrlInput(e.target.value)}
                placeholder="https://sitio.com/producto/casco-3m  o  https://sitio.com/imagen.jpg"
                style={{...inputStyle,flex:1}}/>
              <button onClick={handleExtractFromUrl} disabled={!imgUrlInput||extractingImg}
                style={{padding:'8px 14px',borderRadius:8,border:'none',background:c.amber,color:'#000',cursor:'pointer',fontSize:12,fontWeight:700,whiteSpace:'nowrap',opacity:(!imgUrlInput||extractingImg)?0.5:1}}>
                {extractingImg?'⏳ Extrayendo...':'🔗 Extraer imagen'}
              </button>
            </div>
            <div style={{fontSize:10,color:c.muted,marginBottom:12}}>
              Si es la URL de la página del producto (Ej: mercadolibre, proseind, etc.) extrae la imagen automáticamente. Si es una URL directa de imagen (.jpg/.png) la usa directamente.
            </div>
          </div>

          {/* Opción 2: Buscar con IA */}
          <div style={{gridColumn:'1/-1'}}>
            <div style={{fontSize:10,color:c.sub,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.05em'}}>Opción B — Buscar imagen automáticamente con IA (requiere nombre del producto)</div>
            <button onClick={handleSearchImages} disabled={!form.name||searchingImg}
              style={{padding:'9px 20px',borderRadius:8,border:`1px solid ${c.violet}`,background:'rgba(124,58,237,0.1)',color:c.violet,cursor:'pointer',fontSize:13,fontWeight:600,opacity:(!form.name||searchingImg)?0.5:1}}>
              {searchingImg?'🔍 Buscando imágenes HD...':'🤖 Buscar imagen con IA'}
            </button>
          </div>

          {/* Preview imagen seleccionada */}
          {form.image_url && (
            <div style={{gridColumn:'1/-1',display:'flex',alignItems:'center',gap:12,padding:12,borderRadius:10,background:'rgba(255,255,255,0.03)',border:`1px solid ${c.lime}30`}}>
              <img src={form.image_url} alt="preview" style={{height:80,width:80,objectFit:'contain',borderRadius:8,background:'rgba(255,255,255,0.05)'}} onError={e=>e.target.style.display='none'}/>
              <div style={{flex:1}}>
                <div style={{fontSize:11,color:c.lime,marginBottom:4}}>✅ Imagen seleccionada</div>
                <div style={{fontSize:10,color:c.muted,wordBreak:'break-all'}}>{form.image_url.substring(0,80)}...</div>
                <button onClick={()=>setF('image_url','')} style={{marginTop:6,fontSize:10,color:c.rose,background:'none',border:`1px solid ${c.rose}30`,borderRadius:4,padding:'2px 8px',cursor:'pointer'}}>Quitar imagen</button>
              </div>
            </div>
          )}

          {/* O pegar URL directa de imagen */}
          <div style={{gridColumn:'1/-1'}}>
            <div style={{fontSize:10,color:c.sub,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.05em'}}>O pegá una URL directa de imagen</div>
            <input value={form.image_url||''} onChange={e=>setF('image_url',e.target.value)}
              placeholder="https://ejemplo.com/imagen-producto.jpg"
              style={inputStyle}/>
          </div>

          {/* Resultados búsqueda IA */}
          {imgResults.length>0 && (
            <div style={{gridColumn:'1/-1'}}>
              <div style={{fontSize:10,color:c.sub,marginBottom:8,textTransform:'uppercase'}}>Seleccioná la mejor imagen:</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:8}}>
                {imgResults.map((img,i)=>(
                  <div key={i} onClick={()=>{if(img.url)setF('image_url',img.url)}}
                    style={{cursor:'pointer',borderRadius:8,border:`2px solid ${form.image_url===img.url?c.cyan:c.border}`,overflow:'hidden',background:'rgba(255,255,255,0.04)',padding:6,transition:'all .2s'}}>
                    <img src={img.url} alt={img.source}
                      style={{width:'100%',height:60,objectFit:'contain'}}
                      onError={e=>{e.target.parentElement.style.opacity='0.3'}}/>
                    <div style={{fontSize:9,color:c.muted,marginTop:4,textAlign:'center',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{img.source}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Descripción y notas */}
          <div style={{gridColumn:'1/-1',fontSize:11,color:c.cyan,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',paddingBottom:4,borderBottom:`1px solid ${c.border}`,marginTop:8}}>Detalles adicionales</div>
          <div style={{gridColumn:'1/-1'}}>
            <label style={{fontSize:10,color:c.sub,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em',display:'block',marginBottom:4}}>Descripción completa</label>
            <textarea value={form.description||''} onChange={e=>setF('description',e.target.value)} rows={3}
              placeholder="Especificaciones técnicas, características, aplicaciones..."
              style={{...inputStyle,resize:'vertical'}}/>
          </div>
          <div style={{gridColumn:'1/-1'}}>
            <label style={{fontSize:10,color:c.sub,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em',display:'block',marginBottom:4}}>Notas internas</label>
            <textarea value={form.notes||''} onChange={e=>setF('notes',e.target.value)} rows={2}
              placeholder="Observaciones privadas..."
              style={{...inputStyle,resize:'vertical'}}/>
          </div>
        </div>

        <div style={{display:'flex',gap:8,justifyContent:'space-between'}}>
          <div/>
          <div style={{display:'flex',gap:8}}>
            <button onClick={onClose} style={{padding:'9px 18px',borderRadius:8,border:`1px solid ${c.border}`,background:'transparent',color:c.sub,cursor:'pointer',fontSize:13}}>Cancelar</button>
            <button onClick={save} disabled={saving||!form.name?.trim()}
              style={{padding:'9px 18px',borderRadius:8,border:'none',background:c.cyan,color:'#000',cursor:'pointer',fontSize:13,fontWeight:700,opacity:saving?0.6:1}}>
              {saving?'Guardando...':`💾 ${isEdit?'Guardar cambios':'Guardar producto'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MODAL CARGA IA ──
function ModalIA({ suppliers, onClose, onSaved }) {
  const [mode, setMode] = useState('pdf')
  const [input, setInput] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [extracted, setExtracted] = useState([])
  const [selected, setSelected] = useState([])
  const [saving, setSaving] = useState(false)

  const handleExtract = async () => {
    if (!input && !file) return
    setLoading(true)
    setExtracted([])
    setSelected([])
    try {
      let text = input
      let providerHint = ''

      if (file) {
        setProgress('Leyendo archivo...')
        text = await new Promise((res,rej) => {
          const reader = new FileReader()
          reader.onload = e => res(e.target.result)
          reader.onerror = rej
          reader.readAsText(file)
        })
      }

      if (mode==='sheets' && input.includes('docs.google.com')) {
        setProgress('Descargando Google Sheet...')
        const sheetId = input.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1]
        if (sheetId) {
          try {
            const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`
            const r = await fetch(csvUrl)
            text = await r.text()
          } catch { text = input }
        }
      }

      if (mode==='url' && input.startsWith('http')) {
        setProgress('Analizando página del proveedor...')
        providerHint = input
        try {
          const r = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(input)}`)
          const html = await r.text()
          const tmp = document.createElement('div')
          tmp.innerHTML = html
          text = tmp.innerText.substring(0,12000)
        } catch { text = `URL del proveedor: ${input}` }
      }

      setProgress('Extrayendo productos con IA...')
      const result = await callClaude([{
        role:'user',
        content:`Analizá este contenido y extraé TODOS los productos que encuentres.
Proveedor: ${providerHint||'desconocido'}

CONTENIDO:
${text.substring(0,12000)}

Devolvé SOLO JSON array sin texto ni markdown:
[{
  "name":"nombre del producto",
  "code":"código/SKU si existe o vacío",
  "brand":"marca si existe",
  "model":"modelo si existe",
  "short_desc":"descripción corta 1 línea",
  "cost_price":número o 0,
  "unit":"Unidad/Par/Caja/etc",
  "norm":"norma técnica si existe",
  "category":"EPP, Indumentaria laboral, Trabajo en altura, Seguridad vial, Contra incendios, Construcción, Herramientas, Protección ambiental, Primeros auxilios, o Tecnología",
  "image_url":"URL imagen si existe en el contenido o vacío"
}]`
      }],
      'Sos un extractor experto de catálogos industriales. Devolvés SOLO JSON válido sin markdown.',
      4000)

      const clean = result.replace(/```json|```/g,'').trim()
      const products = JSON.parse(clean)
      const withMargin = products.map((p,i)=>({
        ...p,
        _id:i,
        currency:'Pesos',
        status:'Activo',
        sale_price: p.cost_price ? Math.round(+p.cost_price*1.3) : 0,
        margin: p.cost_price ? '30.0' : '',
      }))
      setExtracted(withMargin)
      setSelected(withMargin.map((_,i)=>i))
      setProgress('')
    } catch(e) {
      setProgress(`❌ Error: ${e.message}. Intentá pegando el texto directamente.`)
    }
    setLoading(false)
  }

  const saveSelected = async () => {
    const toSave = extracted.filter((_,i)=>selected.includes(i))
    if (!toSave.length) return
    setSaving(true)
    for (const p of toSave) {
      const {_id,...payload} = p
      await supabase.from('products').insert(payload)
    }
    await onSaved()
    onClose()
    setSaving(false)
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:16}}>
      <div style={{background:'#0d0d1a',border:`1px solid ${c.border}`,borderRadius:16,padding:24,width:'100%',maxWidth:900,maxHeight:'93vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div style={{fontSize:16,fontWeight:700}}>🤖 Carga inteligente con IA</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:c.sub,cursor:'pointer',fontSize:22}}>×</button>
        </div>

        <div style={{display:'flex',gap:8,marginBottom:16}}>
          {[
            {key:'pdf',label:'📄 PDF / CSV / Texto'},
            {key:'sheets',label:'📊 Google Sheets'},
            {key:'url',label:'🌐 Sitio web'},
          ].map(m=>(
            <button key={m.key} onClick={()=>{setMode(m.key);setInput('');setFile(null);setExtracted([])}}
              style={{padding:'8px 16px',borderRadius:8,border:`1px solid ${mode===m.key?c.cyan:c.border}`,
              background:mode===m.key?'rgba(6,182,212,0.1)':'transparent',
              color:mode===m.key?c.cyan:c.sub,cursor:'pointer',fontSize:13,fontWeight:mode===m.key?600:400}}>
              {m.label}
            </button>
          ))}
        </div>

        {mode==='pdf' ? (
          <div style={{marginBottom:16}}>
            <div style={{border:`2px dashed ${file?c.lime:c.border}`,borderRadius:12,padding:24,textAlign:'center',marginBottom:10,cursor:'pointer'}}
              onClick={()=>document.getElementById('ia-file').click()}
              onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor=c.cyan}}
              onDragLeave={e=>e.currentTarget.style.borderColor=file?c.lime:c.border}
              onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f){setFile(f);setInput('')}}}>
              <div style={{fontSize:32,marginBottom:8}}>{file?'✅':'📄'}</div>
              <div style={{fontSize:14,color:c.sub}}>
                {file?file.name:'Arrastrá o hacé clic — PDF, CSV, TXT'}
              </div>
              <div style={{fontSize:11,color:c.muted,marginTop:4}}>Lista de precios, catálogo, planilla exportada</div>
              <input id="ia-file" type="file" accept=".pdf,.csv,.txt,.xlsx" onChange={e=>{setFile(e.target.files[0]);setInput('')}} style={{display:'none'}}/>
            </div>
            <div style={{fontSize:11,color:c.muted,textAlign:'center',marginBottom:6}}>— o pegá el texto del catálogo —</div>
            <textarea value={input} onChange={e=>setInput(e.target.value)} rows={5}
              placeholder="Pegá aquí el texto copiado del PDF, lista de precios o catálogo..."
              style={{...inputStyle,resize:'vertical'}}/>
          </div>
        ) : (
          <div style={{marginBottom:16}}>
            <input value={input} onChange={e=>setInput(e.target.value)}
              placeholder={mode==='sheets'
                ? 'https://docs.google.com/spreadsheets/d/ID_DEL_SHEET/...'
                : 'https://proveedor.com/catalogo o tienda'}
              style={{...inputStyle,marginBottom:6}}/>
            <div style={{fontSize:11,color:c.muted}}>
              {mode==='sheets'
                ? '💡 El Sheet debe ser público ("cualquiera con el link puede ver"). Columnas: Nombre, Código, Marca, Precio.'
                : '💡 Funciona mejor con tiendas simples con texto visible. Algunos sitios bloquean el acceso.'}
            </div>
          </div>
        )}

        <button onClick={handleExtract} disabled={loading||(!input&&!file)}
          style={{width:'100%',padding:'12px',borderRadius:10,border:'none',
          background:loading?c.muted:`linear-gradient(135deg,${c.cyan},${c.violet})`,
          color:'#fff',cursor:'pointer',fontSize:14,fontWeight:700,marginBottom:16,opacity:(!input&&!file)?0.5:1}}>
          {loading?`⏳ ${progress||'Procesando...'}`:'🚀 Extraer productos con IA'}
        </button>

        {extracted.length>0 && (
          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
              <div style={{fontSize:14,fontWeight:700,color:c.lime}}>✅ {extracted.length} productos detectados — {selected.length} seleccionados</div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>setSelected(extracted.map((_,i)=>i))}
                  style={{padding:'5px 12px',borderRadius:6,border:`1px solid ${c.lime}`,background:'transparent',color:c.lime,cursor:'pointer',fontSize:11}}>Todos</button>
                <button onClick={()=>setSelected([])}
                  style={{padding:'5px 12px',borderRadius:6,border:`1px solid ${c.border}`,background:'transparent',color:c.sub,cursor:'pointer',fontSize:11}}>Ninguno</button>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:16,maxHeight:380,overflowY:'auto',paddingRight:4}}>
              {extracted.map((p,i)=>(
                <div key={i} onClick={()=>setSelected(prev=>prev.includes(i)?prev.filter(x=>x!==i):[...prev,i])}
                  style={{padding:12,borderRadius:10,cursor:'pointer',transition:'all .2s',
                  border:`1px solid ${selected.includes(i)?c.cyan:c.border}`,
                  background:selected.includes(i)?'rgba(6,182,212,0.06)':'rgba(255,255,255,0.02)'}}>
                  {p.image_url && (
                    <img src={p.image_url} alt={p.name}
                      style={{width:'100%',height:55,objectFit:'contain',borderRadius:6,marginBottom:8,background:'rgba(255,255,255,0.05)'}}
                      onError={e=>e.target.style.display='none'}/>
                  )}
                  <div style={{fontSize:12,fontWeight:600,lineHeight:1.3,marginBottom:4,color:c.text}}>{p.name}</div>
                  {p.brand&&<div style={{fontSize:10,color:c.cyan,marginBottom:2}}>🏷️ {p.brand}</div>}
                  {p.category&&<div style={{fontSize:10,color:c.sub,marginBottom:2}}>📦 {p.category}</div>}
                  {p.cost_price>0&&<div style={{fontSize:11,fontWeight:700,color:c.amber}}>${(+p.cost_price).toLocaleString('es-AR')}</div>}
                  <div style={{fontSize:9,marginTop:4,textAlign:'right',color:selected.includes(i)?c.cyan:c.muted}}>
                    {selected.includes(i)?'✓ Seleccionado':'Clic para seleccionar'}
                  </div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',borderTop:`1px solid ${c.border}`,paddingTop:16}}>
              <button onClick={onClose} style={{padding:'9px 18px',borderRadius:8,border:`1px solid ${c.border}`,background:'transparent',color:c.sub,cursor:'pointer',fontSize:13}}>Cancelar</button>
              <button onClick={saveSelected} disabled={saving||!selected.length}
                style={{padding:'9px 18px',borderRadius:8,border:'none',background:c.lime,color:'#000',cursor:'pointer',fontSize:13,fontWeight:700,opacity:(!selected.length||saving)?0.5:1}}>
                {saving?'Guardando...':`💾 Guardar ${selected.length} productos`}
              </button>
            </div>
          </div>
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
  const [modal, setModal] = useState(null)
  const [editProduct, setEditProduct] = useState(null)
  const [detailProduct, setDetailProduct] = useState(null)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('Todas')
  const [filterSupplier, setFilterSupplier] = useState('Todos')

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

  const deleteProduct = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return
    await supabase.from('products').delete().eq('id',id)
    await loadAll()
    setDetailProduct(null)
  }

  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q || p.name?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q)
    const matchCat = filterCat==='Todas' || p.category?.includes(filterCat)
    const matchSupp = filterSupplier==='Todos' || p.supplier_name===filterSupplier
    return matchSearch && matchCat && matchSupp
  })

  return (
    <div>
      {/* HEADER */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
        <div>
          <h2 style={{margin:0,fontSize:20,fontWeight:800}}>⬆️ Carga de Productos</h2>
          <p style={{margin:'4px 0 0',color:c.sub,fontSize:13}}>{products.length} productos · {filtered.length} mostrando</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>setModal('ia')}
            style={{padding:'9px 18px',borderRadius:8,border:`1px solid ${c.violet}`,background:'rgba(124,58,237,0.1)',color:c.violet,cursor:'pointer',fontSize:13,fontWeight:600}}>
            🤖 Carga con IA
          </button>
          <button onClick={()=>{setEditProduct(null);setModal('form')}}
            style={{padding:'9px 18px',borderRadius:8,border:'none',background:c.cyan,color:'#000',cursor:'pointer',fontSize:13,fontWeight:700}}>
            ➕ Carga manual
          </button>
        </div>
      </div>

      {/* CARDS DE MÉTODOS — solo si no hay productos */}
      {products.length===0 && !loading && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:24}}>
          {[
            {icon:'➕',title:'Carga manual',desc:'Formulario completo con búsqueda de imágenes por IA.',color:c.cyan,action:()=>{setEditProduct(null);setModal('form')}},
            {icon:'📄',title:'PDF / CSV',desc:'Subí el catálogo o lista de precios y la IA extrae todo.',color:c.violet,action:()=>setModal('ia')},
            {icon:'📊',title:'Google Sheets / Web',desc:'URL del sheet o sitio del proveedor — la IA detecta los productos.',color:c.amber,action:()=>setModal('ia')},
          ].map((m,i)=>(
            <div key={i} onClick={m.action} style={{padding:20,borderRadius:14,border:`1px solid ${m.color}30`,background:`${m.color}07`,cursor:'pointer',transition:'all .2s'}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=m.color}
              onMouseLeave={e=>e.currentTarget.style.borderColor=`${m.color}30`}>
              <div style={{fontSize:28,marginBottom:10}}>{m.icon}</div>
              <div style={{fontSize:14,fontWeight:700,color:c.text,marginBottom:6}}>{m.title}</div>
              <div style={{fontSize:12,color:c.sub,lineHeight:1.5}}>{m.desc}</div>
              <div style={{marginTop:12,fontSize:12,color:m.color,fontWeight:600}}>Usar →</div>
            </div>
          ))}
        </div>
      )}

      {/* FILTROS */}
      {products.length>0 && (
        <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="🔍 Buscar nombre, marca, código..."
            style={{...inputStyle,flex:1,minWidth:180}}/>
          <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{...inputStyle,width:'auto'}}>
            <option value="Todas" style={{background:'#12121f'}}>Todas las categorías</option>
            {Object.keys(CATEGORIES).map(cat=><option key={cat} value={cat} style={{background:'#12121f'}}>{cat}</option>)}
          </select>
          <select value={filterSupplier} onChange={e=>setFilterSupplier(e.target.value)} style={{...inputStyle,width:'auto'}}>
            <option value="Todos" style={{background:'#12121f'}}>Todos los proveedores</option>
            {suppliers.map(s=><option key={s.id} value={s.name} style={{background:'#12121f'}}>{s.name}</option>)}
          </select>
        </div>
      )}

      {/* GRID */}
      {loading ? (
        <div style={{textAlign:'center',padding:'60px 0',color:c.cyan}}>
          <div style={{fontSize:32,marginBottom:8}}>⚡</div><div>Cargando...</div>
        </div>
      ) : filtered.length>0 ? (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))',gap:12}}>
          {filtered.map(p=>(
            <div key={p.id} style={{background:c.panel,border:`1px solid ${c.border}`,borderRadius:14,overflow:'hidden',transition:'all .2s',position:'relative'}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=c.cyan}
              onMouseLeave={e=>e.currentTarget.style.borderColor=c.border}>
              {/* Imagen */}
              <div style={{height:115,background:'rgba(255,255,255,0.04)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',cursor:'pointer'}}
                onClick={()=>setDetailProduct(p)}>
                {p.image_url
                  ?<img src={p.image_url} alt={p.name} style={{width:'100%',height:'100%',objectFit:'contain'}} onError={e=>e.target.style.display='none'}/>
                  :<div style={{fontSize:32,opacity:0.2}}>📦</div>
                }
              </div>
              {/* Info */}
              <div style={{padding:11,cursor:'pointer'}} onClick={()=>setDetailProduct(p)}>
                <div style={{fontSize:12,fontWeight:700,color:c.text,marginBottom:3,lineHeight:1.3,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{p.name}</div>
                {p.brand&&<div style={{fontSize:10,color:c.cyan,marginBottom:2}}>🏷️ {p.brand}</div>}
                {p.supplier_name&&<div style={{fontSize:10,color:c.sub,marginBottom:5}}>🏭 {p.supplier_name}</div>}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  {p.cost_price>0
                    ?<div style={{fontSize:13,fontWeight:700,color:c.amber}}>${(+p.cost_price).toLocaleString('es-AR')}</div>
                    :<div style={{fontSize:10,color:c.muted}}>Sin precio</div>
                  }
                  {p.margin>0&&<div style={{fontSize:10,color:c.lime}}>+{p.margin}%</div>}
                </div>
              </div>
              {/* Botón editar */}
              <button onClick={e=>{e.stopPropagation();setEditProduct(p);setModal('form')}}
                style={{position:'absolute',top:8,right:8,background:'rgba(7,7,15,0.85)',border:`1px solid ${c.border}`,borderRadius:6,color:c.sub,cursor:'pointer',fontSize:11,padding:'3px 7px',backdropFilter:'blur(4px)'}}>
                ✏️
              </button>
            </div>
          ))}
        </div>
      ) : products.length>0 ? (
        <div style={{textAlign:'center',padding:'40px 0',color:c.muted}}>Sin resultados para tu búsqueda</div>
      ) : null}

      {/* MODAL DETALLE */}
      {detailProduct && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:16}}>
          <div style={{background:'#0d0d1a',border:`1px solid ${c.border}`,borderRadius:16,padding:24,width:'100%',maxWidth:560,maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
              <div style={{fontSize:16,fontWeight:700}}>{detailProduct.name}</div>
              <button onClick={()=>setDetailProduct(null)} style={{background:'none',border:'none',color:c.sub,cursor:'pointer',fontSize:22}}>×</button>
            </div>
            {detailProduct.image_url&&(
              <img src={detailProduct.image_url} alt={detailProduct.name}
                style={{width:'100%',height:180,objectFit:'contain',borderRadius:10,background:'rgba(255,255,255,0.04)',marginBottom:16}}
                onError={e=>e.target.style.display='none'}/>
            )}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>
              {[
                {l:'Código',v:detailProduct.code},{l:'Marca',v:detailProduct.brand},
                {l:'Modelo',v:detailProduct.model},{l:'Categoría',v:detailProduct.category},
                {l:'Subcategoría',v:detailProduct.subcategory},{l:'Proveedor',v:detailProduct.supplier_name},
                {l:'Precio costo',v:detailProduct.cost_price?`$${(+detailProduct.cost_price).toLocaleString('es-AR')}`:null},
                {l:'Precio venta',v:detailProduct.sale_price?`$${(+detailProduct.sale_price).toLocaleString('es-AR')}`:null},
                {l:'Margen',v:detailProduct.margin?`${detailProduct.margin}%`:null},
                {l:'Unidad',v:detailProduct.unit},{l:'Stock',v:detailProduct.stock},{l:'Norma',v:detailProduct.norm},
              ].filter(f=>f.v).map((f,i)=>(
                <div key={i} style={{padding:'8px 10px',borderRadius:8,background:'rgba(255,255,255,0.03)',border:`1px solid ${c.border}`}}>
                  <div style={{fontSize:9,color:c.muted,textTransform:'uppercase',marginBottom:2}}>{f.l}</div>
                  <div style={{fontSize:13,color:c.text,fontWeight:500}}>{f.v}</div>
                </div>
              ))}
            </div>
            {detailProduct.description&&(
              <div style={{padding:12,borderRadius:8,background:'rgba(255,255,255,0.03)',border:`1px solid ${c.border}`,marginBottom:16}}>
                <div style={{fontSize:9,color:c.muted,textTransform:'uppercase',marginBottom:4}}>Descripción</div>
                <div style={{fontSize:13,color:c.sub,lineHeight:1.6}}>{detailProduct.description}</div>
              </div>
            )}
            <div style={{display:'flex',gap:8,justifyContent:'space-between'}}>
              <button onClick={()=>deleteProduct(detailProduct.id)}
                style={{padding:'8px 14px',borderRadius:8,border:`1px solid ${c.rose}`,background:'transparent',color:c.rose,cursor:'pointer',fontSize:12}}>🗑️ Eliminar</button>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>setDetailProduct(null)} style={{padding:'9px 18px',borderRadius:8,border:`1px solid ${c.border}`,background:'transparent',color:c.sub,cursor:'pointer',fontSize:13}}>Cerrar</button>
                <button onClick={()=>{setEditProduct(detailProduct);setDetailProduct(null);setModal('form')}}
                  style={{padding:'9px 18px',borderRadius:8,border:'none',background:c.cyan,color:'#000',cursor:'pointer',fontSize:13,fontWeight:700}}>✏️ Editar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modal==='form' && (
        <ModalForm
          suppliers={suppliers}
          initial={editProduct}
          onClose={()=>{setModal(null);setEditProduct(null)}}
          onSaved={loadAll}
        />
      )}
      {modal==='ia' && <ModalIA suppliers={suppliers} onClose={()=>setModal(null)} onSaved={loadAll}/>}
    </div>
  )
}
