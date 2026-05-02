import { useCallback, useEffect, useRef } from 'react'

export function useSomCliente({ urlSom, volume = 0.8, habilitado = true }) {
  const bufferRef    = useRef(null)
  const carregadoRef = useRef('')
  const ctxRef       = useRef(null)  // AudioContext persistente

  // ── Cria/desbloqueia o AudioContext no primeiro gesto do usuário ──────────
  useEffect(() => {
    const desbloquear = () => {
      if (ctxRef.current) {
        if (ctxRef.current.state === 'suspended') ctxRef.current.resume()
        return
      }
      const C = window.AudioContext || window.webkitAudioContext
      if (!C) return
      ctxRef.current = new C()
    }

    window.addEventListener('click',     desbloquear, { once: false })
    window.addEventListener('touchstart', desbloquear, { once: false })
    window.addEventListener('keydown',    desbloquear, { once: false })

    return () => {
      window.removeEventListener('click',     desbloquear)
      window.removeEventListener('touchstart', desbloquear)
      window.removeEventListener('keydown',    desbloquear)
    }
  }, [])

  // ── Pré-carrega o buffer sempre que a URL mudar ───────────────────────────
  useEffect(() => {
    if (!urlSom || urlSom === carregadoRef.current) return

    bufferRef.current    = null
    carregadoRef.current = urlSom

    const carregar = async () => {
      try {
        const C = window.AudioContext || window.webkitAudioContext
        if (!C) return
        // Usa contexto temporário só para decodificar
        const tmpCtx = new C()
        const res = await fetch(urlSom)
        const ab  = await res.arrayBuffer()
        bufferRef.current = await tmpCtx.decodeAudioData(ab)
        await tmpCtx.close()
      } catch {
        bufferRef.current = null
      }
    }

    carregar()
  }, [urlSom])

  // ── Reprodução ────────────────────────────────────────────────────────────
  const playSom = useCallback(() => {
    if (!habilitado || !bufferRef.current) return
    try {
      const C = window.AudioContext || window.webkitAudioContext
      const ctx = ctxRef.current ?? new C()
      ctxRef.current = ctx

      if (ctx.state === 'suspended') ctx.resume()

      const gain = ctx.createGain()
      gain.gain.value = volume

      const source = ctx.createBufferSource()
      source.buffer = bufferRef.current
      source.connect(gain)
      gain.connect(ctx.destination)
      source.start(0)
    } catch {
      // silêncio gracioso
    }
  }, [habilitado, volume])

  return { playSom }
}