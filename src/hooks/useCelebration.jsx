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

    const now = ctx.currentTime

    // ── Master + Compressor ────────────────────────────────────────
    const compressor = ctx.createDynamicsCompressor()
    compressor.threshold.setValueAtTime(-20, now)
    compressor.knee.setValueAtTime(8, now)
    compressor.ratio.setValueAtTime(14, now)
    compressor.attack.setValueAtTime(0.001, now)
    compressor.release.setValueAtTime(0.15, now)
    compressor.connect(ctx.destination)

    const master = ctx.createGain()
    master.gain.setValueAtTime(2.6, now)
    master.connect(compressor)

    // ── Distorção leve para timbre metálico de corneta ─────────────
    const shaper = ctx.createWaveShaper()
    const CURVE = 512
    const curve = new Float32Array(CURVE)
    for (let i = 0; i < CURVE; i++) {
      const x = (i / (CURVE - 1)) * 2 - 1
      curve[i] = Math.tanh(x * 2.0)
    }
    shaper.curve = curve
    shaper.oversample = '4x'
    shaper.connect(master)

    // ── Filtro passa-banda: corta graves e agudos, realça médio-alto ─
    const bandpass = ctx.createBiquadFilter()
    bandpass.type = 'bandpass'
    bandpass.frequency.setValueAtTime(1200, now)
    bandpass.Q.setValueAtTime(0.7, now)
    bandpass.connect(shaper)

    // ── PeriodicWave de brass (harmônicos de corneta/trompete) ──────
    const real = new Float32Array([0, 1.0, 0.7, 0.5, 0.35, 0.2, 0.12, 0.07, 0.04])
    const imag = new Float32Array(real.length)
    const brassWave = ctx.createPeriodicWave(real, imag)

    // ── Toca uma nota com envelope ADSR ────────────────────────────
    const playNote = (freq, startTime, duration, volume = 1.0) => {
      const osc = ctx.createOscillator()
      osc.setPeriodicWave(brassWave)
      osc.frequency.setValueAtTime(freq, startTime)

      // Detune mínimo para humanizar
      osc.detune.setValueAtTime((Math.random() - 0.5) * 6, startTime)

      const g = ctx.createGain()
      const attack  = 0.018
      const release = 0.06

      g.gain.setValueAtTime(0.0001, startTime)
      g.gain.linearRampToValueAtTime(volume, startTime + attack)
      g.gain.setValueAtTime(volume * 0.88, startTime + attack + 0.01)
      g.gain.setValueAtTime(volume * 0.88, startTime + duration - release)
      g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

      osc.connect(g)
      g.connect(bandpass)

      osc.start(startTime)
      osc.stop(startTime + duration + 0.05)
    }

    // ── Sequência "Corneta Atenção" ────────────────────────────────
    // Notas: Sol4 · Sol4 · Sol4 · Do5 · Mi5 · Sol5 · Do6(longa)
    // Frequências:  392   392   392   523   659   784   1047
    const bpm     = 160                     // andamento
    const beat    = 60 / bpm               // 0.375s por beat

    playNote(392,  now + 0.00,          beat * 0.45)   // Sol4
    playNote(392,  now + beat * 0.5,    beat * 0.45)   // Sol4
    playNote(392,  now + beat * 1.0,    beat * 0.45)   // Sol4
    playNote(523,  now + beat * 1.5,    beat * 0.45)   // Do5
    playNote(659,  now + beat * 2.0,    beat * 0.45)   // Mi5
    playNote(784,  now + beat * 2.5,    beat * 0.45)   // Sol5
    playNote(1047, now + beat * 3.0,    beat * 2.8)    // Do6 — nota longa final

    setTimeout(() => ctx.close().catch(() => {}), 4000)
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