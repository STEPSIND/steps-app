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
  background:'rgba(255,255,255,0.06)', border:`1px solid rgba(255,255,255,0.07)`,
  borderRadius:8, padding:'8px 10px', color:'#f1f5f9', fontSize:13,
  outline:'none', width:'100%', boxSizing:'border-box'
}

function Field({label, value, onChange, placeholder='', type='text', options, span}) {
  return (
    <div style={{display:'flex', flexDirection:'column', gap:4, gridColumn: span ? '1/-1' : undefined}}>
      <label style={{fontSize:10, color:'#94a3b8', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.05em'}}>{label}</label>
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
async function callClaude(messages, system, maxTokens = 2000) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system,
      messages,
    })
  })
  const data = await res.json()
  return data.content?.[0]?.text || ''
}

// ── MODAL CARGA MANUAL ──
function ModalManual({ suppliers, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [searchingImg, setSearchingImg] = useState(false)
  const [imgResults, setImgResults] = useState([])
  const setF = (k,v) => setForm(p=>({...p,[k]:v}))

  const subcats = form.category ? (CATEGORIES[form.category] || []) : []

  const calcMargin = (cost, sale) => {
    if (!cost || !sale || +cost === 0) return ''
    return (((+sale - +cost) / +cost) * 100).toFixed(1)
  }

  const handleCostChange = (v) => {
    setForm(p=>({...p, cost_price:v, margin: calcMargin(v, p.sale_price)}))
  }
  const handleSaleChange = (v) => {
    setForm(p=>({...p, sale_price:v, margin: calcMargin(p.cost_price, v)}))
  }

  // Buscar imagen con IA
  const searchImage = async () => {
    if (!form.name) return
    setSearchingImg(true)
    setImgResults([])
    try {
      const query = `${form.brand || ''} ${form.name} ${form.model || ''}`.trim()
      const text = await callClaude([{
        role:'user',
        content:`Necesito imágenes de alta calidad para el producto: "${query}".
Buscá en Google Images, Bing Images y sitios de fabricantes/distribuidores industriales las mejores 4 imágenes en HD.
Devolvé SOLO un JSON array con exactamente 4 objetos, sin texto extra:
[{"url":"...","source":"...","desc":"..."},...]
Las URLs deben ser directas a imágenes JPG/PNG/WEBP de alta resolución.
Priorizá imágenes de fabricantes oficiales, distribuidores industriales o e-commerce B2B.`
      }],
      'Sos un asistente especializado en búsqueda de imágenes de productos industriales y de seguridad. Devolvés SOLO JSON válido, sin markdown ni texto adicional.',
      1000)

      const clean = text.replace(/```json|```/g,'').trim()
      const parsed = JSON.parse(clean)
      setImgResults(parsed)
    } catch(e) {
      // Si falla, sugerir URLs de búsqueda
      const q = encodeURIComponent(`${form.brand||''} ${form.name}`)
      setImgResults([
        {url:`https://images.google.com/search?q=${q}&tbm=isch`, source:'Google Images', desc:'Buscar en Google'},
      ])
    }
    setSearchingImg(false)
  }

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const payload = {...form}
    delete payload.id
    const {error} = await supabase.from('products').insert(payload)
    if (!error) { onSaved(); onClose() }
    setSaving(false)
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:16}}>
      <div style={{background:'#0d0d1a',border:`1px solid ${c.border}`,borderRadius:16,padding:24,width:'100%',maxWidth:760,maxHeight:'93vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div style={{fontSize:16,fontWeight:700}}>➕ Nuevo producto manual</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:c.sub,cursor:'pointer',fontSize:22}}>×</button>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
          {/* Sección identificación */}
          <div style={{gridColumn:'1/-1',fontSize:11,color:c.cyan,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',paddingBottom:4,borderBottom:`1px solid ${c.border}`}}>Identificación</div>
          <div style={{gridColumn:'1/-1'}}><Field label="Nombre del producto *" value={form.name} onChange={v=>setF('name',v)} placeholder="Ej: Casco de seguridad clase A"/></div>
          <Field label="Código" value={form.code} onChange={v=>setF('code',v)} placeholder="SKU o código interno"/>
          <Field label="Marca" value={form.brand} onChange={v=>setF('brand',v)} placeholder="Ej: 3M, MSA, Libus..."/>
          <Field label="Modelo" value={form.model} onChange={v=>setF('model',v)} placeholder="Número de modelo"/>
          <div style={{gridColumn:'1/-1'}}>
            <Field label="Descripción corta" value={form.short_desc} onChange={v=>setF('short_desc',v)} placeholder="Una línea descriptiva del producto"/>
          </div>

          {/* Sección clasificación */}
          <div style={{gridColumn:'1/-1',fontSize:11,color:c.cyan,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',paddingBottom:4,borderBottom:`1px solid ${c.border}`,marginTop:8}}>Clasificación</div>
          <Field label="Categoría" value={form.category} onChange={v=>{setF('category',v);setF('subcategory','')}}
            options={['Seleccionar',...Object.keys(CATEGORIES)]}/>
          <Field label="Subcategoría" value={form.subcategory} onChange={v=>setF('subcategory',v)}
            options={['Seleccionar',...subcats]}/>
          <Field label="Proveedor" value={form.supplier_id} onChange={v=>{
            const s = suppliers.find(x=>x.id===v)
            setF('supplier_id',v)
            setF('supplier_name',s?.name||'')
          }} options={['','...', ...suppliers.map(s=>s.id)].map ? 
            [''].concat(suppliers.map(s=>s.id)) : ['']}
          />
          {/* Select de proveedor custom */}
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <label style={{fontSize:10,color:c.sub,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em'}}>Proveedor</label>
            <select value={form.supplier_id||''} onChange={e=>{
              const s = suppliers.find(x=>x.id===e.target.value)
              setF('supplier_id',e.target.value)
              setF('supplier_name',s?.name||'')
            }} style={inputStyle}>
              <option value="" style={{background:'#12121f'}}>Sin proveedor</option>
              {suppliers.map(s=><option key={s.id} value={s.id} style={{background:'#12121f'}}>{s.name}</option>)}
            </select>
          </div>
          <Field label="Norma técnica / Certificación" value={form.norm} onChange={v=>setF('norm',v)} placeholder="Ej: IRAM 3620, EN 397..."/>

          {/* Sección precios */}
          <div style={{gridColumn:'1/-1',fontSize:11,color:c.cyan,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',paddingBottom:4,borderBottom:`1px solid ${c.border}`,marginTop:8}}>Precios</div>
          <Field label="Precio costo ($)" value={form.cost_price} onChange={handleCostChange} type="number" placeholder="0"/>
          <Field label="Precio venta ($)" value={form.sale_price} onChange={handleSaleChange} type="number" placeholder="0"/>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <label style={{fontSize:10,color:c.sub,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em'}}>Margen</label>
            <div style={{...inputStyle, color: +form.margin > 0 ? c.lime : c.rose, fontWeight:700}}>
              {form.margin ? `${form.margin}%` : '—'}
            </div>
          </div>
          <Field label="Moneda" value={form.currency} onChange={v=>setF('currency',v)} options={CURRENCIES}/>
          <Field label="Unidad" value={form.unit} onChange={v=>setF('unit',v)} options={UNITS}/>
          <Field label="Stock inicial" value={form.stock} onChange={v=>setF('stock',v)} type="number" placeholder="0"/>

          {/* Sección imagen */}
          <div style={{gridColumn:'1/-1',fontSize:11,color:c.cyan,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',paddingBottom:4,borderBottom:`1px solid ${c.border}`,marginTop:8}}>Imagen del producto</div>
          <div style={{gridColumn:'1/-1'}}>
            <div style={{display:'flex',gap:8,marginBottom:10}}>
              <input value={form.image_url||''} onChange={e=>setF('image_url',e.target.value)}
                placeholder="URL de imagen o buscá automáticamente abajo..."
                style={{...inputStyle,flex:1}}/>
              <button onClick={searchImage} disabled={!form.name||searchingImg}
                style={{padding:'8px 16px',borderRadius:8,border:'none',background:c.violet,color:'#fff',cursor:'pointer',fontSize:12,fontWeight:600,whiteSpace:'nowrap',opacity:(!form.name||searchingImg)?0.5:1}}>
                {searchingImg ? '🔍 Buscando...' : '🤖 Buscar imagen IA'}
              </button>
            </div>

            {/* Preview imagen actual */}
            {form.image_url && (
              <div style={{marginBottom:10}}>
                <img src={form.image_url} alt="preview"
                  style={{height:100,borderRadius:8,border:`1px solid ${c.border}`,objectFit:'contain',background:'rgba(255,255,255,0.05)'}}
                  onError={e=>e.target.style.display='none'}/>
              </div>
            )}

            {/* Resultados de búsqueda */}
            {imgResults.length > 0 && (
              <div>
                <div style={{fontSize:10,color:c.sub,marginBottom:8,textTransform:'uppercase'}}>Seleccioná la mejor imagen:</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
                  {imgResults.map((img,i)=>(
                    <div key={i} onClick={()=>setF('image_url',img.url)}
                      style={{cursor:'pointer',borderRadius:8,border:`2px solid ${form.image_url===img.url?c.cyan:c.border}`,overflow:'hidden',background:'rgba(255,255,255,0.04)',padding:6,transition:'all .2s'}}>
                      <img src={img.url} alt={img.desc}
                        style={{width:'100%',height:70,objectFit:'contain'}}
                        onError={e=>{e.target.src='';e.target.parentElement.style.display='none'}}/>
                      <div style={{fontSize:9,color:c.muted,marginTop:4,textAlign:'center'}}>{img.source}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Descripción larga y notas */}
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

        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button onClick={onClose} style={{padding:'9px 18px',borderRadius:8,border:`1px solid ${c.border}`,background:'transparent',color:c.sub,cursor:'pointer',fontSize:13}}>Cancelar</button>
          <button onClick={save} disabled={saving||!form.name.trim()} style={{padding:'9px 18px',borderRadius:8,border:'none',background:c.cyan,color:'#000',cursor:'pointer',fontSize:13,fontWeight:700,opacity:saving?0.6:1}}>
            {saving ? 'Guardando...' : '💾 Guardar producto'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── MODAL CARGA IA (PDF / Google Sheets / URL) ──
function ModalIA({ suppliers, onClose, onSaved }) {
  const [mode, setMode] = useState('pdf') // pdf | sheets | url
  const [input, setInput] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [extracted, setExtracted] = useState([])
  const [selected, setSelected] = useState([])
  const [saving, setSaving] = useState(false)

  const modeConfig = {
    pdf:    { label:'📄 PDF / Catálogo', placeholder:'O pegá el texto del PDF acá...', icon:'📄' },
    sheets: { label:'📊 Google Sheets', placeholder:'URL del Google Sheet (debe ser público o con permisos)...', icon:'📊' },
    url:    { label:'🌐 Sitio web / Tienda', placeholder:'URL de la tienda o página de productos del proveedor...', icon:'🌐' },
  }

  const extractFromText = async (text, providerHint='') => {
    setProgress('Analizando contenido con IA...')
    const prompt = `Analizá este contenido y extraé TODOS los productos que encuentres.
Proveedor detectado: ${providerHint || 'desconocido'}

CONTENIDO:
${text.substring(0, 12000)}

Devolvé SOLO un JSON array sin texto extra ni markdown:
[{
  "name": "nombre del producto",
  "code": "código o SKU si existe",
  "brand": "marca",
  "model": "modelo si existe",
  "short_desc": "descripción corta 1 línea",
  "cost_price": número o 0,
  "unit": "Unidad/Par/Caja/etc",
  "norm": "norma técnica si existe",
  "category": "categoría más apropiada de esta lista: EPP, Indumentaria laboral, Trabajo en altura, Seguridad vial, Contra incendios, Construcción, Herramientas, Protección ambiental, Primeros auxilios, Tecnología",
  "image_url": "URL de imagen si existe en el contenido"
}]
Extraé todos los productos que puedas identificar. Si hay precios, ponelos en cost_price.`

    const result = await callClaude(
      [{role:'user', content: prompt}],
      'Sos un extractor experto de catálogos de productos industriales y de seguridad. Devolvés SOLO JSON válido, sin markdown.',
      4000
    )
    const clean = result.replace(/```json|```/g,'').trim()
    return JSON.parse(clean)
  }

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
        text = await new Promise((res, rej) => {
          const reader = new FileReader()
          reader.onload = e => res(e.target.result)
          reader.onerror = rej
          reader.readAsText(file)
        })
      }

      if (mode === 'sheets' && input.includes('docs.google.com')) {
        setProgress('Descargando Google Sheet...')
        const sheetId = input.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1]
        if (sheetId) {
          const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`
          try {
            const r = await fetch(csvUrl)
            text = await r.text()
          } catch { text = input }
        }
      }

      if (mode === 'url' && input.startsWith('http')) {
        setProgress('Analizando URL del proveedor...')
        providerHint = input
        const r = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(input)}`)
        const html = await r.text()
        const tmp = document.createElement('div')
        tmp.innerHTML = html
        text = tmp.innerText.substring(0, 12000)
      }

      const products = await extractFromText(text, providerHint)
      setExtracted(products.map((p,i) => ({...p, _id: i, currency:'Pesos', status:'Activo', sale_price: p.cost_price ? (+p.cost_price * 1.3).toFixed(0) : 0})))
      setSelected(products.map((_,i) => i))
      setProgress('')
    } catch(e) {
      setProgress('❌ Error al procesar. Verificá el formato o intentá con texto pegado.')
    }
    setLoading(false)
  }

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setInput('')
  }

  const toggleSelect = (i) => {
    setSelected(prev => prev.includes(i) ? prev.filter(x=>x!==i) : [...prev, i])
  }

  const saveSelected = async () => {
    const toSave = extracted.filter((_,i) => selected.includes(i))
    if (!toSave.length) return
    setSaving(true)
    for (const p of toSave) {
      const { _id, ...payload } = p
      await supabase.from('products').insert(payload)
    }
    onSaved()
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

        {/* Selector de modo */}
        <div style={{display:'flex',gap:8,marginBottom:16}}>
          {Object.entries(modeConfig).map(([key,cfg])=>(
            <button key={key} onClick={()=>{setMode(key);setInput('');setFile(null);setExtracted([])}}
              style={{padding:'8px 16px',borderRadius:8,border:`1px solid ${mode===key?c.cyan:c.border}`,
              background:mode===key?'rgba(6,182,212,0.1)':'transparent',
              color:mode===key?c.cyan:c.sub,cursor:'pointer',fontSize:13,fontWeight:mode===key?600:400,transition:'all .2s'}}>
              {cfg.label}
            </button>
          ))}
        </div>

        {/* Input según modo */}
        {mode === 'pdf' ? (
          <div style={{marginBottom:16}}>
            <div style={{border:`2px dashed ${c.border}`,borderRadius:12,padding:24,textAlign:'center',marginBottom:10,cursor:'pointer',transition:'all .2s'}}
              onClick={()=>document.getElementById('file-input').click()}
              onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor=c.cyan}}
              onDragLeave={e=>e.currentTarget.style.borderColor=c.border}
              onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f){setFile(f);setInput('')}}}>
              <div style={{fontSize:32,marginBottom:8}}>📄</div>
              <div style={{fontSize:14,color:c.sub,marginBottom:4}}>
                {file ? `✅ ${file.name}` : 'Arrastrá o hacé clic para subir PDF, CSV o TXT'}
              </div>
              <div style={{fontSize:11,color:c.muted}}>PDF de lista de precios, catálogo, CSV exportado, etc.</div>
              <input id="file-input" type="file" accept=".pdf,.csv,.txt,.xlsx" onChange={handleFileChange} style={{display:'none'}}/>
            </div>
            <div style={{fontSize:11,color:c.muted,marginBottom:6,textAlign:'center'}}>— o pegá el texto del catálogo directamente —</div>
            <textarea value={input} onChange={e=>setInput(e.target.value)} rows={4}
              placeholder="Pegá aquí el texto copiado del PDF o lista de precios..."
              style={{...inputStyle,resize:'vertical'}}/>
          </div>
        ) : (
          <div style={{marginBottom:16}}>
            <input value={input} onChange={e=>setInput(e.target.value)}
              placeholder={modeConfig[mode].placeholder}
              style={{...inputStyle,marginBottom:8}}/>
            {mode === 'sheets' && (
              <div style={{fontSize:11,color:c.muted}}>
                💡 El Sheet debe estar compartido como "Cualquiera con el link puede ver". Columnas sugeridas: Nombre, Código, Marca, Precio.
              </div>
            )}
            {mode === 'url' && (
              <div style={{fontSize:11,color:c.muted}}>
                💡 Funciona mejor con tiendas simples. Algunos sitios bloquean el acceso automático.
              </div>
            )}
          </div>
        )}

        <button onClick={handleExtract} disabled={loading||(!input&&!file)}
          style={{width:'100%',padding:'12px',borderRadius:10,border:'none',
          background:loading?c.muted:`linear-gradient(135deg,${c.cyan},${c.violet})`,
          color:'#fff',cursor:'pointer',fontSize:14,fontWeight:700,marginBottom:16,
          opacity:(!input&&!file)?0.5:1}}>
          {loading ? `⏳ ${progress || 'Procesando...'}` : '🚀 Extraer productos con IA'}
        </button>

        {/* Resultados extraídos */}
        {extracted.length > 0 && (
          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
              <div style={{fontSize:14,fontWeight:700,color:c.lime}}>✅ {extracted.length} productos detectados</div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>setSelected(extracted.map((_,i)=>i))}
                  style={{padding:'5px 12px',borderRadius:6,border:`1px solid ${c.lime}`,background:'transparent',color:c.lime,cursor:'pointer',fontSize:11}}>
                  Seleccionar todos
                </button>
                <button onClick={()=>setSelected([])}
                  style={{padding:'5px 12px',borderRadius:6,border:`1px solid ${c.border}`,background:'transparent',color:c.sub,cursor:'pointer',fontSize:11}}>
                  Deseleccionar
                </button>
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:16,maxHeight:380,overflowY:'auto'}}>
              {extracted.map((p,i)=>(
                <div key={i} onClick={()=>toggleSelect(i)} style={{
                  padding:12, borderRadius:10, cursor:'pointer', transition:'all .2s',
                  border:`1px solid ${selected.includes(i)?c.cyan:c.border}`,
                  background:selected.includes(i)?'rgba(6,182,212,0.06)':'rgba(255,255,255,0.02)',
                }}>
                  {p.image_url && (
                    <img src={p.image_url} alt={p.name} style={{width:'100%',height:60,objectFit:'contain',borderRadius:6,marginBottom:8,background:'rgba(255,255,255,0.05)'}}
                      onError={e=>e.target.style.display='none'}/>
                  )}
                  <div style={{fontSize:12,fontWeight:600,color:c.text,marginBottom:4,lineHeight:1.3}}>{p.name}</div>
                  {p.brand && <div style={{fontSize:10,color:c.cyan,marginBottom:2}}>🏷️ {p.brand}</div>}
                  {p.category && <div style={{fontSize:10,color:c.sub,marginBottom:2}}>📦 {p.category}</div>}
                  {p.cost_price > 0 && <div style={{fontSize:11,fontWeight:700,color:c.amber}}>${(+p.cost_price).toLocaleString('es-AR')}</div>}
                  <div style={{fontSize:9,marginTop:4,color:selected.includes(i)?c.cyan:c.muted,textAlign:'right'}}>
                    {selected.includes(i)?'✓ Seleccionado':'Clic para seleccionar'}
                  </div>
                </div>
              ))}
            </div>

            <div style={{display:'flex',gap:8,justifyContent:'flex-end',borderTop:`1px solid ${c.border}`,paddingTop:16}}>
              <button onClick={onClose} style={{padding:'9px 18px',borderRadius:8,border:`1px solid ${c.border}`,background:'transparent',color:c.sub,cursor:'pointer',fontSize:13}}>Cancelar</button>
              <button onClick={saveSelected} disabled={saving||!selected.length}
                style={{padding:'9px 18px',borderRadius:8,border:'none',background:c.lime,color:'#000',cursor:'pointer',fontSize:13,fontWeight:700,opacity:(!selected.length||saving)?0.5:1}}>
                {saving ? 'Guardando...' : `💾 Guardar ${selected.length} productos`}
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
  const [modal, setModal] = useState(null) // 'manual' | 'ia' | 'detail'
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('Todas')
  const [filterSupplier, setFilterSupplier] = useState('Todos')

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    const [{ data: prods }, { data: supps }] = await Promise.all([
      supabase.from('products').select('*').order('created_at', {ascending:false}),
      supabase.from('suppliers').select('id,name').order('name')
    ])
    setProducts(prods || [])
    setSuppliers(supps || [])
    setLoading(false)
  }

  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q || p.name?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q)
    const matchCat = filterCat === 'Todas' || p.category?.includes(filterCat.split(' ')[1] || filterCat)
    const matchSupp = filterSupplier === 'Todos' || p.supplier_name === filterSupplier
    return matchSearch && matchCat && matchSupp
  })

  const catNames = ['Todas', ...Object.keys(CATEGORIES).map(k => k.split(' ').slice(1).join(' '))]

  return (
    <div>
      {/* HEADER */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
        <div>
          <h2 style={{margin:0,fontSize:20,fontWeight:800}}>⬆️ Carga de Productos</h2>
          <p style={{margin:'4px 0 0',color:c.sub,fontSize:13}}>{products.length} productos cargados</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>setModal('ia')}
            style={{padding:'9px 18px',borderRadius:8,border:`1px solid ${c.violet}`,background:'rgba(124,58,237,0.1)',color:c.violet,cursor:'pointer',fontSize:13,fontWeight:600}}>
            🤖 Carga con IA
          </button>
          <button onClick={()=>setModal('manual')}
            style={{padding:'9px 18px',borderRadius:8,border:'none',background:c.cyan,color:'#000',cursor:'pointer',fontSize:13,fontWeight:700}}>
            ➕ Carga manual
          </button>
        </div>
      </div>

      {/* MÉTODOS — cards informativas */}
      {products.length === 0 && !loading && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:24}}>
          {[
            {icon:'➕', title:'Carga manual', desc:'Completá el formulario producto por producto. Con búsqueda automática de imágenes por IA.', color:c.cyan, action:()=>setModal('manual')},
            {icon:'📄', title:'PDF / Catálogo', desc:'Subí el PDF o CSV de tu proveedor y la IA extrae todos los productos automáticamente.', color:c.violet, action:()=>setModal('ia')},
            {icon:'📊', title:'Google Sheets / Web', desc:'Pegá la URL del Sheet o sitio web del proveedor y la IA detecta productos y precios.', color:c.amber, action:()=>setModal('ia')},
          ].map((m,i)=>(
            <div key={i} onClick={m.action} style={{
              padding:20, borderRadius:14, border:`1px solid ${m.color}30`,
              background:`${m.color}07`, cursor:'pointer', transition:'all .2s',
            }}
            onMouseEnter={e=>e.currentTarget.style.borderColor=m.color}
            onMouseLeave={e=>e.currentTarget.style.borderColor=`${m.color}30`}>
              <div style={{fontSize:28,marginBottom:10}}>{m.icon}</div>
              <div style={{fontSize:14,fontWeight:700,color:c.text,marginBottom:6}}>{m.title}</div>
              <div style={{fontSize:12,color:c.sub,lineHeight:1.5}}>{m.desc}</div>
              <div style={{marginTop:12,fontSize:12,color:m.color,fontWeight:600}}>Usar este método →</div>
            </div>
          ))}
        </div>
      )}

      {/* FILTROS */}
      {products.length > 0 && (
        <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="🔍 Buscar por nombre, marca, código..."
            style={{...inputStyle,flex:1,minWidth:200}}/>
          <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{...inputStyle,width:'auto'}}>
            {catNames.map(c2=><option key={c2} value={c2} style={{background:'#12121f'}}>{c2}</option>)}
          </select>
          <select value={filterSupplier} onChange={e=>setFilterSupplier(e.target.value)} style={{...inputStyle,width:'auto'}}>
            <option value="Todos" style={{background:'#12121f'}}>Todos los proveedores</option>
            {suppliers.map(s=><option key={s.id} value={s.name} style={{background:'#12121f'}}>{s.name}</option>)}
          </select>
        </div>
      )}

      {/* GRID DE PRODUCTOS */}
      {loading ? (
        <div style={{textAlign:'center',padding:'60px 0',color:c.cyan}}>
          <div style={{fontSize:32,marginBottom:8}}>⚡</div>
          <div>Cargando productos...</div>
        </div>
      ) : filtered.length === 0 && products.length > 0 ? (
        <div style={{textAlign:'center',padding:'40px 0',color:c.muted}}>Sin resultados para tu búsqueda</div>
      ) : filtered.length > 0 ? (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12}}>
          {filtered.map(p => (
            <div key={p.id} onClick={()=>{setSelected(p);setModal('detail')}}
              style={{background:c.panel,border:`1px solid ${c.border}`,borderRadius:14,overflow:'hidden',cursor:'pointer',transition:'all .2s'}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=c.cyan}
              onMouseLeave={e=>e.currentTarget.style.borderColor=c.border}>
              {/* Imagen */}
              <div style={{height:120,background:'rgba(255,255,255,0.04)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                {p.image_url
                  ? <img src={p.image_url} alt={p.name} style={{width:'100%',height:'100%',objectFit:'contain'}} onError={e=>{e.target.style.display='none'}}/>
                  : <div style={{fontSize:32,opacity:0.3}}>📦</div>
                }
              </div>
              {/* Info */}
              <div style={{padding:12}}>
                <div style={{fontSize:12,fontWeight:700,color:c.text,marginBottom:4,lineHeight:1.3,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{p.name}</div>
                {p.brand && <div style={{fontSize:10,color:c.cyan,marginBottom:3}}>🏷️ {p.brand}</div>}
                {p.supplier_name && <div style={{fontSize:10,color:c.sub,marginBottom:6}}>🏭 {p.supplier_name}</div>}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
                  {p.cost_price > 0
                    ? <div style={{fontSize:13,fontWeight:700,color:c.amber}}>${(+p.cost_price).toLocaleString('es-AR')}</div>
                    : <div style={{fontSize:10,color:c.muted}}>Sin precio</div>
                  }
                  {p.margin > 0 && <div style={{fontSize:10,color:c.lime}}>+{p.margin}%</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* MODAL DETALLE */}
      {modal === 'detail' && selected && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:16}}>
          <div style={{background:'#0d0d1a',border:`1px solid ${c.border}`,borderRadius:16,padding:24,width:'100%',maxWidth:560,maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
              <div style={{fontSize:16,fontWeight:700}}>{selected.name}</div>
              <button onClick={()=>setModal(null)} style={{background:'none',border:'none',color:c.sub,cursor:'pointer',fontSize:22}}>×</button>
            </div>
            {selected.image_url && (
              <img src={selected.image_url} alt={selected.name}
                style={{width:'100%',height:180,objectFit:'contain',borderRadius:10,background:'rgba(255,255,255,0.04)',marginBottom:16}}
                onError={e=>e.target.style.display='none'}/>
            )}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>
              {[
                {l:'Código',v:selected.code},{l:'Marca',v:selected.brand},
                {l:'Modelo',v:selected.model},{l:'Categoría',v:selected.category},
                {l:'Subcategoría',v:selected.subcategory},{l:'Proveedor',v:selected.supplier_name},
                {l:'Precio costo',v:selected.cost_price?`$${(+selected.cost_price).toLocaleString('es-AR')}`:null},
                {l:'Precio venta',v:selected.sale_price?`$${(+selected.sale_price).toLocaleString('es-AR')}`:null},
                {l:'Margen',v:selected.margin?`${selected.margin}%`:null},
                {l:'Unidad',v:selected.unit},{l:'Stock',v:selected.stock},{l:'Norma',v:selected.norm},
              ].filter(f=>f.v).map((f,i)=>(
                <div key={i} style={{padding:'8px 10px',borderRadius:8,background:'rgba(255,255,255,0.03)',border:`1px solid ${c.border}`}}>
                  <div style={{fontSize:9,color:c.muted,textTransform:'uppercase',marginBottom:2}}>{f.l}</div>
                  <div style={{fontSize:13,color:c.text,fontWeight:500}}>{f.v}</div>
                </div>
              ))}
            </div>
            {selected.description && (
              <div style={{padding:12,borderRadius:8,background:'rgba(255,255,255,0.03)',border:`1px solid ${c.border}`,marginBottom:16}}>
                <div style={{fontSize:9,color:c.muted,textTransform:'uppercase',marginBottom:4}}>Descripción</div>
                <div style={{fontSize:13,color:c.sub,lineHeight:1.6}}>{selected.description}</div>
              </div>
            )}
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button onClick={async()=>{if(confirm('¿Eliminar este producto?')){await supabase.from('products').delete().eq('id',selected.id);loadAll();setModal(null)}}}
                style={{padding:'8px 14px',borderRadius:8,border:`1px solid ${c.rose}`,background:'transparent',color:c.rose,cursor:'pointer',fontSize:12}}>🗑️</button>
              <button onClick={()=>setModal(null)} style={{padding:'9px 18px',borderRadius:8,border:`1px solid ${c.border}`,background:'transparent',color:c.sub,cursor:'pointer',fontSize:13}}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'manual' && <ModalManual suppliers={suppliers} onClose={()=>setModal(null)} onSaved={loadAll}/>}
      {modal === 'ia' && <ModalIA suppliers={suppliers} onClose={()=>setModal(null)} onSaved={loadAll}/>}
    </div>
  )
}
