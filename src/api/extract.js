export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { base64, mediaType, supplierName, category } = req.body

    if (!base64 || !mediaType) {
      return res.status(400).json({ error: 'base64 y mediaType requeridos' })
    }

    const system = `Sos un experto en extracción de datos de listas de precios de productos de seguridad industrial y EPP (Equipos de Protección Personal) para Argentina.

Tu tarea es analizar el documento y extraer TODOS los productos encontrados.

Respondé ÚNICAMENTE con un JSON válido con este formato exacto (sin markdown, sin backticks, sin explicaciones):
{
  "productos": [
    {
      "name": "nombre completo del producto",
      "brand": "marca si se menciona",
      "code": "código o SKU si existe",
      "category": "categoría del producto",
      "price_usd": null,
      "price_ars": null,
      "unit": "unidad de medida (unidad, par, caja, etc)",
      "description": "descripción adicional si hay"
    }
  ]
}

REGLAS:
- Si el precio está en USD, ponelo en price_usd y dejá price_ars en null
- Si el precio está en ARS/pesos, ponelo en price_ars y dejá price_usd en null
- Si no hay precio visible, dejá ambos en null
- Extraé TODOS los productos que encuentres
- Si el nombre incluye variantes (tallas, colores), creá una entrada por variante
- category debe ser una de: indumentaria, calzado, guantes, proteccion-cabeza, proteccion-auditiva, proteccion-visual, proteccion-respiratoria, arnes-anticaidas, señalizacion, herramientas, contra-incendio, construccion, otro`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.VITE_ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        system,
        messages: [{
          role: 'user',
          content: [
            {
              type: mediaType === 'application/pdf' ? 'document' : 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: 'text',
              text: `Extraé todos los productos de esta lista de precios${supplierName ? ` del proveedor ${supplierName}` : ''}${category ? `. Categoría principal: ${category}` : ''}. Respondé SOLO con el JSON.`,
            },
          ],
        }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return res.status(response.status).json({ error: err })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || ''

    // Parse JSON — strip any markdown if present
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    let parsed
    try {
      parsed = JSON.parse(clean)
    } catch(e) {
      return res.status(422).json({
        error: 'No se pudo parsear la respuesta de IA',
        raw: text,
      })
    }

    return res.status(200).json(parsed)

  } catch (err) {
    console.error('Extract proxy error:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
