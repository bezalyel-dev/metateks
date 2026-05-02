import { useCallback, useEffect, useRef } from 'react'

/**
 * Gerencia o som tocado ao adicionar um novo cliente.
 * A URL é salva no Supabase junto com o restante da config (campo url_som_cliente).
 * A reprodução usa Web Audio API com fetch da URL.
 */
export function useSomCliente({ urlSom, volume = 0.8, habilitado = true }) {
  const bufferRef    = useRef(null)
  const carregadoRef = useRef('')   // URL que está em cache no buffer

  // ── Pré-carrega o buffer sempre que a URL mudar ───────────────────────────
  useEffect(() => {
    if (!urlSom || urlSom === carregadoRef.current) return

    bufferRef.current    = null
    carregadoRef.current = urlSom

    const carregar = async () => {
      try {
        const C   = window.AudioContext || window.webkitAudioContext
        if (!C) return
        const ctx = new C()
        const res = await fetch(urlSom)
        const ab  = await res.arrayBuffer()
        bufferRef.current = await ctx.decodeAudioData(ab)
        await ctx.close()
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
      const C   = window.AudioContext || window.webkitAudioContext
      const ctx = new C()
      if (ctx.state === 'suspended') ctx.resume()

      const gain = ctx.createGain()
      gain.gain.value = volume

      const source = ctx.createBufferSource()
      source.buffer = bufferRef.current
      source.connect(gain)
      gain.connect(ctx.destination)
      source.start(0)
      source.onended = () => ctx.close().catch(() => {})
    } catch {
      // silêncio gracioso
    }
  }, [habilitado, volume])

  return { playSom }
}