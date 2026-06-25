export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { action } = req.query

  // ── JWT para Google Auth ──────────────────────────────────────────────────
  async function getGoogleToken() {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
    const privateKey  = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')

    if (!clientEmail || !privateKey) throw new Error('Google credentials not configured')

    const now   = Math.floor(Date.now() / 1000)
    const claim = {
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    }

    // Build JWT manually (no external libs needed)
    const header  = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
    const payload = Buffer.from(JSON.stringify(claim)).toString('base64url')
    const sigInput = `${header}.${payload}`

    const { createSign } = await import('crypto')
    const sign = createSign('RSA-SHA256')
    sign.update(sigInput)
    const signature = sign.sign(privateKey, 'base64url')

    const jwt = `${sigInput}.${signature}`

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth2:jwt-bearer',
        assertion: jwt,
      }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) throw new Error(`Auth failed: ${JSON.stringify(tokenData)}`)
    return tokenData.access_token
  }

  try {
    // ── ACTION: list files ────────────────────────────────────────────────────
    if (action === 'list' || req.method === 'GET') {
      const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || '1YL4NanwGhsZceTgv2pYXtuFcMwBXrDuh'
      const token = await getGoogleToken()

      // List all PDFs recursively in the folder
      const q = encodeURIComponent(
        `'${folderId}' in parents and mimeType='application/pdf' and trashed=false`
      )
      const listRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,size,modifiedTime,parents)&pageSize=100&orderBy=modifiedTime desc`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const listData = await listRes.json()
      return res.status(200).json({ files: listData.files || [] })
    }

    // ── ACTION: read file as base64 ───────────────────────────────────────────
    if (action === 'read' && req.method === 'POST') {
      const { fileId } = req.body
      if (!fileId) return res.status(400).json({ error: 'fileId required' })

      const token = await getGoogleToken()
      const fileRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!fileRes.ok) return res.status(fileRes.status).json({ error: 'File not found' })

      const buffer = await fileRes.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      return res.status(200).json({ base64, size: buffer.byteLength })
    }

    return res.status(400).json({ error: 'Invalid action' })

  } catch (err) {
    console.error('Drive API error:', err)
    return res.status(500).json({ error: err.message })
  }
}
