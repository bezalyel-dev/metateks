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
    const ctx = new (window.AudioContext || window.webkitAudioContext)()

    // Ruído branco curto (estalo)
    const bufferSize = ctx.sampleRate * 0.18
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2)
    }

    const source = ctx.createBufferSource()
    source.buffer = buffer

    // Filtro bandpass para dar "caráter" ao som
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 800
    filter.Q.value = 0.5

    // Ganho com envelope rápido
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(1.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)

    source.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    source.start()
    source.stop(ctx.currentTime + 0.2)

    // Tom "whoosh" ascendente
    const osc = ctx.createOscillator()
    const oscGain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(220, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.12)
    oscGain.gain.setValueAtTime(0.4, ctx.currentTime)
    oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    osc.connect(oscGain)
    oscGain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.15)
  } catch {
    // Navegadores sem Web Audio API — silêncio gracioso
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