import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const c = {
  bg:'#07070f', border:'rgba(255,255,255,0.07)',
  cyan:'#06b6d4', violet:'#7c3aed', lime:'#84cc16',
  amber:'#f59e0b', rose:'#f43f5e', text:'#f1f5f9',
  muted:'#475569', sub:'#94a3b8'
}

const fmtM = (v,p='') => {
  const n=+v||0
  if(n>=1000000) return `${p}${(n/1000000).toFixed(1)}M`
  if(n>=1000) return `${p}${(n/1000).toFixed(0)}K`
  return `${p}${n.toLocaleString('es-AR')}`
}

export default function Dashboard() {
  const [counts, setCounts] = useState({products:0, suppliers:0, clients:0, proposals:0})
  const [kpis, setKpis] = useState({
    facturado:0, cobrado:0, pendiente:0,
    clientesActivos:0, clientesNuevos:0,
    enviados:0, aprobados:0,
    contratosActual:0, contratosMeta:5,
    cajaActual:0, oportunidades:[]
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [p, s, cl, pr, k] = await Promise.all([
      supabase.from('products').select('id', {count:'exact'}),
      supabase.from('suppliers').select('id', {count:'exact'}),
      supabase.from('clients').select('id', {count:'exact'}),
      supabase.from('proposals').select('id', {count:'exact'}),
      supabase.from('kpis').select('*').limit(1).single()
    ])
    setCounts({
      products: p.count||0,
      suppliers: s.count||0,
      clients: cl.count||0,
      proposals: pr.count||0
    })
    if (k.data?.data) setKpis(prev => ({...prev, ...k.data.data}))
    setLoading(false)
  }

  const saveKpis = async (newKpis) => {
    setKpis(newKpis)
    const existing = await supabase.from('kpis').select('id').limit(1).single()
    if (existing.data) {
      await supabase.from('kpis').update({data: newKpis, updated_at: new Date()}).eq('id', existing.data.id)
    } else {
      await supabase.from('kpis').insert({data: newKpis})
    }
  }

  const [editingOrgan, setEditingOrgan] = useState(null)
  const [form, setForm] = useState({})

  const convRate = kpis.enviados > 0 ? ((kpis.aprobados/kpis.enviados)*100).toFixed(0) : 0
  const contratosPct = kpis.contratosMeta > 0 ? Math.min(100, Math.round((kpis.contratosActual/kpis.contratosMeta)*100)) : 0

  const sc = {sano:c.lime, atencion:c.amber, critico:c.rose}
  const sl = {sano:'Sano ✓', atencion:'Atención', critico:'Crítico !'}

  const organs = [
    {
      id:'ingresos', icon:'❤️', name:'Corazón', sub:'INGRESOS',
      status: kpis.cobrado>0?'sano':kpis.facturado>0?'atencion':'critico',
      fields:[
        {l:'Facturado', v:fmtM(kpis.facturado,'$'), hi:true},
        {l:'Cobrado', v:fmtM(kpis.cobrado,'$')},
        {l:'Pendiente', v:fmtM(kpis.pendiente,'$')},
      ],
      editKeys:['facturado','cobrado','pendiente'],
      editLabels:['Facturado mes','Cobrado mes','Pendiente cobro']
    },
    {
      id:'clientes', icon:'🫁', name:'Pulmones', sub:'CLIENTES',
      status: counts.clients>=10?'sano':counts.clients>0?'atencion':'critico',
      fields:[
        {l:'Total', v:counts.clients, hi:true},
        {l:'Activos', v:kpis.clientesActivos},
        {l:'Nuevos', v:kpis.clientesNuevos},
      ],
      editKeys:['clientesActivos','clientesNuevos'],
      editLabels:['Clientes activos','Clientes nuevos']
    },
    {
      id:'presupuestos', icon:'🧠', name:'Cerebro', sub:'PRESUPUESTOS',
      status: +convRate>=30?'sano':kpis.enviados>0?'atencion':'critico',
      fields:[
        {l:'Enviados', v:kpis.enviados},
        {l:'Aprobados', v:kpis.aprobados, hi:true},
        {l:'Conversión', v:`${convRate}%`},
      ],
      editKeys:['enviados','aprobados'],
      editLabels:['Enviados','Aprobados']
    },
    {
      id:'proveedores', icon:'🦴', name:'Esqueleto', sub:'PROVEEDORES',
      status: counts.suppliers>=5?'sano':counts.suppliers>0?'atencion':'critico',
      fields:[
        {l:'Total', v:counts.suppliers, hi:true},
        {l:'Productos', v:counts.products},
      ],
      noEdit:true
    },
    {
      id:'caja', icon:'🩸', name:'Circulatorio', sub:'CAJA',
      status: kpis.cajaActual>0?'sano':'critico',
      fields:[
        {l:'Caja actual', v:fmtM(kpis.cajaActual,'$'), hi:true},
      ],
      editKeys:['cajaActual'],
      editLabels:['Caja actual']
    },
    {
      id:'catalogo', icon:'⚙️', name:'Fábrica', sub:'CATÁLOGO',
      status: counts.products>=20?'sano':counts.products>0?'atencion':'critico',
      fields:[
        {l:'Productos', v:counts.products, hi:true},
        {l:'Propuestas', v:counts.proposals},
      ],
      noEdit:true
    },
  ]

  const sickOrgans = organs.filter(o=>o.status!=='sano')

  const startEdit = (organ) => {
    const f = {}
    organ.editKeys?.forEach(k => f[k] = kpis[k]||0)
    setForm(f)
    setEditingOrgan(organ.id)
  }

  const saveEdit = () => {
    saveKpis({...kpis, ...form})
    setEditingOrgan(null)
  }

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',color:c.cyan}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:8}}>⚡</div>
        <div>Cargando datos...</div>
      </div>
    </div>
  )

  return (
    <div>
      {/* HEADER */}
      <div style={{marginBottom:20}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
          <div style={{width:7,height:7,borderRadius:'50%',background:c.cyan,boxShadow:`0 0 10px ${c.cyan}`}}/>
          <span style={{fontSize:11,color:c.cyan,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.1em'}}>Organismo Vivo</span>
        </div>
        <h1 style={{margin:'0 0 8px',fontSize:22,fontWeight:900}}>
          ¿Qué órgano necesita atención hoy?
        </h1>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {sickOrgans.length===0
            ? <span style={{fontSize:12,padding:'4px 12px',borderRadius:20,background:`${c.lime}15`,border:`1px solid ${c.lime}30`,color:c.lime,fontWeight:600}}>✅ Todo funcionando bien</span>
            : sickOrgans.map(o=>(
              <span key={o.id} style={{fontSize:12,padding:'4px 12px',borderRadius:20,fontWeight:600,
                background:`${sc[o.status]}15`,border:`1px solid ${sc[o.status]}30`,color:sc[o.status]}}>
                {o.icon} {o.sub}
              </span>
            ))
          }
        </div>
      </div>

      {/* STEPS CORE */}
      <div style={{background:'linear-gradient(135deg,rgba(6,182,212,0.07),rgba(124,58,237,0.07))',
        border:'1px solid rgba(6,182,212,0.2)',borderRadius:14,padding:'12px 18px',marginBottom:14,
        display:'flex',gap:20,flexWrap:'wrap',alignItems:'center'}}>
        <div style={{fontSize:11,fontWeight:700,color:c.cyan,textTransform:'uppercase',letterSpacing:'0.1em',flexShrink:0}}>⚡ STEPS CORE</div>
        {[
          {l:'Facturado',v:fmtM(kpis.facturado,'$'),color:c.lime},
          {l:'Clientes',v:counts.clients,color:c.cyan},
          {l:'Conversión',v:`${convRate}%`,color:c.violet},
          {l:'Abastec.',v:`${kpis.contratosActual}/${kpis.contratosMeta}`,color:c.lime},
          {l:'Propuestas',v:counts.proposals,color:c.amber},
        ].map(k=>(
          <div key={k.l} style={{display:'flex',gap:8,alignItems:'baseline'}}>
            <span style={{fontSize:18,fontWeight:900,color:k.color}}>{k.v}</span>
            <span style={{fontSize:10,color:c.muted}}>{k.l}</span>
          </div>
        ))}
      </div>

      {/* ORGANS */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:10}}>
        {organs.map(organ => {
          const color = sc[organ.status]
          const isEditing = editingOrgan === organ.id
          return (
            <div key={organ.id} style={{background:'rgba(255,255,255,0.035)',border:`1px solid ${color}25`,borderRadius:14,padding:16,transition:'border-color .2s'}}
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
                <div style={{display:'flex',gap:6,alignItems:'center'}}>
                  <div style={{display:'flex',alignItems:'center',gap:4,padding:'2px 8px',borderRadius:20,background:`${color}15`,border:`1px solid ${color}30`}}>
                    <div style={{width:5,height:5,borderRadius:'50%',background:color,boxShadow:`0 0 4px ${color}`}}/>
                    <span style={{fontSize:9,fontWeight:700,color}}>{sl[organ.status]}</span>
                  </div>
                  {!organ.noEdit && !isEditing && (
                    <button onClick={()=>startEdit(organ)} style={{background:'none',border:`1px solid ${c.border}`,borderRadius:5,color:c.muted,cursor:'pointer',fontSize:10,padding:'2px 6px'}}>✏️</button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:8}}>
                    {organ.editKeys.map((k,i)=>(
                      <div key={k}>
                        <div style={{fontSize:9,color:c.muted,marginBottom:2}}>{organ.editLabels[i]}</div>
                        <input type="number" value={form[k]||0} onChange={e=>setForm(p=>({...p,[k]:+e.target.value}))}
                          style={{background:'rgba(255,255,255,0.08)',border:`1px solid ${c.border}`,borderRadius:6,padding:'5px 8px',color:c.text,fontSize:12,width:'100%',boxSizing:'border-box'}}/>
                      </div>
                    ))}
                  </div>
                  <div style={{display:'flex',gap:5}}>
                    <button onClick={()=>setEditingOrgan(null)} style={{flex:1,padding:'6px',borderRadius:6,border:`1px solid ${c.border}`,background:'transparent',color:c.sub,cursor:'pointer',fontSize:11}}>Cancelar</button>
                    <button onClick={saveEdit} style={{flex:1,padding:'6px',borderRadius:6,border:'none',background:c.cyan,color:'#000',cursor:'pointer',fontSize:11,fontWeight:700}}>Guardar</button>
                  </div>
                </div>
              ) : (
                <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:6}}>
                  {organ.fields.map((f,i)=>(
                    <div key={i} style={{padding:'8px 10px',borderRadius:8,
                      background:f.hi?`${color}10`:'rgba(255,255,255,0.03)',
                      border:`1px solid ${f.hi?`${color}20`:c.border}`}}>
                      <div style={{fontSize:9,color:c.muted,marginBottom:2}}>{f.l}</div>
                      <div style={{fontSize:16,fontWeight:800,color:f.hi?color:c.text}}>{f.v}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ABASTECIMIENTO */}
      <div style={{background:'linear-gradient(135deg,rgba(132,204,22,0.05),rgba(6,182,212,0.05))',
        border:`2px solid ${c.lime}35`,borderRadius:16,padding:24,textAlign:'center',position:'relative',overflow:'hidden'}}>
        <div style={{fontSize:24,marginBottom:4}}>🚀</div>
        <div style={{fontSize:10,color:c.lime,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:4}}>Objetivo principal</div>
        <div style={{fontSize:16,fontWeight:800,marginBottom:20}}>ABASTECIMIENTO PLANIFICADO</div>
        <div style={{display:'flex',justifyContent:'center',gap:40,marginBottom:20}}>
          {[
            {l:'META',v:kpis.contratosMeta,color:c.lime},
            {l:'ACTUAL',v:kpis.contratosActual,color:c.cyan},
            {l:'FALTAN',v:Math.max(0,kpis.contratosMeta-kpis.contratosActual),color:c.amber},
          ].map(item=>(
            <div key={item.l}>
              <div style={{fontSize:10,color:c.muted,marginBottom:4,letterSpacing:'0.08em'}}>{item.l}</div>
              <div style={{fontSize:56,fontWeight:900,color:item.color,lineHeight:1}}>{item.v}</div>
            </div>
          ))}
        </div>
        <div style={{maxWidth:400,margin:'0 auto 12px'}}>
          <div style={{height:12,borderRadius:6,background:'rgba(255,255,255,0.07)',overflow:'hidden',marginBottom:6}}>
            <div style={{height:'100%',borderRadius:6,width:`${contratosPct}%`,
              background:`linear-gradient(90deg,${c.cyan},${c.lime})`,transition:'width 1s'}}/>
          </div>
          <div style={{fontSize:12,color:c.sub}}>{contratosPct}% del objetivo</div>
        </div>
        {editingOrgan==='abas' ? (
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
        ) : (
          <button onClick={()=>{setForm({contratosActual:kpis.contratosActual,contratosMeta:kpis.contratosMeta});setEditingOrgan('abas');}}
            style={{padding:'8px 20px',borderRadius:8,border:`1px solid ${c.lime}`,background:`${c.lime}15`,color:c.lime,cursor:'pointer',fontSize:13,fontWeight:600}}>
            Actualizar contratos
          </button>
        )}
      </div>
    </div>
 )
}