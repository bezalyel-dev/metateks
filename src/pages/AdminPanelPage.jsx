import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DEFAULT_DASHBOARD_CONFIG,
  ensureDashboardConfig,
  updateDashboardConfig,
} from '../lib/dashboardConfig'
import { supabase, supabaseEnvError } from '../lib/supabaseClient'

const FONT_OPTIONS = [
  { label: 'Inter (Padrão)', value: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif' },
  { label: 'Roboto', value: 'Roboto, Arial, sans-serif' },
  { label: 'Montserrat', value: 'Montserrat, Arial, sans-serif' },
  { label: 'Merriweather', value: 'Merriweather, Georgia, serif' },
  { label: 'Fira Mono', value: 'Fira Mono, Consolas, monospace' },
]

export function AdminPanelPage() {
  const navigate = useNavigate()
  const [config, setConfig] = useState({ ...DEFAULT_DASHBOARD_CONFIG, id: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      setError(supabaseEnvError)
      return
    }

    const load = async () => {
      try {
        const row = await ensureDashboardConfig(supabase)
        setConfig(row)
        setError('')
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  async function handleLogout() {
    if (!supabase) {
      navigate('/admin/login')
      return
    }

    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  function updateLocalField(field, value) {
    setFeedback('')
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  async function saveConfig(nextValues) {
    if (!supabase || !config.id) {
      return
    }

    setSaving(true)
    setError('')
    setFeedback('')

    try {
      const updated = await updateDashboardConfig(supabase, config.id, nextValues)
      setConfig(updated)
      setFeedback('Alteracoes salvas com sucesso.')
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveAll(event) {
    event.preventDefault()

    await saveConfig({
      contagem_atual: Number(config.contagem_atual) || 0,
      meta_mensal: Number(config.meta_mensal) || 0,
      meta_anual: Number(config.meta_anual) || 0,
      cor_fundo: config.cor_fundo,
      cor_texto: config.cor_texto,
      familia_fonte: config.familia_fonte,
      url_logo: config.url_logo.trim(),
    })
  }

  async function adjustCount(delta) {
    const nextValue = Math.max(0, Number(config.contagem_atual) + delta)
    await saveConfig({ contagem_atual: nextValue })
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700">
        Carregando configuracoes...
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-5xl rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-slate-900">Painel do Administrador</h1>
          <button
            onClick={handleLogout}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Sair
          </button>
        </div>

        <p className="mt-3 text-slate-600">Atualize os números e personalize a tela da TV.</p>

        {error ? (
          <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {error}
          </p>
        ) : null}

        {feedback ? (
          <p className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {feedback}
          </p>
        ) : null}

        <form onSubmit={handleSaveAll} className="mt-8 space-y-8">
          <section className="rounded-2xl border border-slate-200 p-5 md:p-6">
            <h2 className="text-lg font-semibold text-slate-900">Atualizar Números</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Total de clientes</span>
                <input
                  type="number"
                  min="0"
                  value={config.contagem_atual}
                  onChange={(event) => updateLocalField('contagem_atual', event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-blue-500 focus:ring-2"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Meta mensal</span>
                <input
                  type="number"
                  min="0"
                  value={config.meta_mensal}
                  onChange={(event) => updateLocalField('meta_mensal', event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-blue-500 focus:ring-2"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Meta anual</span>
                <input
                  type="number"
                  min="0"
                  value={config.meta_anual}
                  onChange={(event) => updateLocalField('meta_anual', event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-blue-500 focus:ring-2"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => adjustCount(1)}
                disabled={saving}
                className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
              >
                +1 Cliente
              </button>
              <button
                type="button"
                onClick={() => adjustCount(-1)}
                disabled={saving}
                className="rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white transition hover:bg-rose-500 disabled:opacity-60"
              >
                -1 Cliente
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {saving ? 'Salvando...' : 'Salvar números'}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 p-5 md:p-6">
            <h2 className="text-lg font-semibold text-slate-900">Personalizar Visual da TV</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Cor de fundo</span>
                <input
                  type="color"
                  value={config.cor_fundo}
                  onChange={(event) => updateLocalField('cor_fundo', event.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-2 py-1"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Cor do texto</span>
                <input
                  type="color"
                  value={config.cor_texto}
                  onChange={(event) => updateLocalField('cor_texto', event.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-2 py-1"
                />
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Fonte</span>
                <select
                  value={config.familia_fonte}
                  onChange={(event) => updateLocalField('familia_fonte', event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-blue-500 focus:ring-2"
                >
                  {FONT_OPTIONS.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">URL da logo</span>
                <input
                  type="url"
                  placeholder="https://..."
                  value={config.url_logo}
                  onChange={(event) => updateLocalField('url_logo', event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-blue-500 focus:ring-2"
                />
              </label>
            </div>

            <div className="mt-4">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
              >
                {saving ? 'Salvando visual...' : 'Salvar visual da TV'}
              </button>
            </div>
          </section>
        </form>
      </div>
    </main>
  )
}
