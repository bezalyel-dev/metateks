/**
 * useCelebration.js
 *
 * Hook que expõe `triggerCelebration()`.
 * Ao chamar, dispara:
 *  - Efeito de fogos de artifício via canvas sobreposto
 *  - Som de "pop" sintetizado via Web Audio API (sem requisição externa)
 *
 * Uso:
 *   const { triggerCelebration, CelebrationCanvas } = useCelebration()
 *   // Monte <CelebrationCanvas /> uma vez na árvore
 *   // Chame triggerCelebration() quando quiser o efeito
 */

import { useCallback, useEffect, useRef } from 'react'

// ─── Síntese de som ──────────────────────────────────────────────────────────

function playFireworkSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    const ctx = new AudioCtx()
    if (ctx.state === 'suspended') ctx.resume()

    function tocarNota(frequencia, inicio, duracao) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(frequencia, inicio)

      gain.gain.setValueAtTime(0, inicio)
      gain.gain.linearRampToValueAtTime(0.4, inicio + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.01, inicio + duracao)

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 3000

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      osc.start(inicio)
      osc.stop(inicio + duracao)
    }

    const tempoInicial = ctx.currentTime
    const freq = 440

    const notas = [
      { t: 0.0, d: 0.15 },
      { t: 0.2, d: 0.15 },
      { t: 0.4, d: 0.15 },
      { t: 0.6, d: 0.15 },
      { t: 0.8, d: 0.6 },
    ]

    notas.forEach((nota) => {
      tocarNota(freq, tempoInicial + nota.t, nota.d)
    })

    setTimeout(() => ctx.close().catch(() => {}), 2000)
  } catch {
    // silêncio gracioso
  }
}

// ─── Partículas ──────────────────────────────────────────────────────────────

function randomBetween(a, b) {
  return a + Math.random() * (b - a)
}

const PALETTE = [
  '#22c55e', // green-500
  '#4ade80', // green-400
  '#86efac', // green-300
  '#fbbf24', // amber-400
  '#f59e0b', // amber-500
  '#34d399', // emerald-400
  '#ffffff',
  '#a3e635', // lime-400
]

function createBurst(x, y) {
  const count = Math.floor(randomBetween(60, 90))
  return Array.from({ length: count }, () => {
    const angle = randomBetween(0, Math.PI * 2)
    const speed = randomBetween(2, 9)
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: randomBetween(0.012, 0.025),
      radius: randomBetween(2, 5),
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      gravity: 0.12,
      trail: [],
    }
  })
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useCelebration() {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const rafRef = useRef(null)
  const activeRef = useRef(false)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    particlesRef.current = particlesRef.current.filter((p) => p.life > 0)

    for (const p of particlesRef.current) {
      // Trail
      p.trail.push({ x: p.x, y: p.y, life: p.life })
      if (p.trail.length > 6) p.trail.shift()

      ctx.beginPath()
      for (let t = 0; t < p.trail.length - 1; t++) {
        const alpha = (t / p.trail.length) * p.life * 0.4
        ctx.strokeStyle = p.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba').replace('#', '')
        // Desenha trail como linha simples
        if (t === 0) {
          ctx.moveTo(p.trail[t].x, p.trail[t].y)
        } else {
          ctx.lineTo(p.trail[t].x, p.trail[t].y)
        }
      }
      ctx.stroke()

      // Partícula
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.radius * p.life, 0, Math.PI * 2)
      ctx.fillStyle = p.color
      ctx.globalAlpha = p.life
      ctx.fill()
      ctx.globalAlpha = 1

      p.x += p.vx
      p.y += p.vy
      p.vy += p.gravity
      p.vx *= 0.98
      p.life -= p.decay
    }

    if (particlesRef.current.length > 0) {
      rafRef.current = requestAnimationFrame(draw)
    } else {
      activeRef.current = false
    }
  }, [])

  const triggerCelebration = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    playFireworkSound()

    // Dispara 3 explosões em posições aleatórias
    const bursts = 3
    for (let i = 0; i < bursts; i++) {
      setTimeout(() => {
        const x = randomBetween(canvas.width * 0.2, canvas.width * 0.8)
        const y = randomBetween(canvas.height * 0.1, canvas.height * 0.5)
        particlesRef.current.push(...createBurst(x, y))

        if (!activeRef.current) {
          activeRef.current = true
          rafRef.current = requestAnimationFrame(draw)
        }
      }, i * 180)
    }
  }, [draw])

  // Ajusta canvas ao tamanho da janela
  useEffect(() => {
    const resize = () => {
      if (!canvasRef.current) return
      canvasRef.current.width = window.innerWidth
      canvasRef.current.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Componente canvas — montado uma vez, não gera re-renders
  function CelebrationCanvas() {
    return (
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-50"
        style={{ width: '100vw', height: '100vh' }}
      />
    )
  }

  return { triggerCelebration, CelebrationCanvas }
}