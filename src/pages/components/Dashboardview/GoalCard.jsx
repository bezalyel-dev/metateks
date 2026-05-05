import { useId } from 'react'

export function GoalCard({ title, novos, meta, progress, gradient, glowColor }) {
  const gradId = useId().replace(/:/g, '')
  const circumference = 2 * Math.PI * 54
  const strokeDashoffset = circumference - (progress / 100) * circumference

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
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)' }}
            />
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor={gradient[0]} />
                <stop offset="100%" stopColor={gradient[1]} />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-2xl font-black leading-none"
              style={{
                color: gradient[0],
                textShadow: `0 0 14px ${gradient[0]}88`,
              }}
            >
              {progress}%
            </span>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold uppercase tracking-widest text-green-400/70">{title}</p>
          <p className="mt-2 text-4xl font-black leading-none text-white">
            {novos}
            <span className="ml-1 text-xl font-medium text-white/40">/ {meta}</span>
          </p>
          <p className="mt-1 text-sm text-white/50">novos clientes</p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${gradient[0]}, ${gradient[1]})`,
                boxShadow: `0 0 8px ${gradient[1]}88`,
                transition: 'width 1s cubic-bezier(.4,0,.2,1)',
              }}
            />
          </div>
        </div>
      </div>
    </article>
  )
}