import '../components/admin/AdminPanel.css'
import { useAdminPanel, toNum } from '../hooks/useAdminPanel'
import { Field, SectionCard } from '../components/admin/AdminPanelComponents'
import { HistoricoSection } from '../components/admin/HistoricoSection'

const FONT_OPTIONS = [
  { label: 'Inter (Padrão)', value: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif' },
  { label: 'Roboto',         value: 'Roboto, Arial, sans-serif' },
  { label: 'Montserrat',     value: 'Montserrat, Arial, sans-serif' },
  { label: 'Merriweather',   value: 'Merriweather, Georgia, serif' },
  { label: 'Fira Mono',      value: 'Fira Mono, Consolas, monospace' },
]

export function AdminPanelPage() {
  const {
    config,
    loading,
    saving,
    feedback,
    error,
    historico,
    mesSelecionado,
    mesAtualNum,
    setMesSelecionado,
    updateField,
    handleLogout,
    handleSaveNumeros,
    handleSaveVisual,
    adjustCount,
    supabase,
    NOMES_MESES_COMPLETOS,
  } = useAdminPanel()

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="admin-loading">
        <div className="admin-loading__spinner" />
        <span>Carregando configurações...</span>
      </main>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="admin-root">

      {/* Ambient background blobs */}
      <div className="admin-bg">
        <div className="admin-bg__blob admin-bg__blob--1" />
        <div className="admin-bg__blob admin-bg__blob--2" />
        <div className="admin-bg__blob admin-bg__blob--3" />
      </div>

      <div className="admin-wrapper">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <header className="admin-header">
          <div className="admin-header__left">
            <div className="admin-header__badge">ADM</div>
            <div>
              <h1 className="admin-header__title">Painel do Administrador</h1>
              <p className="admin-header__sub">Atualize números e personalize a tela da TV</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn--ghost">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sair
          </button>
        </header>

        {/* ── Alertas ────────────────────────────────────────────────── */}
        {error && (
          <div className="admin-alert admin-alert--error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            {error}
          </div>
        )}
        {feedback && (
          <div className="admin-alert admin-alert--success">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            {feedback}
          </div>
        )}

        {/* ── Seção de números ───────────────────────────────────────── */}
        <form onSubmit={handleSaveNumeros}>
          <SectionCard title="Atualizar Números" icon="📊">

            {/* Métricas rápidas (read-only visual) */}
            <div className="admin-metrics">
              <div className="admin-metric">
                <span className="admin-metric__val">{toNum(config.contagem_atual)}</span>
                <span className="admin-metric__lbl">Total</span>
              </div>
              <div className="admin-metric admin-metric--accent">
                <span className="admin-metric__val">{toNum(config.clientes_mes)}</span>
                <span className="admin-metric__lbl">Este mês</span>
              </div>
              <div className="admin-metric">
                <span className="admin-metric__val">{toNum(config.clientes_ano)}</span>
                <span className="admin-metric__lbl">Este ano</span>
              </div>
            </div>

            <div className="admin-grid admin-grid--3">
              <Field
                label="Total de clientes"
                hint="Ponto de partida — não altera mês/ano. Use +1/-1 para novos clientes."
              >
                <input
                  type="number"
                  min="0"
                  value={config.contagem_atual}
                  onChange={(e) => updateField('contagem_atual', e.target.value)}
                  className="admin-input"
                />
              </Field>

              <Field label="Clientes no mês" hint="Alterar propaga o delta para total e ano.">
                <input
                  type="number"
                  min="0"
                  value={config.clientes_mes}
                  onChange={(e) => updateField('clientes_mes', e.target.value)}
                  className="admin-input"
                />
              </Field>

              <Field label="Clientes no ano" hint="Alterar propaga o delta para o total.">
                <input
                  type="number"
                  min="0"
                  value={config.clientes_ano}
                  onChange={(e) => updateField('clientes_ano', e.target.value)}
                  className="admin-input"
                />
              </Field>

              <Field label="Meta mensal">
                <input
                  type="number"
                  min="0"
                  value={config.meta_mensal}
                  onChange={(e) => updateField('meta_mensal', e.target.value)}
                  className="admin-input"
                />
              </Field>

              <Field label="Meta anual">
                <input
                  type="number"
                  min="0"
                  value={config.meta_anual}
                  onChange={(e) => updateField('meta_anual', e.target.value)}
                  className="admin-input"
                />
              </Field>
            </div>

            {/* ── Ações rápidas ── */}
            <div className="admin-actions">
              <div className="admin-actions__quick">

                {/* Seletor de mês para o histórico */}
                <div className="admin-mes-selector">
                  <label className="admin-mes-selector__label">
                    Mês do histórico
                  </label>
                  <select
                    value={mesSelecionado}
                    onChange={(e) => setMesSelecionado(Number(e.target.value))}
                    className="admin-select admin-select--compact"
                    disabled={saving}
                  >
                    {NOMES_MESES_COMPLETOS.map((nome, i) => (
                      <option key={i + 1} value={i + 1}>
                        {nome}{i + 1 === mesAtualNum ? ' (atual)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => adjustCount(1)}
                  disabled={saving}
                  className="btn btn--add"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  +1 Cliente
                </button>
                <button
                  type="button"
                  onClick={() => adjustCount(-1)}
                  disabled={saving}
                  className="btn btn--remove"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  -1 Cliente
                </button>

                <span className="admin-actions__hint">
                  +1 sobe total, mês atual e ano · -1 desce total e ano (mês não muda)
                </span>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn btn--primary"
              >
                {saving ? (
                  <><span className="btn__spinner" />Salvando...</>
                ) : (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Salvar números</>
                )}
              </button>
            </div>

          </SectionCard>
        </form>

        {/* ── Som de Novo Cliente ─────────────────────────────────────── */}
        <form style={{ marginTop: '1.5rem' }} onSubmit={handleSaveVisual}>
          <SectionCard title="Som de Novo Cliente" icon="🔊">
            <Field
              label="URL do som"
              hint='Cole a URL direta de um arquivo MP3/WAV/OGG. Ex: Dropbox, GitHub raw, Freesound.'
            >
              <input
                type="url"
                placeholder="https://exemplo.com/som-cliente.mp3"
                value={config.url_som_cliente ?? ''}
                onChange={(e) => updateField('url_som_cliente', e.target.value)}
                className="admin-input admin-input--mono"
              />
            </Field>
            <div className="admin-actions">
              <span />
              <button type="submit" disabled={saving} className="btn btn--primary">
                {saving ? <><span className="btn__spinner" /> Salvando...</> : <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Salvar som
                </>}
              </button>
            </div>
          </SectionCard>
        </form>

        {/* ── Personalizar Visual ─────────────────────────────────────── */}
        <form onSubmit={handleSaveVisual} style={{ marginTop: '1.5rem' }}>
          <SectionCard title="Personalizar Visual da TV" icon="🎨">

            <div className="admin-grid admin-grid--2">
              <Field label="Cor de fundo">
                <div className="admin-color-wrap">
                  <input type="color" value={config.cor_fundo} onChange={(e) => updateField('cor_fundo', e.target.value)} className="admin-color" />
                  <span className="admin-color__hex">{config.cor_fundo}</span>
                </div>
              </Field>
              <Field label="Cor do texto">
                <div className="admin-color-wrap">
                  <input type="color" value={config.cor_texto} onChange={(e) => updateField('cor_texto', e.target.value)} className="admin-color" />
                  <span className="admin-color__hex">{config.cor_texto}</span>
                </div>
              </Field>
            </div>

            <div className="admin-grid admin-grid--2" style={{ marginTop: '1.25rem' }}>
              <Field label="Fonte">
                <select value={config.familia_fonte} onChange={(e) => updateField('familia_fonte', e.target.value)} className="admin-select">
                  {FONT_OPTIONS.map((font) => (
                    <option key={font.value} value={font.value}>{font.label}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <Field label="URL da logo (TV)" hint='Use PNG com fundo transparente. Recomendamos o Imgur.'>
                <input type="url" placeholder="https://i.imgur.com/sua-logo.png" value={config.url_logo} onChange={(e) => updateField('url_logo', e.target.value)} className="admin-input admin-input--mono" />
              </Field>
              {config.url_logo && (
                <div className="admin-logo-preview">
                  <img src={config.url_logo} alt="Preview" className="admin-logo-preview__img" style={{ background: 'repeating-conic-gradient(#262626 0% 25%, #171717 0% 50%) 0 0 / 12px 12px' }} />
                  <span className="admin-logo-preview__label">Preview — fundo xadrez = transparente ✓</span>
                </div>
              )}
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <Field label="URL da logo (Login)" hint="Aparece acima do formulário de login.">
                <input type="url" placeholder="https://i.imgur.com/sua-logo-login.png" value={config.url_logo_login ?? ''} onChange={(e) => updateField('url_logo_login', e.target.value)} className="admin-input admin-input--mono" />
              </Field>
              {config.url_logo_login && (
                <div className="admin-logo-preview">
                  <img src={config.url_logo_login} alt="Preview login" className="admin-logo-preview__img" style={{ background: 'repeating-conic-gradient(#262626 0% 25%, #171717 0% 50%) 0 0 / 12px 12px' }} />
                  <span className="admin-logo-preview__label">Preview — fundo xadrez = transparente ✓</span>
                </div>
              )}
            </div>

            <div className="admin-actions" style={{ borderTop: '1px solid rgba(52,211,153,0.1)', marginTop: '1.5rem', paddingTop: '1.25rem' }}>
              <div />
              <button type="submit" disabled={saving} className="btn btn--primary">
                {saving ? <><span className="btn__spinner" />Salvando...</> : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Salvar visual da TV</>}
              </button>
            </div>

          </SectionCard>
        </form>

        {/* ── Histórico mensal ────────────────────────────────────────── */}
        <HistoricoSection
          supabase={supabase}
          clientesMesAtual={toNum(config.clientes_mes)}
          historico={historico}
        />

      </div>
    </main>
  )
}