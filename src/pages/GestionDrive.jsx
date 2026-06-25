import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const T = {
  bg:     'linear-gradient(160deg,#050510 0%,#080818 50%,#050510 100%)',
  text:   '#F0EFFF', muted: '#8884A8', sub: '#4A4870',
  border: 'rgba(255,255,255,0.07)',
  orange: '#E8860A', orangeL: '#F5A623',
  lime:   '#22C55E', rose:    '#F43F5E',
  blue:   '#3B82F6', violet:  '#8B5CF6',
  amber:  '#F59E0B', cyan:    '#06B6D4',
  green:  '#10B981',
}

// ── TIPO DE DOCUMENTO ─────────────────────────────────────────────────────────
const DOC_TYPES = {
  factura:         { label: 'Factura',           icon: '🧾', color: T.orange,  table: 'invoices'  },
  presupuesto:     { label: 'Presupuesto',        icon: '📋', color: T.blue,    table: 'quotes'    },
  remito:          { label: 'Remito',             icon: '📦', color: T.violet,  table: 'remitos'   },
  recibo_pago:     { label: 'Recibo de pago',     icon: '💰', color: T.lime,    table: null        },
  orden_compra:    { label: 'Orden de compra',    icon: '🛒', color: T.amber,   table: 'purchases' },
  otro:            { label: 'Otro documento',     icon: '📄', color: T.muted,   table: null        },
}

const fmtSize = bytes => {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024*1024) return `${(bytes/1024).toFixed(0)} KB`
  return `${(bytes/1024/1024).toFixed(1)} MB`
}

const fmtDate = d => d ? new Date(d).toLocaleDateString('es-AR', { day:'2-digit', month:'short', year:'numeric' }) : '—'

// ── EXTRACT WITH AI ───────────────────────────────────────────────────────────
async function extractDocument(base64, fileName) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: `Sos un experto en documentos comerciales argentinos de la empresa STEPS (seguridad industrial, Catriel, Neuquén).
Analizás PDFs y extraés información estructurada.
Respondés SOLO con JSON válido, sin markdown ni explicaciones.`,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64 },
          },
          {
            type: 'text',
            text: `Analizá este documento comercial llamado "${fileName}" y extraé la información.
Respondé SOLO con este JSON:
{
  "tipo": "factura|presupuesto|remito|recibo_pago|orden_compra|otro",
  "numero": "número del documento o null",
  "fecha": "YYYY-MM-DD o null",
  "proveedor_cliente": "nombre de empresa/persona o null",
  "cuit": "número de CUIT o null",
  "monto_total": número o null,
  "moneda": "ARS|USD|null",
  "descripcion": "resumen en una línea de qué es el documento",
  "es_de_proveedor": true si es documento que nos llega de proveedor/transporte, false si es documento que emitimos nosotros
}`,
          },
        ],
      }],
    }),
  })
  const data = await res.json()
  const text = data.content?.[0]?.text || '{}'
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    return { tipo: 'otro', descripcion: 'No se pudo procesar', error: true }
  }
}

// ── FILE CARD ─────────────────────────────────────────────────────────────────
function FileCard({ file, onProcess, processing, processed, result }) {
  const [expanded, setExpanded] = useState(false)
  const dt = result ? DOC_TYPES[result.tipo] || DOC_TYPES.otro : null

  return (
    <div style={{
      borderRadius: 14,
      border: `1px solid ${processed ? (dt?.color || T.border) + '44' : T.border}`,
      borderLeft: `3px solid ${processed ? dt?.color || T.muted : processing ? T.amber : T.border}`,
      background: processed ? `${dt?.color || T.muted}06` : 'rgba(255,255,255,0.03)',
      overflow: 'hidden',
      transition: 'all 0.2s',
    }}>
      {/* Header row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 14px', cursor: 'pointer',
      }}
        onClick={() => processed && setExpanded(e => !e)}
      >
        {/* Icon */}
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: processed ? `${dt?.color}20` : 'rgba(255,255,255,0.06)',
          border: `1px solid ${processed ? dt?.color + '44' : T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>
          {processing ? '⏳' : processed ? dt?.icon || '📄' : '📄'}
        </div>

        {/* File info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 12, fontWeight: 600, color: T.text,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            marginBottom: 3,
          }}>
            {file.name}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {processed && (
              <span style={{
                fontSize: 9, padding: '2px 8px', borderRadius: 8,
                background: `${dt?.color}18`, color: dt?.color,
                fontWeight: 700, border: `1px solid ${dt?.color}30`,
              }}>
                {dt?.icon} {dt?.label}
              </span>
            )}
            {result?.proveedor_cliente && (
              <span style={{ fontSize: 10, color: T.muted }}>{result.proveedor_cliente}</span>
            )}
            {result?.monto_total && (
              <span style={{ fontSize: 10, fontWeight: 700, color: T.lime, fontFamily: "'Space Mono',monospace" }}>
                {result.moneda === 'USD' ? `U$S ${result.monto_total}` : `$${result.monto_total?.toLocaleString('es-AR')}`}
              </span>
            )}
            <span style={{ fontSize: 9, color: T.sub }}>{fmtSize(file.size)} · {fmtDate(file.modifiedTime)}</span>
          </div>
        </div>

        {/* Action button */}
        {!processed && !processing && (
          <button
            onClick={e => { e.stopPropagation(); onProcess(file) }}
            style={{
              padding: '7px 14px', borderRadius: 10, border: 'none',
              background: `linear-gradient(135deg, ${T.orangeL}, ${T.orange})`,
              color: '#000', cursor: 'pointer', fontSize: 11, fontWeight: 700,
              flexShrink: 0,
              boxShadow: `0 4px 16px rgba(232,134,10,0.3)`,
            }}>
            Procesar
          </button>
        )}
        {processing && (
          <div style={{ fontSize: 11, color: T.amber, fontWeight: 600, flexShrink: 0 }}>
            Analizando...
          </div>
        )}
        {processed && (
          <div style={{
            fontSize: 9, color: T.lime, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
          }}>
            <span style={{ fontSize: 14 }}>✓</span> Procesado
          </div>
        )}
      </div>

      {/* Expanded result */}
      {expanded && result && (
        <div style={{
          padding: '10px 14px 14px', borderTop: `1px solid ${T.border}`,
          background: 'rgba(0,0,0,0.2)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {[
              { l: 'Número', v: result.numero },
              { l: 'Fecha', v: result.fecha },
              { l: 'CUIT', v: result.cuit },
              { l: 'Empresa', v: result.proveedor_cliente },
              { l: 'Monto', v: result.monto_total ? `${result.moneda === 'USD' ? 'U$S' : '$'} ${result.monto_total?.toLocaleString('es-AR')}` : null },
              { l: 'Tipo', v: result.es_de_proveedor ? 'De proveedor/externo' : 'Emitido por STEPS' },
            ].filter(f => f.v).map((f, i) => (
              <div key={i} style={{
                padding: '8px 10px', borderRadius: 8,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}>
                <div style={{ fontSize: 8, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{f.l}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{f.v}</div>
              </div>
            ))}
          </div>
          {result.descripcion && (
            <div style={{ marginTop: 8, fontSize: 11, color: T.muted, fontStyle: 'italic' }}>
              {result.descripcion}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function GestionDrive() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [processing, setProcessing] = useState({}) // fileId → true
  const [results, setResults] = useState({})       // fileId → extracted data
  const [saved, setSaved] = useState({})           // fileId → true
  const [filterType, setFilterType] = useState('all')
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({ total: 0, procesados: 0, facturas: 0, presupuestos: 0 })
  const [error, setError] = useState(null)

  // Load saved results from Supabase
  useEffect(() => {
    loadSavedDocs()
  }, [])

  const loadSavedDocs = async () => {
    const { data } = await supabase.from('drive_documents').select('*').order('created_at', { ascending: false })
    if (data) {
      const resMap = {}
      const savedMap = {}
      data.forEach(d => {
        resMap[d.drive_file_id]  = d.extracted_data
        savedMap[d.drive_file_id] = true
      })
      setResults(resMap)
      setSaved(savedMap)
    }
  }

  const syncDrive = async () => {
    setSyncing(true)
    setError(null)
    try {
      const res = await fetch('/api/drive?action=list')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setFiles(data.files || [])

      // Update stats
      const processed = Object.keys(results).length
      setStats({
        total: data.files?.length || 0,
        procesados: processed,
        facturas: Object.values(results).filter(r => r.tipo === 'factura').length,
        presupuestos: Object.values(results).filter(r => r.tipo === 'presupuesto').length,
      })
    } catch (e) {
      setError(e.message)
    }
    setSyncing(false)
  }

  const processFile = async (file) => {
    if (processing[file.id]) return
    setProcessing(p => ({ ...p, [file.id]: true }))

    try {
      // 1 — Read file from Drive
      const readRes = await fetch('/api/drive?action=read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: file.id }),
      })
      const readData = await readRes.json()
      if (readData.error) throw new Error(readData.error)

      // 2 — Extract with AI
      const extracted = await extractDocument(readData.base64, file.name)

      // 3 — Save to Supabase
      await supabase.from('drive_documents').upsert({
        drive_file_id: file.id,
        file_name: file.name,
        file_size: file.size,
        modified_time: file.modifiedTime,
        extracted_data: extracted,
        doc_type: extracted.tipo,
        empresa: extracted.proveedor_cliente,
        monto: extracted.monto_total,
        moneda: extracted.moneda,
        fecha_doc: extracted.fecha,
        numero_doc: extracted.numero,
        es_de_proveedor: extracted.es_de_proveedor,
        created_at: new Date(),
      }, { onConflict: 'drive_file_id' })

      setResults(r => ({ ...r, [file.id]: extracted }))
      setSaved(s => ({ ...s, [file.id]: true }))

      // Update stats
      setStats(prev => ({
        ...prev,
        procesados: prev.procesados + 1,
        facturas: extracted.tipo === 'factura' ? prev.facturas + 1 : prev.facturas,
        presupuestos: extracted.tipo === 'presupuesto' ? prev.presupuestos + 1 : prev.presupuestos,
      }))
    } catch (e) {
      console.error('Error processing file:', e)
    }
    setProcessing(p => ({ ...p, [file.id]: false }))
  }

  const processAll = async () => {
    const unprocessed = files.filter(f => !saved[f.id])
    for (const file of unprocessed) {
      await processFile(file)
    }
  }

  // Filter files
  const filtered = files.filter(f => {
    const r = results[f.id]
    if (filterType !== 'all' && r?.tipo !== filterType) return false
    if (search && !f.name.toLowerCase().includes(search.toLowerCase()) &&
        !r?.proveedor_cliente?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const unprocessedCount = files.filter(f => !saved[f.id]).length

  return (
    <div style={{ fontFamily: "'Nunito Sans', system-ui, sans-serif", color: T.text, padding: '24px 28px', minHeight: '100vh', background: T.bg }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{
            margin: 0, fontSize: 24, fontWeight: 900, fontFamily: "'Syne', sans-serif",
            background: `linear-gradient(135deg, ${T.cyan}, ${T.blue})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Gestión Drive
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted, fontStyle: 'italic' }}>
            Sincronizá tu carpeta de Google Drive · La IA clasifica y extrae datos automáticamente
          </p>
        </div>

        {/* Sync button */}
        <button onClick={syncDrive} disabled={syncing}
          style={{
            padding: '11px 24px', borderRadius: 14, border: 'none',
            background: syncing ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg, ${T.cyan}, ${T.blue})`,
            color: syncing ? T.muted : '#000',
            cursor: syncing ? 'default' : 'pointer',
            fontSize: 13, fontWeight: 800,
            boxShadow: syncing ? 'none' : `0 4px 20px rgba(6,182,212,0.3)`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
          <span style={{ display: 'inline-block', animation: syncing ? 'spin 1s linear infinite' : 'none' }}>
            {syncing ? '⟳' : '☁'}
          </span>
          {syncing ? 'Sincronizando...' : 'Sincronizar Drive'}
        </button>
      </div>

      {/* ── ERROR ── */}
      {error && (
        <div style={{
          marginBottom: 16, padding: '12px 16px', borderRadius: 12,
          background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)',
          fontSize: 12, color: T.rose,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── KPI CARDS ── */}
      {files.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { l: 'Archivos en Drive', v: stats.total || files.length, c: T.cyan },
            { l: 'Procesados con IA', v: Object.keys(saved).length, c: T.lime },
            { l: 'Facturas detectadas', v: Object.values(results).filter(r=>r.tipo==='factura').length, c: T.orange },
            { l: 'Sin procesar', v: unprocessedCount, c: unprocessedCount > 0 ? T.amber : T.sub },
          ].map((k, i) => (
            <div key={i} style={{
              padding: '14px 16px', borderRadius: 14,
              background: `${k.c}08`, border: `1px solid ${k.c}22`,
              borderTop: `1px solid ${k.c}44`,
            }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: k.c, fontFamily: "'Space Mono',monospace", lineHeight: 1 }}>{k.v}</div>
              <div style={{ fontSize: 10, color: T.muted, marginTop: 5, fontWeight: 600 }}>{k.l}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── FILTERS + PROCESS ALL ── */}
      {files.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o empresa..."
            style={{
              flex: 1, minWidth: 200, padding: '9px 14px', borderRadius: 10, fontSize: 12,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)', color: T.text, outline: 'none',
            }}/>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[['all','Todos'], ...Object.entries(DOC_TYPES).map(([k,v]) => [k, v.label])].map(([key, label]) => (
              <button key={key} onClick={() => setFilterType(key)}
                style={{
                  padding: '7px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 10, fontWeight: filterType === key ? 700 : 400,
                  background: filterType === key ? `${T.cyan}20` : 'rgba(255,255,255,0.04)',
                  color: filterType === key ? T.cyan : T.muted,
                  outline: filterType === key ? `1px solid ${T.cyan}40` : '1px solid rgba(255,255,255,0.08)',
                  transition: 'all 0.15s',
                }}>
                {key !== 'all' && DOC_TYPES[key]?.icon + ' '}{label}
              </button>
            ))}
          </div>

          {unprocessedCount > 0 && (
            <button onClick={processAll}
              style={{
                padding: '9px 18px', borderRadius: 10, border: 'none',
                background: `rgba(232,134,10,0.12)`,
                color: T.orange, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                border: `1px solid rgba(232,134,10,0.3)`,
              }}>
              ⚡ Procesar todos ({unprocessedCount})
            </button>
          )}
        </div>
      )}

      {/* ── FILE LIST ── */}
      {files.length === 0 && !syncing ? (
        <div style={{
          textAlign: 'center', padding: '60px 24px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>☁️</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.muted, marginBottom: 8 }}>
            Drive no sincronizado
          </div>
          <div style={{ fontSize: 12, color: T.sub, marginBottom: 24 }}>
            Presioná "Sincronizar Drive" para cargar los archivos de tu carpeta STEPS
          </div>
          <button onClick={syncDrive}
            style={{
              padding: '12px 28px', borderRadius: 14, border: 'none',
              background: `linear-gradient(135deg, ${T.cyan}, ${T.blue})`,
              color: '#000', cursor: 'pointer', fontSize: 13, fontWeight: 800,
            }}>
            ☁ Sincronizar ahora
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((file, i) => (
            <div key={file.id} style={{ animation: `fadeUp 0.3s ${i * 0.03}s ease both`, opacity: 0, animationFillMode: 'both' }}>
              <FileCard
                file={file}
                onProcess={processFile}
                processing={processing[file.id]}
                processed={!!saved[file.id]}
                result={results[file.id]}
              />
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px', color: T.muted, fontSize: 12 }}>
              Sin archivos que coincidan con los filtros
            </div>
          )}
        </div>
      )}
    </div>
  )
}
