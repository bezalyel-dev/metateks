import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── Banco de linhas de terminal ─────────────────────────────────────────────
const BOOT_LINES = [
  '[    0.000000] Linux version 6.8.0-teks-amd64 (gcc 13.2.0)',
  '[    0.000001] BIOS-provided physical RAM map:',
  '[    0.000002] BIOS-e820: [mem 0x0000000000000000-0x000000000009fbff] usable',
  '[    0.000004] BIOS-e820: [mem 0x0000000000100000-0x00000000bffdffff] usable',
  '[    0.000010] NX (Execute Disable) protection: active',
  '[    0.000011] SMBIOS 3.3 present.',
  '[    0.000015] DMI: teks-systems/DASHBOARD-NODE v2.1, BIOS 1.12.0',
  '[    0.000020] Hypervisor detected: KVM',
  '[    0.000025] clocksource: tsc-early: mask: 0xffffffffffffffff',
  '[    0.000030] Booting paravirtualized kernel on KVM',
  '[    0.000040] setup_percpu: NR_CPUS:512 nr_cpumask_bits:512 nr_cpu_ids:4',
  '[    0.000050] percpu: Embedded 62 pages/cpu s204800 r8192 d28672 u262144',
  '[    0.000060] Built 1 zonelists, mobility grouping on. Total pages: 2031616',
  '[    0.000070] Kernel command line: BOOT_IMAGE=/boot/vmlinuz-6.8.0 root=UUID=a1b2c3d4',
  '[    0.000080] Dentry cache hash table entries: 1048576 (order: 11, 8388608 bytes)',
  '[    0.000090] Inode-cache hash table entries: 524288 (order: 10, 4194304 bytes)',
  '[    0.000100] mem auto-init: stack:all(zero), heap alloc:on, heap free:off',
  '[    0.000110] Memory: 7865244K/8388608K available (18432K kernel code)',
  '[    0.000120] rcu: Hierarchical RCU implementation.',
  '[    0.000130] rcu: RCU restricting CPUs from NR_CPUS=512 to nr_cpu_ids=4.',
  '[    0.000140] rcu: RCU debug extended QS entry/exit.',
  '[    0.000150] Trampoline page is in use — smp_trampoline_base: 0x6000',
  '[    0.000160] printk: legacy console [tty0] enabled',
  '[    0.000170] PCI: CLS 64 bytes, default 64',
  '[    0.000180] PCI: Using configuration type 1 for base access',
  '[    0.000190] clocksource: acpi_pm: mask: 0xffffff max_cycles: 0xffffff',
  '[    0.000200] ACPI: RSDP 0x00000000000F0490 000024 (v02 BOCHS)',
  '[    0.000210] ACPI: IRQ0 used by override.',
  '[    0.000220] ACPI: IRQ9 used by override.',
  '[    0.000230] PCI: Using ACPI for IRQ routing',
  '[    0.000240] NetLabel: Initializing',
  '[    0.000250] NetLabel: domain hash size = 128',
  '[    0.000260] NetLabel: protocols = UNLABELED CIPSOv4 CALIPSO',
  '[    0.000270] Initializing XFRM netlink socket',
  '[    0.000280] NET: Registered PF_INET protocol family',
  '[    0.000290] NET: Registered PF_INET6 protocol family',
  '[    0.000300] audit: initializing netlink subsys (disabled)',
  '[    0.000310] thermal: Intel Powerclamp Driver cooling',
  '[    0.000320] cpuidle: using governor menu',
  '[    0.000330] hw perfevents: enabled with armv8_cortex_a53 PMU driver',
  '[    0.000340] NET: Registered PF_ALG protocol family',
  '[    0.000350] workqueue: bound_workqueue cpumask: 0x00000000000f',
  '[    0.000360] device-mapper: core: MODULE_LICENSE="GPL"',
  '[    0.000370] device-mapper: ioctl: 4.47.0-ioctl initialized',
  '[    0.000380] EXT4-fs (sda1): mounted filesystem with ordered data mode',
  '[    0.000390] systemd[1]: Detected virtualization kvm.',
  '[    0.000400] systemd[1]: Detected architecture x86-64.',
  '',
  'Welcome to teks-os 6.8 LTS (GNU/Linux 6.8.0-teks-amd64)',
  '',
  '[  OK  ] Started systemd-journald.service - Journal Service.',
  '[  OK  ] Mounted dev-hugepages.mount - Huge Pages File System.',
  '[  OK  ] Mounted dev-mqueue.mount - POSIX Message Queue File System.',
  '[  OK  ] Started kmod-static-nodes.service - Create List of Static Device Nodes.',
  '[  OK  ] Finished systemd-tmpfiles-setup.service - Create Volatile Files and Dirs.',
  '[  OK  ] Started systemd-udevd.service - Rule-based Manager for Device Events.',
  '[  OK  ] Reached target sysinit.target - System Initialization.',
  '[  OK  ] Started teks-network.service - Network Interface Manager.',
  '[  OK  ] Started teks-postgres.service - PostgreSQL Database [neon.tech].',
  '[  OK  ] Started teks-redis.service - Redis Cache Server.',
  '[  OK  ] Started teks-api.service - REST API Gateway (Express).',
  '[  OK  ] Started teks-socket.service - Socket.IO Real-Time Server.',
  '[  OK  ] Started teks-scheduler.service - Cron Job Scheduler.',
  '[  OK  ] Reached target network-online.target - Network is Online.',
  '',
  'Mounting /proc/teks/dashboard ... done',
  'Loading dashboard kernel modules ... done',
  'Checking filesystem integrity ... OK',
  'Establishing secure tunnel to dashboard.teks.io ... connected',
  'Verifying JWT token store ... valid',
  'Syncing real-time client data ... 847 records loaded',
  'Compiling React component tree ... done',
  'Hydrating Vite build artifacts ... done',
  '',
  '[ teks-dashboard ] All systems operational.',
  '[ teks-dashboard ] Uptime: 99.98% | Latency: 12ms | Region: sa-east-1',
  '',
  'Launching dashboard interface...',
  '',
  '██╗    ██╗███████╗██╗      ██████╗ ██████╗ ███╗   ███╗███████╗',
  '██║    ██║██╔════╝██║     ██╔════╝██╔═══██╗████╗ ████║██╔════╝',
  '██║ █╗ ██║█████╗  ██║     ██║     ██║   ██║██╔████╔██║█████╗  ',
  '██║███╗██║██╔══╝  ██║     ██║     ██║   ██║██║╚██╔╝██║██╔══╝  ',
  '╚███╔███╔╝███████╗███████╗╚██████╗╚██████╔╝██║ ╚═╝ ██║███████╗',
  ' ╚══╝╚══╝ ╚══════╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝',
  '',
]

// ─── Velocidade de scroll: chars por frame ────────────────────────────────────
const CHARS_PER_TICK = 4   // velocidade de digitação por tick
const TICK_MS        = 8   // intervalo em ms (≈120 fps de texto)
const BOOT_DURATION  = 4000 // ms até redirecionar após último char

export function WormholeEntry() {
  const navigate = useNavigate()

  // Estado da fase: 'idle' | 'typing' | 'booting' | 'done'
  const [phase,       setPhase]       = useState('idle')
  const [inputValue,  setInputValue]  = useState('')
  const [inputError,  setInputError]  = useState(false)
  const [lines,       setLines]       = useState([])
  const [cursor,      setCursor]      = useState(true)

  const inputRef    = useRef(null)
  const outputRef   = useRef(null)
  const tickRef     = useRef(null)
  const charIdxRef  = useRef(0)  // índice global de char no texto completo
  const fullText    = useRef('')  // todo o texto concatenado
  const lineMapRef  = useRef([])  // mapa de onde cada linha começa

  // Cursor piscante
  useEffect(() => {
    const t = setInterval(() => setCursor(c => !c), 530)
    return () => clearInterval(t)
  }, [])

  // Foco no input ao montar
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Scroll automático
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [lines])

  // Prepara o texto completo e o mapa de linhas
  const prepareText = () => {
    let pos = 0
    const map = []
    const full = BOOT_LINES.map(line => {
      map.push(pos)
      pos += line.length + 1 // +1 pelo \n
      return line
    }).join('\n')
    fullText.current  = full
    lineMapRef.current = map
    return full
  }

  // Inicia o boot
  const startBoot = () => {
    setPhase('booting')
    const full = prepareText()
    charIdxRef.current = 0
    setLines([])

    const tick = () => {
      charIdxRef.current = Math.min(
        charIdxRef.current + CHARS_PER_TICK,
        full.length
      )
      const partial = full.slice(0, charIdxRef.current)
      setLines(partial.split('\n'))

      if (charIdxRef.current < full.length) {
        tickRef.current = setTimeout(tick, TICK_MS)
      } else {
        // Terminou de escrever, aguarda e redireciona
        setPhase('done')
        setTimeout(() => navigate('/tv'), BOOT_DURATION)
      }
    }
    tickRef.current = setTimeout(tick, TICK_MS)
  }

  useEffect(() => {
    return () => clearTimeout(tickRef.current)
  }, [])

  const handleInput = (e) => {
    if (phase !== 'idle') return
    setInputValue(e.target.value)
    setInputError(false)
  }

  const handleKeyDown = (e) => {
    if (e.key !== 'Enter') return
    const val = inputValue.trim().toLowerCase()
    if (val === 'start') {
      startBoot()
    } else {
      setInputError(true)
      setTimeout(() => setInputError(false), 600)
    }
  }

  return (
    <div style={s.root} onClick={() => inputRef.current?.focus()}>
      <div style={s.terminal}>

        {/* ── Barra de título ── */}
        <div style={s.titleBar}>
          <div style={s.dots}>
            <span style={{ ...s.dot, background: '#ff5f57' }} />
            <span style={{ ...s.dot, background: '#ffbd2e' }} />
            <span style={{ ...s.dot, background: '#28c840' }} />
          </div>
          <span style={s.titleText}>teks@dashboard: ~</span>
          <div style={{ width: 52 }} />
        </div>

        {/* ── Corpo do terminal ── */}
        <div style={s.body} ref={outputRef}>

          {/* Cabeçalho fixo quando idle */}
          {phase === 'idle' && (
            <div style={s.idleHeader}>
              <pre style={s.ascii}>{ASCII_LOGO}</pre>
              <p style={s.hint}>
                <span style={s.green}>teks@dashboard</span>
                <span style={s.white}>:</span>
                <span style={s.blue}>~</span>
                <span style={s.white}>$ </span>
                <span style={s.dim}>Digite </span>
                <span style={s.green}>start</span>
                <span style={s.dim}> e pressione </span>
                <span style={s.white}>Enter</span>
                <span style={s.dim}> ou clique em </span>
                <button
                  onClick={e => { e.stopPropagation(); startBoot() }}
                  style={s.inlineBtn}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,200,0,0.2)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(0,255,0,0.3)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,200,0,0.08)'; e.currentTarget.style.boxShadow = '0 0 6px rgba(0,255,0,0.15)' }}
                >
                  ▶ iniciar
                </button>
              </p>
            </div>
          )}

          {/* Linhas de boot */}
          {lines.map((line, i) => (
            <div key={i} style={s.line}>
              <span style={getLineStyle(line)}>{line || '\u00A0'}</span>
            </div>
          ))}

          {/* Cursor piscante na última linha do boot */}
          {phase === 'booting' && (
            <span style={{ ...s.cursorBlock, opacity: cursor ? 1 : 0 }}>█</span>
          )}

          {/* Mensagem final */}
          {phase === 'done' && (
            <div style={s.line}>
              <span style={{ ...s.green, fontWeight: 700 }}>
                ▶ Redirecionando para o dashboard...
              </span>
              <span style={{ ...s.cursorBlock, opacity: cursor ? 1 : 0 }}>█</span>
            </div>
          )}

          {/* Input interativo (apenas no idle) */}
          {phase === 'idle' && (
            <div style={s.inputRow}>
              <span style={s.green}>teks@dashboard</span>
              <span style={s.white}>:</span>
              <span style={s.blue}>~</span>
              <span style={s.white}>$ </span>
              <input
                ref={inputRef}
                value={inputValue}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                style={{
                  ...s.input,
                  ...(inputError ? s.inputError : {}),
                }}
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
              />
              <span style={{ ...s.cursorBlock, opacity: cursor ? 1 : 0 }}>█</span>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ─── Colorização por tipo de linha ───────────────────────────────────────────
function getLineStyle(line) {
  if (line.startsWith('[  OK  ]'))   return { color: '#00cc00', textShadow: '0 0 6px rgba(0,200,0,0.4)' }
  if (line.startsWith('[ WARN ]'))   return { color: '#aacc00', textShadow: '0 0 6px rgba(150,200,0,0.4)' }
  if (line.startsWith('[ FAIL ]'))   return { color: '#cc2200', textShadow: '0 0 6px rgba(200,0,0,0.4)' }
  if (line.startsWith('[    0.'))    return { color: '#1a6b1a' }
  if (line.startsWith('['))          return { color: '#2a8a2a' }
  if (line.startsWith('Welcome'))    return { color: '#00ff00', fontWeight: 700, textShadow: '0 0 10px rgba(0,255,0,0.6)' }
  if (line.startsWith('[ teks'))     return { color: '#00ff00', fontWeight: 600, textShadow: '0 0 8px rgba(0,255,0,0.5)' }
  if (line.startsWith('Launching'))  return { color: '#00ff00', fontWeight: 700, textShadow: '0 0 10px rgba(0,255,0,0.6)' }
  if (line.startsWith('██') || line.startsWith('╚') || line.startsWith(' ╚')) return { color: '#00ff00', fontWeight: 700, textShadow: '0 0 14px rgba(0,255,0,0.8)', letterSpacing: '0.02em' }
  if (line === '')                   return { color: 'transparent' }
  return { color: '#00aa00' }
}

// ─── ASCII Logo ───────────────────────────────────────────────────────────────
const ASCII_LOGO = `
  ████████╗███████╗██╗  ██╗███████╗
     ██╔══╝██╔════╝██║ ██╔╝██╔════╝
     ██║   █████╗  █████╔╝ ███████╗
     ██║   ██╔══╝  ██╔═██╗ ╚════██║
     ██║   ███████╗██║  ██╗███████║
     ╚═╝   ╚══════╝╚═╝  ╚═╝╚══════╝
              dashboard  v2.1.0
`

// ─── Estilos ──────────────────────────────────────────────────────────────────
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
    border: '1px solid #1a3a1a',
    borderRadius: 6,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 0 60px rgba(0,200,0,0.08), 0 24px 80px rgba(0,0,0,0.9)',
  },
  titleBar: {
    background: '#050f05',
    borderBottom: '1px solid #1a3a1a',
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  dots: { display: 'flex', gap: 8, alignItems: 'center' },
  dot:  { width: 12, height: 12, borderRadius: '50%', display: 'inline-block' },
  titleText: {
    fontSize: 12, color: '#3a7a3a', letterSpacing: '0.05em',
  },
  body: {
    flex: 1, overflowY: 'auto', padding: '18px 24px 16px',
    scrollbarWidth: 'thin',
    scrollbarColor: '#1a3a1a #000000',
  },
  idleHeader: { marginBottom: 12 },
  ascii: {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.3,
    color: '#00cc00',
    whiteSpace: 'pre',
    fontFamily: 'inherit',
    textShadow: '0 0 8px rgba(0,200,0,0.5)',
  },
  hint: {
    margin: '10px 0 14px',
    fontSize: 13,
    lineHeight: 1.5,
  },
  line: {
    fontSize: 13,
    lineHeight: 1.7,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 13,
    marginTop: 4,
    flexWrap: 'nowrap',
  },
  input: {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#00ff00',
    fontSize: 13,
    fontFamily: 'inherit',
    flex: 1,
    caretColor: 'transparent',
    padding: 0,
    minWidth: 0,
    transition: 'color 0.15s',
    textShadow: '0 0 6px rgba(0,255,0,0.4)',
  },
  inputError: {
    color: '#ff3333',
    textShadow: '0 0 6px rgba(255,0,0,0.4)',
  },
  cursorBlock: {
    color: '#00ff00',
    fontSize: 14,
    lineHeight: 1,
    transition: 'opacity 0.1s',
    marginLeft: 1,
    textShadow: '0 0 8px rgba(0,255,0,0.8)',
  },
  inlineBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'rgba(0,200,0,0.08)',
    border: '1px solid rgba(0,200,0,0.35)',
    borderRadius: 4,
    color: '#00ff00',
    fontSize: 12,
    fontFamily: 'inherit',
    fontWeight: 600,
    letterSpacing: '0.08em',
    padding: '3px 10px',
    cursor: 'pointer',
    boxShadow: '0 0 6px rgba(0,255,0,0.15)',
    transition: 'background 0.2s, box-shadow 0.2s',
    outline: 'none',
    textShadow: '0 0 6px rgba(0,255,0,0.5)',
    marginLeft: 6,
  },
  green:  { color: '#00cc00', textShadow: '0 0 6px rgba(0,200,0,0.4)' },
  blue:   { color: '#00cc00', textShadow: '0 0 6px rgba(0,200,0,0.4)' },
  white:  { color: '#00ff00', textShadow: '0 0 4px rgba(0,255,0,0.3)' },
  dim:    { color: '#2d6e2d' },
}