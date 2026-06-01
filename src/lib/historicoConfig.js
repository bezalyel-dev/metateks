// ─── historicoConfig.js ───────────────────────────────────────────────────────
// Funções de CRUD para a tabela historico_clientes_mensal

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getAnoMesAtual() {
  const now = new Date()
  return { ano: now.getFullYear(), mes: now.getMonth() + 1 }
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

/**
 * Busca todos os registros do histórico para um determinado ano.
 * Retorna array ordenado por mês (1–12).
 */
export async function fetchHistoricoAno(client, ano) {
  const { data, error } = await client
    .from('historico_clientes_mensal')
    .select('*')
    .eq('ano', ano)
    .order('mes', { ascending: true })

  if (error) throw error
  return data ?? []
}

// ─── Upsert ───────────────────────────────────────────────────────────────────

/**
 * Upsert de um registro mensal.
 * patch: { entradas?, saidas? }
 * Usa onConflict na chave única (ano, mes).
 */
export async function upsertHistoricoMes(client, ano, mes, patch) {
  const { data, error } = await client
    .from('historico_clientes_mensal')
    .upsert(
      { ano, mes, ...patch },
      { onConflict: 'ano,mes', ignoreDuplicates: false }
    )
    .select('*')
    .single()

  if (error) throw error
  return data
}

// ─── Incrementos atômicos via RPC ─────────────────────────────────────────────

/**
 * Incrementa entradas de um mês específico em +1.
 * Chamado quando admin clica em "+1 Cliente".
 */
export async function incrementEntradas(client, ano, mes) {
  await client
    .from('historico_clientes_mensal')
    .upsert({ ano, mes, entradas: 0, saidas: 0 }, { onConflict: 'ano,mes', ignoreDuplicates: true })

  const { error } = await client.rpc('incrementar_entradas_historico', { p_ano: ano, p_mes: mes })

  if (error) {
    const { data: current } = await client
      .from('historico_clientes_mensal')
      .select('entradas')
      .eq('ano', ano)
      .eq('mes', mes)
      .single()

    await upsertHistoricoMes(client, ano, mes, {
      entradas: (current?.entradas ?? 0) + 1,
    })
  }
}

/**
 * Incrementa saidas de um mês específico em +1.
 * Chamado quando admin clica em "-1 Cliente".
 */
export async function incrementSaidas(client, ano, mes) {
  await client
    .from('historico_clientes_mensal')
    .upsert({ ano, mes, entradas: 0, saidas: 0 }, { onConflict: 'ano,mes', ignoreDuplicates: true })

  const { error } = await client.rpc('incrementar_saidas_historico', { p_ano: ano, p_mes: mes })

  if (error) {
    const { data: current } = await client
      .from('historico_clientes_mensal')
      .select('saidas')
      .eq('ano', ano)
      .eq('mes', mes)
      .single()

    await upsertHistoricoMes(client, ano, mes, {
      saidas: (current?.saidas ?? 0) + 1,
    })
  }
}

// ─── Nomes dos meses ──────────────────────────────────────────────────────────

export const NOMES_MESES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

export const NOMES_MESES_COMPLETOS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]