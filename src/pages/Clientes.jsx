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
  blur: 'blur(24px) saturate(180%)',
}

const TIERS = [
  { key:'BASE',        label:'Cliente Base', color:'#9ca3af', glow:'rgba(156,163,175,0.4)', gradient:'linear-gradient(135deg,#6b7280,#d1d5db)', points:0 },
  { key:'PREFERENCIAL',label:'Preferencial', color:'#3b82f6', glow:'rgba(59,130,246,0.5)', gradient:'linear-gradient(135deg,#1d4ed8,#06b6d4)', points:20 },
  { key:'SELECTIVO',   label:'Selectivo',    color:'#6d28d9', glow:'rgba(109,40,217,0.5)', gradient:'linear-gradient(135deg,#4c1d95,#7c3aed)', points:50 },
  { key:'PREMIUM',     label:'Premium',      color:'#d97706', glow:'rgba(255,122,0,0.6)',   gradient:'linear-gradient(135deg,#92400e,#FF7A00,#f59e0b)', points:85 },
]

function calcScore(stats) {
  if (!stats) return 0
  const quotes   = Math.min(stats.total_quotes||0,20)/20*25
  const invoices = Math.min(stats.total_invoices||0,20)/20*25
  const revenue  = Math.min(stats.total_revenue||0,30000000)/30000000*25
  const cats     = Math.min(stats.product_categories||0,5)/5*15
  const prods    = Math.min(stats.total_products||0,50)/50*10
  return Math.min(100,Math.round(quotes+invoices+revenue+cats+prods))
}
function getTier(score) {
  if(score>=85)return TIERS[3]; if(score>=50)return TIERS[2]; if(score>=20)return TIERS[1]; return TIERS[0]
}

function TierIcon({ tier, size=40, active=false, pulse=false }) {
  const t=TIERS.find(t=>t.key===tier)||TIERS[0]
  const id=`tier_${tier}_${size}`
  const icons = {
    BASE:(
      <svg width={size} height={size} viewBox="0 0 100 100">
        <defs>
          <linearGradient id={`${id}_g`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#9ca3af"/><stop offset="50%" stopColor="#f3f4f6"/><stop offset="100%" stopColor="#6b7280"/></linearGradient>
          <filter id={`${id}_s`}><feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#9ca3af" floodOpacity="0.5"/></filter>
        </defs>
        <path d="M50 8 L82 22 L82 52 Q82 78 50 92 Q18 78 18 52 L18 22 Z" fill={`url(#${id}_g)`} filter={`url(#${id}_s)`}/>
        <path d="M50 18 L74 29 L74 52 Q74 72 50 83 Q26 72 26 52 L26 29 Z" fill="rgba(255,255,255,0.15)"/>
        <path d="M50 35 L53 44 L63 44 L55 50 L58 59 L50 53 L42 59 L45 50 L37 44 L47 44 Z" fill="rgba(255,255,255,0.7)"/>
      </svg>
    ),
    PREFERENCIAL:(
      <svg width={size} height={size} viewBox="0 0 100 100">
        <defs>
          <linearGradient id={`${id}_g`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#1d4ed8"/><stop offset="40%" stopColor="#3b82f6"/><stop offset="70%" stopColor="#06b6d4"/><stop offset="100%" stopColor="#0891b2"/></linearGradient>
          <filter id={`${id}_s`}><feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#06b6d4" floodOpacity="0.6"/></filter>
        </defs>
        <polygon points="50,5 88,40 50,95 12,40" fill={`url(#${id}_g)`} filter={`url(#${id}_s)`}/>
        <polygon points="50,5 88,40 50,40" fill="rgba(255,255,255,0.2)"/>
        <polygon points="50,5 12,40 50,40" fill="rgba(255,255,255,0.08)"/>
        <line x1="50" y1="5" x2="50" y2="95" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
        <line x1="12" y1="40" x2="88" y2="40" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
      </svg>
    ),
    SELECTIVO:(
      <svg width={size} height={size} viewBox="0 0 100 100">
        <defs>
          <radialGradient id={`${id}_g`} cx="40%" cy="35%" r="65%"><stop offset="0%" stopColor="#8b5cf6"/><stop offset="50%" stopColor="#6d28d9"/><stop offset="100%" stopColor="#2e1065"/></radialGradient>
          <radialGradient id={`${id}_shine`} cx="30%" cy="25%" r="40%"><stop offset="0%" stopColor="rgba(255,255,255,0.5)"/><stop offset="100%" stopColor="rgba(255,255,255,0)"/></radialGradient>
          <filter id={`${id}_s`}><feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#7c3aed" floodOpacity="0.7"/></filter>
        </defs>
        <circle cx="50" cy="50" r="40" fill={`url(#${id}_g)`} filter={`url(#${id}_s)`}/>
        <circle cx="50" cy="50" r="40" fill={`url(#${id}_shine)`}/>
        <ellipse cx="50" cy="50" rx="48" ry="14" fill="none" stroke="#8b5cf6" strokeWidth="2.5" opacity="0.6" transform="rotate(-20,50,50)"/>
        <ellipse cx="50" cy="50" rx="48" ry="14" fill="none" stroke="#a78bfa" strokeWidth="1.5" opacity="0.3" transform="rotate(25,50,50)"/>
        {[0,72,144,216,288].map((a,i)=><circle key={i} cx={50+38*Math.cos(a*Math.PI/180)} cy={50+38*Math.sin(a*Math.PI/180)} r="3" fill="#c4b5fd" opacity="0.8"/>)}
      </svg>
    ),
    PREMIUM:(
      <svg width={size} height={size} viewBox="0 0 100 100">
        <defs>
          <linearGradient id={`${id}_g`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#92400e"/><stop offset="30%" stopColor="#FF7A00"/><stop offset="60%" stopColor="#f59e0b"/><stop offset="100%" stopColor="#d97706"/></linearGradient>
          <linearGradient id={`${id}_e`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#fef3c7"/><stop offset="100%" stopColor="#fbbf24"/></linearGradient>
          <filter id={`${id}_s`}><feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#FF7A00" floodOpacity="0.8"/></filter>
        </defs>
        <path d="M15 65 L15 38 L30 55 L50 20 L70 55 L85 38 L85 65 Z" fill={`url(#${id}_g)`} filter={`url(#${id}_s)`}/>
        <path d="M15 65 L85 65 L80 72 L20 72 Z" fill={`url(#${id}_g)`}/>
        <circle cx="50" cy="22" r="5" fill={`url(#${id}_e)`}/>
        <circle cx="15" cy="40" r="4" fill={`url(#${id}_e)`}/>
        <circle cx="85" cy="40" r="4" fill={`url(#${id}_e)`}/>
        <path d="M25 45 L45 30" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  }
  return (
    <div style={{position:'relative',filter:active?`drop-shadow(0 0 ${size/3}px ${t.glow})`:'none',animation:pulse?'tierPulse 2s ease-in-out infinite':'none',transition:'filter 0.4s ease'}}>
      <style>{`@keyframes tierPulse{0%,100%{filter:drop-shadow(0 0 ${size/4}px ${t.glow});transform:scale(1);}50%{filter:drop-shadow(0 0 ${size/2}px ${t.glow});transform:scale(1.05);}}`}</style>
      {icons[tier]||icons.BASE}
    </div>
  )
}

function TierBar({ score, compact=false }) {
  const tier=getTier(score); const tierIdx=TIERS.findIndex(t=>t.key===tier.key)
  return (
    <div style={{marginTop:compact?8:16}}>
      <div style={{display:'flex',alignItems:'center',gap:compact?6:10,marginBottom:compact?6:8}}>
        {TIERS.map((t,i)=>{
          const isActive=tier.key===t.key, isPast=i<tierIdx
          return (
            <div key={t.key} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,flex:1}}>
              <div style={{opacity:isPast?0.5:isActive?1:0.25,transition:'opacity 0.4s,transform 0.4s',transform:isActive?'scale(1.1)':'scale(1)'}}>
                <TierIcon tier={t.key} size={compact?28:36} active={isActive} pulse={isActive}/>
              </div>
              {!compact&&<span style={{fontSize:9,fontWeight:isActive?800:500,color:isActive?t.color:w.sub,textTransform:'uppercase',letterSpacing:'0.05em',textAlign:'center',lineHeight:1.2,transition:'color 0.3s'}}>{t.label}</span>}
            </div>
          )
        })}
      </div>
      <div style={{height:compact?4:6,background:'rgba(0,0,0,0.08)',borderRadius:10,overflow:'hidden'}}>
        <div style={{height:'100%',borderRadius:10,width:`${score}%`,background:tier.gradient,boxShadow:`0 0 10px ${tier.glow}`,transition:'width 1s cubic-bezier(0.34,1.1,0.64,1)'}}/>
      </div>
    </div>
  )
}

function TierDetail({ stats }) {
  const score=calcScore(stats); const tier=getTier(score)
  const metrics=[
    {label:'Presupuestos emitidos',val:stats?.total_quotes||0,max:20,pts:25,icon:'📋'},
    {label:'Facturas emitidas',val:stats?.total_invoices||0,max:20,pts:25,icon:'🧾'},
    {label:'Monto facturado',val:stats?.total_revenue||0,max:30000000,pts:25,icon:'💰',money:true},
    {label:'Categorías de producto',val:stats?.product_categories||0,max:5,pts:15,icon:'📦'},
    {label:'Productos distintos',val:stats?.total_products||0,max:50,pts:10,icon:'🔧'},
  ]
  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{padding:'20px 24px',borderRadius:16,background:`linear-gradient(135deg,${tier.color}12,${tier.color}06)`,border:`1px solid ${tier.color}33`,display:'flex',alignItems:'center',gap:20}}>
        <TierIcon tier={tier.key} size={56} active pulse/>
        <div>
          <div style={{fontSize:11,color:w.sub,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em'}}>Categoría actual</div>
          <div style={{fontSize:22,fontWeight:900,color:tier.color,fontFamily:"'Syne',sans-serif",marginTop:2}}>{tier.label}</div>
          <div style={{fontSize:12,color:w.muted,marginTop:4}}>Puntaje: <strong style={{color:tier.color,fontFamily:"'Space Mono',monospace"}}>{score}/100</strong></div>
        </div>
        <div style={{flex:1}}><TierBar score={score}/></div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {metrics.map(m=>{
          const pct=Math.min(100,(m.val/m.max)*100); const contribution=(pct/100)*m.pts
          return (
            <div key={m.label}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                <span style={{fontSize:12,color:w.muted}}>{m.icon} {m.label}</span>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <span style={{fontSize:11,color:w.sub,fontFamily:"'Space Mono',monospace"}}>{m.money?`$${(m.val/1000000).toFixed(1)}M`:m.val} / {m.money?`$${(m.max/1000000).toFixed(0)}M`:m.max}</span>
                  <span style={{fontSize:11,fontWeight:700,color:tier.color,fontFamily:"'Space Mono',monospace"}}>+{contribution.toFixed(1)}pts</span>
                </div>
              </div>
              <div style={{height:6,background:'rgba(0,0,0,0.07)',borderRadius:6,overflow:'hidden'}}>
                <div style={{height:'100%',borderRadius:6,width:`${pct}%`,background:tier.gradient,boxShadow:`0 0 8px ${tier.glow}`,transition:'width 0.8s cubic-bezier(0.34,1.1,0.64,1)'}}/>
              </div>
            </div>
          )
        })}
      </div>
      {tier.key!=='PREMIUM'&&(()=>{
        const nextIdx=TIERS.findIndex(t=>t.key===tier.key)+1; const next=TIERS[nextIdx]; const needed=next.points-score
        return (
          <div style={{padding:'12px 16px',borderRadius:12,background:`${next.color}0a`,border:`1px dashed ${next.color}33`,display:'flex',alignItems:'center',gap:12}}>
            <TierIcon tier={next.key} size={28}/>
            <div style={{fontSize:12,color:w.muted}}>Faltan <strong style={{color:next.color}}>{needed} puntos</strong> para alcanzar <strong style={{color:next.color}}>{next.label}</strong></div>
          </div>
        )
      })()}
    </div>
  )
}

// ── PROVINCES ─────────────────────────────────────────────────────────────────
const PROVINCES_CITIES = {
  'Buenos Aires':['La Plata','Mar del Plata','Bahía Blanca','Quilmes','Lanús','Lomas de Zamora','San Justo','Tigre','Morón','Tandil','Junín','Pergamino','Olavarría','Necochea','Zárate'],
  'CABA':['Palermo','Belgrano','Caballito','Recoleta','San Telmo','Flores','Almagro','Villa Urquiza','Núñez'],
  'Catamarca':['San Fernando del Valle de Catamarca','Santa María','Andalgalá','Tinogasta','Belén'],
  'Chaco':['Resistencia','Presidencia Roque Sáenz Peña','Villa Ángela','Barranqueras','Fontana'],
  'Chubut':['Rawson','Comodoro Rivadavia','Trelew','Puerto Madryn','Esquel','Sarmiento'],
  'Córdoba':['Córdoba','Villa María','Río Cuarto','San Francisco','Villa Carlos Paz','Alta Gracia'],
  'Corrientes':['Corrientes','Goya','Paso de los Libres','Curuzú Cuatiá','Mercedes'],
  'Entre Ríos':['Paraná','Concordia','Gualeguaychú','Concepción del Uruguay','Colón'],
  'Formosa':['Formosa','Clorinda','Pirané','General Mosconi'],
  'Jujuy':['San Salvador de Jujuy','San Pedro de Jujuy','Palpalá','Libertador General San Martín'],
  'La Pampa':['Santa Rosa','General Pico','Toay','Victorica','General Acha'],
  'La Rioja':['La Rioja','Chilecito','Aimogasta','Chamical'],
  'Mendoza':['Mendoza','San Rafael','Godoy Cruz','Luján de Cuyo','Maipú','Las Heras','Guaymallén'],
  'Misiones':['Posadas','Oberá','Eldorado','Puerto Rico','Apóstoles'],
  'Neuquén':['Neuquén','San Martín de los Andes','Zapala','Cutral Có','Plaza Huincul','Centenario','Cipolletti','Catriel','Rincón de los Sauces','Añelo','Las Lajas','Chos Malal'],
  'Río Negro':['Viedma','Bariloche','General Roca','Cipolletti','Allen','Catriel','Sierra Grande','El Bolsón'],
  'Salta':['Salta','San Ramón de la Nueva Orán','Tartagal','Metán','Cafayate'],
  'San Juan':['San Juan','Rawson','Chimbas','Rivadavia','Caucete'],
  'San Luis':['San Luis','Villa Mercedes','Merlo'],
  'Santa Cruz':['Río Gallegos','Caleta Olivia','El Calafate','Puerto Deseado'],
  'Santa Fe':['Santa Fe','Rosario','Rafaela','Venado Tuerto','Santo Tomé','Reconquista'],
  'Santiago del Estero':['Santiago del Estero','La Banda','Termas de Río Hondo','Añatuya'],
  'Tierra del Fuego':['Ushuaia','Río Grande','Tolhuin'],
  'Tucumán':['San Miguel de Tucumán','Yerba Buena','Tafí Viejo','Concepción'],
}
const PROVINCE_LIST = Object.keys(PROVINCES_CITIES).sort()
const INDUSTRIES       = ['Oil & Gas','Construcción','Geotécnica','Transporte','Ingeniería','Minería','Agro','Energía','Manufactura','Otro']
const SECTORS          = ['Perforación','Mantenimiento','Logística','Producción','Construcción de pozo','Completación','Servicios','Seguridad industrial','Otro']
const EMPLOYEE_RANGES  = ['1-10','11-50','51-200','201-500','500+']
const ZONES            = ['Neuquén','Río Negro','Mendoza','La Pampa','Chubut','Santa Cruz','Offshore','Nacional','Internacional']
const IVA_CONDITIONS   = ['Responsable Inscripto','Monotributista','Exento','Consumidor Final']
const PAYMENT_CONDITIONS = ['ANTICIPADO','TRANSFERENCIA ENTREGA','CHEQUE 30 DÍAS','CHEQUE 60 DÍAS','CUENTA CORRIENTE 30 DÍAS','CUENTA CORRIENTE 60 DÍAS']
const DELIVERY_CONDITIONS= ['ENVÍO A OBRA','RETIRA EN DEPÓSITO','ENVÍO A OFICINA','FLETE A CARGO DEL CLIENTE','A DEFINIR']
const CONTACT_PREFS    = ['WhatsApp','Mail','Llamada','Reunión presencial']
const FREQUENCIES      = ['Semanal','Mensual','Trimestral','Semestral','Por proyecto','Esporádico']
const VIAS             = ['WhatsApp','Mail','Llamada','Referido','LinkedIn','Visita','Instagram','Otro']
const STATUSES = [
  {key:'LEAD',label:'Lead',color:w.cyan},
  {key:'CONTACTAR',label:'A contactar',color:w.amber},
  {key:'EN_CONTACTO',label:'En contacto',color:w.orange},
  {key:'PROSPECTO',label:'Prospecto',color:w.violet},
  {key:'ACTIVO',label:'Activo',color:w.lime},
  {key:'INACTIVO',label:'Inactivo',color:w.muted},
]

function getStatusMeta(key){return STATUSES.find(s=>s.key===key)||STATUSES[0]}
function getFavicon(website){if(!website)return null;try{const url=website.startsWith('http')?website:`https://${website}`;return`https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`}catch{return null}}
function daysAgo(dateStr){if(!dateStr)return null;return Math.floor((Date.now()-new Date(dateStr))/86400000)}
function fmtMoney(n){if(!n)return '$0';if(n>=1000000)return`$${(n/1000000).toFixed(1)}M`;if(n>=1000)return`$${(n/1000).toFixed(0)}k`;return`$${n}`}

const EMPTY_CLIENT = {
  status:'LEAD',name:'',cuit:'',industry:'',sector:'',employees_range:'',operation_zone:'',
  current_supplier:'',iva_condition:'Responsable Inscripto',website:'',logo_url:'',
  contact_name:'',contact_role:'',phone:'',phone_corporate:'',email:'',whatsapp:'',login_email:'',
  contact_preference:'WhatsApp',best_contact_time:'',decision_maker:'',buyer_contact:'',
  city:'',province:'Neuquén',address:'',payment_condition:'ANTICIPADO',
  delivery_condition:'ENVÍO A OBRA',discount_pct:0,credit_days:0,credit_limit:0,
  uses_purchase_order:false,regular_products:'',purchase_frequency:'Mensual',
  next_estimated_purchase:'',renewal_date:'',services:'',via:'',
  next_action:'',next_action_date:'',notes:'',
}

// ── KPI CARD ──────────────────────────────────────────────────────────────────
function KpiCard({ value, label, color, sub }) {
  const [hov,setHov]=useState(false); const ref=useRef()
  const onMove=e=>{const r=ref.current?.getBoundingClientRect();if(!r)return;ref.current.style.setProperty('--sx',`${((e.clientX-r.left)/r.width)*100}%`);ref.current.style.setProperty('--sy',`${((e.clientY-r.top)/r.height)*100}%`)}
  return (
    <div ref={ref} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onMouseMove={onMove}
      style={{flex:'1 1 0',minWidth:100,padding:'14px 18px',borderRadius:16,background:hov?w.cardHover:w.card,backdropFilter:w.blur,WebkitBackdropFilter:w.blur,border:`1px solid ${hov?color+'44':w.border}`,boxShadow:hov?`0 8px 32px ${color}22`:'0 2px 12px rgba(0,0,0,0.06)',transition:'all 0.3s cubic-bezier(0.34,1.4,0.64,1)',transform:hov?'translateY(-3px) scale(1.02)':'none',cursor:'default',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',inset:0,borderRadius:16,pointerEvents:'none',background:`radial-gradient(circle 80px at var(--sx,50%) var(--sy,50%),${color}18,transparent 70%)`}}/>
      <div style={{fontSize:22,fontWeight:800,color,fontFamily:"'Space Mono',monospace"}}>{value}</div>
      <div style={{fontSize:11,color:w.muted,marginTop:3,fontWeight:600}}>{label}</div>
      {sub&&<div style={{fontSize:10,color:w.sub,marginTop:2}}>{sub}</div>}
    </div>
  )
}

// ── CLIENT CARD ───────────────────────────────────────────────────────────────
function ClientCard({ client, stats, onClick }) {
  const [hov,setHov]=useState(false); const ref=useRef()
  const status=getStatusMeta(client.status); const score=calcScore(stats); const tier=getTier(score)
  const favicon=getFavicon(client.website); const days=daysAgo(client.last_contact); const isInactive=days!==null&&days>60
  const onMove=e=>{const r=ref.current?.getBoundingClientRect();if(!r)return;ref.current.style.setProperty('--sx',`${((e.clientX-r.left)/r.width)*100}%`);ref.current.style.setProperty('--sy',`${((e.clientY-r.top)/r.height)*100}%`)}
  return (
    <div ref={ref} onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onMouseMove={onMove}
      style={{background:hov?w.cardHover:w.card,backdropFilter:w.blur,WebkitBackdropFilter:w.blur,border:`1px solid ${hov?w.borderHover:w.border}`,borderRadius:18,boxShadow:hov?'0 12px 40px rgba(255,122,0,0.12),inset 0 1px 0 rgba(255,255,255,0.9)':'0 2px 16px rgba(0,0,0,0.06),inset 0 1px 0 rgba(255,255,255,0.8)',padding:'16px 18px',cursor:'pointer',position:'relative',overflow:'hidden',transform:hov?'translateY(-4px) scale(1.01)':'none',transition:'all 0.3s cubic-bezier(0.34,1.4,0.64,1)'}}>
      <div style={{position:'absolute',inset:0,borderRadius:18,pointerEvents:'none',background:`radial-gradient(circle 100px at var(--sx,50%) var(--sy,50%),rgba(255,122,0,0.07),transparent 70%)`}}/>
      <div style={{position:'absolute',top:0,left:'10%',right:'10%',height:1,background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.9),transparent)'}}/>
      <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
        <div style={{width:42,height:42,borderRadius:12,flexShrink:0,background:`linear-gradient(135deg,${status.color}22,${status.color}44)`,border:`1.5px solid ${status.color}33`,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',fontSize:17,fontWeight:800,color:status.color}}>
          {favicon?<img src={favicon} alt="" style={{width:26,height:26,objectFit:'contain'}} onError={e=>{e.target.style.display='none'}}/>:client.name?.charAt(0)?.toUpperCase()||'?'}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:7,flexWrap:'wrap'}}>
            <span style={{fontSize:13,fontWeight:700,color:w.text,fontFamily:"'Syne',sans-serif"}}>{client.name}</span>
            <span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:20,background:status.color+'18',color:status.color,border:`1px solid ${status.color}33`,textTransform:'uppercase',letterSpacing:'0.07em'}}>{status.label}</span>
          </div>
          <div style={{display:'flex',gap:8,marginTop:3,flexWrap:'wrap'}}>
            {client.industry&&<span style={{fontSize:11,color:w.muted}}>{client.industry}</span>}
            {client.city&&<span style={{fontSize:11,color:w.sub}}>📍 {client.city}</span>}
          </div>
          <div style={{display:'flex',gap:10,marginTop:7,flexWrap:'wrap',alignItems:'center'}}>
            <span style={{fontSize:11,color:w.muted}}>📋 <strong style={{color:w.text}}>{stats?.total_quotes||0}</strong></span>
            <span style={{fontSize:11,color:w.muted}}>🧾 <strong style={{color:w.text}}>{stats?.total_invoices||0}</strong></span>
            {client.purchase_frequency&&<span style={{fontSize:10,color:w.sub}}>🔄 {client.purchase_frequency}</span>}
            {days!==null&&<span style={{fontSize:10,color:isInactive?w.rose:w.sub,marginLeft:'auto'}}>{isInactive?'⚠ ':''}{days===0?'Hoy':days===1?'Ayer':`${days}d`}</span>}
            {client.whatsapp&&<a href={`https://wa.me/${client.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{fontSize:14,textDecoration:'none',opacity:hov?1:0.35,transition:'opacity 0.2s'}}>💬</a>}
          </div>
        </div>
      </div>
      <TierBar score={score} compact/>
    </div>
  )
}

// ── TABLE ROW ─────────────────────────────────────────────────────────────────
function ClientRow({ client, stats, onClick }) {
  const [hov,setHov]=useState(false)
  const status=getStatusMeta(client.status); const score=calcScore(stats); const tier=getTier(score)
  const favicon=getFavicon(client.website); const days=daysAgo(client.last_contact)
  return (
    <tr onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{cursor:'pointer',background:hov?'rgba(255,122,0,0.04)':'transparent',transition:'background 0.15s'}}>
      <td style={{padding:'11px 16px'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:30,height:30,borderRadius:8,flexShrink:0,overflow:'hidden',background:`linear-gradient(135deg,${status.color}22,${status.color}44)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:status.color}}>
            {favicon?<img src={favicon} alt="" style={{width:18,height:18,objectFit:'contain'}} onError={e=>{e.target.style.display='none'}}/>:client.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:w.text}}>{client.name}</div>
            {client.cuit&&<div style={{fontSize:10,color:w.sub,fontFamily:"'Space Mono',monospace"}}>{client.cuit}</div>}
          </div>
        </div>
      </td>
      <td style={{padding:'11px 8px'}}><span style={{fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:20,background:status.color+'18',color:status.color,border:`1px solid ${status.color}33`,textTransform:'uppercase',letterSpacing:'0.07em',whiteSpace:'nowrap'}}>{status.label}</span></td>
      <td style={{padding:'11px 8px',fontSize:11,color:w.muted}}>{client.industry||'—'}</td>
      <td style={{padding:'11px 8px',fontSize:11,color:w.muted}}>{client.contact_name||'—'}</td>
      <td style={{padding:'11px 8px',fontSize:11,color:w.sub}}>{client.city||'—'}</td>
      <td style={{padding:'11px 8px',fontSize:11,color:w.orange,fontFamily:"'Space Mono',monospace",fontWeight:700}}>{stats?.total_revenue>0?fmtMoney(stats.total_revenue):'—'}</td>
      <td style={{padding:'11px 8px',fontSize:11,fontFamily:"'Space Mono',monospace",color:w.text,fontWeight:700,textAlign:'center'}}>{stats?.total_quotes||0}</td>
      <td style={{padding:'11px 8px',fontSize:11,fontFamily:"'Space Mono',monospace",color:w.text,fontWeight:700,textAlign:'center'}}>{stats?.total_invoices||0}</td>
      <td style={{padding:'11px 8px',fontSize:11,color:days!==null&&days>60?w.rose:w.sub}}>{days!==null?(days===0?'Hoy':days===1?'Ayer':`${days}d`):'—'}</td>
      <td style={{padding:'11px 8px'}}><div style={{display:'flex',alignItems:'center',gap:6}}><TierIcon tier={tier.key} size={20} active/><span style={{fontSize:10,color:tier.color,fontWeight:700}}>{tier.label}</span></div></td>
    </tr>
  )
}

// ── CONTACT ITEM ──────────────────────────────────────────────────────────────
function ContactItem({ contact, onRemove }) {
  return (
    <div style={{display:'flex',gap:10,alignItems:'center',padding:'10px 14px',borderRadius:12,background:'rgba(255,255,255,0.6)',border:`1px solid ${w.border}`,flexWrap:'wrap'}}>
      <div style={{flex:1,minWidth:120}}>
        <div style={{fontSize:13,fontWeight:700,color:w.text}}>{contact.name}</div>
        {contact.role&&<div style={{fontSize:11,color:w.muted}}>{contact.role}</div>}
      </div>
      {contact.phone&&<span style={{fontSize:11,color:w.muted}}>📞 {contact.phone}</span>}
      {contact.email&&<span style={{fontSize:11,color:w.muted}}>✉ {contact.email}</span>}
      {contact.whatsapp&&<a href={`https://wa.me/${contact.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{fontSize:14,textDecoration:'none'}}>💬</a>}
      {contact.is_primary&&<span style={{fontSize:9,fontWeight:700,color:w.orange,background:w.orangeLight,padding:'2px 6px',borderRadius:8}}>PRINCIPAL</span>}
      <button onClick={onRemove} style={{background:'none',border:'none',cursor:'pointer',color:w.rose,fontSize:16,padding:'0 2px',lineHeight:1}}>×</button>
    </div>
  )
}

// ── PROVINCE CITY ─────────────────────────────────────────────────────────────
function ProvinceCity({ province, city, onProvince, onCity }) {
  const [citySearch,setCitySearch]=useState(city||''); const [showCities,setShowCities]=useState(false)
  const cities=(province&&PROVINCES_CITIES[province])||[]; const filtered=cities.filter(c=>c.toLowerCase().includes(citySearch.toLowerCase()))
  const selectCity=c=>{onCity(c);setCitySearch(c);setShowCities(false)}
  useEffect(()=>{setCitySearch(city||'')},[city])
  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
      <div>
        <div style={{fontSize:11,fontWeight:700,color:w.sub,marginBottom:4,textTransform:'uppercase',letterSpacing:'0.06em'}}>Provincia</div>
        <select value={province||''} onChange={e=>{onProvince(e.target.value);onCity('');setCitySearch('')}} style={{width:'100%',padding:'10px 14px',borderRadius:10,border:`1px solid ${w.border}`,background:'rgba(255,255,255,0.7)',color:w.text,fontSize:13,outline:'none'}}>
          <option value="">— Seleccionar —</option>
          {PROVINCE_LIST.map(p=><option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div style={{position:'relative'}}>
        <div style={{fontSize:11,fontWeight:700,color:w.sub,marginBottom:4,textTransform:'uppercase',letterSpacing:'0.06em'}}>Ciudad / Localidad</div>
        <input value={citySearch} onChange={e=>{setCitySearch(e.target.value);setShowCities(true)}} onFocus={()=>setShowCities(true)} onBlur={()=>setTimeout(()=>setShowCities(false),150)} placeholder={province?'Escribir para buscar...':'Primero elegí provincia'} disabled={!province} style={{width:'100%',padding:'10px 14px',borderRadius:10,border:`1px solid ${w.border}`,background:province?'rgba(255,255,255,0.7)':'rgba(0,0,0,0.04)',color:w.text,fontSize:13,outline:'none',boxSizing:'border-box',opacity:province?1:0.5}}/>
        {showCities&&filtered.length>0&&(
          <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:100,marginTop:4,background:'rgba(255,255,255,0.97)',border:`1px solid ${w.border}`,borderRadius:10,boxShadow:'0 8px 24px rgba(0,0,0,0.12)',maxHeight:180,overflowY:'auto'}}>
            {filtered.map(c=><div key={c} onClick={()=>selectCity(c)} style={{padding:'9px 14px',fontSize:13,color:w.text,cursor:'pointer'}} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,122,0,0.08)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>{c}</div>)}
          </div>
        )}
      </div>
    </div>
  )
}

function PillSelector({ value, options, onChange }) {
  return (
    <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
      {options.map(o=>(
        <button key={o} onClick={()=>onChange(o)} style={{fontSize:11,padding:'6px 14px',borderRadius:20,cursor:'pointer',border:`1px solid ${value===o?w.orange+'44':w.border}`,background:value===o?w.orangeLight:'rgba(255,255,255,0.6)',color:value===o?w.orange:w.muted,fontWeight:600,transition:'all 0.2s',whiteSpace:'nowrap'}}>{o}</button>
      ))}
    </div>
  )
}

// ── CLIENT HISTORY (CRM tab) ──────────────────────────────────────────────────
function ClientHistory({ clientId, clientName }) {
  const [quotes,     setQuotes]     = useState([])
  const [invoices,   setInvoices]   = useState([])
  const [operations, setOperations] = useState([])
  const [loading,    setLoading]    = useState(true)

  useEffect(()=>{
    if(!clientId){setLoading(false);return}
    const load=async()=>{
      setLoading(true)
      const[qRes,iRes,oRes]=await Promise.all([
        supabase.from('quotes').select('id,number,date,status,total,neto,expires_at').eq('client_id',clientId).order('date',{ascending:false}),
        supabase.from('invoices').select('id,number,tipo,date,total,status').eq('client_id',clientId).order('date',{ascending:false}),
        supabase.from('operations').select('id,number,name,date,status,total_venta,ganancia,rentabilidad').eq('client_id',clientId).order('date',{ascending:false}),
      ])
      setQuotes(qRes.data||[])
      setInvoices(iRes.data||[])
      setOperations(oRes.data||[])
      setLoading(false)
    }
    load()
  },[clientId])

  const fmtMon=n=>{const v=parseFloat(n)||0;return v>=1e6?`$${(v/1e6).toFixed(2)}M`:v>=1e3?`$${(v/1e3).toFixed(0)}k`:`$${v}`}
  const fmtDt=d=>{if(!d)return '—';return new Date(d+'T12:00:00').toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'2-digit'})}

  const QUOTE_ST={BORRADOR:{l:'Borrador',c:'#8E8E93'},ENVIADO:{l:'Enviado',c:'#0A84FF'},EN_REVISION:{l:'En revisión',c:'#FF9F0A'},APROBADO:{l:'Aprobado',c:'#28CD41'},RECHAZADO:{l:'Rechazado',c:'#FF3B30'},VENCIDO:{l:'Vencido',c:'#BF5AF2'}}
  const INV_ST={EMITIDA:{l:'Emitida',c:'#0A84FF'},COBRADA:{l:'Cobrada',c:'#28CD41'},PENDIENTE:{l:'Pendiente',c:'#FF9F0A'},VENCIDA:{l:'Vencida',c:'#FF3B30'},ANULADA:{l:'Anulada',c:'#8E8E93'}}
  const OP_ST={CONSULTA:{l:'Consulta',c:'#8884A8'},PRESUPUESTADO:{l:'Presupuestado',c:'#3B82F6'},OC_RECIBIDA:{l:'OC Recibida',c:'#8B5CF6'},FACTURADO:{l:'Facturado',c:'#F59E0B'},COBRADO:{l:'Cobrado',c:'#06B6D4'},EN_ENTREGA:{l:'En entrega',c:'#E8860A'},CERRADO:{l:'Cerrado',c:'#22C55E'}}

  const openNewQuote=()=>{
    localStorage.setItem('steps_new_quote_client',JSON.stringify({name:clientName,id:clientId}))
    window.location.href='/presupuestos'
  }

  if(loading) return <div style={{textAlign:'center',padding:'40px 0',color:w.muted}}>Cargando historial...</div>

  const timeline=[
    ...quotes.map(q=>({type:'quote',date:q.date,data:q})),
    ...invoices.map(i=>({type:'invoice',date:i.date,data:i})),
    ...operations.map(o=>({type:'operation',date:o.date,data:o})),
  ].sort((a,b)=>new Date(b.date)-new Date(a.date))

  const totalFacturado  = invoices.reduce((s,i)=>s+(i.total||0),0)
  const totalPptos      = quotes.reduce((s,q)=>s+(q.total||0),0)
  const gananciaTotal   = operations.reduce((s,o)=>s+(o.ganancia||0),0)

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>

      {/* Resumen financiero */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
        {[
          {label:'Total facturado', value:fmtMon(totalFacturado), color:w.lime,  icon:'💰'},
          {label:'Presupuestado',   value:fmtMon(totalPptos),     color:w.orange, icon:'📋'},
          {label:'Ganancia total',  value:fmtMon(gananciaTotal),  color:w.amber, icon:'📈'},
        ].map(k=>(
          <div key={k.label} style={{padding:'14px 16px',borderRadius:14,background:`${k.color}10`,border:`1px solid ${k.color}25`,textAlign:'center'}}>
            <div style={{fontSize:18,marginBottom:4}}>{k.icon}</div>
            <div style={{fontSize:16,fontWeight:900,color:k.color,fontFamily:"'Space Mono',monospace"}}>{k.value}</div>
            <div style={{fontSize:10,color:w.muted,marginTop:3,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Botón nuevo presupuesto */}
      <button onClick={openNewQuote}
        style={{padding:'12px 20px',borderRadius:12,border:`1.5px solid ${w.orange}44`,
          background:w.orangeLight,color:w.orange,fontSize:13,fontWeight:700,cursor:'pointer',
          display:'flex',alignItems:'center',gap:8,justifyContent:'center',transition:'all 0.2s'}}
        onMouseEnter={e=>e.currentTarget.style.background='rgba(255,122,0,0.2)'}
        onMouseLeave={e=>e.currentTarget.style.background=w.orangeLight}>
        📋 Crear nuevo presupuesto para {clientName}
      </button>

      {/* Contadores rápidos */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,padding:'14px 16px',borderRadius:14,background:'rgba(0,0,0,0.03)',border:`1px solid ${w.border}`}}>
        {[
          {label:'Presupuestos', value:quotes.length,     sub:`${quotes.filter(q=>q.status==='APROBADO').length} aprobados`},
          {label:'Facturas',     value:invoices.length,   sub:`${invoices.filter(i=>i.status==='COBRADA').length} cobradas`},
          {label:'Operaciones',  value:operations.length, sub:`${operations.filter(o=>o.status==='CERRADO').length} cerradas`},
        ].map(s=>(
          <div key={s.label} style={{textAlign:'center'}}>
            <div style={{fontSize:22,fontWeight:900,color:w.orange,fontFamily:"'Space Mono',monospace"}}>{s.value}</div>
            <div style={{fontSize:11,color:w.text,fontWeight:600}}>{s.label}</div>
            <div style={{fontSize:10,color:w.sub,marginTop:2}}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      {timeline.length===0 ? (
        <div style={{textAlign:'center',padding:'40px 0',color:w.muted}}>
          <div style={{fontSize:36,marginBottom:8,opacity:0.3}}>📂</div>
          <div style={{fontSize:14}}>Sin actividad registrada todavía</div>
          <div style={{fontSize:12,marginTop:4,color:w.sub}}>Creá el primer presupuesto con el botón de arriba</div>
        </div>
      ) : (
        <div>
          <div style={{fontSize:11,fontWeight:700,color:w.sub,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:12}}>
            Timeline de actividad ({timeline.length} eventos)
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:0}}>
            {timeline.map((item,i)=>{
              const isLast=i===timeline.length-1
              let icon, label, sm, amount, extra
              if(item.type==='quote'){
                const q=item.data; sm=QUOTE_ST[q.status]||QUOTE_ST.BORRADOR
                icon='📋'; label=`Presupuesto #${String(q.number).padStart(4,'0')}`; amount=q.total
              } else if(item.type==='invoice'){
                const inv=item.data; sm=INV_ST[inv.status]||INV_ST.EMITIDA
                icon='🧾'; label=`Factura ${inv.tipo||'A'} ${String(inv.number||0).padStart(6,'0')}`; amount=inv.total
              } else {
                const op=item.data; sm=OP_ST[op.status]||OP_ST.CONSULTA
                icon='💼'; label=`Operación OP-${String(op.number||0).padStart(3,'0')}${op.name?` — ${op.name}`:''}`
                amount=op.total_venta; extra=op.rentabilidad>0?`${parseFloat(op.rentabilidad).toFixed(1)}% rent.`:null
              }
              return (
                <div key={`${item.type}_${item.data.id}`} style={{display:'flex',gap:12,position:'relative'}}>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',flexShrink:0}}>
                    <div style={{width:34,height:34,borderRadius:'50%',background:`${sm.c}18`,border:`2px solid ${sm.c}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0,zIndex:1}}>
                      {icon}
                    </div>
                    {!isLast&&<div style={{width:1,flex:1,background:'rgba(0,0,0,0.08)',minHeight:20}}/>}
                  </div>
                  <div style={{flex:1,paddingBottom:isLast?0:14,paddingTop:5}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:w.text}}>{label}</div>
                        <div style={{display:'flex',gap:8,marginTop:4,alignItems:'center',flexWrap:'wrap'}}>
                          <span style={{fontSize:9,padding:'2px 8px',borderRadius:20,fontWeight:700,background:`${sm.c}15`,color:sm.c,border:`1px solid ${sm.c}30`,textTransform:'uppercase',letterSpacing:'0.06em'}}>{sm.l}</span>
                          <span style={{fontSize:10,color:w.sub}}>{fmtDt(item.date)}</span>
                          {extra&&<span style={{fontSize:10,color:w.lime,fontWeight:700}}>{extra}</span>}
                        </div>
                      </div>
                      {amount>0&&<div style={{fontSize:14,fontWeight:900,color:w.orange,fontFamily:"'Space Mono',monospace",flexShrink:0,paddingTop:4}}>{fmtMon(amount)}</div>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── MODAL ─────────────────────────────────────────────────────────────────────
function ClientModal({ initial, stats, onClose, onSaved }) {
  const [form,setForm]=useState(initial?{...initial}:{...EMPTY_CLIENT})
  const [contacts,setContacts]=useState([])
  const [newContact,setNewContact]=useState({name:'',role:'',phone:'',email:'',whatsapp:'',is_primary:false})
  const [saving,setSaving]=useState(false)
  const [tab,setTab]=useState('info')
  const isEdit=!!initial?.id

  useEffect(()=>{
    if(isEdit){supabase.from('client_contacts').select('*').eq('client_id',initial.id).then(({data})=>setContacts(data||[]))}
  },[isEdit,initial?.id])

  useEffect(()=>{
    const fn=e=>{if(e.key==='Escape')onClose()}
    window.addEventListener('keydown',fn); return()=>window.removeEventListener('keydown',fn)
  },[onClose])

  const set=(k,v)=>setForm(f=>({...f,[k]:v}))

  const addContact=()=>{
    if(!newContact.name.trim())return
    setContacts(c=>[...c,{...newContact,id:'tmp_'+Date.now()}])
    setNewContact({name:'',role:'',phone:'',email:'',whatsapp:'',is_primary:false})
  }

  const save=async()=>{
    if(!form.name?.trim())return
    setSaving(true)
    const{id,...payload}=form
    payload.updated_at=new Date()
    ;['discount_pct','credit_days','credit_limit','total_quotes','total_purchases','total_revenue'].forEach(k=>{if(!payload[k])payload[k]=0})
    ;['next_action_date','next_estimated_purchase','renewal_date','last_contact','last_purchase'].forEach(k=>{if(!payload[k])payload[k]=null})
    try{
      let clientId=initial?.id
      if(isEdit){await supabase.from('clients').update(payload).eq('id',initial.id)}
      else{const{data}=await supabase.from('clients').insert(payload).select().single();clientId=data?.id}
      const newContacts=contacts.filter(c=>String(c.id).startsWith('tmp_'))
      for(const c of newContacts){const{id:_,...cp}=c;await supabase.from('client_contacts').insert({...cp,client_id:clientId})}
      await onSaved(); onClose()
    }catch(e){console.error(e)}
    setSaving(false)
  }

  const inp=(key,placeholder,type='text')=>(
    <input value={form[key]||''} onChange={e=>set(key,e.target.value)} type={type} placeholder={placeholder}
      style={{width:'100%',padding:'10px 14px',borderRadius:10,border:`1px solid ${w.border}`,background:'rgba(255,255,255,0.7)',color:w.text,fontSize:13,outline:'none',boxSizing:'border-box'}}/>
  )
  const sel=(key,opts,includeEmpty=false)=>(
    <select value={form[key]||''} onChange={e=>set(key,e.target.value)} style={{width:'100%',padding:'10px 14px',borderRadius:10,border:`1px solid ${w.border}`,background:'rgba(255,255,255,0.7)',color:w.text,fontSize:13,outline:'none'}}>
      {includeEmpty&&<option value="">—</option>}
      {opts.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  )
  const lbl=txt=><div style={{fontSize:11,fontWeight:700,color:w.sub,marginBottom:4,textTransform:'uppercase',letterSpacing:'0.06em'}}>{txt}</div>

  const TABS=[
    {key:'info',      label:'🏢 Empresa'},
    {key:'contacts',  label:'👤 Contactos'},
    {key:'commercial',label:'💼 Comercial'},
    {key:'historial', label:'📊 Historial'},
    {key:'intel',     label:'⭐ Categoría'},
    {key:'notes',     label:'📝 Notas'},
  ]

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.3)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:760,maxHeight:'90vh',display:'flex',flexDirection:'column',background:'rgba(255,255,255,0.93)',backdropFilter:'blur(32px)',border:`1px solid ${w.border}`,borderRadius:24,boxShadow:'0 32px 80px rgba(0,0,0,0.18),inset 0 1px 0 rgba(255,255,255,0.9)'}}>

        {/* Header */}
        <div style={{padding:'20px 24px 0',flexShrink:0}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
            <div style={{flex:1}}>
              <h2 style={{margin:0,fontSize:18,fontWeight:800,color:w.text,fontFamily:"'Syne',sans-serif"}}>{isEdit?form.name:'Nuevo cliente'}</h2>
              <div style={{display:'flex',gap:6,marginTop:8,flexWrap:'wrap'}}>
                {STATUSES.map(s=>(
                  <button key={s.key} onClick={()=>set('status',s.key)}
                    style={{fontSize:10,padding:'3px 10px',borderRadius:20,cursor:'pointer',border:`1px solid ${s.color}44`,background:form.status===s.key?s.color:s.color+'18',color:form.status===s.key?'#fff':s.color,fontWeight:700,transition:'all 0.2s'}}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',fontSize:22,color:w.muted,lineHeight:1,marginLeft:16}}>×</button>
          </div>
          <div style={{display:'flex',gap:2,borderBottom:`1px solid ${w.border}`,overflowX:'auto'}}>
            {TABS.map(t=>(
              <button key={t.key} onClick={()=>setTab(t.key)}
                style={{padding:'8px 14px',fontSize:12,fontWeight:600,cursor:'pointer',border:'none',background:'none',color:tab===t.key?w.orange:w.muted,borderBottom:`2px solid ${tab===t.key?w.orange:'transparent'}`,transition:'all 0.2s',marginBottom:-1,whiteSpace:'nowrap'}}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{flex:1,overflowY:'auto',padding:'20px 24px',display:'flex',flexDirection:'column',gap:14}}>

          {tab==='info'&&(
            <>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div style={{gridColumn:'1/-1'}}>{lbl('Nombre de la empresa')}{inp('name','Nombre *')}</div>
                <div>{lbl('CUIT')}{inp('cuit','XX-XXXXXXXX-X')}</div>
                <div>{lbl('Condición IVA')}{sel('iva_condition',IVA_CONDITIONS)}</div>
                <div>{lbl('Industria')}{sel('industry',['',...INDUSTRIES],true)}</div>
                <div>{lbl('Sector específico')}{sel('sector',['',...SECTORS],true)}</div>
                <div>{lbl('Zona de operación')}{sel('operation_zone',['',...ZONES],true)}</div>
                <div>{lbl('Tamaño')}{sel('employees_range',['',...EMPLOYEE_RANGES],true)}</div>
                <div style={{gridColumn:'1/-1'}}>{lbl('Sitio web')}{inp('website','empresa.com')}</div>
              </div>
              <ProvinceCity province={form.province} city={form.city} onProvince={v=>set('province',v)} onCity={v=>set('city',v)}/>
              <div>{lbl('Dirección')}{inp('address','Calle, número, piso...')}</div>
              <div>{lbl('Cómo llegó')}<PillSelector value={form.via} options={VIAS} onChange={v=>set('via',v)}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>{lbl('Próxima acción')}{inp('next_action','Descripción')}</div>
                <div>{lbl('Fecha')}{inp('next_action_date','','date')}</div>
              </div>
            </>
          )}

          {tab==='contacts'&&(
            <>
              {contacts.map((c,i)=><ContactItem key={c.id} contact={c} onRemove={()=>setContacts(cs=>cs.filter((_,j)=>j!==i))}/>)}
              <div style={{padding:14,borderRadius:14,background:w.orangeLight,border:`1px dashed ${w.orange}44`}}>
                <div style={{fontSize:11,fontWeight:700,color:w.orange,marginBottom:10}}>+ Agregar contacto</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  {[{k:'name',p:'Nombre *'},{k:'role',p:'Cargo'},{k:'phone',p:'Teléfono'},{k:'email',p:'Email'},{k:'whatsapp',p:'WhatsApp'}].map(({k,p})=>(
                    <input key={k} value={newContact[k]} onChange={e=>setNewContact(c=>({...c,[k]:e.target.value}))} placeholder={p}
                      style={{padding:'9px 12px',borderRadius:8,border:`1px solid ${w.border}`,background:'rgba(255,255,255,0.8)',color:w.text,fontSize:12,outline:'none'}}/>
                  ))}
                  <label style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:w.muted,cursor:'pointer'}}>
                    <input type="checkbox" checked={newContact.is_primary} onChange={e=>setNewContact(c=>({...c,is_primary:e.target.checked}))}/>
                    Contacto principal
                  </label>
                </div>
                <button onClick={addContact} style={{marginTop:10,padding:'8px 18px',borderRadius:10,border:'none',background:w.orange,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>Agregar</button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>{lbl('Quién decide la compra')}{inp('decision_maker','Nombre / cargo')}</div>
                <div>{lbl('Quién pide los productos')}{inp('buyer_contact','Nombre / cargo')}</div>
                <div>{lbl('Preferencia de contacto')}<PillSelector value={form.contact_preference} options={CONTACT_PREFS} onChange={v=>set('contact_preference',v)}/></div>
                <div>{lbl('Mejor horario')}{inp('best_contact_time','Ej: 9-11hs')}</div>
                <div style={{gridColumn:'1/-1'}}>{lbl('Email para portal (futuro)')}{inp('login_email','email@empresa.com','email')}</div>
              </div>
            </>
          )}

          {tab==='commercial'&&(
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div>{lbl('Condición de pago')}<PillSelector value={form.payment_condition} options={PAYMENT_CONDITIONS} onChange={v=>set('payment_condition',v)}/></div>
              <div>{lbl('Condición de entrega')}<PillSelector value={form.delivery_condition} options={DELIVERY_CONDITIONS} onChange={v=>set('delivery_condition',v)}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
                <div>{lbl('Descuento %')}<input type="number" value={form.discount_pct||''} onChange={e=>set('discount_pct',e.target.value)} placeholder="0" style={{width:'100%',padding:'10px 14px',borderRadius:10,border:`1px solid ${w.border}`,background:'rgba(255,255,255,0.7)',color:w.text,fontSize:13,outline:'none',boxSizing:'border-box'}}/></div>
                <div>{lbl('Días crédito')}<input type="number" value={form.credit_days||''} onChange={e=>set('credit_days',e.target.value)} placeholder="0" style={{width:'100%',padding:'10px 14px',borderRadius:10,border:`1px solid ${w.border}`,background:'rgba(255,255,255,0.7)',color:w.text,fontSize:13,outline:'none',boxSizing:'border-box'}}/></div>
                <div>{lbl('Límite crédito $')}<input type="number" value={form.credit_limit||''} onChange={e=>set('credit_limit',e.target.value)} placeholder="0" style={{width:'100%',padding:'10px 14px',borderRadius:10,border:`1px solid ${w.border}`,background:'rgba(255,255,255,0.7)',color:w.text,fontSize:13,outline:'none',boxSizing:'border-box'}}/></div>
              </div>
              <div>{lbl('Frecuencia de compra')}<PillSelector value={form.purchase_frequency} options={FREQUENCIES} onChange={v=>set('purchase_frequency',v)}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>{lbl('Próxima compra estimada')}{inp('next_estimated_purchase','','date')}</div>
                <div>{lbl('Renovación de contrato')}{inp('renewal_date','','date')}</div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <input type="checkbox" id="oc" checked={form.uses_purchase_order||false} onChange={e=>set('uses_purchase_order',e.target.checked)} style={{width:16,height:16,cursor:'pointer'}}/>
                <label htmlFor="oc" style={{fontSize:13,color:w.text,cursor:'pointer'}}>Requiere Orden de Compra (OC)</label>
              </div>
              <div>{lbl('Proveedor actual de EPP (competencia)')}{inp('current_supplier','¿A quién le compra hoy?')}</div>
              <div>{lbl('Productos que consume regularmente')}<textarea value={form.regular_products||''} onChange={e=>set('regular_products',e.target.value)} placeholder="Botines talle 42, casco clase E..." rows={3} style={{width:'100%',padding:'10px 14px',borderRadius:10,border:`1px solid ${w.border}`,background:'rgba(255,255,255,0.7)',color:w.text,fontSize:13,outline:'none',resize:'vertical',boxSizing:'border-box'}}/></div>
              <div>{lbl('Servicios e intereses')}<textarea value={form.services||''} onChange={e=>set('services',e.target.value)} placeholder="Líneas de producto de interés, oportunidades..." rows={3} style={{width:'100%',padding:'10px 14px',borderRadius:10,border:`1px solid ${w.border}`,background:'rgba(255,255,255,0.7)',color:w.text,fontSize:13,outline:'none',resize:'vertical',boxSizing:'border-box'}}/></div>
            </div>
          )}

          {tab==='historial'&&(
            <ClientHistory clientId={initial?.id} clientName={form.name}/>
          )}

          {tab==='intel'&&(
            <TierDetail stats={stats||{total_quotes:initial?.total_quotes||0,total_invoices:initial?.total_invoices||0,total_revenue:initial?.total_revenue||0,product_categories:0,total_products:0}}/>
          )}

          {tab==='notes'&&(
            <textarea value={form.notes||''} onChange={e=>set('notes',e.target.value)} placeholder="Notas internas, historial, detalles importantes..." rows={12}
              style={{width:'100%',padding:'12px 16px',borderRadius:12,border:`1px solid ${w.border}`,background:'rgba(255,255,255,0.7)',color:w.text,fontSize:13,outline:'none',resize:'vertical',boxSizing:'border-box'}}/>
          )}
        </div>

        {/* Footer */}
        <div style={{padding:'16px 24px',borderTop:`1px solid ${w.border}`,display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
          <div style={{fontSize:11,color:w.sub}}>
            {initial?.id && `ID: ${initial.id.slice(0,8)}...`}
          </div>
          <div style={{display:'flex',gap:10}}>
            <button onClick={onClose} style={{padding:'10px 20px',borderRadius:12,border:`1px solid ${w.border}`,background:'transparent',color:w.muted,fontSize:13,cursor:'pointer',fontWeight:600}}>Cancelar</button>
            <button onClick={save} disabled={saving} style={{padding:'10px 24px',borderRadius:12,border:'none',background:`linear-gradient(135deg,${w.orange},#ff9f40)`,color:'#fff',fontSize:13,fontWeight:700,cursor:saving?'not-allowed':'pointer',boxShadow:`0 4px 16px ${w.orangeGlow}`,opacity:saving?0.7:1,transition:'all 0.2s'}}>
              {saving?'Guardando...':isEdit?'Guardar cambios':'Crear cliente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function Clientes() {
  const [clients,setClients]=useState([])
  const [statsMap,setStatsMap]=useState({})
  const [loading,setLoading]=useState(true)
  const [search,setSearch]=useState('')
  const [filterStatus,setFilterStatus]=useState('TODOS')
  const [filterIndustry,setFilterIndustry]=useState('TODAS')
  const [viewMode,setViewMode]=useState('cards')
  const [selected,setSelected]=useState(null)
  const [showModal,setShowModal]=useState(false)

  const load=async()=>{
    setLoading(true)
    const[{data:clientsData},{data:statsData}]=await Promise.all([
      supabase.from('clients').select('*').order('updated_at',{ascending:false}),
      supabase.from('client_stats').select('*'),
    ])
    setClients(clientsData||[])
    const map={}
    ;(statsData||[]).forEach(s=>{map[s.id]=s})
    setStatsMap(map)
    setLoading(false)
  }

  useEffect(()=>{load()},[])

  const filtered=useMemo(()=>clients.filter(c=>{
    const q=search.toLowerCase()
    return(!q||c.name?.toLowerCase().includes(q)||c.cuit?.includes(q)||c.contact_name?.toLowerCase().includes(q)||c.city?.toLowerCase().includes(q)||c.industry?.toLowerCase().includes(q))
      &&(filterStatus==='TODOS'||c.status===filterStatus)
      &&(filterIndustry==='TODAS'||c.industry===filterIndustry)
  }),[clients,search,filterStatus,filterIndustry])

  const kpis=useMemo(()=>({
    total:clients.length,
    activos:clients.filter(c=>c.status==='ACTIVO').length,
    leads:clients.filter(c=>c.status==='LEAD').length,
    inactivos:clients.filter(c=>daysAgo(c.last_contact)>60).length,
    revenue:Object.values(statsMap).reduce((s,m)=>s+(m.total_revenue||0),0),
    totalQuotes:Object.values(statsMap).reduce((s,m)=>s+(m.total_quotes||0),0),
    totalInvoices:Object.values(statsMap).reduce((s,m)=>s+(m.total_invoices||0),0),
  }),[clients,statsMap])

  const industries=useMemo(()=>['TODAS',...new Set(clients.map(c=>c.industry).filter(Boolean))],[clients])

  const btnStyle=active=>({padding:'7px 13px',borderRadius:20,fontSize:11,fontWeight:700,cursor:'pointer',border:`1px solid ${active?w.orange+'44':w.border}`,background:active?w.orangeLight:'rgba(255,255,255,0.6)',color:active?w.orange:w.muted,transition:'all 0.2s'})

  return (
    <div style={{minHeight:'100vh',padding:'24px 28px',background:w.bg,backdropFilter:w.blur,fontFamily:"'Nunito Sans',sans-serif"}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24}}>
        <div>
          <h1 style={{margin:0,fontSize:28,fontWeight:900,fontFamily:"'Syne',sans-serif",background:`linear-gradient(135deg,${w.orange},#ff9f40)`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Órbita</h1>
          <p style={{margin:'4px 0 0',fontSize:12,color:w.muted,fontStyle:'italic'}}>red de clientes y leads</p>
        </div>
        <button onClick={()=>{setSelected(null);setShowModal(true)}}
          style={{padding:'11px 22px',borderRadius:14,border:'none',background:`linear-gradient(135deg,${w.orange},#ff9f40)`,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',boxShadow:`0 4px 20px ${w.orangeGlow}`,transition:'all 0.2s cubic-bezier(0.34,1.4,0.64,1)'}}
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
        <KpiCard value={kpis.totalInvoices} label="Facturas" color={w.cyan}/>
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar cliente, CUIT, contacto..."
          style={{flex:'1 1 200px',padding:'10px 16px',borderRadius:12,border:`1px solid ${w.border}`,background:'rgba(255,255,255,0.7)',color:w.text,fontSize:13,outline:'none'}}/>
        <select value={filterIndustry} onChange={e=>setFilterIndustry(e.target.value)}
          style={{padding:'10px 14px',borderRadius:12,border:`1px solid ${w.border}`,background:'rgba(255,255,255,0.7)',color:w.text,fontSize:12,outline:'none'}}>
          {industries.map(i=><option key={i} value={i}>{i}</option>)}
        </select>
        <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
          <button onClick={()=>setFilterStatus('TODOS')} style={btnStyle(filterStatus==='TODOS')}>Todos</button>
          {STATUSES.map(s=>(
            <button key={s.key} onClick={()=>setFilterStatus(s.key)}
              style={{...btnStyle(filterStatus===s.key),borderColor:filterStatus===s.key?s.color+'44':w.border,background:filterStatus===s.key?s.color+'18':'rgba(255,255,255,0.6)',color:filterStatus===s.key?s.color:w.muted}}>
              {s.label}
            </button>
          ))}
        </div>
        <div style={{display:'flex',gap:4,background:'rgba(255,255,255,0.6)',border:`1px solid ${w.border}`,borderRadius:10,padding:3}}>
          {[{v:'cards',i:'⊞'},{v:'table',i:'☰'}].map(({v,i})=>(
            <button key={v} onClick={()=>setViewMode(v)} style={{padding:'6px 12px',borderRadius:8,border:'none',cursor:'pointer',background:viewMode===v?w.orange:'transparent',color:viewMode===v?'#fff':w.muted,fontSize:13,transition:'all 0.2s'}}>{i}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading?(
        <div style={{textAlign:'center',padding:60,color:w.muted,fontSize:14}}>Cargando...</div>
      ):filtered.length===0?(
        <div style={{textAlign:'center',padding:60,color:w.muted}}>
          <div style={{fontSize:40,marginBottom:12}}>🌌</div>
          <div style={{fontSize:14}}>No hay clientes todavía</div>
          <div style={{fontSize:12,marginTop:4,color:w.sub}}>Creá el primero con + Nuevo</div>
        </div>
      ):viewMode==='cards'?(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(330px,1fr))',gap:14}}>
          {filtered.map(c=><ClientCard key={c.id} client={c} stats={statsMap[c.id]} onClick={()=>{setSelected(c);setShowModal(true)}}/>)}
        </div>
      ):(
        <div style={{background:w.card,backdropFilter:w.blur,borderRadius:18,border:`1px solid ${w.border}`,overflow:'hidden',boxShadow:'0 4px 24px rgba(0,0,0,0.06)'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{borderBottom:`1px solid ${w.border}`}}>
                {['Empresa','Estado','Rubro','Contacto','Ciudad','Revenue','Pptos','Facturas','Último','Categoría'].map(h=>(
                  <th key={h} style={{padding:'12px 16px',textAlign:'left',fontSize:10,fontWeight:700,color:w.sub,textTransform:'uppercase',letterSpacing:'0.06em'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c=><ClientRow key={c.id} client={c} stats={statsMap[c.id]} onClick={()=>{setSelected(c);setShowModal(true)}}/>)}
            </tbody>
          </table>
        </div>
      )}

      {showModal&&(
        <ClientModal
          initial={selected}
          stats={selected?statsMap[selected.id]:null}
          onClose={()=>{setShowModal(false);setSelected(null)}}
          onSaved={load}
        />
      )}
    </div>
  )
}
