import { useState, useRef } from 'react'

const w = {
  orange: '#FF7A00',
  orangeLight: 'rgba(255,122,0,0.10)',
  border: 'rgba(0,0,0,0.07)',
  text: '#1a1a2e',
  muted: '#6b7280',
  sub: '#9ca3af',
  lime: '#84cc16',
  rose: '#f43f5e',
  cyan: '#06b6d4',
}

async function extractInvoiceData(base64PDF) {
  const prompt = `Analizá esta factura argentina y extraé los datos. Respondé SOLO con JSON válido, sin texto adicional, sin markdown, sin backticks.

El JSON debe tener exactamente esta estructura:
{
  "tipo": "A",
  "number": 156,
  "punto_venta": "00002",
  "date": "2026-06-05",
  "cae": "86238478856261",
  "cae_vto": "2026-06-15",
  "client_name": "PAMPETROL S.A.P.E.M.",
  "client_cuit": "30709824585",
  "client_iva": "Responsable Inscripto",
  "client_address": "Av J D Peron 4888 - Toay, La Pampa",
  "payment_condition": "Contado",
  "neto": 921029.27,
  "iva_21": 193416.15,
  "iva_105": 0,
  "otros_tributos": 0,
  "total": 1114445.42,
  "items": [
    {
      "code": "001",
      "description": "MAMELUCO IGNIFUGO NQN 7,7 OZ C/ REFLECTIVOS - AZUL OSC. - T: L - FW",
      "quantity": 2,
      "unit": "unidades",
      "unit_price": 131575.61,
      "discount_pct": 0,
      "iva_pct": 21,
      "subtotal": 263151.22,
      "subtotal_with_iva": 318412.98
    }
  ],
  "invoice_type": "emitida"
}

Reglas:
- tipo: solo "A", "B" o "C"
- date, cae_vto: formato YYYY-MM-DD
- todos los montos como números sin símbolo $
- si un dato no aparece, usá null o 0 según corresponda
- invoice_type: "emitida" si es factura propia de STEPS, "recibida" si es de un proveedor`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: 'application/pdf',
                data: base64PDF,
              }
            },
            { text: prompt }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2000,
        }
      })
    }
  )

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message || `Error ${res.status}`)
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  // Strip any accidental markdown fences
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

export function PdfExtractor({ onExtracted, type = 'factura' }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState('')
  const inputRef = useRef()

  const processFile = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      setError('El archivo debe ser un PDF')
      return
    }
    setLoading(true)
    setError('')
    setSuccess(false)
    setFileName(file.name)
    try {
      const base64 = await new Promise((res, rej) => {
        const reader = new FileReader()
        reader.onload = () => res(reader.result.split(',')[1])
        reader.onerror = () => rej(new Error('Error leyendo el archivo'))
        reader.readAsDataURL(file)
      })
      const extracted = await extractInvoiceData(base64)
      setSuccess(true)
      onExtracted(extracted)
    } catch (e) {
      console.error(e)
      setError(`Error al procesar: ${e.message}`)
    }
    setLoading(false)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    processFile(e.dataTransfer.files?.[0])
  }

  const onFile = (e) => processFile(e.target.files?.[0])

  return (
    <div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes scanLine {
          0%   { top: 0%; opacity: 0.8; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes successPop {
          0%   { transform: scale(0.8); opacity: 0; }
          60%  { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div
        onClick={() => !loading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        style={{
          borderRadius: 16,
          border: `2px dashed ${dragOver ? w.orange : loading ? w.cyan : success ? w.lime : 'rgba(255,122,0,0.3)'}`,
          background: dragOver ? w.orangeLight : loading ? 'rgba(6,182,212,0.05)' : success ? 'rgba(132,204,22,0.06)' : 'rgba(255,122,0,0.04)',
          padding: '32px 24px',
          cursor: loading ? 'wait' : 'pointer',
          transition: 'all 0.3s ease',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>

        {loading && (
          <div style={{
            position: 'absolute', left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, transparent, ${w.cyan}, transparent)`,
            animation: 'scanLine 1.4s ease-in-out infinite',
            boxShadow: `0 0 12px ${w.cyan}`,
          }}/>
        )}

        {loading ? (
          <div>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', margin: '0 auto 14px',
              border: `3px solid rgba(6,182,212,0.2)`,
              borderTop: `3px solid ${w.cyan}`,
              animation: 'spin 0.8s linear infinite',
            }}/>
            <div style={{ fontSize: 14, fontWeight: 700, color: w.cyan }}>Analizando con IA...</div>
            <div style={{ fontSize: 12, color: w.muted, marginTop: 4 }}>Extrayendo datos de {fileName}</div>
          </div>
        ) : success ? (
          <div style={{ animation: 'successPop 0.4s ease' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: w.lime }}>Datos extraídos correctamente</div>
            <div style={{ fontSize: 12, color: w.muted, marginTop: 4 }}>
              {fileName} · Revisá los datos en las otras pestañas
            </div>
            <button onClick={e => { e.stopPropagation(); setSuccess(false); setFileName('') }}
              style={{ marginTop: 12, fontSize: 11, color: w.muted, background: 'transparent',
                border: `1px solid ${w.border}`, borderRadius: 8,
                padding: '5px 14px', cursor: 'pointer' }}>
              Cargar otro PDF
            </button>
          </div>
        ) : (
          <div>
            <svg width="52" height="52" viewBox="0 0 52 52" style={{ margin: '0 auto 14px', display: 'block' }}>
              <defs>
                <linearGradient id="pdfGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF7A00"/>
                  <stop offset="100%" stopColor="#ff9f40"/>
                </linearGradient>
              </defs>
              <rect x="6" y="2" width="32" height="42" rx="5" fill="rgba(255,122,0,0.12)" stroke="#FF7A00" strokeWidth="1.5"/>
              <path d="M32 2 L38 8 L32 8 Z" fill="rgba(255,122,0,0.35)" stroke="#FF7A00" strokeWidth="1"/>
              <text x="22" y="32" textAnchor="middle" fill="#FF7A00" fontSize="10" fontWeight="800">PDF</text>
              <circle cx="42" cy="42" r="9" fill="url(#pdfGrad)"/>
              <path d="M42 37 L42 47 M38 41 L42 37 L46 41" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div style={{ fontSize: 14, fontWeight: 700, color: w.text }}>
              Arrastrá el PDF o hacé clic para subir
            </div>
            <div style={{ fontSize: 12, color: w.muted, marginTop: 6 }}>
              Gemini IA extrae automáticamente todos los datos de la {type}
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              {['Tipo A/B/C','Cliente','CUIT','Items','Totales','CAE'].map(tag => (
                <span key={tag} style={{
                  fontSize: 10, padding: '3px 9px', borderRadius: 12,
                  background: w.orangeLight, color: w.orange,
                  border: `1px solid rgba(255,122,0,0.2)`, fontWeight: 600,
                }}>✓ {tag}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <input ref={inputRef} type="file" accept=".pdf" onChange={onFile} style={{ display: 'none' }} />

      {error && (
        <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10,
          background: 'rgba(244,63,94,0.08)', border: `1px solid rgba(244,63,94,0.3)`,
          fontSize: 12, color: w.rose }}>
          ⚠ {error}
        </div>
      )}
    </div>
  )
}
