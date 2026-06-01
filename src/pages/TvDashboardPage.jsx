import { useEffect, useRef, useState } from 'react'
import { DEFAULT_DASHBOARD_CONFIG, fetchDashboardConfig } from '../lib/dashboardConfig'
import { supabase, supabaseEnvError } from '../lib/supabaseClient'
import { useCelebration } from '../hooks/useCelebration'
import { useSomCliente } from '../hooks/Usesomcliente'
import { TvDashboardView } from './views/TvDashBoardView'
import { fetchHistoricoAno } from '../lib/historicoConfig'

function toSafeInt(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

export function TvDashboardPage() {
  const [config, setConfig]     = useState(DEFAULT_DASHBOARD_CONFIG)
  const [loadError, setLoadError] = useState('')
  const [historico, setHistorico] = useState([])
  const prevTotalRef = useRef(null)
  const { triggerCelebration, CelebrationCanvas } = useCelebration()

  const { playSom } = useSomCliente({
    urlSom:     config.url_som_cliente ?? '',
    volume:     0.8,
    habilitado: true,
  })

  const [redFlash, setRedFlash] = useState(false)
  const redFlashTimerRef = useRef(null)

  // ── Busca e sincroniza config em tempo real ────────────────────────────────

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
          setConfig((current) => {
            const currentTimestamp = current?.updated_at ? Date.parse(current.updated_at) : 0
            const nextTimestamp    = row?.updated_at     ? Date.parse(row.updated_at)     : 0
            if (nextTimestamp < currentTimestamp) return current
            return row
          })
          setLoadError('')
        }
      } catch (err) {
        if (isActive) setLoadError(err.message)
      }
    }

    const loadHistorico = async () => {
      try {
        const ano = new Date().getFullYear()
        const rows = await fetchHistoricoAno(supabase, ano)
        if (isActive) setHistorico(rows)
      } catch (_) {}
    }

    refreshConfig()
    loadHistorico()

    const realtimeChannel = supabase
      .channel('dashboard-config-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'configuracoes_dashboard' }, refreshConfig)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'historico_clientes_mensal' }, loadHistorico)
      .subscribe()

    return () => {
      isActive = false
      supabase.removeChannel(realtimeChannel)
    }
  }, [])

  // ── Derivações ─────────────────────────────────────────────────────────────

  const totalClientes   = Math.max(0, toSafeInt(config.contagem_atual, 0))
  const clientesMes     = Math.max(0, toSafeInt(config.clientes_mes,   0))
  const clientesAno     = Math.max(0, toSafeInt(config.clientes_ano,   0))
  const metaMensal      = Math.max(0, toSafeInt(config.meta_mensal,    0))
  const metaAnual       = Math.max(0, toSafeInt(config.meta_anual,     0))

  const progressoMensal = metaMensal > 0 ? Math.min(100, Math.round((clientesMes / metaMensal) * 100)) : 0
  const progressoAnual  = metaAnual  > 0 ? Math.min(100, Math.round((clientesAno / metaAnual)  * 100)) : 0

  // ── Detecta adição ou remoção de cliente ───────────────────────────────────

  useEffect(() => {
    if (prevTotalRef.current === null) {
      prevTotalRef.current = totalClientes
      return
    }

    if (totalClientes > prevTotalRef.current) {
      triggerCelebration()
      playSom()
    } else if (totalClientes < prevTotalRef.current) {
      clearTimeout(redFlashTimerRef.current)
      setRedFlash(true)
      redFlashTimerRef.current = setTimeout(() => setRedFlash(false), 80)
    }

    prevTotalRef.current = totalClientes
  }, [totalClientes, triggerCelebration, playSom])

  const mesAtual = new Date().toLocaleDateString('pt-BR', { month: 'long' })
  const anoAtual = new Date().getFullYear()

  return (
    <TvDashboardView
      config={config}
      loadError={loadError}
      redFlash={redFlash}
      totalClientes={totalClientes}
      clientesMes={clientesMes}
      clientesAno={clientesAno}
      metaMensal={metaMensal}
      metaAnual={metaAnual}
      progressoMensal={progressoMensal}
      progressoAnual={progressoAnual}
      mesAtual={mesAtual}
      anoAtual={anoAtual}
      CelebrationCanvas={CelebrationCanvas}
      historico={historico}
    />
  )
}