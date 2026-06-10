import { useState, useRef, useEffect } from 'react'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAYS = ['Lu','Ma','Mi','Ju','Vi','Sa','Do']

export function DatePicker({ value, onChange, placeholder = 'Seleccionar fecha', disabled = false }) {
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(() => value ? new Date(value+'T12:00:00').getFullYear() : new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(() => value ? new Date(value+'T12:00:00').getMonth() : new Date().getMonth())
  const ref = useRef()

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  useEffect(() => {
    if (value) {
      const d = new Date(value+'T12:00:00')
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
    }
  }, [value])

  const getDays = () => {
    const first = new Date(viewYear, viewMonth, 1).getDay()
    const offset = first === 0 ? 6 : first - 1
    const total = new Date(viewYear, viewMonth + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < offset; i++) cells.push(null)
    for (let i = 1; i <= total; i++) cells.push(i)
    return cells
  }

  const select = (day) => {
    if (!day) return
    const mm = String(viewMonth + 1).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    onChange(`${viewYear}-${mm}-${dd}`)
    setOpen(false)
  }

  const fmt = (v) => {
    if (!v) return ''
    const d = new Date(v + 'T12:00:00')
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const isSelected = (day) => {
    if (!value || !day) return false
    const d = new Date(value + 'T12:00:00')
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth && d.getDate() === day
  }

  const isToday = (day) => {
    const t = new Date()
    return t.getFullYear() === viewYear && t.getMonth() === viewMonth && t.getDate() === day
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const cells = getDays()

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <div onClick={() => !disabled && setOpen(o => !o)}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 10,
          border: `1px solid ${open ? 'rgba(255,122,0,0.5)' : 'rgba(0,0,0,0.07)'}`,
          background: disabled ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.7)',
          color: value ? '#1a1a2e' : '#9ca3af', fontSize: 13,
          cursor: disabled ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxSizing: 'border-box', transition: 'border-color 0.2s',
          boxShadow: open ? '0 0 0 3px rgba(255,122,0,0.1)' : 'none',
        }}>
        <span>{value ? fmt(value) : placeholder}</span>
        <span style={{ fontSize: 14, opacity: 0.5, transition: 'transform 0.2s',
          transform: open ? 'rotate(180deg)' : 'none' }}>📅</span>
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 500,
          background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(24px)',
          border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16,
          boxShadow: '0 16px 48px rgba(0,0,0,0.14), 0 4px 16px rgba(255,122,0,0.08)',
          padding: '16px', width: 280,
          animation: 'dpOpen 0.2s cubic-bezier(0.34,1.4,0.64,1)',
        }}>
          <style>{`
            @keyframes dpOpen {
              from { opacity:0; transform:translateY(-8px) scale(0.97); }
              to   { opacity:1; transform:translateY(0) scale(1); }
            }
          `}</style>

          {/* Nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <button onClick={prevMonth}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16,
                color: '#6b7280', padding: '4px 8px', borderRadius: 8,
                transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,122,0,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>‹</button>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>
                {MONTHS[viewMonth]}
              </span>
              <select value={viewYear} onChange={e => setViewYear(Number(e.target.value))}
                style={{ fontSize: 13, fontWeight: 700, color: '#FF7A00', border: 'none',
                  background: 'transparent', cursor: 'pointer', outline: 'none' }}>
                {Array.from({length: 10}, (_,i) => new Date().getFullYear() - 5 + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button onClick={nextMonth}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16,
                color: '#6b7280', padding: '4px 8px', borderRadius: 8,
                transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,122,0,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>›</button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700,
                color: '#9ca3af', padding: '2px 0', letterSpacing: '0.05em' }}>{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
            {cells.map((day, i) => (
              <div key={i} onClick={() => select(day)}
                style={{
                  textAlign: 'center', padding: '7px 2px', borderRadius: 8,
                  fontSize: 12, fontWeight: isSelected(day) ? 700 : 400,
                  cursor: day ? 'pointer' : 'default',
                  background: isSelected(day)
                    ? 'linear-gradient(135deg,#FF7A00,#ff9f40)'
                    : isToday(day) ? 'rgba(255,122,0,0.1)' : 'transparent',
                  color: isSelected(day) ? '#fff' : isToday(day) ? '#FF7A00' : day ? '#1a1a2e' : 'transparent',
                  border: isToday(day) && !isSelected(day) ? '1px solid rgba(255,122,0,0.3)' : '1px solid transparent',
                  boxShadow: isSelected(day) ? '0 2px 8px rgba(255,122,0,0.4)' : 'none',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (day && !isSelected(day)) e.currentTarget.style.background = 'rgba(255,122,0,0.08)' }}
                onMouseLeave={e => { if (day && !isSelected(day)) e.currentTarget.style.background = isToday(day) ? 'rgba(255,122,0,0.1)' : 'transparent' }}>
                {day || ''}
              </div>
            ))}
          </div>

          {/* Today button */}
          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <button onClick={() => {
              const t = new Date()
              select(t.getDate())
              setViewYear(t.getFullYear())
              setViewMonth(t.getMonth())
            }}
              style={{ fontSize: 11, color: '#FF7A00', background: 'rgba(255,122,0,0.08)',
                border: '1px solid rgba(255,122,0,0.2)', borderRadius: 8,
                padding: '5px 14px', cursor: 'pointer', fontWeight: 600,
                transition: 'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,122,0,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,122,0,0.08)'}>
              Hoy
            </button>
            {value && (
              <button onClick={() => { onChange(''); setOpen(false) }}
                style={{ fontSize: 11, color: '#6b7280', background: 'transparent',
                  border: 'none', marginLeft: 8, cursor: 'pointer', padding: '5px 8px' }}>
                Limpiar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
