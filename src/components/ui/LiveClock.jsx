import { useEffect, useState } from 'react'

export function LiveClock() {
  const [now, setNow] = useState(new Date())

  // Atualiza o relógio a cada segundo
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

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
    <div className="flex flex-col items-center gap-1" style={{ minWidth: 240 }}>

      {/* Hora */}
      <span
        className="font-black tabular-nums leading-none"
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
        className="text-center font-medium"
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
      <div className="flex gap-3">
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