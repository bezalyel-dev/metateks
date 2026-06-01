import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DEFAULT_DASHBOARD_CONFIG,
  applyAutoReset,
  ensureDashboardConfig,
  getMesReferencia,
  getAnoReferencia,
  updateDashboardConfig,
} from '../lib/dashboardConfig'
import { supabase, supabaseEnvError } from '../lib/supabaseClient'
import { incrementEntradas, incrementSaidas, fetchHistoricoAno, NOMES_MESES_COMPLETOS } from '../lib/historicoConfig'

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function toNum(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function clamp(value) {
  return Math.max(0, value)
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAdminPanel() {
  const navigate = useNavigate()

  const [config, setConfig] = useState({ ...DEFAULT_DASHBOARD_CONFIG, id: '' })
  const savedRef = useRef({ contagem_atual: 0, clientes_mes: 0, clientes_ano: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const [historico, setHistorico] = useState([])

  // ── Mês selecionado para +1/-1 (padrão = mês atual) ──────────────────────
  const mesAtualNum = new Date().getMonth() + 1
  const anoAtualNum = new Date().getFullYear()
  const [mesSelecionado, setMesSelecionado] = useState(mesAtualNum)

  // ── Carga inicial + auto-reset ────────────────────────────────────────────

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      setError(supabaseEnvError)
      return
    }

    const load = async () => {
      try {
        let row = await ensureDashboardConfig(supabase)
        row = await applyAutoReset(supabase, row)
        setConfig(row)
        savedRef.current = {
          contagem_atual: toNum(row.contagem_atual),
          clientes_mes:   toNum(row.clientes_mes),
          clientes_ano:   toNum(row.clientes_ano),
        }
        setError('')
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    load()

    const loadHistorico = async () => {
      try {
        const ano = new Date().getFullYear()
        const rows = await fetchHistoricoAno(supabase, ano)
        setHistorico(rows)
      } catch (_) {}
    }

    loadHistorico()

    const realtimeChannel = supabase
      .channel('admin-historico-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'historico_clientes_mensal' }, loadHistorico)
      .subscribe()

    return () => {
      supabase.removeChannel(realtimeChannel)
    }
  }, [])

  // ── Auth ──────────────────────────────────────────────────────────────────

  async function handleLogout() {
    if (!supabase) { navigate('/admin/login'); return }
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  // ── Edição local ──────────────────────────────────────────────────────────

  function updateField(field, value) {
    setFeedback('')
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  // ── Persistência ──────────────────────────────────────────────────────────

  async function persist(patch) {
    if (!supabase || !config.id) return

    setSaving(true)
    setError('')
    setFeedback('')

    try {
      const updated = await updateDashboardConfig(supabase, config.id, patch)
      setConfig(updated)
      savedRef.current = {
        contagem_atual: toNum(updated.contagem_atual),
        clientes_mes:   toNum(updated.clientes_mes),
        clientes_ano:   toNum(updated.clientes_ano),
      }
      setFeedback('Alterações salvas com sucesso.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Salvar seção de números ───────────────────────────────────────────────

  async function handleSaveNumeros(e) {
    e.preventDefault()

    const prev = savedRef.current

    const novoMes   = clamp(toNum(config.clientes_mes))
    const novoAno   = clamp(toNum(config.clientes_ano))
    const novoTotal = clamp(toNum(config.contagem_atual))

    const deltaMes   = novoMes   - prev.clientes_mes
    const deltaAno   = novoAno   - prev.clientes_ano
    const deltaTotal = novoTotal - prev.contagem_atual

    let finalTotal, finalMes, finalAno

    if (deltaMes !== 0) {
      finalMes   = novoMes
      finalAno   = clamp(prev.clientes_ano   + deltaMes)
      finalTotal = clamp(prev.contagem_atual + deltaMes)
    } else if (deltaAno !== 0) {
      finalAno   = novoAno
      finalMes   = prev.clientes_mes
      finalTotal = clamp(prev.contagem_atual + deltaAno)
    } else if (deltaTotal !== 0) {
      finalTotal = novoTotal
      finalMes   = prev.clientes_mes
      finalAno   = prev.clientes_ano
    } else {
      finalTotal = prev.contagem_atual
      finalMes   = prev.clientes_mes
      finalAno   = prev.clientes_ano
    }

    await persist({
      contagem_atual: finalTotal,
      clientes_mes:   finalMes,
      clientes_ano:   finalAno,
      meta_mensal:    clamp(toNum(config.meta_mensal)),
      meta_anual:     clamp(toNum(config.meta_anual)),
      mes_referencia: getMesReferencia(),
      ano_referencia: getAnoReferencia(),
    })
  }

  // ── Salvar seção visual ───────────────────────────────────────────────────

  async function handleSaveVisual(e) {
    e.preventDefault()
    await persist({
      cor_fundo:       config.cor_fundo,
      cor_texto:       config.cor_texto,
      familia_fonte:   config.familia_fonte,
      url_logo:        config.url_logo.trim(),
      url_logo_login:  (config.url_logo_login ?? '').trim(),
      url_som_cliente: (config.url_som_cliente ?? '').trim(),
    })
  }

  // ── +1 / -1 ───────────────────────────────────────────────────────────────

  async function adjustCount(delta) {
    const prev = savedRef.current
    const eMesAtual = mesSelecionado === mesAtualNum

    let patch

    if (delta > 0) {
      patch = {
        contagem_atual: clamp(prev.contagem_atual + 1),
        clientes_ano:   clamp(prev.clientes_ano   + 1),
        clientes_mes:   eMesAtual
          ? clamp(prev.clientes_mes + 1)
          : prev.clientes_mes,
      }
    } else {
      patch = {
        contagem_atual: clamp(prev.contagem_atual - 1),
        clientes_ano:   clamp(prev.clientes_ano   - 1),
        clientes_mes:   prev.clientes_mes,
      }
    }

    await persist(patch)

    try {
      if (delta > 0) {
        await incrementEntradas(supabase, anoAtualNum, mesSelecionado)
      } else {
        await incrementSaidas(supabase, anoAtualNum, mesSelecionado)
      }
    } catch (err) {
      console.warn('Histórico: erro ao incrementar —', err.message)
    }
  }

  return {
    // estado
    config,
    loading,
    saving,
    feedback,
    error,
    historico,
    mesSelecionado,
    mesAtualNum,
    // setters
    setMesSelecionado,
    updateField,
    // handlers
    handleLogout,
    handleSaveNumeros,
    handleSaveVisual,
    adjustCount,
    // dados auxiliares
    supabase,
    NOMES_MESES_COMPLETOS,
  }
}