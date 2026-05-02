// ─── Defaults ────────────────────────────────────────────────────────────────
export const DEFAULT_DASHBOARD_CONFIG = {
  contagem_atual: 0,   // total acumulado de clientes (editável)
  clientes_mes:   0,   // clientes que entraram no mês corrente
  clientes_ano:   0,   // clientes que entraram no ano corrente
  meta_mensal:    0,   // meta de novos clientes no mês (definida pelo admin)
  meta_anual:     0,   // meta de novos clientes no ano (definida pelo admin)
  cor_fundo:      '#020b35',
  cor_texto:      '#f8fafc',
  familia_fonte:  'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  url_logo:         '',
  url_logo_login:   '',
  url_som_cliente:  '',  // URL direta de um arquivo MP3/WAV/OGG
  // Referências para detectar virada de mês/ano
  mes_referencia: '',  // formato 'YYYY-MM'
  ano_referencia: '',  // formato 'YYYY'
}

// ─── Helpers de data ──────────────────────────────────────────────────────────

export function getMesReferencia() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function getAnoReferencia() {
  return String(new Date().getFullYear())
}

// ─── Normalização ─────────────────────────────────────────────────────────────

function normalizeConfig(row) {
  if (!row) return null

  return {
    id:             row.id,
    contagem_atual: row.contagem_atual ?? DEFAULT_DASHBOARD_CONFIG.contagem_atual,
    clientes_mes:   row.clientes_mes   ?? DEFAULT_DASHBOARD_CONFIG.clientes_mes,
    clientes_ano:   row.clientes_ano   ?? DEFAULT_DASHBOARD_CONFIG.clientes_ano,
    meta_mensal:    row.meta_mensal    ?? DEFAULT_DASHBOARD_CONFIG.meta_mensal,
    meta_anual:     row.meta_anual     ?? DEFAULT_DASHBOARD_CONFIG.meta_anual,
    cor_fundo:      row.cor_fundo      ?? DEFAULT_DASHBOARD_CONFIG.cor_fundo,
    cor_texto:      row.cor_texto      ?? DEFAULT_DASHBOARD_CONFIG.cor_texto,
    familia_fonte:  row.familia_fonte  ?? DEFAULT_DASHBOARD_CONFIG.familia_fonte,
    url_logo:         row.url_logo         ?? DEFAULT_DASHBOARD_CONFIG.url_logo,
    url_logo_login:   row.url_logo_login   ?? DEFAULT_DASHBOARD_CONFIG.url_logo_login,
    url_som_cliente:  row.url_som_cliente  ?? DEFAULT_DASHBOARD_CONFIG.url_som_cliente,  // ← linha nova
    mes_referencia: row.mes_referencia ?? DEFAULT_DASHBOARD_CONFIG.mes_referencia,
    ano_referencia: row.ano_referencia ?? DEFAULT_DASHBOARD_CONFIG.ano_referencia,
    updated_at:     row.updated_at     ?? null,
  }
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function fetchDashboardConfig(client) {
  const { data, error } = await client
    .from('configuracoes_dashboard')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return normalizeConfig(data)
}

export async function ensureDashboardConfig(client) {
  const current = await fetchDashboardConfig(client)
  if (current) return current

  const { data, error } = await client
    .from('configuracoes_dashboard')
    .insert({
      ...DEFAULT_DASHBOARD_CONFIG,
      mes_referencia: getMesReferencia(),
      ano_referencia: getAnoReferencia(),
    })
    .select('*')
    .single()

  if (error) throw error
  return normalizeConfig(data)
}

export async function updateDashboardConfig(client, id, payload) {
  const { data, error } = await client
    .from('configuracoes_dashboard')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return normalizeConfig(data)
}

// ─── Reset automático ─────────────────────────────────────────────────────────
// Chamado pelo AdminPanel ao carregar. Detecta virada de mês/ano e zera os
// campos correspondentes no banco. Retorna o config atualizado (ou o mesmo
// se não houve reset).

export async function applyAutoReset(client, config) {
  const mesAtual = getMesReferencia()
  const anoAtual = getAnoReferencia()

  const viradaAno = config.ano_referencia && config.ano_referencia !== anoAtual
  const viradaMes = config.mes_referencia && config.mes_referencia !== mesAtual

  if (!viradaMes && !viradaAno) return config // nada a resetar

  const patch = { mes_referencia: mesAtual, ano_referencia: anoAtual }

  if (viradaAno) {
    // Ano novo: zera tudo (ano implica mês novo também)
    patch.clientes_ano = 0
    patch.clientes_mes = 0
  } else {
    // Apenas mês novo: zera só clientes_mes
    patch.clientes_mes = 0
  }

  return updateDashboardConfig(client, config.id, patch)
}