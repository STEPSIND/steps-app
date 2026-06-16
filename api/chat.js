export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  // DEBUG: GET request shows what keys are available
  if (req.method === 'GET') {
    const key = process.env.ANTHROPIC_KEY || process.env.VITE_ANTHROPIC_KEY
    return res.status(200).json({
      has_anthropic_key: !!process.env.ANTHROPIC_KEY,
      has_vite_key: !!process.env.VITE_ANTHROPIC_KEY,
      key_preview: key ? `${key.slice(0,12)}...${key.slice(-4)}` : 'NO KEY FOUND',
      all_env_keys: Object.keys(process.env).filter(k => k.includes('ANTHROP') || k.includes('API')),
    })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { messages, system, max_tokens = 1000, model = 'claude-sonnet-4-6' } = req.body

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array requerido' })
    }

    const apiKey = process.env.ANTHROPIC_KEY || process.env.VITE_ANTHROPIC_KEY

    if (!apiKey) {
      return res.status(500).json({ error: 'API key no configurada en Vercel' })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens,
        ...(system ? { system } : {}),
        messages,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return res.status(response.status).json({ error: err })
    }

    const data = await response.json()
    return res.status(200).json(data)

  } catch (err) {
    console.error('Stepi proxy error:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
