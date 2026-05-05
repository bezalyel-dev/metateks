import { FullscreenButton } from '../FullscreenButton'
import { LiveClock } from '../LiveClock'
import { AnimatedBackground } from './AnimatedBackground'
import { RedFlashOverlay } from './Overlays'
import { AnimatedClientsCount } from './AnimatedClientsCount'
import { GoalCard } from './GoalCard'
import { ClientesAnoCard } from './ClientesAnoCard'

const ELECTRIC_CSS = `
  @property --ea {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }
  @keyframes ea-rot     { to { --ea: 360deg; } }
  @keyframes ea-rot-rev { to { --ea: -360deg; } }
  @keyframes ea-pulse   { 0%,100% { opacity:.55 } 50% { opacity:.9 } }

  .ec-wrap {
    position: relative;
    border-radius: 24px;
    isolation: isolate;
    display: flex;
    flex-direction: column;
  }
  .ec-wrap > article {
    flex: 1;
  }
  .ec-wrap::before {
    content: '';
    position: absolute;
    inset: -1.5px;
    border-radius: 25.5px;
    background: conic-gradient(
      from var(--ea),
      #4ade80, #22c55e, #4ade80,
      transparent,
      #4ade80, #22c55e, #4ade80
    );
    animation: ea-rot 2.5s linear infinite;
    will-change: --ea;
    z-index: -2;
  }
  .ec-wrap::after {
    content: '';
    position: absolute;
    inset: 1.5px;
    border-radius: 22.5px;
    background: #030f07;
    z-index: -1;
  }
  .ec-glow {
    position: absolute;
    inset: -10px;
    border-radius: 34px;
    background: conic-gradient(
      from var(--ea),
      #4ade8055, transparent 30%,
      #22c55e33, transparent 60%,
      #4ade8055
    );
    animation: ea-rot 2.5s linear infinite, ea-pulse 1.8s ease-in-out infinite;
    filter: blur(4px);
    will-change: --ea, opacity;
    z-index: -3;
    opacity: .55;
    pointer-events: none;
  }
  .ec-sparks {
    position: absolute;
    inset: -2px;
    border-radius: 26px;
    background: conic-gradient(
      from var(--ea),
      transparent 15%, #22c55e 18%, transparent 21%,
      transparent 45%, #4ade80 48%, transparent 51%,
      transparent 75%, #22c55e 77%, transparent 80%
    );
    animation: ea-rot-rev 1.5s linear infinite;
    will-change: --ea;
    z-index: -2;
    opacity: .8;
    pointer-events: none;
  }
`

function ElectricBorder({ children }) {
  return (
    <div className="ec-wrap">
      <div className="ec-glow" />
      <div className="ec-sparks" />
      {children}
    </div>
  )
}

export function TvDashboardView({
  config,
  loadError,
  redFlash,
  totalClientes,
  clientesMes,
  clientesAno,
  metaMensal,
  metaAnual,
  progressoMensal,
  progressoAnual,
  mesAtual,
  anoAtual,
  CelebrationCanvas,
}) {
  return (
    <>
      <style>{`
        html, body, #root {
          background: #030f07 !important;
          margin: 0; padding: 0;
          width: 100%; min-height: 100%;
        }
        ${ELECTRIC_CSS}
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
          backgroundColor: 'transparent',
        }}
      >
        <header className="flex items-center justify-between gap-4 px-8 pt-8 md:px-14 md:pt-10">
          <div className="w-32 md:w-48" />
          <p
            className="text-center text-lg font-black uppercase tracking-[0.4em] md:text-2xl"
            style={{ color: '#4ade80', textShadow: '0 0 20px rgba(74,222,128,0.5)' }}
          >
            Teks Software
          </p>
          <div className="w-32 md:w-48" />
        </header>

        <section className="flex flex-1 flex-col items-center justify-between px-4 py-4 md:py-6" style={{ minHeight: 0 }}>
          {config.url_logo && (
            <img
              src={config.url_logo}
              alt="Logo"
              className="w-auto object-contain"
              style={{ height: 'clamp(120px, 16vw, 220px)', maxWidth: '75%' }}
            />
          )}
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
          <div className="flex flex-col items-center">
            <div
              className="mb-3 h-px w-32"
              style={{ background: 'linear-gradient(90deg, transparent, #4ade80, transparent)' }}
            />
            <LiveClock />
          </div>
        </section>

        <div className="grid items-stretch gap-4 px-4 pb-6 md:grid-cols-3 md:gap-5 md:px-10 md:pb-8 lg:px-14 lg:pb-10">
          <ElectricBorder>
            <GoalCard
              title={`Meta Mensal — ${mesAtual}`}
              novos={clientesMes}
              meta={metaMensal}
              progress={progressoMensal}
              gradient={['#4ade80', '#22c55e']}
              glowColor="#4ade80"
            />
          </ElectricBorder>
          <ElectricBorder>
            <GoalCard
              title={`Meta Anual — ${anoAtual}`}
              novos={clientesAno}
              meta={metaAnual}
              progress={progressoAnual}
              gradient={['#4ade80', '#22c55e']}
              glowColor="#4ade80"
            />
          </ElectricBorder>
          <ElectricBorder>
            <ClientesAnoCard
              ano={anoAtual}
              valor={clientesAno}
              glowColor="#4ade80"
            />
          </ElectricBorder>
        </div>

        {loadError && (
          <div className="px-6 pb-6 text-center text-xs text-green-400/50 md:px-14">{loadError}</div>
        )}
      </main>
    </>
  )
}