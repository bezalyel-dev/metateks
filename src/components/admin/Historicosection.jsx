// ─── HistoricoSection.jsx ─────────────────────────────────────────────────────
// Seção do AdminPanel para visualizar e editar o histórico mensal de clientes.

import { useEffect, useRef, useState } from 'react'
import { NOMES_MESES_COMPLETOS } from '../../lib/historicoConfig'
import './HistoricoSection.css'

function toNum(v, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export function HistoricoSection({ supabase, clientesMesAtual }) {
  const now = new Date()
  const anoAtual = now.getFullYear()
  const mesAtual = now.getMonth() + 1 // 1–12

  const [historico, setHistorico] = useState([])
  const [localValues, setLocalValues] = useState(() => {
    const initial = {}
    for (let m = 1; m <= 12; m++) {
      initial[m] = { entradas: 0, saidas: 0 }
    }
    return initial
  })
  const [savingMes, setSavingMes] = useState(null)
  const [loadError, setLoadError] = useState('')

  // Evita que o useEffect de sync rode antes da carga inicial terminar,
  // o que causava o campo "entradas" do mês atual ser zerado na 1ª abertura.
  const carregadoRef = useRef(false)

  // ── Carga inicial ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!supabase) return

    carregadoRef.current = false

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('historico_clientes_mensal')
          .select('*')
          .eq('ano', anoAtual)
          .order('mes', { ascending: true })

        if (error) throw error

        const rows = data ?? []
        setHistorico(rows)

        const initial = {}
        for (let m = 1; m <= 12; m++) {
          const row = rows.find((r) => r.mes === m)
          initial[m] = {
            // Mês atual sem row no banco: usa clientesMesAtual do pai (valor real)
            entradas: row?.entradas ?? (m === mesAtual ? clientesMesAtual : 0),
            saidas:   row?.saidas   ?? 0,
          }
        }
        setLocalValues(initial)
      } catch (err) {
        setLoadError(err.message)
      } finally {
        // Só libera o sync depois que localValues foi populado corretamente
        carregadoRef.current = true
      }
    }

    load()
  // clientesMesAtual fora das deps: valor capturado no momento da carga é
  // suficiente para o estado inicial. Mudanças posteriores vão pelo efeito abaixo.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, anoAtual, mesAtual])

  // ── Sincroniza "entradas" do mês atual quando +1 / -1 é acionado ──────────
  // Guard: só atualiza após a carga inicial ter terminado, senão pisoteia
  // o valor que veio do banco (ou do clientesMesAtual capturado no mount).

  useEffect(() => {
    if (!carregadoRef.current) return
    setLocalValues((prev) => ({
      ...prev,
      [mesAtual]: {
        ...prev[mesAtual],
        entradas: clientesMesAtual,
      },
    }))
  }, [clientesMesAtual, mesAtual])

  // ── Edição local ──────────────────────────────────────────────────────────

  function handleChange(mes, field, value) {
    setLocalValues((prev) => ({
      ...prev,
      [mes]: { ...prev[mes], [field]: value },
    }))
  }

  // ── Salvar mês individual ──────────────────────────────────────────────────

  async function handleSaveMes(mes) {
    if (!supabase) return
    setSavingMes(mes)
    try {
      const vals     = localValues[mes] ?? { entradas: 0, saidas: 0 }
      const entradas = Math.max(0, toNum(vals.entradas))
      const saidas   = Math.max(0, toNum(vals.saidas))

      const { data, error } = await supabase
        .from('historico_clientes_mensal')
        .upsert(
          { ano: anoAtual, mes, entradas, saidas },
          { onConflict: 'ano,mes', ignoreDuplicates: false }
        )
        .select('*')
        .single()

      if (error) throw error

      setHistorico((prev) => {
        const exists = prev.find((r) => r.mes === mes)
        if (exists) return prev.map((r) => (r.mes === mes ? data : r))
        return [...prev, data].sort((a, b) => a.mes - b.mes)
      })

      setLocalValues((prev) => ({
        ...prev,
        [mes]: { entradas: data.entradas, saidas: data.saidas },
      }))
    } catch (err) {
      console.error('Erro ao salvar histórico:', err.message)
    } finally {
      setSavingMes(null)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const mesesVisiveis = Array.from({ length: 12 }, (_, i) => i + 1)

  return (
    <div className="hist-section">
      <div className="admin-card">
        <div className="admin-card__header">
          <span className="admin-card__icon">📅</span>
          <h2 className="admin-card__title">Histórico Mensal — {anoAtual}</h2>
        </div>
        <div className="admin-card__body">
          {loadError && (
            <p style={{ color: '#fca5a5', fontSize: '0.8rem', marginBottom: '1rem' }}>
              Erro ao carregar histórico: {loadError}
            </p>
          )}

          <div className="hist-grid">
            {mesesVisiveis.map((mes) => {
              const isAtual  = mes === mesAtual
              const vals     = localValues[mes] ?? { entradas: 0, saidas: 0 }
              const entradas = vals.entradas ?? 0
              const saidas   = vals.saidas   ?? 0
              const isSaving = savingMes === mes

              return (
                <div key={mes} className={`hist-mes${isAtual ? ' hist-mes--atual' : ''}`}>
                  <div className="hist-mes__header">
                    <span className="hist-mes__nome">{NOMES_MESES_COMPLETOS[mes - 1]}</span>
                    {isAtual && <span className="hist-mes__badge">Atual</span>}
                  </div>

                  <div className="hist-mes__fields">
                    <label>
                      <span className="hist-field__label">↑ Entradas</span>
                      <input
                        type="number"
                        min="0"
                        value={entradas}
                        onChange={(e) => handleChange(mes, 'entradas', e.target.value)}
                        disabled={isSaving}
                        className="hist-input"
                      />
                    </label>
                    <label>
                      <span className="hist-field__label hist-field__label--saidas">↓ Saídas</span>
                      <input
                        type="number"
                        min="0"
                        value={saidas}
                        onChange={(e) => handleChange(mes, 'saidas', e.target.value)}
                        disabled={isSaving}
                        className="hist-input hist-input--saidas"
                      />
                    </label>
                  </div>

                  <div className="hist-mes__footer">
                    <button
                      type="button"
                      onClick={() => handleSaveMes(mes)}
                      disabled={isSaving}
                      className={`btn--hist-save${isSaving ? ' btn--hist-save--saving' : ''}`}
                    >
                      {isSaving ? (
                        <>
                          <span
                            className="btn__spinner"
                            style={{
                              borderColor: 'rgba(52,211,153,0.3)',
                              borderTopColor: '#34d399',
                              width: 10,
                              height: 10,
                            }}
                          />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          Salvar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <p className="hist-hint">
            Meses passados: edite e salve livremente — apenas o gráfico é afetado.<br />
            Mês atual: alimentado automaticamente pelo +1 / -1.
          </p>
        </div>
      </div>
    </div>
  )
}