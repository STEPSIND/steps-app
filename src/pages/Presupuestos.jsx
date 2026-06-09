import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { supabase } from '../supabase'

// ── COLORES ──
const c = {
  bg: '#07070f', panel: 'rgba(255,255,255,0.035)', border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.12)', text: '#f1f5f9', sub: '#94a3b8', muted: '#475569',
  orange: '#E8860A', orangeLight: '#F5A623', orangeDim: 'rgba(232,134,10,0.12)',
  cyan: '#06b6d4', violet: '#7c3aed', lime: '#84cc16', rose: '#f43f5e', amber: '#f59e0b',
}

const inputStyle = {
  background: 'rgba(255,255,255,0.05)', border: `1px solid ${c.border}`,
  borderRadius: 8, padding: '7px 10px', color: c.text, fontSize: 12,
  outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-body)',
}

const fmtARS = (n) => {
  if (!n && n !== 0) return '—'
  return `$${(+n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const fmtK = (n) => {
  if (!n) return '—'
  if (+n >= 1000000) return `$${(+n / 1000000).toFixed(2)}M`
  if (+n >= 1000) return `$${(+n / 1000).toFixed(0)}K`
  return fmtARS(n)
}

const today = () => new Date().toISOString().split('T')[0]
const addDays = (d, n) => {
  const dt = new Date(d)
  dt.setDate(dt.getDate() + n)
  return dt.toISOString().split('T')[0]
}

const STATUS_CONFIG = {
  BORRADOR:  { label: 'Borrador',  color: c.muted },
  ENVIADO:   { label: 'Enviado',   color: c.cyan },
  APROBADO:  { label: 'Aprobado',  color: c.lime },
  RECHAZADO: { label: 'Rechazado', color: c.rose },
  VENCIDO:   { label: 'Vencido',   color: c.amber },
}

const EMPTY_ITEM = () => ({
  _id: Math.random().toString(36).slice(2),
  product_id: null, description: '', size: '', quantity: 1,
  unit_price_usd: 0, cost_price_ars: 0, margin_pct: 18,
  unit_sale_price: 0, subtotal: 0, iva_pct: 21,
  discount_pct: 0, supplier_name: '',
})

const calcItem = (item, cotizacion) => {
  const cost = item.unit_price_usd > 0 ? +(item.unit_price_usd) * +cotizacion : +(item.cost_price_ars)
  const sale = Math.round(cost * (1 + (+item.margin_pct) / 100))
  const sub = Math.round(+(item.quantity) * sale * (1 - (+item.discount_pct) / 100))
  return { ...item, cost_price_ars: Math.round(cost), unit_sale_price: sale, subtotal: sub }
}

// ── BÚSQUEDA DE PRODUCTOS ──
function ProductSearch({ onAdd, cotizacion, globalMargin }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const search = useCallback(async (query) => {
    if (!query.trim()) { setResults([]); return }
    const { data } = await supabase.from('products')
      .select('id, name, brand, price_usd, cost_price, product_type, size_range, supplier_name')
      .or(`name.ilike.%${query}%,brand.ilike.%${query}%,product_type.ilike.%${query}%`)
      .eq('available', true).limit(7)
    setResults(data || [])
  }, [])

  useEffect(() => {
    const t = setTimeout(() => search(q), 220)
    return () => clearTimeout(t)
  }, [q, search])

  const select = (p) => {
    const cost = p.price_usd > 0 ? +p.price_usd * +cotizacion : (+p.cost_price || 0)
    const sale = Math.round(cost * (1 + globalMargin / 100))
    onAdd({
      ...EMPTY_ITEM(),
      product_id: p.id, description: p.name,
      unit_price_usd: p.price_usd || 0, cost_price_ars: Math.round(cost),
      margin_pct: globalMargin, unit_sale_price: sale,
      subtotal: sale, supplier_name: p.supplier_name || '',
      size: p.size_range || '',
    })
    setQ(''); setResults([]); setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1 }}>
      <input value={q} onChange={e => { setQ(e.target.value); setOpen(true) }}
        onFocus={() => q && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        placeholder="🔍  Buscar en catálogo... (nombre, marca, tipo)"
        style={{ ...inputStyle, fontSize: 13, padding: '9px 12px' }} />
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '105%', left: 0, right: 0, zIndex: 300,
          background: '#0d0d1e', border: `1px solid ${c.border2}`,
          borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
        }}>
          {results.map(p => {
            const cost = p.price_usd > 0 ? Math.round(+p.price_usd * +cotizacion) : (+p.cost_price || 0)
            const sale = Math.round(cost * (1 + globalMargin / 100))
            return (
              <div key={p.id} onMouseDown={() => select(p)} style={{
                padding: '10px 14px', cursor: 'pointer', borderBottom: `1px solid ${c.border}`,
                transition: 'background .12s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{p.name}</div>
                <div style={{ display: 'flex', gap: 12, fontSize: 10, color: c.sub }}>
                  {p.brand && <span style={{ color: c.orangeLight }}>{p.brand}</span>}
                  {p.price_usd > 0 && <span>U$S {p.price_usd}</span>}
                  {cost > 0 && <span style={{ color: c.muted }}>Costo {fmtARS(cost)}</span>}
                  {sale > 0 && <span style={{ color: c.lime, fontWeight: 700 }}>Venta {fmtARS(sale)}</span>}
                  {p.supplier_name && <span style={{ color: c.muted }}>{p.supplier_name}</span>}
                </div>
              </div>
            )
          })}
          <div style={{ padding: '8px 14px', fontSize: 10, color: c.muted, textAlign: 'center' }}>
            {results.length === 7 ? 'Mostrando 7 resultados — escribí más para afinar' : `${results.length} resultado${results.length !== 1 ? 's' : ''}`}
          </div>
        </div>
      )}
    </div>
  )
}

// ── FILA DE ITEM ──
function ItemRow({ item, idx, cotizacion, onChange, onDelete }) {
  const upd = (field, val) => {
    const updated = { ...item, [field]: val }
    if (['unit_price_usd', 'cost_price_ars', 'margin_pct', 'quantity', 'discount_pct'].includes(field)) {
      const recalc = calcItem(updated, cotizacion)
      onChange(recalc)
    } else {
      onChange(updated)
    }
  }

  const iStyle = {
    ...inputStyle, padding: '5px 7px', fontSize: 11, textAlign: 'right',
    background: 'rgba(255,255,255,0.04)',
  }

  return (
    <tr style={{ borderBottom: `1px solid ${c.border}` }}>
      <td style={{ padding: '8px 6px', fontSize: 11, color: c.muted, width: 28, textAlign: 'center' }}>
        {String(idx + 1).padStart(3, '0')}
      </td>
      <td style={{ padding: '8px 6px', minWidth: 200 }}>
        <input value={item.description} onChange={e => upd('description', e.target.value)}
          style={{ ...inputStyle, padding: '5px 7px', fontSize: 11 }} placeholder="Descripción..." />
      </td>
      <td style={{ padding: '8px 6px', width: 70 }}>
        <input value={item.size} onChange={e => upd('size', e.target.value)}
          style={{ ...iStyle, textAlign: 'left' }} placeholder="T: L" />
      </td>
      <td style={{ padding: '8px 6px', width: 55 }}>
        <input type="number" value={item.quantity} min={1}
          onChange={e => upd('quantity', e.target.value)}
          style={iStyle} />
      </td>
      <td style={{ padding: '8px 6px', width: 80 }}>
        <input type="number" value={item.unit_price_usd}
          onChange={e => upd('unit_price_usd', e.target.value)}
          style={{ ...iStyle, color: c.amber }} placeholder="0" />
      </td>
      <td style={{ padding: '8px 6px', width: 100, textAlign: 'right', fontSize: 11, color: c.sub }}>
        {fmtARS(item.cost_price_ars)}
      </td>
      <td style={{ padding: '8px 6px', width: 65 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <input type="number" value={item.margin_pct}
            onChange={e => upd('margin_pct', e.target.value)}
            style={{ ...iStyle, width: '100%' }} />
          <span style={{ fontSize: 10, color: c.muted }}>%</span>
        </div>
      </td>
      <td style={{ padding: '8px 6px', width: 110, textAlign: 'right', fontSize: 12, fontWeight: 700, color: c.orangeLight }}>
        {fmtARS(item.unit_sale_price)}
      </td>
      <td style={{ padding: '8px 6px', width: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <input type="number" value={item.discount_pct}
            onChange={e => upd('discount_pct', e.target.value)}
            style={{ ...iStyle, width: '100%' }} />
          <span style={{ fontSize: 10, color: c.muted }}>%</span>
        </div>
      </td>
      <td style={{ padding: '8px 6px', width: 115, textAlign: 'right', fontSize: 13, fontWeight: 800, color: c.lime }}>
        {fmtARS(item.subtotal)}
      </td>
      <td style={{ padding: '8px 6px', width: 30 }}>
        <button onClick={onDelete} style={{
          background: 'none', border: 'none', color: c.muted, cursor: 'pointer',
          fontSize: 14, padding: 2, transition: 'color .15s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = c.rose}
          onMouseLeave={e => e.currentTarget.style.color = c.muted}>×</button>
      </td>
    </tr>
  )
}

// ── VISTA IMPRIMIBLE ──
function PrintView({ quote, items, onClose }) {
  const neto = items.reduce((s, i) => s + (+i.subtotal || 0), 0)
  const ivaAmt = Math.round(neto * 0.21)
  const total = neto + ivaAmt
  const fmt2 = (n) => `$${(+n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 500,
      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 24,
      overflowY: 'auto',
    }}>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #steps-printable, #steps-printable * { visibility: visible !important; }
          #steps-printable { position: fixed !important; top: 0; left: 0; width: 100%; z-index: 9999; }
        }
      `}</style>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <button onClick={() => window.print()} style={{
          padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer',
          background: `linear-gradient(135deg,${c.orangeLight},${c.orange})`,
          color: '#000', fontWeight: 700, fontSize: 13,
        }}>🖨️ Imprimir / Guardar PDF</button>

        <a href={`https://wa.me/?text=${encodeURIComponent(
          `*STEPS — Presupuesto N° ${quote.number}*\n` +
          `Cliente: ${quote.client_name}\n` +
          `Total: ${fmt2(total)}\n` +
          `Válido hasta: ${quote.expires_at}\n\n` +
          items.filter(i => i.description).map(i =>
            `• ${i.description}${i.size ? ` T:${i.size}` : ''} x${i.quantity} — ${fmt2(i.subtotal)}`
          ).join('\n')
        )}`} target="_blank" rel="noreferrer" style={{
          padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer',
          background: '#25D366', color: '#fff', fontWeight: 700, fontSize: 13,
          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
        }}>📲 Compartir WhatsApp</a>

        <button onClick={onClose} style={{
          padding: '10px 20px', borderRadius: 8, border: `1px solid ${c.border}`,
          background: 'transparent', color: c.sub, cursor: 'pointer', fontSize: 13,
        }}>Cerrar</button>
      </div>

      {/* Hoja imprimible */}
      <div id="steps-printable" style={{
        width: 794, minHeight: 1123, background: '#fff', color: '#222',
        fontFamily: 'Arial, sans-serif', fontSize: 11, padding: '28px 32px',
        boxShadow: '0 0 40px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, borderBottom: '2px solid #e8860a', paddingBottom: 16 }}>
          <div>
            <img src="/logo.png" alt="STEPS" style={{ height: 40 }} onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block' }} />
            <div style={{ display: 'none', fontSize: 24, fontWeight: 900, color: '#e8860a' }}>STEPS</div>
            <div style={{ fontSize: 9, color: '#888', marginTop: 4, letterSpacing: 1 }}>CATRIEL - RIO NEGRO - ARGENTINA</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: '#888', border: '1px solid #ccc', display: 'inline-block', padding: '2px 6px', marginBottom: 4 }}>
              Documento no válido como factura
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#222', letterSpacing: -1 }}>PRESUPUESTO N°</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#e8860a', fontStyle: 'italic' }}>{quote.number}</div>
          </div>
        </div>

        {/* Client info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16, padding: 12, background: '#f8f9fa', borderRadius: 6 }}>
          <div>
            <span style={{ fontSize: 9, color: '#888', textTransform: 'uppercase' }}>Cliente</span>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#e8860a' }}>{quote.client_name}</div>
            <div style={{ fontSize: 10, color: '#555' }}>ID: {quote.client_cuit}</div>
            <div style={{ fontSize: 10, color: '#555' }}>Categoría: <strong>{quote.client_category}</strong></div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, marginBottom: 2 }}><span style={{ color: '#888' }}>Fecha: </span><strong>{quote.date}</strong></div>
            <div style={{ fontSize: 10, marginBottom: 2 }}><span style={{ color: '#888' }}>Solicita: </span><strong>{quote.solicita}</strong></div>
            <div style={{ fontSize: 10 }}><span style={{ color: '#888' }}>IVA: </span>{quote.client_iva}</div>
          </div>
        </div>

        {/* Items table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
          <thead>
            <tr style={{ background: '#222', color: '#fff' }}>
              {['N°', 'DESCRIPCIÓN', 'T', 'Q', 'UNITARIO', '%%%', 'SUBTOTAL'].map(h => (
                <th key={h} style={{ padding: '7px 8px', textAlign: h === 'DESCRIPCIÓN' ? 'left' : 'right', fontSize: 10, fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.filter(i => i.description).map((item, idx) => (
              <tr key={item._id || idx} style={{ borderBottom: '1px solid #eee', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 600 }}>{String(idx + 1).padStart(3, '0')}</td>
                <td style={{ padding: '7px 8px', textAlign: 'left' }}>
                  {item.description}
                  {item.size && ` - T: ${item.size}`}
                </td>
                <td style={{ padding: '7px 8px', textAlign: 'right' }}>{item.quantity}</td>
                <td style={{ padding: '7px 8px', textAlign: 'right' }}>{item.quantity}</td>
                <td style={{ padding: '7px 8px', textAlign: 'right' }}>{fmt2(item.unit_sale_price)}</td>
                <td style={{ padding: '7px 8px', textAlign: 'right' }}>{item.discount_pct > 0 ? `${item.discount_pct}%` : '0%'}</td>
                <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700 }}>{fmt2(item.subtotal)}</td>
              </tr>
            ))}
            {/* Empty rows to fill the table */}
            {Array.from({ length: Math.max(0, 16 - items.filter(i => i.description).length) }).map((_, i) => (
              <tr key={`empty-${i}`} style={{ borderBottom: '1px solid #eee' }}>
                {Array(7).fill(0).map((__, j) => (
                  <td key={j} style={{ padding: '7px 8px', fontSize: 10, color: '#ddd' }}>{j === 0 ? String(items.filter(x => x.description).length + i + 1).padStart(3, '0') : j === 1 ? '-' : '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Vencimiento + Totales */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div style={{ fontSize: 10 }}>
            <span style={{ color: '#888' }}>Vencimiento del presupuesto: </span>
            <strong>{quote.expires_at}</strong>
          </div>
          <div style={{
            background: '#222', color: '#fff', padding: '10px 20px', borderRadius: 6,
            display: 'flex', gap: 24, alignItems: 'center',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: '#aaa', fontStyle: 'italic', fontWeight: 700 }}>NETO GRAVADO</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#f5a623' }}>{fmt2(neto)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: '#aaa', fontStyle: 'italic', fontWeight: 700 }}>IVA</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#f5a623' }}>{fmt2(ivaAmt)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: '#aaa', fontStyle: 'italic', fontWeight: 700 }}>TOTAL</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#f5a623' }}>{fmt2(total)}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #eee', paddingTop: 12, display: 'flex', justifyContent: 'space-around', color: '#888', fontSize: 10 }}>
          {['📸 stepsindustrial', '✉️ gestionsteps@gmail.com', '🌐 walk safe', '📘 STEPS.INDUSTRIAL', '💻 stepsindustrial.com'].map(s => (
            <span key={s}>{s}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── MÓDULO PRINCIPAL ──
export default function Presupuestos() {
  const [view, setView] = useState('list') // 'list' | 'form'
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPrint, setShowPrint] = useState(false)
  const [editId, setEditId] = useState(null)

  // Quote form state
  const [number, setNumber] = useState('')
  const [date, setDate] = useState(today())
  const [expiresAt, setExpiresAt] = useState(addDays(today(), 5))
  const [status, setStatus] = useState('BORRADOR')
  const [clientName, setClientName] = useState('')
  const [clientCuit, setClientCuit] = useState('')
  const [clientCategory, setClientCategory] = useState('NUEVO')
  const [clientIva, setClientIva] = useState('Responsable Inscripto')
  const [solicita, setSolicita] = useState('')
  const [cotizacion, setCotizacion] = useState(() => +localStorage.getItem('steps_lp_usd') || 1458)
  const [globalMargin, setGlobalMargin] = useState(18)
  const [paymentConditions, setPaymentConditions] = useState('ANTICIPADO')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([EMPTY_ITEM()])

  // Totales calculados
  const neto = useMemo(() => items.reduce((s, i) => s + (+i.subtotal || 0), 0), [items])
  const ivaAmount = useMemo(() => Math.round(neto * 0.21), [neto])
  const total = useMemo(() => neto + ivaAmount, [neto, ivaAmount])

  useEffect(() => { loadQuotes() }, [])

  const loadQuotes = async () => {
    setLoading(true)
    const { data } = await supabase.from('quotes').select('*').order('number', { ascending: false })
    setQuotes(data || [])
    setLoading(false)
  }

  const newQuote = async () => {
    // Obtener número siguiente
    const { data } = await supabase.from('quotes').select('number').order('number', { ascending: false }).limit(1)
    const nextNum = data?.[0]?.number ? data[0].number + 1 : 325
    resetForm()
    setNumber(nextNum)
    setEditId(null)
    setView('form')
  }

  const openQuote = (q) => {
    setEditId(q.id)
    setNumber(q.number)
    setDate(q.date || today())
    setExpiresAt(q.expires_at || addDays(today(), 5))
    setStatus(q.status || 'BORRADOR')
    setClientName(q.client_name || '')
    setClientCuit(q.client_cuit || '')
    setClientCategory(q.client_category || 'NUEVO')
    setClientIva(q.client_iva || 'Responsable Inscripto')
    setSolicita(q.solicita || '')
    setCotizacion(q.cotizacion || +localStorage.getItem('steps_lp_usd') || 1458)
    setGlobalMargin(q.global_margin || 18)
    setPaymentConditions(q.payment_conditions || 'ANTICIPADO')
    setNotes(q.notes || '')
    loadItems(q.id)
    setView('form')
  }

  const loadItems = async (quoteId) => {
    const { data } = await supabase.from('quote_items').select('*').eq('quote_id', quoteId).order('position')
    if (data && data.length > 0) {
      setItems(data.map(i => ({ ...i, _id: i.id || Math.random().toString(36).slice(2) })))
    }
  }

  const resetForm = () => {
    setDate(today()); setExpiresAt(addDays(today(), 5)); setStatus('BORRADOR')
    setClientName(''); setClientCuit(''); setClientCategory('NUEVO')
    setClientIva('Responsable Inscripto'); setSolicita('')
    setCotizacion(+localStorage.getItem('steps_lp_usd') || 1458)
    setGlobalMargin(18); setPaymentConditions('ANTICIPADO'); setNotes('')
    setItems([EMPTY_ITEM()])
  }

  const addItem = (item) => setItems(prev => [...prev, { ...item, _id: Math.random().toString(36).slice(2) }])
  const updateItem = (idx, item) => setItems(prev => prev.map((i, j) => j === idx ? item : i))
  const deleteItem = (idx) => setItems(prev => prev.filter((_, j) => j !== idx))
  const addEmptyItem = () => setItems(prev => [...prev, EMPTY_ITEM()])

  const applyGlobalMargin = () => {
    setItems(prev => prev.map(i => {
      const updated = { ...i, margin_pct: globalMargin }
      return calcItem(updated, cotizacion)
    }))
  }

  const save = async () => {
    if (!clientName.trim()) return
    setSaving(true)
    const payload = {
      number: +number, date, expires_at: expiresAt, status, client_name: clientName,
      client_cuit: clientCuit, client_category: clientCategory, client_iva: clientIva,
      solicita, cotizacion: +cotizacion, global_margin: +globalMargin,
      payment_conditions: paymentConditions, notes,
      neto, iva_amount: ivaAmount, total, updated_at: new Date(),
    }

    let quoteId = editId
    if (editId) {
      await supabase.from('quotes').update(payload).eq('id', editId)
    } else {
      const { data } = await supabase.from('quotes').insert(payload).select()
      quoteId = data?.[0]?.id
    }

    if (quoteId) {
      // Borrar items anteriores y reinsertar
      await supabase.from('quote_items').delete().eq('quote_id', quoteId)
      const itemsToInsert = items
        .filter(i => i.description.trim())
        .map((i, idx) => ({
          quote_id: quoteId, position: idx + 1,
          product_id: i.product_id || null,
          description: i.description, size: i.size || null,
          quantity: +i.quantity, unit_price_usd: +i.unit_price_usd,
          cost_price_ars: +i.cost_price_ars, margin_pct: +i.margin_pct,
          unit_sale_price: +i.unit_sale_price, subtotal: +i.subtotal,
          iva_pct: +i.iva_pct, discount_pct: +i.discount_pct,
          supplier_name: i.supplier_name || null,
        }))
      if (itemsToInsert.length > 0) {
        await supabase.from('quote_items').insert(itemsToInsert)
      }
      if (!editId) setEditId(quoteId)
    }

    await loadQuotes()
    setSaving(false)
  }

  const quoteData = {
    number, date, expires_at: expiresAt, client_name: clientName,
    client_cuit: clientCuit, client_category: clientCategory,
    client_iva: clientIva, solicita,
  }

  // ── VISTA LISTA ──
  if (view === 'list') return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-display)' }}>Presupuestos</h2>
          <p style={{ margin: '4px 0 0', color: c.sub, fontSize: 12 }}>
            {quotes.length} total · {quotes.filter(q => q.status === 'APROBADO').length} aprobados · {quotes.filter(q => q.status === 'ENVIADO').length} enviados
          </p>
        </div>
        <button onClick={newQuote} style={{
          padding: '10px 22px', borderRadius: 9, border: 'none', cursor: 'pointer',
          background: `linear-gradient(135deg,${c.orangeLight},${c.orange})`,
          color: '#000', fontWeight: 800, fontSize: 13,
          boxShadow: `0 0 24px rgba(232,134,10,0.3)`,
        }}>+ Nuevo presupuesto</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: c.orange, fontSize: 32 }}>⚡</div>
      ) : quotes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.2 }}>📋</div>
          <div style={{ fontSize: 16, color: c.sub, marginBottom: 24 }}>Sin presupuestos todavía</div>
          <button onClick={newQuote} style={{
            padding: '12px 28px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: `linear-gradient(135deg,${c.orangeLight},${c.orange})`,
            color: '#000', fontWeight: 800, fontSize: 14,
          }}>Crear el primero</button>
        </div>
      ) : (
        <div style={{ borderRadius: 14, border: `1px solid ${c.border}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${c.border}` }}>
                {['N°', 'Cliente', 'Fecha', 'Vence', 'Total', 'Estado', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, color: c.sub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quotes.map(q => {
                const sc = STATUS_CONFIG[q.status] || STATUS_CONFIG.BORRADOR
                const isVencido = q.expires_at && new Date(q.expires_at) < new Date() && q.status !== 'APROBADO'
                return (
                  <tr key={q.id} style={{ borderBottom: `1px solid ${c.border}`, cursor: 'pointer', transition: 'background .1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onClick={() => openQuote(q)}>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: c.orange, fontFamily: 'var(--font-mono)' }}>#{q.number}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{q.client_name}</td>
                    <td style={{ padding: '12px 14px', color: c.sub }}>{q.date}</td>
                    <td style={{ padding: '12px 14px', color: isVencido ? c.rose : c.sub }}>{q.expires_at}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: c.lime, fontFamily: 'var(--font-mono)' }}>{fmtK(q.total)}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        fontSize: 10, padding: '3px 9px', borderRadius: 20, fontWeight: 700,
                        background: `${sc.color}18`, color: sc.color, border: `1px solid ${sc.color}30`,
                      }}>{isVencido && q.status !== 'APROBADO' ? 'Vencido' : sc.label}</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <button onClick={e => { e.stopPropagation(); openQuote(q) }}
                        style={{ background: 'none', border: `1px solid ${c.border}`, borderRadius: 6, color: c.muted, cursor: 'pointer', fontSize: 11, padding: '3px 8px' }}>
                        ✏️
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showPrint && <PrintView quote={quoteData} items={items} onClose={() => setShowPrint(false)} />}
    </div>
  )

  // ── VISTA FORMULARIO ──
  return (
    <div>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
        padding: '10px 16px', borderRadius: 12, background: c.panel, border: `1px solid ${c.border}`,
      }}>
        <button onClick={() => { loadQuotes(); setView('list') }} style={{
          background: 'none', border: `1px solid ${c.border}`, borderRadius: 7,
          color: c.sub, cursor: 'pointer', padding: '6px 12px', fontSize: 12,
        }}>← Volver</button>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: c.orange }}>
          PRESUPUESTO #{number}
        </div>

        <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...inputStyle, width: 'auto', fontSize: 11 }}>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k} style={{ background: '#0d0d1e' }}>{v.label}</option>
          ))}
        </select>

        <div style={{ flex: 1 }} />

        <button onClick={() => setShowPrint(true)} style={{
          padding: '8px 16px', borderRadius: 8, border: `1px solid ${c.border}`,
          background: 'transparent', color: c.sub, cursor: 'pointer', fontSize: 12,
        }}>👁️ Vista previa</button>

        <button onClick={save} disabled={saving || !clientName.trim()} style={{
          padding: '8px 22px', borderRadius: 8, border: 'none', cursor: 'pointer',
          background: `linear-gradient(135deg,${c.orangeLight},${c.orange})`,
          color: '#000', fontWeight: 800, fontSize: 13,
          opacity: (!clientName.trim() || saving) ? 0.5 : 1,
          boxShadow: clientName ? `0 0 20px rgba(232,134,10,0.25)` : 'none',
        }}>{saving ? 'Guardando...' : '💾 Guardar'}</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>

        {/* ── COLUMNA PRINCIPAL ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Cliente */}
          <div style={{ padding: 18, borderRadius: 14, background: c.panel, border: `1px solid ${c.border}` }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: 9, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Cliente *</label>
                <input value={clientName} onChange={e => setClientName(e.target.value)}
                  placeholder="Nombre o razón social" style={{ ...inputStyle, fontSize: 14, fontWeight: 700 }} />
              </div>
              <div>
                <label style={{ fontSize: 9, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>CUIT</label>
                <input value={clientCuit} onChange={e => setClientCuit(e.target.value)}
                  placeholder="30-12345678-9" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 9, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Solicita</label>
                <input value={solicita} onChange={e => setSolicita(e.target.value)}
                  placeholder="Nombre del contacto" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 9, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>IVA</label>
                <select value={clientIva} onChange={e => setClientIva(e.target.value)} style={inputStyle}>
                  {['Responsable Inscripto', 'Monotributista', 'Exento', 'Consumidor Final'].map(o => (
                    <option key={o} value={o} style={{ background: '#0d0d1e' }}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 9, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Categoría</label>
                <select value={clientCategory} onChange={e => setClientCategory(e.target.value)} style={inputStyle}>
                  {['NUEVO', 'BRONCE', 'PLATA', 'ORO'].map(o => (
                    <option key={o} value={o} style={{ background: '#0d0d1e' }}>{o}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Buscador + tabla de ítems */}
          <div style={{ padding: 18, borderRadius: 14, background: c.panel, border: `1px solid ${c.border}` }}>
            {/* Buscador */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <ProductSearch onAdd={addItem} cotizacion={cotizacion} globalMargin={globalMargin} />
              <button onClick={addEmptyItem} style={{
                padding: '8px 14px', borderRadius: 8, border: `1px solid ${c.border}`,
                background: 'transparent', color: c.sub, cursor: 'pointer', fontSize: 12, flexShrink: 0,
              }}>+ Fila manual</button>
            </div>

            {/* Tabla */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${c.border2}` }}>
                    {['#', 'Descripción', 'Talle', 'Cant.', 'U$S', '$ Costo', 'Margen', '$ Venta', 'Desc.', 'Subtotal', ''].map(h => (
                      <th key={h} style={{ padding: '7px 6px', textAlign: 'right', fontSize: 9, color: c.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', ':first-child': { textAlign: 'left' } }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <ItemRow key={item._id} item={item} idx={idx} cotizacion={cotizacion}
                      onChange={(updated) => updateItem(idx, updated)}
                      onDelete={() => deleteItem(idx)} />
                  ))}
                </tbody>
              </table>
            </div>

            {items.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px 0', color: c.muted, fontSize: 12 }}>
                Buscá un producto o agregá una fila manual
              </div>
            )}
          </div>

          {/* Notas */}
          <div style={{ padding: 14, borderRadius: 12, background: c.panel, border: `1px solid ${c.border}` }}>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Notas internas (no aparecen en el PDF)..."
              style={{ ...inputStyle, resize: 'vertical', fontSize: 12 }} />
          </div>
        </div>

        {/* ── COLUMNA LATERAL ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Fechas */}
          <div style={{ padding: 16, borderRadius: 12, background: c.panel, border: `1px solid ${c.border}` }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 9, color: c.muted, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Fecha</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 9, color: c.muted, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Vencimiento</label>
                <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[3, 5, 7, 10].map(d => (
                  <button key={d} onClick={() => setExpiresAt(addDays(date, d))} style={{
                    flex: 1, padding: '5px', borderRadius: 6, border: `1px solid ${c.border}`,
                    background: 'transparent', color: c.sub, cursor: 'pointer', fontSize: 10,
                  }}>{d}d</button>
                ))}
              </div>
            </div>
          </div>

          {/* Cotización + Margen */}
          <div style={{ padding: 16, borderRadius: 12, background: c.panel, border: `1px solid rgba(232,134,10,0.2)` }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 9, color: c.orange, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 4 }}>
                  Cotización LP
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14, color: c.muted }}>$</span>
                  <input type="number" value={cotizacion} onChange={e => setCotizacion(e.target.value)}
                    style={{ ...inputStyle, fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 16, color: c.orange }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ fontSize: 9, color: c.muted, textTransform: 'uppercase' }}>Margen global</label>
                  <button onClick={applyGlobalMargin} style={{
                    fontSize: 9, padding: '2px 8px', borderRadius: 5, border: `1px solid ${c.orange}40`,
                    background: c.orangeDim, color: c.orange, cursor: 'pointer',
                  }}>Aplicar a todos</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="number" value={globalMargin} onChange={e => setGlobalMargin(e.target.value)}
                    style={{ ...inputStyle, fontFamily: 'var(--font-mono)', fontWeight: 800 }} />
                  <span style={{ color: c.muted, fontWeight: 700 }}>%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Condiciones de pago */}
          <div style={{ padding: 14, borderRadius: 12, background: c.panel, border: `1px solid ${c.border}` }}>
            <label style={{ fontSize: 9, color: c.muted, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Condiciones de pago</label>
            <select value={paymentConditions} onChange={e => setPaymentConditions(e.target.value)} style={inputStyle}>
              {['ANTICIPADO', 'CONTADO', '30 DÍAS', '60 DÍAS', '30/60 DÍAS', 'E-CHEQUE', 'CHEQUE', 'NEGOCIABLE'].map(o => (
                <option key={o} value={o} style={{ background: '#0d0d1e' }}>{o}</option>
              ))}
            </select>
          </div>

          {/* Totales */}
          <div style={{
            padding: 18, borderRadius: 14,
            background: `linear-gradient(135deg, rgba(232,134,10,0.08), rgba(232,134,10,0.04))`,
            border: `1px solid rgba(232,134,10,0.25)`,
            borderTop: `1px solid rgba(232,134,10,0.5)`,
          }}>
            {[
              { label: 'NETO GRAVADO', value: neto, color: c.text, size: 14 },
              { label: 'IVA 21%', value: ivaAmount, color: c.sub, size: 12 },
              { label: 'TOTAL', value: total, color: c.orange, size: 20 },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: i < 2 ? 8 : 0, paddingTop: i === 2 ? 12 : 0, borderTop: i === 2 ? `1px solid rgba(232,134,10,0.2)` : 'none' }}>
                <span style={{ fontSize: 9, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.1em', fontStyle: 'italic', fontWeight: 700 }}>{row.label}</span>
                <span style={{ fontSize: row.size, fontWeight: 900, color: row.color, fontFamily: 'var(--font-mono)' }}>
                  {fmtARS(row.value)}
                </span>
              </div>
            ))}

            <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
              <button onClick={() => setShowPrint(true)} style={{
                flex: 1, padding: '10px', borderRadius: 9, border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg,${c.orangeLight},${c.orange})`,
                color: '#000', fontWeight: 800, fontSize: 12,
                boxShadow: `0 0 20px rgba(232,134,10,0.3)`,
              }}>🖨️ Generar PDF</button>
            </div>

            {/* Rentabilidad */}
            {neto > 0 && (
              <div style={{ marginTop: 12, padding: '8px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.2)', textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: c.muted, textTransform: 'uppercase', marginBottom: 2 }}>Ganancia estimada</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: c.lime }}>
                  {fmtARS(items.reduce((s, i) => s + (+i.subtotal - +i.cost_price_ars * +i.quantity), 0))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showPrint && (
        <PrintView quote={quoteData} items={items} onClose={() => setShowPrint(false)} />
      )}
    </div>
  )
}
