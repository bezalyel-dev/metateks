import { useEffect, useRef, useState, useCallback } from 'react'


// ─── Ícones inline ────────────────────────────────────────────────────────────


function IconExpand() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  )
}


function IconCompress() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 14 10 14 10 20" />
      <polyline points="20 10 14 10 14 4" />
      <line x1="10" y1="14" x2="3" y2="21" />
      <line x1="21" y1="3" x2="14" y2="10" />
    </svg>
  )
}


// ─── CSS fullscreen: injeta/remove estilo global no <html> ────────────────────
// Usado como fallback quando a API nativa não existe ou falha (ex: Smart TVs).


const CSS_FULLSCREEN_ID = '__css-fullscreen-style__'


function applyCssFullscreen() {
  if (document.getElementById(CSS_FULLSCREEN_ID)) return
  const style = document.createElement('style')
  style.id = CSS_FULLSCREEN_ID
  style.textContent = `
    html, body {
      overflow: hidden !important;
      width: 100vw !important;
      height: 100vh !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    ::-webkit-scrollbar { display: none !important; }
  `
  document.head.appendChild(style)
}


function removeCssFullscreen() {
  document.getElementById(CSS_FULLSCREEN_ID)?.remove()
}


// ─── Scroll trick ─────────────────────────────────────────────────────────────
// Em muitos browsers mobile e de TV, rolar a página 1px para baixo faz a barra
// do navegador sumir automaticamente. Simples e sem permissões.


function triggerScrollHide() {
  setTimeout(() => window.scrollTo({ top: 1, behavior: 'instant' }), 100)
}


// ─── Hook principal ───────────────────────────────────────────────────────────


function useUniversalFullscreen() {
  // 'api' = usando requestFullscreen nativa
  // 'css' = usando CSS + scroll trick (fallback)
  // null  = não está em fullscreen
  const [mode, setMode] = useState(null)
  const isFullscreen = mode !== null


  const apiSupported =
    typeof document !== 'undefined' &&
    !!(
      document.documentElement.requestFullscreen ||
      document.documentElement.webkitRequestFullscreen ||
      document.documentElement.mozRequestFullScreen ||
      document.documentElement.msRequestFullscreen
    )


  // Detecta ESC ou saída nativa do fullscreen
  useEffect(() => {
    const onNativeChange = () => {
      const stillActive = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      )
      if (!stillActive && mode === 'api') setMode(null)
    }
    document.addEventListener('fullscreenchange', onNativeChange)
    document.addEventListener('webkitfullscreenchange', onNativeChange)
    document.addEventListener('mozfullscreenchange', onNativeChange)
    document.addEventListener('MSFullscreenChange', onNativeChange)
    return () => {
      document.removeEventListener('fullscreenchange', onNativeChange)
      document.removeEventListener('webkitfullscreenchange', onNativeChange)
      document.removeEventListener('mozfullscreenchange', onNativeChange)
      document.removeEventListener('MSFullscreenChange', onNativeChange)
    }
  }, [mode])


  // Remove CSS ao desmontar o componente
  useEffect(() => () => removeCssFullscreen(), [])


  const enter = useCallback(async () => {
    if (apiSupported) {
      try {
        const el = document.documentElement
        if (el.requestFullscreen) await el.requestFullscreen()
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen()
        else if (el.mozRequestFullScreen) await el.mozRequestFullScreen()
        else if (el.msRequestFullscreen) await el.msRequestFullscreen()
        setMode('api')
        return
      } catch {
        // API existe mas falhou (comum em TVs) → cai no CSS fallback abaixo
      }
    }
    // Fallback universal
    applyCssFullscreen()
    triggerScrollHide()
    setMode('css')
  }, [apiSupported])


  const exit = useCallback(async () => {
    if (mode === 'api') {
      try {
        if (document.exitFullscreen) await document.exitFullscreen()
        else if (document.webkitExitFullscreen) await document.webkitExitFullscreen()
        else if (document.mozCancelFullScreen) await document.mozCancelFullScreen()
        else if (document.msExitFullscreen) await document.msExitFullscreen()
      } catch { /* ignora */ }
    } else if (mode === 'css') {
      removeCssFullscreen()
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
    setMode(null)
  }, [mode])


  const toggle = useCallback(
    () => (isFullscreen ? exit() : enter()),
    [isFullscreen, enter, exit]
  )


  return { isFullscreen, toggle, mode }
}


// ─── Componente ───────────────────────────────────────────────────────────────


/**
 * Botão flutuante de fullscreen universal.
 *
 * Estratégia em cascata:
 *  1. requestFullscreen() nativa  → desktop Chrome/Firefox/Edge, mobile, alguns Smart TVs
 *  2. CSS overflow:hidden + scroll trick → LG WebOS, Tizen, Android TV browser e similares
 *
 * Props:
 *  - position  : 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'  (padrão: 'top-right')
 *  - hideAfter : ms de inatividade para ocultar o botão. 0 = nunca some.    (padrão: 4000)
 */
export function FullscreenButton({ position = 'top-right', hideAfter = 4000 }) {
  const { isFullscreen, toggle, mode } = useUniversalFullscreen()
  // FIX: inicia true — o botão começa visível e só some após inatividade real do usuário.
  const [visible, setVisible] = useState(true)
  const timerRef = useRef(null)


  // Auto-hide por inatividade do mouse/toque
  useEffect(() => {
    if (!hideAfter) return


    const resetTimer = () => {
      setVisible(true)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setVisible(false), hideAfter)
    }


    // FIX: removido o resetTimer() inicial que disparava o countdown desde o mount
    // sem que o usuário tivesse interagido com a página. Agora o botão só começa
    // a contar o tempo após a primeira interação real (mousemove, click, etc.).
    window.addEventListener('mousemove', resetTimer)
    window.addEventListener('touchstart', resetTimer)
    window.addEventListener('keydown', resetTimer)
    window.addEventListener('click', resetTimer)


    return () => {
      clearTimeout(timerRef.current)
      window.removeEventListener('mousemove', resetTimer)
      window.removeEventListener('touchstart', resetTimer)
      window.removeEventListener('keydown', resetTimer)
      window.removeEventListener('click', resetTimer)
    }
  }, [hideAfter])


  const posMap = {
    'top-right':    { top: '1rem', right: '1rem' },
    'top-left':     { top: '1rem', left: '1rem' },
    'bottom-right': { bottom: '1rem', right: '1rem' },
    'bottom-left':  { bottom: '1rem', left: '1rem' },
  }
  const posStyle = posMap[position] ?? posMap['top-right']


  return (
    <button
      onClick={toggle}
      title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
      aria-label={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
      style={{
        position: 'fixed',
        zIndex: 9999,
        ...posStyle,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.5s ease, transform 0.2s ease, box-shadow 0.2s ease',
        background: 'rgba(3, 20, 10, 0.78)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid rgba(74, 222, 128, 0.3)',
        borderRadius: '12px',
        padding: '10px',
        cursor: 'pointer',
        color: '#4ade80',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 18px rgba(34,197,94,0.18)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(22, 101, 52, 0.85)'
        e.currentTarget.style.boxShadow = '0 0 28px rgba(74,222,128,0.4)'
        e.currentTarget.style.transform = 'scale(1.08)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(3, 20, 10, 0.78)'
        e.currentTarget.style.boxShadow = '0 0 18px rgba(34,197,94,0.18)'
        e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      {isFullscreen ? <IconCompress /> : <IconExpand />}


      {/* Badge opcional: indica quando está rodando no modo CSS (útil para debug em TV) */}
      {mode === 'css' && (
        <span style={{
          position: 'absolute',
          bottom: '-6px',
          right: '-4px',
          fontSize: '8px',
          background: '#16a34a',
          color: '#fff',
          borderRadius: '4px',
          padding: '1px 3px',
          lineHeight: 1.4,
          pointerEvents: 'none',
        }}>
          CSS
        </span>
      )}
    </button>
  )
}