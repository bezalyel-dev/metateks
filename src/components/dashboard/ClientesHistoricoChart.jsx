import { useMemo } from 'react'

const NOMES_MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function smoothPath(points) {
  if (points.length < 2) return ''
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
  const tension = 0.35
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(i + 2, points.length - 1)]
    const cp1x = p1.x + (p2.x - p0.x) * tension
    const cp1y = p1.y + (p2.y - p0.y) * tension
    const cp2x = p2.x - (p3.x - p1.x) * tension
    const cp2y = p2.y - (p3.y - p1.y) * tension
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }
  return d
}

export function ClientesHistoricoChart({ historico = [], mesAtual }) {
  const dados = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const mes = i + 1
      const row = historico.find((r) => r.mes === mes)
      return { mes, nome: NOMES_MESES[i], entradas: row?.entradas ?? 0, saidas: row?.saidas ?? 0 }
    })
  }, [historico, mesAtual])

  const maxVal = useMemo(
    () => Math.max(...dados.flatMap((d) => [d.entradas, d.saidas]), 1),
    [dados]
  )

  if (dados.length === 0) return null

  const svgW = 600, svgH = 75
  const padL = 28, padR = 10, padT = 14, padB = 16
  const chartW = svgW - padL - padR
  const chartH = svgH - padT - padB
  const n = dados.length

  function px(i)   { return padL + (i / Math.max(n - 1, 1)) * chartW }
  function py(val) { return padT + chartH - (val / maxVal) * chartH }

  const ptsE = dados.map((d, i) => ({ x: px(i), y: py(d.entradas) }))
  const ptsS = dados.map((d, i) => ({ x: px(i), y: py(d.saidas) }))
  const pathE = smoothPath(ptsE)
  const pathS = smoothPath(ptsS)
  const areaE = pathE + ` L ${ptsE[n-1].x} ${padT + chartH} L ${ptsE[0].x} ${padT + chartH} Z`

  const gridLines = [0, 0.5, 1].map(pct => ({
    y: padT + chartH - pct * chartH,
    label: Math.round(pct * maxVal),
  }))

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>

      <div style={{ width: '100%', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          width="100%" height="100%"
          style={{ display: 'block', maxHeight: '100%' }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="gradE" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ade80" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
            </linearGradient>
          </defs>

          {gridLines.map(({ y, label }) => (
            <g key={y}>
              <line x1={padL} y1={y} x2={svgW - padR} y2={y}
                stroke="rgba(74,222,128,0.08)" strokeWidth={0.75}
                strokeDasharray={label === 0 ? 'none' : '3,3'} />
              <text x={padL - 4} y={y} textAnchor="end" dominantBaseline="middle"
                fontSize={6} fill="rgba(74,222,128,0.35)" fontFamily="DM Mono, monospace">
                {label}
              </text>
            </g>
          ))}

          <line x1={padL} y1={padT + chartH} x2={svgW - padR} y2={padT + chartH}
            stroke="rgba(74,222,128,0.15)" strokeWidth={0.75} />

          <path d={areaE} fill="url(#gradE)" />
          <path d={pathE} fill="none" stroke="#4ade80" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <path d={pathS} fill="none" stroke="#f87171" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

          {dados.map((d, i) => {
            const isAtual = d.mes === mesAtual
            const xPos = px(i)
            const yE = py(d.entradas)
            const yS = py(d.saidas)
            const rO = isAtual ? 5 : 3.5
            const rI = isAtual ? 2.5 : 1.8

            return (
              <g key={d.mes}>
                <circle cx={xPos} cy={yE} r={rO} fill="#030f07" stroke="#4ade80" strokeWidth={1.5} />
                <circle cx={xPos} cy={yE} r={rI} fill="#4ade80" />
                {d.entradas > 0 && (
                  <text x={xPos} y={yE - rO - 3} textAnchor="middle" dominantBaseline="auto"
                    fontSize={isAtual ? 7.5 : 6} fontWeight={700}
                    fill="rgba(74,222,128,0.9)" fontFamily="DM Mono, monospace">
                    {d.entradas}
                  </text>
                )}

                {d.saidas > 0 && (
                  <>
                    <circle cx={xPos} cy={yS} r={rO} fill="#030f07" stroke="#f87171" strokeWidth={1.5} />
                    <circle cx={xPos} cy={yS} r={rI} fill="#f87171" />
                    <text x={xPos} y={yS + rO + 8} textAnchor="middle"
                      fontSize={isAtual ? 7.5 : 6} fontWeight={700}
                      fill="rgba(248,113,113,0.9)" fontFamily="DM Mono, monospace">
                      {d.saidas}
                    </text>
                  </>
                )}

                <text x={xPos} y={padT + chartH + 12} textAnchor="middle"
                  fontSize={isAtual ? 7 : 6} fontWeight={isAtual ? 700 : 400}
                  fill={isAtual ? 'rgba(74,222,128,0.9)' : 'rgba(255,255,255,0.35)'}
                  fontFamily="DM Sans, sans-serif">
                  {d.nome}
                </text>

                {isAtual && (
                  <line x1={xPos} y1={padT} x2={xPos} y2={padT + chartH}
                    stroke="rgba(74,222,128,0.15)" strokeWidth={0.75} strokeDasharray="2,2" />
                )}
              </g>
            )
          })}
        </svg>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 6,
        padding: '0 4px',
      }}>
        <span style={{
          fontSize: 'clamp(8px, 0.6vw, 11px)',
          fontWeight: 700,
          color: 'rgba(74,222,128,0.6)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>
          Histórico do Ano
        </span>
        <div style={{ display: 'flex', gap: 12 }}>
          {[['#4ade80','Entradas'],['#f87171','Saídas']].map(([cor, label]) => (
            <span key={label} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 'clamp(8px, 0.6vw, 11px)',
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              <span style={{ width: 20, height: 2, background: cor, borderRadius: 2, flexShrink: 0 }} />
              {label}
            </span>
          ))}
        </div>
      </div>

    </div>
  )
}