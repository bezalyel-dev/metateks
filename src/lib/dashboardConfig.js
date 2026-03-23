export const DEFAULT_DASHBOARD_CONFIG = {
  contagem_atual: 500,
  meta_mensal: 20,
  meta_anual: 240,
  cor_fundo: '#020b35',
  cor_texto: '#f8fafc',
  familia_fonte: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  url_logo: '',
}

function normalizeConfig(row) {
  if (!row) {
    return null
  }

  return {
    id: row.id,
    contagem_atual: row.contagem_atual ?? DEFAULT_DASHBOARD_CONFIG.contagem_atual,
    meta_mensal: row.meta_mensal ?? DEFAULT_DASHBOARD_CONFIG.meta_mensal,
    meta_anual: row.meta_anual ?? DEFAULT_DASHBOARD_CONFIG.meta_anual,
    cor_fundo: row.cor_fundo ?? DEFAULT_DASHBOARD_CONFIG.cor_fundo,
    cor_texto: row.cor_texto ?? DEFAULT_DASHBOARD_CONFIG.cor_texto,
    familia_fonte: row.familia_fonte ?? DEFAULT_DASHBOARD_CONFIG.familia_fonte,
    url_logo: row.url_logo ?? DEFAULT_DASHBOARD_CONFIG.url_logo,
  }
}

export async function fetchDashboardConfig(client) {
  const { data, error } = await client
    .from('configuracoes_dashboard')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  return normalizeConfig(data)
}

export async function ensureDashboardConfig(client) {
  const current = await fetchDashboardConfig(client)
  if (current) {
    return current
  }

  const { data, error } = await client
    .from('configuracoes_dashboard')
    .insert(DEFAULT_DASHBOARD_CONFIG)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return normalizeConfig(data)
}

export async function updateDashboardConfig(client, id, payload) {
  const { data, error } = await client
    .from('configuracoes_dashboard')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return normalizeConfig(data)
}
