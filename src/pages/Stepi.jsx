import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../supabase'

// ── THEME ─────────────────────────────────────────────────────────────────────
const T = {
  bg:     'linear-gradient(160deg,#050510 0%,#080818 50%,#050510 100%)',
  glass:  'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.07)',
  border2:'rgba(255,255,255,0.13)',
  text:   '#F0EFFF',
  muted:  '#8884A8',
  sub:    '#4A4870',
  orange: '#E8860A',
  orangeL:'#F5A623',
  lime:   '#22C55E',
  rose:   '#F43F5E',
  blue:   '#3B82F6',
  violet: '#8B5CF6',
  amber:  '#F59E0B',
  cyan:   '#06B6D4',
}

const fmtM = n => {
  const v = parseFloat(n)||0
  if(v>=1e6) return `$${(v/1e6).toFixed(2)}M`
  if(v>=1e3) return `$${(v/1e3).toFixed(0)}k`
  return `$${Math.round(v).toLocaleString('es-AR')}`
}

// ── SUGERENCIAS RÁPIDAS ───────────────────────────────────────────────────────
const SUGERENCIAS = [
  { icon:'💰', text:'¿Cómo está mi rentabilidad este mes?' },
  { icon:'🎯', text:'¿Qué clientes debería priorizar esta semana?' },
  { icon:'📊', text:'Analizá mi pipeline de ventas' },
  { icon:'⚠️', text:'¿Qué riesgos ves en mi negocio ahora?' },
  { icon:'📈', text:'Dame una estrategia para crecer este trimestre' },
  { icon:'🔍', text:'¿Cuáles son mis presupuestos sin respuesta?' },
  { icon:'💡', text:'¿Qué oportunidades estoy perdiendo?' },
  { icon:'🏆', text:'¿Cuál es mi cliente más valioso?' },
]

// ── RECOLECTAR CONTEXTO DE SUPABASE ──────────────────────────────────────────
async function recolectarContexto() {
  const now = new Date()
  const mesI  = new Date(now.getFullYear(),now.getMonth(),1).toISOString().split('T')[0]
  const mesPI = new Date(now.getFullYear(),now.getMonth()-1,1).toISOString().split('T')[0]
  const mesPF = new Date(now.getFullYear(),now.getMonth(),0).toISOString().split('T')[0]
  const anioI = `${now.getFullYear()}-01-01`

  const [
    clients, invoicesMes, invoicesMesPrev, invoicesAnio,
    purchases, purchasesMes,
    quotes, quotesMes,
    operations, products, suppliers,
  ] = await Promise.all([
    supabase.from('clients').select('id,name,status,industry,city,last_contact,payment_condition,total_revenue,next_action,next_action_date,purchase_frequency').order('name'),
    supabase.from('invoices').select('id,number,tipo,client_name,client_id,total,status,date,neto,iva_21').gte('date',mesI),
    supabase.from('invoices').select('total,status').gte('date',mesPI).lte('date',mesPF),
    supabase.from('invoices').select('total,date,client_name').gte('date',anioI),
    supabase.from('purchases').select('id,supplier_name,category,total,status,date').order('date',{ascending:false}).limit(50),
    supabase.from('purchases').select('total,category').gte('date',mesI),
    supabase.from('quotes').select('id,number,client_name,client_id,total,status,date,expires_at').order('date',{ascending:false}).limit(50),
    supabase.from('quotes').select('total,status,client_name,expires_at,date').gte('date',mesI),
    supabase.from('operations').select('id,number,name,client_name,status,total_venta,ganancia,rentabilidad,date,next_action,next_action_date,products_involved,company_size').order('date',{ascending:false}).limit(30),
    supabase.from('products').select('id,name,brand,category,cost_price,sale_price,stock').limit(100),
    supabase.from('suppliers').select('id,name,category,contact_name,phone,email').order('name'),
  ])

  const invMes = invoicesMes.data||[]
  const facturadoMes = invMes.reduce((s,i)=>s+(i.total||0),0)
  const cobradoMes = invMes.filter(i=>['COBRADA','Cobrada'].includes(i.status)).reduce((s,i)=>s+(i.total||0),0)
  const pendienteCobro = invMes.filter(i=>['PENDIENTE','Pendiente','EMITIDA','Emitida'].includes(i.status)).reduce((s,i)=>s+(i.total||0),0)
  const facturadoMesPrev = (invoicesMesPrev.data||[]).reduce((s,i)=>s+(i.total||0),0)
  const facturadoAnio = (invoicesAnio.data||[]).reduce((s,i)=>s+(i.total||0),0)
  const egresosMes = (purchasesMes.data||[]).reduce((s,p)=>s+(p.total||0),0)
  const resultado = facturadoMes - egresosMes
  const rentPct = facturadoMes>0?(resultado/facturadoMes*100).toFixed(1):0
  const tendencia = facturadoMesPrev>0?((facturadoMes-facturadoMesPrev)/facturadoMesPrev*100).toFixed(1):null

  const qMes = quotesMes.data||[]
  const pptosAprobados = qMes.filter(q=>q.status==='APROBADO').length
  const pptosRechazados = qMes.filter(q=>q.status==='RECHAZADO').length
  const pptosEnviados = qMes.filter(q=>q.status==='ENVIADO').length
  const convRate = qMes.length>0?(pptosAprobados/qMes.length*100).toFixed(0):0

  const opsData = operations.data||[]
  const opsActivas = opsData.filter(o=>o.status!=='CERRADO')
  const pipelineTotal = opsActivas.reduce((s,o)=>s+(o.total_venta||0),0)

  // Clientes sin contactar hace más de 30 días
  const clsData = clients.data||[]
  const sinContactar = clsData.filter(c=>{
    if(!c.last_contact) return c.status==='ACTIVO'
    const dias = Math.floor((Date.now()-new Date(c.last_contact))/86400000)
    return dias>30 && c.status==='ACTIVO'
  })

  // Presupuestos vencidos sin respuesta
  const pptosVencidos = (quotes.data||[]).filter(q=>{
    return q.expires_at && new Date(q.expires_at)<new Date() && !['APROBADO','RECHAZADO'].includes(q.status)
  })

  // Acciones vencidas
  const accionesVencidas = opsData.filter(o=>
    o.next_action_date && new Date(o.next_action_date)<new Date() && o.status!=='CERRADO'
  )

  // Facturación por cliente (anual)
  const facturacionPorCliente = {}
  ;(invoicesAnio.data||[]).forEach(inv=>{
    if(inv.client_name) {
      facturacionPorCliente[inv.client_name] = (facturacionPorCliente[inv.client_name]||0)+(inv.total||0)
    }
  })
  const topClientes = Object.entries(facturacionPorCliente)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,5)
    .map(([nombre,total])=>({nombre,total:fmtM(total)}))

  // Egresos por categoría este mes
  const egresosPorCat = {}
  ;(purchasesMes.data||[]).forEach(p=>{
    egresosPorCat[p.category] = (egresosPorCat[p.category]||0)+(p.total||0)
  })

  const mesActual = now.toLocaleDateString('es-AR',{month:'long',year:'numeric'})
  const fechaHoy = now.toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})

  return `
=== CONTEXTO COMPLETO DE STEPS — ${fechaHoy} ===

EMPRESA: STEPS — Seguridad Industrial y EPP (Equipos de Protección Personal)
DUEÑO: Santiago
UBICACIÓN: Catriel, Neuquén, Argentina
SECTORES QUE SIRVE: Oil & Gas, Construcción, Geotécnica
DESCRIPCIÓN: Empresa de venta de indumentaria de seguridad, EPP, herramientas, señalización vial, contra incendio y construcción. Provee a empresas petroleras, constructoras y geotécnicas principalmente en la Patagonia.

=== MÉTRICAS FINANCIERAS — ${mesActual} ===
Facturado este mes: ${fmtM(facturadoMes)}
Cobrado: ${fmtM(cobradoMes)}
Pendiente de cobro: ${fmtM(pendienteCobro)}
Egresos (compras): ${fmtM(egresosMes)}
Resultado bruto: ${fmtM(resultado)}
Rentabilidad: ${rentPct}%
Facturado mes anterior: ${fmtM(facturadoMesPrev)}
Tendencia vs mes anterior: ${tendencia!==null?`${tendencia>=0?'+':''}${tendencia}%`:'Sin datos del mes anterior'}
Facturado año ${now.getFullYear()}: ${fmtM(facturadoAnio)}

=== PRESUPUESTOS — ${mesActual} ===
Total emitidos: ${qMes.length}
Aprobados: ${pptosAprobados}
Rechazados: ${pptosRechazados}
Enviados (sin respuesta): ${pptosEnviados}
Tasa de conversión: ${convRate}%
${pptosVencidos.length>0?`ALERTA: ${pptosVencidos.length} presupuestos vencidos sin respuesta:\n${pptosVencidos.map(p=>`  - P-${String(p.number||0).padStart(4,'0')} para ${p.client_name} (${fmtM(p.total)}) — vencido el ${new Date(p.expires_at).toLocaleDateString('es-AR')}`).join('\n')}`:
'Sin presupuestos vencidos.'}

=== PIPELINE DE VENTAS ===
Total en pipeline: ${fmtM(pipelineTotal)}
Operaciones activas: ${opsActivas.length}
${opsActivas.length>0?`Detalle:\n${opsActivas.slice(0,10).map(o=>`  - OP-${String(o.number||0).padStart(3,'0')} | ${o.client_name} | ${o.name||''} | ${fmtM(o.total_venta)} | Estado: ${o.status}${o.next_action?` | Próxima acción: ${o.next_action} (${o.next_action_date||'sin fecha'})`:''}`)
.join('\n')}`:
'Sin operaciones activas.'}

${accionesVencidas.length>0?`ALERTA — ACCIONES VENCIDAS (${accionesVencidas.length}):\n${accionesVencidas.map(o=>`  - ${o.client_name}: "${o.next_action}" — vencida el ${o.next_action_date}`).join('\n')}`:''}

=== CLIENTES (${clsData.length} total) ===
Activos: ${clsData.filter(c=>c.status==='ACTIVO').length}
Leads/Prospectos: ${clsData.filter(c=>['LEAD','EN_CONTACTO','PROSPECTO'].includes(c.status)).length}
Inactivos: ${clsData.filter(c=>c.status==='INACTIVO').length}

${sinContactar.length>0?`ALERTA — ${sinContactar.length} CLIENTES ACTIVOS SIN CONTACTAR HACE +30 DÍAS:\n${sinContactar.map(c=>`  - ${c.name} (${c.industry||'sin rubro'}) — último contacto: ${c.last_contact?new Date(c.last_contact).toLocaleDateString('es-AR'):'nunca'}`).join('\n')}`:'Todos los clientes activos contactados recientemente.'}

Lista completa de clientes:
${clsData.map(c=>`  - ${c.name} | Estado: ${c.status} | ${c.industry||'sin rubro'} | ${c.city||'sin ciudad'}${c.next_action?` | Acción: ${c.next_action}`:''}`)
.join('\n')}

Top 5 clientes por facturación anual:
${topClientes.length>0?topClientes.map((c,i)=>`  ${i+1}. ${c.nombre}: ${c.total}`).join('\n'):'Sin datos de facturación por cliente.'}

=== PROVEEDORES (${(suppliers.data||[]).length}) ===
${(suppliers.data||[]).map(p=>`  - ${p.name} | ${p.category||'sin categoría'} | Contacto: ${p.contact_name||'—'}`).join('\n')||'Sin proveedores registrados.'}

=== CATÁLOGO ===
Total productos: ${(products.data||[]).length}
${(products.data||[]).slice(0,20).map(p=>`  - ${p.name} | ${p.brand||''} | Cat: ${p.category||''} | Precio: ${p.sale_price?fmtM(p.sale_price):'—'} | Stock: ${p.stock||0}`).join('\n')}
${(products.data||[]).length>20?`... y ${(products.data||[]).length-20} productos más.`:''}

=== EGRESOS POR CATEGORÍA — ${mesActual} ===
${Object.entries(egresosPorCat).length>0?
  Object.entries(egresosPorCat).sort((a,b)=>b[1]-a[1]).map(([cat,total])=>`  - ${cat}: ${fmtM(total)}`).join('\n'):
  'Sin egresos registrados este mes.'}

=== ÚLTIMAS COMPRAS ===
${(purchases.data||[]).slice(0,10).map(p=>`  - ${p.supplier_name} | ${p.category} | ${fmtM(p.total)} | ${p.date} | ${p.status}`).join('\n')||'Sin compras registradas.'}

=== FIN DEL CONTEXTO ===
`
}

// ── JARVIS AVATAR ─────────────────────────────────────────────────────────────
function StepiAvatar({ thinking }) {
  return (
    <div style={{
      width:38,height:38,borderRadius:'50%',flexShrink:0,
      background:'linear-gradient(135deg,rgba(232,134,10,0.3),rgba(139,92,246,0.2))',
      border:'1.5px solid rgba(232,134,10,0.5)',
      display:'flex',alignItems:'center',justifyContent:'center',
      boxShadow:`0 0 20px rgba(232,134,10,0.3)`,
      position:'relative',overflow:'hidden',
    }}>
      {thinking && (
        <div style={{
          position:'absolute',inset:0,borderRadius:'50%',
          background:'conic-gradient(from 0deg,transparent,rgba(232,134,10,0.6),transparent)',
          animation:'spinFast 1s linear infinite',
        }}/>
      )}
      <div style={{position:'relative',zIndex:1,fontSize:18}}>⚡</div>
    </div>
  )
}

// ── MESSAGE BUBBLE ────────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{
      display:'flex',gap:12,
      flexDirection:isUser?'row-reverse':'row',
      alignItems:'flex-start',
      animation:'msgSlide 0.3s cubic-bezier(0.34,1.2,0.64,1) both',
    }}>
      {/* Avatar */}
      {!isUser && <StepiAvatar thinking={false}/>}
      {isUser && (
        <div style={{width:38,height:38,borderRadius:'50%',flexShrink:0,
          background:'linear-gradient(135deg,rgba(59,130,246,0.3),rgba(139,92,246,0.2))',
          border:'1.5px solid rgba(59,130,246,0.4)',
          display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>
          🧉
        </div>
      )}

      {/* Bubble */}
      <div style={{
        maxWidth:'78%',
        padding:isUser?'12px 16px':'14px 18px',
        borderRadius:isUser?'18px 4px 18px 18px':'4px 18px 18px 18px',
        background:isUser
          ?'linear-gradient(135deg,rgba(59,130,246,0.15),rgba(139,92,246,0.1))'
          :'rgba(255,255,255,0.05)',
        backdropFilter:'blur(20px)',
        border:isUser
          ?'1px solid rgba(59,130,246,0.25)'
          :'1px solid rgba(255,255,255,0.08)',
        borderTop:isUser
          ?'1px solid rgba(59,130,246,0.4)'
          :'1px solid rgba(255,255,255,0.15)',
        boxShadow:isUser
          ?'0 4px 20px rgba(59,130,246,0.1)'
          :'0 4px 20px rgba(0,0,0,0.3)',
      }}>
        {/* Timestamp */}
        <div style={{fontSize:9,color:T.sub,marginBottom:6,fontWeight:600,
          textAlign:isUser?'right':'left'}}>
          {isUser?'Santiago':'Stepi — Consultor STEPS'}
          {msg.ts && <span style={{marginLeft:6,opacity:0.5}}>
            {new Date(msg.ts).toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})}
          </span>}
        </div>

        {/* Content */}
        <div style={{
          fontSize:13,lineHeight:1.75,color:T.text,
          whiteSpace:'pre-wrap',wordBreak:'break-word',
        }}>
          {msg.content}
        </div>
      </div>
    </div>
  )
}

// ── THINKING INDICATOR ────────────────────────────────────────────────────────
function ThinkingBubble() {
  return (
    <div style={{display:'flex',gap:12,alignItems:'flex-start',
      animation:'msgSlide 0.3s ease both'}}>
      <StepiAvatar thinking={true}/>
      <div style={{
        padding:'14px 18px',borderRadius:'4px 18px 18px 18px',
        background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',
        display:'flex',alignItems:'center',gap:8,
      }}>
        <div style={{display:'flex',gap:4,alignItems:'center'}}>
          {[0,1,2].map(i=>(
            <div key={i} style={{
              width:6,height:6,borderRadius:'50%',
              background:T.orange,
              animation:`dotBounce 1.2s ease-in-out ${i*0.15}s infinite`,
            }}/>
          ))}
        </div>
        <span style={{fontSize:11,color:T.muted,fontStyle:'italic'}}>Analizando tu negocio...</span>
      </div>
    </div>
  )
}

// ── MAIN JARVIS ───────────────────────────────────────────────────────────────
export default function Stepi() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [contexto, setContexto] = useState(null)
  const [loadingCtx, setLoadingCtx] = useState(true)
  const [ctxError, setCtxError] = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)
  const messagesRef = useRef([])

  // Cargar contexto al montar
  useEffect(()=>{
    const load = async () => {
      try {
        const ctx = await recolectarContexto()
        setContexto(ctx)
        // Mensaje de bienvenida inicial
        setMessages([{
          role:'assistant',
          content:`Hola Santiago 🧉\n\nSoy Stepi, tu consultor de negocios para STEPS. Acabo de analizar toda la información actual de tu empresa — clientes, facturas, presupuestos, operaciones y pipeline.\n\nEstoy listo para ayudarte a tomar mejores decisiones. Podés preguntarme cualquier cosa sobre tu negocio, pedirme análisis, estrategias de crecimiento o recomendaciones concretas.\n\n¿Por dónde empezamos?`,
          ts: Date.now(),
        }])
      } catch(e) {
        setCtxError(true)
      }
      setLoadingCtx(false)
    }
    load()
  },[])

  // Auto-scroll
  useEffect(()=>{
    bottomRef.current?.scrollIntoView({behavior:'smooth'})
  },[messages, thinking])

  // Sync ref
  useEffect(()=>{
    messagesRef.current = messages
  },[messages])

  const send = useCallback(async (text) => {
    const userText = (text||input).trim()
    if(!userText || thinking || !contexto) return
    setInput('')

    const userMsg = {role:'user', content:userText, ts:Date.now()}
    const newMessages = [...messagesRef.current, userMsg]
    setMessages(newMessages)
    setThinking(true)

    try {
      // Construir historial para la API
      const historial = newMessages.map(m=>({
        role: m.role,
        content: m.content,
      }))

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: `Sos Stepi, el asistente de negocios personal de Santiago, dueño de STEPS — empresa de seguridad industrial y EPP en la Patagonia argentina.

Tu rol es ser su CFO y consultor de negocios virtual. Tenés acceso completo y actualizado a todos los datos de su empresa.

CONTEXTO ACTUAL DE LA EMPRESA:
${contexto}

CÓMO RESPONDÉS:
- Respondés SIEMPRE en español rioplatense (vos, no tú)
- Sos directo, preciso y usás los datos reales
- Cuando hay alertas o problemas, los señalás claramente
- Cuando hay oportunidades, las destacás con entusiasmo
- Mezclás análisis de datos con consejos estratégicos de negocios
- Usás emojis con moderación para hacer más legibles las respuestas
- Si te preguntan algo que no está en los datos, lo decís claramente
- Recordás todo lo que se habló en la conversación actual
- Cuando das recomendaciones, las hacés concretas y accionables para el rubro EPP/Oil&Gas/Construcción en Argentina
- Tu análisis considera el contexto argentino: inflación, dólar, estacionalidad del sector petrolero
- Nunca inventás datos — solo usás lo que está en el contexto

PERSONALIDAD:
- Profesional pero cercano
- Como un socio de negocios que conoce la empresa en detalle
- Proactivo: si ves algo importante en los datos, lo mencionás aunque no te lo pregunten`,
          messages: historial,
        }),
      })

      const data = await response.json()
      const content = data.content?.[0]?.text || 'No pude procesar tu consulta. Intentá de nuevo.'

      setMessages(prev=>[...prev,{
        role:'assistant',
        content,
        ts: Date.now(),
      }])
    } catch(e) {
      setMessages(prev=>[...prev,{
        role:'assistant',
        content:'Hubo un error al procesar tu consulta. Verificá la conexión e intentá de nuevo.',
        ts: Date.now(),
      }])
    }
    setThinking(false)
    setTimeout(()=>inputRef.current?.focus(), 100)
  },[input, thinking, contexto])

  const handleKey = e => {
    if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const refreshCtx = async () => {
    setLoadingCtx(true)
    try {
      const ctx = await recolectarContexto()
      setContexto(ctx)
    } catch(e){}
    setLoadingCtx(false)
  }

  const clearChat = () => {
    setMessages([{
      role:'assistant',
      content:'Conversación reiniciada. Seguí preguntando lo que necesitás sobre STEPS 🧉',
      ts: Date.now(),
    }])
  }

  return (
    <div style={{
      height:'calc(100vh - 48px)',
      display:'flex',flexDirection:'column',
      background:T.bg,fontFamily:"'Nunito Sans',system-ui,sans-serif",
      color:T.text,position:'relative',
    }}>
      <style>{`
        @keyframes msgSlide{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes dotBounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
        @keyframes spinFast{to{transform:rotate(360deg)}}
        @keyframes glowPulse{0%,100%{opacity:0.5}50%{opacity:1}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .msg-input:focus{outline:none;border-color:rgba(232,134,10,0.5)!important;box-shadow:0 0 0 3px rgba(232,134,10,0.08)!important}
        .sug-btn:hover{background:rgba(232,134,10,0.12)!important;border-color:rgba(232,134,10,0.4)!important;transform:translateY(-2px)!important}
      `}</style>

      {/* ── HEADER ── */}
      <div style={{
        padding:'16px 24px',flexShrink:0,
        background:'rgba(255,255,255,0.03)',
        backdropFilter:'blur(20px)',
        borderBottom:'1px solid rgba(255,255,255,0.07)',
        display:'flex',alignItems:'center',justifyContent:'space-between',
      }}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          {/* Logo Stepi */}
          <div style={{
            width:46,height:46,borderRadius:14,
            background:'linear-gradient(135deg,rgba(232,134,10,0.2),rgba(139,92,246,0.15))',
            border:'1.5px solid rgba(232,134,10,0.4)',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:24,position:'relative',overflow:'hidden',
            boxShadow:'0 0 24px rgba(232,134,10,0.2)',
          }}>
            <div style={{position:'absolute',inset:0,
              background:'conic-gradient(from 0deg,transparent 30%,rgba(232,134,10,0.15) 50%,transparent 70%)',
              animation:'spinFast 4s linear infinite',pointerEvents:'none'}}/>
            <span style={{position:'relative',zIndex:1}}>⚡</span>
          </div>
          <div>
            <div style={{fontSize:18,fontWeight:900,
              background:`linear-gradient(135deg,${T.orange},${T.orangeL})`,
              WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',
              fontFamily:"'Syne',sans-serif"}}>
              Stepi
            </div>
            <div style={{fontSize:10,color:T.muted,marginTop:1}}>
              Consultor de negocios · STEPS Command Center
            </div>
          </div>
        </div>

        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {/* Status */}
          <div style={{display:'flex',alignItems:'center',gap:6,padding:'6px 12px',
            borderRadius:20,background:'rgba(255,255,255,0.04)',
            border:'1px solid rgba(255,255,255,0.07)'}}>
            <div style={{width:6,height:6,borderRadius:'50%',
              background:loadingCtx?T.amber:ctxError?T.rose:T.lime,
              boxShadow:`0 0 6px ${loadingCtx?T.amber:ctxError?T.rose:T.lime}`,
              animation:loadingCtx?'glowPulse 1s ease infinite':'none'}}/>
            <span style={{fontSize:10,color:T.muted,fontWeight:600}}>
              {loadingCtx?'Cargando datos...':ctxError?'Error de conexión':'Datos sincronizados'}
            </span>
          </div>

          {/* Refresh */}
          <button onClick={refreshCtx} disabled={loadingCtx}
            title="Actualizar datos de Supabase"
            style={{width:34,height:34,borderRadius:10,border:'1px solid rgba(255,255,255,0.07)',
              background:'rgba(255,255,255,0.04)',cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:14,color:T.muted,transition:'all 0.2s',
              opacity:loadingCtx?0.4:1}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(232,134,10,0.3)';e.currentTarget.style.color=T.orange}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.07)';e.currentTarget.style.color=T.muted}}>
            {loadingCtx?'⏳':'🔄'}
          </button>

          {/* Clear */}
          <button onClick={clearChat}
            title="Nueva conversación"
            style={{width:34,height:34,borderRadius:10,border:'1px solid rgba(255,255,255,0.07)',
              background:'rgba(255,255,255,0.04)',cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:14,color:T.muted,transition:'all 0.2s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(244,63,94,0.3)';e.currentTarget.style.color=T.rose}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.07)';e.currentTarget.style.color=T.muted}}>
            🗑
          </button>
        </div>
      </div>

      {/* ── MESSAGES ── */}
      <div style={{
        flex:1,overflowY:'auto',padding:'20px 24px',
        display:'flex',flexDirection:'column',gap:16,
        scrollbarWidth:'thin',scrollbarColor:'rgba(255,255,255,0.1) transparent',
      }}>
        {loadingCtx ? (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
            height:'100%',gap:16,color:T.muted}}>
            <div style={{fontSize:40,animation:'glowPulse 1.5s ease infinite'}}>⚡</div>
            <div style={{fontSize:14}}>Cargando datos de STEPS...</div>
            <div style={{fontSize:11,color:T.sub}}>Analizando clientes, facturas, pipeline...</div>
          </div>
        ) : (
          <>
            {messages.map((msg,i)=>(
              <MessageBubble key={i} msg={msg}/>
            ))}
            {thinking && <ThinkingBubble/>}

            {/* Sugerencias — solo si hay pocos mensajes */}
            {messages.length<=1 && !thinking && (
              <div style={{marginTop:8,animation:'fadeIn 0.5s 0.3s ease both'}}>
                <div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:'uppercase',
                  letterSpacing:'0.1em',marginBottom:10,textAlign:'center'}}>
                  Consultás frecuentes
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6}}>
                  {SUGERENCIAS.map((s,i)=>(
                    <button key={i} onClick={()=>send(s.text)}
                      className="sug-btn"
                      style={{
                        padding:'10px 12px',borderRadius:12,cursor:'pointer',
                        border:'1px solid rgba(255,255,255,0.07)',
                        background:'rgba(255,255,255,0.03)',
                        color:T.text2,fontSize:11,textAlign:'left',
                        transition:'all 0.2s cubic-bezier(0.34,1.2,0.64,1)',
                        lineHeight:1.4,
                      }}>
                      <div style={{fontSize:16,marginBottom:5}}>{s.icon}</div>
                      <div style={{color:T.muted,fontSize:10}}>{s.text}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* ── INPUT ── */}
      <div style={{
        padding:'16px 24px 20px',flexShrink:0,
        background:'rgba(255,255,255,0.02)',
        backdropFilter:'blur(20px)',
        borderTop:'1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Context preview strip */}
        {contexto && (
          <div style={{
            fontSize:9,color:T.sub,marginBottom:10,
            display:'flex',gap:12,flexWrap:'wrap',alignItems:'center',
          }}>
            <span style={{color:T.lime,fontWeight:700}}>● Datos actualizados</span>
            <span>Presupuestos · Facturas · Clientes · Operaciones · Pipeline</span>
          </div>
        )}

        <div style={{display:'flex',gap:10,alignItems:'flex-end'}}>
          <div style={{flex:1,position:'relative'}}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Preguntale a Stepi sobre tu negocio... (Enter para enviar, Shift+Enter para nueva línea)"
              disabled={thinking||loadingCtx}
              rows={1}
              className="msg-input"
              style={{
                width:'100%',boxSizing:'border-box',
                padding:'13px 18px',borderRadius:14,resize:'none',
                border:'1px solid rgba(255,255,255,0.1)',
                background:'rgba(255,255,255,0.05)',
                backdropFilter:'blur(20px)',
                color:T.text,fontSize:13,lineHeight:1.5,
                transition:'all 0.2s',fontFamily:'inherit',
                opacity:thinking||loadingCtx?0.5:1,
                maxHeight:120,overflowY:'auto',
              }}
            />
          </div>
          <button
            onClick={()=>send()}
            disabled={thinking||loadingCtx||!input.trim()}
            style={{
              width:48,height:48,borderRadius:14,border:'none',
              cursor:thinking||loadingCtx||!input.trim()?'not-allowed':'pointer',
              background:thinking||!input.trim()
                ?'rgba(255,255,255,0.06)'
                :`linear-gradient(135deg,${T.orangeL},${T.orange})`,
              color:thinking||!input.trim()?T.muted:'#000',
              fontSize:20,display:'flex',alignItems:'center',justifyContent:'center',
              transition:'all 0.2s cubic-bezier(0.34,1.4,0.64,1)',
              boxShadow:!thinking&&input.trim()?`0 4px 20px rgba(232,134,10,0.4)`:'none',
              opacity:thinking||loadingCtx||!input.trim()?0.4:1,
              flexShrink:0,
            }}
            onMouseEnter={e=>{if(!thinking&&input.trim())e.currentTarget.style.transform='scale(1.08)'}}
            onMouseLeave={e=>{e.currentTarget.style.transform='none'}}>
            {thinking ? '⏳' : '↑'}
          </button>
        </div>

        <div style={{fontSize:9,color:T.sub,marginTop:8,textAlign:'center'}}>
          Stepi tiene acceso a todos los datos de STEPS en tiempo real · La conversación se mantiene en sesión
        </div>
      </div>
    </div>
  )
}
