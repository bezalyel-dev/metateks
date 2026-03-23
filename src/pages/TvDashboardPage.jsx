import { useEffect, useState } from 'react'
import { DEFAULT_DASHBOARD_CONFIG, fetchDashboardConfig } from '../lib/dashboardConfig'
import { supabase, supabaseEnvError } from '../lib/supabaseClient'

const BASE_CLIENTES = 500

function toSafeInt(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

function AnimatedClientsCount({ value }) {
  const [displayValue, setDisplayValue] = useState(value)
  const [previousValue, setPreviousValue] = useState(value)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (value === displayValue) {
      return
    }

    setPreviousValue(displayValue)
    setDisplayValue(value)
    setAnimating(true)

    const timeoutId = setTimeout(() => setAnimating(false), 480)
    return () => clearTimeout(timeoutId)
  }, [value, displayValue])

  return (
    <span className="relative inline-block min-h-[1.2em] min-w-[4ch] align-middle">
      {animating ? (
        <span className="pointer-events-none absolute inset-0 animate-[fadeSlideOut_480ms_ease_forwards]">
          {previousValue}
        </span>
      ) : null}
      <span className={animating ? 'inline-block animate-[fadeSlideIn_480ms_ease]' : 'inline-block'}>
        {displayValue}
      </span>
    </span>
  )
}

export function TvDashboardPage() {
  const [config, setConfig] = useState(DEFAULT_DASHBOARD_CONFIG)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (!supabase) {
      setLoadError(supabaseEnvError)
      return
    }

    let isActive = true

    const refreshConfig = async () => {
      try {
        const row = await fetchDashboardConfig(supabase)
        if (row && isActive) {
          setConfig(row)
          setLoadError('')
        }
      } catch (error) {
        if (isActive) {
          setLoadError(error.message)
        }
      }
    }

    refreshConfig()

    const realtimeChannel = supabase
      .channel('dashboard-config-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'configuracoes_dashboard' },
        () => {
          refreshConfig()
        },
      )
      .subscribe()

    const intervalId = setInterval(refreshConfig, 5000)

    return () => {
      isActive = false
      clearInterval(intervalId)
      supabase.removeChannel(realtimeChannel)
    }
  }, [])

  const totalClientes = Math.max(0, toSafeInt(config.contagem_atual, BASE_CLIENTES))
  const metaMensal = Math.max(0, toSafeInt(config.meta_mensal, 0))
  const metaAnual = Math.max(0, toSafeInt(config.meta_anual, 0))
  const novosClientes = Math.max(0, totalClientes - BASE_CLIENTES)
  const progressoMensal = metaMensal > 0 ? Math.min(100, Math.round((novosClientes / metaMensal) * 100)) : 0
  const progressoAnual = metaAnual > 0 ? Math.min(100, Math.round((novosClientes / metaAnual) * 100)) : 0

  const mesAtual = new Date().toLocaleDateString('pt-BR', {
    month: 'long',
  })
  const anoAtual = new Date().getFullYear()

  return (
    <main
      className="flex min-h-screen flex-col overflow-hidden"
      style={{
        backgroundColor: config.cor_fundo,
        color: config.cor_texto,
        fontFamily: config.familia_fonte,
      }}
    >
      <header className="px-8 pt-8 md:px-14 md:pt-10">
        {config.url_logo ? (
          <img
            src={config.url_logo}
            alt="Logo Teks Software"
            className="mx-auto max-h-16 w-auto object-contain md:max-h-20"
          />
        ) : (
          <p className="text-center text-lg font-semibold uppercase tracking-[0.35em] opacity-80 md:text-2xl">
            Teks Software
          </p>
        )}
      </header>

      <section className="flex flex-1 items-center justify-center px-4">
        <h1 className="text-center text-[72px] font-extrabold leading-none tracking-tight drop-shadow-[0_0_35px_rgba(255,255,255,0.18)] sm:text-[98px] md:text-[132px] lg:text-[170px]">
          <AnimatedClientsCount value={totalClientes} /> Clientes
        </h1>
      </section>

      <div className="grid gap-6 px-6 pb-8 md:grid-cols-2 md:gap-8 md:px-14 md:pb-10">
        <article className="rounded-2xl border border-white/15 bg-black/20 p-5 backdrop-blur-sm md:p-6">
          <p className="text-base font-semibold capitalize md:text-xl">Meta Mensal - {mesAtual}</p>
          <p className="mt-1 text-xl font-extrabold text-white md:text-3xl">
            Novos: {novosClientes} / {metaMensal}
          </p>

          <div className="mt-3 h-4 w-full overflow-hidden rounded-full bg-black/30 md:h-5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all duration-700"
              style={{ width: `${progressoMensal}%` }}
            />
          </div>

          <p className="mt-2 text-right text-sm font-semibold text-white md:text-base">
            Progresso: {progressoMensal}%
          </p>
        </article>

        <article className="rounded-2xl border border-white/15 bg-black/20 p-5 backdrop-blur-sm md:p-6">
          <p className="text-base font-semibold md:text-xl">Meta Anual - {anoAtual}</p>
          <p className="mt-1 text-xl font-extrabold text-white md:text-3xl">
            Novos: {novosClientes} / {metaAnual}
          </p>

          <div className="mt-3 h-4 w-full overflow-hidden rounded-full bg-black/30 md:h-5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-700"
              style={{ width: `${progressoAnual}%` }}
            />
          </div>

          <p className="mt-2 text-right text-sm font-semibold text-white md:text-base">
            Progresso: {progressoAnual}%
          </p>
        </article>
      </div>

      {loadError ? (
        <div className="px-6 pb-6 text-center text-xs opacity-75 md:px-14">{loadError}</div>
      ) : null}

      <div className="px-6 pb-4 text-center text-xs text-white/60 md:px-14">
        Debug: total={totalClientes} | novos={novosClientes} | mensal={metaMensal} | anual={metaAnual}
      </div>
    </main>
  )
}
