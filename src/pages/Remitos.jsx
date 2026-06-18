import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'

// ── THEME ─────────────────────────────────────────────────────────────────────
const T = {
  bg:     'linear-gradient(160deg,#050510 0%,#080818 50%,#050510 100%)',
  glass:  'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.07)',
  text:   '#F0EFFF', muted: '#8884A8', sub: '#4A4870',
  orange: '#E8860A', orangeL: '#F5A623',
  lime:   '#22C55E', rose:    '#F43F5E',
  blue:   '#3B82F6', amber:   '#F59E0B',
}

const fmtARS = n => {
  const v = parseFloat(n)||0
  return v.toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2})
}
const fmtDate = d => {
  if(!d) return ''
  return new Date(d+'T12:00:00').toLocaleDateString('es-AR',{day:'numeric',month:'numeric',year:'numeric'})
}
const today = () => new Date().toISOString().split('T')[0]

const glassCard = (extra={}) => ({
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderTop: '1px solid rgba(255,255,255,0.13)',
  borderRadius: 16,
  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
  ...extra,
})

// ── PDF GENERATOR ─────────────────────────────────────────────────────────────
function generateRemitoPDF(remito) {
  const items = remito.items.filter(i=>i.descripcion?.trim())
  const totalItems = 20
  const allItems = [...items, ...Array(Math.max(0,totalItems-items.length)).fill({descripcion:'',entrega:''})]

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; background: white; color: #000; font-size: 11px; }
  .page { width: 210mm; min-height: 297mm; padding: 12mm 14mm; position: relative; }

  /* HEADER */
  .header { display: flex; align-items: stretch; border: 2px solid #000; margin-bottom: 0; }
  .header-logo { padding: 12px 16px; border-right: 2px solid #000; display: flex; align-items: center; min-width: 160px; }
  .logo-text { font-size: 28px; font-weight: 900; letter-spacing: -1px; }
  .logo-sub { font-size: 8px; color: #666; text-transform: uppercase; letter-spacing: 2px; margin-top: 2px; }
  .header-badge { padding: 8px 14px; border-right: 2px solid #000; display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 70px; }
  .badge-letter { font-size: 36px; font-weight: 900; color: #ccc; line-height: 1; }
  .badge-sub { font-size: 7px; text-align: center; color: #666; margin-top: 2px; line-height: 1.3; }
  .header-title { flex: 1; padding: 12px 20px; display: flex; flex-direction: column; justify-content: center; }
  .doc-type { font-size: 28px; font-weight: 900; letter-spacing: 1px; }
  .doc-num { font-size: 36px; font-weight: 900; color: #888; letter-spacing: 2px; margin-top: 4px; }

  /* CLIENT INFO */
  .client-box { border: 2px solid #000; border-top: none; padding: 10px 14px; display: flex; gap: 40px; }
  .info-row { display: flex; gap: 6px; align-items: baseline; margin-bottom: 3px; }
  .info-label { font-size: 10px; color: #444; }
  .info-value { font-size: 12px; font-weight: 700; color: #C8941A; }
  .info-value.black { color: #000; font-weight: 700; }
  .info-value.big { font-size: 14px; }

  /* ENTREGA */
  .entrega-header { border: 2px solid #000; border-top: none; padding: 8px 14px; display: flex; align-items: center; gap: 12px; }
  .entrega-label { font-size: 13px; font-weight: 900; letter-spacing: 1px; background: #E8860A; color: white; padding: 3px 10px; }
  .entrega-date { font-size: 13px; font-weight: 700; }

  /* TABLE */
  .items-table { width: 100%; border-collapse: collapse; border: 2px solid #000; border-top: none; }
  .items-table th { background: #333; color: white; font-size: 10px; font-weight: 700; text-align: left; padding: 6px 10px; letter-spacing: 0.5px; text-transform: uppercase; }
  .items-table th.right { text-align: right; }
  .items-table td { padding: 5px 10px; font-size: 11px; border-bottom: 1px solid #ddd; }
  .items-table td.num { color: #888; font-weight: 600; }
  .items-table td.qty { text-align: right; font-weight: 700; font-size: 12px; }
  .items-table tr:nth-child(even) { background: #f9f9f9; }
  .items-table tr.empty td { color: #ccc; }

  /* RECIBE */
  .recibe-box { border: 2px solid #000; border-top: none; padding: 6px 14px; text-align: center; font-weight: 900; font-size: 13px; letter-spacing: 2px; background: #f5f5f5; }
  .firma-box { border: 2px solid #000; border-top: none; display: flex; }
  .firma-col { flex: 1; padding: 30px 20px 16px; }
  .firma-col.bordered { border-right: 2px solid #000; }
  .firma-line { border-top: 1px solid #000; margin-top: 30px; padding-top: 4px; font-size: 10px; font-weight: 700; color: #444; text-transform: uppercase; letter-spacing: 1px; }

  /* DOCS RELACIONADOS */
  .docs-box { border: 2px solid #000; border-top: none; padding: 8px 14px; display: flex; align-items: center; gap: 8px; }
  .docs-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #666; flex-shrink: 0; }
  .docs-items { display: flex; gap: 20px; }
  .doc-item { display: flex; gap: 6px; align-items: center; }
  .doc-item-label { font-size: 10px; color: #666; }
  .doc-item-value { font-size: 12px; font-weight: 900; color: #E8860A; }

  /* FOOTER */
  .footer { border: 2px solid #000; border-top: none; padding: 8px 14px; display: flex; align-items: center; justify-content: space-between; }
  .footer-contact { display: flex; gap: 16px; align-items: center; }
  .footer-item { display: flex; gap: 4px; align-items: center; font-size: 9px; }
  .footer-icon { width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid #000; display: flex; align-items: center; justify-content: center; font-size: 9px; flex-shrink: 0; }
  .walksafe { font-size: 11px; font-weight: 700; letter-spacing: -0.5px; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 8mm 10mm; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div class="header-logo">
      <div>
        <div class="logo-text">≡ STEPS</div>
        <div class="logo-sub">Catriel · Río Negro · Argentina</div>
      </div>
    </div>
    <div class="header-badge">
      <div class="badge-letter">R</div>
      <div class="badge-sub">Documento no válido<br>como factura</div>
    </div>
    <div class="header-title">
      <div class="doc-type">REMITO Nº</div>
      <div class="doc-num">${String(remito.numero).padStart(3,'0')}</div>
    </div>
  </div>

  <!-- CLIENTE -->
  <div class="client-box">
    <div>
      <div class="info-row">
        <span class="info-label">ID:</span>
        <span class="info-value">${remito.cliente_cuit||''}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Cliente:</span>
        <span class="info-value big">${remito.cliente_nombre||''}</span>
      </div>
    </div>
    <div>
      <div class="info-row">
        <span class="info-label">Categoría:</span>
        <span class="info-value black">${remito.cliente_categoria||'NUEVO'}</span>
      </div>
    </div>
  </div>

  <!-- ENTREGA -->
  <div class="entrega-header">
    <span class="entrega-label">ENTREGA</span>
    <span class="entrega-date">${fmtDate(remito.fecha_entrega)}</span>
  </div>

  <!-- TABLA ITEMS -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width:40px">N°</th>
        <th>DESCRIPCION</th>
        <th class="right" style="width:80px">ENTREGA</th>
      </tr>
    </thead>
    <tbody>
      ${allItems.map((item,i)=>`
        <tr class="${!item.descripcion?'empty':''}">
          <td class="num">${i+1}</td>
          <td>${item.descripcion||'-'}</td>
          <td class="qty">${item.entrega||'0'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <!-- RECIBE -->
  <div class="recibe-box">RECIBE</div>
  <div class="firma-box">
    <div class="firma-col bordered">
      <div class="firma-line">FIRMA</div>
    </div>
    <div class="firma-col">
      <div class="firma-line">ACLARACIÓN</div>
    </div>
  </div>

  <!-- DOCS RELACIONADOS -->
  <div class="docs-box">
    <span class="docs-label">DOCUMENTOS RELACIONADOS:</span>
    <div class="docs-items">
      <div class="doc-item">
        <span class="doc-item-label">Presupuesto:</span>
        <span class="doc-item-value">${remito.presupuesto_nro||'0'}</span>
      </div>
      <div class="doc-item">
        <span class="doc-item-label">Orden de entrega:</span>
        <span class="doc-item-value">${remito.orden_entrega||'0'}</span>
      </div>
      <div class="doc-item">
        <span class="doc-item-label">Factura Nº:</span>
        <span class="doc-item-value">${remito.factura_nro||'0'}</span>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-contact">
      <div class="footer-item">
        <div class="footer-icon">©</div>
        <span>2993295575</span>
      </div>
      <div class="footer-item">
        <div class="footer-icon">✉</div>
        <span>GESTIONSTEPS@GMAIL.COM</span>
      </div>
      <div class="footer-item">
        <div class="footer-icon">📸</div>
        <span>STEPS.INDUSTRIAL</span>
      </div>
      <div class="footer-item">
        <div class="footer-icon">🌐</div>
        <span>STEPSINDUSTRIAL.COM</span>
      </div>
    </div>
    <div class="walksafe">walk safe</div>
  </div>

</div>
</body>
</html>`

  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  setTimeout(()=>win.print(), 600)
}

// ── MODAL NUEVO REMITO ────────────────────────────────────────────────────────
function RemitoModal({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial || {
    numero: '',
    cliente_nombre: '', cliente_cuit: '', cliente_categoria: 'NUEVO',
    fecha_entrega: today(),
    presupuesto_nro: '', orden_entrega: '0', factura_nro: '',
    notes: '',
  })
  const [items, setItems] = useState(
    initial?.items || Array(10).fill(null).map(()=>({descripcion:'',entrega:''}))
  )
  const [saving, setSaving] = useState(false)
  const [clientQ, setClientQ] = useState(initial?.cliente_nombre||'')
  const [clientResults, setClientResults] = useState([])

  useEffect(()=>{
    const fn=e=>{if(e.key==='Escape')onClose()}
    window.addEventListener('keydown',fn); return()=>window.removeEventListener('keydown',fn)
  },[onClose])

  useEffect(()=>{
    const t=setTimeout(async()=>{
      if(!clientQ.trim()){setClientResults([]);return}
      const{data}=await supabase.from('clients').select('id,name,cuit,category').ilike('name',`%${clientQ}%`).limit(6)
      setClientResults(data||[])
    },200)
    return()=>clearTimeout(t)
  },[clientQ])

  const set=(k,v)=>setForm(f=>({...f,[k]:v}))
  const setItem=(i,k,v)=>setItems(prev=>prev.map((item,idx)=>idx===i?{...item,[k]:v}:item))
  const addRow=()=>setItems(prev=>[...prev,{descripcion:'',entrega:''}])

  // Autocompletar desde operación/presupuesto
  const fillFromOperation = async (opId) => {
    const {data:op} = await supabase.from('operations').select('*').eq('id',opId).single()
    if(!op) return
    if(op.quote_number) set('presupuesto_nro', String(op.quote_number))
    if(op.invoice_number) set('factura_nro', String(op.invoice_number))
    if(op.products_involved) {
      const lines = op.products_involved.split('\n').filter(Boolean)
      setItems(lines.map(l=>({descripcion:l,entrega:''})). concat(Array(Math.max(0,10-lines.length)).fill({descripcion:'',entrega:''})))
    }
  }

  const save = async () => {
    if(!form.cliente_nombre) return
    setSaving(true)
    try {
      const filteredItems = items.filter(i=>i.descripcion?.trim())
      const payload = {
        ...form,
        items: filteredItems,
        updated_at: new Date(),
      }
      if(initial?.id) {
        await supabase.from('remitos').update(payload).eq('id',initial.id)
      } else {
        await supabase.from('remitos').insert(payload)
      }
      await onSaved()
      onClose()
    } catch(e){console.error(e)}
    setSaving(false)
  }

  const lbl = t => <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:5,textTransform:'uppercase',letterSpacing:'0.08em'}}>{t}</div>
  const inp = (key,ph,type='text') => (
    <input value={form[key]||''} onChange={e=>set(key,e.target.value)} type={type} placeholder={ph}
      style={{width:'100%',padding:'9px 13px',borderRadius:10,border:'1px solid rgba(255,255,255,0.1)',
        background:'rgba(255,255,255,0.05)',color:T.text,fontSize:13,outline:'none',boxSizing:'border-box'}}/>
  )

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:1000,
      background:'rgba(0,0,0,0.75)',backdropFilter:'blur(16px)',
      display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:'100%',maxWidth:760,maxHeight:'92vh',
        display:'flex',flexDirection:'column',
        background:'rgba(8,8,24,0.97)',backdropFilter:'blur(40px)',
        border:'1px solid rgba(255,255,255,0.1)',
        borderTop:'1px solid rgba(255,255,255,0.2)',
        borderRadius:24,boxShadow:'0 40px 120px rgba(0,0,0,0.8)',
        overflow:'hidden',
      }}>

        {/* Header */}
        <div style={{padding:'20px 24px 16px',borderBottom:'1px solid rgba(255,255,255,0.07)',flexShrink:0,
          background:'linear-gradient(180deg,rgba(232,134,10,0.06),transparent)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <h3 style={{margin:0,fontSize:17,fontWeight:900,color:T.text,fontFamily:"'Syne',sans-serif"}}>
                {initial?.id?`Remito #${form.numero}`:'Nuevo Remito'}
              </h3>
              <div style={{fontSize:11,color:T.muted,marginTop:2}}>Documento de entrega de mercadería</div>
            </div>
            <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',fontSize:22,color:T.muted}}>×</button>
          </div>
        </div>

        {/* Body */}
        <div style={{flex:1,overflowY:'auto',padding:'20px 24px',display:'flex',flexDirection:'column',gap:14}}>

          {/* Número + fecha */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              {lbl('Número de remito')}
              {inp('numero','Ej: 118')}
            </div>
            <div>
              {lbl('Fecha de entrega')}
              {inp('fecha_entrega','','date')}
            </div>
          </div>

          {/* Cliente */}
          <div style={{position:'relative'}}>
            {lbl('Cliente *')}
            <input value={clientQ} onChange={e=>{setClientQ(e.target.value);set('cliente_nombre',e.target.value)}}
              placeholder="Buscar cliente..."
              style={{width:'100%',padding:'9px 13px',borderRadius:10,
                border:`1px solid ${form.cliente_cuit?T.orange+'55':'rgba(255,255,255,0.1)'}`,
                background:'rgba(255,255,255,0.05)',color:T.text,fontSize:13,outline:'none',boxSizing:'border-box'}}/>
            {clientResults.length>0&&(
              <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:10,marginTop:4,
                background:'rgba(8,8,24,0.98)',border:'1px solid rgba(255,255,255,0.1)',
                borderRadius:10,overflow:'hidden',boxShadow:'0 8px 32px rgba(0,0,0,0.6)'}}>
                {clientResults.map(cl=>(
                  <div key={cl.id} onMouseDown={()=>{
                    set('cliente_nombre',cl.name)
                    set('cliente_cuit',cl.cuit||'')
                    set('cliente_categoria',cl.category||'NUEVO')
                    setClientQ(cl.name)
                    setClientResults([])
                  }} style={{padding:'10px 14px',cursor:'pointer',
                    display:'flex',justifyContent:'space-between',
                    borderBottom:'1px solid rgba(255,255,255,0.05)'}}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.06)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <span style={{fontSize:13,color:T.text}}>{cl.name}</span>
                    <span style={{fontSize:11,color:T.muted}}>{cl.cuit}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>{lbl('CUIT')}{inp('cliente_cuit','30-XXXXXXXX-X')}</div>
            <div>
              {lbl('Categoría')}
              <select value={form.cliente_categoria} onChange={e=>set('cliente_categoria',e.target.value)}
                style={{width:'100%',padding:'9px 13px',borderRadius:10,border:'1px solid rgba(255,255,255,0.1)',
                  background:'rgba(8,8,24,0.9)',color:T.text,fontSize:13,outline:'none'}}>
                {['NUEVO','PREFERENCIAL','VIP','REGULAR'].map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Docs relacionados */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
            <div>{lbl('Presupuesto Nº')}{inp('presupuesto_nro','324')}</div>
            <div>{lbl('Orden de entrega')}{inp('orden_entrega','0')}</div>
            <div>{lbl('Factura Nº')}{inp('factura_nro','156')}</div>
          </div>

          {/* Items */}
          <div>
            {lbl('Productos a entregar')}
            <div style={{...glassCard({padding:0,overflow:'hidden'})}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 100px',
                padding:'8px 14px',borderBottom:'1px solid rgba(255,255,255,0.07)',
                background:'rgba(255,255,255,0.03)'}}>
                <span style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:'uppercase',letterSpacing:'0.06em'}}>Descripción</span>
                <span style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:'uppercase',letterSpacing:'0.06em',textAlign:'right'}}>Cantidad</span>
              </div>
              {items.map((item,i)=>(
                <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 100px',gap:8,
                  padding:'6px 14px',borderBottom:'1px solid rgba(255,255,255,0.04)',
                  alignItems:'center'}}>
                  <input value={item.descripcion} onChange={e=>setItem(i,'descripcion',e.target.value)}
                    placeholder={`Producto ${i+1}...`}
                    style={{padding:'7px 10px',borderRadius:8,border:'1px solid rgba(255,255,255,0.06)',
                      background:'rgba(255,255,255,0.04)',color:T.text,fontSize:12,outline:'none'}}/>
                  <input value={item.entrega} onChange={e=>setItem(i,'entrega',e.target.value)}
                    placeholder="0" type="number" min="0"
                    style={{padding:'7px 10px',borderRadius:8,border:'1px solid rgba(255,255,255,0.06)',
                      background:'rgba(255,255,255,0.04)',color:T.orangeL,fontSize:13,
                      fontWeight:900,outline:'none',textAlign:'right',
                      fontFamily:"'Space Mono',monospace"}}/>
                </div>
              ))}
              <div style={{padding:'8px 14px'}}>
                <button onClick={addRow}
                  style={{fontSize:11,color:T.muted,background:'none',border:'none',
                    cursor:'pointer',padding:'4px 0'}}>
                  + Agregar línea
                </button>
              </div>
            </div>
          </div>

          {/* Notas */}
          <div>
            {lbl('Notas internas')}
            <textarea value={form.notes||''} onChange={e=>set('notes',e.target.value)}
              placeholder="Observaciones de la entrega..." rows={2}
              style={{width:'100%',padding:'9px 13px',borderRadius:10,
                border:'1px solid rgba(255,255,255,0.1)',
                background:'rgba(255,255,255,0.05)',color:T.text,fontSize:13,
                outline:'none',resize:'none',boxSizing:'border-box'}}/>
          </div>
        </div>

        {/* Footer */}
        <div style={{padding:'14px 24px',borderTop:'1px solid rgba(255,255,255,0.07)',
          display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
          <button onClick={()=>generateRemitoPDF({...form,items})}
            style={{padding:'10px 20px',borderRadius:12,border:`1px solid ${T.violet}44`,
              background:`rgba(139,92,246,0.12)`,color:'#A78BFA',
              fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
            🖨️ Vista previa PDF
          </button>
          <div style={{display:'flex',gap:10}}>
            <button onClick={onClose}
              style={{padding:'10px 20px',borderRadius:12,border:'1px solid rgba(255,255,255,0.1)',
                background:'transparent',color:T.muted,fontSize:13,cursor:'pointer',fontWeight:600}}>
              Cancelar
            </button>
            <button onClick={save} disabled={saving||!form.cliente_nombre}
              style={{padding:'10px 26px',borderRadius:12,border:'none',
                background:`linear-gradient(135deg,${T.orangeL},${T.orange})`,
                color:'#000',fontSize:13,fontWeight:800,
                cursor:saving||!form.cliente_nombre?'not-allowed':'pointer',
                boxShadow:`0 4px 20px rgba(232,134,10,0.4)`,
                opacity:saving||!form.cliente_nombre?0.5:1}}>
              {saving?'Guardando...':initial?.id?'Guardar cambios':'Crear remito'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── REMITO CARD ───────────────────────────────────────────────────────────────
function RemitoCard({ remito, onClick }) {
  const [hov, setHov] = useState(false)
  const itemCount = remito.items?.filter(i=>i.descripcion?.trim()).length || 0

  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        ...glassCard({padding:'16px 18px'}),
        cursor:'pointer',
        border:`1px solid ${hov?T.orange+'44':'rgba(255,255,255,0.07)'}`,
        borderLeft:`3px solid ${hov?T.orange:'rgba(232,134,10,0.3)'}`,
        transform:hov?'translateX(4px)':'none',
        boxShadow:hov?`0 8px 32px rgba(232,134,10,0.12)`:'0 4px 20px rgba(0,0,0,0.4)',
        transition:'all 0.2s cubic-bezier(0.34,1.2,0.64,1)',
      }}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
            <span style={{fontSize:10,fontWeight:700,color:T.sub,fontFamily:"'Space Mono',monospace"}}>
              REMITO #{String(remito.numero).padStart(3,'0')}
            </span>
            <span style={{fontSize:9,padding:'2px 7px',borderRadius:8,
              background:'rgba(232,134,10,0.12)',color:T.orange,fontWeight:700}}>
              {itemCount} producto{itemCount!==1?'s':''}
            </span>
          </div>
          <div style={{fontSize:14,fontWeight:800,color:T.text}}>{remito.cliente_nombre}</div>
          <div style={{fontSize:11,color:T.muted,marginTop:2}}>
            CUIT: {remito.cliente_cuit||'—'}
          </div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:12,fontWeight:700,color:T.orange}}>
            Entrega: {fmtDate(remito.fecha_entrega)}
          </div>
          <div style={{fontSize:10,color:T.sub,marginTop:4}}>
            {remito.factura_nro&&`F-${remito.factura_nro}`}
            {remito.presupuesto_nro&&` · P-${remito.presupuesto_nro}`}
          </div>
        </div>
      </div>
      {remito.items?.filter(i=>i.descripcion?.trim()).slice(0,2).map((item,i)=>(
        <div key={i} style={{fontSize:11,color:T.muted,
          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
          marginTop:i===0?8:2}}>
          · {item.descripcion} <span style={{color:T.orangeL,fontWeight:700}}>×{item.entrega}</span>
        </div>
      ))}
      {itemCount>2&&<div style={{fontSize:10,color:T.sub,marginTop:2}}>+{itemCount-2} más...</div>}
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function Remitos() {
  const [remitos, setRemitos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    const {data} = await supabase.from('remitos').select('*').order('created_at',{ascending:false})
    setRemitos(data||[])
    setLoading(false)
  }

  useEffect(()=>{ load() },[])

  const filtered = remitos.filter(r=>{
    if(!search.trim()) return true
    const q = search.toLowerCase()
    return r.cliente_nombre?.toLowerCase().includes(q) ||
      String(r.numero).includes(q) ||
      r.factura_nro?.includes(q)
  })

  // Próximo número
  const nextNumero = remitos.length>0
    ? Math.max(...remitos.map(r=>parseInt(r.numero)||0))+1
    : 1

  return (
    <div style={{minHeight:'100vh',background:T.bg,padding:'24px 28px',
      fontFamily:"'Nunito Sans',system-ui,sans-serif",color:T.text}}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24}}>
        <div>
          <h1 style={{margin:0,fontSize:26,fontWeight:900,fontFamily:"'Syne',sans-serif",
            background:`linear-gradient(135deg,${T.orange},${T.orangeL})`,
            WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
            Remitos
          </h1>
          <p style={{margin:'4px 0 0',fontSize:12,color:T.muted,fontStyle:'italic'}}>
            documentos de entrega de mercadería
          </p>
        </div>
        <button onClick={()=>{setSelected({numero:nextNumero});setShowModal(true)}}
          style={{padding:'11px 22px',borderRadius:14,border:'none',
            background:`linear-gradient(135deg,${T.orangeL},${T.orange})`,
            color:'#000',fontSize:13,fontWeight:700,cursor:'pointer',
            boxShadow:`0 4px 20px rgba(232,134,10,0.4)`}}
          onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px) scale(1.03)'}
          onMouseLeave={e=>e.currentTarget.style.transform='none'}>
          + Nuevo remito
        </button>
      </div>

      {/* Search */}
      <div style={{marginBottom:16}}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Buscar por cliente, número o factura..."
          style={{width:'100%',padding:'11px 16px',borderRadius:12,
            border:'1px solid rgba(255,255,255,0.1)',
            background:'rgba(255,255,255,0.04)',color:T.text,fontSize:13,outline:'none'}}/>
      </div>

      {/* Lista */}
      {loading?(
        <div style={{textAlign:'center',padding:60,color:T.muted}}>
          <div style={{fontSize:32,marginBottom:8,opacity:0.4}}>📋</div>
          Cargando...
        </div>
      ):filtered.length===0?(
        <div style={{textAlign:'center',padding:60,color:T.muted}}>
          <div style={{fontSize:48,marginBottom:12,opacity:0.3}}>📋</div>
          <div style={{fontSize:15}}>No hay remitos todavía</div>
          <div style={{fontSize:12,marginTop:4,color:T.sub}}>
            Creá el primero con el botón + Nuevo remito
          </div>
        </div>
      ):(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(380px,1fr))',gap:12}}>
          {filtered.map(r=>(
            <div key={r.id} style={{animation:'fadeUp 0.3s ease both'}}>
              <RemitoCard remito={r} onClick={()=>{setSelected(r);setShowModal(true)}}/>
            </div>
          ))}
        </div>
      )}

      {showModal&&(
        <RemitoModal
          initial={selected}
          onClose={()=>{setShowModal(false);setSelected(null)}}
          onSaved={load}
        />
      )}
    </div>
  )
}
