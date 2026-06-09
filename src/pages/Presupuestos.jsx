import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { supabase } from '../supabase'

// ── PALETA ──
const c = {
  bg: '#07070f', panel: 'rgba(255,255,255,0.035)', border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.14)', text: '#f1f5f9', sub: '#94a3b8', muted: '#475569',
  orange: '#E8860A', orangeLight: '#F5A623', orangeDim: 'rgba(232,134,10,0.12)',
  cyan: '#06b6d4', violet: '#7c3aed', lime: '#84cc16', rose: '#f43f5e', amber: '#f59e0b',
}

// ── HELPERS ──
const fmtARS = (n) => {
  const num = parseFloat(n) || 0
  return `$${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
const fmtShort = (n) => {
  const num = parseFloat(n) || 0
  if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`
  if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`
  return fmtARS(num)
}
const today = () => new Date().toISOString().split('T')[0]
const addDays = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().split('T')[0] }

const STATUSES = {
  BORRADOR:    { label: 'Borrador',    color: '#64748b', next: ['ENVIADO'] },
  ENVIADO:     { label: 'Enviado',     color: '#06b6d4', next: ['APROBADO', 'RECHAZADO', 'EN_REVISION'] },
  EN_REVISION: { label: 'En revisión', color: '#f59e0b', next: ['APROBADO', 'RECHAZADO', 'ENVIADO'] },
  APROBADO:    { label: 'Aprobado',    color: '#84cc16', next: [] },
  RECHAZADO:   { label: 'Rechazado',   color: '#f43f5e', next: ['BORRADOR'] },
  VENCIDO:     { label: 'Vencido',     color: '#7c3aed', next: ['BORRADOR'] },
}

// ── ESTILOS BASE ──
const inp = (extra = {}) => ({
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 7, padding: '7px 10px',
  color: '#f1f5f9', fontSize: 12, outline: 'none',
  width: '100%', boxSizing: 'border-box',
  fontFamily: 'var(--font-body, system-ui)',
  ...extra,
})

const inpNum = (extra = {}) => inp({
  textAlign: 'right', fontFamily: 'var(--font-mono, monospace)',
  fontWeight: 700, color: '#f1f5f9', ...extra,
})

const EMPTY_ITEM = () => ({
  _key: Math.random().toString(36).slice(2),
  product_id: null, description: '', size: '',
  quantity: 1, unit_price_usd: 0, cost_price_ars: 0,
  margin_pct: 18, unit_sale_price: 0, subtotal: 0,
  iva_pct: 21, discount_pct: 0, supplier_name: '',
})

const calcItem = (item, cotizacion) => {
  const usd = parseFloat(item.unit_price_usd) || 0
  const cost = usd > 0 ? Math.round(usd * parseFloat(cotizacion)) : (parseFloat(item.cost_price_ars) || 0)
  const margin = parseFloat(item.margin_pct) || 0
  const sale = Math.round(cost * (1 + margin / 100))
  const qty = parseFloat(item.quantity) || 0
  const disc = parseFloat(item.discount_pct) || 0
  const sub = Math.round(qty * sale * (1 - disc / 100))
  return { ...item, cost_price_ars: cost, unit_sale_price: sale, subtotal: sub }
}

// ── BÚSQUEDA DE PRODUCTOS ──
function ProductSearch({ onAdd, cotizacion, globalMargin }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q.trim()) { setResults([]); return }
      const { data } = await supabase.from('products')
        .select('id,name,brand,price_usd,cost_price,product_type,size_range,supplier_name')
        .or(`name.ilike.%${q}%,brand.ilike.%${q}%,product_type.ilike.%${q}%`)
        .limit(7)
      setResults(data || [])
    }, 220)
    return () => clearTimeout(t)
  }, [q])

  const select = (p) => {
    const cost = p.price_usd > 0 ? Math.round(p.price_usd * parseFloat(cotizacion)) : (p.cost_price || 0)
    const sale = Math.round(cost * (1 + globalMargin / 100))
    onAdd({
      ...EMPTY_ITEM(),
      product_id: p.id, description: p.name,
      unit_price_usd: p.price_usd || 0, cost_price_ars: cost,
      margin_pct: globalMargin, unit_sale_price: sale,
      subtotal: sale, supplier_name: p.supplier_name || '',
    })
    setQ(''); setResults([]); setOpen(false)
  }

  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <input value={q} onChange={e => { setQ(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        placeholder="🔍  Buscar en catálogo..."
        style={inp({ fontSize: 13, padding: '9px 12px' })} />
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '105%', left: 0, right: 0, zIndex: 400,
          background: '#0d0d1e', border: `1px solid ${c.border2}`,
          borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
        }}>
          {results.map(p => {
            const cost = p.price_usd > 0 ? Math.round(p.price_usd * parseFloat(cotizacion)) : (p.cost_price || 0)
            const sale = Math.round(cost * (1 + globalMargin / 100))
            return (
              <div key={p.id} onMouseDown={() => select(p)} style={{
                padding: '9px 14px', cursor: 'pointer',
                borderBottom: `1px solid ${c.border}`,
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9', marginBottom: 3 }}>{p.name}</div>
                <div style={{ display: 'flex', gap: 12, fontSize: 10 }}>
                  {p.brand && <span style={{ color: c.orangeLight }}>{p.brand}</span>}
                  {p.price_usd > 0 && <span style={{ color: c.amber }}>U$S {p.price_usd}</span>}
                  {cost > 0 && <span style={{ color: c.sub }}>Costo {fmtARS(cost)}</span>}
                  {sale > 0 && <span style={{ color: c.lime, fontWeight: 700 }}>Venta {fmtARS(sale)}</span>}
                  {p.supplier_name && <span style={{ color: c.muted }}>{p.supplier_name}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── FILA DE ÍTEM ──
function ItemRow({ item, idx, cotizacion, onChange, onDelete }) {
  const upd = (field, val) => {
    const updated = { ...item, [field]: val }
    onChange(calcItem(updated, cotizacion))
  }

  const ganancia = (parseFloat(item.unit_sale_price) - parseFloat(item.cost_price_ars)) * parseFloat(item.quantity)
  const ganPct = item.cost_price_ars > 0 ? ((item.unit_sale_price - item.cost_price_ars) / item.cost_price_ars * 100).toFixed(1) : 0

  const cellInp = (value, field, extra = {}) => (
    <input
      type="number"
      value={value}
      onChange={e => upd(field, e.target.value)}
      style={inpNum({ padding: '5px 6px', fontSize: 11, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#f1f5f9', ...extra })}
    />
  )

  return (
    <>
      <tr style={{ borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
        {/* # */}
        <td style={{ padding: '7px 6px', fontSize: 10, color: c.muted, textAlign: 'center', width: 28 }}>
          {String(idx + 1).padStart(3, '0')}
        </td>
        {/* Descripción */}
        <td style={{ padding: '7px 6px', minWidth: 200 }}>
          <input value={item.description} onChange={e => onChange({ ...item, description: e.target.value })}
            style={inp({ padding: '5px 7px', fontSize: 11, color: '#f1f5f9', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' })}
            placeholder="Descripción del producto..." />
        </td>
        {/* Talle */}
        <td style={{ padding: '7px 6px', width: 68 }}>
          <input value={item.size} onChange={e => onChange({ ...item, size: e.target.value })}
            style={inp({ padding: '5px 6px', fontSize: 11, color: '#f1f5f9', textAlign: 'center', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' })}
            placeholder="L / XL" />
        </td>
        {/* Cant */}
        <td style={{ padding: '7px 6px', width: 55 }}>
          {cellInp(item.quantity, 'quantity', { color: '#f1f5f9', fontWeight: 800 })}
        </td>
        {/* U$S */}
        <td style={{ padding: '7px 6px', width: 82 }}>
          {cellInp(item.unit_price_usd, 'unit_price_usd', { color: c.amber })}
        </td>
        {/* $ Costo */}
        <td style={{ padding: '7px 6px', width: 105, textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#f1f5f9', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>
            {fmtARS(item.cost_price_ars)}
          </div>
          <div style={{ fontSize: 9, color: c.muted, marginTop: 1 }}>por unidad</div>
        </td>
        {/* Margen */}
        <td style={{ padding: '7px 6px', width: 70 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {cellInp(item.margin_pct, 'margin_pct', { color: '#f1f5f9' })}
            <span style={{ fontSize: 10, color: c.muted, flexShrink: 0 }}>%</span>
          </div>
        </td>
        {/* $ Venta */}
        <td style={{ padding: '7px 6px', width: 110, textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: c.orangeLight, fontFamily: 'var(--font-mono, monospace)', fontWeight: 800 }}>
            {fmtARS(item.unit_sale_price)}
          </div>
          <div style={{ fontSize: 9, color: c.lime }}>+{ganPct}%</div>
        </td>
        {/* Desc % */}
        <td style={{ padding: '7px 6px', width: 58 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {cellInp(item.discount_pct, 'discount_pct', { color: '#f1f5f9' })}
            <span style={{ fontSize: 10, color: c.muted, flexShrink: 0 }}>%</span>
          </div>
        </td>
        {/* Subtotal */}
        <td style={{ padding: '7px 6px', width: 120, textAlign: 'right' }}>
          <div style={{ fontSize: 13, color: c.lime, fontFamily: 'var(--font-mono, monospace)', fontWeight: 900 }}>
            {fmtARS(item.subtotal)}
          </div>
          <div style={{ fontSize: 9, color: c.sub }}>
            Gan. {fmtARS(Math.max(0, ganancia))}
          </div>
        </td>
        {/* Delete */}
        <td style={{ padding: '7px 4px', width: 24 }}>
          <button onClick={onDelete} style={{
            background: 'none', border: 'none', color: c.muted, cursor: 'pointer', fontSize: 15, padding: 2,
          }}
            onMouseEnter={e => e.currentTarget.style.color = c.rose}
            onMouseLeave={e => e.currentTarget.style.color = c.muted}>×</button>
        </td>
      </tr>
      {/* Proveedor sub-row */}
      {item.unit_price_usd > 0 && (
        <tr style={{ borderBottom: `1px solid rgba(255,255,255,0.03)`, background: 'rgba(0,0,0,0.15)' }}>
          <td />
          <td colSpan={3} style={{ padding: '2px 6px 5px' }}>
            <input value={item.supplier_name} onChange={e => onChange({ ...item, supplier_name: e.target.value })}
              placeholder="Proveedor..."
              style={inp({ padding: '3px 7px', fontSize: 10, color: c.sub, background: 'transparent', border: '1px solid rgba(255,255,255,0.06)' })} />
          </td>
          <td colSpan={7} style={{ padding: '2px 6px 5px', fontSize: 10, color: c.muted, fontFamily: 'var(--font-mono, monospace)' }}>
            Costo total: {fmtARS(parseFloat(item.cost_price_ars) * parseFloat(item.quantity))}
            {item.unit_price_usd > 0 && ` · U$S ${parseFloat(item.unit_price_usd)} × $${parseFloat(cotizacion).toLocaleString('es-AR')} = ${fmtARS(item.cost_price_ars)}`}
          </td>
        </tr>
      )}
    </>
  )
}

// ── PDF IMPRIMIBLE ──
function PrintView({ quote, items, extras, onClose }) {
  const costoProductos = items.reduce((s, i) => s + parseFloat(i.cost_price_ars || 0) * parseFloat(i.quantity || 0), 0)
  const neto = items.filter(i => i.description).reduce((s, i) => s + parseFloat(i.subtotal || 0), 0)
  const costoExtras = parseFloat(extras.transporte || 0) + parseFloat(extras.diseno || 0) + parseFloat(extras.otros || 0)
  const costoIIBB = neto * (parseFloat(extras.iibb_pct || 0) / 100)
  const costoTotal = costoProductos + costoExtras + costoIIBB
  const gananciaReal = neto - costoTotal
  const ivaAmt = Math.round(neto * 0.21)
  const total = neto + ivaAmt
  const fmt2 = n => `$${parseFloat(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const filledItems = [
    ...items.filter(i => i.description),
    ...Array.from({ length: Math.max(0, 16 - items.filter(i => i.description).length) }, (_, i) => ({ _key: `empty-${i}`, description: '-', quantity: 0, unit_sale_price: 0, discount_pct: 0, subtotal: 0, isEmpty: true }))
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 600,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '20px 20px 40px', overflowY: 'auto',
    }}>
      <style>{`
        @media print {
          html, body { margin: 0; padding: 0; }
          body > * { display: none !important; }
          #steps-quote-print { display: block !important; position: fixed !important; top: 0; left: 0; width: 100%; height: 100%; z-index: 99999; }
        }
        @page { size: A4; margin: 0; }
      `}</style>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={() => window.print()} style={{
          padding: '10px 24px', borderRadius: 9, border: 'none', cursor: 'pointer',
          background: `linear-gradient(135deg,${c.orangeLight},${c.orange})`,
          color: '#000', fontWeight: 800, fontSize: 13,
        }}>🖨️ Imprimir / Guardar PDF</button>
        <a href={`https://wa.me/?text=${encodeURIComponent(
          `✅ *PRESUPUESTO N° ${quote.number} — STEPS*\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `*Cliente:* ${quote.client_name}\n` +
          `*Fecha:* ${quote.date}   *Vence:* ${quote.expires_at}\n\n` +
          items.filter(i => i.description).map((i, idx) =>
            `${String(idx+1).padStart(3,'0')}. ${i.description}${i.size ? ` (T: ${i.size})` : ''}\n     ${i.quantity} u × ${fmt2(i.unit_sale_price)} = *${fmt2(i.subtotal)}*`
          ).join('\n') +
          `\n\n━━━━━━━━━━━━━━━━━━\n` +
          `NETO: ${fmt2(neto)}\nIVA 21%: ${fmt2(ivaAmt)}\n*TOTAL: ${fmt2(total)}*\n\n` +
          `Condiciones: ${quote.payment_conditions}\n` +
          `📍 STEPS — Catriel, Río Negro`
        )}`} target="_blank" rel="noreferrer" style={{
          padding: '10px 24px', borderRadius: 9, background: '#25D366',
          color: '#fff', fontWeight: 800, fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>📲 WhatsApp</a>
        <button onClick={onClose} style={{
          padding: '10px 18px', borderRadius: 9, border: `1px solid ${c.border}`,
          background: 'transparent', color: c.sub, cursor: 'pointer', fontSize: 13,
        }}>✕ Cerrar</button>
      </div>

      {/* HOJA A4 */}
      <div id="steps-quote-print" style={{
        width: 794, background: '#fff', color: '#111',
        fontFamily: 'Arial, Helvetica, sans-serif',
        boxShadow: '0 0 60px rgba(0,0,0,0.6)',
        padding: '24px 32px 32px',
      }}>
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 0, paddingBottom: 16 }}>
          {/* Logo */}
          <div>
            <img src="/logo.png" alt="STEPS" style={{ height: 44, width: 'auto' }}
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block' }} />
            <div style={{ display: 'none', fontSize: 26, fontWeight: 900, color: '#E8860A', letterSpacing: -1 }}>STEPS</div>
            <div style={{ fontSize: 8, color: '#999', marginTop: 5, letterSpacing: 2, textTransform: 'uppercase' }}>
              CATRIEL · RIO NEGRO · ARGENTINA
            </div>
          </div>
          {/* Sello + Número */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
            <div style={{
              border: '2px solid #ccc', padding: '6px 10px', fontSize: 7,
              color: '#999', textAlign: 'center', lineHeight: 1.4, borderRadius: 2,
            }}>
              Documento no válido<br />como factura
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#222', textTransform: 'uppercase', letterSpacing: 1 }}>PRESUPUESTO N°</div>
              <div style={{ fontSize: 34, fontWeight: 900, color: '#E8860A', fontStyle: 'italic', lineHeight: 1 }}>{quote.number}</div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '3px solid #E8860A', marginBottom: 12 }} />

        {/* INFO CLIENTE */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0,
          border: '1px solid #ddd', marginBottom: 14,
        }}>
          <div style={{ padding: '10px 14px', borderRight: '1px solid #ddd' }}>
            <div style={{ fontSize: 8, color: '#999', textTransform: 'uppercase', marginBottom: 3 }}>Cliente</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#E8860A', fontStyle: 'italic' }}>{quote.client_name}</div>
            <div style={{ fontSize: 10, color: '#444', marginTop: 2 }}>ID: {quote.client_cuit}</div>
            <div style={{ fontSize: 10, color: '#444' }}>Categoría: <strong>{quote.client_category}</strong></div>
          </div>
          <div style={{ padding: '10px 14px' }}>
            <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  ['Fecha:', quote.date],
                  ['Solicita:', quote.solicita],
                  ['IVA:', quote.client_iva],
                  ['Condiciones:', quote.payment_conditions],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td style={{ color: '#888', paddingRight: 8, paddingBottom: 2 }}>{k}</td>
                    <td style={{ fontWeight: 700 }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TABLA ÍTEMS */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12, fontSize: 10 }}>
          <thead>
            <tr style={{ background: '#222', color: '#fff' }}>
              {[
                { label: 'N°', w: 32, align: 'center' },
                { label: 'DESCRIPCIÓN', w: null, align: 'left' },
                { label: 'Q', w: 28, align: 'center' },
                { label: 'UNITARIO', w: 90, align: 'right' },
                { label: '%%%', w: 40, align: 'center' },
                { label: 'SUBTOTAL', w: 90, align: 'right' },
              ].map(h => (
                <th key={h.label} style={{ padding: '7px 8px', width: h.w, textAlign: h.align, fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>{h.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filledItems.map((item, idx) => (
              <tr key={item._key || idx} style={{ borderBottom: '1px solid #eee', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 600, color: item.isEmpty ? '#ccc' : '#222' }}>
                  {String(idx + 1).padStart(3, '0')}
                </td>
                <td style={{ padding: '6px 8px', color: item.isEmpty ? '#ccc' : '#111' }}>
                  {item.isEmpty ? '-' : `${item.description}${item.size ? ` - T: ${item.size}` : ''}`}
                </td>
                <td style={{ padding: '6px 8px', textAlign: 'center', color: item.isEmpty ? '#ccc' : '#111' }}>
                  {item.isEmpty ? '0' : item.quantity}
                </td>
                <td style={{ padding: '6px 8px', textAlign: 'right', color: item.isEmpty ? '#ccc' : '#111' }}>
                  {item.isEmpty ? '$  —  ' : fmt2(item.unit_sale_price)}
                </td>
                <td style={{ padding: '6px 8px', textAlign: 'center', color: item.isEmpty ? '#ccc' : '#111' }}>
                  {item.isEmpty ? '0%' : `${item.discount_pct || 0}%`}
                </td>
                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: item.isEmpty ? 400 : 700, color: item.isEmpty ? '#ccc' : '#111' }}>
                  {item.isEmpty ? '$  —  ' : fmt2(item.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* VENCIMIENTO + TOTALES */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: '#555' }}>
            <span style={{ color: '#888' }}>Vencimiento del presupuesto: </span>
            <strong>{quote.expires_at}</strong>
          </div>
          <div style={{
            background: '#1a1a1a', color: '#fff',
            padding: '12px 20px', borderRadius: 4,
            display: 'flex', gap: 28, alignItems: 'center',
          }}>
            {[
              { l: 'NETO GRAVADO', v: neto },
              { l: 'IVA', v: ivaAmt },
              { l: 'TOTAL', v: total, big: true },
            ].map(row => (
              <div key={row.l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 8, color: '#999', fontStyle: 'italic', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>{row.l}</div>
                <div style={{ fontSize: row.big ? 15 : 12, fontWeight: 900, color: '#E8860A', fontStyle: 'italic' }}>
                  {fmt2(row.v)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ borderTop: '1px solid #eee', paddingTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', color: '#aaa', fontSize: 9 }}>
            {['📸 stepsindustrial', '✉️ gestionsteps@gmail.com', '🌐 walk safe', '📘 STEPS.INDUSTRIAL', '🖥️ stepsindustrial.com'].map(s => (
              <span key={s}>{s}</span>
            ))}
          </div>
          <div style={{ textAlign: 'center', fontSize: 8, color: '#ddd', marginTop: 6 }}>
            2993295575 · Catriel, Río Negro, Argentina
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MÓDULO PRINCIPAL ──
export default function Presupuestos() {
  const [view, setView] = useState('list')
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPrint, setShowPrint] = useState(false)
  const [editId, setEditId] = useState(null)

  // Form state
  const [number, setNumber] = useState(325)
  const [date, setDate] = useState(today())
  const [expiresAt, setExpiresAt] = useState(addDays(today(), 5))
  const [status, setStatus] = useState('BORRADOR')
  const [clientName, setClientName] = useState('')
  const [clientCuit, setClientCuit] = useState('')
  const [clientCategory, setClientCategory] = useState('NUEVO')
  const [clientIva, setClientIva] = useState('Responsable Inscripto')
  const [solicita, setSolicita] = useState('')
  const [cotizacion, setCotizacion] = useState(() => parseFloat(localStorage.getItem('steps_lp_usd')) || 1458)
  const [globalMargin, setGlobalMargin] = useState(18)
  const [paymentConditions, setPaymentConditions] = useState('ANTICIPADO')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([EMPTY_ITEM()])
  const [extras, setExtras] = useState({ transporte: 0, diseno: 0, iibb_pct: 0, otros: 0 })

  // KPIs calculados en tiempo real
  const neto = useMemo(() => items.reduce((s, i) => s + (parseFloat(i.subtotal) || 0), 0), [items])
  const ivaAmount = useMemo(() => Math.round(neto * 0.21), [neto])
  const total = useMemo(() => neto + ivaAmount, [neto, ivaAmount])
  const costoProductos = useMemo(() => items.reduce((s, i) => s + (parseFloat(i.cost_price_ars) || 0) * (parseFloat(i.quantity) || 0), 0), [items])
  const costoExtras = useMemo(() => parseFloat(extras.transporte || 0) + parseFloat(extras.diseno || 0) + parseFloat(extras.otros || 0), [extras])
  const costoIIBB = useMemo(() => neto * ((parseFloat(extras.iibb_pct) || 0) / 100), [neto, extras.iibb_pct])
  const costoTotal = useMemo(() => costoProductos + costoExtras + costoIIBB, [costoProductos, costoExtras, costoIIBB])
  const gananciaBruta = useMemo(() => neto - costoTotal, [neto, costoTotal])
  const rentabilidad = useMemo(() => neto > 0 ? ((gananciaBruta / neto) * 100).toFixed(2) : 0, [gananciaBruta, neto])

  useEffect(() => { loadQuotes() }, [])

  const loadQuotes = async () => {
    setLoading(true)
    const { data } = await supabase.from('quotes').select('*').order('number', { ascending: false })
    setQuotes(data || [])
    setLoading(false)
  }

  const newQuote = async () => {
    const { data } = await supabase.from('quotes').select('number').order('number', { ascending: false }).limit(1)
    const nextNum = data?.[0]?.number ? data[0].number + 1 : 325
    resetForm(nextNum)
    setEditId(null)
    setView('form')
  }

  const openQuote = async (q) => {
    setEditId(q.id)
    setNumber(q.number); setDate(q.date || today()); setExpiresAt(q.expires_at || addDays(today(), 5))
    setStatus(q.status || 'BORRADOR'); setClientName(q.client_name || ''); setClientCuit(q.client_cuit || '')
    setClientCategory(q.client_category || 'NUEVO'); setClientIva(q.client_iva || 'Responsable Inscripto')
    setSolicita(q.solicita || ''); setCotizacion(q.cotizacion || parseFloat(localStorage.getItem('steps_lp_usd')) || 1458)
    setGlobalMargin(q.global_margin || 18); setPaymentConditions(q.payment_conditions || 'ANTICIPADO')
    setNotes(q.notes || '')
    setExtras({ transporte: q.costo_transporte || 0, diseno: q.costo_diseno || 0, iibb_pct: q.costo_iibb_pct || 0, otros: q.costo_otros || 0 })
    const { data: itemsData } = await supabase.from('quote_items').select('*').eq('quote_id', q.id).order('position')
    setItems(itemsData?.length ? itemsData.map(i => ({ ...i, _key: i.id })) : [EMPTY_ITEM()])
    setView('form')
  }

  const resetForm = (num) => {
    setNumber(num); setDate(today()); setExpiresAt(addDays(today(), 5)); setStatus('BORRADOR')
    setClientName(''); setClientCuit(''); setClientCategory('NUEVO'); setClientIva('Responsable Inscripto')
    setSolicita(''); setCotizacion(parseFloat(localStorage.getItem('steps_lp_usd')) || 1458)
    setGlobalMargin(18); setPaymentConditions('ANTICIPADO'); setNotes('')
    setItems([EMPTY_ITEM()]); setExtras({ transporte: 0, diseno: 0, iibb_pct: 0, otros: 0 })
  }

  const addItem = (item) => setItems(prev => [...prev, { ...item, _key: Math.random().toString(36).slice(2) }])
  const updateItem = (idx, item) => setItems(prev => prev.map((x, j) => j === idx ? item : x))
  const deleteItem = (idx) => setItems(prev => prev.filter((_, j) => j !== idx))
  const addEmptyItem = () => setItems(prev => [...prev, EMPTY_ITEM()])

  const applyGlobalMargin = () => {
    setItems(prev => prev.map(i => calcItem({ ...i, margin_pct: globalMargin }, cotizacion)))
  }

  const recalcAllWithRate = (rate) => {
    setCotizacion(rate)
    setItems(prev => prev.map(i => i.unit_price_usd > 0 ? calcItem(i, rate) : i))
  }

  const save = async () => {
    if (!clientName.trim()) return
    setSaving(true)
    const payload = {
      number: +number, date, expires_at: expiresAt, status, client_name: clientName,
      client_cuit: clientCuit, client_category: clientCategory, client_iva: clientIva,
      solicita, cotizacion: +cotizacion, global_margin: +globalMargin,
      payment_conditions: paymentConditions, notes, neto, iva_amount: ivaAmount, total,
      costo_transporte: +extras.transporte, costo_diseno: +extras.diseno,
      costo_iibb_pct: +extras.iibb_pct, costo_otros: +extras.otros,
      updated_at: new Date(),
    }
    let quoteId = editId
    if (editId) {
      await supabase.from('quotes').update(payload).eq('id', editId)
    } else {
      const { data } = await supabase.from('quotes').insert(payload).select()
      quoteId = data?.[0]?.id
      if (quoteId) setEditId(quoteId)
    }
    if (quoteId) {
      await supabase.from('quote_items').delete().eq('quote_id', quoteId)
      const toInsert = items.filter(i => i.description?.trim()).map((i, idx) => ({
        quote_id: quoteId, position: idx + 1, product_id: i.product_id || null,
        description: i.description, size: i.size || null, quantity: +i.quantity,
        unit_price_usd: +i.unit_price_usd, cost_price_ars: +i.cost_price_ars,
        margin_pct: +i.margin_pct, unit_sale_price: +i.unit_sale_price,
        subtotal: +i.subtotal, iva_pct: 21, discount_pct: +i.discount_pct,
        supplier_name: i.supplier_name || null,
      }))
      if (toInsert.length > 0) await supabase.from('quote_items').insert(toInsert)
    }
    await loadQuotes()
    setSaving(false)
  }

  const quoteData = { number, date, expires_at: expiresAt, client_name: clientName, client_cuit: clientCuit, client_category: clientCategory, client_iva: clientIva, solicita, payment_conditions: paymentConditions }

  // ── LISTA ──
  if (view === 'list') {
    const byStatus = (s) => quotes.filter(q => q.status === s).length
    const totalAprobado = quotes.filter(q => q.status === 'APROBADO').reduce((s, q) => s + (q.total || 0), 0)
    const totalEnviado = quotes.filter(q => q.status === 'ENVIADO').reduce((s, q) => s + (q.total || 0), 0)

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-display)' }}>Presupuestos</h2>
            <p style={{ margin: '3px 0 0', color: c.sub, fontSize: 12 }}>{quotes.length} total · Pipeline comercial</p>
          </div>
          <button onClick={newQuote} style={{
            padding: '10px 22px', borderRadius: 9, border: 'none', cursor: 'pointer',
            background: `linear-gradient(135deg,${c.orangeLight},${c.orange})`,
            color: '#000', fontWeight: 800, fontSize: 13, boxShadow: `0 0 24px rgba(232,134,10,0.3)`,
          }}>+ Nuevo</button>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 18 }}>
          {[
            { label: 'Enviados', value: byStatus('ENVIADO'), sub: fmtShort(totalEnviado), color: c.cyan },
            { label: 'En revisión', value: byStatus('EN_REVISION'), sub: 'Esperando resp.', color: c.amber },
            { label: 'Aprobados', value: byStatus('APROBADO'), sub: fmtShort(totalAprobado), color: c.lime },
            { label: 'Rechazados', value: byStatus('RECHAZADO'), sub: 'Este mes', color: c.rose },
            { label: 'Borradores', value: byStatus('BORRADOR'), sub: 'Sin enviar', color: c.muted },
          ].map(k => (
            <div key={k.label} style={{
              padding: '14px', borderRadius: 12, background: c.panel,
              border: `1px solid ${c.border}`, borderTop: `2px solid ${k.color}30`,
            }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: k.color, fontFamily: 'var(--font-mono, monospace)' }}>{k.value}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: c.sub, marginTop: 2 }}>{k.label}</div>
              <div style={{ fontSize: 10, color: k.color, marginTop: 1 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: c.orange, fontSize: 32 }}>⚡</div>
        ) : quotes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 64, opacity: 0.1, marginBottom: 16 }}>📋</div>
            <div style={{ color: c.sub, marginBottom: 20 }}>Sin presupuestos todavía</div>
            <button onClick={newQuote} style={{ padding: '12px 28px', borderRadius: 10, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${c.orangeLight},${c.orange})`, color: '#000', fontWeight: 800 }}>
              Crear el primero
            </button>
          </div>
        ) : (
          <div style={{ borderRadius: 14, border: `1px solid ${c.border}`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${c.border}` }}>
                  {['N°', 'Cliente', 'Solicita', 'Fecha', 'Vence', 'Total', 'Rent.', 'Estado', ''].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 9, color: c.sub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {quotes.map(q => {
                  const sc = STATUSES[q.status] || STATUSES.BORRADOR
                  const vencido = q.expires_at && new Date(q.expires_at) < new Date() && !['APROBADO', 'RECHAZADO'].includes(q.status)
                  const rentPct = q.neto > 0 ? ((q.neto - (q.costo_transporte || 0) - (q.costo_diseno || 0) - (q.costo_otros || 0)) / q.neto * 100).toFixed(1) : null
                  return (
                    <tr key={q.id} style={{ borderBottom: `1px solid ${c.border}`, cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      onClick={() => openQuote(q)}>
                      <td style={{ padding: '11px 12px', fontWeight: 900, color: c.orange, fontFamily: 'var(--font-mono, monospace)' }}>#{q.number}</td>
                      <td style={{ padding: '11px 12px', fontWeight: 600 }}>{q.client_name}</td>
                      <td style={{ padding: '11px 12px', color: c.sub, fontSize: 11 }}>{q.solicita || '—'}</td>
                      <td style={{ padding: '11px 12px', color: c.sub }}>{q.date}</td>
                      <td style={{ padding: '11px 12px', color: vencido ? c.rose : c.sub }}>{q.expires_at}</td>
                      <td style={{ padding: '11px 12px', fontWeight: 800, color: c.lime, fontFamily: 'var(--font-mono, monospace)' }}>{fmtShort(q.total)}</td>
                      <td style={{ padding: '11px 12px', fontSize: 11, color: rentPct > 10 ? c.lime : rentPct > 0 ? c.amber : c.rose }}>
                        {rentPct ? `${rentPct}%` : '—'}
                      </td>
                      <td style={{ padding: '11px 12px' }}>
                        <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 20, fontWeight: 700, background: `${sc.color}18`, color: sc.color, border: `1px solid ${sc.color}30` }}>
                          {vencido ? 'Vencido' : sc.label}
                        </span>
                      </td>
                      <td style={{ padding: '11px 12px' }}>
                        <button onClick={e => { e.stopPropagation(); openQuote(q) }} style={{ background: 'none', border: `1px solid ${c.border}`, borderRadius: 6, color: c.muted, cursor: 'pointer', fontSize: 11, padding: '3px 8px' }}>✏️</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  // ── FORMULARIO ──
  const sc = STATUSES[status] || STATUSES.BORRADOR

  return (
    <div>
      {/* TOOLBAR */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, padding: '10px 14px', borderRadius: 12, background: c.panel, border: `1px solid ${c.border}` }}>
        <button onClick={() => { loadQuotes(); setView('list') }} style={{ background: 'none', border: `1px solid ${c.border}`, borderRadius: 7, color: c.sub, cursor: 'pointer', padding: '6px 12px', fontSize: 12 }}>← Volver</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 9, color: c.muted, textTransform: 'uppercase' }}>Presupuesto N°</span>
          <input type="number" value={number} onChange={e => setNumber(e.target.value)}
            style={{ ...inpNum(), width: 72, fontSize: 16, fontWeight: 900, color: c.orange, padding: '4px 8px', border: `1px solid ${c.orange}40`, background: c.orangeDim }} />
        </div>

        <select value={status} onChange={e => setStatus(e.target.value)}
          style={{ ...inp(), width: 'auto', fontSize: 11, color: sc.color, border: `1px solid ${sc.color}50`, background: `${sc.color}12` }}>
          {Object.entries(STATUSES).map(([k, v]) => (
            <option key={k} value={k} style={{ background: '#0d0d1e', color: '#f1f5f9' }}>{v.label}</option>
          ))}
        </select>

        {/* Siguiente estado sugerido */}
        {sc.next.length > 0 && (
          <div style={{ display: 'flex', gap: 6 }}>
            {sc.next.map(nextStatus => {
              const ns = STATUSES[nextStatus]
              return (
                <button key={nextStatus} onClick={() => setStatus(nextStatus)} style={{
                  padding: '5px 10px', borderRadius: 7, border: `1px solid ${ns.color}40`,
                  background: `${ns.color}10`, color: ns.color, cursor: 'pointer', fontSize: 10, fontWeight: 600,
                }}>→ {ns.label}</button>
              )
            })}
          </div>
        )}

        <div style={{ flex: 1 }} />
        <button onClick={() => setShowPrint(true)} style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${c.border}`, background: 'transparent', color: c.sub, cursor: 'pointer', fontSize: 12 }}>
          👁️ Vista previa PDF
        </button>
        <button onClick={save} disabled={saving || !clientName.trim()} style={{
          padding: '8px 22px', borderRadius: 9, border: 'none', cursor: saving || !clientName.trim() ? 'not-allowed' : 'pointer',
          background: `linear-gradient(135deg,${c.orangeLight},${c.orange})`,
          color: '#000', fontWeight: 800, fontSize: 13,
          opacity: !clientName.trim() || saving ? 0.5 : 1,
        }}>{saving ? '...' : '💾 Guardar'}</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 272px', gap: 14 }}>

        {/* ── MAIN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Cliente */}
          <div style={{ padding: 16, borderRadius: 13, background: c.panel, border: `1px solid ${c.border}` }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 10 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: 9, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 3 }}>Cliente *</label>
                <input value={clientName} onChange={e => setClientName(e.target.value)}
                  placeholder="Nombre o razón social"
                  style={inp({ fontSize: 14, fontWeight: 700, color: '#f1f5f9', border: clientName ? `1px solid ${c.orange}40` : `1px solid ${c.border}` })} />
              </div>
              {[
                { label: 'CUIT', val: clientCuit, set: setClientCuit, ph: '30-12345678-9' },
                { label: 'Solicita', val: solicita, set: setSolicita, ph: 'Nombre del contacto' },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ fontSize: 9, color: c.muted, textTransform: 'uppercase', display: 'block', marginBottom: 3 }}>{f.label}</label>
                  <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                    style={inp({ color: '#f1f5f9' })} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 9, color: c.muted, textTransform: 'uppercase', display: 'block', marginBottom: 3 }}>IVA</label>
                <select value={clientIva} onChange={e => setClientIva(e.target.value)} style={inp({ color: '#f1f5f9' })}>
                  {['Responsable Inscripto', 'Monotributista', 'Exento', 'Consumidor Final'].map(o => (
                    <option key={o} value={o} style={{ background: '#0d0d1e' }}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 9, color: c.muted, textTransform: 'uppercase', display: 'block', marginBottom: 3 }}>Categoría</label>
                <select value={clientCategory} onChange={e => setClientCategory(e.target.value)} style={inp({ color: '#f1f5f9' })}>
                  {['NUEVO', 'BRONCE', 'PLATA', 'ORO'].map(o => <option key={o} value={o} style={{ background: '#0d0d1e' }}>{o}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Ítems */}
          <div style={{ padding: 16, borderRadius: 13, background: c.panel, border: `1px solid ${c.border}` }}>
            {/* Buscador */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <ProductSearch onAdd={addItem} cotizacion={cotizacion} globalMargin={globalMargin} />
              <button onClick={addEmptyItem} style={{
                padding: '8px 12px', borderRadius: 8, border: `1px solid ${c.border}`,
                background: 'transparent', color: c.sub, cursor: 'pointer', fontSize: 11, flexShrink: 0,
              }}>+ Fila</button>
            </div>

            {/* Tabla */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${c.border2}` }}>
                    {[
                      { h: '#', w: 28 }, { h: 'Descripción', w: null }, { h: 'Talle', w: 68 },
                      { h: 'Cant', w: 55 }, { h: 'U$S', w: 82 }, { h: '$ Costo', w: 105 },
                      { h: 'Margen', w: 70 }, { h: '$ Venta', w: 110 }, { h: 'Desc%', w: 58 },
                      { h: 'Subtotal', w: 120 }, { h: '', w: 24 },
                    ].map(col => (
                      <th key={col.h} style={{ padding: '6px', width: col.w, textAlign: col.h === 'Descripción' ? 'left' : 'right', fontSize: 9, color: c.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{col.h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <ItemRow key={item._key} item={item} idx={idx} cotizacion={cotizacion}
                      onChange={updated => updateItem(idx, updated)}
                      onDelete={() => deleteItem(idx)} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Costos extras */}
          <div style={{ padding: 16, borderRadius: 13, background: c.panel, border: `1px solid ${c.border}` }}>
            <div style={{ fontSize: 10, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Costos adicionales <span style={{ color: c.sub, fontStyle: 'italic', textTransform: 'none', marginLeft: 6 }}>(afectan la rentabilidad real, no aparecen en el presupuesto)</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
              {[
                { key: 'transporte', label: 'Flete / Transporte', prefix: '$' },
                { key: 'diseno', label: 'Diseño / Bordado', prefix: '$' },
                { key: 'iibb_pct', label: 'IIBB %', prefix: '%' },
                { key: 'otros', label: 'Otros costos', prefix: '$' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 9, color: c.muted, textTransform: 'uppercase', display: 'block', marginBottom: 3 }}>
                    {f.label}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 12, color: c.muted, flexShrink: 0 }}>{f.prefix}</span>
                    <input type="number" value={extras[f.key]} onChange={e => setExtras(p => ({ ...p, [f.key]: e.target.value }))}
                      style={inpNum({ color: '#f1f5f9', padding: '6px 8px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' })} />
                  </div>
                  {f.key === 'iibb_pct' && extras.iibb_pct > 0 && (
                    <div style={{ fontSize: 9, color: c.amber, marginTop: 2 }}>= {fmtARS(costoIIBB)}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notas */}
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            placeholder="Notas internas..."
            style={{ ...inp({ color: '#f1f5f9', fontSize: 12, resize: 'vertical' }) }} />
        </div>

        {/* ── SIDEBAR ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Fechas */}
          <div style={{ padding: 14, borderRadius: 12, background: c.panel, border: `1px solid ${c.border}` }}>
            {[
              { label: 'Fecha', type: 'date', val: date, set: setDate },
              { label: 'Vencimiento', type: 'date', val: expiresAt, set: setExpiresAt },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 9, color: c.muted, textTransform: 'uppercase', display: 'block', marginBottom: 3 }}>{f.label}</label>
                <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)}
                  style={inp({ color: '#f1f5f9' })} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 5 }}>
              {[3, 5, 7, 10].map(d => (
                <button key={d} onClick={() => setExpiresAt(addDays(date, d))} style={{
                  flex: 1, padding: '5px 0', borderRadius: 6, border: `1px solid ${c.border}`,
                  background: 'transparent', color: c.sub, cursor: 'pointer', fontSize: 10,
                  transition: 'all .15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = c.orange; e.currentTarget.style.color = c.orange }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.sub }}>
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {/* Dólar LP + Margen */}
          <div style={{ padding: 14, borderRadius: 12, background: c.orangeDim, border: `1px solid rgba(232,134,10,0.25)`, borderTop: `1px solid rgba(232,134,10,0.5)` }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label style={{ fontSize: 9, color: c.orange, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
                  Dólar LP
                </label>
                <span style={{ fontSize: 9, color: c.muted }}>× precio USD = costo ARS</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14, color: c.muted, flexShrink: 0 }}>$</span>
                <input type="number" value={cotizacion}
                  onChange={e => recalcAllWithRate(e.target.value)}
                  style={inpNum({ fontSize: 16, fontWeight: 900, color: c.orange, padding: '7px 10px', background: 'rgba(232,134,10,0.08)', border: `1px solid rgba(232,134,10,0.3)` })} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label style={{ fontSize: 9, color: c.muted, textTransform: 'uppercase' }}>Margen global</label>
                <button onClick={applyGlobalMargin} style={{
                  fontSize: 9, padding: '2px 8px', borderRadius: 5,
                  border: `1px solid ${c.orange}40`, background: c.orangeDim,
                  color: c.orange, cursor: 'pointer',
                }}>Aplicar</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="number" value={globalMargin} onChange={e => setGlobalMargin(e.target.value)}
                  style={inpNum({ fontSize: 15, fontWeight: 900, color: '#f1f5f9', padding: '7px 10px' })} />
                <span style={{ color: c.muted, fontWeight: 700, flexShrink: 0 }}>%</span>
              </div>
            </div>
          </div>

          {/* Condiciones pago */}
          <div style={{ padding: 12, borderRadius: 12, background: c.panel, border: `1px solid ${c.border}` }}>
            <label style={{ fontSize: 9, color: c.muted, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Condiciones de pago</label>
            <select value={paymentConditions} onChange={e => setPaymentConditions(e.target.value)}
              style={inp({ color: '#f1f5f9', fontSize: 12 })}>
              {['ANTICIPADO', 'CONTADO', '30 DÍAS', '60 DÍAS', '30/60 DÍAS', 'E-CHEQUE', 'CHEQUE', 'NEGOCIABLE'].map(o => (
                <option key={o} value={o} style={{ background: '#0d0d1e' }}>{o}</option>
              ))}
            </select>
          </div>

          {/* Totales + Rentabilidad */}
          <div style={{
            padding: 16, borderRadius: 13,
            background: `linear-gradient(160deg, rgba(232,134,10,0.07), rgba(232,134,10,0.03))`,
            border: `1px solid rgba(232,134,10,0.2)`,
            borderTop: `1px solid rgba(232,134,10,0.45)`,
          }}>
            {/* Desglose costos */}
            {costoTotal > 0 && (
              <div style={{ marginBottom: 14, padding: '10px', borderRadius: 9, background: 'rgba(0,0,0,0.2)' }}>
                <div style={{ fontSize: 9, color: c.muted, textTransform: 'uppercase', marginBottom: 8 }}>Desglose de costos</div>
                {[
                  { label: 'Productos', value: costoProductos, color: c.sub },
                  ...(costoExtras > 0 ? [{ label: 'Extras', value: costoExtras, color: c.sub }] : []),
                  ...(costoIIBB > 0 ? [{ label: `IIBB ${extras.iibb_pct}%`, value: costoIIBB, color: c.amber }] : []),
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: c.muted }}>{row.label}</span>
                    <span style={{ fontSize: 10, color: row.color, fontFamily: 'var(--font-mono, monospace)' }}>{fmtARS(row.value)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Neto / IVA / Total */}
            {[
              { label: 'NETO GRAVADO', value: neto, color: '#f1f5f9', size: 13 },
              { label: 'IVA 21%', value: ivaAmount, color: c.sub, size: 11 },
              { label: 'TOTAL', value: total, color: c.orange, size: 20 },
            ].map((row, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                marginBottom: i < 2 ? 7 : 0, paddingTop: i === 2 ? 10 : 0,
                borderTop: i === 2 ? `1px solid rgba(232,134,10,0.2)` : 'none',
              }}>
                <span style={{ fontSize: 9, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.1em', fontStyle: 'italic', fontWeight: 700 }}>{row.label}</span>
                <span style={{ fontSize: row.size, fontWeight: 900, color: row.color, fontFamily: 'var(--font-mono, monospace)' }}>{fmtARS(row.value)}</span>
              </div>
            ))}

            {/* Rentabilidad real */}
            {neto > 0 && (
              <div style={{ marginTop: 12, padding: '10px', borderRadius: 9, background: 'rgba(0,0,0,0.25)', textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: c.muted, textTransform: 'uppercase', marginBottom: 4 }}>Ganancia real</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: gananciaBruta >= 0 ? c.lime : c.rose, fontFamily: 'var(--font-mono, monospace)' }}>
                  {fmtARS(gananciaBruta)}
                </div>
                <div style={{ fontSize: 10, color: gananciaBruta >= 0 ? c.lime : c.rose, marginTop: 2 }}>
                  {rentabilidad}% rentabilidad
                </div>
              </div>
            )}

            <button onClick={() => setShowPrint(true)} style={{
              width: '100%', marginTop: 14, padding: '11px', borderRadius: 10, border: 'none',
              background: `linear-gradient(135deg,${c.orangeLight},${c.orange})`,
              color: '#000', fontWeight: 800, fontSize: 13, cursor: 'pointer',
              boxShadow: `0 0 20px rgba(232,134,10,0.3)`,
            }}>🖨️ Generar PDF</button>
          </div>
        </div>
      </div>

      {showPrint && <PrintView quote={quoteData} items={items} extras={extras} onClose={() => setShowPrint(false)} />}
    </div>
  )
}
