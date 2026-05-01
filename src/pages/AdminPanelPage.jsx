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


const FONT_OPTIONS = [
  { label: 'Inter (Padrão)', value: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif' },
  { label: 'Roboto',         value: 'Roboto, Arial, sans-serif' },
  { label: 'Montserrat',     value: 'Montserrat, Arial, sans-serif' },
  { label: 'Merriweather',   value: 'Merriweather, Georgia, serif' },
  { label: 'Fira Mono',      value: 'Fira Mono, Consolas, monospace' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toNum(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function clamp(value) {
  return Math.max(0, value)
}


// ─── Subcomponente: Campo de input com label estilizado ────────────────────

function Field({ label, hint, children }) {
  return (
    <label className="admin-field">
      <span className="admin-field__label">{label}</span>
      {children}
      {hint && <p className="admin-field__hint">{hint}</p>}
    </label>
  )
}

// ─── Subcomponente: Card de seção ──────────────────────────────────────────

function SectionCard({ title, icon, children }) {
  return (
    <div className="admin-card">
      <div className="admin-card__header">
        <span className="admin-card__icon">{icon}</span>
        <h2 className="admin-card__title">{title}</h2>
      </div>
      <div className="admin-card__body">{children}</div>
    </div>
  )
}


// ─── Componente ───────────────────────────────────────────────────────────────

export function AdminPanelPage() {
  const navigate = useNavigate()

  const [config, setConfig] = useState({ ...DEFAULT_DASHBOARD_CONFIG, id: '' })
  const savedRef = useRef({ contagem_atual: 0, clientes_mes: 0, clientes_ano: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')


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


  // ── Salvar seção de números ────────────────────────────────────────────────

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


  // ── Salvar seção visual ────────────────────────────────────────────────────

  async function handleSaveVisual(e) {
    e.preventDefault()
    await persist({
      cor_fundo:       config.cor_fundo,
      cor_texto:       config.cor_texto,
      familia_fonte:   config.familia_fonte,
      url_logo:        config.url_logo.trim(),
      url_logo_login:  (config.url_logo_login ?? '').trim(),
    })
  }


  // ── +1 / -1 ───────────────────────────────────────────────────────────────

  async function adjustCount(delta) {
    const prev = savedRef.current
    await persist({
      contagem_atual: clamp(prev.contagem_atual + delta),
      clientes_mes:   clamp(prev.clientes_mes   + delta),
      clientes_ano:   clamp(prev.clientes_ano   + delta),
    })
  }


  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <>
        <style>{CSS}</style>
        <main className="admin-loading">
          <div className="admin-loading__spinner" />
          <span>Carregando configurações...</span>
        </main>
      </>
    )
  }


  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{CSS}</style>
      <main className="admin-root">

        {/* Ambient background blobs */}
        <div className="admin-bg">
          <div className="admin-bg__blob admin-bg__blob--1" />
          <div className="admin-bg__blob admin-bg__blob--2" />
          <div className="admin-bg__blob admin-bg__blob--3" />
        </div>

        <div className="admin-wrapper">

          {/* ── Header ───────────────────────────────────────────────────── */}
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

          {/* ── Alertas ───────────────────────────────────────────────────── */}
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

          {/* ── Seção de números ──────────────────────────────────────────── */}
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

              {/* Ações rápidas */}
              <div className="admin-actions">
                <div className="admin-actions__quick">
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
                  <span className="admin-actions__hint">+1 / -1 atualiza total, mês e ano juntos</span>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn--primary"
                >
                  {saving ? (
                    <>
                      <span className="btn__spinner" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      Salvar números
                    </>
                  )}
                </button>
              </div>

            </SectionCard>
          </form>


          {/* ── Seção visual ──────────────────────────────────────────────── */}
          <form onSubmit={handleSaveVisual} style={{ marginTop: '1.5rem' }}>
            <SectionCard title="Personalizar Visual da TV" icon="🎨">

              <div className="admin-grid admin-grid--2">
                <Field label="Cor de fundo">
                  <div className="admin-color-wrap">
                    <input
                      type="color"
                      value={config.cor_fundo}
                      onChange={(e) => updateField('cor_fundo', e.target.value)}
                      className="admin-color"
                    />
                    <span className="admin-color__hex">{config.cor_fundo}</span>
                  </div>
                </Field>

                <Field label="Cor do texto">
                  <div className="admin-color-wrap">
                    <input
                      type="color"
                      value={config.cor_texto}
                      onChange={(e) => updateField('cor_texto', e.target.value)}
                      className="admin-color"
                    />
                    <span className="admin-color__hex">{config.cor_texto}</span>
                  </div>
                </Field>
              </div>

              <div className="admin-grid admin-grid--2" style={{ marginTop: '1.25rem' }}>
                <Field label="Fonte">
                  <select
                    value={config.familia_fonte}
                    onChange={(e) => updateField('familia_fonte', e.target.value)}
                    className="admin-select"
                  >
                    {FONT_OPTIONS.map((font) => (
                      <option key={font.value} value={font.value}>
                        {font.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div style={{ marginTop: '1.25rem' }}>
                <Field
                  label="URL da logo (TV)"
                  hint='Use PNG com fundo transparente. Recomendamos o Imgur: faça upload, clique direito → "Copiar endereço da imagem". A logo aparece entre "TEKS SOFTWARE" e o contador.'
                >
                  <input
                    type="url"
                    placeholder="https://i.imgur.com/sua-logo.png"
                    value={config.url_logo}
                    onChange={(e) => updateField('url_logo', e.target.value)}
                    className="admin-input admin-input--mono"
                  />
                </Field>

                {config.url_logo && (
                  <div className="admin-logo-preview">
                    <img
                      src={config.url_logo}
                      alt="Preview"
                      className="admin-logo-preview__img"
                      style={{ background: 'repeating-conic-gradient(#262626 0% 25%, #171717 0% 50%) 0 0 / 12px 12px' }}
                    />
                    <span className="admin-logo-preview__label">Preview — fundo xadrez = transparente ✓</span>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '1.25rem' }}>
                <Field
                  label="URL da logo (Login)"
                  hint="Aparece acima do formulário de login. PNG com fundo transparente recomendado."
                >
                  <input
                    type="url"
                    placeholder="https://i.imgur.com/sua-logo-login.png"
                    value={config.url_logo_login ?? ''}
                    onChange={(e) => updateField('url_logo_login', e.target.value)}
                    className="admin-input admin-input--mono"
                  />
                </Field>

                {config.url_logo_login && (
                  <div className="admin-logo-preview">
                    <img
                      src={config.url_logo_login}
                      alt="Preview login"
                      className="admin-logo-preview__img"
                      style={{ background: 'repeating-conic-gradient(#262626 0% 25%, #171717 0% 50%) 0 0 / 12px 12px' }}
                    />
                    <span className="admin-logo-preview__label">Preview — fundo xadrez = transparente ✓</span>
                  </div>
                )}
              </div>

              <div className="admin-actions" style={{ borderTop: '1px solid rgba(52,211,153,0.1)', marginTop: '1.5rem', paddingTop: '1.25rem' }}>
                <div />
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn--primary"
                >
                  {saving ? (
                    <>
                      <span className="btn__spinner" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      Salvar visual da TV
                    </>
                  )}
                </button>
              </div>

            </SectionCard>
          </form>

        </div>
      </main>
    </>
  )
}


// ─── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  /* ── Reset / Base ─────────────────────────────────────────── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── Root ─────────────────────────────────────────────────── */
  .admin-root {
    position: relative;
    min-height: 100vh;
    background: #080c10;
    font-family: 'DM Sans', system-ui, sans-serif;
    color: #e2ece6;
    overflow-x: hidden;
  }

  /* ── Ambient background ───────────────────────────────────── */
  .admin-bg {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
  }
  .admin-bg__blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(120px);
    opacity: 0.18;
  }
  .admin-bg__blob--1 {
    width: 600px; height: 600px;
    background: #10b981;
    top: -200px; left: -100px;
    animation: blobDrift 18s ease-in-out infinite alternate;
  }
  .admin-bg__blob--2 {
    width: 400px; height: 400px;
    background: #059669;
    bottom: -100px; right: -50px;
    animation: blobDrift 22s ease-in-out infinite alternate-reverse;
  }
  .admin-bg__blob--3 {
    width: 300px; height: 300px;
    background: #34d399;
    top: 40%; left: 50%;
    transform: translate(-50%, -50%);
    opacity: 0.08;
    animation: blobDrift 30s ease-in-out infinite alternate;
  }
  @keyframes blobDrift {
    0%   { transform: translate(0, 0) scale(1); }
    100% { transform: translate(40px, 30px) scale(1.1); }
  }

  /* ── Wrapper ──────────────────────────────────────────────── */
  .admin-wrapper {
    position: relative;
    z-index: 1;
    max-width: 860px;
    margin: 0 auto;
    padding: 2.5rem 1.5rem 4rem;
  }
  @media (min-width: 768px) {
    .admin-wrapper { padding: 3.5rem 2rem 5rem; }
  }

  /* ── Header ───────────────────────────────────────────────── */
  .admin-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 2rem;
  }
  .admin-header__left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .admin-header__badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.05em;
    color: #000;
    box-shadow: 0 0 24px rgba(16,185,129,0.35);
    flex-shrink: 0;
  }
  .admin-header__title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #f0faf5;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }
  .admin-header__sub {
    font-size: 0.78rem;
    color: rgba(52,211,153,0.5);
    margin-top: 2px;
  }

  /* ── Alerts ───────────────────────────────────────────────── */
  .admin-alert {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    font-size: 0.84rem;
    font-weight: 500;
    margin-bottom: 1.25rem;
    animation: fadeSlideIn 0.25s ease;
  }
  .admin-alert--error {
    background: rgba(239,68,68,0.08);
    border: 1px solid rgba(239,68,68,0.25);
    color: #fca5a5;
  }
  .admin-alert--success {
    background: rgba(52,211,153,0.08);
    border: 1px solid rgba(52,211,153,0.25);
    color: #6ee7b7;
  }
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Card ─────────────────────────────────────────────────── */
  .admin-card {
    border-radius: 20px;
    border: 1px solid rgba(52,211,153,0.12);
    background: rgba(10,18,14,0.7);
    backdrop-filter: blur(20px);
    overflow: hidden;
    box-shadow:
      0 1px 0 rgba(52,211,153,0.08) inset,
      0 20px 60px rgba(0,0,0,0.4);
    transition: border-color 0.3s;
  }
  .admin-card:hover {
    border-color: rgba(52,211,153,0.2);
  }
  .admin-card__header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid rgba(52,211,153,0.08);
    background: rgba(52,211,153,0.03);
  }
  .admin-card__icon {
    font-size: 1.1rem;
    line-height: 1;
  }
  .admin-card__title {
    font-size: 0.95rem;
    font-weight: 600;
    color: #a7f3d0;
    letter-spacing: 0.01em;
  }
  .admin-card__body {
    padding: 1.5rem;
  }

  /* ── Metrics strip ────────────────────────────────────────── */
  .admin-metrics {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    background: rgba(52,211,153,0.08);
    border-radius: 14px;
    overflow: hidden;
    margin-bottom: 1.75rem;
  }
  .admin-metric {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem 0.5rem;
    background: rgba(10,20,15,0.9);
    transition: background 0.2s;
  }
  .admin-metric:hover { background: rgba(52,211,153,0.06); }
  .admin-metric--accent { background: rgba(16,185,129,0.07); }
  .admin-metric--accent:hover { background: rgba(16,185,129,0.12); }
  .admin-metric__val {
    font-family: 'DM Mono', monospace;
    font-size: 1.6rem;
    font-weight: 500;
    color: #34d399;
    line-height: 1;
    letter-spacing: -0.03em;
  }
  .admin-metric--accent .admin-metric__val {
    color: #6ee7b7;
    text-shadow: 0 0 20px rgba(52,211,153,0.4);
  }
  .admin-metric__lbl {
    font-size: 0.7rem;
    color: rgba(52,211,153,0.4);
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  /* ── Grid ─────────────────────────────────────────────────── */
  .admin-grid {
    display: grid;
    gap: 1.1rem;
  }
  .admin-grid--2 { grid-template-columns: repeat(1, 1fr); }
  .admin-grid--3 { grid-template-columns: repeat(1, 1fr); }
  @media (min-width: 560px) {
    .admin-grid--2 { grid-template-columns: repeat(2, 1fr); }
    .admin-grid--3 { grid-template-columns: repeat(2, 1fr); }
  }
  @media (min-width: 720px) {
    .admin-grid--3 { grid-template-columns: repeat(3, 1fr); }
  }

  /* ── Field ────────────────────────────────────────────────── */
  .admin-field {
    display: block;
    cursor: default;
  }
  .admin-field__label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(167,243,208,0.6);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 0.45rem;
  }
  .admin-field__hint {
    margin-top: 0.4rem;
    font-size: 0.7rem;
    color: rgba(52,211,153,0.35);
    line-height: 1.5;
  }

  /* ── Input ────────────────────────────────────────────────── */
  .admin-input {
    width: 100%;
    padding: 0.6rem 0.9rem;
    background: rgba(0,0,0,0.35);
    border: 1px solid rgba(52,211,153,0.15);
    border-radius: 10px;
    color: #ecfdf5;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    appearance: textfield;
    -moz-appearance: textfield;
  }
  .admin-input::-webkit-inner-spin-button,
  .admin-input::-webkit-outer-spin-button { -webkit-appearance: none; }
  .admin-input:focus {
    border-color: rgba(52,211,153,0.5);
    box-shadow: 0 0 0 3px rgba(52,211,153,0.08);
    background: rgba(0,0,0,0.5);
  }
  .admin-input--mono { font-family: 'DM Mono', monospace; font-size: 0.8rem; }

  /* ── Select ───────────────────────────────────────────────── */
  .admin-select {
    width: 100%;
    padding: 0.6rem 0.9rem;
    background: rgba(0,0,0,0.35);
    border: 1px solid rgba(52,211,153,0.15);
    border-radius: 10px;
    color: #ecfdf5;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    outline: none;
    cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2334d399' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    padding-right: 2.2rem;
  }
  .admin-select:focus {
    border-color: rgba(52,211,153,0.5);
    box-shadow: 0 0 0 3px rgba(52,211,153,0.08);
  }
  .admin-select option { background: #0d1f17; }

  /* ── Color picker ─────────────────────────────────────────── */
  .admin-color-wrap {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.4rem 0.7rem;
    background: rgba(0,0,0,0.35);
    border: 1px solid rgba(52,211,153,0.15);
    border-radius: 10px;
    transition: border-color 0.2s;
  }
  .admin-color-wrap:focus-within {
    border-color: rgba(52,211,153,0.5);
    box-shadow: 0 0 0 3px rgba(52,211,153,0.08);
  }
  .admin-color {
    width: 36px;
    height: 36px;
    border: none;
    outline: none;
    border-radius: 8px;
    cursor: pointer;
    padding: 2px;
    background: transparent;
    flex-shrink: 0;
  }
  .admin-color__hex {
    font-family: 'DM Mono', monospace;
    font-size: 0.8rem;
    color: rgba(167,243,208,0.7);
    letter-spacing: 0.05em;
  }

  /* ── Logo preview ─────────────────────────────────────────── */
  .admin-logo-preview {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0.75rem;
    padding: 0.6rem 0.75rem;
    background: rgba(0,0,0,0.3);
    border-radius: 10px;
    border: 1px solid rgba(52,211,153,0.1);
  }
  .admin-logo-preview__img {
    height: 40px;
    width: auto;
    max-width: 120px;
    object-fit: contain;
    border-radius: 6px;
  }
  .admin-logo-preview__label {
    font-size: 0.7rem;
    color: rgba(52,211,153,0.4);
  }

  /* ── Actions row ──────────────────────────────────────────── */
  .admin-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-top: 1.5rem;
    padding-top: 1.25rem;
    border-top: 1px solid rgba(52,211,153,0.08);
  }
  .admin-actions__quick {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.6rem;
  }
  .admin-actions__hint {
    font-size: 0.7rem;
    color: rgba(52,211,153,0.3);
  }

  /* ── Buttons ──────────────────────────────────────────────── */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.55rem 1.1rem;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.84rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
    outline: none;
    transition: all 0.2s;
    white-space: nowrap;
  }
  .btn:disabled { opacity: 0.45; cursor: not-allowed; }

  .btn--ghost {
    background: rgba(52,211,153,0.06);
    border: 1px solid rgba(52,211,153,0.18);
    color: #6ee7b7;
  }
  .btn--ghost:hover:not(:disabled) {
    background: rgba(52,211,153,0.12);
    border-color: rgba(52,211,153,0.3);
    box-shadow: 0 0 16px rgba(52,211,153,0.12);
  }

  .btn--add {
    background: rgba(52,211,153,0.1);
    border: 1px solid rgba(52,211,153,0.25);
    color: #34d399;
  }
  .btn--add:hover:not(:disabled) {
    background: rgba(52,211,153,0.18);
    box-shadow: 0 0 20px rgba(52,211,153,0.2);
  }

  .btn--remove {
    background: rgba(239,68,68,0.07);
    border: 1px solid rgba(239,68,68,0.2);
    color: #f87171;
  }
  .btn--remove:hover:not(:disabled) {
    background: rgba(239,68,68,0.14);
    box-shadow: 0 0 20px rgba(239,68,68,0.15);
  }

  .btn--primary {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: #000;
    padding: 0.55rem 1.4rem;
    box-shadow: 0 4px 20px rgba(16,185,129,0.25);
  }
  .btn--primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
    box-shadow: 0 4px 28px rgba(52,211,153,0.35);
    transform: translateY(-1px);
  }
  .btn--primary:active:not(:disabled) {
    transform: translateY(0);
  }

  /* ── Button spinner ───────────────────────────────────────── */
  .btn__spinner {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid rgba(0,0,0,0.3);
    border-top-color: #000;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Loading screen ───────────────────────────────────────── */
  .admin-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    min-height: 100vh;
    background: #080c10;
    color: rgba(52,211,153,0.6);
    font-family: 'DM Mono', monospace;
    font-size: 0.85rem;
  }
  .admin-loading__spinner {
    width: 36px;
    height: 36px;
    border: 2px solid rgba(52,211,153,0.15);
    border-top-color: #34d399;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  /* ── Scrollbar ────────────────────────────────────────────── */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(52,211,153,0.2); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(52,211,153,0.35); }
`