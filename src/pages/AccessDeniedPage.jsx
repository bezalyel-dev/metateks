import { useEffect, useState } from 'react'

const SKULL = `
░░░░░░░░░░░░░░░░░░░░░
         ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░
       ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░
      ░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░
     ░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░
     ░▒▒▒▒░░░░░░▒▒▒▒▒▒▒░░░░░░▒▒▒▒▒░
     ░▒▒▒░░ ███ ░░▒▒▒▒░░ ███ ░░▒▒▒░
     ░▒▒░░ █████ ░▒▒▒▒░ █████ ░▒▒▒░
     ░▒▒░░ █████ ░▒▒▒▒░ █████ ░▒▒▒░
     ░▒▒▒░░ ███ ░░▒▒▒▒░░ ███ ░░▒▒▒░
     ░▒▒▒▒░░░░░░▒▒▒▒▒▒▒░░░░░░▒▒▒▒▒░
     ░▒▒▒▒▒▒▒▒▒░░░▄░░░░▒▒▒▒▒▒▒▒▒▒▒░
     ░▒▒▒▒▒▒▒▒░░░███░░░▒▒▒▒▒▒▒▒▒▒▒░
     ░▒▒▒▒▒▒▒▒▒░░░▀░░░░▒▒▒▒▒▒▒▒▒▒▒░
      ░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░
       ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░
         ░░▒▒░░░░░░░░░░░░▒▒▒░░░
           ░░█▒▒▒░█░█░█░▒▒▒█░░
            ░░█████████████░░
            ░░░█░█░█░█░█░░░░
               ░░░░░░░░░░
  ░░░                               ░░░
 ░▒▒▒░                             ░▒▒▒░
░▒▒▒▒▒░                           ░▒▒▒▒▒░
░▒▒▒▒▒▒░                         ░▒▒▒▒▒▒░
 ░▒▒▒▒▒▒▒░                     ░▒▒▒▒▒▒▒░
   ░▒▒▒▒▒▒▒▒▒░             ░▒▒▒▒▒▒▒▒▒░
      ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░
          ░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░
      ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░
   ░▒▒▒▒▒▒▒▒▒▒▒             ░▒▒▒▒▒▒▒▒▒░
 ░▒▒▒▒▒▒▒░                     ░▒▒▒▒▒▒▒░
░▒▒▒▒▒▒░                         ░▒▒▒▒▒▒░
░▒▒▒▒▒░                           ░▒▒▒▒▒░
 ░▒▒▒░                             ░▒▒▒░
  ░░░                               ░░░
`

const ACCESS_DENIED_ASCII = `
 █████╗  ██████╗ ██████╗███████╗███████╗███████╗
██╔══██╗██╔════╝██╔════╝██╔════╝██╔════╝██╔════╝
███████║██║     ██║     █████╗  ███████╗███████╗
██╔══██║██║     ██║     ██╔══╝  ╚════██║╚════██║
██║  ██║╚██████╗╚██████╗███████╗███████║███████║
╚═╝  ╚═╝ ╚═════╝ ╚═════╝╚══════╝╚══════╝╚══════╝

██████╗ ███████╗███╗   ██╗██╗███████╗██████╗
██╔══██╗██╔════╝████╗  ██║██║██╔════╝██╔══██╗
██║  ██║█████╗  ██╔██╗ ██║██║█████╗  ██║  ██║
██║  ██║██╔══╝  ██║╚██╗██║██║██╔══╝  ██║  ██║
██████╔╝███████╗██║ ╚████║██║███████╗██████╔╝
╚═════╝ ╚══════╝╚═╝  ╚═══╝╚═╝╚══════╝╚═════╝
`

const LOG_LINES = [
  '[ FAIL ] Unauthorized access attempt detected.',
  '[ FAIL ] Origin: direct URL injection — /admin/login',
  '[ WARN ] This incident has been logged.',
  '[ WARN ] IP flagged: session terminated.',
  '',
  'teks-security: access denied — no terminal handshake found.',
  'teks-security: required flag "teks_terminal_auth" missing.',
  '',
]

export function AccessDeniedPage() {
  const [lines,   setLines]  = useState([])
  const [showArt, setShowArt] = useState(false)
  const [cursor,  setCursor]  = useState(true)

  useEffect(() => {
    const t = setInterval(() => setCursor(c => !c), 530)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    let i = 0
    const next = () => {
      if (i < LOG_LINES.length) {
        const line = LOG_LINES[i]
        setLines(prev => [...prev, line])
        i++
        setTimeout(next, 180)
      } else {
        setShowArt(true)
      }
    }
    const t = setTimeout(next, 400)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={s.root}>
      <div style={s.terminal}>

        {/* Barra de título */}
        <div style={s.titleBar}>
          <div style={s.dots}>
            <span style={{ ...s.dot, background: '#ff5f57' }} />
            <span style={{ ...s.dot, background: '#ffbd2e' }} />
            <span style={{ ...s.dot, background: '#28c840' }} />
          </div>
          <span style={s.titleText}>teks-security: intrusion detected</span>
          <div style={{ width: 52 }} />
        </div>

        {/* Corpo */}
        <div style={s.body}>

          {/* Linhas de log */}
          {lines.map((line, i) => (
            <div key={i} style={s.line}>
              <span style={getLineStyle(line)}>{line || '\u00A0'}</span>
            </div>
          ))}

          {/* Caveira + ACCESS DENIED */}
          {showArt && (
            <>
              <pre style={s.skull}>{SKULL}</pre>
              <pre style={s.denied}>{ACCESS_DENIED_ASCII}</pre>
              <div style={s.redirectLine}>
                <span style={s.dim}>teks-security: sessão bloqueada — acesso restrito ao terminal.</span>
                <span style={{ ...s.cursorBlock, opacity: cursor ? 1 : 0 }}>█</span>
              </div>
            </>
          )}

          {!showArt && (
            <span style={{ ...s.cursorBlock, opacity: cursor ? 1 : 0 }}>█</span>
          )}

        </div>
      </div>
    </div>
  )
}

function getLineStyle(line) {
  if (!line) return { color: 'transparent' }
  if (line.startsWith('[ FAIL ]')) return { color: '#ff3333', textShadow: '0 0 8px rgba(255,0,0,0.5)', fontWeight: 700 }
  if (line.startsWith('[ WARN ]')) return { color: '#ffaa00', textShadow: '0 0 6px rgba(255,150,0,0.4)' }
  if (line.startsWith('teks-security')) return { color: '#cc0000', textShadow: '0 0 6px rgba(200,0,0,0.4)' }
  if (line === '') return { color: 'transparent' }
  return { color: '#aa0000' }
}

const s = {
  root: {
    position: 'fixed', inset: 0,
    background: '#000000',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'JetBrains Mono','Fira Code','Cascadia Code',monospace",
  },
  terminal: {
    width: '96vw',
    height: '94vh',
    background: '#000000',
    border: '1px solid #3a0000',
    borderRadius: 6,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 0 60px rgba(200,0,0,0.1), 0 24px 80px rgba(0,0,0,0.9)',
  },
  titleBar: {
    background: '#0f0000',
    borderBottom: '1px solid #3a0000',
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  dots: { display: 'flex', gap: 8, alignItems: 'center' },
  dot:  { width: 12, height: 12, borderRadius: '50%', display: 'inline-block' },
  titleText: { fontSize: 12, color: '#7a1a1a', letterSpacing: '0.05em' },
  body: {
    flex: 1, overflowY: 'auto', padding: '18px 24px 16px',
    scrollbarWidth: 'thin',
    scrollbarColor: '#3a0000 #000000',
  },
  line: {
    fontSize: 13,
    lineHeight: 1.8,
    whiteSpace: 'pre-wrap',
  },
  skull: {
    margin: '16px 0 0',
    fontSize: 13,
    lineHeight: 1.2,
    color: '#cc0000',
    textShadow: '0 0 12px rgba(200,0,0,0.6)',
    whiteSpace: 'pre',
    fontFamily: 'inherit',
  },
  denied: {
    margin: '12px 0 0',
    fontSize: 12,
    lineHeight: 1.3,
    color: '#ff0000',
    textShadow: '0 0 16px rgba(255,0,0,0.7)',
    whiteSpace: 'pre',
    fontFamily: 'inherit',
    fontWeight: 700,
  },
  redirectLine: {
    marginTop: 20,
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  cursorBlock: {
    color: '#ff0000',
    fontSize: 14,
    marginLeft: 2,
    textShadow: '0 0 8px rgba(255,0,0,0.8)',
  },
  dim:  { color: '#7a1a1a' },
  red:  { color: '#ff3333', fontWeight: 700, textShadow: '0 0 8px rgba(255,0,0,0.6)' },
}