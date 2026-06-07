import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const c = {
  bg:'#07070f', border:'rgba(255,255,255,0.07)',
  cyan:'#06b6d4', violet:'#7c3aed', lime:'#84cc16',
  amber:'#f59e0b', rose:'#f43f5e', text:'#f1f5f9',
  muted:'#475569', sub:'#94a3b8'
}

const PERIODS = [
  {id:'hoy', label:'Hoy'},
  {id:'semana', label:'Esta semana'},
  {id:'mes', label:'Este mes'},
  {id:'anio', label:'Este año'},
]

const fmtM = (v,p='') => {
  const n=+v||0
  if(n>=1000000) return `${p}${(n/1000000).toFixed(1)}M`
  if(n>=1000) return `${p}${(n/1000).toFixed(0)}K`
  return `${p}${n.toLocaleString('es-AR')}`
}

const getDateRange = (period) => {
  const now = new Date()
  const from = new Date()
  if(period==='hoy') from.setHours(0,0,0,0)
  else if(period==='semana') from.setDate(now.getDate()-7)
  else if(period==='mes') from.setDate(1)
  else if(period==='anio') { from.setMonth(0); from.setDate(1) }
  return { from: from.toISOString(), to: now.toISOString() }
}

const getPrevDateRange = (period) => {
  const now = new Date()
  const from = new Date()
  const to = new Date()
  if(period==='mes') {
    from.setMonth(now.getMonth()-1); from.setDate(1)
    to.setDate(0)
  } else if(period==='anio') {
    from.setFullYear(now.getFullYear()-1); from.setMonth(0); from.setDate(1)
    to.setFullYear(now.getFullYear()-1); to.setMonth(11); to.setDate(31)
  }
  return { from: from.toISOString(), to: to.toISOString() }
}

// ── FRASES DE GRANDES PENSADORES ──
const QUOTES = [
  { text: "El tiempo es el único capital que tienen los hombres cuyo único patrimonio es su inteligencia.", author: "Honoré de Balzac", era: "Francia, siglo XIX", category: "tiempo" },
  { text: "No hay caminos para la paz; la paz es el camino.", author: "Mahatma Gandhi", era: "India, 1869–1948", category: "filosofia" },
  { text: "La imaginación es más importante que el conocimiento. El conocimiento es limitado; la imaginación rodea el mundo.", author: "Albert Einstein", era: "Alemania, 1879–1955", category: "ciencia" },
  { text: "El hombre que mueve montañas comienza cargando pequeñas piedras.", author: "Confucio", era: "China, 551–479 a.C.", category: "accion" },
  { text: "Ser ignorante no es tan vergonzoso como no querer aprender.", author: "Benjamin Franklin", era: "Estados Unidos, 1706–1790", category: "aprendizaje" },
  { text: "Nunca desperdicies una buena crisis.", author: "Winston Churchill", era: "Inglaterra, 1874–1965", category: "accion" },
  { text: "El éxito es la suma de pequeños esfuerzos repetidos día tras día.", author: "Robert Collier", era: "Estados Unidos, 1885–1950", category: "exito" },
  { text: "Primero resuelve el problema. Luego escribe el código.", author: "John Johnson", era: "Principio de programación, siglo XX", category: "accion" },
  { text: "Una inversión en conocimiento paga el mejor interés.", author: "Benjamin Franklin", era: "Estados Unidos, 1706–1790", category: "aprendizaje" },
  { text: "La excelencia nunca es un accidente. Siempre es el resultado de alta intención, esfuerzo sincero e inteligente ejecución.", author: "Aristóteles", era: "Grecia, 384–322 a.C.", category: "exito" },
  { text: "No cuentes los días, haz que los días cuenten.", author: "Muhammad Ali", era: "Estados Unidos, 1942–2016", category: "tiempo" },
  { text: "El laberinto es obra del hombre para que pueda perderse; sólo un animal puede encontrar el centro.", author: "Jorge Luis Borges", era: "Buenos Aires, 1899–1986", category: "filosofia" },
  { text: "El tiempo que se disfruta perdiendo no es tiempo perdido.", author: "Bertrand Russell", era: "Inglaterra, 1872–1970", category: "tiempo" },
  { text: "Divide et impera.", author: "Julio César", era: "Imperio Romano, 100–44 a.C.", category: "estrategia" },
  { text: "El hombre sabio no dice todo lo que piensa, pero siempre piensa todo lo que dice.", author: "Aristóteles", era: "Grecia, 384–322 a.C.", category: "sabiduria" },
  { text: "Conoce a tu enemigo y conócete a ti mismo; en cien batallas, nunca saldrás derrotado.", author: "Sun Tzu", era: "China, 544–496 a.C.", category: "estrategia" },
  { text: "La fortuna favorece a los audaces.", author: "Virgilio", era: "Imperio Romano, 70–19 a.C.", category: "accion" },
  { text: "No es que tengamos poco tiempo, sino que perdemos mucho.", author: "Séneca", era: "Imperio Romano, 4 a.C.–65 d.C.", category: "tiempo" },
  { text: "Mientras vivimos, aprendamos a vivir.", author: "Séneca", era: "Imperio Romano, 4 a.C.–65 d.C.", category: "filosofia" },
  { text: "Veni, vidi, vici.", author: "Julio César", era: "Imperio Romano, 100–44 a.C.", category: "accion" },
  { text: "Las cosas más importantes nunca deben estar a merced de las menos importantes.", author: "Johann Wolfgang von Goethe", era: "Alemania, 1749–1832", category: "sabiduria" },
  { text: "Un hombre que se atreve a desperdiciar una hora de su tiempo no ha descubierto el valor de la vida.", author: "Charles Darwin", era: "Inglaterra, 1809–1882", category: "tiempo" },
  { text: "La creatividad es la inteligencia divirtiéndose.", author: "Albert Einstein", era: "Alemania, 1879–1955", category: "ciencia" },
  { text: "El éxito no es definitivo, el fracaso no es fatal: lo que cuenta es el coraje de continuar.", author: "Winston Churchill", era: "Inglaterra, 1874–1965", category: "exito" },
  { text: "Soy parte de todo lo que he leído.", author: "Jorge Luis Borges", era: "Buenos Aires, 1899–1986", category: "aprendizaje" },
  { text: "El universo no tiene obligación de tener sentido para ti.", author: "Neil deGrasse Tyson", era: "Estados Unidos, 1958–presente", category: "ciencia" },
  { text: "Un río llega lejos porque sabe rodear obstáculos.", author: "Lao Tse", era: "China, siglo VI a.C.", category: "sabiduria" },
  { text: "Lo que sabemos es una gota de agua; lo que ignoramos es el océano.", author: "Isaac Newton", era: "Inglaterra, 1643–1727", category: "ciencia" },
  { text: "El genio es uno por ciento de inspiración y noventa y nueve por ciento de transpiración.", author: "Thomas Edison", era: "Estados Unidos, 1847–1931", category: "exito" },
  { text: "Cuando el viento sopla, algunos construyen muros y otros molinos.", author: "Proverbio chino", era: "China, origen ancestral", category: "estrategia" },
  { text: "No hay nada permanente excepto el cambio.", author: "Heráclito", era: "Grecia, 535–475 a.C.", category: "filosofia" },
  { text: "La vida no es la que uno vivió, sino la que uno recuerda y cómo la recuerda para contarla.", author: "Gabriel García Márquez", era: "Colombia, 1927–2014", category: "filosofia" },
  { text: "El que no arriesga, no cruza el mar.", author: "Cristóbal Colón", era: "Génova, 1451–1506", category: "accion" },
  { text: "Quien controla el pasado controla el futuro; quien controla el presente controla el pasado.", author: "George Orwell", era: "Inglaterra, 1903–1950", category: "estrategia" },
  { text: "Haz de tu vida un sueño, y de tu sueño una realidad.", author: "Antoine de Saint-Exupéry", era: "Francia, 1900–1944", category: "filosofia" },
  { text: "El mundo es un libro, y quienes no viajan leen sólo una página.", author: "San Agustín", era: "África del Norte, 354–430 d.C.", category: "sabiduria" },
  { text: "Primero ignoran, luego se ríen, luego luchan y luego ganás.", author: "Mahatma Gandhi", era: "India, 1869–1948", category: "exito" },
  { text: "La única forma de hacer un gran trabajo es amar lo que haces.", author: "Steve Jobs", era: "Estados Unidos, 1955–2011", category: "exito" },
  { text: "El precio de la grandeza es la responsabilidad.", author: "Winston Churchill", era: "Inglaterra, 1874–1965", category: "exito" },
  { text: "Prefiero tener preguntas que no pueden contestarse que respuestas que no pueden cuestionarse.", author: "Richard Feynman", era: "Estados Unidos, 1918–1988", category: "ciencia" },
]

// Elegir frase basada en el día del año (cambia cada login porque cambia la hora)
const getDailyQuote = () => {
  const now = new Date()
  const seed = now.getFullYear() * 10000 + (now.getMonth()+1) * 100 + now.getDate() + now.getHours()
  return QUOTES[seed % QUOTES.length]
}

const getGreeting = () => {
  const h = new Date().getHours()
  if (h >= 6 && h < 12) return 'Buenos días'
  if (h >= 12 && h < 20) return 'Buenas tardes'
  if (h >= 20 || h < 2) return 'Buenas noches'
  return 'Buena madrugada'
}

const getDayLabel = () => {
  const now = new Date()
  return now.toLocaleDateString('es-AR', { weekday:'long', day:'numeric', month:'long' })
}
function PensamientoCard({ quote }) {
  const [open, setOpen] = useState(false)

  const STYLES = `
    @keyframes holeOpen {
      from { opacity:0; transform:perspective(800px) translateZ(-30px) scaleY(0.85); transform-origin:top; }
      to   { opacity:1; transform:perspective(800px) translateZ(-8px)  scaleY(1); }
    }
    @keyframes quoteRise {
      from { opacity:0; transform:translateY(14px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes sigRise {
      from { opacity:0; transform:translateY(8px); }
      to   { opacity:1; transform:translateY(0); }
    }
  `

  return (
    <div style={{ position:'relative' }}>
      <style>{STYLES}</style>

      {/* ── PILL GLASS — estado colapsado ── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width:'100%', cursor:'pointer', outline:'none',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'11px 20px',
          borderRadius: open ? '16px 16px 0 0' : 16,
          // iOS Liquid Glass
          background: open
            ? 'rgba(0,0,0,0.55)'
            : 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(48px) saturate(200%) brightness(1.06)',
          WebkitBackdropFilter: 'blur(48px) saturate(200%) brightness(1.06)',
          border: '1px solid rgba(255,255,255,0.13)',
          borderTop: '1px solid rgba(255,255,255,0.26)',
          borderBottom: open ? '1px solid rgba(0,0,0,0.4)' : '1px solid rgba(0,0,0,0.12)',
          boxShadow: open
            ? 'inset 0 3px 20px rgba(0,0,0,0.65), inset 0 0 60px rgba(0,0,0,0.3), 0 2px 12px rgba(0,0,0,0.4)'
            : '0 4px 24px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.08)',
          transform: open
            ? 'perspective(900px) translateZ(-6px) rotateX(1.5deg)'
            : 'perspective(900px) translateZ(0px) rotateX(0deg)',
          transition: 'all 0.38s cubic-bezier(0.34,1.15,0.64,1)',
        }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:13, opacity:0.55, color:'#94a3b8' }}>❝</span>
          <span style={{ fontSize:10, fontWeight:700, color:'#06b6d4', textTransform:'uppercase', letterSpacing:'0.12em' }}>
            Pensamiento del día
          </span>
          {!open && (
            <span style={{
              fontSize:10, color:'rgba(148,163,184,0.4)',
              fontStyle:'italic', fontWeight:300, maxWidth:240,
              overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis',
            }}>
              — {quote.author}
            </span>
          )}
        </div>
        <span style={{
          fontSize:9, color:'rgba(148,163,184,0.35)',
          transform: open ? 'rotate(180deg)' : 'rotate(0)',
          transition:'transform 0.3s ease', display:'inline-block',
        }}>▼</span>
      </button>

      {/* ── HOLE PANEL — estado expandido ── */}
      {open && (
        <div style={{
          position:'relative', overflow:'hidden',
          borderRadius:'0 0 16px 16px',
          // El hueco
          background:'rgba(0,0,0,0.72)',
          backdropFilter:'blur(72px) saturate(160%)',
          WebkitBackdropFilter:'blur(72px) saturate(160%)',
          border:'1px solid rgba(255,255,255,0.07)',
          borderTop:'none',
          boxShadow:'inset 0 6px 48px rgba(0,0,0,0.85), inset 0 0 120px rgba(0,0,0,0.5), 0 24px 64px rgba(0,0,0,0.5)',
          padding:'28px 32px 26px',
          animation:'holeOpen 0.42s cubic-bezier(0.34,1.1,0.64,1) both',
        }}>
          {/* Luz ambiente sutil desde arriba */}
          <div style={{
            position:'absolute', top:0, left:'50%', transform:'translateX(-50%)',
            width:'60%', height:1,
            background:'linear-gradient(90deg,transparent,rgba(6,182,212,0.25),transparent)',
            pointerEvents:'none',
          }}/>
          {/* Gradiente de profundidad */}
          <div style={{
            position:'absolute', inset:0,
            background:'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(6,182,212,0.04), transparent 70%)',
            pointerEvents:'none',
          }}/>

          {/* Frase */}
          <blockquote style={{
            margin:0, position:'relative',
            fontSize:18, lineHeight:1.8,
            color:'rgba(241,245,249,0.93)',
            fontStyle:'italic', fontWeight:300,
            letterSpacing:'0.015em',
            maxWidth:740,
            animation:'quoteRise 0.45s 0.08s cubic-bezier(0.34,1.1,0.64,1) both',
          }}>
            {quote.text}
          </blockquote>

          {/* Firma */}
          <div style={{
            marginTop:22, display:'flex', alignItems:'center', gap:12,
            animation:'sigRise 0.4s 0.22s ease both',
          }}>
            <div style={{ width:28, height:1, background:'linear-gradient(90deg,#06b6d4,transparent)', flexShrink:0 }}/>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'#06b6d4', letterSpacing:'0.02em' }}>
                {quote.author}
              </div>
              <div style={{ fontSize:10, color:'rgba(148,163,184,0.38)', fontStyle:'italic', marginTop:3, letterSpacing:'0.01em' }}>
                {quote.era} &nbsp;·&nbsp; {new Date().toLocaleDateString('es-AR',{day:'numeric',month:'long',year:'numeric'})}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default function Dashboard() {
  const [period, setPeriod] = useState('mes')
  const [loading, setLoading] = useState(true)
  const [editingOrgan, setEditingOrgan] = useState(null)
  const [form, setForm] = useState({})
  const [quote] = useState(getDailyQuote)

  const [counts, setCounts] = useState({
    products:0, suppliers:0, clients:0, proposals:0,
    invoicesPending:0, tasksPending:0
  })
  const [financials, setFinancials] = useState({
    ingresos:0, ingresosPrev:0, objetivo:0,
    egresos:0, caja:0,
    cobrado:0, pendienteCobro:0,
    chequesTotal:0, chequesRechazados:0
  })
  const [presupuestos, setPresupuestos] = useState({
    enviados:0, aprobados:0, rechazados:0
  })
  const [alerts, setAlerts] = useState([])
  const [cheques, setCheques] = useState([])
  const [kpis, setKpis] = useState({
    objetivo:0, contratosActual:0, contratosMeta:5, oportunidades:[]
  })

  useEffect(() => { loadAll() }, [period])

  const loadAll = async () => {
    setLoading(true)
    const range = getDateRange(period)
    const prevRange = getPrevDateRange(period)

    const [
      prodCount, suppCount, clientCount, propCount,
      invoiceData, expenseData, chequeData, taskData, kpiData,
      prevInvoiceData
    ] = await Promise.all([
      supabase.from('products').select('*', {count:'exact', head:true}),
      supabase.from('suppliers').select('*', {count:'exact', head:true}),
      supabase.from('clients').select('*', {count:'exact', head:true}),
      supabase.from('proposals').select('*', {count:'exact', head:true}),
      supabase.from('invoices').select('*').gte('created_at', range.from),
      supabase.from('expenses').select('*').gte('date', range.from.split('T')[0]),
      supabase.from('cheques').select('*'),
      supabase.from('tasks').select('*').eq('status','Pendiente').order('due_date'),
      supabase.from('kpis').select('*').limit(1).single(),
      supabase.from('invoices').select('amount,status').gte('created_at', prevRange.from).lte('created_at', prevRange.to)
    ])

    setCounts({
      products: prodCount.count||0,
      suppliers: suppCount.count||0,
      clients: clientCount.count||0,
      proposals: propCount.count||0,
      invoicesPending: invoiceData.data?.filter(i=>i.status==='Pendiente').length||0,
      tasksPending: taskData.data?.length||0
    })

    const invs = invoiceData.data||[]
    const exps = expenseData.data||[]
    const prevInvs = prevInvoiceData.data||[]

    const ingresos = invs.filter(i=>i.type==='Factura'||i.type==='Recibo').reduce((a,i)=>a+(+i.amount||0),0)
    const cobrado = invs.filter(i=>i.status==='Cobrada').reduce((a,i)=>a+(+i.amount||0),0)
    const pendienteCobro = invs.filter(i=>i.status==='Pendiente').reduce((a,i)=>a+(+i.amount||0),0)
    const egresos = exps.reduce((a,e)=>a+(+e.amount||0),0)
    const ingresosPrev = prevInvs.reduce((a,i)=>a+(+i.amount||0),0)

    const chqs = chequeData.data||[]
    setFinancials({
      ingresos, ingresosPrev, egresos,
      cobrado, pendienteCobro,
      caja: cobrado - egresos,
      chequesTotal: chqs.filter(c=>c.status==='Pendiente').length,
      chequesRechazados: chqs.filter(c=>c.status==='Rechazado').length,
      objetivo: kpiData.data?.data?.objetivo||0
    })

    const props = (await supabase.from('proposals').select('status').gte('created_at', range.from)).data||[]
    setPresupuestos({
      enviados: props.length,
      aprobados: props.filter(p=>p.status==='Aprobado').length,
      rechazados: props.filter(p=>p.status==='Rechazado').length
    })

    const in15 = new Date(); in15.setDate(in15.getDate()+15)
    const urgentTasks = (taskData.data||[]).filter(t=>t.due_date&&new Date(t.due_date)<=in15)
    const overdueInvs = invs.filter(i=>i.status==='Pendiente'&&i.due_date&&new Date(i.due_date)<new Date())
    setAlerts([
      ...urgentTasks.map(t=>({icon:'📅',label:t.title,date:t.due_date,color:c.amber,priority:t.priority})),
      ...overdueInvs.map(i=>({icon:'💸',label:`Factura ${i.number||''} — ${i.client_name}`,date:i.due_date,color:c.rose,priority:'Urgente'}))
    ].sort((a,b)=>new Date(a.date)-new Date(b.date)).slice(0,6))

    setCheques(chqs.slice(0,5))
    if(kpiData.data?.data) setKpis(prev=>({...prev,...kpiData.data.data}))
    setLoading(false)
  }

  const saveKpis = async (newKpis) => {
    setKpis(newKpis)
    const existing = await supabase.from('kpis').select('id').limit(1).single()
    if(existing.data) await supabase.from('kpis').update({data:newKpis,updated_at:new Date()}).eq('id',existing.data.id)
    else await supabase.from('kpis').insert({data:newKpis})
  }

  const startEdit = (id, fields) => { setForm(fields); setEditingOrgan(id) }
  const saveEdit = () => { saveKpis({...kpis,...form}); setEditingOrgan(null) }

  const convRate = presupuestos.enviados>0 ? ((presupuestos.aprobados/presupuestos.enviados)*100).toFixed(0) : 0
  const ingresosVar = financials.ingresosPrev>0 ? (((financials.ingresos-financials.ingresosPrev)/financials.ingresosPrev)*100).toFixed(0) : null
  const objetivoPct = kpis.objetivo>0 ? Math.min(100,Math.round((financials.ingresos/kpis.objetivo)*100)) : 0
  const contratosPct = kpis.contratosMeta>0 ? Math.min(100,Math.round((kpis.contratosActual/kpis.contratosMeta)*100)) : 0

  const sc = {sano:c.lime, atencion:c.amber, critico:c.rose}
  const getStatus = (c1, c2) => c1?'sano':c2?'atencion':'critico'

  const organs = [
    {
      id:'ingresos', icon:'❤️', name:'Corazón', sub:'INGRESOS',
      status: getStatus(financials.ingresos>0&&objetivoPct>=50, financials.ingresos>0),
      fields:[
        {l:'Facturado', v:fmtM(financials.ingresos,'$'), hi:true},
        {l:'Cobrado', v:fmtM(financials.cobrado,'$')},
        {l:'Pendiente cobro', v:fmtM(financials.pendienteCobro,'$'), alert:financials.pendienteCobro>0},
        {l:'vs anterior', v:ingresosVar?`${ingresosVar>0?'+':''}${ingresosVar}%`:'—'},
      ]
    },
    {
      id:'clientes', icon:'🫁', name:'Pulmones', sub:'CLIENTES',
      status: getStatus(counts.clients>=10, counts.clients>0),
      fields:[
        {l:'Total clientes', v:counts.clients, hi:true},
        {l:'Propuestas', v:counts.proposals},
        {l:'Conversión', v:`${convRate}%`},
        {l:'Enviadas', v:presupuestos.enviados},
      ]
    },
    {
      id:'presupuestos', icon:'🧠', name:'Cerebro', sub:'PRESUPUESTOS',
      status: getStatus(+convRate>=30, presupuestos.enviados>0),
      fields:[
        {l:'Enviados', v:presupuestos.enviados},
        {l:'Aprobados', v:presupuestos.aprobados, hi:true},
        {l:'Rechazados', v:presupuestos.rechazados, alert:presupuestos.rechazados>presupuestos.aprobados},
        {l:'Tasa cierre', v:`${convRate}%`},
      ]
    },
    {
      id:'proveedores', icon:'🦴', name:'Esqueleto', sub:'PROVEEDORES',
      status: getStatus(counts.suppliers>=5, counts.suppliers>0),
      fields:[
        {l:'Activos', v:counts.suppliers, hi:true},
        {l:'Productos', v:counts.products},
        {l:'Egresos', v:fmtM(financials.egresos,'$'), alert:financials.egresos>financials.ingresos},
      ]
    },
    {
      id:'caja', icon:'🩸', name:'Circulatorio', sub:'CAJA',
      status: getStatus(financials.caja>0, financials.cobrado>0),
      fields:[
        {l:'Saldo', v:fmtM(financials.caja,'$'), hi:true},
        {l:'Cheques pendientes', v:financials.chequesTotal},
        {l:'Rechazados', v:financials.chequesRechazados, alert:financials.chequesRechazados>0},
        {l:'Egresos', v:fmtM(financials.egresos,'$')},
      ]
    },
    {
      id:'catalogo', icon:'⚙️', name:'Fábrica', sub:'CATÁLOGO',
      status: getStatus(counts.products>=20, counts.products>0),
      fields:[
        {l:'Productos', v:counts.products, hi:true},
        {l:'Proveedores', v:counts.suppliers},
        {l:'Facturas pend.', v:counts.invoicesPending, alert:counts.invoicesPending>0},
        {l:'Tareas', v:counts.tasksPending, alert:counts.tasksPending>3},
      ]
    },
  ]

  const OrganCard = ({organ}) => {
    const color = sc[organ.status]
    return (
      <div style={{background:'rgba(255,255,255,0.035)',border:`1px solid ${color}25`,borderRadius:14,padding:16,transition:'border-color .2s'}}
        onMouseEnter={e=>e.currentTarget.style.borderColor=color}
        onMouseLeave={e=>e.currentTarget.style.borderColor=`${color}25`}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:20}}>{organ.icon}</span>
            <div>
              <div style={{fontSize:9,color:c.muted,textTransform:'uppercase'}}>{organ.name}</div>
              <div style={{fontSize:12,fontWeight:700}}>{organ.sub}</div>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:5,padding:'2px 8px',borderRadius:20,background:`${color}15`,border:`1px solid ${color}30`}}>
            <div style={{width:5,height:5,borderRadius:'50%',background:color,boxShadow:`0 0 4px ${color}`}}/>
            <span style={{fontSize:9,fontWeight:700,color}}>{organ.status==='sano'?'Sano ✓':organ.status==='atencion'?'Atención':'Crítico !'}</span>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
          {organ.fields.map((f,i)=>(
            <div key={i} style={{padding:'8px 10px',borderRadius:8,
              background:f.hi?`${color}10`:f.alert?`${c.rose}08`:'rgba(255,255,255,0.03)',
              border:`1px solid ${f.hi?`${color}20`:f.alert?`${c.rose}20`:c.border}`}}>
              <div style={{fontSize:9,color:c.muted,marginBottom:2}}>{f.l}</div>
              <div style={{fontSize:15,fontWeight:800,color:f.hi?color:f.alert?c.rose:c.text}}>{f.v}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if(loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',color:c.cyan}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:8}}>⚡</div>
        <div style={{fontSize:14}}>Cargando datos...</div>
      </div>
    </div>
  )

  return (
    <div>

      {/* ── HEADER — SALUDO + FRASE ── */}
      <div style={{
        marginBottom:20,
        background:'linear-gradient(135deg,rgba(6,182,212,0.04),rgba(124,58,237,0.04))',
        border:`1px solid rgba(255,255,255,0.06)`,
        borderRadius:18, padding:'16px 24px',
        position:'relative', overflow:'hidden',
      }}>
        {/* Decoración de fondo */}
        <div style={{
          position:'absolute', top:-40, right:-40,
          width:200, height:200, borderRadius:'50%',
          background:`radial-gradient(circle,rgba(6,182,212,0.06),transparent 70%)`,
          pointerEvents:'none',
        }}/>
        <div style={{
          position:'absolute', bottom:-30, left:-30,
          width:150, height:150, borderRadius:'50%',
          background:`radial-gradient(circle,rgba(124,58,237,0.05),transparent 70%)`,
          pointerEvents:'none',
        }}/>

        {/* Saludo */}
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:20}}>
          <div>
            <div style={{fontSize:11,color:c.cyan,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:6,display:'flex',alignItems:'center',gap:6}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:c.cyan,boxShadow:`0 0 8px ${c.cyan}`}}/>
              STEPS Command Center
            </div>
            <h1 style={{margin:0,fontSize:22,fontWeight:900,letterSpacing:'-0.5px'}}>
              {getGreeting()}, <span style={{background:`linear-gradient(135deg,${c.cyan},${c.violet})`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Santiago</span> 👋
            </h1>
            <div style={{fontSize:13,color:c.sub,marginTop:5}}>
              {getDayLabel().charAt(0).toUpperCase() + getDayLabel().slice(1)}
            </div>
          </div>

          {/* Selector de período */}
          <div style={{display:'flex',gap:3,background:'rgba(255,255,255,0.04)',borderRadius:10,padding:3,border:`1px solid ${c.border}`,alignSelf:'flex-start'}}>
            {PERIODS.map(p=>(
              <button key={p.id} onClick={()=>setPeriod(p.id)} style={{
                padding:'6px 14px',borderRadius:7,border:'none',cursor:'pointer',fontSize:11,fontWeight:600,
                background:period===p.id?c.cyan:'transparent',
                color:period===p.id?'#000':c.sub,transition:'all .2s'
              }}>{p.label}</button>
            ))}
          </div>
        </div>

        {/* Separador */}
        <div style={{height:1,background:'rgba(255,255,255,0.05)',marginBottom:20}}/>

        {/* Frase del pensador */}
        <div style={{position:'relative'}}>
          <div style={{
            fontSize:11, color:c.cyan, fontWeight:600,
            textTransform:'uppercase', letterSpacing:'0.1em',
            marginBottom:10, display:'flex', alignItems:'center', gap:8,
          }}>
            <span style={{fontSize:16,opacity:0.7}}>❝</span>
            Pensamiento del día
          </div>
          <blockquote style={{
            margin:0, padding:0,
            fontSize:17, lineHeight:1.7,
            color:'rgba(241,245,249,0.92)',
            fontStyle:'italic',
            fontWeight:400,
            maxWidth:780,
            letterSpacing:'0.01em',
          }}>
            {quote.text}
          </blockquote>
          <div style={{marginTop:12,display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:24,height:1,background:`linear-gradient(90deg,${c.cyan},transparent)`}}/>
            <span style={{fontSize:13,fontWeight:700,color:c.cyan}}>{quote.author}</span>
            <span style={{fontSize:11,color:c.muted}}>·</span>
            <span style={{fontSize:11,color:c.muted,fontStyle:'italic'}}>{quote.era}</span>
          </div>
        </div>
      </div>

      {/* ── STEPS CORE ── */}
      <div style={{background:'linear-gradient(135deg,rgba(6,182,212,0.07),rgba(124,58,237,0.07))',
        border:'1px solid rgba(6,182,212,0.2)',borderRadius:14,padding:'12px 18px',marginBottom:14,
        display:'flex',gap:20,flexWrap:'wrap',alignItems:'center'}}>
        <div style={{fontSize:11,fontWeight:700,color:c.cyan,textTransform:'uppercase',letterSpacing:'0.1em',flexShrink:0}}>⚡ STEPS CORE</div>
        {[
          {l:'Facturado',v:fmtM(financials.ingresos,'$'),color:c.lime},
          {l:'vs anterior',v:ingresosVar?`${ingresosVar>0?'+':''}${ingresosVar}%`:'—',color:ingresosVar>0?c.lime:c.rose},
          {l:'Objetivo',v:`${objetivoPct}%`,color:c.amber},
          {l:'Clientes',v:counts.clients,color:c.cyan},
          {l:'Conversión',v:`${convRate}%`,color:c.violet},
          {l:'Caja',v:fmtM(financials.caja,'$'),color:financials.caja>=0?c.lime:c.rose},
          {l:'Abastec.',v:`${kpis.contratosActual}/${kpis.contratosMeta}`,color:c.lime},
        ].map(k=>(
          <div key={k.l} style={{display:'flex',gap:6,alignItems:'baseline'}}>
            <span style={{fontSize:17,fontWeight:900,color:k.color}}>{k.v}</span>
            <span style={{fontSize:10,color:c.muted}}>{k.l}</span>
          </div>
        ))}
      </div>

      {/* ── OBJETIVO MENSUAL ── */}
      {kpis.objetivo>0&&(
        <div style={{background:'rgba(255,255,255,0.03)',border:`1px solid ${c.border}`,borderRadius:12,padding:'12px 16px',marginBottom:14}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6,fontSize:12}}>
            <span style={{color:c.sub}}>🎯 Objetivo mensual</span>
            <span style={{color:c.text,fontWeight:700}}>{fmtM(financials.ingresos,'$')} / {fmtM(kpis.objetivo,'$')}</span>
          </div>
          <div style={{height:8,borderRadius:4,background:'rgba(255,255,255,0.07)',overflow:'hidden'}}>
            <div style={{height:'100%',borderRadius:4,width:`${objetivoPct}%`,background:`linear-gradient(90deg,${c.cyan},${c.lime})`,transition:'width 1s'}}/>
          </div>
          <div style={{fontSize:10,color:c.muted,marginTop:4}}>{objetivoPct}% completado</div>
        </div>
      )}

      {/* ── ORGANS GRID ── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:10}}>
        {organs.map(o=><OrganCard key={o.id} organ={o}/>)}
      </div>

      {/* ── ALERTAS + CHEQUES ── */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
        <div style={{background:'rgba(255,255,255,0.035)',border:`1px solid ${c.amber}25`,borderRadius:14,padding:16}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:20}}>📅</span>
              <div>
                <div style={{fontSize:9,color:c.muted,textTransform:'uppercase'}}>Calendario</div>
                <div style={{fontSize:12,fontWeight:700}}>ALERTAS Y VENCIMIENTOS</div>
              </div>
            </div>
            <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:`${c.amber}15`,color:c.amber,fontWeight:600}}>{alerts.length} pendientes</span>
          </div>
          {alerts.length===0
            ?<div style={{textAlign:'center',padding:'20px 0',color:c.muted,fontSize:12}}>✅ Sin alertas próximas</div>
            :alerts.map((a,i)=>(
              <div key={i} style={{display:'flex',gap:10,alignItems:'center',padding:'8px 10px',borderRadius:8,
                background:`${a.color}08`,border:`1px solid ${a.color}20`,marginBottom:6}}>
                <span style={{fontSize:14}}>{a.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:500,color:c.text}}>{a.label}</div>
                  {a.date&&<div style={{fontSize:10,color:c.muted}}>{new Date(a.date).toLocaleDateString('es-AR')}</div>}
                </div>
                <span style={{fontSize:9,padding:'2px 7px',borderRadius:20,fontWeight:600,background:`${a.color}20`,color:a.color}}>{a.priority}</span>
              </div>
            ))
          }
        </div>

        <div style={{background:'rgba(255,255,255,0.035)',border:`1px solid ${c.violet}25`,borderRadius:14,padding:16}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:20}}>🏦</span>
              <div>
                <div style={{fontSize:9,color:c.muted,textTransform:'uppercase'}}>Banco</div>
                <div style={{fontSize:12,fontWeight:700}}>CHEQUES</div>
              </div>
            </div>
            {financials.chequesRechazados>0&&(
              <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:`${c.rose}15`,color:c.rose,fontWeight:600}}>⚠️ {financials.chequesRechazados} rechazados</span>
            )}
          </div>
          {cheques.length===0
            ?<div style={{textAlign:'center',padding:'20px 0',color:c.muted,fontSize:12}}>Sin cheques registrados</div>
            :cheques.map((ch,i)=>{
              const sc2={Pendiente:c.amber,Cobrado:c.lime,Rechazado:c.rose,Depositado:c.cyan}
              return (
                <div key={i} style={{display:'flex',gap:10,alignItems:'center',padding:'8px 10px',borderRadius:8,
                  background:'rgba(255,255,255,0.03)',border:`1px solid ${c.border}`,marginBottom:5}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:500}}>{ch.client_name||ch.bank||'Sin nombre'}</div>
                    <div style={{fontSize:10,color:c.muted}}>{ch.type} · {ch.due_date?new Date(ch.due_date).toLocaleDateString('es-AR'):''}</div>
                  </div>
                  <div style={{fontSize:13,fontWeight:700}}>{fmtM(ch.amount,'$')}</div>
                  <span style={{fontSize:9,padding:'2px 7px',borderRadius:20,fontWeight:600,
                    background:`${sc2[ch.status]||c.amber}20`,color:sc2[ch.status]||c.amber}}>{ch.status}</span>
                </div>
              )
            })
          }
        </div>
      </div>

      {/* ── RADAR COMERCIAL ── */}
      <div style={{background:'rgba(255,255,255,0.035)',border:`1px solid ${c.cyan}25`,borderRadius:14,padding:16,marginBottom:10}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:20}}>👁</span>
            <div>
              <div style={{fontSize:9,color:c.muted,textTransform:'uppercase'}}>Radar</div>
              <div style={{fontSize:12,fontWeight:700}}>OPORTUNIDADES COMERCIALES</div>
            </div>
          </div>
          <span style={{fontSize:13,color:c.sub}}>Pipeline: <span style={{color:c.cyan,fontWeight:700}}>
            {fmtM((kpis.oportunidades||[]).reduce((a,o)=>a+(+o.monto*(+o.prob/100)),0),'$')}
          </span></span>
        </div>
        {(!kpis.oportunidades||kpis.oportunidades.length===0)
          ?<div style={{textAlign:'center',padding:'16px 0',color:c.muted,fontSize:12}}>Sin oportunidades cargadas</div>
          :<div style={{display:'flex',flexDirection:'column',gap:6}}>
            {kpis.oportunidades.sort((a,b)=>+b.prob-+a.prob).map((o,i)=>{
              const pc=+o.prob>=70?c.lime:+o.prob>=40?c.amber:c.rose
              return (
                <div key={i} style={{display:'grid',gridTemplateColumns:'1fr auto auto auto',alignItems:'center',gap:14,
                  padding:'10px 14px',borderRadius:8,border:`1px solid ${pc}20`,background:`${pc}05`}}>
                  <div style={{fontSize:13,fontWeight:600}}>{o.cliente}</div>
                  <div style={{fontSize:14,fontWeight:800}}>{fmtM(o.monto,'$')}</div>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:18,fontWeight:900,color:pc,lineHeight:1}}>{o.prob}%</div>
                    <div style={{fontSize:9,color:c.muted}}>prob.</div>
                  </div>
                  <div style={{fontSize:12,fontWeight:700,color:pc}}>{fmtM(+o.monto*(+o.prob/100),'$')}</div>
                </div>
              )
            })}
          </div>
        }
      </div>

      {/* ── ABASTECIMIENTO ── */}
      <div style={{background:'linear-gradient(135deg,rgba(132,204,22,0.05),rgba(6,182,212,0.05))',
        border:`2px solid ${c.lime}35`,borderRadius:16,padding:24,marginBottom:10,textAlign:'center',position:'relative',overflow:'hidden'}}>
        <div style={{fontSize:24,marginBottom:4}}>🚀</div>
        <div style={{fontSize:10,color:c.lime,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:4}}>Objetivo principal</div>
        <div style={{fontSize:16,fontWeight:800,marginBottom:20}}>ABASTECIMIENTO PLANIFICADO</div>
        <div style={{display:'flex',justifyContent:'center',gap:40,marginBottom:20}}>
          {[{l:'META',v:kpis.contratosMeta,color:c.lime},{l:'ACTUAL',v:kpis.contratosActual,color:c.cyan},{l:'FALTAN',v:Math.max(0,kpis.contratosMeta-kpis.contratosActual),color:c.amber}].map(item=>(
            <div key={item.l}>
              <div style={{fontSize:10,color:c.muted,marginBottom:4,letterSpacing:'0.08em'}}>{item.l}</div>
              <div style={{fontSize:56,fontWeight:900,color:item.color,lineHeight:1}}>{item.v}</div>
            </div>
          ))}
        </div>
        <div style={{maxWidth:400,margin:'0 auto 12px'}}>
          <div style={{height:12,borderRadius:6,background:'rgba(255,255,255,0.07)',overflow:'hidden',marginBottom:6}}>
            <div style={{height:'100%',borderRadius:6,width:`${contratosPct}%`,background:`linear-gradient(90deg,${c.cyan},${c.lime})`,transition:'width 1s'}}/>
          </div>
          <div style={{fontSize:12,color:c.sub}}>{contratosPct}% del objetivo</div>
        </div>
        {editingOrgan==='abas'?(
          <div style={{display:'inline-flex',gap:10,alignItems:'flex-end',marginTop:8,padding:14,borderRadius:10,border:`1px solid ${c.border}`,background:'rgba(0,0,0,0.5)'}}>
            {[['Actual','contratosActual'],['Meta','contratosMeta']].map(([l,k])=>(
              <div key={k}>
                <div style={{fontSize:9,color:c.muted,marginBottom:3}}>{l}</div>
                <input type="number" min={0} value={form[k]??kpis[k]} onChange={e=>setForm(p=>({...p,[k]:+e.target.value}))}
                  style={{background:'rgba(255,255,255,0.1)',border:`1px solid ${c.border}`,borderRadius:7,padding:'8px 12px',color:c.text,fontSize:22,fontWeight:900,width:70,textAlign:'center',boxSizing:'border-box'}}/>
              </div>
            ))}
            <button onClick={saveEdit} style={{padding:'8px 16px',borderRadius:7,border:'none',background:c.lime,color:'#000',cursor:'pointer',fontSize:14,fontWeight:800}}>✓</button>
            <button onClick={()=>setEditingOrgan(null)} style={{padding:'8px 12px',borderRadius:7,border:`1px solid ${c.border}`,background:'transparent',color:c.sub,cursor:'pointer'}}>✕</button>
          </div>
        ):(
          <button onClick={()=>{setForm({contratosActual:kpis.contratosActual,contratosMeta:kpis.contratosMeta});setEditingOrgan('abas');}}
            style={{padding:'8px 20px',borderRadius:8,border:`1px solid ${c.lime}`,background:`${c.lime}15`,color:c.lime,cursor:'pointer',fontSize:13,fontWeight:600}}>
            Actualizar contratos
          </button>
        )}
      </div>

      {/* ── NIVEL EVOLUCIÓN ── */}
      <div style={{background:'rgba(255,255,255,0.035)',border:`1px solid ${c.violet}25`,borderRadius:14,padding:20}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:10}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <span style={{fontSize:28}}>👑</span>
            <div>
              <div style={{fontSize:9,color:c.muted,textTransform:'uppercase'}}>Evolución</div>
              <div style={{fontSize:18,fontWeight:900,background:`linear-gradient(135deg,${c.amber},${c.violet})`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
                STEPS NIVEL {[counts.products>=10,counts.suppliers>=5,counts.clients>=5,+convRate>=30,kpis.contratosActual>=3].filter(Boolean).length + 1}
              </div>
            </div>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
          {[
            {label:'10+ productos en catálogo', met:counts.products>=10},
            {label:'5+ proveedores con contacto', met:counts.suppliers>=5},
            {label:'5+ clientes activos', met:counts.clients>=5},
            {label:'Tasa de conversión >30%', met:+convRate>=30},
            {label:'3+ contratos abastecimiento', met:kpis.contratosActual>=3},
            {label:'5+ contratos abastecimiento', met:kpis.contratosActual>=5},
          ].map((l,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderRadius:8,
              background:l.met?`${c.lime}07`:'rgba(255,255,255,0.02)',border:`1px solid ${l.met?`${c.lime}20`:c.border}`}}>
              <span style={{fontSize:13}}>{l.met?'✅':'⬜'}</span>
              <span style={{fontSize:11,color:l.met?c.text:c.muted,fontWeight:l.met?500:400}}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
