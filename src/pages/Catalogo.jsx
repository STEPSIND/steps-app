import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'

// ── BUSINESS UNITS (same structure as CargaProductos) ─────────────────────────
const BUSINESS_UNITS = [
  {
    id: 'abastecimiento',
    name: 'STEPS ABASTECIMIENTO',
    tagline: 'Seguridad Industrial · EPP · Indumentaria · Herramientas',
    description: 'Todo lo que tu empresa necesita para operar con seguridad. Equipamos Oil & Gas, construcción y minería con los mejores estándares de la industria.',
    icon: '🏭',
    aura: '#E8860A',
    aura2: '#C8941A',
    textColor: '#FFD580',
    bg: 'linear-gradient(135deg, rgba(232,134,10,0.15), rgba(200,148,26,0.08), rgba(0,0,0,0.3))',
    categories: [
      { id:'ropa',       name:'Ropa de trabajo',             emoji:'👔', aura:'#C8941A', desc:'Indumentaria laboral y corporativa' },
      { id:'epp',        name:'EPP',                         emoji:'⛑️', aura:'#06b6d4', desc:'Equipos de protección personal' },
      { id:'calzado',    name:'Calzado de seguridad',        emoji:'🥾', aura:'#f59e0b', desc:'Botas, botines y zapatos industriales' },
      { id:'detectores', name:'Detectores de gas',           emoji:'🔬', aura:'#f43f5e', desc:'Detección mono y multigas' },
      { id:'senial',     name:'Señalización y tránsito',     emoji:'🚦', aura:'#eab308', desc:'Conos, carteles, balizas' },
      { id:'guantes',    name:'Guantes',                     emoji:'🥊', aura:'#14b8a6', desc:'Protección para manos' },
      { id:'incendios',  name:'Contra incendios',            emoji:'🔥', aura:'#f97316', desc:'Matafuegos y equipamiento CI' },
      { id:'alturas',    name:'Trabajo en alturas',          emoji:'⛰️', aura:'#ec4899', desc:'Arneses, líneas de vida y retráctiles' },
      { id:'vehicular',  name:'Equipamiento vehicular',      emoji:'🚙', aura:'#3b82f6', desc:'Kits de emergencia y seguridad vial' },
      { id:'cargas',     name:'Cargas e izaje',              emoji:'🏗️', aura:'#8b5cf6', desc:'Cadenas, fajas y aparejos' },
      { id:'limpieza',   name:'Orden y Limpieza',            emoji:'🫧', aura:'#84cc16', desc:'Absorbentes y limpieza industrial' },
      { id:'herram',     name:'Herramientas',                emoji:'🛠️', aura:'#6366f1', desc:'Manuales, eléctricas y neumáticas' },
      { id:'materiales', name:'Materiales de construcción',  emoji:'🧱', aura:'#78716c', desc:'Aislaciones, pisos, revestimientos' },
    ],
  },
  {
    id: 'obras',
    name: 'STEPS OBRAS & PROYECTOS',
    tagline: 'Flipping · Smart Home · Smart Office · Proyectos integrales',
    description: 'Transformamos espacios con soluciones inteligentes. Desde renovación de propiedades hasta automatización de hogares y oficinas conectadas.',
    icon: '🏗️',
    aura: '#22c55e',
    aura2: '#16a34a',
    textColor: '#86efac',
    bg: 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(22,163,74,0.06), rgba(0,0,0,0.3))',
    categories: [
      { id:'abast-proy',    name:'Abastecimiento a proyectos', emoji:'🏢', aura:'#22c55e', desc:'Insumos y materiales para obra' },
      { id:'innovadores',   name:'Productos Innovadores',       emoji:'✨', aura:'#a3e635', desc:'Lo mejor de la industria global' },
      { id:'flipping',      name:'Flipping House & Business',   emoji:'🔑', aura:'#f59e0b', desc:'Renovación y valorización de propiedades' },
      { id:'smart-home',    name:'Smart Home',                  emoji:'🏡', aura:'#06b6d4', desc:'Domótica y automatización del hogar' },
      { id:'smart-office',  name:'Smart Office',                emoji:'🖥️', aura:'#8b5cf6', desc:'Oficinas inteligentes y conectadas' },
    ],
  },
  {
    id: 'tecnologia',
    name: 'STEPS APPS & TECNOLOGÍA',
    tagline: 'IA · Apps · Soluciones digitales para empresas',
    description: 'Digitalizamos tu empresa con inteligencia artificial, aplicaciones a medida y productos tecnológicos que transforman la forma de trabajar.',
    icon: '⚡',
    aura: '#8b5cf6',
    aura2: '#3b82f6',
    textColor: '#c4b5fd',
    bg: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.08), rgba(0,0,0,0.3))',
    categories: [
      { id:'app-steps',     name:'App STEPS',              emoji:'📱', aura:'#E8860A', desc:'Gestión de pedidos y compras' },
      { id:'apps-web',      name:'Apps y sitio web',       emoji:'💻', aura:'#3b82f6', desc:'Desarrollo web y aplicaciones' },
      { id:'ia-empresas',   name:'IA para empresas',       emoji:'🧠', aura:'#7c3aed', desc:'Automatización e inteligencia artificial' },
      { id:'prod-smart',    name:'Productos inteligentes', emoji:'🔮', aura:'#06b6d4', desc:'IoT, wearables y sensores conectados' },
    ],
  },
]

// ── ANIMATED BACKGROUND ───────────────────────────────────────────────────────
function CatalogBackground({ activeUnit }) {
  const canvasRef = useRef(null)
  const frameRef  = useRef(null)
  const colorsRef = useRef(['#E8860A', '#7C3AED', '#06B6D4'])

  useEffect(() => {
    if (activeUnit) {
      const u = BUSINESS_UNITS.find(u => u.id === activeUnit)
      if (u) colorsRef.current = [u.aura, u.aura2, '#ffffff']
    } else {
      colorsRef.current = ['#E8860A', '#22c55e', '#8b5cf6']
    }
  }, [activeUnit])

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize(); window.addEventListener('resize', resize)

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: 0.5 + Math.random() * 1.5,
      pulse: Math.random() * Math.PI * 2,
      colorIdx: Math.floor(Math.random() * 3),
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const colors = colorsRef.current

      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.pulse += 0.02
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        const alpha = (Math.sin(p.pulse) * 0.3 + 0.5) * 0.6
        ctx.save()
        ctx.globalAlpha = alpha
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4)
        const col = colors[p.colorIdx % colors.length]
        g.addColorStop(0, col); g.addColorStop(1, 'transparent')
        ctx.fillStyle = g
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2); ctx.fill()
        ctx.restore()
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.hypot(dx, dy)
          if (dist > 120) continue
          ctx.save()
          ctx.globalAlpha = (1 - dist / 120) * 0.1
          ctx.strokeStyle = colors[particles[i].colorIdx % colors.length]
          ctx.lineWidth = 0.5
          ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke()
          ctx.restore()
        }
      }

      frameRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(frameRef.current) }
  }, [])

  return (
    <canvas ref={canvasRef} style={{
      position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.5,
    }}/>
  )
}

// ── HERO SECTION ──────────────────────────────────────────────────────────────
function CatalogHero({ onExplore }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 100) }, [])

  return (
    <div style={{
      minHeight: '50vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '60px 40px 40px', textAlign: 'center', position: 'relative', zIndex: 1,
    }}>
      <style>{`
        @keyframes heroFade{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glowPulse{0%,100%{opacity:0.5}50%{opacity:1}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
      `}</style>

      {/* Badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '6px 16px', borderRadius: 20, marginBottom: 24,
        background: 'rgba(232,134,10,0.1)',
        border: '1px solid rgba(232,134,10,0.3)',
        animation: visible ? 'heroFade 0.6s ease both' : 'none',
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%', background: '#E8860A',
          boxShadow: '0 0 8px #E8860A', animation: 'glowPulse 2s ease infinite',
        }}/>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#E8860A',
          textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          STEPS · Catálogo 2026
        </span>
      </div>

      {/* Main title */}
      <h1 style={{
        margin: '0 0 16px',
        fontSize: 'clamp(36px, 6vw, 72px)',
        fontWeight: 900,
        letterSpacing: '-2px',
        lineHeight: 1.05,
        fontFamily: "'Syne', sans-serif",
        background: 'linear-gradient(135deg, #ffffff 0%, #E8860A 40%, #ffffff 70%, #8b5cf6 100%)',
        backgroundSize: '300% auto',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: visible
          ? 'heroFade 0.7s 0.1s ease both, shimmer 6s linear 0.8s infinite'
          : 'none',
      }}>
        walk safe.
      </h1>

      <p style={{
        fontSize: 'clamp(14px, 2vw, 18px)',
        color: 'rgba(148,163,184,0.8)',
        maxWidth: 560, lineHeight: 1.7, margin: '0 0 40px',
        animation: visible ? 'heroFade 0.7s 0.2s ease both' : 'none',
        opacity: 0, animationFillMode: 'both',
      }}>
        Seguridad industrial · Construcción inteligente · Tecnología para empresas.<br/>
        Tres divisiones. Una solución integral.
      </p>

      {/* CTA */}
      <button onClick={onExplore} style={{
        padding: '14px 36px', borderRadius: 50, border: 'none', cursor: 'pointer',
        background: 'linear-gradient(135deg, #E8860A, #F5A623)',
        color: '#000', fontSize: 15, fontWeight: 800,
        boxShadow: '0 0 40px rgba(232,134,10,0.4), 0 8px 32px rgba(0,0,0,0.3)',
        animation: visible ? 'heroFade 0.7s 0.35s ease both' : 'none',
        opacity: 0, animationFillMode: 'both',
        transition: 'all 0.2s cubic-bezier(0.34,1.4,0.64,1)',
        fontFamily: "'Syne', sans-serif", letterSpacing: '-0.3px',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06) translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 60px rgba(232,134,10,0.6), 0 12px 40px rgba(0,0,0,0.4)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 0 40px rgba(232,134,10,0.4), 0 8px 32px rgba(0,0,0,0.3)' }}
      >
        Explorar catálogo →
      </button>
    </div>
  )
}

// ── SECTOR CARD ───────────────────────────────────────────────────────────────
function SectorCard({ unit, index, isActive, onClick }) {
  const [hov, setHov] = useState(false)
  const ref = useRef()

  const onMove = e => {
    const r = ref.current?.getBoundingClientRect(); if (!r) return
    ref.current.style.setProperty('--sx', `${((e.clientX - r.left) / r.width) * 100}%`)
    ref.current.style.setProperty('--sy', `${((e.clientY - r.top) / r.height) * 100}%`)
  }

  return (
    <div ref={ref}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onMouseMove={onMove}
      style={{
        flex: '1 1 0', minWidth: 0,
        position: 'relative', cursor: 'pointer',
        borderRadius: 28, overflow: 'hidden',
        padding: '32px 28px',
        background: isActive
          ? `linear-gradient(135deg, ${unit.aura}22, ${unit.aura}0a, rgba(0,0,0,0.25))`
          : hov
          ? `linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))`
          : 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(40px) saturate(200%)',
        border: `1px solid ${isActive ? unit.aura + '55' : hov ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)'}`,
        borderTop: `1px solid ${isActive ? unit.aura + '80' : 'rgba(255,255,255,0.22)'}`,
        boxShadow: isActive
          ? `0 0 0 1px ${unit.aura}30, 0 24px 80px ${unit.aura}18, inset 0 1px 0 rgba(255,255,255,0.2), 0 40px 100px rgba(0,0,0,0.5)`
          : hov
          ? `0 16px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15), 0 0 30px ${unit.aura}10`
          : `0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.07)`,
        transform: isActive
          ? 'translateY(-6px) scale(1.015)'
          : hov
          ? 'translateY(-4px)'
          : 'none',
        transition: 'all 0.4s cubic-bezier(0.34,1.2,0.64,1)',
        animation: `sectorIn 0.6s ${0.1 + index * 0.12}s cubic-bezier(0.34,1.2,0.64,1) both`,
      }}
    >
      {/* Spotlight */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(circle 180px at var(--sx,50%) var(--sy,50%), ${unit.aura}12, transparent 70%)`,
      }}/>

      {/* Top shine */}
      <div style={{
        position: 'absolute', top: 0, left: '8%', right: '8%', height: 1,
        background: `linear-gradient(90deg, transparent, ${isActive ? unit.aura + '88' : 'rgba(255,255,255,0.25)'}, transparent)`,
        pointerEvents: 'none', transition: 'all 0.3s',
      }}/>

      {/* Background glow */}
      <div style={{
        position: 'absolute', top: -60, right: -60, width: 200, height: 200,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${unit.aura}${isActive ? '20' : '0a'}, transparent 70%)`,
        pointerEvents: 'none', transition: 'all 0.4s ease',
      }}/>

      {/* 3D Icon */}
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        marginBottom: 24, position: 'relative',
        background: `radial-gradient(circle at 35% 30%, ${unit.aura}50, ${unit.aura}20 55%, rgba(0,0,0,0.25) 100%)`,
        border: `2px solid ${unit.aura}55`,
        borderTop: `2px solid ${unit.aura}99`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 32,
        boxShadow: [
          `inset 0 2px 0 rgba(255,255,255,0.3)`,
          `inset 0 -2px 0 rgba(0,0,0,0.25)`,
          `0 8px 32px ${unit.aura}35`,
          isActive ? `0 0 40px ${unit.aura}40, 0 0 80px ${unit.aura}20` : '',
        ].filter(Boolean).join(', '),
        transform: hov || isActive ? 'perspective(300px) rotateX(-10deg) rotateY(8deg) scale(1.05)' : 'none',
        transition: 'all 0.35s cubic-bezier(0.34,1.4,0.64,1)',
      }}>
        {/* Specular */}
        <div style={{
          position: 'absolute', top: '12%', left: '18%',
          width: '32%', height: '26%', borderRadius: '50%',
          background: 'rgba(255,255,255,0.5)', filter: 'blur(4px)',
          pointerEvents: 'none',
        }}/>
        <span style={{ position: 'relative', zIndex: 1 }}>{unit.icon}</span>
      </div>

      {/* Name */}
      <div style={{
        fontSize: 20, fontWeight: 900, lineHeight: 1.1, marginBottom: 8,
        color: isActive ? unit.textColor : 'rgba(241,245,249,0.9)',
        fontFamily: "'Syne', sans-serif", letterSpacing: '-0.3px',
        transition: 'color 0.3s',
      }}>
        {unit.name}
      </div>

      {/* Tagline */}
      <div style={{
        fontSize: 11, color: isActive ? unit.textColor + 'bb' : 'rgba(148,163,184,0.55)',
        lineHeight: 1.5, marginBottom: 16, transition: 'color 0.3s',
      }}>
        {unit.tagline}
      </div>

      {/* Description */}
      <div style={{
        fontSize: 12, color: 'rgba(148,163,184,0.45)',
        lineHeight: 1.65, marginBottom: 24,
      }}>
        {unit.description}
      </div>

      {/* Category count + CTA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          fontSize: 11, color: isActive ? unit.aura : 'rgba(148,163,184,0.4)',
          fontWeight: 600, transition: 'color 0.3s',
        }}>
          {unit.categories.length} categorías
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 14px', borderRadius: 20,
          background: isActive ? `${unit.aura}20` : 'rgba(255,255,255,0.06)',
          border: `1px solid ${isActive ? unit.aura + '40' : 'rgba(255,255,255,0.1)'}`,
          fontSize: 11, fontWeight: 700,
          color: isActive ? unit.aura : 'rgba(148,163,184,0.5)',
          transition: 'all 0.3s',
          transform: isActive ? 'translateX(0)' : 'none',
        }}>
          {isActive ? 'Explorando' : 'Explorar'}
          <span style={{
            transform: isActive ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.3s ease',
            display: 'inline-block',
          }}>→</span>
        </div>
      </div>

      {/* Active bottom line */}
      {isActive && (
        <div style={{
          position: 'absolute', bottom: 0, left: '8%', right: '8%', height: 2,
          background: `linear-gradient(90deg, transparent, ${unit.aura}, ${unit.aura2}, transparent)`,
          animation: 'glowLine 0.3s ease both',
        }}/>
      )}
    </div>
  )
}

// ── CATEGORY CARD ─────────────────────────────────────────────────────────────
function CategoryCard({ cat, index, isActive, onClick, productCount }) {
  const [hov, setHov] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        cursor: 'pointer', borderRadius: 20,
        padding: '20px 16px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        position: 'relative', overflow: 'hidden',
        background: isActive
          ? `linear-gradient(135deg, ${cat.aura}22, ${cat.aura}0a)`
          : hov
          ? 'rgba(255,255,255,0.07)'
          : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isActive ? cat.aura + '55' : hov ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)'}`,
        borderTop: `1px solid ${isActive ? cat.aura + '88' : 'rgba(255,255,255,0.2)'}`,
        boxShadow: isActive
          ? `0 0 24px ${cat.aura}18, inset 0 1px 0 rgba(255,255,255,0.2), 0 8px 32px rgba(0,0,0,0.4)`
          : hov
          ? `0 8px 28px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12)`
          : `0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.07)`,
        transform: isActive
          ? 'translateY(-4px) scale(1.02)'
          : hov
          ? 'translateY(-3px)'
          : 'none',
        transition: 'all 0.3s cubic-bezier(0.34,1.3,0.64,1)',
        animation: `catIn 0.5s ${0.05 + index * 0.04}s cubic-bezier(0.34,1.2,0.64,1) both`,
        backdropFilter: 'blur(24px)',
      }}
    >
      {/* Shine */}
      <div style={{
        position: 'absolute', top: 0, left: '15%', right: '15%', height: 1,
        background: `linear-gradient(90deg, transparent, ${isActive ? cat.aura + '70' : 'rgba(255,255,255,0.2)'}, transparent)`,
        pointerEvents: 'none',
      }}/>

      {/* 3D Crystal Icon */}
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 26, position: 'relative',
        background: `radial-gradient(circle at 35% 30%, ${cat.aura}45, ${cat.aura}18 55%, rgba(0,0,0,0.2) 100%)`,
        border: `1.5px solid ${cat.aura}50`,
        borderTop: `1.5px solid ${cat.aura}88`,
        boxShadow: [
          'inset 0 2px 0 rgba(255,255,255,0.3)',
          'inset 0 -1px 0 rgba(0,0,0,0.2)',
          `0 4px 16px ${cat.aura}25`,
          isActive ? `0 0 24px ${cat.aura}40` : '',
        ].filter(Boolean).join(', '),
        transform: hov || isActive
          ? 'perspective(200px) rotateX(-8deg) rotateY(6deg) scale(1.1)'
          : 'none',
        transition: 'all 0.3s cubic-bezier(0.34,1.4,0.64,1)',
      }}>
        <div style={{
          position: 'absolute', top: '12%', left: '18%',
          width: '30%', height: '24%', borderRadius: '50%',
          background: 'rgba(255,255,255,0.5)', filter: 'blur(3px)', pointerEvents: 'none',
        }}/>
        {cat.emoji}
      </div>

      {/* Name */}
      <div style={{
        fontSize: 11, fontWeight: 700, textAlign: 'center', lineHeight: 1.3,
        color: isActive ? cat.aura : 'rgba(241,245,249,0.8)',
        transition: 'color 0.2s',
      }}>
        {cat.name}
      </div>

      {/* Desc */}
      <div style={{
        fontSize: 9, color: 'rgba(148,163,184,0.45)',
        textAlign: 'center', lineHeight: 1.4,
      }}>
        {cat.desc}
      </div>

      {/* Product count */}
      {productCount > 0 && (
        <div style={{
          fontSize: 9, fontWeight: 800,
          color: isActive ? cat.aura : 'rgba(148,163,184,0.35)',
          fontFamily: "'Space Mono', monospace",
          background: isActive ? `${cat.aura}15` : 'rgba(255,255,255,0.05)',
          padding: '2px 8px', borderRadius: 10,
          border: `1px solid ${isActive ? cat.aura + '30' : 'rgba(255,255,255,0.06)'}`,
          transition: 'all 0.2s',
        }}>
          {productCount} productos
        </div>
      )}
    </div>
  )
}

// ── PRODUCT CARD (Catalog version — read only) ────────────────────────────────
function CatalogProductCard({ p, unit }) {
  const [hov, setHov] = useState(false)
  const fmtARS = v => v && +v > 0 ? `$${(+v).toLocaleString('es-AR')}` : null

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: 18, overflow: 'hidden',
        background: 'linear-gradient(160deg, rgba(14,12,30,0.98), rgba(8,6,20,0.99))',
        border: `1px solid ${hov ? unit.aura + '55' : 'rgba(255,255,255,0.07)'}`,
        borderTop: `1px solid ${hov ? unit.aura + '80' : 'rgba(255,255,255,0.14)'}`,
        boxShadow: hov
          ? `0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px ${unit.aura}25, 0 0 36px ${unit.aura}12`
          : '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
        transform: hov ? 'translateY(-5px) scale(1.02)' : 'none',
        transition: 'all 0.35s cubic-bezier(0.34,1.1,0.64,1)',
        position: 'relative',
      }}
    >
      {hov && (
        <div style={{
          position: 'absolute', top: 0, left: '15%', right: '15%', height: 1,
          background: `linear-gradient(90deg, transparent, ${unit.aura}88, transparent)`,
          pointerEvents: 'none', zIndex: 3,
        }}/>
      )}

      {/* Image */}
      <div style={{ height: 160, overflow: 'hidden', position: 'relative' }}>
        {p.image_url
          ? <img src={p.image_url} alt={p.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
              onMouseEnter={e => e.target.style.transform = 'scale(1.08)'}
              onMouseLeave={e => e.target.style.transform = 'scale(1)'}
              onError={e => e.target.style.display = 'none'}
            />
          : <div style={{
              width: '100%', height: '100%', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: `linear-gradient(135deg, ${unit.aura}08, rgba(0,0,0,0.3))`,
              fontSize: 42, opacity: 0.3,
            }}>📦</div>
        }
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, transparent 40%, rgba(8,6,20,0.95) 100%)',
          pointerEvents: 'none',
        }}/>
        {p.brand && (
          <div style={{
            position: 'absolute', bottom: 8, left: 10,
            fontSize: 9, color: unit.aura, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            {p.brand}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px' }}>
        <div style={{
          fontSize: 12, fontWeight: 700, lineHeight: 1.35, marginBottom: 6,
          color: 'rgba(241,245,249,0.9)',
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {p.name}
        </div>
        {p.short_desc && (
          <div style={{
            fontSize: 10, color: 'rgba(148,163,184,0.5)', lineHeight: 1.4,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            marginBottom: 8,
          }}>
            {p.short_desc}
          </div>
        )}
        {fmtARS(p.sale_price) && (
          <div style={{
            fontSize: 14, fontWeight: 900, color: unit.aura,
            fontFamily: "'Space Mono', monospace",
          }}>
            {fmtARS(p.sale_price)}
          </div>
        )}
      </div>
    </div>
  )
}

// ── MAIN CATALOG ──────────────────────────────────────────────────────────────
export default function Catalogo() {
  const [activeUnitId, setActiveUnitId] = useState(null)
  const [activeCatName, setActiveCatName] = useState(null)
  const [products, setProducts] = useState([])
  const [catProducts, setCatProducts] = useState([])
  const [catCounts, setCatCounts] = useState({})
  const [loadingProds, setLoadingProds] = useState(false)
  const [showHero, setShowHero] = useState(true)
  const sectorsRef = useRef(null)

  // Load product counts on mount
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('products').select('category, available').eq('available', true)
      const counts = {}
      ;(data || []).forEach(p => {
        if (p.category) counts[p.category] = (counts[p.category] || 0) + 1
      })
      setCatCounts(counts)
    }
    load()
  }, [])

  // Load products for active category
  useEffect(() => {
    if (!activeCatName) { setCatProducts([]); return }
    const load = async () => {
      setLoadingProds(true)
      const { data } = await supabase
        .from('products').select('*')
        .eq('category', activeCatName)
        .eq('available', true)
        .order('name')
      setCatProducts(data || [])
      setLoadingProds(false)
    }
    load()
  }, [activeCatName])

  const handleExplore = () => {
    setShowHero(false)
    setTimeout(() => sectorsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const selectUnit = (unitId) => {
    if (activeUnitId === unitId) {
      setActiveUnitId(null)
      setActiveCatName(null)
    } else {
      setActiveUnitId(unitId)
      setActiveCatName(null)
    }
  }

  const selectCat = (catName) => {
    setActiveCatName(activeCatName === catName ? null : catName)
  }

  const activeUnit = BUSINESS_UNITS.find(u => u.id === activeUnitId)

  return (
    <div style={{
      minHeight: '100vh', fontFamily: "'Nunito Sans', system-ui, sans-serif",
      color: '#F0EFFF', position: 'relative',
    }}>
      <style>{`
        @keyframes sectorIn{from{opacity:0;transform:translateY(20px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes catIn{from{opacity:0;transform:translateY(12px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes prodIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glowLine{from{opacity:0;transform:scaleX(0)}to{opacity:1;transform:scaleX(1)}}
        @keyframes glowPulse{0%,100%{opacity:0.6}50%{opacity:1}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
      `}</style>

      <CatalogBackground activeUnit={activeUnitId}/>

      {/* Hero */}
      {showHero && <CatalogHero onExplore={handleExplore}/>}

      {/* Sectors */}
      <div ref={sectorsRef} style={{ padding: '0 32px', position: 'relative', zIndex: 1 }}>

        {/* Section header */}
        <div style={{ marginBottom: 20, paddingTop: showHero ? 0 : 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: 'rgba(148,163,184,0.5)',
              textTransform: 'uppercase', letterSpacing: '0.12em',
            }}>
              Nuestras divisiones
            </div>
            {activeUnitId && (
              <button onClick={() => { setActiveUnitId(null); setActiveCatName(null) }}
                style={{
                  padding: '4px 10px', borderRadius: 20, border: 'none',
                  background: 'rgba(255,255,255,0.05)', color: 'rgba(148,163,184,0.5)',
                  cursor: 'pointer', fontSize: 10,
                }}>
                ← Todas las divisiones
              </button>
            )}
          </div>
        </div>

        {/* 3 Sector Cards */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
          {BUSINESS_UNITS.map((unit, i) => (
            <SectorCard
              key={unit.id}
              unit={unit}
              index={i}
              isActive={activeUnitId === unit.id}
              onClick={() => selectUnit(unit.id)}
            />
          ))}
        </div>

        {/* Expanded: Category Grid */}
        {activeUnit && (
          <div style={{
            marginBottom: 28,
            animation: 'sectorIn 0.4s cubic-bezier(0.34,1.2,0.64,1) both',
          }}>
            {/* Category header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
              padding: '12px 16px',
              background: `linear-gradient(135deg, ${activeUnit.aura}0a, rgba(0,0,0,0.1))`,
              borderRadius: 14,
              border: `1px solid ${activeUnit.aura}20`,
              borderLeft: `3px solid ${activeUnit.aura}`,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: activeUnit.aura, boxShadow: `0 0 8px ${activeUnit.aura}`, animation: 'glowPulse 2s ease infinite' }}/>
              <span style={{ fontSize: 12, fontWeight: 700, color: activeUnit.textColor, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {activeUnit.name}
              </span>
              <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.4)' }}>
                — seleccioná una categoría
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: 12,
            }}>
              {activeUnit.categories.map((cat, i) => (
                <CategoryCard
                  key={cat.id}
                  cat={cat}
                  index={i}
                  isActive={activeCatName === cat.name}
                  onClick={() => selectCat(cat.name)}
                  productCount={catCounts[cat.name] || 0}
                />
              ))}
            </div>
          </div>
        )}

        {/* Products grid */}
        {activeCatName && (
          <div style={{ marginBottom: 40, animation: 'sectorIn 0.4s ease both' }}>
            {/* Products header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: 'rgba(148,163,184,0.5)',
                textTransform: 'uppercase', letterSpacing: '0.12em',
              }}>
                {activeCatName}
              </div>
              {catProducts.length > 0 && (
                <div style={{
                  fontSize: 9, color: activeUnit?.aura || '#E8860A',
                  background: `${activeUnit?.aura || '#E8860A'}15`,
                  padding: '2px 8px', borderRadius: 10,
                  border: `1px solid ${activeUnit?.aura || '#E8860A'}25`,
                  fontWeight: 700, fontFamily: "'Space Mono', monospace",
                }}>
                  {catProducts.length} disponibles
                </div>
              )}
              <button onClick={() => setActiveCatName(null)}
                style={{
                  marginLeft: 'auto', padding: '5px 12px', borderRadius: 20, border: 'none',
                  background: 'rgba(255,255,255,0.06)', color: 'rgba(148,163,184,0.5)',
                  cursor: 'pointer', fontSize: 10,
                }}>
                ✕ Cerrar
              </button>
            </div>

            {loadingProds ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(148,163,184,0.4)' }}>
                <div style={{ fontSize: 24, marginBottom: 8, animation: 'glowPulse 1.5s ease infinite' }}>⚡</div>
                <div style={{ fontSize: 12 }}>Cargando productos...</div>
              </div>
            ) : catProducts.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '48px 24px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 20, color: 'rgba(148,163,184,0.4)',
              }}>
                <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>📦</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Productos en camino</div>
                <div style={{ fontSize: 11, marginTop: 6, color: 'rgba(148,163,184,0.3)' }}>
                  Esta categoría se está cargando. Consultanos directamente.
                </div>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 14,
              }}>
                {catProducts.map((p, i) => (
                  <div key={p.id} style={{ animation: `prodIn 0.4s ${i * 0.04}s ease both` }}>
                    <CatalogProductCard p={p} unit={activeUnit || BUSINESS_UNITS[0]}/>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer CTA */}
        {!activeUnitId && !showHero && (
          <div style={{
            textAlign: 'center', padding: '48px 24px',
            animation: 'sectorIn 0.5s 0.4s ease both', opacity: 0, animationFillMode: 'both',
          }}>
            <div style={{ fontSize: 13, color: 'rgba(148,163,184,0.4)', marginBottom: 16 }}>
              ¿Necesitás algo específico?
            </div>
            <div style={{
              fontSize: 11, color: 'rgba(148,163,184,0.3)', lineHeight: 1.7,
            }}>
              📞 2993295575 · ✉ GESTIONSTEPS@GMAIL.COM · 🌐 STEPSINDUSTRIAL.COM
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
