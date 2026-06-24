import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'

// ── THEME ─────────────────────────────────────────────────────────────────────
const T = {
  bg:     'linear-gradient(160deg,#050510 0%,#080818 50%,#050510 100%)',
  text:   '#F0EFFF', muted: '#8884A8', sub: '#4A4870',
  border: 'rgba(255,255,255,0.07)',
  orange: '#E8860A', orangeL: '#F5A623',
  lime:   '#22C55E', rose: '#F43F5E',
  blue:   '#3B82F6', violet: '#8B5CF6',
  amber:  '#F59E0B', cyan:   '#06B6D4',
}

// ── SECTORES Y CATEGORÍAS ─────────────────────────────────────────────────────
const SECTORES = [
  {
    id: 'abastecimiento', name: 'STEPS ABASTECIMIENTO', icon: '🏭', color: '#E8860A',
    categorias: [
      'Ropa de trabajo','EPP','Calzado de seguridad','Detectores de gas',
      'Señalización y tránsito','Guantes','Contra incendios','Trabajo en alturas',
      'Equipamiento vehicular','Cargas e izaje','Orden y Limpieza',
      'Herramientas','Materiales de construcción',
    ],
  },
  {
    id: 'obras', name: 'STEPS OBRAS & PROYECTOS', icon: '🏗️', color: '#22c55e',
    categorias: [
      'Abastecimiento a proyectos','Productos Innovadores',
      'Flipping House & Business','Smart Home','Smart Office',
    ],
  },
  {
    id: 'tecnologia', name: 'STEPS APPS & TECNOLOGÍA', icon: '⚡', color: '#8b5cf6',
    categorias: [
      'App STEPS','Apps y sitio web','IA para empresas','Productos inteligentes',
    ],
  },
]

// ── DESCUENTOS POR CATEGORÍA ──────────────────────────────────────────────────
const DESCUENTOS_DEFAULT = {
  'EPP':                         { avanzado: 8,  lider: 15 },
  'Ropa de trabajo':             { avanzado: 10, lider: 20 },
  'Calzado de seguridad':        { avanzado: 8,  lider: 16 },
  'Detectores de gas':           { avanzado: 5,  lider: 12 },
  'Señalización y tránsito':     { avanzado: 10, lider: 18 },
  'Guantes':                     { avanzado: 10, lider: 20 },
  'Contra incendios':            { avanzado: 6,  lider: 12 },
  'Trabajo en alturas':          { avanzado: 7,  lider: 14 },
  'Equipamiento vehicular':      { avanzado: 8,  lider: 15 },
  'Cargas e izaje':              { avanzado: 6,  lider: 12 },
  'Orden y Limpieza':            { avanzado: 12, lider: 22 },
  'Herramientas':                { avanzado: 8,  lider: 16 },
  'Materiales de construcción':  { avanzado: 10, lider: 18 },
  'default':                     { avanzado: 8,  lider: 15 },
}

const getDesc = (cat) => DESCUENTOS_DEFAULT[cat] || DESCUENTOS_DEFAULT['default']

const calcPrecios = (salePrice, cat) => {
  const base = +salePrice || 0
  const d = getDesc(cat)
  return {
    base,
    avanzado: Math.round(base * (1 - d.avanzado / 100)),
    lider:    Math.round(base * (1 - d.lider    / 100)),
  }
}

const fmtARS = n => n ? `$${Math.round(+n).toLocaleString('es-AR')}` : '—'
const fmtUSD = (n, rate) => (n && rate) ? `U$S ${(+n / rate).toFixed(2)}` : null

// ── PDF GENERATOR ─────────────────────────────────────────────────────────────
function generatePDF(lista, moneda, dolarRate, nombreLista) {
  const rows = lista.flatMap(sec =>
    sec.categorias.flatMap(cat =>
      cat.productos.map(p => ({
        sector: sec.name,
        sectorColor: sec.color,
        cat: cat.name,
        ...p,
      }))
    )
  ).filter(r => r.selected)

  if (!rows.length) return alert('Seleccioná al menos un producto')

  const fmt = (n) => moneda === 'USD' && dolarRate
    ? `U$S ${(+n / dolarRate).toFixed(2)}`
    : `$${Math.round(+n).toLocaleString('es-AR')}`

  // Group by sector → category
  const grouped = {}
  rows.forEach(r => {
    if (!grouped[r.sector]) grouped[r.sector] = { color: r.sectorColor, cats: {} }
    if (!grouped[r.sector].cats[r.cat]) grouped[r.sector].cats[r.cat] = []
    grouped[r.sector].cats[r.cat].push(r)
  })

  const date = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })

  let rowsHtml = ''
  let idx = 1

  Object.entries(grouped).forEach(([secName, secData]) => {
    rowsHtml += `
      <tr class="sector-row">
        <td colspan="7" style="background:${secData.color}18;color:${secData.color};font-weight:900;font-size:11px;padding:8px 12px;letter-spacing:0.1em;text-transform:uppercase;border-bottom:2px solid ${secData.color}44;">
          ${secName}
        </td>
      </tr>`

    Object.entries(secData.cats).forEach(([catName, prods]) => {
      rowsHtml += `
        <tr class="cat-row">
          <td colspan="7" style="background:rgba(0,0,0,0.1);color:#888;font-size:9px;padding:5px 12px 5px 24px;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;border-bottom:1px solid #1a1a2e;">
            — ${catName}
          </td>
        </tr>`

      prods.forEach(p => {
        const precios = calcPrecios(p.sale_price, catName)
        const cantMin = p.cant_min || p.min_order || 1
        const cantMay = p.cant_may || '—'
        rowsHtml += `
          <tr class="prod-row" style="border-bottom:1px solid #12122a;">
            <td style="padding:7px 8px 7px 24px;color:#888;font-size:9px;font-family:'Space Mono',monospace;">${String(idx++).padStart(3,'0')}</td>
            <td style="padding:7px 8px;color:#888;font-size:9px;font-family:'Space Mono',monospace;">${p.code||'—'}</td>
            <td style="padding:7px 8px;color:#e8f4f8;font-size:10px;font-weight:600;max-width:220px;">${p.name}</td>
            <td style="padding:7px 8px;color:#888;font-size:9px;text-align:center;">${cantMin}</td>
            <td style="padding:7px 8px;color:#E8860A;font-size:10px;font-weight:700;text-align:right;font-family:'Space Mono',monospace;">${fmt(precios.base)}</td>
            <td style="padding:7px 8px;color:#F59E0B;font-size:10px;font-weight:700;text-align:right;font-family:'Space Mono',monospace;">${fmt(precios.avanzado)}</td>
            <td style="padding:7px 8px;color:#FFD700;font-size:10px;font-weight:700;text-align:right;font-family:'Space Mono',monospace;">${fmt(precios.lider)}</td>
          </tr>`
      })
    })
  })

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;900&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; background: #06060f; color: #e8f4f8; font-size: 11px; }
  .page { width: 210mm; min-height: 297mm; padding: 12mm 14mm; background: #06060f; }

  /* HEADER */
  .header { display:flex; align-items:stretch; border:1px solid rgba(232,134,10,0.4); margin-bottom:0; background:rgba(0,0,0,0.5); }
  .header-logo { padding:14px 18px; border-right:1px solid rgba(232,134,10,0.3); display:flex; flex-direction:column; justify-content:center; min-width:160px; }
  .logo-name { font-size:26px; font-weight:900; color:#E8860A; letter-spacing:-1px; font-family:'Syne',sans-serif; text-shadow:0 0 20px rgba(232,134,10,0.5); }
  .logo-sub { font-size:7px; color:rgba(232,134,10,0.5); text-transform:uppercase; letter-spacing:3px; margin-top:3px; }
  .header-badge { padding:10px 16px; border-right:1px solid rgba(232,134,10,0.3); display:flex; flex-direction:column; align-items:center; justify-content:center; min-width:70px; }
  .badge-letter { font-size:32px; font-weight:900; color:rgba(255,255,255,0.15); font-family:'Syne',sans-serif; line-height:1; }
  .badge-sub { font-size:6px; text-align:center; color:rgba(232,134,10,0.4); margin-top:3px; line-height:1.4; letter-spacing:1px; }
  .header-title { flex:1; padding:14px 20px; display:flex; flex-direction:column; justify-content:center; }
  .doc-type { font-size:22px; font-weight:900; color:#e8f4f8; letter-spacing:1px; font-family:'Syne',sans-serif; }
  .doc-name { font-size:13px; color:rgba(232,134,10,0.7); margin-top:4px; font-weight:600; }
  .header-right { padding:14px 18px; display:flex; flex-direction:column; justify-content:center; align-items:flex-end; gap:4px; }
  .header-date { font-size:10px; color:rgba(232,134,10,0.6); font-family:'Space Mono',monospace; }
  .header-moneda { font-size:9px; color:rgba(255,255,255,0.3); }

  /* NIVELES INFO */
  .niveles-bar { display:flex; gap:0; margin-bottom:0; border:1px solid rgba(232,134,10,0.2); border-top:none; }
  .nivel-box { flex:1; padding:8px 12px; text-align:center; border-right:1px solid rgba(232,134,10,0.15); }
  .nivel-box:last-child { border-right:none; }
  .nivel-name { font-size:9px; font-weight:900; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:3px; font-family:'Space Mono',monospace; }
  .nivel-range { font-size:8px; color:rgba(255,255,255,0.35); }
  .nivel-desc { font-size:8px; color:rgba(255,255,255,0.25); margin-top:2px; }

  /* TABLE */
  .products-table { width:100%; border-collapse:collapse; border:1px solid rgba(232,134,10,0.15); margin-bottom:0; }
  .table-head { background:rgba(232,134,10,0.1); }
  .table-head th { padding:7px 8px; font-size:8px; font-weight:700; color:rgba(232,134,10,0.7); text-transform:uppercase; letter-spacing:0.1em; text-align:left; border-bottom:1px solid rgba(232,134,10,0.2); }
  .table-head th.right { text-align:right; }
  .table-head th.center { text-align:center; }
  .prod-row:hover { background:rgba(255,255,255,0.02); }

  /* FOOTER */
  .footer { border:1px solid rgba(232,134,10,0.15); border-top:none; padding:8px 14px; display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.3); }
  .footer-note { font-size:8px; color:rgba(255,255,255,0.2); line-height:1.5; }
  .footer-contact { display:flex; gap:14px; align-items:center; }
  .footer-item { font-size:8px; color:rgba(232,134,10,0.5); }
  .walksafe { font-size:10px; font-weight:900; color:rgba(232,134,10,0.3); letter-spacing:-0.5px; }

  /* CORNER DECORATIONS */
  .corner-tl, .corner-tr, .corner-bl, .corner-br { position:fixed; width:20px; height:20px; }
  .corner-tl { top:10mm; left:12mm; border-top:2px solid rgba(232,134,10,0.4); border-left:2px solid rgba(232,134,10,0.4); }
  .corner-tr { top:10mm; right:12mm; border-top:2px solid rgba(232,134,10,0.4); border-right:2px solid rgba(232,134,10,0.4); }
  .corner-bl { bottom:10mm; left:12mm; border-bottom:2px solid rgba(232,134,10,0.4); border-left:2px solid rgba(232,134,10,0.4); }
  .corner-br { bottom:10mm; right:12mm; border-bottom:2px solid rgba(232,134,10,0.4); border-right:2px solid rgba(232,134,10,0.4); }

  @media print {
    body { -webkit-print-color-adjust:exact; print-color-adjust:exact; background:#06060f; }
    .page { padding:8mm 10mm; }
    .corner-tl, .corner-tr, .corner-bl, .corner-br { display:none; }
  }
</style>
</head>
<body>
<div class="corner-tl"></div>
<div class="corner-tr"></div>
<div class="corner-bl"></div>
<div class="corner-br"></div>

<div class="page">
  <!-- HEADER -->
  <div class="header">
    <div class="header-logo">
      <div class="logo-name">≡ STEPS</div>
      <div class="logo-sub">Seguridad · Construcción · Tecnología</div>
    </div>
    <div class="header-badge">
      <div class="badge-letter">LP</div>
      <div class="badge-sub">Lista de<br>Precios</div>
    </div>
    <div class="header-title">
      <div class="doc-type">LISTA DE PRECIOS</div>
      <div class="doc-name">${nombreLista || 'Catálogo General STEPS'}</div>
    </div>
    <div class="header-right">
      <div class="header-date">${date}</div>
      <div class="header-moneda">Precios en ${moneda === 'USD' ? 'Dólares (USD)' : 'Pesos Argentinos (ARS)'}</div>
    </div>
  </div>

  <!-- NIVELES BAR -->
  <div class="niveles-bar">
    <div class="nivel-box" style="background:rgba(0,245,255,0.04);">
      <div class="nivel-name" style="color:#E8860A;">NIVEL BASE</div>
      <div class="nivel-range">Compras hasta USD 800</div>
      <div class="nivel-desc">Precio de lista estándar</div>
    </div>
    <div class="nivel-box" style="background:rgba(255,107,0,0.05);">
      <div class="nivel-name" style="color:#F59E0B;">NIVEL AVANZADO</div>
      <div class="nivel-range">Compras USD 800 – 2.000</div>
      <div class="nivel-desc">Descuento por volumen</div>
    </div>
    <div class="nivel-box" style="background:rgba(255,215,0,0.05);">
      <div class="nivel-name" style="color:#FFD700;">NIVEL LÍDER</div>
      <div class="nivel-range">Compras +USD 4.000</div>
      <div class="nivel-desc">Mejor precio disponible</div>
    </div>
  </div>

  <!-- TABLA -->
  <table class="products-table">
    <thead class="table-head">
      <tr>
        <th style="width:32px">#</th>
        <th style="width:60px">Código</th>
        <th>Descripción</th>
        <th class="center" style="width:50px">C. Mín.</th>
        <th class="right" style="width:90px;color:#E8860A;">▸ BASE</th>
        <th class="right" style="width:90px;color:#F59E0B;">▸ AVANZADO</th>
        <th class="right" style="width:90px;color:#FFD700;">▸ LÍDER</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-note">
      Precios expresados en ${moneda === 'USD' ? 'dólares americanos' : 'pesos argentinos'} · Sujetos a cambio sin previo aviso<br>
      Los precios no incluyen IVA · Validez: 5 días hábiles · Condición de pago a convenir
    </div>
    <div class="footer-contact">
      <span class="footer-item">📞 2993295575</span>
      <span class="footer-item">✉ GESTIONSTEPS@GMAIL.COM</span>
      <span class="footer-item">🌐 STEPSINDUSTRIAL.COM</span>
    </div>
    <div class="walksafe">walk safe.</div>
  </div>
</div>
</body>
</html>`

  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  setTimeout(() => win.print(), 800)
}

// ── PRODUCT SELECTOR ROW ──────────────────────────────────────────────────────
function ProductRow({ product, catName, dolarRate, moneda, onToggle, onQtyChange }) {
  const [hov, setHov] = useState(false)
  const precios = calcPrecios(product.sale_price, catName)
  const fmt = n => moneda === 'USD' && dolarRate ? fmtUSD(n, dolarRate) : fmtARS(n)

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr 80px 100px 100px 100px 80px',
        gap: 8, alignItems: 'center',
        padding: '8px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        background: product.selected
          ? 'rgba(232,134,10,0.06)'
          : hov ? 'rgba(255,255,255,0.03)' : 'transparent',
        transition: 'background 0.15s',
        cursor: 'pointer',
      }}
      onClick={() => onToggle(product.id)}
    >
      {/* Checkbox */}
      <div style={{
        width: 18, height: 18, borderRadius: 4,
        border: `1.5px solid ${product.selected ? T.orange : 'rgba(255,255,255,0.15)'}`,
        background: product.selected ? T.orange : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, transition: 'all 0.15s',
      }}>
        {product.selected && <span style={{ fontSize: 10, color: '#000', fontWeight: 900 }}>✓</span>}
      </div>

      {/* Name + code */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: product.selected ? T.text : 'rgba(240,239,255,0.7)', lineHeight: 1.3 }}>
          {product.name}
        </div>
        {product.code && (
          <div style={{ fontSize: 9, color: T.muted, fontFamily: "'Space Mono',monospace", marginTop: 1 }}>
            #{product.code}
          </div>
        )}
      </div>

      {/* Cant min */}
      <div onClick={e => e.stopPropagation()}>
        <input
          type="number" min="1"
          value={product.cant_min || product.min_order || 1}
          onChange={e => onQtyChange(product.id, 'cant_min', e.target.value)}
          style={{
            width: '100%', padding: '4px 6px', borderRadius: 6, fontSize: 11,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)', color: T.text,
            outline: 'none', textAlign: 'center',
            fontFamily: "'Space Mono',monospace",
          }}
        />
      </div>

      {/* 3 precios */}
      <div style={{ textAlign: 'right', fontSize: 11, fontWeight: 700, color: T.orange, fontFamily: "'Space Mono',monospace" }}>
        {fmt(precios.base)}
      </div>
      <div style={{ textAlign: 'right', fontSize: 11, fontWeight: 700, color: T.amber, fontFamily: "'Space Mono',monospace" }}>
        {fmt(precios.avanzado)}
      </div>
      <div style={{ textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#FFD700', fontFamily: "'Space Mono',monospace" }}>
        {fmt(precios.lider)}
      </div>

      {/* Marca */}
      <div style={{ fontSize: 9, color: T.muted, textAlign: 'right' }}>
        {product.brand || '—'}
      </div>
    </div>
  )
}

// ── CATEGORY SECTION ──────────────────────────────────────────────────────────
function CategorySection({ catName, sectorColor, products, allProducts, dolarRate, moneda, onToggle, onQtyChange, onAddProduct }) {
  const [expanded, setExpanded] = useState(false)
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const selectedCount = products.filter(p => p.selected).length

  const available = allProducts.filter(p =>
    (p.category === catName || !p.category) &&
    !products.find(ep => ep.id === p.id) &&
    (search === '' || p.name?.toLowerCase().includes(search.toLowerCase()) || p.code?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div style={{
      marginBottom: 8,
      border: `1px solid ${expanded ? sectorColor + '33' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 12, overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      {/* Category header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', cursor: 'pointer',
          background: expanded ? `${sectorColor}0a` : 'rgba(255,255,255,0.03)',
          transition: 'background 0.2s',
        }}
      >
        <div style={{
          width: 20, height: 20, borderRadius: 6,
          background: selectedCount > 0 ? `${sectorColor}25` : 'rgba(255,255,255,0.06)',
          border: `1px solid ${selectedCount > 0 ? sectorColor + '55' : 'rgba(255,255,255,0.1)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: 900, color: sectorColor,
          flexShrink: 0,
        }}>
          {selectedCount || ''}
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: expanded ? sectorColor : T.muted, flex: 1, transition: 'color 0.2s' }}>
          {catName}
        </span>
        <span style={{ fontSize: 9, color: T.sub }}>
          {products.length} producto{products.length !== 1 ? 's' : ''}
        </span>
        <span style={{
          fontSize: 10, color: T.sub,
          transform: expanded ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.2s',
        }}>▼</span>
      </div>

      {/* Products */}
      {expanded && (
        <div>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '32px 1fr 80px 100px 100px 100px 80px',
            gap: 8, padding: '6px 12px',
            background: 'rgba(0,0,0,0.2)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            {['', 'Producto', 'C.Mín', 'BASE', 'AVANZADO', 'LÍDER', 'Marca'].map((h, i) => (
              <div key={i} style={{
                fontSize: 8, fontWeight: 700, color: T.sub,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                textAlign: i > 2 ? 'right' : 'left',
              }}>{h}</div>
            ))}
          </div>

          {/* Product rows */}
          {products.length === 0 ? (
            <div style={{ padding: '16px 12px', textAlign: 'center', color: T.sub, fontSize: 11, fontStyle: 'italic' }}>
              Sin productos — agregá desde el buscador
            </div>
          ) : (
            products.map(p => (
              <ProductRow
                key={p.id}
                product={p}
                catName={catName}
                dolarRate={dolarRate}
                moneda={moneda}
                onToggle={onToggle}
                onQtyChange={onQtyChange}
              />
            ))
          )}

          {/* Add product dropdown */}
          <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.04)', position: 'relative' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setShowDropdown(true) }}
                onFocus={() => setShowDropdown(true)}
                placeholder={`Buscar producto para agregar a ${catName}...`}
                style={{
                  flex: 1, padding: '7px 12px', borderRadius: 8, fontSize: 11,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.04)', color: T.text, outline: 'none',
                }}
              />
            </div>

            {showDropdown && search && available.length > 0 && (
              <div style={{
                position: 'absolute', left: 12, right: 12, zIndex: 50,
                background: 'rgba(8,8,24,0.98)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, overflow: 'hidden', maxHeight: 200, overflowY: 'auto',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              }}>
                {available.slice(0, 8).map(p => (
                  <div
                    key={p.id}
                    onMouseDown={() => { onAddProduct(catName, p); setSearch(''); setShowDropdown(false) }}
                    style={{
                      padding: '8px 12px', cursor: 'pointer', fontSize: 11,
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: T.text }}>{p.name}</div>
                      <div style={{ fontSize: 9, color: T.muted }}>{p.code && `#${p.code}`} {p.brand && `· ${p.brand}`}</div>
                    </div>
                    <div style={{ fontSize: 11, color: T.orange, fontFamily: "'Space Mono',monospace" }}>
                      {fmtARS(p.sale_price)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── SECTOR SECTION ────────────────────────────────────────────────────────────
function SectorSection({ sector, lista, allProducts, dolarRate, moneda, onToggle, onQtyChange, onAddProduct }) {
  const [expanded, setExpanded] = useState(false)
  const sectorData = lista.find(s => s.id === sector.id) || { categorias: [] }
  const totalSelected = sectorData.categorias.reduce((s, c) => s + c.productos.filter(p => p.selected).length, 0)

  return (
    <div style={{
      marginBottom: 16,
      border: `1px solid ${expanded ? sector.color + '44' : sector.color + '18'}`,
      borderRadius: 16, overflow: 'hidden',
      background: expanded ? `${sector.color}06` : 'rgba(255,255,255,0.02)',
      transition: 'all 0.3s ease',
    }}>
      {/* Sector header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 18px', cursor: 'pointer',
          borderBottom: expanded ? `1px solid ${sector.color}22` : 'none',
        }}
      >
        <div style={{
          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
          background: `linear-gradient(135deg, ${sector.color}30, ${sector.color}12)`,
          border: `1.5px solid ${sector.color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
          boxShadow: `0 4px 16px ${sector.color}20`,
        }}>
          {sector.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: expanded ? sector.color : T.text, transition: 'color 0.2s', fontFamily: "'Syne',sans-serif" }}>
            {sector.name}
          </div>
          <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
            {sector.categorias.length} categorías
            {totalSelected > 0 && <span style={{ color: sector.color, marginLeft: 8, fontWeight: 700 }}>· {totalSelected} productos seleccionados</span>}
          </div>
        </div>
        <div style={{
          fontSize: 10, color: sector.color, opacity: 0.6,
          transform: expanded ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.25s ease',
        }}>▼</div>
      </div>

      {/* Categories */}
      {expanded && (
        <div style={{ padding: '12px 14px' }}>
          {sectorData.categorias.map(cat => (
            <CategorySection
              key={cat.name}
              catName={cat.name}
              sectorColor={sector.color}
              products={cat.productos}
              allProducts={allProducts}
              dolarRate={dolarRate}
              moneda={moneda}
              onToggle={onToggle}
              onQtyChange={onQtyChange}
              onAddProduct={onAddProduct}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function ListaPrecios() {
  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [dolarRate, setDolarRate] = useState(0)
  const [moneda, setMoneda] = useState('ARS')
  const [nombreLista, setNombreLista] = useState('')
  const [lista, setLista] = useState([])

  // Load products and dolar
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase.from('products').select('*').order('name')
      setAllProducts(data || [])

      // Init lista from sectors + categories
      const initialLista = SECTORES.map(sector => ({
        ...sector,
        categorias: sector.categorias.map(catName => {
          const catProducts = (data || [])
            .filter(p => p.category === catName)
            .map(p => ({ ...p, selected: false, cant_min: p.min_order || 1, cant_may: '' }))
          return { name: catName, productos: catProducts }
        }),
      }))
      setLista(initialLista)
      setLoading(false)
    }
    load()

    fetch('https://dolarapi.com/v1/dolares/blue')
      .then(r => r.json())
      .then(d => setDolarRate(d?.venta || 0))
      .catch(() => {})
  }, [])

  const toggleProduct = (productId) => {
    setLista(prev => prev.map(sec => ({
      ...sec,
      categorias: sec.categorias.map(cat => ({
        ...cat,
        productos: cat.productos.map(p =>
          p.id === productId ? { ...p, selected: !p.selected } : p
        ),
      })),
    })))
  }

  const changeQty = (productId, field, value) => {
    setLista(prev => prev.map(sec => ({
      ...sec,
      categorias: sec.categorias.map(cat => ({
        ...cat,
        productos: cat.productos.map(p =>
          p.id === productId ? { ...p, [field]: value } : p
        ),
      })),
    })))
  }

  const addProduct = (catName, product) => {
    setLista(prev => prev.map(sec => ({
      ...sec,
      categorias: sec.categorias.map(cat => {
        if (cat.name !== catName) return cat
        // Avoid duplicates
        if (cat.productos.find(p => p.id === product.id)) return cat
        return {
          ...cat,
          productos: [...cat.productos, { ...product, selected: true, cant_min: product.min_order || 1, cant_may: '' }],
        }
      }),
    })))
  }

  const selectAll = () => {
    setLista(prev => prev.map(sec => ({
      ...sec,
      categorias: sec.categorias.map(cat => ({
        ...cat,
        productos: cat.productos.map(p => ({ ...p, selected: true })),
      })),
    })))
  }

  const deselectAll = () => {
    setLista(prev => prev.map(sec => ({
      ...sec,
      categorias: sec.categorias.map(cat => ({
        ...cat,
        productos: cat.productos.map(p => ({ ...p, selected: false })),
      })),
    })))
  }

  const totalSelected = lista.reduce((s, sec) =>
    s + sec.categorias.reduce((s2, cat) =>
      s2 + cat.productos.filter(p => p.selected).length, 0), 0)

  const totalProducts = lista.reduce((s, sec) =>
    s + sec.categorias.reduce((s2, cat) => s2 + cat.productos.length, 0), 0)

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.muted }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.4 }}>📋</div>
        <div style={{ fontSize: 13 }}>Cargando catálogo de productos...</div>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: "'Nunito Sans', system-ui, sans-serif", color: T.text, padding: '0 4px' }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        input[type=number]::-webkit-inner-spin-button{opacity:0}
        input[type=number]:hover::-webkit-inner-spin-button{opacity:0.5}
      `}</style>

      {/* ── HEADER ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 24, gap: 16, flexWrap: 'wrap',
      }}>
        <div>
          <h1 style={{
            margin: 0, fontSize: 24, fontWeight: 900,
            fontFamily: "'Syne', sans-serif",
            background: `linear-gradient(135deg, ${T.orange}, ${T.orangeL})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Lista de Precios
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted, fontStyle: 'italic' }}>
            Armá tu lista, seleccioná productos y generá el PDF con marca STEPS
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Moneda toggle */}
          <div style={{
            display: 'flex', gap: 0, border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, overflow: 'hidden',
          }}>
            {['ARS', 'USD'].map(m => (
              <button key={m} onClick={() => setMoneda(m)}
                style={{
                  padding: '8px 16px', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                  fontFamily: "'Space Mono', monospace",
                  background: moneda === m
                    ? `linear-gradient(135deg, ${T.orange}, ${T.orangeL})`
                    : 'rgba(255,255,255,0.04)',
                  color: moneda === m ? '#000' : T.muted,
                  transition: 'all 0.15s',
                }}>
                {m}
              </button>
            ))}
          </div>

          {/* Select all / deselect */}
          <button onClick={selectAll}
            style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: T.muted, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
            Seleccionar todo
          </button>
          <button onClick={deselectAll}
            style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: T.muted, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
            Limpiar
          </button>

          {/* PDF button */}
          <button
            onClick={() => generatePDF(lista, moneda, dolarRate, nombreLista)}
            disabled={totalSelected === 0}
            style={{
              padding: '10px 22px', borderRadius: 12, border: 'none',
              background: totalSelected > 0
                ? `linear-gradient(135deg, ${T.orangeL}, ${T.orange})`
                : 'rgba(255,255,255,0.06)',
              color: totalSelected > 0 ? '#000' : T.sub,
              cursor: totalSelected > 0 ? 'pointer' : 'not-allowed',
              fontSize: 13, fontWeight: 800,
              boxShadow: totalSelected > 0 ? `0 4px 20px rgba(232,134,10,0.4)` : 'none',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (totalSelected > 0) e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            🖨️ Generar PDF {totalSelected > 0 ? `(${totalSelected})` : ''}
          </button>
        </div>
      </div>

      {/* ── NOMBRE DE LISTA + STATS ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, marginBottom: 20,
        padding: '14px 16px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderTop: '1px solid rgba(255,255,255,0.13)',
        borderRadius: 14, backdropFilter: 'blur(20px)',
      }}>
        <div>
          <div style={{ fontSize: 9, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, fontWeight: 700 }}>
            Nombre de la lista (aparece en el PDF)
          </div>
          <input
            value={nombreLista}
            onChange={e => setNombreLista(e.target.value)}
            placeholder="Ej: Lista de Precios Junio 2026 · Oil & Gas"
            style={{
              width: '100%', padding: '9px 12px', borderRadius: 10, boxSizing: 'border-box',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)', color: T.text, fontSize: 13, outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {[
            { l: 'Total catálogo', v: totalProducts, c: T.muted },
            { l: 'Seleccionados', v: totalSelected, c: T.orange },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '4px 16px', borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.c, fontFamily: "'Space Mono', monospace", lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: 9, color: T.sub, marginTop: 3, fontWeight: 600 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── NIVELES INFO BAR ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20,
      }}>
        {[
          { l: 'NIVEL BASE', d: 'Hasta USD 800', c: T.orange, sub: 'Precio de lista', pct: '' },
          { l: 'NIVEL AVANZADO', d: 'USD 800 – 2.000', c: T.amber, sub: 'Descuento por volumen', pct: '8–12% off' },
          { l: 'NIVEL LÍDER', d: '+USD 4.000', c: '#FFD700', sub: 'Mejor precio disponible', pct: '15–22% off' },
        ].map((n, i) => (
          <div key={i} style={{
            padding: '10px 14px', borderRadius: 12,
            background: `${n.c}08`,
            border: `1px solid ${n.c}22`,
            borderLeft: `3px solid ${n.c}`,
          }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: n.c, letterSpacing: '0.06em', marginBottom: 3 }}>{n.l}</div>
            <div style={{ fontSize: 11, color: T.text, fontWeight: 600 }}>{n.d}</div>
            <div style={{ fontSize: 9, color: T.muted, marginTop: 2 }}>{n.sub}</div>
            {n.pct && <div style={{ fontSize: 9, color: n.c, marginTop: 2, fontWeight: 700 }}>{n.pct}</div>}
          </div>
        ))}
      </div>

      {/* ── SECTOR SECTIONS ── */}
      {SECTORES.map(sector => (
        <div key={sector.id} style={{ animation: 'fadeUp 0.4s ease both' }}>
          <SectorSection
            sector={sector}
            lista={lista}
            allProducts={allProducts}
            dolarRate={dolarRate}
            moneda={moneda}
            onToggle={toggleProduct}
            onQtyChange={changeQty}
            onAddProduct={addProduct}
          />
        </div>
      ))}

      {/* Empty state */}
      {totalProducts === 0 && !loading && (
        <div style={{
          textAlign: 'center', padding: '60px 24px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16,
        }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.muted }}>Sin productos cargados</div>
          <div style={{ fontSize: 12, color: T.sub, marginTop: 6 }}>
            Cargá productos en ERP → Productos para que aparezcan acá
          </div>
        </div>
      )}
    </div>
  )
}
