import { useNavigate } from 'react-router-dom'
import { supabase, supabaseEnvError } from '../lib/supabaseClient'

export function AdminPanelPage() {
  const navigate = useNavigate()

  async function handleLogout() {
    if (!supabase) {
      navigate('/admin/login')
      return
    }

    await supabase.auth.signOut()
    navigate('/admin/login')
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

        <p className="mt-3 text-slate-600">
          Estrutura inicial criada. Na proxima etapa vamos conectar os campos ao Supabase e
          implementar os updates em tempo real.
        </p>

        {supabaseEnvError ? (
          <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {supabaseEnvError}
          </p>
        ) : null}
      </div>
    </main>
  )
}
