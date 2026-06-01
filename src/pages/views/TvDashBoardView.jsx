import { FullscreenButton } from '../../components/ui/FullscreenButton'
import { LiveClock } from '../../components/ui/LiveClock'
import { AnimatedBackground } from '../../components/dashboard/AnimatedBackground'
import { RedFlashOverlay } from '../../components/dashboard/Overlays'
import { AnimatedClientsCount } from '../../components/dashboard/AnimatedClientsCount'
import { GoalCard } from '../../components/dashboard/GoalCard'
import { ClientesAnoCard } from '../../components/dashboard/ClientesAnoCard'
import { ClientesHistoricoChart } from '../../components/dashboard/ClientesHistoricoChart'
import './TvDashboardView.css'

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
  historico = [],
}) {
  const mesAtualNum = new Date().getMonth() + 1

  return (
    <>
      <style>{`
        html, body, #root {
          background: #030f07 !important;
          margin: 0; padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden !important;
        }
      `}</style>

      <AnimatedBackground />
      <CelebrationCanvas />
      <RedFlashOverlay active={redFlash} />
      <FullscreenButton position="top-right" hideAfter={4000} />

      <main
        className="tv-main relative z-10"
        style={{ '--tv-font': config.familia_fonte || "'DM Sans', system-ui, sans-serif" }}
      >
 {/* ── Header ── */}
        <header style={{
          flexShrink: 0,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {config.url_logo ? (
            <img src={config.url_logo} alt="Logo" className="w-auto object-contain"
              style={{ height: 'clamp(28px, 4vw, 56px)', maxWidth: '140px', flexShrink: 0 }} />
          ) : <div style={{ width: 'clamp(80px, 12vw, 160px)' }} />}

          <p className="text-center font-black uppercase" style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#4ade80',
            textShadow: '0 0 20px rgba(74,222,128,0.5)',
            fontSize: 'clamp(11px, 1.2vw, 18px)',
            letterSpacing: '0.4em',
            margin: 0,
            whiteSpace: 'nowrap',
          }}>
            Teks Software
          </p>

          <div style={{ width: 'clamp(80px, 12vw, 160px)' }} />
        </header>

{/* ── Contador + Clock ── */}
        <div className="tv-counter-block" style={{ flex: 1, justifyContent: 'center' }}>
          <p style={{
            fontSize: 'clamp(10px, 1vw, 16px)',
            fontWeight: 600,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'rgba(74,222,128,0.6)',
            margin: 0,
            textAlign: 'center',
          }}>
            total de clientes
          </p>
          <h1 style={{
            fontSize: 'clamp(80px, 14vw, 220px)',
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: '-0.03em',
            color: '#ffffff',
            textAlign: 'center',
            textShadow: '0 0 60px rgba(74,222,128,0.35), 0 0 120px rgba(34,197,94,0.2)',
            margin: 0,
          }}>
            <AnimatedClientsCount value={totalClientes} />
          </h1>
          <div style={{
            height: 1,
            width: 'clamp(50px, 6vw, 100px)',
            background: 'linear-gradient(90deg, transparent, #4ade80, transparent)',
            margin: 'clamp(4px, 0.6vh, 10px) 0',
          }} />
          <LiveClock />
        </div>

        {/* ── 3 Cards ── */}
        <div className="tv-cards-row">
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
        {/* ── Gráfico ── */}
        <div className="tv-chart-block">
          <ClientesHistoricoChart
            historico={historico}
            mesAtual={mesAtualNum}
          />
        </div>

        {loadError && (
          <div style={{
            flexShrink: 0,
            textAlign: 'center',
            fontSize: 'clamp(9px, 0.65vw, 11px)',
            color: 'rgba(74,222,128,0.5)',
          }}>
            {loadError}
          </div>
        )}
      </main>
    </>
  )
}