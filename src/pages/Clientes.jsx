import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../supabase'

const w = {
  bg: 'rgba(242,242,247,0.55)',
  card: 'rgba(255,255,255,0.72)',
  cardHover: 'rgba(255,255,255,0.88)',
  border: 'rgba(0,0,0,0.07)',
  borderHover: 'rgba(255,122,0,0.3)',
  text: '#1a1a2e',
  muted: '#6b7280',
  sub: '#9ca3af',
  orange: '#FF7A00',
  orangeLight: 'rgba(255,122,0,0.12)',
  orangeGlow: 'rgba(255,122,0,0.25)',
  amber: '#f59e0b',
  lime: '#84cc16',
  cyan: '#06b6d4',
  rose: '#f43f5e',
  violet: '#7c3aed',
  glass: 'rgba(255,255,255,0.82)',
  blur: 'blur(24px) saturate(180%)',
}

const INDUSTRIES = ['Oil & Gas','Construcción','Geotécnica','Transporte','Ingeniería','Minería','Agro','Energía','Manufactura','Otro']
const IVA_CONDITIONS = ['Responsable Inscripto','Monotributista','Exento','Consumidor Final']
const PAYMENT_CONDITIONS = ['ANTICIPADO','TRANSFERENCIA ENTREGA','CHEQUE','CUENTA CORRIENTE','30 DÍAS','60 DÍAS']
const VIAS = ['WhatsApp','Mail','Llamada','Referido','LinkedIn','Visita','Instagram','Otro']
const STATUSES = [
  { key: 'LEAD', label: 'Lead', color: w.cyan },
  { key: 'CONTACTAR', label: 'A contactar', color: w.amber },
  { key: 'EN_CONTACTO', label: 'En contacto', color: w.orange },
  { key: 'PROSPECTO', label: 'Prospecto', color: w.violet },
  { key: 'ACTIVO', label: 'Activo', color: w.lime },
  { key: 'INACTIVO', label: 'Inactivo', color: w.muted },
]
const CATEGORIES = [
  { key: 'BRONCE', label: 'Bronce', color: '#cd7f32', min: 0 },
  { key: 'PLATA', label: 'Plata', color: '#9ca3af', min: 1000000 },
  { key: 'ORO', label: 'Oro', color: '#f59e0b', min: 5000000 },
]

function getStatusMeta(key) { return STATUSES.find(s => s.key === key) || STATUSES[0] }
function getCategoryMeta(rev) {
  if (rev >= 5000000) return CATEGORIES[2]
  if (rev >= 1000000) return CATEGORIES[1]
  return CATEGORIES[0]
}
function getFavicon(website) {
  if (!website) return null
  try {
    const url = website.startsWith('http') ? website : `https://${website}`
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  } catch { return null }
}
function daysAgo(dateStr) {
  if (!dateStr) return null
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000)
  return diff
}
function fmtMoney(n) {
  if (!n) return '$0'
  if (n >= 1000000) return `$${(n/1000000).toFixed(1)}M`
  if (n >= 1000) return `$${(n/1000).toFixed(0)}k`
  return `$${n}`
}

const EMPTY_CLIENT = {
  status: 'LEAD', category: 'BRONCE', name: '', cuit: '', industry: '',
  iva_condition: 'Responsable Inscripto', website: '', logo_url: '',
  contact_name: '', contact_role: '', phone: '', phone_corporate: '', email: '',
  whatsapp: '', city: '', province: 'Neuquén', address: '',
  payment_condition: 'ANTICIPADO', discount_pct: 0, credit_days: 0, services: '',
  via: '', next_action: '', next_action_date: '', notes: '', tags: [],
}

// ── KPI CARD ──────────────────────────────────────────────────────────────────
function KpiCard({ value, label, color, sub }) {
  const [hov, setHov] = useState(false)
  const ref = useRef()
  const onMove = e => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const x = ((e.clientX - r.left) / r.width) * 100
    const y = ((e.clientY - r.top) / r.height) * 100
    ref.current.style.setProperty('--sx', `${x}%`)
    ref.current.style.setProperty('--sy', `${y}%`)
  }
  return (
    <div ref={ref} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onMouseMove={onMove}
      style={{
        flex: '1 1 0', minWidth: 100, padding: '14px 18px', borderRadius: 16,
        background: hov ? w.cardHover : w.card,
        backdropFilter: w.blur, WebkitBackdropFilter: w.blur,
        border: `1px solid ${hov ? color + '44' : w.border}`,
        boxShadow: hov ? `0 8px 32px ${color}22, inset 0 0 0 1px ${color}22` : '0 2px 12px rgba(0,0,0,0.06)',
        transition: 'all 0.3s cubic-bezier(0.34,1.4,0.64,1)',
        transform: hov ? 'translateY(-3px) scale(1.02)' : 'none',
        cursor: 'default', position: 'relative', overflow: 'hidden',
      }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 16, pointerEvents: 'none',
        background: `radial-gradient(circle 80px at var(--sx,50%) var(--sy,50%), ${color}18, transparent 70%)` }} />
      <div style={{ fontSize: 22, fontWeight: 800, color: color, fontFamily: "'Space Mono', monospace" }}>{value}</div>
      <div style={{ fontSize: 11, color: w.muted, marginTop: 3, fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: w.sub, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

// ── CLIENT CARD ───────────────────────────────────────────────────────────────
function ClientCard({ client, onClick }) {
  const [hov, setHov] = useState(false)
  const ref = useRef()
  const status = getStatusMeta(client.status)
  const cat = getCategoryMeta(client.total_revenue || 0)
  const favicon = getFavicon(client.website)
  const days = daysAgo(client.last_contact)
  const isInactive = days !== null && days > 60
  const onMove = e => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    ref.current.style.setProperty('--sx', `${((e.clientX - r.left) / r.width) * 100}%`)
    ref.current.style.setProperty('--sy', `${((e.clientY - r.top) / r.height) * 100}%`)
  }
  return (
    <div ref={ref} onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onMouseMove={onMove}
      style={{
        background: hov ? w.cardHover : w.card,
        backdropFilter: w.blur, WebkitBackdropFilter: w.blur,
        border: `1px solid ${hov ? w.borderHover : w.border}`,
        borderRadius: 18,
        boxShadow: hov ? `0 12px 40px rgba(255,122,0,0.12), inset 0 1px 0 rgba(255,255,255,0.9)` : '0 2px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
        padding: '18px 20px', cursor: 'pointer', position: 'relative', overflow: 'hidden',
        transform: hov ? 'translateY(-4px) scale(1.01)' : 'none',
        transition: 'all 0.3s cubic-bezier(0.34,1.4,0.64,1)',
      }}>
      {/* spotlight */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: 18, pointerEvents: 'none',
        background: `radial-gradient(circle 100px at var(--sx,50%) var(--sy,50%), rgba(255,122,0,0.1), transparent 70%)` }} />
      {/* top highlight */}
      <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
        background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.9),transparent)', borderRadius: 1 }} />

      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {/* Logo / Avatar */}
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: `linear-gradient(135deg, ${status.color}22, ${status.color}44)`,
          border: `1.5px solid ${status.color}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', fontSize: 18, fontWeight: 800, color: status.color,
          boxShadow: `0 4px 12px ${status.color}22`,
        }}>
          {favicon
            ? <img src={favicon} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }}
                onError={e => { e.target.style.display = 'none' }} />
            : client.name?.charAt(0)?.toUpperCase() || '?'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: w.text, fontFamily: "'Syne', sans-serif" }}>
              {client.name}
            </span>
            {/* Status badge */}
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
              background: status.color + '18', color: status.color,
              border: `1px solid ${status.color}33`, textTransform: 'uppercase', letterSpacing: '0.08em'
            }}>{status.label}</span>
            {/* Category */}
            <span style={{ fontSize: 9, fontWeight: 700, color: cat.color }}>
              {cat.key === 'ORO' ? '★' : cat.key === 'PLATA' ? '◆' : '●'} {cat.label}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
            {client.industry && <span style={{ fontSize: 11, color: w.muted }}>{client.industry}</span>}
            {client.city && <span style={{ fontSize: 11, color: w.sub }}>📍 {client.city}</span>}
            {client.cuit && <span style={{ fontSize: 11, color: w.sub, fontFamily: "'Space Mono', monospace" }}>{client.cuit}</span>}
          </div>

          {client.contact_name && (
            <div style={{ fontSize: 11, color: w.muted, marginTop: 3 }}>
              {client.contact_name}{client.contact_role ? ` · ${client.contact_role}` : ''}
            </div>
          )}
        </div>

        {/* Right side metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          {client.total_revenue > 0 && (
            <span style={{ fontSize: 13, fontWeight: 800, color: w.orange, fontFamily: "'Space Mono', monospace" }}>
              {fmtMoney(client.total_revenue)}
            </span>
          )}
          {client.total_quotes > 0 && (
            <span style={{ fontSize: 10, color: w.muted }}>{client.total_quotes} ppto{client.total_quotes !== 1 ? 's' : ''}</span>
          )}
          {days !== null && (
            <span style={{ fontSize: 10, color: isInactive ? w.rose : w.sub }}>
              {isInactive ? '⚠ ' : ''}{days === 0 ? 'Hoy' : days === 1 ? 'Ayer' : `${days}d`}
            </span>
          )}
          {client.whatsapp && (
            <a href={`https://wa.me/${client.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
              onClick={e => e.stopPropagation()}
              style={{ fontSize: 16, textDecoration: 'none', opacity: hov ? 1 : 0.4, transition: 'opacity 0.2s' }}>
              💬
            </a>
          )}
        </div>
      </div>

      {/* Category bar */}
      {client.total_revenue > 0 && (
        <div style={{ marginTop: 12, height: 3, borderRadius: 2, background: 'rgba(0,0,0,0.06)' }}>
          <div style={{
            height: '100%', borderRadius: 2,
            width: `${Math.min(100, (client.total_revenue / 5000000) * 100)}%`,
            background: `linear-gradient(90deg, ${cat.color}, ${w.orange})`,
            transition: 'width 0.6s ease',
          }} />
        </div>
      )}
    </div>
  )
}

// ── CLIENT ROW (table mode) ───────────────────────────────────────────────────
function ClientRow({ client, onClick }) {
  const [hov, setHov] = useState(false)
  const status = getStatusMeta(client.status)
  const cat = getCategoryMeta(client.total_revenue || 0)
  const favicon = getFavicon(client.website)
  const days = daysAgo(client.last_contact)
  return (
    <tr onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        cursor: 'pointer',
        background: hov ? 'rgba(255,122,0,0.04)' : 'transparent',
        transition: 'background 0.15s',
      }}>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: `linear-gradient(135deg, ${status.color}22, ${status.color}44)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 800, color: status.color, overflow: 'hidden',
          }}>
            {favicon
              ? <img src={favicon} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }}
                  onError={e => { e.target.style.display = 'none' }} />
              : client.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: w.text }}>{client.name}</div>
            {client.cuit && <div style={{ fontSize: 10, color: w.sub, fontFamily: "'Space Mono', monospace" }}>{client.cuit}</div>}
          </div>
        </div>
      </td>
      <td style={{ padding: '12px 8px' }}>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
          background: status.color + '18', color: status.color, border: `1px solid ${status.color}33`,
          textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap'
        }}>{status.label}</span>
      </td>
      <td style={{ padding: '12px 8px', fontSize: 12, color: w.muted }}>{client.industry || '—'}</td>
      <td style={{ padding: '12px 8px', fontSize: 12, color: w.muted }}>{client.contact_name || '—'}</td>
      <td style={{ padding: '12px 8px', fontSize: 12, color: w.sub }}>{client.city || '—'}</td>
      <td style={{ padding: '12px 8px', fontSize: 12, color: w.orange, fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>
        {client.total_revenue > 0 ? fmtMoney(client.total_revenue) : '—'}
      </td>
      <td style={{ padding: '12px 8px', fontSize: 11, color: days !== null && days > 60 ? w.rose : w.sub }}>
        {days !== null ? (days === 0 ? 'Hoy' : days === 1 ? 'Ayer' : `${days}d`) : '—'}
      </td>
      <td style={{ padding: '12px 8px' }}>
        <span style={{ fontSize: 11, color: cat.color, fontWeight: 700 }}>
          {cat.key === 'ORO' ? '★' : cat.key === 'PLATA' ? '◆' : '●'} {cat.label}
        </span>
      </td>
      <td style={{ padding: '12px 8px' }}>
        {client.whatsapp && (
          <a href={`https://wa.me/${client.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
            onClick={e => e.stopPropagation()} style={{ fontSize: 16, textDecoration: 'none' }}>💬</a>
        )}
      </td>
    </tr>
  )
}

// ── CONTACT ITEM ──────────────────────────────────────────────────────────────
function ContactItem({ contact, onRemove }) {
  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'center', padding: '10px 14px',
      borderRadius: 12, background: 'rgba(255,255,255,0.6)', border: `1px solid ${w.border}`,
      flexWrap: 'wrap',
    }}>
      <div style={{ flex: 1, minWidth: 120 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: w.text }}>{contact.name}</div>
        {contact.role && <div style={{ fontSize: 11, color: w.muted }}>{contact.role}</div>}
      </div>
      {contact.phone && <span style={{ fontSize: 11, color: w.muted }}>📞 {contact.phone}</span>}
      {contact.email && <span style={{ fontSize: 11, color: w.muted }}>✉ {contact.email}</span>}
      {contact.whatsapp && (
        <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
          style={{ fontSize: 14, textDecoration: 'none' }}>💬</a>
      )}
      {contact.is_primary && (
        <span style={{ fontSize: 9, fontWeight: 700, color: w.orange, background: w.orangeLight,
          padding: '2px 6px', borderRadius: 8 }}>PRINCIPAL</span>
      )}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer',
        color: w.rose, fontSize: 14, padding: '0 2px' }}>×</button>
    </div>
  )
}

// ── MODAL FORM ────────────────────────────────────────────────────────────────
function ClientModal({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial ? { ...initial } : { ...EMPTY_CLIENT })
  const [contacts, setContacts] = useState([])
  const [newContact, setNewContact] = useState({ name: '', role: '', phone: '', email: '', whatsapp: '', is_primary: false })
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('info')
  const isEdit = !!initial?.id

  useEffect(() => {
    if (isEdit) {
      supabase.from('client_contacts').select('*').eq('client_id', initial.id)
        .then(({ data }) => setContacts(data || []))
    }
  }, [isEdit, initial?.id])

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const addContact = () => {
    if (!newContact.name.trim()) return
    setContacts(c => [...c, { ...newContact, id: 'tmp_' + Date.now() }])
    setNewContact({ name: '', role: '', phone: '', email: '', whatsapp: '', is_primary: false })
  }

  const save = async () => {
    if (!form.name?.trim()) return
    setSaving(true)
    const { id, ...payload } = form
    payload.updated_at = new Date()
    if (!payload.discount_pct) payload.discount_pct = 0
    if (!payload.credit_days) payload.credit_days = 0
    if (!payload.total_revenue) payload.total_revenue = 0
    if (!payload.total_quotes) payload.total_quotes = 0
    if (!payload.total_purchases) payload.total_purchases = 0
    try {
      let clientId = initial?.id
      if (isEdit) {
        await supabase.from('clients').update(payload).eq('id', initial.id)
      } else {
        const { data } = await supabase.from('clients').insert(payload).select().single()
        clientId = data?.id
      }
      // save new contacts
      const newContacts = contacts.filter(c => String(c.id).startsWith('tmp_'))
      for (const c of newContacts) {
        const { id: _, ...cp } = c
        await supabase.from('client_contacts').insert({ ...cp, client_id: clientId })
      }
      await onSaved()
      onClose()
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  const inp = (key, placeholder, type = 'text', extra = {}) => (
    <input value={form[key] || ''} onChange={e => set(key, e.target.value)}
      type={type} placeholder={placeholder}
      style={{
        width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${w.border}`,
        background: 'rgba(255,255,255,0.7)', color: w.text, fontSize: 13,
        outline: 'none', boxSizing: 'border-box',
        ...extra
      }} />
  )

  const sel = (key, opts) => (
    <select value={form[key] || ''} onChange={e => set(key, e.target.value)}
      style={{
        width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${w.border}`,
        background: 'rgba(255,255,255,0.7)', color: w.text, fontSize: 13, outline: 'none',
      }}>
      {opts.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )

  const TABS = [
    { key: 'info', label: 'Datos' },
    { key: 'contacts', label: 'Contactos' },
    { key: 'commercial', label: 'Comercial' },
    { key: 'notes', label: 'Notas' },
  ]

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(32px)',
        border: `1px solid ${w.border}`, borderRadius: 24,
        boxShadow: '0 32px 80px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.9)',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: w.text, fontFamily: "'Syne', sans-serif" }}>
                {isEdit ? form.name : 'Nuevo cliente'}
              </h2>
              {isEdit && (
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  {STATUSES.map(s => (
                    <button key={s.key} onClick={() => set('status', s.key)}
                      style={{
                        fontSize: 10, padding: '3px 10px', borderRadius: 20, cursor: 'pointer',
                        border: `1px solid ${s.color}44`,
                        background: form.status === s.key ? s.color : s.color + '18',
                        color: form.status === s.key ? '#fff' : s.color,
                        fontWeight: 700, transition: 'all 0.2s',
                      }}>{s.label}</button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 22, color: w.muted, lineHeight: 1 }}>×</button>
          </div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${w.border}` }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{
                  padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: 'none', background: 'none', color: tab === t.key ? w.orange : w.muted,
                  borderBottom: `2px solid ${tab === t.key ? w.orange : 'transparent'}`,
                  transition: 'all 0.2s', marginBottom: -1,
                }}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {tab === 'info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {!isEdit && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  {STATUSES.map(s => (
                    <button key={s.key} onClick={() => set('status', s.key)}
                      style={{
                        fontSize: 11, padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
                        border: `1px solid ${s.color}44`,
                        background: form.status === s.key ? s.color : s.color + '18',
                        color: form.status === s.key ? '#fff' : s.color,
                        fontWeight: 700, transition: 'all 0.2s',
                      }}>{s.label}</button>
                  ))}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ gridColumn: '1/-1' }}>{inp('name', 'Nombre de la empresa *')}</div>
                {inp('cuit', 'CUIT')}
                {sel('iva_condition', IVA_CONDITIONS)}
                {sel('industry', ['', ...INDUSTRIES])}
                {inp('website', 'Sitio web (para logo automático)')}
                {inp('city', 'Ciudad')}
                {inp('province', 'Provincia')}
                <div style={{ gridColumn: '1/-1' }}>{inp('address', 'Dirección')}</div>
                {sel('via', ['', ...VIAS])}
                {inp('next_action_date', 'Próxima acción', 'date')}
                <div style={{ gridColumn: '1/-1' }}>{inp('next_action', 'Próxima acción (descripción)')}</div>
              </div>
            </div>
          )}

          {tab === 'contacts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {contacts.map((c, i) => (
                <ContactItem key={c.id} contact={c}
                  onRemove={() => setContacts(cs => cs.filter((_, j) => j !== i))} />
              ))}
              <div style={{ padding: '14px', borderRadius: 14, background: w.orangeLight,
                border: `1px dashed ${w.orange}44` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: w.orange, marginBottom: 10 }}>+ Agregar contacto</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {['name', 'role', 'phone', 'email', 'whatsapp'].map(k => (
                    <input key={k} value={newContact[k]} onChange={e => setNewContact(c => ({ ...c, [k]: e.target.value }))}
                      placeholder={k === 'name' ? 'Nombre *' : k === 'role' ? 'Cargo' : k === 'phone' ? 'Teléfono' : k === 'email' ? 'Email' : 'WhatsApp'}
                      style={{ padding: '9px 12px', borderRadius: 8, border: `1px solid ${w.border}`,
                        background: 'rgba(255,255,255,0.8)', color: w.text, fontSize: 12, outline: 'none' }} />
                  ))}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: w.muted, cursor: 'pointer' }}>
                    <input type="checkbox" checked={newContact.is_primary}
                      onChange={e => setNewContact(c => ({ ...c, is_primary: e.target.checked }))} />
                    Principal
                  </label>
                </div>
                <button onClick={addContact}
                  style={{ marginTop: 10, padding: '8px 18px', borderRadius: 10, border: 'none',
                    background: w.orange, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Agregar
                </button>
              </div>
            </div>
          )}

          {tab === 'commercial' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {sel('payment_condition', PAYMENT_CONDITIONS)}
              <input type="number" value={form.discount_pct || ''} onChange={e => set('discount_pct', e.target.value)}
                placeholder="Descuento %"
                style={{ padding: '10px 14px', borderRadius: 10, border: `1px solid ${w.border}`,
                  background: 'rgba(255,255,255,0.7)', color: w.text, fontSize: 13, outline: 'none' }} />
              <input type="number" value={form.credit_days || ''} onChange={e => set('credit_days', e.target.value)}
                placeholder="Días de crédito"
                style={{ padding: '10px 14px', borderRadius: 10, border: `1px solid ${w.border}`,
                  background: 'rgba(255,255,255,0.7)', color: w.text, fontSize: 13, outline: 'none' }} />
              <div style={{ gridColumn: '1/-1' }}>
                <textarea value={form.services || ''} onChange={e => set('services', e.target.value)}
                  placeholder="Servicios / productos de interés para este cliente..."
                  rows={4}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${w.border}`,
                    background: 'rgba(255,255,255,0.7)', color: w.text, fontSize: 13, outline: 'none',
                    resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
            </div>
          )}

          {tab === 'notes' && (
            <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)}
              placeholder="Notas internas sobre el cliente..."
              rows={10}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: `1px solid ${w.border}`,
                background: 'rgba(255,255,255,0.7)', color: w.text, fontSize: 13, outline: 'none',
                resize: 'vertical', boxSizing: 'border-box' }} />
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${w.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
          <button onClick={onClose}
            style={{ padding: '10px 20px', borderRadius: 12, border: `1px solid ${w.border}`,
              background: 'transparent', color: w.muted, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
            Cancelar
          </button>
          <button onClick={save} disabled={saving}
            style={{
              padding: '10px 24px', borderRadius: 12, border: 'none',
              background: `linear-gradient(135deg, ${w.orange}, #ff9f40)`,
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: `0 4px 16px ${w.orangeGlow}`, opacity: saving ? 0.7 : 1,
              transition: 'all 0.2s',
            }}>
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear cliente'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function Clientes() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('TODOS')
  const [filterIndustry, setFilterIndustry] = useState('TODAS')
  const [viewMode, setViewMode] = useState('cards')
  const [selected, setSelected] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('clients').select('*').order('updated_at', { ascending: false })
    setClients(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    return clients.filter(c => {
      const q = search.toLowerCase()
      const matchSearch = !q
        || c.name?.toLowerCase().includes(q)
        || c.cuit?.includes(q)
        || c.contact_name?.toLowerCase().includes(q)
        || c.city?.toLowerCase().includes(q)
        || c.industry?.toLowerCase().includes(q)
      const matchStatus = filterStatus === 'TODOS' || c.status === filterStatus
      const matchIndustry = filterIndustry === 'TODAS' || c.industry === filterIndustry
      return matchSearch && matchStatus && matchIndustry
    })
  }, [clients, search, filterStatus, filterIndustry])

  const kpis = useMemo(() => {
    const total = clients.length
    const activos = clients.filter(c => c.status === 'ACTIVO').length
    const leads = clients.filter(c => c.status === 'LEAD').length
    const inactivos = clients.filter(c => daysAgo(c.last_contact) > 60).length
    const revenue = clients.reduce((s, c) => s + (c.total_revenue || 0), 0)
    const sinContacto = clients.filter(c => !c.last_contact).length
    return { total, activos, leads, inactivos, revenue, sinContacto }
  }, [clients])

  const industries = useMemo(() => ['TODAS', ...new Set(clients.map(c => c.industry).filter(Boolean))], [clients])

  const btnStyle = (active) => ({
    padding: '8px 16px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer',
    border: `1px solid ${active ? w.orange + '44' : w.border}`,
    background: active ? w.orangeLight : 'rgba(255,255,255,0.6)',
    color: active ? w.orange : w.muted, transition: 'all 0.2s',
  })

  return (
    <div style={{ minHeight: '100vh', padding: '24px 28px', background: w.bg,
      backdropFilter: w.blur, fontFamily: "'Nunito Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, fontFamily: "'Syne', sans-serif",
            background: `linear-gradient(135deg, ${w.orange}, #ff9f40)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Órbita
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: w.muted, fontStyle: 'italic' }}>
            red de clientes y leads
          </p>
        </div>
        <button onClick={() => { setSelected(null); setShowModal(true) }}
          style={{
            padding: '11px 22px', borderRadius: 14, border: 'none',
            background: `linear-gradient(135deg, ${w.orange}, #ff9f40)`,
            color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            boxShadow: `0 4px 20px ${w.orangeGlow}`,
            transition: 'all 0.2s cubic-bezier(0.34,1.4,0.64,1)',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
          + Nuevo
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <KpiCard value={kpis.total} label="Total" color={w.orange} />
        <KpiCard value={kpis.activos} label="Activos" color={w.lime} />
        <KpiCard value={kpis.leads} label="Leads" color={w.cyan} />
        <KpiCard value={kpis.inactivos} label="Inactivos" color={w.rose} sub="+60 días" />
        <KpiCard value={fmtMoney(kpis.revenue)} label="Revenue" color={w.amber} />
        <KpiCard value={kpis.sinContacto} label="Sin contacto" color={w.muted} />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar cliente, CUIT, contacto..."
          style={{
            flex: '1 1 200px', padding: '10px 16px', borderRadius: 12,
            border: `1px solid ${w.border}`, background: 'rgba(255,255,255,0.7)',
            color: w.text, fontSize: 13, outline: 'none',
          }} />
        <select value={filterIndustry} onChange={e => setFilterIndustry(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: 12, border: `1px solid ${w.border}`,
            background: 'rgba(255,255,255,0.7)', color: w.text, fontSize: 12, outline: 'none' }}>
          {industries.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
        {/* Status filters */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setFilterStatus('TODOS')} style={btnStyle(filterStatus === 'TODOS')}>Todos</button>
          {STATUSES.map(s => (
            <button key={s.key} onClick={() => setFilterStatus(s.key)}
              style={{
                ...btnStyle(filterStatus === s.key),
                borderColor: filterStatus === s.key ? s.color + '44' : w.border,
                background: filterStatus === s.key ? s.color + '18' : 'rgba(255,255,255,0.6)',
                color: filterStatus === s.key ? s.color : w.muted,
              }}>{s.label}</button>
          ))}
        </div>
        {/* View toggle */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.6)',
          border: `1px solid ${w.border}`, borderRadius: 10, padding: 3 }}>
          {[{ v: 'cards', i: '⊞' }, { v: 'table', i: '☰' }].map(({ v, i }) => (
            <button key={v} onClick={() => setViewMode(v)}
              style={{ padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: viewMode === v ? w.orange : 'transparent',
                color: viewMode === v ? '#fff' : w.muted, fontSize: 13, transition: 'all 0.2s' }}>
              {i}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: w.muted, fontSize: 14 }}>Cargando...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: w.muted }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🌌</div>
          <div style={{ fontSize: 14 }}>No hay clientes todavía</div>
          <div style={{ fontSize: 12, marginTop: 4, color: w.sub }}>Creá el primero con el botón + Nuevo</div>
        </div>
      ) : viewMode === 'cards' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
          {filtered.map(c => (
            <ClientCard key={c.id} client={c} onClick={() => { setSelected(c); setShowModal(true) }} />
          ))}
        </div>
      ) : (
        <div style={{ background: w.card, backdropFilter: w.blur, borderRadius: 18,
          border: `1px solid ${w.border}`, overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${w.border}` }}>
                {['Empresa', 'Estado', 'Rubro', 'Contacto', 'Ciudad', 'Revenue', 'Último contacto', 'Categoría', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11,
                    fontWeight: 700, color: w.sub, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <ClientRow key={c.id} client={c} onClick={() => { setSelected(c); setShowModal(true) }} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <ClientModal
          initial={selected}
          onClose={() => { setShowModal(false); setSelected(null) }}
          onSaved={load}
        />
      )}
    </div>
  )
}
