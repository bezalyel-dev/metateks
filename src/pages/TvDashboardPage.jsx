import { useEffect, useRef, useState } from 'react'
import { DEFAULT_DASHBOARD_CONFIG, fetchDashboardConfig } from '../lib/dashboardConfig'
import { supabase, supabaseEnvError } from '../lib/supabaseClient'
import { useCelebration } from '../hooks/useCelebration'
import { useSomCliente } from '../hooks/Usesomcliente'
import { FullscreenButton } from './components/FullscreenButton'
import { LiveClock } from './components/LiveClock'

function toSafeInt(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? fallback : parsed
}


// ─── Fundo animado ────────────────────────────────────────────────────────────

function AnimatedBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2.2 + 0.5,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -(Math.random() * 0.4 + 0.1),
      alpha: Math.random() * 0.5 + 0.15,
    }))

    const orbs = [
      { x: 0.15, y: 0.3,  r: 320, color: 'rgba(34,197,94,0.13)',  phase: 0,   speed: 0.0007 },
      { x: 0.8,  y: 0.65, r: 280, color: 'rgba(16,185,129,0.10)', phase: 1.5, speed: 0.0009 },
      { x: 0.5,  y: 0.15, r: 200, color: 'rgba(74,222,128,0.08)', phase: 3,   speed: 0.0006 },
    ]

    let raf, t = 0

    const draw = () => {
      t++
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      bg.addColorStop(0, '#030f07')
      bg.addColorStop(0.5, '#061a0d')
      bg.addColorStop(1, '#040d09')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      for (const orb of orbs) {
        const cx = orb.x * canvas.width  + Math.sin(t * orb.speed + orb.phase) * 80
        const cy = orb.y * canvas.height + Math.cos(t * orb.speed * 1.3 + orb.phase) * 50
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, orb.r)
        grad.addColorStop(0, orb.color)
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      ctx.strokeStyle = 'rgba(34,197,94,0.04)'
      ctx.lineWidth = 1
      const spacing = 60
      for (let x = 0; x < canvas.width; x += spacing) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke()
      }
      for (let y = 0; y < canvas.height; y += spacing) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke()
      }

      for (const p of particles) {
        p.x += p.vx; p.y += p.vy
        if (p.y < -5) { p.y = canvas.height + 5; p.x = Math.random() * canvas.width }
        if (p.x < -5) p.x = canvas.width + 5
        if (p.x > canvas.width + 5) p.x = -5
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(134,239,172,${p.alpha})`
        ctx.fill()
      }

      raf = requestAnimationFrame(draw)
    }

    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{ width: '100vw', height: '100vh' }}
    />
  )
}


// ─── Flash vermelho ao remover cliente ────────────────────────────────────────

function RedFlashOverlay({ active }) {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-50"
      style={{
        background: 'radial-gradient(ellipse at center, rgba(220,38,38,0.6) 0%, rgba(153,27,27,0.4) 40%, rgba(100,0,0,0.2) 70%, transparent 100%)',
        opacity: active ? 1 : 0,
        transition: active
          ? 'opacity 0.05s ease-in'
          : 'opacity 1.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    />
  )
}



// ─── Número animado ───────────────────────────────────────────────────────────

function AnimatedClientsCount({ value }) {
  const [displayValue, setDisplayValue] = useState(value)
  const [previousValue, setPreviousValue] = useState(value)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (value === displayValue) return
    setPreviousValue(displayValue)
    setDisplayValue(value)
    setAnimating(true)
    const id = setTimeout(() => setAnimating(false), 480)
    return () => clearTimeout(id)
  }, [value, displayValue])

  return (
    <span className="relative inline-block min-h-[1.2em] min-w-[4ch] align-middle">
      {animating && (
        <span className="pointer-events-none absolute inset-0 animate-[fadeSlideOut_480ms_ease_forwards]">
          {previousValue}
        </span>
      )}
      <span className={animating ? 'inline-block animate-[fadeSlideIn_480ms_ease]' : 'inline-block'}>
        {displayValue}
      </span>
    </span>
  )
}


// ─── Card de meta ─────────────────────────────────────────────────────────────

function GoalCard({ title, novos, meta, progress, gradient, glowColor }) {
  const circumference = 2 * Math.PI * 54
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <article
      className="relative overflow-hidden rounded-3xl p-6 md:p-7"
      style={{
        background: 'rgba(3, 20, 10, 0.75)',
        backdropFilter: 'blur(18px)',
        border: '1px solid rgba(74,222,128,0.18)',
        boxShadow: `0 0 40px ${glowColor}22, inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-25 blur-3xl"
        style={{ background: glowColor }}
      />

      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke="url(#donutGrad)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)' }}
            />
            <defs>
              <linearGradient id="donutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor={gradient[0]} />
                <stop offset="100%" stopColor={gradient[1]} />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black leading-none" style={{ color: gradient[0] }}>
              {progress}%
            </span>
          </div>
        </div>

        <div className="flex-1">
          <p className="text-sm font-semibold uppercase tracking-widest text-green-400/70">{title}</p>
          <p className="mt-2 text-4xl font-black leading-none text-white">
            {novos}
            <span className="ml-1 text-xl font-medium text-white/40">/ {meta}</span>
          </p>
          <p className="mt-1 text-sm text-white/50">novos clientes</p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${gradient[0]}, ${gradient[1]})`,
                boxShadow: `0 0 8px ${gradient[1]}88`,
                transition: 'width 1s cubic-bezier(.4,0,.2,1)',
              }}
            />
          </div>
        </div>
      </div>
    </article>
  )
}


// ─── Card clientes no ano ─────────────────────────────────────────────────────

function ClientesAnoCard({ ano, valor, glowColor }) {
  return (
    <article
      className="relative overflow-hidden rounded-3xl p-6 md:p-7"
      style={{
        background: 'rgba(3, 20, 10, 0.75)',
        backdropFilter: 'blur(18px)',
        border: '1px solid rgba(74,222,128,0.18)',
        boxShadow: `0 0 40px ${glowColor}22, inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-25 blur-3xl"
        style={{ background: glowColor }}
      />

      <div className="flex h-full flex-col items-center justify-center gap-3 py-2 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-green-400/70">
          Clientes em {ano}
        </p>

        <p
          className="font-black leading-none tabular-nums"
          style={{
            fontSize: 'clamp(48px, 5vw, 72px)',
            color: '#ffffff',
            textShadow: `0 0 40px ${glowColor}99, 0 0 80px ${glowColor}44`,
            letterSpacing: '-0.02em',
          }}
        >
          {valor}
        </p>

        <p className="text-sm font-medium text-white/40">novos clientes</p>
      </div>
    </article>
  )
}


// ─── Página principal ─────────────────────────────────────────────────────────

export function TvDashboardPage() {
  const [config, setConfig] = useState(DEFAULT_DASHBOARD_CONFIG)
  const [loadError, setLoadError] = useState('')
  const prevTotalRef = useRef(null)
  const { triggerCelebration, CelebrationCanvas } = useCelebration()

  const { playSom } = useSomCliente({
    urlSom:    config.url_som_cliente ?? '',
    volume:    0.8,
    habilitado: true,
  })

  const [redFlash, setRedFlash] = useState(false)
  const redFlashTimerRef = useRef(null)

  useEffect(() => {
    if (!supabase) {
      setLoadError(supabaseEnvError)
      return
    }

    let isActive = true

    const refreshConfig = async () => {
      try {
        const row = await fetchDashboardConfig(supabase)
        if (row && isActive) {
          setConfig((current) => {
            const currentTimestamp = current?.updated_at ? Date.parse(current.updated_at) : 0
            const nextTimestamp    = row?.updated_at     ? Date.parse(row.updated_at)     : 0
            if (nextTimestamp < currentTimestamp) return current
            return row
          })
          setLoadError('')
        }
      } catch (err) {
        if (isActive) setLoadError(err.message)
      }
    }

    refreshConfig()

    const realtimeChannel = supabase
      .channel('dashboard-config-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'configuracoes_dashboard' }, refreshConfig)
      .subscribe()

    return () => {
      isActive = false
      supabase.removeChannel(realtimeChannel)
    }
  }, [])

  // ── Derivações ──────────────────────────────────────────────────────────────

  const totalClientes = Math.max(0, toSafeInt(config.contagem_atual, 0))
  const clientesMes   = Math.max(0, toSafeInt(config.clientes_mes,   0))
  const clientesAno   = Math.max(0, toSafeInt(config.clientes_ano,   0))
  const metaMensal    = Math.max(0, toSafeInt(config.meta_mensal,    0))
  const metaAnual     = Math.max(0, toSafeInt(config.meta_anual,     0))

  const progressoMensal = metaMensal > 0 ? Math.min(100, Math.round((clientesMes / metaMensal) * 100)) : 0
  const progressoAnual  = metaAnual  > 0 ? Math.min(100, Math.round((clientesAno / metaAnual)  * 100)) : 0

  // ── Detecta adição ou remoção de cliente ────────────────────────────────────

  useEffect(() => {
    if (prevTotalRef.current === null) {
      prevTotalRef.current = totalClientes
      return
    }

    if (totalClientes > prevTotalRef.current) {
      triggerCelebration()
      playSom()
    } else if (totalClientes < prevTotalRef.current) {
      clearTimeout(redFlashTimerRef.current)
      setRedFlash(true)
      redFlashTimerRef.current = setTimeout(() => setRedFlash(false), 80)
    }

    prevTotalRef.current = totalClientes
  }, [totalClientes, triggerCelebration, playSom])

  const mesAtual = new Date().toLocaleDateString('pt-BR', { month: 'long' })
  const anoAtual = new Date().getFullYear()

  return (
    <>
      <style>{`
        html, body, #root {
          background: #030f07 !important;
          margin: 0;
          padding: 0;
          width: 100%;
          min-height: 100%;
        }
      `}</style>
      <AnimatedBackground />
      <CelebrationCanvas />
      <RedFlashOverlay active={redFlash} />
      <FullscreenButton position="top-right" hideAfter={4000} />

      <main
        className="relative z-10 flex flex-col"
        style={{
          fontFamily: config.familia_fonte || "'DM Sans', system-ui, sans-serif",
          minHeight: '100dvh',
          width: '100%',
          backgroundColor: '#030f07',
        }}
      >
        {/* Header */}
        <header className="flex items-center justify-between gap-4 px-8 pt-8 md:px-14 md:pt-10">
          <div className="w-32 md:w-48" />

          <p
              className="text-center text-lg font-black uppercase tracking-[0.4em] md:text-2xl"
              style={{ color: '#4ade80', textShadow: '0 0 20px rgba(74,222,128,0.5)' }}
            >
              Teks Software
            </p>

          {/* Espaço espelhado para centralizar o título */}
          <div className="w-32 md:w-48" />
        </header>

        {/* Contador central */}
        <section className="flex flex-1 flex-col items-center justify-between px-4 py-4 md:py-6" style={{ minHeight: 0 }}>

          {/* Logo central — próxima ao título */}
          {config.url_logo && (
            <img
              src={config.url_logo}
              alt="Logo"
              className="w-auto object-contain"
              style={{
                height: 'clamp(120px, 16vw, 220px)',
                maxWidth: '75%',
              }}
            />
          )}

          {/* Total de clientes */}
          <div className="flex flex-col items-center">
            <p className="mb-1 text-sm font-semibold uppercase tracking-[0.3em] text-green-400/60">
              total de clientes
            </p>
            <h1
              className="text-center font-black leading-none"
              style={{
                fontSize: 'clamp(80px, 22vw, 300px)',
                color: '#ffffff',
                textShadow: '0 0 60px rgba(74,222,128,0.35), 0 0 120px rgba(34,197,94,0.2)',
                letterSpacing: '-0.03em',
              }}
            >
              <AnimatedClientsCount value={totalClientes} />
            </h1>
          </div>

          {/* Relógio — na base da seção */}
          <div className="flex flex-col items-center">
            <div
              className="mb-3 h-px w-32"
              style={{ background: 'linear-gradient(90deg, transparent, #4ade80, transparent)' }}
            />
            <LiveClock />
          </div>

        </section>

        {/* Cards de meta */}
        <div className="grid gap-4 px-4 pb-6 md:grid-cols-3 md:gap-5 md:px-10 md:pb-8 lg:px-14 lg:pb-10">
          <GoalCard
            title={`Meta Mensal — ${mesAtual}`}
            novos={clientesMes}
            meta={metaMensal}
            progress={progressoMensal}
            gradient={['#4ade80', '#22c55e']}
            glowColor="#22c55e"
          />
          <GoalCard
            title={`Meta Anual — ${anoAtual}`}
            novos={clientesAno}
            meta={metaAnual}
            progress={progressoAnual}
            gradient={['#34d399', '#059669']}
            glowColor="#10b981"
          />
          <ClientesAnoCard
            ano={anoAtual}
            valor={clientesAno}
            glowColor="#3b82f6"
          />
        </div>

        {loadError && (
          <div className="px-6 pb-6 text-center text-xs text-green-400/50 md:px-14">{loadError}</div>
        )}


      </main>
    </>
  )
}