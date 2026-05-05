import { useEffect, useRef } from 'react'

export function AnimatedBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    // Cache grid spacing — só recalcula no resize
    let gridSpacing = { x: 0, y: 0 }

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      gridSpacing = {
        x: Math.round(canvas.width  / 18),
        y: Math.round(canvas.height / 12),
      }
    }
    resize()
    window.addEventListener('resize', resize)

    /* ── Orbs ─────────────────────────────────────────────── */
    const orbs = [
      { x: 0.12, y: 0.25, r: 0.38, color: [34, 197, 94],  opacity: 0.18, phase: 0,    speed: 0.00055, driftX: 90,  driftY: 55 },
      { x: 0.82, y: 0.70, r: 0.30, color: [16, 185, 129], opacity: 0.14, phase: 1.8,  speed: 0.00075, driftX: 70,  driftY: 45 },
      { x: 0.50, y: 0.10, r: 0.22, color: [74, 222, 128], opacity: 0.11, phase: 3.2,  speed: 0.00050, driftX: 60,  driftY: 35 },
      { x: 0.90, y: 0.15, r: 0.18, color: [0,  242, 255], opacity: 0.09, phase: 4.5,  speed: 0.00065, driftX: 50,  driftY: 30 },
      { x: 0.08, y: 0.80, r: 0.20, color: [52, 211, 153], opacity: 0.10, phase: 2.1,  speed: 0.00045, driftX: 55,  driftY: 40 },
    ]

    /* ── Partículas variadas ──────────────────────────────── */
    const makeParticle = (w, h) => {
      const kind = Math.random()
      return {
        x:     Math.random() * w,
        y:     Math.random() * h,
        r:     kind < 0.5 ? Math.random() * 1.8 + 0.4   // pequenas
             : kind < 0.8 ? Math.random() * 3.5 + 1.5   // médias
             :               Math.random() * 5.0 + 3.0,  // grandes (raras)
        vx:    (Math.random() - 0.5) * 0.4,
        vy:   -(Math.random() * 0.55 + 0.08),
        alpha: Math.random() * 0.55 + 0.12,
        // cor: maioria verde, alguns ciano
        hue:   Math.random() < 0.8
               ? `rgba(134,239,172,`   // green-300
               : `rgba(0,242,255,`,    // cyan
        // pulso individual
        pulseSpeed: Math.random() * 0.03 + 0.008,
        pulsePhase: Math.random() * Math.PI * 2,
        // trilha (algumas partículas maiores deixam rastro)
        trail: kind > 0.8,
        prevX: 0, prevY: 0,
      }
    }

    const PARTICLE_COUNT = 55
    let particles = Array.from({ length: PARTICLE_COUNT }, () =>
      makeParticle(canvas.width, canvas.height)
    )

    /* ── Loop ─────────────────────────────────────────────── */
    let raf, t = 0

    const draw = () => {
      t++
      const W = canvas.width
      const H = canvas.height

      ctx.clearRect(0, 0, W, H)

      /* fundo base — gradiente radial do centro + linear diagonal */
      const radGrad = ctx.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.45, Math.max(W, H) * 0.75)
      radGrad.addColorStop(0,   '#082010')
      radGrad.addColorStop(0.5, '#051509')
      radGrad.addColorStop(1,   '#030f07')
      ctx.fillStyle = radGrad
      ctx.fillRect(0, 0, W, H)

      /* orbs */
      for (const o of orbs) {
        const r  = Math.min(W, H) * o.r
        const cx = o.x * W + Math.sin(t * o.speed + o.phase) * o.driftX
        const cy = o.y * H + Math.cos(t * o.speed * 1.4 + o.phase) * o.driftY
        // pulso de opacidade suave
        const pulse = 0.85 + 0.15 * Math.sin(t * 0.008 + o.phase)
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
        const [r1, g1, b1] = o.color
        g.addColorStop(0,   `rgba(${r1},${g1},${b1},${o.opacity * pulse * 1.6})`)
        g.addColorStop(0.4, `rgba(${r1},${g1},${b1},${o.opacity * pulse})`)
        g.addColorStop(1,   `rgba(${r1},${g1},${b1},0)`)
        ctx.fillStyle = g
        ctx.fillRect(0, 0, W, H)
      }

      /* grid — só linhas primárias, strokeStyle unificado por frame */
      const { x: sx, y: sy } = gridSpacing
      const shimmer = 0.07 + 0.04 * Math.sin(t * 0.004)

      ctx.lineWidth = 0.8
      ctx.strokeStyle = `rgba(74,222,128,${shimmer})`
      ctx.beginPath()
      for (let x = 0; x < W; x += sx) {
        ctx.moveTo(x, 0)
        ctx.lineTo(x, H)
      }
      for (let y = 0; y < H; y += sy) {
        ctx.moveTo(0, y)
        ctx.lineTo(W, y)
      }
      ctx.stroke()

      /* pontos de interseção — opacidade única por frame */
      const dotGlow = 0.12 + 0.10 * Math.sin(t * 0.005)
      ctx.globalAlpha = dotGlow
      ctx.fillStyle = 'rgba(134,239,172,0.18)'
      for (let x = 0; x < W; x += sx) {
        for (let y = 0; y < H; y += sy) {
          ctx.beginPath()
          ctx.arc(x, y, 1.2, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1

      /* partículas */
      if (particles.length > 0 && particles[0].prevX === 0) {
        for (const p of particles) { p.prevX = p.x; p.prevY = p.y }
      }

      for (const p of particles) {
        p.prevX = p.x; p.prevY = p.y
        p.x += p.vx; p.y += p.vy

        // reposicionar ao sair da tela
        if (p.y < -10) {
          p.y = H + 10
          p.x = Math.random() * W
          p.prevX = p.x; p.prevY = p.y
        }
        if (p.x < -10)  { p.x = W + 10; p.prevX = p.x }
        if (p.x > W+10) { p.x = -10;    p.prevX = p.x }

        // pulso de opacidade
        const pulse = p.alpha * (0.7 + 0.3 * Math.sin(t * p.pulseSpeed + p.pulsePhase))

        // trilha para partículas grandes
        if (p.trail && p.r > 3) {
          ctx.beginPath()
          ctx.moveTo(p.prevX, p.prevY)
          ctx.lineTo(p.x, p.y)
          ctx.strokeStyle = `${p.hue}${pulse * 0.4})`
          ctx.lineWidth = p.r * 0.5
          ctx.stroke()
        }

        // círculo principal
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `${p.hue}${pulse})`
        ctx.fill()

        // halo apenas pra partículas grandes (r > 3.5) — reduz ~40% dos halos
        if (p.r > 3.5) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r * 2.2, 0, Math.PI * 2)
          ctx.fillStyle = `${p.hue}${pulse * 0.12})`
          ctx.fill()
        }
      }

      if (particles.length < PARTICLE_COUNT) {
        particles = Array.from({ length: PARTICLE_COUNT }, () => makeParticle(W, H))
      }

      raf = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{ width: '100vw', height: '100vh', display: 'block' }}
    />
  )
}