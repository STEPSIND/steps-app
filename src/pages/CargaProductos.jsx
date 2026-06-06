import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'

const c = {
  bg:'#07070f', border:'rgba(255,255,255,0.07)', panel:'rgba(255,255,255,0.035)',
  cyan:'#06b6d4', violet:'#7c3aed', lime:'#84cc16', amber:'#f59e0b', rose:'#f43f5e',
  text:'#f1f5f9', muted:'#475569', sub:'#94a3b8'
}

const CATEGORY_META = {
  '🦺 EPP — Protección personal':          { short:'EPP',          aura:'#06b6d4' },
  '👕 Indumentaria laboral':                { short:'Indumentaria',  aura:'#7c3aed' },
  '👟 Calzado de seguridad':               { short:'Calzado',       aura:'#f59e0b' },
  '🧗 Trabajo en altura':                  { short:'Altura',        aura:'#ef4444' },
  '🚧 Seguridad vial y señalización':      { short:'Señalización',  aura:'#eab308' },
  '🔥 Contra incendios':                   { short:'Incendios',     aura:'#f97316' },
  '🌱 Protección ambiental':               { short:'Ambiental',     aura:'#84cc16' },
  '🔧 Herramientas y equipamiento':        { short:'Herramientas',  aura:'#6366f1' },
  '🏗️ Construcción y materiales':          { short:'Construcción',  aura:'#f97316' },
  '🏠 Flipping house / Home & Deco':       { short:'Home & Deco',   aura:'#ec4899' },
  '🚗 Equipamiento vehicular':             { short:'Vehicular',     aura:'#06b6d4' },
  '💡 Tecnología e innovación':            { short:'Tecnología',    aura:'#8b5cf6' },
  '📦 Abastecimiento integral':            { short:'Abastecimiento',aura:'#14b8a6' },
}

const CATEGORIES = {
  '🦺 EPP — Protección personal':          ['Protección craneana','Protección ocular','Protección auditiva','Protección respiratoria','Protección de manos','Protección facial','Calzado de seguridad EPP','Protección corporal','Detección de gases','Protección dieléctrica'],
  '👕 Indumentaria laboral':               ['Ropa de trabajo clásica','Ignífuga / retardante','Alta visibilidad / reflectiva','Ropa de abrigo / invierno','Impermeable / lluvia','Descartable','Antiácida / química','Aluminizada','Jean laboral','Mamelucos y overoles','Camisas de trabajo','Pantalones cargo','Chalecos laborales','Buzos y camperas'],
  '👟 Calzado de seguridad':              ['Botín puntera acero','Borceguí puntera acero','Bota industrial','Zapatilla de seguridad','Zapato de seguridad','Bota de goma','Calzado dieléctrico','Calzado resistente HC','Calzado food grade','Calzado antideslizante'],
  '🧗 Trabajo en altura':                 ['Arneses 3 puntos','Arneses 4 puntos','Líneas de vida','Cabos de amarre simples','Cabos de amarre doble Y','Retráctiles / SRL','Anclajes','Eslingas','Cinturón liniero','Kits anticaída','Espacio confinado','Accesorios altura'],
  '🚧 Seguridad vial y señalización':     ['Conos de tránsito','Balizas y delineadores','Vallas metálicas','Carteles de señalización','Cintas de peligro','Cerca perimetral','Chalecos y bandoleras viales','Bloqueo / Lockout-Tagout','Etiquetas de seguridad','Señales fotoluminiscentes'],
  '🔥 Contra incendios':                  ['Matafuegos ABC polvo','Matafuegos CO2','Matafuegos agua','Extintores especiales','Mangueras y accesorios CI','Detectores de humo','Detectores de calor','Gabinetes CI','Rociadores','Trajes ignífugos CI','Señalización CI'],
  '🌱 Protección ambiental':              ['Absorbentes granulados','Paños absorbentes','Kits de contingencia','Barreras de contención','Pallets de retención','Contenedores residuos peligrosos','Bobinas jumbo'],
  '🔧 Herramientas y equipamiento':       ['Herramientas manuales','Herramientas eléctricas','Herramientas neumáticas','Equipos de medición','Equipos de corte','Equipos de izaje','Cadenas y fajas','Iluminación portátil','Escaleras y andamios','Porta herramientas'],
  '🏗️ Construcción y materiales':         ['Placas y paneles','Perfiles steel framing','Adhesivos y selladores','Pinturas y revestimientos','Hormigón y cementos','Aislaciones térmicas','Aislaciones acústicas','Impermeabilizantes','Fijaciones y tornillería','Membranas'],
  '🏠 Flipping house / Home & Deco':      ['Pisos y revestimientos','Sanitarios','Griferías','Carpintería y maderas','Pinturas decorativas','Iluminación decorativa','Arte para oficinas','Decoración institucional','Mobiliario de oficina','Jardín y exterior'],
  '🚗 Equipamiento vehicular':            ['Kit emergencia vehicular','Kit señalización vial','Extintor vehicular','Botiquín vehicular','EPP para conductor','Fajas y eslingas carga','Linternas y balizas','Triángulos de seguridad','Rampas y cuñas','Elementos de remolque'],
  '💡 Tecnología e innovación':           ['Detectores de gas portátiles','Detectores multigas','Cámaras de seguridad','Iluminación industrial LED','Iluminación de emergencia','Comunicación industrial','Equipos IoT seguridad','Wearables de seguridad'],
  '📦 Abastecimiento integral':           ['Insumos de oficina','Limpieza industrial','Papelería y consumibles','Uniformes corporativos','Artículos promocionales','Cafetería e higiene','Primeros auxilios','Botiquines empresariales'],
}

const RUBROS_LIST = [
  'Oil & Gas','Construcción','Minería','Industria química','Metalurgia',
  'Electricidad / Energía','Logística / Transporte','Alimentos / Food Grade',
  'Vialidad / Municipal','Agro','Telecomunicaciones','Seguridad privada',
  'Salud / Hospitales','Hotelería / Gastronomía','Oficinas corporativas',
  'Comercios / Retail','Montaje industrial','Obras civiles','Educación',
]

const UNITS = ['Unidad','Par','Caja','Bolsa','Metro','Metro²','Litro','Kg','Rollo','Juego','Pack','Docena']
const CURRENCIES = ['Pesos','Dólares','Euros']
const MARGINS_QUICK = [10,15,20,25,30,35,40,50]

const EMPTY = {
  name:'', code:'', brand:'', model:'', category:'', subcategory:'',
  supplier_id:'', supplier_name:'', cost_price:'', sale_price:'', margin:'',
  currency:'Pesos', unit:'Unidad', norm:'', description:'', short_desc:'',
  image_url:'', status:'Activo', stock:'', notes:'', available:true, min_order:1,
  price_usd:'', cotizacion:'', product_type:'', colors:'', rubros:[], size_range:''
}

const iStyle = {
  background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.07)',
  borderRadius:8, padding:'8px 10px', color:'#f1f5f9', fontSize:13,
  outline:'none', width:'100%', boxSizing:'border-box'
}

const fmtARS = v => v && +v > 0 ? `$${(+v).toLocaleString('es-AR')}` : '—'
const fmtM = v => { const n=+v||0; if(n>=1000000) return `$${(n/1000000).toFixed(1)}M`; if(n>=1000) return `$${(n/1000).toFixed(0)}K`; return `$${n.toLocaleString('es-AR')}` }
const calcSale = (cost, margin) => Math.round(+cost * (1 + +margin/100))
const calcMargin = (cost, sale) => {
  if (!cost || !sale || +cost === 0) return ''
  return (((+sale - +cost) / +cost) * 100).toFixed(1)
}

async function callClaude(userMsg, system, maxTokens=3000) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:maxTokens, system, messages:[{role:'user',content:userMsg}] })
  })
  const data = await res.json()
  return data.content?.[0]?.text || ''
}

async function extractImageFromUrl(url) {
  try {
    if (/\.(jpg|jpeg|png|webp|gif|svg)/i.test(url)) return url
    const r = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`)
    const html = await r.text()
    const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    if (og?.[1]) return og[1]
    const img = html.match(/<img[^>]+src=["'](https?:\/\/[^"']+\.(jpg|jpeg|png|webp))/i)
    if (img?.[1]) return img[1]
  } catch {}
  return null
}

function Field({label, value, onChange, placeholder='', type='text', options, span}) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:4,gridColumn:span?'1/-1':undefined}}>
      <label style={{fontSize:10,color:'#94a3b8',fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em'}}>{label}</label>
      {options
        ? <select value={value||''} onChange={e=>onChange(e.target.value)} style={iStyle}>
            {options.map(o=><option key={o} value={o} style={{background:'#12121f'}}>{o}</option>)}
          </select>
        : <input type={type} value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={iStyle}/>
      }
    </div>
  )
}

function PriceEditor({product, onSave}) {
  const [cost, setCost] = useState(product.cost_price||'')
  const [margin, setMargin] = useState(product.margin||30)
  const sale = cost ? calcSale(cost, margin) : 0
  const save = async () => {
    await supabase.from('products').update({cost_price:+cost,sale_price:sale,margin:+margin,updated_at:new Date()}).eq('id',product.id)
    onSave()
  }
  return (
    <div style={{padding:'10px 12px',background:'rgba(0,0,0,0.5)',borderRadius:10,border:`1px solid ${c.amber}30`}}>
      <div style={{fontSize:10,color:c.amber,marginBottom:8,fontWeight:600,textTransform:'uppercase'}}>Editar precio rápido</div>
      <div style={{display:'flex',gap:8,alignItems:'flex-end',flexWrap:'wrap'}}>
        <div style={{flex:1,minWidth:80}}>
          <div style={{fontSize:9,color:c.muted,marginBottom:3}}>Costo $</div>
          <input type="number" value={cost} onChange={e=>setCost(e.target.value)} style={{...iStyle,padding:'6px 8px',fontSize:12}}/>
        </div>
        <div>
          <div style={{fontSize:9,color:c.muted,marginBottom:3}}>Margen</div>
          <select value={margin} onChange={e=>setMargin(e.target.value)} style={{...iStyle,padding:'6px 8px',fontSize:12,width:68}}>
            {MARGINS_QUICK.map(m=><option key={m} value={m} style={{background:'#12121f'}}>{m}%</option>)}
          </select>
        </div>
        <div style={{textAlign:'center',minWidth:65}}>
          <div style={{fontSize:9,color:c.muted,marginBottom:3}}>Venta</div>
          <div style={{fontSize:13,fontWeight:800,color:c.lime}}>{fmtARS(sale)}</div>
        </div>
        <button onClick={save} style={{padding:'6px 14px',borderRadius:7,border:'none',background:c.lime,color:'#000',cursor:'pointer',fontSize:12,fontWeight:700}}>✓</button>
      </div>
    </div>
  )
}

function RubrosSelector({selected, onChange}) {
  const toggle = r => { const arr=selected||[]; onChange(arr.includes(r)?arr.filter(x=>x!==r):[...arr,r]) }
  return (
    <div>
      <label style={{fontSize:10,color:'#94a3b8',fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em',display:'block',marginBottom:6}}>
        Rubros de aplicación <span style={{color:c.sub,fontWeight:400}}>(todos los que aplican)</span>
      </label>
      <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
        {RUBROS_LIST.map(r => {
          const active=(selected||[]).includes(r)
          return (
            <button key={r} onClick={()=>toggle(r)} type="button"
              style={{padding:'4px 10px',borderRadius:6,border:`1px solid ${active?c.lime:c.border}`,
              background:active?`${c.lime}15`:'transparent',color:active?c.lime:c.sub,
              cursor:'pointer',fontSize:11,fontWeight:active?600:400,transition:'all .15s'}}>
              {r}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── TABLERO DE MÉTRICAS ──
function Tablero({all, filtered, hasFilters}) {
  const glass = {
    background:'rgba(255,255,255,0.04)',
    border:'1px solid rgba(255,255,255,0.09)',
    borderTop:'1px solid rgba(255,255,255,0.18)',
    borderRadius:14,
    backdropFilter:'blur(12px)',
    WebkitBackdropFilter:'blur(12px)',
    boxShadow:'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 20px rgba(0,0,0,0.25)',
  }

  const calcStats = (arr) => ({
    total: arr.length,
    conPrecio: arr.filter(p=>p.cost_price>0).length,
    sinPrecio: arr.filter(p=>!p.cost_price||+p.cost_price===0).length,
    conImagen: arr.filter(p=>p.image_url).length,
    disponibles: arr.filter(p=>p.available!==false).length,
    valorVenta: arr.reduce((a,p)=>a+(+p.sale_price||0),0),
    valorCosto: arr.reduce((a,p)=>a+(+p.cost_price||0),0),
    margenProm: arr.filter(p=>p.margin>0).length
      ? (arr.filter(p=>p.margin>0).reduce((a,p)=>a+(+p.margin),0) / arr.filter(p=>p.margin>0).length).toFixed(1)
      : 0,
    enUSD: arr.filter(p=>p.price_usd>0).length,
    proveedores: [...new Set(arr.map(p=>p.supplier_name).filter(Boolean))].length,
  })

  const g = calcStats(all)
  const f = calcStats(filtered)

  const MetricCard = ({label, value, sub, color='#94a3b8', alert, icon}) => (
    <div style={{...glass, padding:'12px 16px', flex:1, minWidth:110, position:'relative', overflow:'hidden'}}>
      {alert && <div style={{position:'absolute',top:6,right:6,width:6,height:6,borderRadius:'50%',background:c.rose,boxShadow:`0 0 6px ${c.rose}`}}/>}
      <div style={{fontSize:9,color:'rgba(148,163,184,0.7)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>{icon} {label}</div>
      <div style={{fontSize:22,fontWeight:800,color,lineHeight:1,marginBottom:2}}>{value}</div>
      {sub && <div style={{fontSize:10,color:'rgba(148,163,184,0.5)'}}>{sub}</div>}
    </div>
  )

  return (
    <div style={{marginBottom:16}}>
      {/* Fila total general */}
      <div style={{fontSize:9,color:'rgba(148,163,184,0.5)',textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:6}}>
        Catálogo completo
      </div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:hasFilters?12:0}}>
        <MetricCard label="Productos" value={g.total} icon="📦" color={c.cyan}
          sub={`${g.disponibles} disponibles`}/>
        <MetricCard label="Con precio" value={g.conPrecio} icon="💰" color={c.lime}
          sub={`${g.sinPrecio} sin precio`} alert={g.sinPrecio>0}/>
        <MetricCard label="Con imagen" value={g.conImagen} icon="🖼️" color={c.violet}
          sub={`${g.total-g.conImagen} sin imagen`}/>
        <MetricCard label="Valor catálogo" value={fmtM(g.valorVenta)} icon="💎" color={c.amber}
          sub={`costo: ${fmtM(g.valorCosto)}`}/>
        <MetricCard label="Margen prom." value={`${g.margenProm}%`} icon="📈" color={c.lime}
          sub="sobre productos con precio"/>
        <MetricCard label="En USD" value={g.enUSD} icon="💵" color={c.amber}
          sub="con precio en dólares"/>
        <MetricCard label="Proveedores" value={g.proveedores} icon="🏭" color={c.cyan}
          sub="con productos cargados"/>
      </div>

      {/* Fila filtrada — solo si hay filtros activos */}
      {hasFilters && (
        <>
          <div style={{height:1,background:'rgba(255,255,255,0.05)',marginBottom:10}}/>
          <div style={{fontSize:9,color:'rgba(6,182,212,0.7)',textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:6}}>
            ⚡ Selección filtrada — {f.total} producto{f.total!==1?'s':''}
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <MetricCard label="Productos" value={f.total} icon="📦" color={c.cyan}
              sub={`${((f.total/g.total)*100).toFixed(0)}% del catálogo`}/>
            <MetricCard label="Con precio" value={f.conPrecio} icon="💰" color={c.lime}
              sub={`${f.sinPrecio} sin precio`} alert={f.sinPrecio>0}/>
            <MetricCard label="Valor filtrado" value={fmtM(f.valorVenta)} icon="💎" color={c.amber}
              sub={`costo: ${fmtM(f.valorCosto)}`}/>
            <MetricCard label="Margen prom." value={`${f.margenProm}%`} icon="📈" color={c.lime}
              sub="selección actual"/>
            <MetricCard label="Proveedores" value={f.proveedores} icon="🏭" color={c.cyan}
              sub="en esta selección"/>
          </div>
        </>
      )}
    </div>
  )
}

// ── FILTROS CRISTAL ──
function FiltrosCristal({products, suppliers, filters, onChange}) {
  const {search, filterCat, filterType, filterBrand, filterSupplier, filterRubro, filterAvail, sortBy, view} = filters
  const [expandedCat, setExpandedCat] = useState(filterCat||null)

  const glass = (active, aura='#06b6d4') => ({
    position:'relative', overflow:'hidden',
    borderRadius:10, cursor:'pointer',
    backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)',
    transition:'all .2s cubic-bezier(.4,0,.2,1)',
    border: active ? `1px solid ${aura}55` : '1px solid rgba(255,255,255,0.09)',
    borderTop: active ? `1px solid ${aura}88` : '1px solid rgba(255,255,255,0.18)',
    background: active ? `linear-gradient(135deg,${aura}22,${aura}11)` : 'rgba(255,255,255,0.04)',
    boxShadow: active
      ? `0 0 18px ${aura}30, inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 8px rgba(0,0,0,0.3)`
      : 'inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 6px rgba(0,0,0,0.2)',
    color: active ? '#fff' : 'rgba(241,245,249,0.7)',
  })

  const hoverIn = (e, aura) => {
    e.currentTarget.style.background=`rgba(255,255,255,0.08)`
    e.currentTarget.style.boxShadow=`0 0 22px ${aura}28, inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 12px rgba(0,0,0,0.3)`
    e.currentTarget.style.color='rgba(241,245,249,0.98)'
    e.currentTarget.style.borderColor=`${aura}44`
  }
  const hoverOut = (e) => {
    e.currentTarget.style.background='rgba(255,255,255,0.04)'
    e.currentTarget.style.boxShadow='inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 6px rgba(0,0,0,0.2)'
    e.currentTarget.style.color='rgba(241,245,249,0.7)'
    e.currentTarget.style.borderColor='rgba(255,255,255,0.09)'
  }

  const brands = [...new Set(products.map(p=>p.brand).filter(Boolean))].sort()
  const hasFilters = !!(search||filterCat||filterType||filterBrand||filterSupplier||filterRubro||filterAvail)

  const catCounts = {}
  Object.keys(CATEGORIES).forEach(cat => {
    catCounts[cat] = products.filter(p=>p.category===cat).length
  })

  const clearAll = () => onChange({
    search:'', filterCat:'', filterType:'', filterBrand:'',
    filterSupplier:'', filterRubro:'', filterAvail:false,
    sortBy:'recent', view
  })

  const selectCat = (cat) => {
    if (expandedCat===cat) {
      setExpandedCat(null)
      onChange({...filters, filterCat:'', filterType:''})
    } else {
      setExpandedCat(cat)
      onChange({...filters, filterCat:cat, filterType:''})
    }
  }

  return (
    <div style={{marginBottom:18}}>

      {/* Búsqueda */}
      <div style={{marginBottom:12}}>
        <input value={search} onChange={e=>onChange({...filters,search:e.target.value})}
          placeholder="🔍  Buscar por nombre, marca, código, color..."
          style={{
            width:'100%', boxSizing:'border-box',
            background:'rgba(255,255,255,0.04)',
            border:'1px solid rgba(255,255,255,0.09)',
            borderTop:'1px solid rgba(255,255,255,0.22)',
            borderRadius:14, padding:'11px 16px',
            color:'#f1f5f9', fontSize:13, outline:'none',
            backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
            boxShadow:'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 24px rgba(0,0,0,0.3)',
          }}/>
      </div>

      {/* Categorías globales con contador */}
      <div style={{marginBottom:8}}>
        <div style={{fontSize:9,color:'rgba(148,163,184,0.6)',textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:7,paddingLeft:2}}>Categoría</div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>

          {/* Chip "Todas" */}
          <button onClick={()=>{setExpandedCat(null);onChange({...filters,filterCat:'',filterType:''})}}
            style={{...glass(!filterCat,'#94a3b8'),padding:'8px 14px',border:'none',fontSize:11,fontWeight:!filterCat?700:400,display:'flex',alignItems:'center',gap:6}}
            onMouseEnter={e=>!filterCat||hoverIn(e,'#94a3b8')}
            onMouseLeave={e=>!filterCat||hoverOut(e)}>
            <span style={{fontSize:14}}>✦</span>
            <span>Todas</span>
            <span style={{
              fontSize:10,fontWeight:700,
              background:'rgba(148,163,184,0.15)',
              padding:'1px 6px',borderRadius:20,
              color:'rgba(148,163,184,0.9)',
            }}>{products.length}</span>
          </button>

          {Object.keys(CATEGORIES).map(cat => {
            const meta = CATEGORY_META[cat] || {short:cat,aura:'#06b6d4'}
            const active = filterCat===cat
            const count = catCounts[cat]||0
            const icon = cat.split(' ')[0]
            return (
              <button key={cat} onClick={()=>selectCat(cat)}
                style={{...glass(active,meta.aura),padding:'8px 14px',border:'none',fontSize:11,fontWeight:active?700:400,display:'flex',alignItems:'center',gap:6}}
                onMouseEnter={e=>{if(!active)hoverIn(e,meta.aura)}}
                onMouseLeave={e=>{if(!active)hoverOut(e)}}>
                <span style={{fontSize:15}}>{icon}</span>
                <span style={{whiteSpace:'nowrap'}}>{meta.short}</span>
                <span style={{
                  fontSize:10,fontWeight:700,
                  background:active?`${meta.aura}25`:'rgba(255,255,255,0.08)',
                  padding:'1px 6px',borderRadius:20,
                  color:active?meta.aura:'rgba(148,163,184,0.7)',
                }}>{count}</span>
                {(CATEGORIES[cat]||[]).length>0 && (
                  <span style={{fontSize:8,opacity:0.5,transform:expandedCat===cat?'rotate(180deg)':'rotate(0deg)',transition:'transform .2s',display:'inline-block'}}>▼</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Subcategorías desplegables */}
      {expandedCat && (CATEGORIES[expandedCat]||[]).length>0 && (
        <div style={{
          marginBottom:10, paddingLeft:6,
          borderLeft:`2px solid ${CATEGORY_META[expandedCat]?.aura||c.cyan}40`,
          marginLeft:2,
          animation:'fadeIn .2s ease',
        }}>
          <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>
          <div style={{fontSize:9,color:`${CATEGORY_META[expandedCat]?.aura||c.cyan}`,opacity:0.8,textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:6,paddingLeft:10}}>
            Tipo específico
          </div>
          <div style={{display:'flex',gap:5,flexWrap:'wrap',paddingLeft:10}}>
            {[{v:'',label:'Todos los tipos'},...(CATEGORIES[expandedCat]||[]).map(t=>({v:t,label:t}))].map(opt=>{
              const active=filterType===opt.v
              const aura=CATEGORY_META[expandedCat]?.aura||c.cyan
              return (
                <button key={opt.v} onClick={()=>onChange({...filters,filterType:opt.v})}
                  style={{
                    padding:'5px 12px', borderRadius:8, cursor:'pointer',
                    fontSize:10, fontWeight:active?600:400,
                    color: active?aura:'rgba(148,163,184,0.75)',
                    background: active?`${aura}12`:'rgba(255,255,255,0.03)',
                    border: active?`1px solid ${aura}40`:'1px solid rgba(255,255,255,0.07)',
                    borderTop: active?`1px solid ${aura}60`:'1px solid rgba(255,255,255,0.13)',
                    boxShadow: active?`0 0 10px ${aura}20, inset 0 1px 0 rgba(255,255,255,0.1)`:'inset 0 1px 0 rgba(255,255,255,0.05)',
                    backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
                    transition:'all .15s ease', whiteSpace:'nowrap',
                  }}
                  onMouseEnter={e=>{if(!active){e.currentTarget.style.background=`${aura}08`;e.currentTarget.style.color=aura;e.currentTarget.style.borderColor=`${aura}25`}}}
                  onMouseLeave={e=>{if(!active){e.currentTarget.style.background='rgba(255,255,255,0.03)';e.currentTarget.style.color='rgba(148,163,184,0.75)';e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'}}}>
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Fila secundaria: Marca / Proveedor / Rubro / Orden / Vista / Limpiar */}
      <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'flex-end'}}>

        {[
          {label:'Marca', value:filterBrand, key:'filterBrand',
            options:[{v:'',l:'Todas las marcas'},...brands.map(b=>({v:b,l:b}))]},
          {label:'Proveedor', value:filterSupplier, key:'filterSupplier',
            options:[{v:'',l:'Todos los proveedores'},...suppliers.map(s=>({v:s.name,l:s.name}))]},
          {label:'Rubro', value:filterRubro, key:'filterRubro',
            options:[{v:'',l:'Todos los rubros'},...RUBROS_LIST.map(r=>({v:r,l:r}))]},
          {label:'Ordenar', value:sortBy, key:'sortBy',
            options:[{v:'recent',l:'Más recientes'},{v:'name',l:'A → Z'},{v:'price_asc',l:'Precio ↑'},{v:'price_desc',l:'Precio ↓'},{v:'margin',l:'Mayor margen'}]},
        ].map(({label,value,key,options})=>(
          <div key={key} style={{display:'flex',flexDirection:'column',gap:3}}>
            <div style={{fontSize:9,color:'rgba(148,163,184,0.6)',textTransform:'uppercase',letterSpacing:'0.1em'}}>{label}</div>
            <select value={value} onChange={e=>onChange({...filters,[key]:e.target.value})}
              style={{
                appearance:'none', WebkitAppearance:'none',
                background:'rgba(255,255,255,0.05)',
                border:'1px solid rgba(255,255,255,0.09)',
                borderTop:'1px solid rgba(255,255,255,0.18)',
                borderRadius:10, padding:'7px 28px 7px 12px',
                color:'rgba(241,245,249,0.85)', fontSize:11, outline:'none', cursor:'pointer',
                backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)',
                boxShadow:'inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 8px rgba(0,0,0,0.25)',
                minWidth:130,
                backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='rgba(148,163,184,0.5)'/%3E%3C/svg%3E")`,
                backgroundRepeat:'no-repeat', backgroundPosition:'calc(100% - 10px) center',
              }}>
              {options.map(o=><option key={o.v} value={o.v} style={{background:'#0d0d1a'}}>{o.l}</option>)}
            </select>
          </div>
        ))}

        {/* Solo disponibles */}
        <div style={{display:'flex',flexDirection:'column',gap:3}}>
          <div style={{fontSize:9,color:'rgba(148,163,184,0.6)',textTransform:'uppercase',letterSpacing:'0.1em'}}>Disponibles</div>
          <button onClick={()=>onChange({...filters,filterAvail:!filterAvail})}
            style={{
              padding:'7px 14px', borderRadius:10, cursor:'pointer', border:'none',
              fontSize:11, fontWeight:filterAvail?600:400,
              color: filterAvail?'#84cc16':'rgba(148,163,184,0.7)',
              background: filterAvail?'rgba(132,204,22,0.1)':'rgba(255,255,255,0.04)',
              border: filterAvail?'1px solid rgba(132,204,22,0.4)':'1px solid rgba(255,255,255,0.09)',
              borderTop: filterAvail?'1px solid rgba(132,204,22,0.6)':'1px solid rgba(255,255,255,0.18)',
              boxShadow: filterAvail?'0 0 12px rgba(132,204,22,0.2), inset 0 1px 0 rgba(255,255,255,0.1)':'inset 0 1px 0 rgba(255,255,255,0.08)',
              backdropFilter:'blur(10px)', transition:'all .2s ease',
            }}>
            {filterAvail?'✓ Solo disponibles':'Todos'}
          </button>
        </div>

        {/* Vista */}
        <div style={{display:'flex',flexDirection:'column',gap:3,marginLeft:'auto'}}>
          <div style={{fontSize:9,color:'rgba(148,163,184,0.6)',textTransform:'uppercase',letterSpacing:'0.1em'}}>Vista</div>
          <div style={{
            display:'flex', gap:2, background:'rgba(255,255,255,0.04)',
            borderRadius:10, padding:3, border:'1px solid rgba(255,255,255,0.09)',
            borderTop:'1px solid rgba(255,255,255,0.18)',
            boxShadow:'inset 0 1px 0 rgba(255,255,255,0.06)',
            backdropFilter:'blur(10px)',
          }}>
            {[{v:'grid',i:'⊞'},{v:'table',i:'☰'}].map(b=>(
              <button key={b.v} onClick={()=>onChange({...filters,view:b.v})}
                style={{
                  padding:'5px 12px', borderRadius:7, border:'none', cursor:'pointer', fontSize:13,
                  fontWeight:view===b.v?700:400,
                  background: view===b.v?'linear-gradient(135deg,rgba(6,182,212,0.25),rgba(124,58,237,0.15))':'transparent',
                  color: view===b.v?'#fff':'rgba(148,163,184,0.6)',
                  boxShadow: view===b.v?'0 0 10px rgba(6,182,212,0.2), inset 0 1px 0 rgba(255,255,255,0.15)':'none',
                  border: view===b.v?'1px solid rgba(6,182,212,0.3)':'1px solid transparent',
                  transition:'all .15s ease',
                }}>
                {b.i}
              </button>
            ))}
          </div>
        </div>

        {/* Limpiar */}
        {hasFilters && (
          <div style={{display:'flex',flexDirection:'column',gap:3}}>
            <div style={{fontSize:9,color:'transparent',letterSpacing:'0.1em'}}>·</div>
            <button onClick={clearAll}
              style={{
                padding:'7px 12px', borderRadius:10, cursor:'pointer',
                fontSize:10, color:'rgba(244,63,94,0.75)',
                background:'rgba(244,63,94,0.06)',
                border:'1px solid rgba(244,63,94,0.2)',
                borderTop:'1px solid rgba(244,63,94,0.3)',
                boxShadow:'inset 0 1px 0 rgba(255,255,255,0.06)',
                backdropFilter:'blur(10px)', transition:'all .15s ease',
              }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(244,63,94,0.12)';e.currentTarget.style.color='rgba(244,63,94,0.95)'}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(244,63,94,0.06)';e.currentTarget.style.color='rgba(244,63,94,0.75)'}}>
              ✕ Limpiar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── MODAL FORMULARIO ──
function ModalForm({suppliers, initial, mode, onClose, onSaved}) {
  const isEdit = mode==='edit'
  const base = initial ? {...initial} : EMPTY
  if (mode==='duplicate') { delete base.id; base.name=base.name+' (copia)'; base.code='' }
  const [form, setForm] = useState({...EMPTY,...base})
  const [saving, setSaving] = useState(false)
  const [imgUrl, setImgUrl] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [searching, setSearching] = useState(false)
  const [imgResults, setImgResults] = useState([])
  const nameRef = useRef()
  useEffect(()=>{nameRef.current?.focus()},[])
  const setF = (k,v) => setForm(p=>({...p,[k]:v}))
  const handleCost = v => setForm(p=>({...p,cost_price:v,sale_price:p.margin?calcSale(v,p.margin):p.sale_price}))
  const handleSale = v => setForm(p=>({...p,sale_price:v,margin:calcMargin(p.cost_price,v)}))
  const handleMarginBtn = m => setForm(p=>({...p,margin:m,sale_price:p.cost_price?calcSale(p.cost_price,m):p.sale_price}))
  const handleUSD = (usdVal,cotizVal) => {
    const ars=+usdVal&&+cotizVal?Math.round(+usdVal*+cotizVal):0
    setForm(p=>({...p,price_usd:usdVal,cotizacion:cotizVal,cost_price:ars||p.cost_price,sale_price:ars&&p.margin?calcSale(ars,p.margin):p.sale_price}))
  }
  const handleExtractImg = async () => {
    if(!imgUrl)return; setExtracting(true)
    const url=await extractImageFromUrl(imgUrl)
    if(url)setF('image_url',url); else if(/\.(jpg|jpeg|png|webp)/i.test(imgUrl))setF('image_url',imgUrl)
    setExtracting(false)
  }
  const handleSearchImg = async () => {
    if(!form.name)return; setSearching(true)
    try {
      const q=`${form.brand||''} ${form.name} ${form.model||''}`.trim()
      const text=await callClaude(`Producto industrial: "${q}". SOLO JSON array con 6 URLs directas a imágenes JPG/PNG:\n[{"url":"...","source":"..."}]`,'Sos experto en productos industriales. SOLO JSON válido.',800)
      setImgResults(JSON.parse(text.replace(/```json|```/g,'').trim()))
    } catch{setImgResults([])}
    setSearching(false)
  }
  const handleAutoRubros = async () => {
    if(!form.name&&!form.category)return
    try {
      const text=await callClaude(
        `Producto: "${form.name}" | Cat: "${form.category}" | Desc: "${form.short_desc||''}"\nDevolvé SOLO JSON array con rubros de industria argentina: ${RUBROS_LIST.join(', ')}\nFormato: ["Oil & Gas","Construcción"]`,
        'Sos experto en seguridad industrial argentina. SOLO JSON array.',400)
      const rubros=JSON.parse(text.replace(/```json|```/g,'').trim())
      setF('rubros',rubros.filter(r=>RUBROS_LIST.includes(r)))
    } catch{}
  }
  const save = async () => {
    if(!form.name?.trim())return; setSaving(true)
    const {id,...payload}=form; payload.updated_at=new Date()
    if(isEdit&&initial?.id) await supabase.from('products').update(payload).eq('id',initial.id)
    else await supabase.from('products').insert(payload)
    await onSaved(); onClose(); setSaving(false)
  }
  const subcats=CATEGORIES[form.category]||[]
  const isUSD=form.currency==='Dólares'||form.currency==='Euros'
  const currLabel=form.currency==='Dólares'?'USD':'EUR'
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.9)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:12}}>
      <div style={{background:'#0a0a18',border:`1px solid ${c.border}`,borderRadius:16,padding:22,width:'100%',maxWidth:800,maxHeight:'95vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <div style={{fontSize:15,fontWeight:700}}>{mode==='edit'?'✏️ Editar':mode==='duplicate'?'📋 Duplicar':'➕ Nuevo producto'}</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:c.sub,cursor:'pointer',fontSize:22}}>×</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div style={{gridColumn:'1/-1',fontSize:10,color:c.cyan,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',paddingBottom:3,borderBottom:`1px solid ${c.border}`}}>Identificación</div>
          <div style={{gridColumn:'1/-1',display:'flex',flexDirection:'column',gap:4}}>
            <label style={{fontSize:10,color:c.sub,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em'}}>Nombre *</label>
            <input ref={nameRef} value={form.name||''} onChange={e=>setF('name',e.target.value)} placeholder="Ej: Casco Milenium clase A" style={iStyle}/>
          </div>
          <Field label="Código / SKU" value={form.code} onChange={v=>setF('code',v)} placeholder="SKU interno"/>
          <Field label="Marca" value={form.brand} onChange={v=>setF('brand',v)} placeholder="3M, MSA, Libus..."/>
          <Field label="Modelo" value={form.model} onChange={v=>setF('model',v)} placeholder="Número de modelo"/>
          <div style={{gridColumn:'1/-1'}}><Field label="Descripción corta (para propuestas)" value={form.short_desc} onChange={v=>setF('short_desc',v)} placeholder="Una línea que va a ver el cliente"/></div>
          <div style={{gridColumn:'1/-1',fontSize:10,color:c.cyan,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',paddingBottom:3,borderBottom:`1px solid ${c.border}`,marginTop:6}}>Clasificación</div>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <label style={{fontSize:10,color:c.sub,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em'}}>Categoría</label>
            <select value={form.category||''} onChange={e=>{setF('category',e.target.value);setF('product_type','')}} style={iStyle}>
              <option value="" style={{background:'#12121f'}}>Seleccionar...</option>
              {Object.keys(CATEGORIES).map(cat=><option key={cat} value={cat} style={{background:'#12121f'}}>{cat}</option>)}
            </select>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <label style={{fontSize:10,color:c.sub,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em'}}>Tipo específico</label>
            <select value={form.product_type||''} onChange={e=>setF('product_type',e.target.value)} style={iStyle} disabled={!subcats.length}>
              <option value="" style={{background:'#12121f'}}>Seleccionar tipo...</option>
              {subcats.map(s=><option key={s} value={s} style={{background:'#12121f'}}>{s}</option>)}
            </select>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <label style={{fontSize:10,color:c.sub,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em'}}>Proveedor</label>
            <select value={form.supplier_id||''} onChange={e=>{const s=suppliers.find(x=>x.id===e.target.value);setF('supplier_id',e.target.value);setF('supplier_name',s?.name||'')}} style={iStyle}>
              <option value="" style={{background:'#12121f'}}>Sin proveedor</option>
              {suppliers.map(s=><option key={s.id} value={s.id} style={{background:'#12121f'}}>{s.name}</option>)}
            </select>
          </div>
          <Field label="Norma / Certificación" value={form.norm} onChange={v=>setF('norm',v)} placeholder="IRAM 3620, EN 397..."/>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <label style={{fontSize:10,color:c.sub,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em'}}>Colores disponibles</label>
            <input value={form.colors||''} onChange={e=>setF('colors',e.target.value)} placeholder="Ej: Negro, Azul, Marrón" style={iStyle}/>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <label style={{fontSize:10,color:c.sub,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em'}}>Talles / Numeración</label>
            <input value={form.size_range||''} onChange={e=>setF('size_range',e.target.value)} placeholder="Ej: 35 al 47 · XS al 4XL" style={iStyle}/>
          </div>
          <div style={{gridColumn:'1/-1',display:'flex',flexDirection:'column',gap:8}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <label style={{fontSize:10,color:c.sub,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em'}}>Rubros de aplicación</label>
              <button onClick={handleAutoRubros} disabled={!form.name&&!form.category}
                style={{padding:'3px 10px',borderRadius:6,border:`1px solid ${c.violet}`,background:'rgba(124,58,237,0.1)',color:c.violet,cursor:'pointer',fontSize:10,fontWeight:600}}>
                🤖 Sugerir con IA
              </button>
            </div>
            <RubrosSelector selected={form.rubros} onChange={v=>setF('rubros',v)}/>
            {(form.rubros||[]).length>0&&<div style={{fontSize:10,color:c.lime}}>✓ {form.rubros.length} rubros: {form.rubros.join(' · ')}</div>}
          </div>
          <div style={{gridColumn:'1/-1',fontSize:10,color:c.cyan,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',paddingBottom:3,borderBottom:`1px solid ${c.border}`,marginTop:6}}>Precios</div>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <label style={{fontSize:10,color:c.sub,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em'}}>Moneda</label>
            <select value={form.currency||'Pesos'} onChange={e=>setF('currency',e.target.value)} style={iStyle}>
              {CURRENCIES.map(cur=><option key={cur} value={cur} style={{background:'#12121f'}}>{cur}</option>)}
            </select>
          </div>
          <Field label="Unidad" value={form.unit} onChange={v=>setF('unit',v)} options={UNITS}/>
          {isUSD&&(
            <div style={{gridColumn:'1/-1',padding:14,borderRadius:10,background:'rgba(245,160,0,0.05)',border:'1px solid rgba(245,160,0,0.2)'}}>
              <div style={{fontSize:10,color:c.amber,fontWeight:700,textTransform:'uppercase',marginBottom:10}}>💵 Calculadora {currLabel} → ARS</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,alignItems:'flex-end'}}>
                <div style={{display:'flex',flexDirection:'column',gap:4}}>
                  <label style={{fontSize:9,color:c.sub,textTransform:'uppercase'}}>Precio en {currLabel}</label>
                  <input type="number" value={form.price_usd||''} placeholder="0.00" onChange={e=>handleUSD(e.target.value,form.cotizacion)} style={iStyle}/>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:4}}>
                  <label style={{fontSize:9,color:c.sub,textTransform:'uppercase'}}>Cotización venta hoy</label>
                  <input type="number" value={form.cotizacion||''} placeholder="Ej: 1250" onChange={e=>handleUSD(form.price_usd,e.target.value)} style={iStyle}/>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:4}}>
                  <label style={{fontSize:9,color:c.sub,textTransform:'uppercase'}}>= Pesos (costo)</label>
                  <div style={{...iStyle,cursor:'default',color:c.amber,fontWeight:800,fontSize:15,background:'rgba(245,160,0,0.08)'}}>
                    {form.price_usd&&form.cotizacion?`$${Math.round(+form.price_usd*+form.cotizacion).toLocaleString('es-AR')}`:'—'}
                  </div>
                </div>
              </div>
            </div>
          )}
          <Field label={isUSD?'Precio costo en pesos':'Precio costo ($)'} value={form.cost_price} onChange={handleCost} type="number" placeholder="0"/>
          <Field label="Precio venta ($)" value={form.sale_price} onChange={handleSale} type="number" placeholder="0"/>
          <div style={{gridColumn:'1/-1'}}>
            <div style={{fontSize:9,color:c.muted,marginBottom:5,textTransform:'uppercase'}}>Margen rápido</div>
            <div style={{display:'flex',gap:5,flexWrap:'wrap',alignItems:'center'}}>
              {MARGINS_QUICK.map(m=>(
                <button key={m} onClick={()=>handleMarginBtn(m)}
                  style={{padding:'4px 10px',borderRadius:6,border:`1px solid ${+form.margin===m?c.lime:c.border}`,background:+form.margin===m?`${c.lime}15`:'transparent',color:+form.margin===m?c.lime:c.sub,cursor:'pointer',fontSize:11,fontWeight:+form.margin===m?700:400}}>
                  {m}%
                </button>
              ))}
              <div style={{marginLeft:8,padding:'4px 12px',borderRadius:6,background:'rgba(255,255,255,0.04)',border:`1px solid ${c.border}`,display:'flex',gap:10,alignItems:'center'}}>
                <span style={{fontSize:10,color:c.muted}}>Margen:</span>
                <span style={{fontSize:13,fontWeight:800,color:+form.margin>0?c.lime:c.rose}}>{form.margin?`${form.margin}%`:'—'}</span>
                <span style={{fontSize:10,color:c.muted}}>→ Venta:</span>
                <span style={{fontSize:13,fontWeight:800,color:c.amber}}>{fmtARS(form.sale_price)}</span>
              </div>
            </div>
          </div>
          <Field label="Stock" value={form.stock} onChange={v=>setF('stock',v)} type="number" placeholder="0"/>
          <Field label="Pedido mínimo" value={form.min_order} onChange={v=>setF('min_order',v)} type="number" placeholder="1"/>
          <div style={{gridColumn:'1/-1',fontSize:10,color:c.cyan,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',paddingBottom:3,borderBottom:`1px solid ${c.border}`,marginTop:6}}>Imagen</div>
          {form.image_url&&(
            <div style={{gridColumn:'1/-1',display:'flex',gap:12,alignItems:'center',padding:10,borderRadius:10,background:'rgba(255,255,255,0.03)',border:`1px solid ${c.lime}25`}}>
              <img src={form.image_url} alt="preview" style={{width:70,height:70,objectFit:'contain',borderRadius:8,background:'rgba(255,255,255,0.05)'}} onError={e=>e.target.style.display='none'}/>
              <div style={{flex:1}}>
                <div style={{fontSize:11,color:c.lime,marginBottom:3}}>✅ Imagen cargada</div>
                <div style={{fontSize:10,color:c.muted,wordBreak:'break-all'}}>{form.image_url.substring(0,70)}...</div>
              </div>
              <button onClick={()=>{setF('image_url','');setImgResults([])}} style={{background:'none',border:`1px solid ${c.rose}40`,borderRadius:6,color:c.rose,cursor:'pointer',fontSize:11,padding:'3px 8px'}}>✕</button>
            </div>
          )}
          <div style={{gridColumn:'1/-1'}}>
            <div style={{fontSize:9,color:c.sub,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:5}}>A — URL de página o imagen directa</div>
            <div style={{display:'flex',gap:6}}>
              <input value={imgUrl} onChange={e=>setImgUrl(e.target.value)} placeholder="https://proveedor.com/producto" style={{...iStyle,flex:1}}/>
              <button onClick={handleExtractImg} disabled={!imgUrl||extracting}
                style={{padding:'8px 14px',borderRadius:8,border:'none',background:c.amber,color:'#000',cursor:'pointer',fontSize:12,fontWeight:700,opacity:(!imgUrl||extracting)?0.5:1}}>
                {extracting?'⏳':'🔗 Extraer'}
              </button>
            </div>
          </div>
          <div style={{gridColumn:'1/-1'}}>
            <div style={{fontSize:9,color:c.sub,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:5}}>B — Buscar con IA</div>
            <button onClick={handleSearchImg} disabled={!form.name||searching}
              style={{padding:'8px 16px',borderRadius:8,border:`1px solid ${c.violet}`,background:'rgba(124,58,237,0.1)',color:c.violet,cursor:'pointer',fontSize:12,fontWeight:600,opacity:(!form.name||searching)?0.5:1}}>
              {searching?'🔍 Buscando...':'🤖 Buscar imagen con IA'}
            </button>
          </div>
          {imgResults.length>0&&(
            <div style={{gridColumn:'1/-1'}}>
              <div style={{fontSize:9,color:c.sub,textTransform:'uppercase',marginBottom:6}}>Seleccioná la mejor</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:6}}>
                {imgResults.map((img,i)=>(
                  <div key={i} onClick={()=>setF('image_url',img.url)}
                    style={{cursor:'pointer',borderRadius:8,border:`2px solid ${form.image_url===img.url?c.cyan:c.border}`,padding:6,background:'rgba(255,255,255,0.03)'}}>
                    <img src={img.url} alt={img.source} style={{width:'100%',height:56,objectFit:'contain'}} onError={e=>e.target.parentElement.style.opacity='0.3'}/>
                    <div style={{fontSize:8,color:c.muted,marginTop:3,textAlign:'center',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{img.source}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{gridColumn:'1/-1'}}>
            <div style={{fontSize:9,color:c.sub,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:5}}>C — URL directa de imagen</div>
            <input value={form.image_url||''} onChange={e=>setF('image_url',e.target.value)} placeholder="https://ejemplo.com/imagen.jpg" style={iStyle}/>
          </div>
          <div style={{gridColumn:'1/-1',fontSize:10,color:c.cyan,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',paddingBottom:3,borderBottom:`1px solid ${c.border}`,marginTop:6}}>Detalles adicionales</div>
          <div style={{gridColumn:'1/-1',display:'flex',flexDirection:'column',gap:4}}>
            <label style={{fontSize:10,color:c.sub,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em'}}>Descripción / Especificaciones técnicas</label>
            <textarea value={form.description||''} onChange={e=>setF('description',e.target.value)} rows={3} placeholder="Materiales, características, aplicaciones..." style={{...iStyle,resize:'vertical'}}/>
          </div>
          <div style={{gridColumn:'1/-1',display:'flex',flexDirection:'column',gap:4}}>
            <label style={{fontSize:10,color:c.sub,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em'}}>Notas internas</label>
            <textarea value={form.notes||''} onChange={e=>setF('notes',e.target.value)} rows={2} placeholder="Condiciones especiales, observaciones privadas..." style={{...iStyle,resize:'vertical'}}/>
          </div>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:18,paddingTop:14,borderTop:`1px solid ${c.border}`}}>
          <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:12,color:c.sub}}>
            <input type="checkbox" checked={form.available!==false} onChange={e=>setF('available',e.target.checked)}/>
            Disponible para propuestas
          </label>
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
  const [cotizacion, setCotizacion] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [extracted, setExtracted] = useState([])
  const [selected, setSelected] = useState([])
  const [saving, setSaving] = useState(false)
  const [editIdx, setEditIdx] = useState(null)

  const extract = async () => {
    if(!input&&!file)return
    setLoading(true); setExtracted([]); setSelected([])
    try {
      let text=input
      if(file){
        setProgress('Leyendo archivo...')
        text=await new Promise((res,rej)=>{const r=new FileReader();r.onload=e=>res(e.target.result);r.onerror=rej;r.readAsText(file)})
      }
      if(tab==='sheets'&&input.includes('docs.google.com')){
        setProgress('Descargando Google Sheet...')
        const id=input.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1]
        if(id){try{const r=await fetch(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv`);text=await r.text()}catch{}}
      }
      if(tab==='url'&&input.startsWith('http')){
        setProgress('Leyendo página...')
        try{const r=await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(input)}`);const html=await r.text();const tmp=document.createElement('div');tmp.innerHTML=html;text=tmp.innerText.substring(0,14000)}catch{text=`URL: ${input}`}
      }
      setProgress('Extrayendo con IA...')
      const result=await callClaude(
        `Analizá este contenido y extraé TODOS los productos. Cotización USD: ${cotizacion||'no disponible'}

CONTENIDO:
${text.substring(0,13000)}

SOLO JSON array:
[{"name":"nombre","code":"código","brand":"marca","model":"modelo","short_desc":"desc","cost_price":número,"price_usd":número,"unit":"Unidad","norm":"norma","colors":"colores","size_range":"talles","product_type":"tipo","category":"EPP/Indumentaria laboral/Calzado de seguridad/Trabajo en altura/Seguridad vial y señalización/Contra incendios/Protección ambiental/Herramientas y equipamiento/Construcción y materiales/Flipping house / Home & Deco/Equipamiento vehicular/Tecnología e innovación/Abastecimiento integral","rubros":["Oil & Gas"],"image_url":"url si existe"}]`,
        'Extractor experto de catálogos industriales argentinos. SOLO JSON válido.',4000)
      const clean=result.replace(/```json|```/g,'').trim()
      const products=JSON.parse(clean)
      const enriched=products.map((p,i)=>({...p,_id:i,currency:'Pesos',status:'Activo',available:true,rubros:Array.isArray(p.rubros)?p.rubros:[],sale_price:p.cost_price?calcSale(p.cost_price,30):0,margin:p.cost_price?30:''}))
      setExtracted(enriched); setSelected(enriched.map((_,i)=>i)); setProgress('')
    } catch(e){setProgress(`❌ Error: ${e.message}`)}
    setLoading(false)
  }

  const saveAll = async () => {
    const toSave=extracted.filter((_,i)=>selected.includes(i))
    if(!toSave.length)return; setSaving(true)
    for(const p of toSave){const{_id,...payload}=p;payload.updated_at=new Date();await supabase.from('products').insert(payload)}
    await onSaved(); onClose(); setSaving(false)
  }

  const upd=(i,k,v)=>setExtracted(prev=>prev.map((p,idx)=>idx===i?{...p,[k]:v}:p))

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.9)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:12}}>
      <div style={{background:'#0a0a18',border:`1px solid ${c.border}`,borderRadius:16,padding:22,width:'100%',maxWidth:1000,maxHeight:'95vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <div style={{fontSize:15,fontWeight:700}}>🤖 Carga masiva con IA</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:c.sub,cursor:'pointer',fontSize:22}}>×</button>
        </div>
        <div style={{marginBottom:14,padding:12,borderRadius:10,background:'rgba(245,160,0,0.05)',border:'1px solid rgba(245,160,0,0.15)',display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:12,color:c.amber,fontWeight:600}}>💵 Cotización USD del día:</span>
          <input type="number" value={cotizacion} onChange={e=>setCotizacion(e.target.value)} placeholder="Ej: 1250" style={{...iStyle,width:120,padding:'6px 10px'}}/>
          <span style={{fontSize:11,color:c.muted}}>La IA convierte automáticamente si el listado tiene precios en USD</span>
        </div>
        <div style={{display:'flex',gap:4,marginBottom:16,background:'rgba(255,255,255,0.03)',borderRadius:10,padding:4,border:`1px solid ${c.border}`}}>
          {[{key:'pdf',label:'📄 PDF / CSV / Texto'},{key:'sheets',label:'📊 Google Sheets'},{key:'url',label:'🌐 Sitio web'}].map(t=>(
            <button key={t.key} onClick={()=>{setTab(t.key);setInput('');setFile(null);setExtracted([])}}
              style={{flex:1,padding:'8px',borderRadius:7,border:'none',cursor:'pointer',fontSize:12,fontWeight:tab===t.key?700:400,background:tab===t.key?c.cyan:'transparent',color:tab===t.key?'#000':c.sub}}>
              {t.label}
            </button>
          ))}
        </div>
        {tab==='pdf'?(
          <div style={{marginBottom:14}}>
            <div style={{border:`2px dashed ${file?c.lime:c.border}`,borderRadius:12,padding:20,textAlign:'center',marginBottom:10,cursor:'pointer'}}
              onClick={()=>document.getElementById('ia-up').click()}
              onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor=c.cyan}}
              onDragLeave={e=>e.currentTarget.style.borderColor=file?c.lime:c.border}
              onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f){setFile(f);setInput('')}}}>
              <div style={{fontSize:28,marginBottom:6}}>{file?'✅':'📄'}</div>
              <div style={{fontSize:13,color:c.sub}}>{file?file.name:'Arrastrá o clic — PDF, CSV, TXT'}</div>
              <input id="ia-up" type="file" accept=".pdf,.csv,.txt,.xlsx" onChange={e=>{setFile(e.target.files[0]);setInput('')}} style={{display:'none'}}/>
            </div>
            <div style={{fontSize:11,color:c.muted,textAlign:'center',marginBottom:6}}>— o pegá el texto del catálogo —</div>
            <textarea value={input} onChange={e=>setInput(e.target.value)} rows={5} placeholder="Pegá texto de lista de precios..." style={{...iStyle,resize:'vertical'}}/>
          </div>
        ):(
          <div style={{marginBottom:14}}>
            <input value={input} onChange={e=>setInput(e.target.value)}
              placeholder={tab==='sheets'?'https://docs.google.com/spreadsheets/d/...':'https://proveedor.com.ar/catalogo'}
              style={{...iStyle,marginBottom:6}}/>
            <div style={{fontSize:11,color:c.muted}}>{tab==='sheets'?'💡 Sheet debe ser público.':'💡 Funciona mejor con texto visible.'}</div>
          </div>
        )}
        <button onClick={extract} disabled={loading||(!input&&!file)}
          style={{width:'100%',padding:'12px',borderRadius:10,border:'none',background:loading?'rgba(255,255,255,0.08)':`linear-gradient(135deg,${c.cyan},${c.violet})`,color:'#fff',cursor:'pointer',fontSize:14,fontWeight:700,marginBottom:16,opacity:(!input&&!file)?0.5:1}}>
          {loading?`⏳ ${progress||'Procesando...'}`:'🚀 Extraer productos con IA'}
        </button>
        {extracted.length>0&&(
          <>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10,flexWrap:'wrap',gap:8}}>
              <div>
                <span style={{fontSize:14,fontWeight:700,color:c.lime}}>✅ {extracted.length} productos</span>
                <span style={{fontSize:12,color:c.sub,marginLeft:8}}>{selected.length} seleccionados</span>
              </div>
              <div style={{display:'flex',gap:6}}>
                <button onClick={()=>setSelected(extracted.map((_,i)=>i))} style={{padding:'5px 10px',borderRadius:6,border:`1px solid ${c.lime}`,background:'transparent',color:c.lime,cursor:'pointer',fontSize:11}}>Todos</button>
                <button onClick={()=>setSelected([])} style={{padding:'5px 10px',borderRadius:6,border:`1px solid ${c.border}`,background:'transparent',color:c.sub,cursor:'pointer',fontSize:11}}>Ninguno</button>
              </div>
            </div>
            <div style={{overflowX:'auto',marginBottom:16,borderRadius:10,border:`1px solid ${c.border}`}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead>
                  <tr style={{borderBottom:`1px solid ${c.border}`,background:'rgba(255,255,255,0.03)'}}>
                    {['','Nombre','Marca','Tipo','Colores','USD','Costo $','Margen','Venta',''].map(h=>(
                      <th key={h} style={{padding:'8px 10px',textAlign:'left',color:c.sub,fontWeight:600,fontSize:10,textTransform:'uppercase'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {extracted.map((p,i)=>(
                    <tr key={i} style={{borderBottom:`1px solid ${c.border}`,background:selected.includes(i)?'rgba(6,182,212,0.03)':'transparent',opacity:selected.includes(i)?1:0.4}}>
                      <td style={{padding:'8px 10px',textAlign:'center'}}><input type="checkbox" checked={selected.includes(i)} onChange={()=>setSelected(prev=>prev.includes(i)?prev.filter(x=>x!==i):[...prev,i])}/></td>
                      <td style={{padding:'8px 10px',fontWeight:500,maxWidth:180}}>
                        {editIdx===i?<input value={p.name} onChange={e=>upd(i,'name',e.target.value)} style={{...iStyle,padding:'4px 6px',fontSize:12}}/>
                        :<span style={{display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</span>}
                      </td>
                      <td style={{padding:'8px 10px',color:c.sub}}>{p.brand||'—'}</td>
                      <td style={{padding:'8px 10px'}}><span style={{fontSize:10,padding:'2px 7px',borderRadius:20,background:'rgba(6,182,212,0.1)',color:c.cyan,whiteSpace:'nowrap'}}>{p.product_type||'—'}</span></td>
                      <td style={{padding:'8px 10px',color:c.sub,fontSize:11,maxWidth:80,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.colors||'—'}</td>
                      <td style={{padding:'8px 10px',textAlign:'right',color:c.amber,fontWeight:600}}>{p.price_usd>0?`U$S ${p.price_usd}`:'—'}</td>
                      <td style={{padding:'8px 10px',textAlign:'right'}}>
                        {editIdx===i?<input type="number" value={p.cost_price||''} onChange={e=>{upd(i,'cost_price',+e.target.value);upd(i,'sale_price',calcSale(+e.target.value,p.margin||30))}} style={{...iStyle,padding:'4px 6px',fontSize:12,width:80,textAlign:'right'}}/>
                        :<span style={{color:c.amber,fontWeight:600}}>{fmtARS(p.cost_price)}</span>}
                      </td>
                      <td style={{padding:'8px 10px',textAlign:'right'}}>
                        {editIdx===i?<select value={p.margin||30} onChange={e=>{upd(i,'margin',+e.target.value);upd(i,'sale_price',calcSale(p.cost_price,+e.target.value))}} style={{...iStyle,padding:'4px 6px',fontSize:12,width:68}}>
                          {MARGINS_QUICK.map(m=><option key={m} value={m} style={{background:'#12121f'}}>{m}%</option>)}</select>
                        :<span style={{color:c.lime}}>{p.margin?`${p.margin}%`:'30%'}</span>}
                      </td>
                      <td style={{padding:'8px 10px',textAlign:'right',fontWeight:700,color:c.lime}}>{fmtARS(p.sale_price)}</td>
                      <td style={{padding:'8px 10px',textAlign:'center'}}>
                        <button onClick={()=>setEditIdx(editIdx===i?null:i)} style={{background:'none',border:`1px solid ${c.border}`,borderRadius:5,color:c.muted,cursor:'pointer',fontSize:10,padding:'2px 6px'}}>{editIdx===i?'✓':'✏️'}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'space-between',alignItems:'center',paddingTop:14,borderTop:`1px solid ${c.border}`}}>
              <div style={{fontSize:11,color:c.sub}}>Editá nombre, precio y margen con ✏️</div>
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
  const [modal, setModal] = useState(null)
  const [formMode, setFormMode] = useState('new')
  const [activeProduct, setActiveProduct] = useState(null)
  const [priceEdit, setPriceEdit] = useState(null)

  const [filters, setFilters] = useState({
    search:'', filterCat:'', filterType:'', filterBrand:'',
    filterSupplier:'', filterRubro:'', filterAvail:false,
    sortBy:'recent', view:'grid'
  })

  useEffect(()=>{loadAll()},[])

  const loadAll = async () => {
    setLoading(true)
    const [{data:prods},{data:supps}] = await Promise.all([
      supabase.from('products').select('*').order('created_at',{ascending:false}),
      supabase.from('suppliers').select('id,name').order('name')
    ])
    setProducts(prods||[]); setSuppliers(supps||[]); setLoading(false)
  }

  const openForm = (mode, product=null) => { setFormMode(mode); setActiveProduct(product); setModal('form') }
  const deleteProduct = async id => {
    if(!confirm('¿Eliminar este producto?'))return
    await supabase.from('products').delete().eq('id',id)
    setModal(null); setActiveProduct(null); loadAll()
  }

  const {search,filterCat,filterType,filterBrand,filterSupplier,filterRubro,filterAvail,sortBy,view} = filters

  let filtered = products.filter(p => {
    const q=search.toLowerCase()
    const mSearch=!q||p.name?.toLowerCase().includes(q)||p.brand?.toLowerCase().includes(q)||p.code?.toLowerCase().includes(q)||p.supplier_name?.toLowerCase().includes(q)||p.colors?.toLowerCase().includes(q)
    const mCat=!filterCat||p.category===filterCat
    const mType=!filterType||p.product_type===filterType
    const mSupp=!filterSupplier||p.supplier_name===filterSupplier
    const mBrand=!filterBrand||p.brand===filterBrand
    const mRubro=!filterRubro||(p.rubros||[]).includes(filterRubro)
    const mAvail=!filterAvail||p.available!==false
    return mSearch&&mCat&&mType&&mSupp&&mBrand&&mRubro&&mAvail
  })

  if(sortBy==='name') filtered=[...filtered].sort((a,b)=>a.name?.localeCompare(b.name))
  else if(sortBy==='price_asc') filtered=[...filtered].sort((a,b)=>(+a.cost_price||0)-(+b.cost_price||0))
  else if(sortBy==='price_desc') filtered=[...filtered].sort((a,b)=>(+b.cost_price||0)-(+a.cost_price||0))
  else if(sortBy==='margin') filtered=[...filtered].sort((a,b)=>(+b.margin||0)-(+a.margin||0))

  const hasFilters=!!(search||filterCat||filterType||filterBrand||filterSupplier||filterRubro||filterAvail)

  return (
    <div>
      {/* HEADER */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10}}>
        <div>
          <h2 style={{margin:0,fontSize:20,fontWeight:800}}>⬆️ Carga de Productos</h2>
          <p style={{margin:'3px 0 0',color:c.sub,fontSize:12}}>{products.length} productos en catálogo</p>
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

      {/* TABLERO */}
      {products.length>0 && <Tablero all={products} filtered={filtered} hasFilters={hasFilters}/>}

      {/* FILTROS */}
      {products.length>0 && <FiltrosCristal products={products} suppliers={suppliers} filters={filters} onChange={setFilters}/>}

      {/* CARDS MÉTODOS vacío */}
      {products.length===0&&!loading&&(
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
          {[
            {icon:'➕',title:'Carga manual',desc:'Formulario completo con tipo, colores, talles, rubros IA y calculadora USD/ARS.',color:c.cyan,action:()=>openForm('new')},
            {icon:'📄',title:'PDF / CSV / Texto',desc:'Subí el catálogo. La IA extrae productos, precios USD, colores y rubros.',color:c.violet,action:()=>setModal('ia')},
            {icon:'📊',title:'Google Sheets / Web',desc:'URL del sheet del proveedor. La IA lee todas las hojas.',color:c.amber,action:()=>setModal('ia')},
          ].map((m,i)=>(
            <div key={i} onClick={m.action}
              style={{padding:20,borderRadius:14,border:`1px solid ${m.color}25`,background:`${m.color}06`,cursor:'pointer',transition:'all .2s'}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=m.color}
              onMouseLeave={e=>e.currentTarget.style.borderColor=`${m.color}25`}>
              <div style={{fontSize:28,marginBottom:10}}>{m.icon}</div>
              <div style={{fontSize:14,fontWeight:700,marginBottom:6}}>{m.title}</div>
              <div style={{fontSize:12,color:c.sub,lineHeight:1.5}}>{m.desc}</div>
              <div style={{marginTop:12,fontSize:12,color:m.color,fontWeight:600}}>Usar →</div>
            </div>
          ))}
        </div>
      )}

      {loading&&<div style={{textAlign:'center',padding:'60px 0',color:c.cyan}}><div style={{fontSize:32,marginBottom:8}}>⚡</div><div>Cargando...</div></div>}

      {/* GRID */}
      {!loading&&view==='grid'&&filtered.length>0&&(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(185px,1fr))',gap:10}}>
          {filtered.map(p=>(
            <div key={p.id}
              style={{background:c.panel,border:`1px solid ${p.available===false?c.rose+'30':c.border}`,borderRadius:13,overflow:'hidden',transition:'all .2s',position:'relative'}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=c.cyan}
              onMouseLeave={e=>e.currentTarget.style.borderColor=p.available===false?c.rose+'30':c.border}>
              <div style={{height:110,background:'rgba(255,255,255,0.03)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',cursor:'pointer',position:'relative'}}
                onClick={()=>{setActiveProduct(p);setModal('detail')}}>
                {p.image_url?<img src={p.image_url} alt={p.name} style={{width:'100%',height:'100%',objectFit:'contain'}} onError={e=>e.target.style.display='none'}/>:<div style={{fontSize:28,opacity:0.15}}>📦</div>}
                {p.price_usd>0&&<div style={{position:'absolute',top:4,left:4,fontSize:9,fontWeight:700,background:'rgba(245,160,0,0.9)',color:'#000',padding:'2px 5px',borderRadius:4}}>U$S {p.price_usd}</div>}
                {p.product_type&&<div style={{position:'absolute',bottom:4,left:4,right:4,fontSize:8,color:c.cyan,background:'rgba(0,0,0,0.7)',padding:'1px 5px',borderRadius:4,textAlign:'center',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.product_type}</div>}
              </div>
              <div style={{padding:10,cursor:'pointer'}} onClick={()=>{setActiveProduct(p);setModal('detail')}}>
                <div style={{fontSize:11,fontWeight:700,lineHeight:1.3,marginBottom:3,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{p.name}</div>
                {p.brand&&<div style={{fontSize:9,color:c.cyan,marginBottom:1}}>🏷️ {p.brand}</div>}
                {p.colors&&<div style={{fontSize:9,color:c.sub,marginBottom:1}}>🎨 {p.colors}</div>}
                {p.supplier_name&&<div style={{fontSize:9,color:c.sub,marginBottom:4}}>🏭 {p.supplier_name}</div>}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  {p.cost_price>0?<div><div style={{fontSize:9,color:c.muted}}>Costo</div><div style={{fontSize:12,fontWeight:800,color:c.amber}}>{fmtARS(p.cost_price)}</div></div>:<div style={{fontSize:9,color:c.rose}}>⚠️ Sin precio</div>}
                  {p.sale_price>0&&<div style={{textAlign:'right'}}><div style={{fontSize:9,color:c.muted}}>Venta</div><div style={{fontSize:11,fontWeight:700,color:c.lime}}>{fmtARS(p.sale_price)}</div></div>}
                </div>
              </div>
              <div style={{display:'flex',borderTop:`1px solid ${c.border}`}}>
                <button onClick={()=>openForm('edit',p)} style={{flex:1,padding:'6px',background:'none',border:'none',color:c.sub,cursor:'pointer',fontSize:10,borderRight:`1px solid ${c.border}`}}>✏️ Editar</button>
                <button onClick={()=>openForm('duplicate',p)} style={{flex:1,padding:'6px',background:'none',border:'none',color:c.sub,cursor:'pointer',fontSize:10,borderRight:`1px solid ${c.border}`}}>📋</button>
                <button onClick={()=>setPriceEdit(priceEdit===p.id?null:p.id)} style={{flex:1,padding:'6px',background:'none',border:'none',color:c.amber,cursor:'pointer',fontSize:10}}>💲</button>
              </div>
              {priceEdit===p.id&&<div style={{padding:8,borderTop:`1px solid ${c.border}`}}><PriceEditor product={p} onSave={()=>{setPriceEdit(null);loadAll()}}/></div>}
            </div>
          ))}
        </div>
      )}

      {/* TABLE */}
      {!loading&&view==='table'&&filtered.length>0&&(
        <div style={{overflowX:'auto',borderRadius:12,border:`1px solid ${c.border}`}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{borderBottom:`1px solid ${c.border}`,background:'rgba(255,255,255,0.03)'}}>
                {['Producto','Marca','Tipo','Colores','Talles','Proveedor','USD','Costo','Margen','Venta',''].map(h=>(
                  <th key={h} style={{padding:'10px 12px',textAlign:'left',fontSize:10,color:c.sub,fontWeight:600,textTransform:'uppercase'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p=>(
                <tr key={p.id} style={{borderBottom:`1px solid ${c.border}`}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{padding:'10px 12px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      {p.image_url?<img src={p.image_url} alt="" style={{width:32,height:32,objectFit:'contain',borderRadius:4,background:'rgba(255,255,255,0.04)'}} onError={e=>e.target.style.display='none'}/>:<div style={{width:32,height:32,borderRadius:4,background:'rgba(255,255,255,0.04)',display:'flex',alignItems:'center',justifyContent:'center',opacity:0.3}}>📦</div>}
                      <div><div style={{fontWeight:600}}>{p.name}</div>{p.code&&<div style={{fontSize:10,color:c.muted}}>{p.code}</div>}</div>
                    </div>
                  </td>
                  <td style={{padding:'10px 12px',color:c.sub}}>{p.brand||'—'}</td>
                  <td style={{padding:'10px 12px'}}>{p.product_type&&<span style={{fontSize:10,padding:'2px 7px',borderRadius:20,background:'rgba(6,182,212,0.1)',color:c.cyan}}>{p.product_type}</span>}</td>
                  <td style={{padding:'10px 12px',color:c.sub,fontSize:11}}>{p.colors||'—'}</td>
                  <td style={{padding:'10px 12px',color:c.sub,fontSize:11}}>{p.size_range||'—'}</td>
                  <td style={{padding:'10px 12px',color:c.sub,fontSize:11}}>{p.supplier_name||'—'}</td>
                  <td style={{padding:'10px 12px',fontWeight:600,color:c.amber}}>{p.price_usd>0?`U$S ${p.price_usd}`:'—'}</td>
                  <td style={{padding:'10px 12px',fontWeight:700,color:p.cost_price?c.amber:c.rose}}>{p.cost_price?fmtARS(p.cost_price):'⚠️'}</td>
                  <td style={{padding:'10px 12px',color:c.lime,fontWeight:600}}>{p.margin?`${p.margin}%`:'—'}</td>
                  <td style={{padding:'10px 12px',fontWeight:700,color:c.lime}}>{p.sale_price?fmtARS(p.sale_price):'—'}</td>
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

      {!loading&&filtered.length===0&&products.length>0&&<div style={{textAlign:'center',padding:'40px 0',color:c.muted}}>Sin resultados. Probá cambiando los filtros.</div>}

      {/* MODAL DETALLE */}
      {modal==='detail'&&activeProduct&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.9)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:12}}>
          <div style={{background:'#0a0a18',border:`1px solid ${c.border}`,borderRadius:16,padding:22,width:'100%',maxWidth:580,maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:14}}>
              <div style={{fontSize:15,fontWeight:700}}>{activeProduct.name}</div>
              <button onClick={()=>{setModal(null);setActiveProduct(null)}} style={{background:'none',border:'none',color:c.sub,cursor:'pointer',fontSize:22}}>×</button>
            </div>
            {activeProduct.image_url&&<img src={activeProduct.image_url} alt={activeProduct.name} style={{width:'100%',height:160,objectFit:'contain',borderRadius:10,background:'rgba(255,255,255,0.04)',marginBottom:14}} onError={e=>e.target.style.display='none'}/>}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
              {[{l:'Código',v:activeProduct.code},{l:'Marca',v:activeProduct.brand},{l:'Tipo',v:activeProduct.product_type},{l:'Categoría',v:activeProduct.category},{l:'Proveedor',v:activeProduct.supplier_name},{l:'Norma',v:activeProduct.norm},{l:'Colores',v:activeProduct.colors},{l:'Talles',v:activeProduct.size_range},{l:'Precio USD',v:activeProduct.price_usd>0?`U$S ${activeProduct.price_usd}`:null},{l:'Cotización',v:activeProduct.cotizacion?`$${activeProduct.cotizacion}`:null},{l:'Precio costo',v:activeProduct.cost_price?fmtARS(activeProduct.cost_price):null},{l:'Precio venta',v:activeProduct.sale_price?fmtARS(activeProduct.sale_price):null},{l:'Margen',v:activeProduct.margin?`${activeProduct.margin}%`:null},{l:'Unidad',v:activeProduct.unit},{l:'Stock',v:activeProduct.stock},].filter(f=>f.v).map((f,i)=>(
                <div key={i} style={{padding:'8px 10px',borderRadius:8,background:'rgba(255,255,255,0.03)',border:`1px solid ${c.border}`}}>
                  <div style={{fontSize:9,color:c.muted,textTransform:'uppercase',marginBottom:2}}>{f.l}</div>
                  <div style={{fontSize:13,fontWeight:500}}>{f.v}</div>
                </div>
              ))}
            </div>
            {(activeProduct.rubros||[]).length>0&&(
              <div style={{marginBottom:14,padding:10,borderRadius:8,background:'rgba(255,255,255,0.03)',border:`1px solid ${c.border}`}}>
                <div style={{fontSize:9,color:c.muted,textTransform:'uppercase',marginBottom:6}}>Rubros</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                  {activeProduct.rubros.map(r=><span key={r} style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:`${c.lime}10`,color:c.lime,border:`1px solid ${c.lime}25`}}>{r}</span>)}
                </div>
              </div>
            )}
            {activeProduct.description&&<div style={{padding:12,borderRadius:8,background:'rgba(255,255,255,0.03)',border:`1px solid ${c.border}`,marginBottom:14}}><div style={{fontSize:9,color:c.muted,textTransform:'uppercase',marginBottom:4}}>Descripción</div><div style={{fontSize:12,color:c.sub,lineHeight:1.6}}>{activeProduct.description}</div></div>}
            <div style={{display:'flex',gap:8,justifyContent:'space-between'}}>
              <button onClick={()=>deleteProduct(activeProduct.id)} style={{padding:'8px 12px',borderRadius:8,border:`1px solid ${c.rose}`,background:'transparent',color:c.rose,cursor:'pointer',fontSize:12}}>🗑️ Eliminar</button>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>{setModal(null);openForm('duplicate',activeProduct)}} style={{padding:'8px 14px',borderRadius:8,border:`1px solid ${c.border}`,background:'transparent',color:c.sub,cursor:'pointer',fontSize:12}}>📋 Duplicar</button>
                <button onClick={()=>{setModal(null);openForm('edit',activeProduct)}} style={{padding:'9px 18px',borderRadius:8,border:'none',background:c.cyan,color:'#000',cursor:'pointer',fontSize:13,fontWeight:700}}>✏️ Editar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modal==='form'&&<ModalForm suppliers={suppliers} initial={activeProduct} mode={formMode} onClose={()=>{setModal(null);setActiveProduct(null)}} onSaved={loadAll}/>}
      {modal==='ia'&&<ModalIA suppliers={suppliers} onClose={()=>setModal(null)} onSaved={loadAll}/>}
    </div>
  )
}
