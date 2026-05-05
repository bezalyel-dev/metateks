import { useCallback, useEffect, useRef, useState } from 'react'

export function LiveClock() {
  const [now, setNow] = useState(new Date())
  const wrapperRef = useRef(null)
  const canvasRef  = useRef(null)
  const boltsRef   = useRef([])
  const rafRef     = useRef(null)

  // Atualiza o relógio a cada segundo
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Gera segmentos de raio recursivamente
  const generateBolt = useCallback((x1, y1, x2, y2, depth) => {
    if (depth === 0) return [{ x1, y1, x2, y2 }]
    const len = Math.hypot(x2 - x1, y2 - y1)
    const mx  = (x1 + x2) / 2 + (Math.random() - 0.5) * len * 0.5
    const my  = (y1 + y2) / 2 + (Math.random() - 0.5) * len * 0.5
    return [
      ...generateBolt(x1, y1, mx, my, depth - 1),
      ...generateBolt(mx, my, x2, y2, depth - 1),
    ]
  }, [])

  // Loop de animação dos raios
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const sync = () => {
      const el = wrapperRef.current
      if (!el) return
      canvas.width  = el.offsetWidth
      canvas.height = el.offsetHeight
    }
    sync()

    const ro = new ResizeObserver(sync)
    if (wrapperRef.current) ro.observe(wrapperRef.current)

    const spawnBolt = () => {
      const w = canvas.width
      const h = canvas.height
      const fromSide = Math.random() < 0.5
      let startX, startY, endX, endY

      if (fromSide) {
        startX = Math.random() < 0.5 ? 0 : w
        startY = Math.random() * h
        endX   = startX === 0 ? w * (0.2 + Math.random() * 0.5) : w * (0.3 + Math.random() * 0.5)
        endY   = startY + (Math.random() - 0.5) * h * 0.6
      } else {
        startX = Math.random() * w
        startY = Math.random() < 0.5 ? 0 : h
        endX   = startX + (Math.random() - 0.5) * w * 0.6
        endY   = startY === 0 ? h * (0.2 + Math.random() * 0.6) : h * (0.2 + Math.random() * 0.6)
      }

      const palette = ['#bfdbfe', '#93c5fd', '#e0f2fe', '#ffffff', '#7dd3fc']
      boltsRef.current.push({
        segs:    generateBolt(startX, startY, endX, endY, 4),
        life:    1,
        maxLife: 0.15 + Math.random() * 0.25,
        color:   palette[Math.floor(Math.random() * palette.length)],
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (Math.random() < 0.10) spawnBolt()
      if (Math.random() < 0.03) spawnBolt()

      boltsRef.current = boltsRef.current.filter(b => b.life > 0)

      for (const bolt of boltsRef.current) {
        bolt.life -= bolt.maxLife / 8
        const alpha = Math.max(0, bolt.life) * 0.85

        ctx.save()
        ctx.globalAlpha = alpha

        ctx.strokeStyle = bolt.color
        ctx.lineWidth   = 2.5
        ctx.shadowBlur  = 16
        ctx.shadowColor = '#93c5fd'
        ctx.beginPath()
        bolt.segs.forEach((s, i) => {
          if (i === 0) ctx.moveTo(s.x1, s.y1)
          ctx.lineTo(s.x2, s.y2)
        })
        ctx.stroke()

        ctx.strokeStyle = 'rgba(255,255,255,0.95)'
        ctx.lineWidth   = 0.8
        ctx.shadowBlur  = 5
        ctx.shadowColor = '#ffffff'
        ctx.beginPath()
        bolt.segs.forEach((s, i) => {
          if (i === 0) ctx.moveTo(s.x1, s.y1)
          ctx.lineTo(s.x2, s.y2)
        })
        ctx.stroke()

        ctx.restore()
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [generateBolt])

  const hora = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const data = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  const dataFormatada = data.charAt(0).toUpperCase() + data.slice(1)

  // Contador regressivo para o fim do ano
  const year      = now.getFullYear()
  const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999)
  const diffMs    = Math.max(0, endOfYear - now)
  const totalSecs = Math.floor(diffMs / 1000)
  const cdSecs    = totalSecs % 60
  const cdMins    = Math.floor(totalSecs / 60) % 60
  const cdHours   = Math.floor(totalSecs / 3600) % 24
  const cdDays    = Math.floor(totalSecs / 86400)

  const pad = (n) => String(n).padStart(2, '0')

  const unitStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  }

  const valueStyle = {
    fontSize: 'clamp(24px, 3.5vw, 48px)',
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
    color: '#4ade80',
    textShadow: '0 0 12px rgba(74,222,128,0.45)',
    lineHeight: 1,
  }

  const labelStyle = {
    fontSize: 'clamp(12px, 1.4vw, 16px)',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  }

  return (
    <div ref={wrapperRef} className="relative flex flex-col items-center gap-1" style={{ minWidth: 240 }}>
      {/* Canvas dos raios sobreposto */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Hora */}
      <span
        className="relative font-black tabular-nums leading-none"
        style={{
          fontSize: 'clamp(22px, 3.5vw, 44px)',
          color: '#4ade80',
          textShadow: '0 0 18px rgba(74,222,128,0.5)',
          letterSpacing: '0.05em',
        }}
      >
        {hora}
      </span>

      {/* Data */}
      <span
        className="relative text-center font-medium"
        style={{
          fontSize: 'clamp(16px, 2vw, 24px)',
          color: 'rgba(255,255,255,0.45)',
          letterSpacing: '0.06em',
        }}
      >
        {dataFormatada}
      </span>

      {/* Separador */}
      <div
        className="relative"
        style={{
          width: 40,
          height: 1,
          background: 'rgba(255,255,255,0.1)',
          marginTop: 4,
          marginBottom: 4,
        }}
      />

      {/* Label do contador */}
      <span
        className="relative"
        style={{
          fontSize: 'clamp(9px, 1vw, 11px)',
          color: 'rgba(255,255,255,0.3)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 4,
        }}
      >
        Faltam para {year} acabar
      </span>

      {/* Contador regressivo */}
      <div
        className="relative flex gap-3"
      >
        <div style={unitStyle}>
          <span style={valueStyle}>{cdDays}</span>
          <span style={labelStyle}>dias</span>
        </div>

        <span style={{ ...valueStyle, alignSelf: 'flex-start', opacity: 0.4 }}>:</span>

        <div style={unitStyle}>
          <span style={valueStyle}>{pad(cdHours)}</span>
          <span style={labelStyle}>horas</span>
        </div>

        <span style={{ ...valueStyle, alignSelf: 'flex-start', opacity: 0.4 }}>:</span>

        <div style={unitStyle}>
          <span style={valueStyle}>{pad(cdMins)}</span>
          <span style={labelStyle}>min</span>
        </div>

        <span style={{ ...valueStyle, alignSelf: 'flex-start', opacity: 0.4 }}>:</span>

        <div style={unitStyle}>
          <span style={valueStyle}>{pad(cdSecs)}</span>
          <span style={labelStyle}>seg</span>
        </div>
      </div>
    </div>
  )
}