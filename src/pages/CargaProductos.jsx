import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../supabase'

const c = {
  bg:'#07070f', border:'rgba(255,255,255,0.07)', panel:'rgba(255,255,255,0.035)',
  cyan:'#06b6d4', violet:'#7c3aed', lime:'#84cc16', amber:'#f59e0b', rose:'#f43f5e',
  text:'#f1f5f9', muted:'#475569', sub:'#94a3b8'
}

const MARGIN_MIN = 20


// ── BUSINESS UNITS — Nueva arquitectura de categorías STEPS ──────────────────
const BUSINESS_UNITS = [
  {
    id: 'abastecimiento',
    name: 'STEPS ABASTECIMIENTO',
    tagline: 'Seguridad · EPP · Indumentaria · Herramientas',
    icon: '🏭',
    gradient: ['#E8860A', '#C8941A', '#4A3010'],
    aura: '#E8860A',
    textColor: '#FFD580',
    categories: [
      {
        id: 'ropa-trabajo',
        name: 'Ropa de trabajo',
        icon: '👕',
        emoji: '👔',
        aura: '#C8941A',
        subcats: ['Diseño corporativo','Mamelucos y overoles','Camisas de trabajo','Pantalones cargo','Chalecos laborales','Buzos y camperas','Alta visibilidad','Jean laboral','Impermeable / lluvia','Ropa antifluido','Ropa antiácida'],
      },
      {
        id: 'epp',
        name: 'EPP',
        icon: '🦺',
        emoji: '⛑️',
        aura: '#06b6d4',
        subcats: ['Protección craneana','Protección ocular','Protección auditiva','Protección respiratoria','Protección facial','Protección corporal','Protección dieléctrica','Ropa descartable'],
      },
      {
        id: 'calzado',
        name: 'Calzado de seguridad',
        icon: '👟',
        emoji: '🥾',
        aura: '#f59e0b',
        subcats: ['Botín puntera acero','Borceguí puntera acero','Bota industrial','Zapatilla de seguridad','Bota de goma','Calzado dieléctrico','Calzado resistente HC','Calzado food grade'],
      },
      {
        id: 'detectores',
        name: 'Detectores de gas',
        icon: '⚠️',
        emoji: '🔬',
        aura: '#f43f5e',
        subcats: ['Detector monogas','Detector multigas','Detector fijo','Sensor CO','Sensor H2S','Sensor LEL','Sensor O2','Detector humo industrial'],
      },
      {
        id: 'senializacion',
        name: 'Señalización y tránsito',
        icon: '🚧',
        emoji: '🚦',
        aura: '#eab308',
        subcats: ['Conos de tránsito','Balizas y delineadores','Vallas metálicas','Carteles','Cintas de peligro','Chalecos viales','Señales fotoluminiscentes','Bloqueo Lockout-Tagout'],
      },
      {
        id: 'guantes',
        name: 'Guantes',
        icon: '🧤',
        emoji: '🥊',
        aura: '#14b8a6',
        subcats: ['Guantes de cuero','Guantes nitrilo','Guantes látex','Guantes anticorte','Guantes dieléctricos','Guantes térmicos','Guantes PVC','Guantes anticorrosivos'],
      },
      {
        id: 'incendios',
        name: 'Contra incendios',
        icon: '🧯',
        emoji: '🔥',
        aura: '#f97316',
        subcats: ['Matafuego ABC polvo','Matafuego CO2','Matafuego agua','Extintores especiales','Mangueras','Detectores de humo','Gabinetes CI','Rociadores'],
      },
      {
        id: 'alturas',
        name: 'Contra alturas',
        icon: '🧗',
        emoji: '⛰️',
        aura: '#ec4899',
        subcats: ['Arneses 3 puntos','Arneses 4 puntos','Líneas de vida','Cabos de amarre simples','Cabos doble Y','Retráctiles SRL','Anclajes','Eslingas','Kits anticaída','Espacio confinado'],
      },
      {
        id: 'vehicular',
        name: 'Equipamiento vehicular',
        icon: '🚗',
        emoji: '🚙',
        aura: '#3b82f6',
        subcats: ['Kit emergencia vehicular','Kit señalización vial','Extintor vehicular','Botiquín vehicular','EPP conductor','Fajas y eslingas','Linternas y balizas','Triángulos de seguridad'],
      },
      {
        id: 'cargas',
        name: 'Cargas e izaje',
        icon: '⛓️',
        emoji: '🏗️',
        aura: '#8b5cf6',
        subcats: ['Cadenas de izaje','Fajas textiles','Grilletes','Ganchos','Eslingas de acero','Aparejos y polipastos','Correas de amarre','Mosquetones industriales'],
      },
      {
        id: 'limpieza',
        name: 'Orden y Limpieza',
        icon: '🧴',
        emoji: '🫧',
        aura: '#84cc16',
        subcats: ['Absorbentes industriales','Paños absorbentes','Kits de contingencia','Barreras de contención','Contenedores residuos','Bobinas jumbo','Limpieza industrial','Dispensers'],
      },
      {
        id: 'herramientas',
        name: 'Herramientas y equipamiento',
        icon: '🔧',
        emoji: '🛠️',
        aura: '#6366f1',
        subcats: ['Herramientas manuales','Herramientas eléctricas','Herramientas neumáticas','Equipos de medición','Equipos de corte','Soldador y accesorios','Iluminación portátil','Escaleras y andamios'],
      },
      {
        id: 'construccion',
        name: 'Materiales de construcción',
        icon: '🏗️',
        emoji: '🧱',
        aura: '#78716c',
        subcats: ['Acústicos','Construcción en seco','Industrial','Revestimientos y diseño','Pinturas y texturas','Pisos y revestimientos','Impermeables','Aislaciones térmicas'],
      },
    ],
  },
  {
    id: 'obras',
    name: 'STEPS OBRAS & PROYECTOS',
    tagline: 'Flipping · Smart Home · Proyectos integrales',
    icon: '🏗️',
    gradient: ['#22c55e', '#16a34a', '#0f3320'],
    aura: '#22c55e',
    textColor: '#86efac',
    categories: [
      {
        id: 'abast-proyectos',
        name: 'Abastecimiento a proyectos',
        icon: '📦',
        emoji: '🏢',
        aura: '#22c55e',
        subcats: ['Insumos para obras','Materiales de acabado','Equipamiento de obra','Logística de proyecto','Consumibles de construcción'],
      },
      {
        id: 'innovadores',
        name: 'Productos Innovadores',
        icon: '💡',
        emoji: '✨',
        aura: '#a3e635',
        subcats: ['Wearables de seguridad','IoT industrial','Equipos de medición smart','EPP conectado','Sensores industriales','Tecnología anticaídas'],
      },
      {
        id: 'flipping',
        name: 'Flipping House & Business',
        icon: '🏠',
        emoji: '🔑',
        aura: '#f59e0b',
        subcats: ['Pisos y revestimientos','Sanitarios','Griferías','Carpintería y maderas','Pinturas decorativas','Iluminación decorativa','Mobiliario de oficina','Jardín y exterior'],
      },
      {
        id: 'smart-home',
        name: 'Smart Home',
        icon: '📱',
        emoji: '🏡',
        aura: '#06b6d4',
        subcats: ['Domótica','Iluminación inteligente','Seguridad electrónica','Automatización','Cámaras IP','Alarmas','Control de acceso','Smart speakers','Termostatos inteligentes'],
      },
      {
        id: 'smart-office',
        name: 'Smart Office',
        icon: '💼',
        emoji: '🖥️',
        aura: '#8b5cf6',
        subcats: ['Automatización de oficina','Videoconferencia','Control de acceso office','Iluminación inteligente office','Conectividad y redes','Mobiliario ergonómico smart'],
      },
    ],
  },
  {
    id: 'tecnologia',
    name: 'STEPS APPS & TECNOLOGÍA',
    tagline: 'IA · Apps · Soluciones digitales',
    icon: '⚡',
    gradient: ['#8b5cf6', '#3b82f6', '#1e1b4b'],
    aura: '#8b5cf6',
    textColor: '#c4b5fd',
    categories: [
      {
        id: 'app-steps',
        name: 'App STEPS',
        icon: '📲',
        emoji: '📱',
        aura: '#E8860A',
        subcats: ['Gestión de pedidos','Planificación de compras','Control de stock','Reportes automáticos','Portal de clientes','Integración con AFIP'],
      },
      {
        id: 'apps-web',
        name: 'Aplicaciones y página web',
        icon: '🌐',
        emoji: '💻',
        aura: '#3b82f6',
        subcats: ['Desarrollo web','E-commerce','Landing pages','Aplicaciones móviles','Integración de sistemas','Mantenimiento web'],
      },
      {
        id: 'ia-empresas',
        name: 'IA para empresas',
        icon: '🤖',
        emoji: '🧠',
        aura: '#7c3aed',
        subcats: ['Asistentes virtuales','Automatización de procesos','Análisis de datos','Chatbots industriales','Predicción de stock','Optimización de compras'],
      },
      {
        id: 'productos-inteligentes',
        name: 'Productos inteligentes',
        icon: '💡',
        emoji: '🔮',
        aura: '#06b6d4',
        subcats: ['Dispositivos IoT','Sensores conectados','Wearables industriales','Equipos smart','Monitoreo remoto','Automatización industrial'],
      },
    ],
  },
]

// Flat lookup helpers (backwards compat con el filtro por category/product_type)
const CATEGORY_IDS = {}  // catId → {unit, cat}
const ALL_SUBCATS = {}   // catId + subcat → true
BUSINESS_UNITS.forEach(unit => {
  unit.categories.forEach(cat => {
    CATEGORY_IDS[cat.id] = { unit: unit.id, catName: cat.name, catId: cat.id }
    cat.subcats.forEach(sub => { ALL_SUBCATS[cat.id + '::' + sub] = true })
  })
})


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

// ── HELPERS ──
const fmtARS = v => v && +v > 0 ? `$${(+v).toLocaleString('es-AR')}` : '—'
const fmtM = v => { const n=+v||0; if(n>=1000000) return `$${(n/1000000).toFixed(1)}M`; if(n>=1000) return `$${(n/1000).toFixed(0)}K`; return `$${n.toLocaleString('es-AR')}` }
const calcSale = (cost, margin) => Math.round(+cost * (1 + +margin/100))
const calcMargin = (cost, sale) => {
  if (!cost || !sale || +cost === 0) return ''
  return (((+sale - +cost) / +cost) * 100).toFixed(1)
}

function priceAge(updatedAt) {
  if (!updatedAt) return null
  return Math.floor((Date.now() - new Date(updatedAt)) / 86400000)
}

function marginStatus(margin) {
  const m = +margin || 0
  if (m === 0) return 'none'
  if (m < MARGIN_MIN) return 'low'
  if (m < 30) return 'mid'
  return 'good'
}

function useEscape(fn) {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') fn() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [fn])
}

async function callClaude(content, system, maxTokens = 3000) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: typeof content === 'string' ? content : JSON.stringify(content) }]
    })
  })
  const data = await res.json()
  if (data.error) throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error))
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

const CHAKRA = ['#FF1744','#FF6D00','#FFD600','#00E676','#00B0FF','#651FFF','#D500F9']

function CineCard({ label, value, sub, color='#94a3b8', alert, warn, icon }) {
  const [star, setStar] = useState(null)
  const idRef = useRef(`star_${Math.random().toString(36).slice(2)}`)
  const handleEnter = () => {
    const chakra = CHAKRA[Math.floor(Math.random() * CHAKRA.length)]
    const startY = 20 + Math.random() * 40
    setStar({ color: chakra, startY, id: Date.now() })
    setTimeout(() => setStar(null), 1600)
  }
  const animName = `shoot_${idRef.current}`
  return (
    <div onMouseEnter={handleEnter}
      style={{flex:'1 1 0',minWidth:100,maxWidth:'calc(16.6% - 7px)',position:'relative',overflow:'hidden',borderRadius:16,padding:'13px 15px',cursor:'default',
        background:'linear-gradient(160deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 40%, rgba(0,0,0,0.1) 100%)',
        backdropFilter:'blur(28px) saturate(180%)',WebkitBackdropFilter:'blur(28px) saturate(180%)',
        border:'1px solid rgba(255,255,255,0.12)',borderTop:'1px solid rgba(255,255,255,0.28)',borderBottom:'1px solid rgba(0,0,0,0.18)',
        boxShadow:['inset 0 1px 0 rgba(255,255,255,0.22)','inset 0 -1px 0 rgba(0,0,0,0.15)','inset 1px 0 0 rgba(255,255,255,0.06)','inset -1px 0 0 rgba(255,255,255,0.04)',`0 0 0 1px ${color}12`,'0 8px 32px rgba(0,0,0,0.35)','0 2px 8px rgba(0,0,0,0.2)'].join(', '),
        transition:'all 0.3s cubic-bezier(0.34,1.2,0.64,1)'}}
      onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=['inset 0 1px 0 rgba(255,255,255,0.22)','inset 0 -1px 0 rgba(0,0,0,0.15)','inset 1px 0 0 rgba(255,255,255,0.06)','inset -1px 0 0 rgba(255,255,255,0.04)',`0 0 0 1px ${color}12`,'0 8px 32px rgba(0,0,0,0.35)','0 2px 8px rgba(0,0,0,0.2)'].join(', ');e.currentTarget.style.borderTopColor='rgba(255,255,255,0.28)'}}
      onMouseOver={e=>{e.currentTarget.style.transform='translateY(-3px) scale(1.018)';e.currentTarget.style.boxShadow=['inset 0 1px 0 rgba(255,255,255,0.3)','inset 0 -1px 0 rgba(0,0,0,0.1)',`0 0 0 1px ${color}35`,`0 0 28px ${color}18`,'0 16px 48px rgba(0,0,0,0.45)','0 4px 12px rgba(0,0,0,0.3)'].join(', ');e.currentTarget.style.borderTopColor='rgba(255,255,255,0.4)'}}>
      <div style={{position:'absolute',top:0,left:'8%',right:'8%',height:1,background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',top:'-30%',left:'-20%',width:'60%',height:'160%',background:'linear-gradient(105deg,rgba(255,255,255,0.06) 0%,rgba(255,255,255,0.01) 50%,transparent 100%)',transform:'skewX(-15deg)',pointerEvents:'none'}}/>
      {(alert||warn)&&<div style={{position:'absolute',top:8,right:8,width:5,height:5,borderRadius:'50%',background:alert?c.rose:c.amber,boxShadow:`0 0 8px ${alert?c.rose:c.amber}`}}/>}
      {star&&(<>
        <style>{`@keyframes ${animName}{0%{transform:translate(-8px,0px);opacity:1}28%{transform:translate(55px,-18px);opacity:0.9}45%{transform:translate(90px,8px);opacity:0.7}68%{transform:translate(140px,-12px);opacity:0.5}85%{transform:translate(175px,5px);opacity:0.25}100%{transform:translate(210px,0px);opacity:0}}`}</style>
        <div style={{position:'absolute',top:`${star.startY}%`,left:0,width:3,height:3,borderRadius:'50%',background:star.color,boxShadow:`0 0 6px 2px ${star.color},0 0 12px 4px ${star.color}55`,animation:`${animName} 1.5s cubic-bezier(0.25,0.46,0.45,0.94) forwards`,pointerEvents:'none',zIndex:10}}/>
        <div style={{position:'absolute',top:`calc(${star.startY}% + 1px)`,left:0,width:18,height:1,background:`linear-gradient(90deg,${star.color}80,transparent)`,animation:`${animName} 1.5s cubic-bezier(0.25,0.46,0.45,0.94) forwards`,pointerEvents:'none',zIndex:9}}/>
      </>)}
      <div style={{fontSize:9,color:'rgba(148,163,184,0.5)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:5,position:'relative',zIndex:1}}>{icon} {label}</div>
      <div style={{fontSize:22,fontWeight:800,lineHeight:1,marginBottom:3,background:`linear-gradient(135deg,${color},${color}99)`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',position:'relative',zIndex:1,letterSpacing:'-0.02em'}}>{value}</div>
      {sub&&<div style={{fontSize:10,color:'rgba(148,163,184,0.4)',lineHeight:1.3,position:'relative',zIndex:1}}>{sub}</div>}
    </div>
  )
}

function Tablero({all, filtered, hasFilters}) {
  const calcStats = (arr) => ({
    total:arr.length,conPrecio:arr.filter(p=>p.cost_price>0).length,sinPrecio:arr.filter(p=>!p.cost_price||+p.cost_price===0).length,
    conImagen:arr.filter(p=>p.image_url).length,disponibles:arr.filter(p=>p.available!==false).length,
    margenProm:arr.filter(p=>p.margin>0).length?(arr.filter(p=>p.margin>0).reduce((a,p)=>a+(+p.margin),0)/arr.filter(p=>p.margin>0).length).toFixed(1):0,
    margenBajo:arr.filter(p=>p.margin>0&&+p.margin<MARGIN_MIN).length,
    preciosViejos:arr.filter(p=>{const d=priceAge(p.updated_at);return d!==null&&d>30}).length,
    proveedores:[...new Set(arr.map(p=>p.supplier_name).filter(Boolean))].length,
  })
  const g=calcStats(all),f=calcStats(filtered)
  return (
    <div style={{marginBottom:16}}>
      <style>{`@keyframes pulseAlert{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
      <div style={{display:'flex',gap:7,flexWrap:'nowrap',marginBottom:hasFilters?12:0}}>
        <CineCard label="Piezas" value={g.total} icon="📦" color={c.cyan} sub={`${g.disponibles} disponibles`}/>
        <CineCard label="Con precio" value={g.conPrecio} icon="💰" color={c.lime} sub={`${g.sinPrecio} sin precio`} alert={g.sinPrecio>0}/>
        <CineCard label="Con imagen" value={g.conImagen} icon="🖼️" color={c.violet} sub={`${g.total-g.conImagen} sin imagen`}/>
        <CineCard label="Margen prom." value={`${g.margenProm}%`} icon="📈" color={c.lime} sub="sobre con precio"/>
        <CineCard label="Margen bajo" value={g.margenBajo} icon="⚠️" color={c.rose} sub={`< ${MARGIN_MIN}% umbral`} alert={g.margenBajo>0}/>
        <CineCard label="Desactualiz." value={g.preciosViejos} icon="🕐" color={c.amber} sub="+30d sin update" warn={g.preciosViejos>0}/>
        <CineCard label="Proveedores" value={g.proveedores} icon="🏭" color={c.cyan} sub={`${all.filter(p=>p.supplier_name).length} piezas`}/>
      </div>
      {hasFilters&&(<>
        <div style={{height:1,background:'rgba(255,255,255,0.05)',marginBottom:10}}/>
        <div style={{fontSize:9,color:'rgba(6,182,212,0.55)',textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:8}}>⚡ Selección — {f.total} producto{f.total!==1?'s':''}</div>
        <div style={{display:'flex',gap:7,flexWrap:'nowrap'}}>
          <CineCard label="Piezas" value={f.total} icon="📦" color={c.cyan} sub={`${((f.total/g.total)*100).toFixed(0)}% de la constelación`}/>
          <CineCard label="Con precio" value={f.conPrecio} icon="💰" color={c.lime} sub={`${f.sinPrecio} sin precio`} alert={f.sinPrecio>0}/>
          <CineCard label="Margen prom." value={`${f.margenProm}%`} icon="📈" color={c.lime} sub="selección"/>
          <CineCard label="Margen bajo" value={f.margenBajo} icon="⚠️" color={c.rose} sub={`< ${MARGIN_MIN}%`} alert={f.margenBajo>0}/>
          <CineCard label="Proveedores" value={f.proveedores} icon="🏭" color={c.cyan} sub="en selección"/>
        </div>
      </>)}
    </div>
  )
}


// ── BUSINESS UNITS FILTER — Apple Vision Pro / Tesla aesthetic ───────────────

function BusinessUnitCard({ unit, isActive, onClick, productCount }) {
  const [hov, setHov] = useState(false)
  const active = isActive

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex: '1 1 0',
        minWidth: 0,
        position: 'relative',
        cursor: 'pointer',
        borderRadius: 20,
        overflow: 'hidden',
        padding: '18px 20px',
        // Glassmorphism multicapa
        background: active
          ? `linear-gradient(135deg, ${unit.aura}28, ${unit.aura}10, rgba(0,0,0,0.2))`
          : `linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03), rgba(0,0,0,0.1))`,
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: `1px solid ${active ? unit.aura + '60' : 'rgba(255,255,255,0.1)'}`,
        borderTop: `1px solid ${active ? unit.aura + '90' : 'rgba(255,255,255,0.22)'}`,
        boxShadow: active
          ? `0 0 0 1px ${unit.aura}30, 0 8px 40px ${unit.aura}20, inset 0 1px 0 rgba(255,255,255,0.2), 0 20px 60px rgba(0,0,0,0.4)`
          : hov
          ? `0 0 0 1px ${unit.aura}18, 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15), 0 0 24px ${unit.aura}10`
          : `0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)`,
        transform: active
          ? 'translateY(-3px) scale(1.01)'
          : hov
          ? 'translateY(-2px)'
          : 'none',
        transition: 'all 0.3s cubic-bezier(0.34,1.2,0.64,1)',
      }}
    >
      {/* Top shine */}
      <div style={{
        position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
        background: `linear-gradient(90deg, transparent, ${active ? unit.aura + '80' : 'rgba(255,255,255,0.3)'}, transparent)`,
        pointerEvents: 'none',
      }}/>

      {/* Glow orb bg */}
      <div style={{
        position: 'absolute', top: -30, right: -30, width: 120, height: 120,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${unit.aura}${active?'25':'12'}, transparent 70%)`,
        pointerEvents: 'none',
        transition: 'all 0.3s ease',
      }}/>

      {/* Icon circle — 3D cristal */}
      <div style={{
        width: 52, height: 52,
        borderRadius: '50%',
        marginBottom: 12,
        position: 'relative',
        background: `radial-gradient(circle at 35% 35%, ${unit.aura}40, ${unit.aura}15 50%, rgba(0,0,0,0.2) 100%)`,
        border: `1.5px solid ${unit.aura}50`,
        borderTop: `1.5px solid ${unit.aura}90`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24,
        boxShadow: [
          `inset 0 1px 0 rgba(255,255,255,0.3)`,
          `inset 0 -1px 0 rgba(0,0,0,0.2)`,
          `0 4px 16px ${unit.aura}30`,
          active ? `0 0 20px ${unit.aura}40` : '',
        ].filter(Boolean).join(', '),
        transform: hov || active ? 'perspective(200px) rotateX(-8deg) rotateY(6deg)' : 'none',
        transition: 'transform 0.3s cubic-bezier(0.34,1.4,0.64,1)',
      }}>
        {/* Specular highlight */}
        <div style={{
          position: 'absolute', top: '15%', left: '20%',
          width: '30%', height: '25%',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.4)',
          filter: 'blur(3px)',
          pointerEvents: 'none',
        }}/>
        <span style={{ position: 'relative', zIndex: 1 }}>{unit.icon}</span>
      </div>

      {/* Name */}
      <div style={{
        fontSize: 12,
        fontWeight: 800,
        color: active ? unit.textColor : 'rgba(241,245,249,0.85)',
        letterSpacing: '0.02em',
        marginBottom: 4,
        fontFamily: "'Syne', sans-serif",
        lineHeight: 1.2,
        transition: 'color 0.2s',
      }}>
        {unit.name}
      </div>

      {/* Tagline */}
      <div style={{
        fontSize: 9,
        color: active ? unit.textColor + 'aa' : 'rgba(148,163,184,0.5)',
        lineHeight: 1.4,
        marginBottom: 10,
        transition: 'color 0.2s',
      }}>
        {unit.tagline}
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{
          fontSize: 18, fontWeight: 900,
          color: active ? unit.aura : 'rgba(255,255,255,0.4)',
          fontFamily: "'Space Mono', monospace",
          lineHeight: 1,
          transition: 'color 0.2s',
        }}>
          {productCount}
        </div>
        <div style={{ fontSize: 9, color: 'rgba(148,163,184,0.4)', fontWeight: 600 }}>
          productos
        </div>
        <div style={{
          marginLeft: 'auto',
          fontSize: 11,
          color: active ? unit.aura : 'rgba(148,163,184,0.3)',
          transform: active ? 'rotate(90deg)' : 'none',
          transition: 'all 0.25s ease',
        }}>▶</div>
      </div>

      {/* Active indicator line */}
      {active && (
        <div style={{
          position: 'absolute', bottom: 0, left: '10%', right: '10%', height: 2,
          background: `linear-gradient(90deg, transparent, ${unit.aura}, transparent)`,
          borderRadius: 1,
        }}/>
      )}
    </div>
  )
}

function CategoryChip({ cat, unit, isActive, onClick, count }) {
  const [hov, setHov] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        padding: '12px 10px',
        borderRadius: 16,
        cursor: 'pointer',
        minWidth: 72,
        position: 'relative',
        background: isActive
          ? `linear-gradient(135deg, ${cat.aura}22, ${cat.aura}0a)`
          : hov
          ? 'rgba(255,255,255,0.06)'
          : 'rgba(255,255,255,0.025)',
        border: `1px solid ${isActive ? cat.aura + '55' : hov ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)'}`,
        borderTop: `1px solid ${isActive ? cat.aura + '88' : 'rgba(255,255,255,0.16)'}`,
        boxShadow: isActive
          ? `0 0 20px ${cat.aura}18, inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 16px rgba(0,0,0,0.3)`
          : hov
          ? `0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)`
          : `inset 0 1px 0 rgba(255,255,255,0.06)`,
        transform: isActive
          ? 'perspective(300px) translateY(-3px) rotateX(4deg)'
          : hov
          ? 'perspective(300px) translateY(-2px) rotateX(3deg)'
          : 'none',
        transition: 'all 0.22s cubic-bezier(0.34,1.3,0.64,1)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Specular top */}
      <div style={{
        position: 'absolute', top: 0, left: '15%', right: '15%', height: 1,
        background: `linear-gradient(90deg, transparent, ${isActive ? cat.aura + '60' : 'rgba(255,255,255,0.2)'}, transparent)`,
        pointerEvents: 'none',
      }}/>

      {/* Emoji icon in cristal circle */}
      <div style={{
        width: 40, height: 40,
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20,
        background: `radial-gradient(circle at 35% 35%, ${cat.aura}35, ${cat.aura}12 55%, rgba(0,0,0,0.15) 100%)`,
        border: `1px solid ${cat.aura}40`,
        borderTop: `1px solid ${cat.aura}70`,
        boxShadow: [
          `inset 0 1px 0 rgba(255,255,255,0.25)`,
          `0 2px 8px rgba(0,0,0,0.3)`,
          isActive ? `0 0 14px ${cat.aura}35` : '',
        ].filter(Boolean).join(', '),
        position: 'relative',
        transition: 'box-shadow 0.2s ease',
      }}>
        {/* Specular */}
        <div style={{
          position: 'absolute', top: '12%', left: '18%',
          width: '28%', height: '22%',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.45)',
          filter: 'blur(2px)',
          pointerEvents: 'none',
        }}/>
        {cat.emoji}
      </div>

      {/* Name */}
      <div style={{
        fontSize: 9,
        fontWeight: isActive ? 700 : 500,
        color: isActive ? cat.aura : 'rgba(148,163,184,0.7)',
        textAlign: 'center',
        lineHeight: 1.3,
        maxWidth: 64,
        transition: 'color 0.2s',
      }}>
        {cat.name}
      </div>

      {/* Count badge */}
      {count > 0 && (
        <div style={{
          fontSize: 8,
          fontWeight: 700,
          color: isActive ? cat.aura : 'rgba(148,163,184,0.35)',
          fontFamily: "'Space Mono', monospace",
          background: isActive ? `${cat.aura}18` : 'rgba(255,255,255,0.05)',
          padding: '1px 6px',
          borderRadius: 8,
          border: `1px solid ${isActive ? cat.aura + '30' : 'rgba(255,255,255,0.07)'}`,
        }}>
          {count}
        </div>
      )}
    </div>
  )
}

function SubcatPill({ label, isActive, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '5px 12px',
        borderRadius: 20,
        border: 'none',
        cursor: 'pointer',
        fontSize: 10,
        fontWeight: isActive ? 700 : 400,
        color: isActive ? '#fff' : 'rgba(148,163,184,0.65)',
        background: isActive
          ? 'rgba(255,255,255,0.15)'
          : hov
          ? 'rgba(255,255,255,0.07)'
          : 'rgba(255,255,255,0.03)',
        outline: isActive
          ? '1px solid rgba(255,255,255,0.3)'
          : hov
          ? '1px solid rgba(255,255,255,0.1)'
          : '1px solid rgba(255,255,255,0.06)',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
        transform: isActive ? 'perspective(200px) translateY(-1px)' : 'none',
        backdropFilter: 'blur(8px)',
      }}
    >
      {label}
    </button>
  )
}

function BusinessUnitsFilter({ products, suppliers, filters, onChange }) {
  const {
    search, filterCat, filterType, filterBrand,
    filterSupplier, filterRubro, filterAvail, sortBy, view,
  } = filters

  const [activeUnit, setActiveUnit] = useState(null)     // unit id
  const [activeCatId, setActiveCatId] = useState(null)   // cat id
  const [expandedCatId, setExpandedCatId] = useState(null) // for subcats

  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))].sort()
  const hasFilters = !!(search || filterCat || filterType || filterBrand || filterSupplier || filterRubro || filterAvail)

  // Count products per category
  const catCounts = {}
  BUSINESS_UNITS.forEach(unit => {
    unit.categories.forEach(cat => {
      catCounts[cat.name] = products.filter(p => p.category === cat.name).length
    })
  })

  // Count products per unit
  const unitCounts = {}
  BUSINESS_UNITS.forEach(unit => {
    unitCounts[unit.id] = unit.categories.reduce((sum, cat) => sum + (catCounts[cat.name] || 0), 0)
  })

  const selectUnit = (unitId) => {
    if (activeUnit === unitId) {
      setActiveUnit(null)
      setActiveCatId(null)
      setExpandedCatId(null)
      onChange({ ...filters, filterCat: '', filterType: '' })
    } else {
      setActiveUnit(unitId)
      setActiveCatId(null)
      setExpandedCatId(null)
      onChange({ ...filters, filterCat: '', filterType: '' })
    }
  }

  const selectCat = (cat) => {
    if (activeCatId === cat.id) {
      setActiveCatId(null)
      setExpandedCatId(null)
      onChange({ ...filters, filterCat: '', filterType: '' })
    } else {
      setActiveCatId(cat.id)
      setExpandedCatId(cat.id)
      onChange({ ...filters, filterCat: cat.name, filterType: '' })
    }
  }

  const selectSubcat = (subcat) => {
    onChange({ ...filters, filterType: filters.filterType === subcat ? '' : subcat })
  }

  const clearAll = () => {
    setActiveUnit(null)
    setActiveCatId(null)
    setExpandedCatId(null)
    onChange({
      search: '', filterCat: '', filterType: '', filterBrand: '',
      filterSupplier: '', filterRubro: '', filterAvail: false,
      sortBy: 'recent', view,
    })
  }

  const currentUnit = BUSINESS_UNITS.find(u => u.id === activeUnit)

  return (
    <div style={{ marginBottom: 20 }}>

      {/* ── Search bar ── */}
      <div style={{ marginBottom: 14 }}>
        <input
          value={search}
          onChange={e => onChange({ ...filters, search: e.target.value })}
          placeholder="✦  Buscar producto — nombre, marca, código, color, proveedor..."
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderTop: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 14, padding: '11px 16px',
            color: '#f1f5f9', fontSize: 13, outline: 'none',
            backdropFilter: 'blur(20px)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.3)',
          }}
        />
      </div>

      {/* ── 3 Business Unit Cards ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
        {BUSINESS_UNITS.map(unit => (
          <BusinessUnitCard
            key={unit.id}
            unit={unit}
            isActive={activeUnit === unit.id}
            onClick={() => selectUnit(unit.id)}
            productCount={unitCounts[unit.id] || 0}
          />
        ))}
      </div>

      {/* ── Expanded: Categories of active unit ── */}
      {currentUnit && (
        <div style={{
          marginBottom: 12,
          padding: '16px 16px 12px',
          borderRadius: 16,
          background: `linear-gradient(135deg, ${currentUnit.aura}0a, rgba(0,0,0,0.15))`,
          border: `1px solid ${currentUnit.aura}22`,
          borderTop: `1px solid ${currentUnit.aura}40`,
          backdropFilter: 'blur(24px)',
          animation: 'unitExpand 0.3s cubic-bezier(0.34,1.2,0.64,1) both',
        }}>
          <style>{`
            @keyframes unitExpand{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
            @keyframes subcatExpand{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
          `}</style>

          {/* Unit header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: currentUnit.aura,
              boxShadow: `0 0 8px ${currentUnit.aura}`,
            }}/>
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: currentUnit.textColor,
              textTransform: 'uppercase', letterSpacing: '0.12em',
            }}>
              {currentUnit.name}
            </span>
            <span style={{ fontSize: 10, color: 'rgba(148,163,184,0.4)', marginLeft: 4 }}>
              {currentUnit.categories.length} categorías
            </span>
          </div>

          {/* Category chips grid */}
          <div style={{
            display: 'flex', gap: 8, flexWrap: 'wrap',
          }}>
            {currentUnit.categories.map(cat => (
              <CategoryChip
                key={cat.id}
                cat={cat}
                unit={currentUnit}
                isActive={activeCatId === cat.id}
                onClick={() => selectCat(cat)}
                count={catCounts[cat.name] || 0}
              />
            ))}
          </div>

          {/* Subcategory pills when a cat is selected */}
          {expandedCatId && (() => {
            const cat = currentUnit.categories.find(c => c.id === expandedCatId)
            if (!cat) return null
            return (
              <div style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: `1px solid ${cat.aura}20`,
                animation: 'subcatExpand 0.25s ease both',
              }}>
                <div style={{
                  fontSize: 9, fontWeight: 700, color: cat.aura,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  marginBottom: 8, opacity: 0.8,
                }}>
                  {cat.emoji} {cat.name}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <SubcatPill
                    label="Todos"
                    isActive={!filterType}
                    onClick={() => onChange({ ...filters, filterType: '' })}
                  />
                  {cat.subcats.map(sub => (
                    <SubcatPill
                      key={sub}
                      label={sub}
                      isActive={filterType === sub}
                      onClick={() => selectSubcat(sub)}
                    />
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* ── Secondary filters row ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {[
          { label: 'Marca', value: filterBrand, key: 'filterBrand',
            options: [{ v: '', l: 'Todas las marcas' }, ...brands.map(b => ({ v: b, l: b }))] },
          { label: 'Proveedor', value: filterSupplier, key: 'filterSupplier',
            options: [{ v: '', l: 'Todos los proveedores' }, ...suppliers.map(s => ({ v: s.name, l: s.name }))] },
          { label: 'Ordenar', value: sortBy, key: 'sortBy',
            options: [
              { v: 'recent', l: 'Más recientes' }, { v: 'name', l: 'A → Z' },
              { v: 'price_asc', l: 'Precio ↑' }, { v: 'price_desc', l: 'Precio ↓' },
              { v: 'margin', l: 'Mayor margen' }, { v: 'margin_low', l: 'Margen bajo primero' },
            ]},
        ].map(({ label, value, key, options }) => (
          <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ fontSize: 9, color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {label}
            </div>
            <select
              value={value}
              onChange={e => onChange({ ...filters, [key]: e.target.value })}
              style={{
                appearance: 'none', WebkitAppearance: 'none',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderTop: '1px solid rgba(255,255,255,0.16)',
                borderRadius: 10, padding: '7px 28px 7px 12px',
                color: 'rgba(241,245,249,0.8)', fontSize: 11, outline: 'none', cursor: 'pointer',
                backdropFilter: 'blur(12px)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07), 0 2px 8px rgba(0,0,0,0.25)',
                minWidth: 130,
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='rgba(148,163,184,0.4)'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat', backgroundPosition: 'calc(100% - 10px) center',
              }}
            >
              {options.map(o => <option key={o.v} value={o.v} style={{ background: '#0d0d1a' }}>{o.l}</option>)}
            </select>
          </div>
        ))}

        {/* Solo disponibles */}
        <button
          onClick={() => onChange({ ...filters, filterAvail: !filterAvail })}
          style={{
            padding: '7px 14px', borderRadius: 10, cursor: 'pointer', border: 'none',
            fontSize: 11, fontWeight: filterAvail ? 600 : 400,
            color: filterAvail ? '#84cc16' : 'rgba(148,163,184,0.65)',
            background: filterAvail ? 'rgba(132,204,22,0.08)' : 'rgba(255,255,255,0.035)',
            outline: filterAvail ? '1px solid rgba(132,204,22,0.35)' : '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)', transition: 'all .2s ease',
          }}
        >
          {filterAvail ? '✓ Solo disponibles' : 'Todos'}
        </button>

        {/* Vista grid/table */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 2,
          background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 3,
          outline: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
          {[{ v: 'grid', i: '⊞' }, { v: 'table', i: '☰' }].map(b => (
            <button
              key={b.v}
              onClick={() => onChange({ ...filters, view: b.v })}
              style={{
                padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13,
                fontWeight: view === b.v ? 700 : 400,
                background: view === b.v ? 'rgba(6,182,212,0.15)' : 'transparent',
                color: view === b.v ? '#06b6d4' : 'rgba(148,163,184,0.5)',
                boxShadow: view === b.v ? '0 0 12px rgba(6,182,212,0.2), inset 0 1px 0 rgba(255,255,255,0.15)' : 'none',
                outline: view === b.v ? '1px solid rgba(6,182,212,0.3)' : 'none',
                transition: 'all .15s ease',
              }}
            >
              {b.i}
            </button>
          ))}
        </div>

        {/* Limpiar */}
        {hasFilters && (
          <button
            onClick={clearAll}
            style={{
              padding: '7px 12px', borderRadius: 10, cursor: 'pointer', border: 'none',
              fontSize: 10, color: 'rgba(244,63,94,0.7)',
              background: 'rgba(244,63,94,0.05)',
              outline: '1px solid rgba(244,63,94,0.18)',
              backdropFilter: 'blur(12px)', transition: 'all .15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.1)'; e.currentTarget.style.color = 'rgba(244,63,94,0.95)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.05)'; e.currentTarget.style.color = 'rgba(244,63,94,0.7)' }}
          >
            ✕ Limpiar
          </button>
        )}
      </div>
    </div>
  )
}


function ModalActualizarPrecios({products, onClose, onSaved}) {
  useEscape(onClose)
  const [pct,setPct]=useState(''),[modo,setModo]=useState('costo'),[scope,setScope]=useState('todos')
  const [filterVal,setFilterVal]=useState(''),[saving,setSaving]=useState(false)
  const categorias=[...new Set(products.map(p=>p.category).filter(Boolean))].sort()
  const proveedores=[...new Set(products.map(p=>p.supplier_name).filter(Boolean))].sort()
  const targets=products.filter(p=>{if(scope==='categoria')return p.category===filterVal;if(scope==='proveedor')return p.supplier_name===filterVal;return true})
  const applyPct=(val,pct)=>Math.round(+val*(1+(+pct/100)))
  const apply=async()=>{
    if(!pct||!targets.length)return;setSaving(true)
    for(const p of targets){
      const updates={updated_at:new Date()}
      if(modo==='costo'||modo==='ambos'){updates.cost_price=applyPct(p.cost_price,pct);if(p.margin)updates.sale_price=calcSale(updates.cost_price,p.margin)}
      if(modo==='venta')updates.sale_price=applyPct(p.sale_price,pct)
      await supabase.from('products').update(updates).eq('id',p.id)
    }
    await onSaved();onClose();setSaving(false)
  }
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.92)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:12,backdropFilter:'blur(4px)'}}>
      <div style={{background:'#09091a',border:'1px solid rgba(255,255,255,0.08)',borderTop:'1px solid rgba(255,255,255,0.15)',borderRadius:18,padding:24,width:'100%',maxWidth:520,boxShadow:'0 32px 80px rgba(0,0,0,0.6)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div><div style={{fontSize:15,fontWeight:700}}>⚡ Actualizar precios masivo</div><div style={{fontSize:11,color:c.sub,marginTop:2}}>Aplicá un % a múltiples productos de una vez</div></div>
          <button onClick={onClose} style={{background:'none',border:'none',color:c.sub,cursor:'pointer',fontSize:22,lineHeight:1}}>×</button>
        </div>
        <div style={{marginBottom:16,padding:16,borderRadius:12,background:'rgba(245,160,0,0.05)',border:'1px solid rgba(245,160,0,0.15)'}}>
          <div style={{fontSize:10,color:c.amber,fontWeight:700,textTransform:'uppercase',marginBottom:10}}>Porcentaje de ajuste</div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
            {[5,10,15,20,25,30,-5,-10,-15].map(v=>(
              <button key={v} onClick={()=>setPct(String(v))}
                style={{padding:'5px 12px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:+pct===v?700:400,
                  background:+pct===v?(v>0?`${c.lime}20`:`${c.rose}20`):'rgba(255,255,255,0.05)',
                  color:+pct===v?(v>0?c.lime:c.rose):c.sub,outline:+pct===v?`1px solid ${v>0?c.lime:c.rose}40`:'none',transition:'all .15s'}}>
                {v>0?'+':''}{v}%
              </button>
            ))}
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <input type="number" value={pct} onChange={e=>setPct(e.target.value)} placeholder="Ej: 12.5"
              style={{...iStyle,width:120,fontSize:20,fontWeight:800,textAlign:'center',color:+pct>0?c.lime:+pct<0?c.rose:c.text}}/>
            <span style={{fontSize:20,fontWeight:800,color:c.sub}}>%</span>
            <div style={{fontSize:11,color:c.sub,lineHeight:1.4}}>
              {+pct>0?'↑ Aumento':'↓ Baja'}<br/>
              <span style={{color:+pct>0?c.lime:c.rose,fontWeight:700}}>{pct?`${+pct>0?'+':''}${pct}%`:''}</span>
            </div>
          </div>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:10,color:c.sub,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8}}>Qué actualizar</div>
          <div style={{display:'flex',gap:6}}>
            {[{v:'costo',l:'Solo costo → recalcula venta'},{v:'venta',l:'Solo precio de venta'},{v:'ambos',l:'Costo y venta'}].map(opt=>(
              <button key={opt.v} onClick={()=>setModo(opt.v)}
                style={{flex:1,padding:'8px',borderRadius:9,border:'none',cursor:'pointer',fontSize:11,fontWeight:modo===opt.v?700:400,
                  background:modo===opt.v?`${c.cyan}15`:'rgba(255,255,255,0.04)',color:modo===opt.v?c.cyan:c.sub,
                  outline:modo===opt.v?`1px solid ${c.cyan}40`:'1px solid rgba(255,255,255,0.07)',transition:'all .15s',textAlign:'center',lineHeight:1.3}}>
                {opt.l}
              </button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:10,color:c.sub,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8}}>Aplicar a</div>
          <div style={{display:'flex',gap:6,marginBottom:8}}>
            {[{v:'todos',l:`Todos (${products.length})`},{v:'categoria',l:'Una categoría'},{v:'proveedor',l:'Un proveedor'}].map(opt=>(
              <button key={opt.v} onClick={()=>{setScope(opt.v);setFilterVal('')}}
                style={{flex:1,padding:'7px',borderRadius:9,border:'none',cursor:'pointer',fontSize:11,fontWeight:scope===opt.v?700:400,
                  background:scope===opt.v?`${c.violet}15`:'rgba(255,255,255,0.04)',color:scope===opt.v?'#a78bfa':c.sub,
                  outline:scope===opt.v?'1px solid rgba(124,58,237,0.4)':'1px solid rgba(255,255,255,0.07)',transition:'all .15s'}}>
                {opt.l}
              </button>
            ))}
          </div>
          {scope==='categoria'&&<select value={filterVal} onChange={e=>setFilterVal(e.target.value)} style={iStyle}><option value="">Seleccionar categoría...</option>{categorias.map(c=><option key={c} value={c} style={{background:'#12121f'}}>{c}</option>)}</select>}
          {scope==='proveedor'&&<select value={filterVal} onChange={e=>setFilterVal(e.target.value)} style={iStyle}><option value="">Seleccionar proveedor...</option>{proveedores.map(p=><option key={p} value={p} style={{background:'#12121f'}}>{p}</option>)}</select>}
        </div>
        <div style={{padding:14,borderRadius:10,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',marginBottom:20}}>
          <div style={{fontSize:11,color:c.sub,marginBottom:4}}>Resumen de la operación</div>
          <div style={{fontSize:13,fontWeight:600}}>{targets.length} producto{targets.length!==1?'s':''} · {modo==='costo'?'Ajuste de costo':modo==='venta'?'Ajuste de venta':'Costo y venta'} · <span style={{color:+pct>0?c.lime:c.rose}}>{+pct>0?'+':''}{pct||'?'}%</span></div>
          {scope!=='todos'&&!filterVal&&<div style={{fontSize:11,color:c.rose,marginTop:4}}>⚠ Seleccioná un valor para el filtro</div>}
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button onClick={onClose} style={{padding:'9px 18px',borderRadius:9,border:'1px solid rgba(255,255,255,0.08)',background:'transparent',color:c.sub,cursor:'pointer',fontSize:13}}>Cancelar</button>
          <button onClick={apply} disabled={saving||!pct||!targets.length||(scope!=='todos'&&!filterVal)}
            style={{padding:'9px 22px',borderRadius:9,border:'none',background:`linear-gradient(135deg,${c.lime},#65a30d)`,color:'#000',cursor:'pointer',fontSize:13,fontWeight:800,
              opacity:(saving||!pct||!targets.length||(scope!=='todos'&&!filterVal))?0.4:1,
              boxShadow:pct&&targets.length?'0 0 20px rgba(132,204,22,0.3)':'none',transition:'all .2s'}}>
            {saving?'Aplicando...':'⚡ Aplicar ajuste'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalForm({suppliers, initial, mode, onClose, onSaved}) {
  useEscape(onClose)
  const isEdit=mode==='edit'
  const base=initial?{...initial}:EMPTY
  if(mode==='duplicate'){delete base.id;base.name=base.name+' (copia)';base.code=''}
  const [form,setForm]=useState({...EMPTY,...base})
  const [saving,setSaving]=useState(false),[imgUrl,setImgUrl]=useState('')
  const [extracting,setExtracting]=useState(false),[searching,setSearching]=useState(false)
  const [imgResults,setImgResults]=useState([])
  const nameRef=useRef()
  useEffect(()=>{nameRef.current?.focus()},[])
  const setF=(k,v)=>setForm(p=>({...p,[k]:v}))
  const handleCost=v=>setForm(p=>({...p,cost_price:v,sale_price:p.margin?calcSale(v,p.margin):p.sale_price}))
  const handleSale=v=>setForm(p=>({...p,sale_price:v,margin:calcMargin(p.cost_price,v)}))
  const handleMarginBtn=m=>setForm(p=>({...p,margin:m,sale_price:p.cost_price?calcSale(p.cost_price,m):p.sale_price}))
  const handleUSD=(usdVal,cotizVal)=>{const ars=+usdVal&&+cotizVal?Math.round(+usdVal*+cotizVal):0;setForm(p=>({...p,price_usd:usdVal,cotizacion:cotizVal,cost_price:ars||p.cost_price,sale_price:ars&&p.margin?calcSale(ars,p.margin):p.sale_price}))}
  const handleExtractImg=async()=>{if(!imgUrl)return;setExtracting(true);const url=await extractImageFromUrl(imgUrl);if(url)setF('image_url',url);else if(/\.(jpg|jpeg|png|webp)/i.test(imgUrl))setF('image_url',imgUrl);setExtracting(false)}
  const handleSearchImg=async()=>{if(!form.name)return;setSearching(true);try{const q=`${form.brand||''} ${form.name} ${form.model||''}`.trim();const text=await callClaude(`Producto industrial: "${q}". SOLO JSON array con 6 URLs directas a imágenes JPG/PNG:\n[{"url":"...","source":"..."}]`,'Sos experto en productos industriales. SOLO JSON válido.',800);setImgResults(JSON.parse(text.replace(/```json|```/g,'').trim()))}catch{setImgResults([])};setSearching(false)}
  const handleAutoRubros=async()=>{if(!form.name&&!form.category)return;try{const text=await callClaude(`Producto: "${form.name}" | Cat: "${form.category}" | Desc: "${form.short_desc||''}"
Devolvé SOLO JSON array con rubros de industria argentina: ${RUBROS_LIST.join(', ')}
Formato: ["Oil & Gas","Construcción"]`,'Sos experto en seguridad industrial argentina. SOLO JSON array.',400);const rubros=JSON.parse(text.replace(/```json|```/g,'').trim());setF('rubros',rubros.filter(r=>RUBROS_LIST.includes(r)))}catch{}}
  const mStatus=marginStatus(form.margin)
  const save=async()=>{if(!form.name?.trim())return;setSaving(true);const{id,...payload}=form;payload.updated_at=new Date();try{if(isEdit&&initial?.id)await supabase.from('products').update(payload).eq('id',initial.id);else await supabase.from('products').insert(payload);await onSaved();onClose()}catch(e){console.error(e)};setSaving(false)}
  const subcats=CATEGORIES[form.category]||[],isUSD=form.currency==='Dólares'||form.currency==='Euros',currLabel=form.currency==='Dólares'?'USD':'EUR'
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.92)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:12,backdropFilter:'blur(4px)'}}>
      <div style={{background:'#09091a',border:'1px solid rgba(255,255,255,0.08)',borderTop:'1px solid rgba(255,255,255,0.16)',borderRadius:18,padding:22,width:'100%',maxWidth:800,maxHeight:'95vh',overflowY:'auto',boxShadow:'0 32px 80px rgba(0,0,0,0.6)'}}>
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
          <Field label="Colores disponibles" value={form.colors} onChange={v=>setF('colors',v)} placeholder="Ej: Negro, Azul, Marrón"/>
          <Field label="Talles / Numeración" value={form.size_range} onChange={v=>setF('size_range',v)} placeholder="Ej: 35 al 47 · XS al 4XL"/>
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
              <div style={{marginLeft:8,padding:'4px 12px',borderRadius:6,background:'rgba(255,255,255,0.04)',border:`1px solid ${mStatus==='low'?c.rose:mStatus==='mid'?c.amber:c.border}`,display:'flex',gap:10,alignItems:'center'}}>
                <span style={{fontSize:10,color:c.muted}}>Margen:</span>
                <span style={{fontSize:13,fontWeight:800,color:mStatus==='low'?c.rose:mStatus==='mid'?c.amber:+form.margin>0?c.lime:c.rose}}>
                  {form.margin?`${form.margin}%`:'—'}{mStatus==='low'&&<span style={{fontSize:10,marginLeft:4}}>⚠️ bajo mínimo</span>}
                </span>
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
              style={{padding:'9px 20px',borderRadius:8,border:'none',background:`linear-gradient(135deg,${c.cyan},#0891b2)`,color:'#000',cursor:'pointer',fontSize:13,fontWeight:700,opacity:saving?0.6:1,boxShadow:form.name?`0 0 20px rgba(6,182,212,0.3)`:'none'}}>
              {saving?'Guardando...':isEdit?'💾 Guardar cambios':'💾 Agregar producto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ModalIA({suppliers, onClose, onSaved}) {
  useEscape(onClose)
  const [tab,setTab]=useState('pdf'),[input,setInput]=useState(''),[file,setFile]=useState(null)
  const [cotizacion,setCotizacion]=useState(''),[loading,setLoading]=useState(false)
  const [progress,setProgress]=useState(''),[extracted,setExtracted]=useState([])
  const [selected,setSelected]=useState(''),[saving,setSaving]=useState(false)
  const [editIdx,setEditIdx]=useState(null)
  const extract=async()=>{
    if(!input&&!file)return;setLoading(true);setExtracted([]);setSelected([])
    try{
      let content=[]
      if(file&&file.type==='application/pdf'){
        setProgress('Leyendo PDF...')
        const base64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=e=>res(e.target.result.split(',')[1]);r.onerror=rej;r.readAsDataURL(file)})
        content=[{type:'document',source:{type:'base64',media_type:'application/pdf',data:base64}},{type:'text',text:`Extraé TODOS los productos de este catálogo. Cotización USD: ${cotizacion||'no disponible'}. SOLO JSON array: [{"name":"","code":"","brand":"","model":"","short_desc":"","cost_price":0,"price_usd":0,"unit":"Unidad","norm":"","colors":"","size_range":"","product_type":"","category":"","rubros":[],"image_url":""}]`}]
      }else{
        setProgress('Leyendo archivo...')
        let text=input
        if(file){text=await new Promise((res,rej)=>{const r=new FileReader();r.onload=e=>res(e.target.result);r.onerror=rej;r.readAsText(file)})}
        if(tab==='sheets'&&input.includes('docs.google.com')){setProgress('Descargando Google Sheet...');const id=input.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];if(id){try{const r=await fetch(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv`);text=await r.text()}catch{}}}
        if(tab==='url'&&input.startsWith('http')){setProgress('Leyendo página...');try{const r=await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(input)}`);const html=await r.text();const tmp=document.createElement('div');tmp.innerHTML=html;text=tmp.innerText.substring(0,14000)}catch{text=`URL: ${input}`}}
        content=`Analizá este contenido y extraé TODOS los productos. Cotización USD: ${cotizacion||'no disponible'}\n\nCONTENIDO:\n${text.substring(0,13000)}\n\nSOLO JSON array:\n[{"name":"nombre","code":"código","brand":"marca","model":"modelo","short_desc":"desc","cost_price":número,"price_usd":número,"unit":"Unidad","norm":"norma","colors":"colores","size_range":"talles","product_type":"tipo","category":"🦺 EPP/👕 Ropa de trabajo/👟 Calzado de seguridad/🔥 Ignífugos/🚗 Equipamiento vehicular/🚧 Señalización/🧯 Contra incendios/🧗 Trabajo en alturas/🧴 Higiene y limpieza/🔧 Soldador/🧤 Guantes/⛓️ Cargas e izajes/⚠️ Detectores de gas/📱 Tecnología para el hogar/🏠 Flipping House & Bussines/📐 Proyectos/📲 App STEPS/🤖 IA para empresas/💡 Productos innovadores","rubros":["Oil & Gas"],"image_url":"url si existe"}]`
      }
      setProgress('Extrayendo con IA...')
      const result=await callClaude(content,'Extractor experto de catálogos industriales argentinos. SOLO JSON válido.',4000)
      const clean=result.replace(/```json|```/g,'').trim()
      const products=JSON.parse(clean)
      const enriched=products.map((p,i)=>({...p,_id:i,currency:'Pesos',status:'Activo',available:true,rubros:Array.isArray(p.rubros)?p.rubros:[],sale_price:p.cost_price?calcSale(p.cost_price,30):0,margin:p.cost_price?30:''}))
      setExtracted(enriched);setSelected(enriched.map((_,i)=>i));setProgress('')
    }catch(e){setProgress(`❌ Error: ${e.message}`)}
    setLoading(false)
  }
  const saveAll=async()=>{const toSave=extracted.filter((_,i)=>selected.includes(i));if(!toSave.length)return;setSaving(true);for(const p of toSave){const{_id,...payload}=p;payload.updated_at=new Date();await supabase.from('products').insert(payload)};await onSaved();onClose();setSaving(false)}
  const upd=(i,k,v)=>setExtracted(prev=>prev.map((p,idx)=>idx===i?{...p,[k]:v}:p))
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.92)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:12,backdropFilter:'blur(4px)'}}>
      <div style={{background:'#09091a',border:'1px solid rgba(255,255,255,0.08)',borderTop:'1px solid rgba(255,255,255,0.16)',borderRadius:18,padding:22,width:'100%',maxWidth:1000,maxHeight:'95vh',overflowY:'auto',boxShadow:'0 32px 80px rgba(0,0,0,0.6)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <div><div style={{fontSize:15,fontWeight:700}}>🤖 Carga masiva con IA</div><div style={{fontSize:11,color:c.sub,marginTop:2}}>PDF, CSV, Google Sheets o sitio web</div></div>
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
              style={{flex:1,padding:'8px',borderRadius:7,border:'none',cursor:'pointer',fontSize:12,fontWeight:tab===t.key?700:400,background:tab===t.key?c.cyan:'transparent',color:tab===t.key?'#000':c.sub,transition:'all .2s'}}>
              {t.label}
            </button>
          ))}
        </div>
        {tab==='pdf'?(
          <div style={{marginBottom:14}}>
            <div style={{border:`2px dashed ${file?c.lime:c.border}`,borderRadius:12,padding:20,textAlign:'center',marginBottom:10,cursor:'pointer',transition:'border-color .2s'}}
              onClick={()=>document.getElementById('ia-up').click()}
              onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor=c.cyan}}
              onDragLeave={e=>e.currentTarget.style.borderColor=file?c.lime:c.border}
              onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f){setFile(f);setInput('')}}}>
              <div style={{fontSize:28,marginBottom:6}}>{file?'✅':'📄'}</div>
              <div style={{fontSize:13,color:c.sub}}>{file?file.name:'Arrastrá o clic — PDF, CSV, TXT'}</div>
              {file?.type==='application/pdf'&&<div style={{fontSize:10,color:c.lime,marginTop:4}}>✓ PDF detectado — Claude lo lee nativo</div>}
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
            <div style={{fontSize:11,color:c.muted}}>{tab==='sheets'?'💡 El Sheet debe ser público o compartido.':'💡 Funciona mejor con páginas de texto visible.'}</div>
          </div>
        )}
        <button onClick={extract} disabled={loading||(!input&&!file)}
          style={{width:'100%',padding:'12px',borderRadius:10,border:'none',background:loading?'rgba(255,255,255,0.06)':`linear-gradient(135deg,${c.cyan},${c.violet})`,color:'#fff',cursor:'pointer',fontSize:14,fontWeight:700,marginBottom:16,opacity:(!input&&!file)?0.4:1,boxShadow:(!input&&!file)?'none':'0 0 30px rgba(6,182,212,0.2)',transition:'all .2s'}}>
          {loading?`⏳ ${progress||'Procesando...'}`:'🚀 Extraer productos con IA'}
        </button>
        {extracted.length>0&&(<>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10,flexWrap:'wrap',gap:8}}>
            <div>
              <span style={{fontSize:14,fontWeight:700,color:c.lime}}>✅ {extracted.length} productos encontrados</span>
              <span style={{fontSize:12,color:c.sub,marginLeft:8}}>{selected.length} seleccionados para guardar</span>
            </div>
            <div style={{display:'flex',gap:6}}>
              <button onClick={()=>setSelected(extracted.map((_,i)=>i))} style={{padding:'5px 10px',borderRadius:6,border:`1px solid ${c.lime}`,background:'transparent',color:c.lime,cursor:'pointer',fontSize:11}}>Todos</button>
              <button onClick={()=>setSelected([])} style={{padding:'5px 10px',borderRadius:6,border:`1px solid ${c.border}`,background:'transparent',color:c.sub,cursor:'pointer',fontSize:11}}>Ninguno</button>
            </div>
          </div>
          <div style={{overflowX:'auto',marginBottom:16,borderRadius:10,border:`1px solid ${c.border}`}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr style={{borderBottom:`1px solid ${c.border}`,background:'rgba(255,255,255,0.03)'}}>
                {['','Nombre','Marca','Tipo','Colores','USD','Costo $','Margen','Venta',''].map(h=>(
                  <th key={h} style={{padding:'8px 10px',textAlign:'left',color:c.sub,fontWeight:600,fontSize:10,textTransform:'uppercase'}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{extracted.map((p,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${c.border}`,background:selected.includes(i)?'rgba(6,182,212,0.03)':'transparent',opacity:selected.includes(i)?1:0.4,transition:'opacity .15s'}}>
                  <td style={{padding:'8px 10px',textAlign:'center'}}><input type="checkbox" checked={selected.includes(i)} onChange={()=>setSelected(prev=>prev.includes(i)?prev.filter(x=>x!==i):[...prev,i])}/></td>
                  <td style={{padding:'8px 10px',fontWeight:500,maxWidth:180}}>{editIdx===i?<input value={p.name} onChange={e=>upd(i,'name',e.target.value)} style={{...iStyle,padding:'4px 6px',fontSize:12}}/>:<span style={{display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</span>}</td>
                  <td style={{padding:'8px 10px',color:c.sub}}>{p.brand||'—'}</td>
                  <td style={{padding:'8px 10px'}}><span style={{fontSize:10,padding:'2px 7px',borderRadius:20,background:'rgba(6,182,212,0.1)',color:c.cyan,whiteSpace:'nowrap'}}>{p.product_type||'—'}</span></td>
                  <td style={{padding:'8px 10px',color:c.sub,fontSize:11,maxWidth:80,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.colors||'—'}</td>
                  <td style={{padding:'8px 10px',textAlign:'right',color:c.amber,fontWeight:600}}>{p.price_usd>0?`U$S ${p.price_usd}`:'—'}</td>
                  <td style={{padding:'8px 10px',textAlign:'right'}}>{editIdx===i?<input type="number" value={p.cost_price||''} onChange={e=>{upd(i,'cost_price',+e.target.value);upd(i,'sale_price',calcSale(+e.target.value,p.margin||30))}} style={{...iStyle,padding:'4px 6px',fontSize:12,width:80,textAlign:'right'}}/>:<span style={{color:c.amber,fontWeight:600}}>{fmtARS(p.cost_price)}</span>}</td>
                  <td style={{padding:'8px 10px',textAlign:'right'}}>{editIdx===i?<select value={p.margin||30} onChange={e=>{upd(i,'margin',+e.target.value);upd(i,'sale_price',calcSale(p.cost_price,+e.target.value))}} style={{...iStyle,padding:'4px 6px',fontSize:12,width:68}}>{MARGINS_QUICK.map(m=><option key={m} value={m} style={{background:'#12121f'}}>{m}%</option>)}</select>:<span style={{color:c.lime}}>{p.margin?`${p.margin}%`:'30%'}</span>}</td>
                  <td style={{padding:'8px 10px',textAlign:'right',fontWeight:700,color:c.lime}}>{fmtARS(p.sale_price)}</td>
                  <td style={{padding:'8px 10px',textAlign:'center'}}><button onClick={()=>setEditIdx(editIdx===i?null:i)} style={{background:'none',border:`1px solid ${c.border}`,borderRadius:5,color:c.muted,cursor:'pointer',fontSize:10,padding:'2px 6px'}}>{editIdx===i?'✓':'✏️'}</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'space-between',alignItems:'center',paddingTop:14,borderTop:`1px solid ${c.border}`}}>
            <div style={{fontSize:11,color:c.sub}}>Editá nombre, precio y margen con ✏️ antes de guardar</div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={onClose} style={{padding:'9px 18px',borderRadius:8,border:`1px solid ${c.border}`,background:'transparent',color:c.sub,cursor:'pointer',fontSize:13}}>Cancelar</button>
              <button onClick={saveAll} disabled={saving||!selected.length}
                style={{padding:'9px 20px',borderRadius:8,border:'none',background:`linear-gradient(135deg,${c.lime},#65a30d)`,color:'#000',cursor:'pointer',fontSize:13,fontWeight:700,opacity:(!selected.length||saving)?0.4:1,boxShadow:selected.length?'0 0 20px rgba(132,204,22,0.25)':'none'}}>
                {saving?'Guardando...':`💾 Guardar ${selected.length} productos`}
              </button>
            </div>
          </div>
        </>)}
      </div>
    </div>
  )
}

function ProductCard3D({ p, onDetail, onEdit, onDuplicate, onPrice, priceEditOpen, onSavePrice }) {
  const cardRef=useRef(null),[rot,setRot]=useState({x:0,y:0}),[hovered,setHovered]=useState(false)
  const age=priceAge(p.updated_at),mStatus=marginStatus(p.margin),priceStale=age!==null&&age>30
  const handleMove=(e)=>{const rect=cardRef.current?.getBoundingClientRect();if(!rect)return;const cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;setRot({x:((e.clientY-cy)/rect.height)*-10,y:((e.clientX-cx)/rect.width)*10})}
  const handleLeave=()=>{setRot({x:0,y:0});setHovered(false)},handleEnter=()=>setHovered(true)
  return (
    <div ref={cardRef} onMouseMove={handleMove} onMouseEnter={handleEnter} onMouseLeave={handleLeave}
      style={{borderRadius:18,overflow:'hidden',background:'linear-gradient(160deg,rgba(14,12,30,0.98),rgba(8,6,20,0.99))',
        border:`1px solid ${hovered?'rgba(232,134,10,0.6)':mStatus==='low'?'rgba(244,63,94,0.2)':'rgba(255,255,255,0.07)'}`,
        borderTop:`1px solid ${hovered?'rgba(232,134,10,0.8)':'rgba(255,255,255,0.14)'}`,
        boxShadow:hovered?'0 24px 64px rgba(0,0,0,0.6),0 0 0 1px rgba(232,134,10,0.3),0 0 40px rgba(232,134,10,0.15)':'0 4px 20px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.05)',
        transform:`perspective(900px) rotateX(${rot.x}deg) rotateY(${rot.y}deg) ${hovered?'translateY(-4px) scale(1.01)':'translateY(0) scale(1)'}`,
        transition:hovered?'box-shadow 0.2s,border-color 0.2s':'all 0.35s cubic-bezier(0.34,1.1,0.64,1)',
        position:'relative',cursor:'pointer'}}>
      {hovered&&<div style={{position:'absolute',top:0,left:'15%',right:'15%',height:1,background:'linear-gradient(90deg,transparent,rgba(232,134,10,0.8),transparent)',pointerEvents:'none',zIndex:3}}/>}
      <div style={{position:'absolute',top:8,right:8,zIndex:2,display:'flex',flexDirection:'column',gap:4,alignItems:'flex-end'}}>
        {mStatus==='low'&&p.cost_price>0&&<div style={{fontSize:9,fontWeight:700,background:'rgba(244,63,94,0.15)',color:'#f43f5e',padding:'2px 7px',borderRadius:20,border:'1px solid rgba(244,63,94,0.35)',backdropFilter:'blur(8px)'}}>⚠ {p.margin}%</div>}
        {priceStale&&<div style={{fontSize:9,fontWeight:600,background:'rgba(245,160,0,0.12)',color:'#f59e0b',padding:'2px 7px',borderRadius:20,border:'1px solid rgba(245,160,0,0.3)',backdropFilter:'blur(8px)'}}>🕐 {age}d</div>}
        {p.price_usd>0&&<div style={{fontSize:9,fontWeight:700,background:'rgba(232,134,10,0.85)',color:'#000',padding:'2px 7px',borderRadius:20}}>U$S {p.price_usd}</div>}
      </div>
      <div style={{height:190,overflow:'hidden',position:'relative',cursor:'pointer'}} onClick={onDetail}>
        {p.image_url?<img src={p.image_url} alt={p.name} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center',display:'block',transition:'transform 0.5s ease'}} onMouseEnter={e=>e.target.style.transform='scale(1.06)'} onMouseLeave={e=>e.target.style.transform='scale(1)'} onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex'}}/>:null}
        <div style={{display:p.image_url?'none':'flex',width:'100%',height:'100%',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,rgba(14,12,30,1),rgba(20,10,40,1))',fontSize:48,opacity:0.12}}>📦</div>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,transparent 50%,rgba(8,6,20,0.95) 100%)',pointerEvents:'none'}}/>
        {p.product_type&&<div style={{position:'absolute',bottom:8,left:10,right:10,fontSize:8,color:'rgba(232,134,10,0.9)',fontFamily:'var(--font-mono)',textTransform:'uppercase',letterSpacing:'0.1em',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.product_type}</div>}
      </div>
      <div style={{padding:'10px 12px',cursor:'pointer'}} onClick={onDetail}>
        <div style={{fontSize:12,fontWeight:700,lineHeight:1.35,marginBottom:6,fontFamily:'var(--font-display)',letterSpacing:'-0.01em',overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{p.name}</div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}>
          {p.brand&&<span style={{fontSize:9,color:'rgba(232,134,10,0.8)',fontWeight:600}}>{p.brand}</span>}
          {p.brand&&p.supplier_name&&<span style={{fontSize:9,color:'rgba(255,255,255,0.15)'}}>·</span>}
          {p.supplier_name&&<span style={{fontSize:9,color:'rgba(148,163,184,0.5)'}}>{p.supplier_name}</span>}
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
          {p.cost_price>0?<div><div style={{fontSize:8,color:'rgba(148,163,184,0.4)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:1}}>Costo</div><div style={{fontSize:13,fontWeight:800,color:'#f59e0b',fontFamily:'var(--font-mono)'}}>{fmtARS(p.cost_price)}</div></div>:<div style={{fontSize:9,color:'rgba(244,63,94,0.7)',fontWeight:600}}>Sin precio</div>}
          {p.sale_price>0&&<div style={{textAlign:'right'}}><div style={{fontSize:8,color:'rgba(148,163,184,0.4)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:1}}>Venta</div><div style={{fontSize:12,fontWeight:800,color:mStatus==='low'?'#f59e0b':'#84cc16',fontFamily:'var(--font-mono)'}}>{fmtARS(p.sale_price)}</div></div>}
        </div>
      </div>
      <div style={{display:'flex',borderTop:'1px solid rgba(255,255,255,0.05)'}}>
        {[{label:'✏️',action:onEdit,color:'rgba(6,182,212,0.8)'},{label:'📋',action:onDuplicate,color:'rgba(124,58,237,0.8)'},{label:'💲',action:onPrice,color:'rgba(232,134,10,0.8)'}].map((btn,i)=>(
          <button key={i} onClick={btn.action}
            style={{flex:1,padding:'7px',background:'none',border:'none',color:'rgba(148,163,184,0.4)',cursor:'pointer',fontSize:11,borderRight:i<2?'1px solid rgba(255,255,255,0.05)':'none',transition:'all 0.15s',fontFamily:'var(--font-body)'}}
            onMouseEnter={e=>{e.currentTarget.style.color=btn.color;e.currentTarget.style.background='rgba(255,255,255,0.03)'}}
            onMouseLeave={e=>{e.currentTarget.style.color='rgba(148,163,184,0.4)';e.currentTarget.style.background='none'}}>
            {btn.label}
          </button>
        ))}
      </div>
      {priceEditOpen&&<div style={{padding:8,borderTop:'1px solid rgba(255,255,255,0.05)'}}><PriceEditor product={p} onSave={onSavePrice}/></div>}
    </div>
  )
}

export default function CargaProductos() {
  const [products,setProducts]=useState([]),[suppliers,setSuppliers]=useState([])
  const [loading,setLoading]=useState(true),[modal,setModal]=useState(null)
  const [formMode,setFormMode]=useState('new'),[activeProduct,setActiveProduct]=useState(null)
  const [priceEdit,setPriceEdit]=useState(null)
  const [filters,setFilters]=useState({search:'',filterCat:'',filterType:'',filterBrand:'',filterSupplier:'',filterRubro:'',filterAvail:false,sortBy:'recent',view:'grid'})
  useEffect(()=>{loadAll()},[])
  const loadAll=async()=>{
    setLoading(true)
    const [{data:prods},{data:supps}]=await Promise.all([supabase.from('products').select('*').order('created_at',{ascending:false}),supabase.from('suppliers').select('id,name').order('name')])
    setProducts(prods||[]);setSuppliers(supps||[]);setLoading(false)
  }
  const openForm=(mode,product=null)=>{setFormMode(mode);setActiveProduct(product);setModal('form')}
  const deleteProduct=async id=>{if(!confirm('¿Eliminar este producto?'))return;await supabase.from('products').delete().eq('id',id);setModal(null);setActiveProduct(null);loadAll()}
  const {search,filterCat,filterType,filterBrand,filterSupplier,filterRubro,filterAvail,sortBy,view}=filters
  const filtered=useMemo(()=>{
    let arr=products.filter(p=>{
      const q=search.toLowerCase()
      const mSearch=!q||p.name?.toLowerCase().includes(q)||p.brand?.toLowerCase().includes(q)||p.code?.toLowerCase().includes(q)||p.supplier_name?.toLowerCase().includes(q)||p.colors?.toLowerCase().includes(q)||p.short_desc?.toLowerCase().includes(q)
      return mSearch&&(!filterCat||p.category===filterCat)&&(!filterType||p.product_type===filterType)&&(!filterSupplier||p.supplier_name===filterSupplier)&&(!filterBrand||p.brand===filterBrand)&&(!filterRubro||(p.rubros||[]).includes(filterRubro))&&(!filterAvail||p.available!==false)
    })
    if(sortBy==='name')arr=[...arr].sort((a,b)=>a.name?.localeCompare(b.name))
    else if(sortBy==='price_asc')arr=[...arr].sort((a,b)=>(+a.cost_price||0)-(+b.cost_price||0))
    else if(sortBy==='price_desc')arr=[...arr].sort((a,b)=>(+b.cost_price||0)-(+a.cost_price||0))
    else if(sortBy==='margin')arr=[...arr].sort((a,b)=>(+b.margin||0)-(+a.margin||0))
    else if(sortBy==='margin_low')arr=[...arr].sort((a,b)=>(+a.margin||999)-(+b.margin||999))
    return arr
  },[products,search,filterCat,filterType,filterBrand,filterSupplier,filterRubro,filterAvail,sortBy])
  const hasFilters=!!(search||filterCat||filterType||filterBrand||filterSupplier||filterRubro||filterAvail)
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:10}}>
        <div>
          <div style={{display:'flex',alignItems:'baseline',gap:10}}>
            <h2 style={{margin:0,fontSize:20,fontWeight:900,letterSpacing:'-0.04em',background:'linear-gradient(135deg,#f1f5f9,rgba(241,245,249,0.55))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Constelación</h2>
            <span style={{fontSize:11,color:'#475569',fontWeight:400,letterSpacing:'0.05em',fontStyle:'italic'}}>catálogo de activos STEPS</span>
          </div>
          <p style={{margin:'3px 0 0',color:c.sub,fontSize:11}}>{products.length} astros · {suppliers.length} proveedores</p>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button onClick={()=>setModal('bulk')} style={{padding:'8px 14px',borderRadius:9,border:'1px solid rgba(245,160,0,0.3)',background:'rgba(245,160,0,0.07)',color:c.amber,cursor:'pointer',fontSize:12,fontWeight:600,transition:'all .2s'}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(245,160,0,0.14)';e.currentTarget.style.borderColor='rgba(245,160,0,0.5)'}} onMouseLeave={e=>{e.currentTarget.style.background='rgba(245,160,0,0.07)';e.currentTarget.style.borderColor='rgba(245,160,0,0.3)'}}>⚡ Actualizar precios</button>
          <button onClick={()=>setModal('ia')} style={{padding:'8px 14px',borderRadius:9,border:'1px solid rgba(124,58,237,0.3)',background:'rgba(124,58,237,0.07)',color:'#a78bfa',cursor:'pointer',fontSize:12,fontWeight:600,transition:'all .2s'}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(124,58,237,0.14)';e.currentTarget.style.borderColor='rgba(124,58,237,0.5)'}} onMouseLeave={e=>{e.currentTarget.style.background='rgba(124,58,237,0.07)';e.currentTarget.style.borderColor='rgba(124,58,237,0.3)'}}>🤖 Carga masiva IA</button>
          <button onClick={()=>openForm('new')} style={{padding:'8px 18px',borderRadius:9,border:'none',background:`linear-gradient(135deg,${c.cyan},#0891b2)`,color:'#000',cursor:'pointer',fontSize:13,fontWeight:700,boxShadow:'0 0 20px rgba(6,182,212,0.25)',transition:'all .2s'}} onMouseEnter={e=>e.currentTarget.style.boxShadow='0 0 30px rgba(6,182,212,0.4)'} onMouseLeave={e=>e.currentTarget.style.boxShadow='0 0 20px rgba(6,182,212,0.25)'}>+ Agregar</button>
        </div>
      </div>
      {products.length>0&&<Tablero all={products} filtered={filtered} hasFilters={hasFilters}/>}
      {products.length>0&&<BusinessUnitsFilter products={products} suppliers={suppliers} filters={filters} onChange={setFilters}/>}
      {products.length===0&&!loading&&(
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
          {[{icon:'➕',title:'Carga manual',desc:'Formulario completo con tipo, colores, talles, rubros IA y calculadora USD/ARS.',color:c.cyan,action:()=>openForm('new')},{icon:'📄',title:'PDF / CSV / Texto',desc:'Subí el catálogo. La IA extrae productos, precios USD, colores y rubros.',color:c.violet,action:()=>setModal('ia')},{icon:'📊',title:'Google Sheets / Web',desc:'URL del sheet del proveedor. La IA lee todas las hojas.',color:c.amber,action:()=>setModal('ia')}].map((m,i)=>(
            <div key={i} onClick={m.action} style={{padding:20,borderRadius:14,border:`1px solid ${m.color}20`,background:`${m.color}05`,cursor:'pointer',transition:'all .25s'}} onMouseEnter={e=>{e.currentTarget.style.borderColor=`${m.color}50`;e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 8px 32px ${m.color}15`}} onMouseLeave={e=>{e.currentTarget.style.borderColor=`${m.color}20`;e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=''}}>
              <div style={{fontSize:28,marginBottom:10}}>{m.icon}</div>
              <div style={{fontSize:14,fontWeight:700,marginBottom:6}}>{m.title}</div>
              <div style={{fontSize:12,color:c.sub,lineHeight:1.5}}>{m.desc}</div>
              <div style={{marginTop:12,fontSize:12,color:m.color,fontWeight:600}}>Usar →</div>
            </div>
          ))}
        </div>
      )}
      {loading&&<div style={{textAlign:'center',padding:'60px 0',color:c.cyan}}><div style={{fontSize:32,marginBottom:8,animation:'pulse 1.5s infinite'}}>⚡</div><style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style><div style={{fontSize:12,color:c.sub}}>Cargando catálogo...</div></div>}
      {!loading&&view==='grid'&&filtered.length>0&&(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12}}>
          {filtered.map(p=><ProductCard3D key={p.id} p={p} onDetail={()=>{setActiveProduct(p);setModal('detail')}} onEdit={()=>openForm('edit',p)} onDuplicate={()=>openForm('duplicate',p)} onPrice={()=>setPriceEdit(priceEdit===p.id?null:p.id)} priceEditOpen={priceEdit===p.id} onSavePrice={()=>{setPriceEdit(null);loadAll()}}/>)}
        </div>
      )}
      {!loading&&view==='table'&&filtered.length>0&&(
        <div style={{overflowX:'auto',borderRadius:12,border:`1px solid ${c.border}`}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead><tr style={{borderBottom:`1px solid ${c.border}`,background:'rgba(255,255,255,0.025)'}}>
              {['Producto','Marca','Tipo','Colores','Talles','Proveedor','USD','Costo','Margen','Venta','Actualiz.',''].map(h=>(
                <th key={h} style={{padding:'10px 12px',textAlign:'left',fontSize:10,color:c.sub,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{filtered.map(p=>{
              const age=priceAge(p.updated_at),mStatus=marginStatus(p.margin)
              return(
                <tr key={p.id} style={{borderBottom:`1px solid ${c.border}`,transition:'background .1s'}} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{padding:'10px 12px'}}><div style={{display:'flex',alignItems:'center',gap:8}}>{p.image_url?<img src={p.image_url} alt="" style={{width:32,height:32,objectFit:'contain',borderRadius:4,background:'rgba(255,255,255,0.04)'}} onError={e=>e.target.style.display='none'}/>:<div style={{width:32,height:32,borderRadius:4,background:'rgba(255,255,255,0.04)',display:'flex',alignItems:'center',justifyContent:'center',opacity:0.2}}>📦</div>}<div><div style={{fontWeight:600}}>{p.name}</div>{p.code&&<div style={{fontSize:10,color:c.muted}}>{p.code}</div>}</div></div></td>
                  <td style={{padding:'10px 12px',color:c.sub}}>{p.brand||'—'}</td>
                  <td style={{padding:'10px 12px'}}>{p.product_type&&<span style={{fontSize:10,padding:'2px 7px',borderRadius:20,background:'rgba(6,182,212,0.08)',color:c.cyan,border:'1px solid rgba(6,182,212,0.2)'}}>{p.product_type}</span>}</td>
                  <td style={{padding:'10px 12px',color:c.sub,fontSize:11}}>{p.colors||'—'}</td>
                  <td style={{padding:'10px 12px',color:c.sub,fontSize:11}}>{p.size_range||'—'}</td>
                  <td style={{padding:'10px 12px',color:c.sub,fontSize:11}}>{p.supplier_name||'—'}</td>
                  <td style={{padding:'10px 12px',fontWeight:600,color:c.amber}}>{p.price_usd>0?`U$S ${p.price_usd}`:'—'}</td>
                  <td style={{padding:'10px 12px',fontWeight:700,color:p.cost_price?c.amber:c.rose}}>{p.cost_price?fmtARS(p.cost_price):'⚠️'}</td>
                  <td style={{padding:'10px 12px',fontWeight:700,color:mStatus==='low'?c.rose:mStatus==='mid'?c.amber:p.margin?c.lime:c.muted}}>{p.margin?`${p.margin}%`:'—'}{mStatus==='low'&&' ⚠'}</td>
                  <td style={{padding:'10px 12px',fontWeight:700,color:c.lime}}>{p.sale_price?fmtARS(p.sale_price):'—'}</td>
                  <td style={{padding:'10px 12px',fontSize:10,color:age>30?c.amber:age>7?c.sub:c.lime}}>{age===null?'—':age===0?'Hoy':age===1?'Ayer':`${age}d`}</td>
                  <td style={{padding:'10px 12px'}}><div style={{display:'flex',gap:4}}><button onClick={()=>openForm('edit',p)} style={{background:'none',border:`1px solid ${c.border}`,borderRadius:5,color:c.sub,cursor:'pointer',fontSize:10,padding:'3px 7px'}}>✏️</button><button onClick={()=>openForm('duplicate',p)} style={{background:'none',border:`1px solid ${c.border}`,borderRadius:5,color:c.sub,cursor:'pointer',fontSize:10,padding:'3px 7px'}}>📋</button><button onClick={()=>deleteProduct(p.id)} style={{background:'none',border:`1px solid ${c.rose}30`,borderRadius:5,color:c.rose,cursor:'pointer',fontSize:10,padding:'3px 7px'}}>🗑️</button></div></td>
                </tr>
              )
            })}</tbody>
          </table>
        </div>
      )}
      {!loading&&filtered.length===0&&products.length>0&&<div style={{textAlign:'center',padding:'40px 0',color:c.muted,fontSize:13}}>Sin resultados. Probá cambiando los filtros.</div>}
      {modal==='detail'&&activeProduct&&<ModalDetalle product={activeProduct} onClose={()=>{setModal(null);setActiveProduct(null)}} onEdit={()=>{setModal(null);openForm('edit',activeProduct)}} onDuplicate={()=>{setModal(null);openForm('duplicate',activeProduct)}} onDelete={()=>deleteProduct(activeProduct.id)}/>}
      {modal==='form'&&<ModalForm suppliers={suppliers} initial={activeProduct} mode={formMode} onClose={()=>{setModal(null);setActiveProduct(null)}} onSaved={loadAll}/>}
      {modal==='ia'&&<ModalIA suppliers={suppliers} onClose={()=>setModal(null)} onSaved={loadAll}/>}
      {modal==='bulk'&&<ModalActualizarPrecios products={products} onClose={()=>setModal(null)} onSaved={loadAll}/>}
    </div>
  )
}

function ModalDetalle({product:p,onClose,onEdit,onDuplicate,onDelete}) {
  useEscape(onClose)
  const age=priceAge(p.updated_at),mStatus=marginStatus(p.margin)
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.92)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:12,backdropFilter:'blur(4px)'}}>
      <div style={{background:'#09091a',border:'1px solid rgba(255,255,255,0.08)',borderTop:'1px solid rgba(255,255,255,0.16)',borderRadius:18,padding:22,width:'100%',maxWidth:580,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 32px 80px rgba(0,0,0,0.6)'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:14}}>
          <div style={{fontSize:15,fontWeight:700,flex:1,paddingRight:12}}>{p.name}</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:c.sub,cursor:'pointer',fontSize:22,flexShrink:0}}>×</button>
        </div>
        <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
          {mStatus==='low'&&<span style={{fontSize:10,padding:'3px 9px',borderRadius:20,background:`${c.rose}15`,color:c.rose,border:`1px solid ${c.rose}35`,fontWeight:700}}>⚠️ Margen bajo ({p.margin}%)</span>}
          {age>30&&<span style={{fontSize:10,padding:'3px 9px',borderRadius:20,background:`${c.amber}12`,color:c.amber,border:`1px solid ${c.amber}30`,fontWeight:600}}>🕐 Precio de hace {age} días</span>}
          {p.available===false&&<span style={{fontSize:10,padding:'3px 9px',borderRadius:20,background:`${c.rose}12`,color:c.rose,border:`1px solid ${c.rose}30`}}>No disponible</span>}
        </div>
        {p.image_url&&<img src={p.image_url} alt={p.name} style={{width:'100%',height:160,objectFit:'contain',borderRadius:10,background:'rgba(255,255,255,0.04)',marginBottom:14}} onError={e=>e.target.style.display='none'}/>}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
          {[{l:'Código',v:p.code},{l:'Marca',v:p.brand},{l:'Tipo',v:p.product_type},{l:'Categoría',v:p.category},{l:'Proveedor',v:p.supplier_name},{l:'Norma',v:p.norm},{l:'Colores',v:p.colors},{l:'Talles',v:p.size_range},{l:'Precio USD',v:p.price_usd>0?`U$S ${p.price_usd}`:null},{l:'Cotización',v:p.cotizacion?`$${p.cotizacion}`:null},{l:'Precio costo',v:p.cost_price?fmtARS(p.cost_price):null},{l:'Precio venta',v:p.sale_price?fmtARS(p.sale_price):null},{l:'Margen',v:p.margin?`${p.margin}%`:null},{l:'Unidad',v:p.unit},{l:'Stock',v:p.stock},{l:'Actualizado',v:age===0?'Hoy':age===1?'Ayer':age?`Hace ${age} días`:null}].filter(f=>f.v).map((f,i)=>(
            <div key={i} style={{padding:'8px 10px',borderRadius:8,background:'rgba(255,255,255,0.025)',border:`1px solid ${c.border}`}}>
              <div style={{fontSize:9,color:c.muted,textTransform:'uppercase',marginBottom:2,letterSpacing:'0.05em'}}>{f.l}</div>
              <div style={{fontSize:13,fontWeight:500}}>{f.v}</div>
            </div>
          ))}
        </div>
        {(p.rubros||[]).length>0&&<div style={{marginBottom:14,padding:10,borderRadius:8,background:'rgba(255,255,255,0.025)',border:`1px solid ${c.border}`}}><div style={{fontSize:9,color:c.muted,textTransform:'uppercase',marginBottom:6}}>Rubros</div><div style={{display:'flex',flexWrap:'wrap',gap:5}}>{p.rubros.map(r=><span key={r} style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:`${c.lime}08`,color:c.lime,border:`1px solid ${c.lime}20`}}>{r}</span>)}</div></div>}
        {p.description&&<div style={{padding:12,borderRadius:8,background:'rgba(255,255,255,0.025)',border:`1px solid ${c.border}`,marginBottom:14}}><div style={{fontSize:9,color:c.muted,textTransform:'uppercase',marginBottom:4}}>Descripción</div><div style={{fontSize:12,color:c.sub,lineHeight:1.6}}>{p.description}</div></div>}
        <div style={{display:'flex',gap:8,justifyContent:'space-between'}}>
          <button onClick={onDelete} style={{padding:'8px 12px',borderRadius:8,border:`1px solid ${c.rose}30`,background:'transparent',color:c.rose,cursor:'pointer',fontSize:12}}>🗑️ Eliminar</button>
          <div style={{display:'flex',gap:8}}>
            <button onClick={onDuplicate} style={{padding:'8px 14px',borderRadius:8,border:`1px solid ${c.border}`,background:'transparent',color:c.sub,cursor:'pointer',fontSize:12}}>📋 Duplicar</button>
            <button onClick={onEdit} style={{padding:'9px 18px',borderRadius:8,border:'none',background:`linear-gradient(135deg,${c.cyan},#0891b2)`,color:'#000',cursor:'pointer',fontSize:13,fontWeight:700}}>✏️ Editar</button>
          </div>
        </div>
      </div>
    </div>
  )
}
