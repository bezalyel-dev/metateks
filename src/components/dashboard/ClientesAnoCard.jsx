export function ClientesAnoCard({ ano, valor, glowColor }) {
  return (
    <article
      className="relative overflow-hidden rounded-3xl p-6 md:p-7"
      style={{
        position: 'relative',
        zIndex: 1,
        minHeight: '160px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: 'rgba(3, 20, 10, 0.82)',
        backdropFilter: 'blur(18px)',
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-20 blur-3xl"
        style={{ background: glowColor }}
      />
      <div className="flex h-full flex-col items-center justify-center gap-3 py-2 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-green-400/70">
          Clientes em {ano}
        </p>
        <p
          className="font-black leading-none tabular-nums"
          style={{
            fontSize: 'clamp(48px, 5vw, 72px)',
            color: '#ffffff',
            textShadow: `0 0 40px ${glowColor}99, 0 0 80px ${glowColor}44`,
            letterSpacing: '-0.02em',
          }}
        >
          {valor}
        </p>
        <p className="text-sm font-medium text-white/40">novos clientes</p>
      </div>
    </article>
  )
}